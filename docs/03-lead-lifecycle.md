# 03 — Lead Lifecycle

Every lead in the system passes through defined states. This document is the source of truth for lead state logic.

---

## Lead States

A lead can only be in ONE state at a time. State transitions are one-directional.

```
PENDING       → The lead was created. Consumer OTP verified. Business notified.
                Business has 48 hours to unlock before it expires.

UNLOCKED      → Business paid the unlock fee. Full consumer details revealed.
                Referrer earning created (PENDING). Business has 72 hours to
                tap "on my way" before the lead sits indefinitely (no further
                expiry — they already paid).

ON_THE_WAY    → Business tapped "I'm On My Way". PIN generated and sent to
                consumer. Business has 4 hours to enter the PIN.

CONFIRMED     → Business entered correct PIN. Real-world connection proven.
                Referrer earning released immediately.

UNCONFIRMED   → PIN window expired (4 hours) OR PIN locked after 3 wrong attempts.
                OR business didn't tap "on my way" but lead sits unlocked.
                Referrer earning released after 7-day hold.

EXPIRED       → Business didn't unlock within 48 hours of lead creation.
                No charge. No payout. Lead removed from business inbox.

DISPUTED      → Business raised a dispute on an unlocked lead.
                Admin reviews. Referrer still paid after hold unless fraud proven.
```

---

## State Transition Rules

These are the ONLY valid transitions. Any other transition is a bug.

```
PENDING     → UNLOCKED       when: business pays unlock fee
PENDING     → EXPIRED        when: expires_at < NOW() and status = PENDING

UNLOCKED    → ON_THE_WAY     when: business taps "on my way"
UNLOCKED    → DISPUTED       when: business submits dispute

ON_THE_WAY  → CONFIRMED      when: correct PIN entered within 4 hours
ON_THE_WAY  → UNCONFIRMED    when: pin_expires_at < NOW() OR 3 wrong PIN attempts

CONFIRMED   → (terminal)     No further state changes
UNCONFIRMED → (terminal)     No further state changes  
EXPIRED     → (terminal)     No further state changes
DISPUTED    → (terminal after admin resolves)
```

---

## Timers and Deadlines

All stored as UTC timestamps in the leads table.

| Timer | Column | Duration | What happens when it expires |
|---|---|---|---|
| Lead expiry | `expires_at` | 48hrs from creation | status → EXPIRED |
| PIN expiry | `pin_expires_at` | 4hrs from on_the_way_at | status → UNCONFIRMED |
| Earning hold | `referrer_earnings.available_at` | 7 days from unlock | earning → AVAILABLE |

**Cron job frequency:**
- Expire leads: run every 15 minutes
- Release earnings: run every hour
- Expiry reminder email: run every hour (sends email when lead has 24hrs left)

---

## The Referrer Earning State Machine

Separate from lead status but linked.

```
PENDING    → Created when business unlocks lead. Hold for 7 days OR until PIN confirmed.

AVAILABLE  → After 7-day hold OR immediate on PIN confirm.
              Referrer can now withdraw this amount.

PAID       → Included in a payout batch. Money sent to referrer.

REVERSED   → Dispute upheld within 7-day window. Earning cancelled before payout.
              Only possible while status = PENDING.
```

---

## Duplicate Lead Logic

The same consumer (phone number) cannot submit two active leads to the same business.

```sql
-- This unique index enforces it at database level
CREATE UNIQUE INDEX idx_leads_phone_business ON leads(consumer_phone, business_id)
WHERE status NOT IN ('EXPIRED');
```

What this means:
- Consumer submits to Bob's Plumbing → lead PENDING → cannot submit again
- Lead expires → consumer CAN submit again (EXPIRED is excluded from index)
- Lead confirmed → consumer CANNOT submit again (CONFIRMED is not excluded)

**Why allow resubmit after expiry:** Business didn't unlock — maybe the timing was wrong. Consumer should be allowed to try again weeks later.

**Why NOT allow resubmit after confirmed:** They already met. A new lead would be fraud.

---

## PIN System Detail

### Generation
4-digit numeric string (e.g. "4829").
Generated server-side using `secrets.randbelow(9000) + 1000` in Python.
Stored in `lead_pins` table linked to the lead.

### Delivery
Sent simultaneously to both parties when "on my way" is triggered:
- Consumer: SMS + email
- Business: SMS + push notification (FCM)

### Validation
```python
def validate_pin(lead_id: str, entered_pin: str) -> bool:
    pin_record = get_lead_pin(lead_id)
    
    # Check not expired
    if pin_record.expires_at < datetime.now():
        raise HTTPException(400, "PIN has expired")
    
    # Check not already used
    if pin_record.is_used:
        raise HTTPException(400, "PIN already confirmed")
    
    # Increment attempt count
    increment_pin_attempts(pin_record.id)
    
    # Check max attempts
    if pin_record.attempts > 3:
        raise HTTPException(423, "Too many incorrect attempts")
    
    # Validate
    return pin_record.pin == entered_pin
```

### After correct PIN
1. `lead_pins.is_used = True`
2. `leads.status = CONFIRMED`
3. `leads.confirmed_at = NOW()`
4. `referrer_earnings.status = AVAILABLE`, `available_at = NOW()`
5. Update `businesses.connection_rate` and `total_confirmed`
6. Send confirmation SMS to consumer
7. Send confirmation push to business
8. Notify referrer (in-app + SMS if > $5 earning)

### After 3 wrong attempts
1. `leads.status = UNCONFIRMED`
2. `referrer_earnings.available_at` stays as original (7 days from unlock)
3. Business notified: "Too many incorrect PIN attempts. Your referrer will still be paid in 7 days."
4. Consumer notified: "No connection code entered. The referrer will still receive their reward."

---

## Lead Expiry Process

Run by background job every 15 minutes:

```python
def expire_leads():
    # Find all leads past expiry
    expired = supabase.table("leads")\
        .select("*")\
        .eq("status", "PENDING")\
        .lt("expires_at", datetime.utcnow().isoformat())\
        .execute()
    
    for lead in expired.data:
        # Update status
        supabase.table("leads")\
            .update({"status": "EXPIRED", "updated_at": now()})\
            .eq("id", lead["id"])\
            .execute()
        
        # Notify consumer
        sms_service.send(
            to=lead["consumer_phone"],
            template="SMS-007",
            data={"business_name": get_business_name(lead["business_id"])}
        )
        
        # Notify referrer (in-app)
        create_in_app_notification(
            referrer_id=get_referrer_id(lead["referral_link_id"]),
            message=f"Lead expired — business didn't unlock it.",
            lead_id=lead["id"]
        )
        
        # Update referrer quality score (-2 points per expired lead)
        update_referrer_quality_score(
            referrer_id=get_referrer_id(lead["referral_link_id"]),
            delta=-2
        )
```

---

## Business Trust Score

Tracks business reliability over time. Used for listing rank and fraud detection.

**Starts at:** 100

**Decreases when:**
- Lead expires without unlock: -1 (happens to everyone, minor)
- Business doesn't tap "on my way" within 48hrs of unlock: -3
- Dispute raised and denied: -5 (they gamed the system)
- Pattern of consumer "yes" + business "no": admin manually deducts

**Increases when:**
- PIN confirmed: +3
- Consumer confirms contact via post-visit survey (optional future feature): +1
- Account age: +1 per month (loyalty)

**Consequences of low score:**
- Score < 70: Drops in directory ranking
- Score < 50: Must preload wallet (no pay-as-you-go) — reduces chargeback risk
- Score < 30: Account suspended, admin review required
- Score = 0: Permanently banned

**Stored in:** `businesses.trust_score` (integer 0–100)
**Updated:** After each relevant event in background job or inline after PIN confirm
