# 07 — Fraud Prevention

The platform handles real money and has three parties who could all potentially game the system. This document covers every fraud scenario and every defence layer.

---

## The Three Fraud Threats

### Threat 1: Referrer Fraud
Referrer submits fake leads using made-up consumer identities to earn unlock fees.

### Threat 2: Consumer Fraud
Consumer submits a real enquiry with no intention of ever hiring the tradie — just helping a referrer friend earn money.

### Threat 3: Business Fraud
Business disputes valid leads to avoid payment or get refunds they don't deserve.

---

## Defence Stack — 7 Layers

Build them in this order. Do not skip to later layers before earlier ones are solid.

---

### Layer 1 — Phone OTP Verification (BUILD FIRST — most important)

**What it stops:** Fake email-only submissions, bots, bulk fake leads.

**How it works:**
1. Consumer submits lead form
2. Before lead is created in DB, Twilio sends a 4-digit OTP to their mobile
3. Consumer must enter correct OTP within 10 minutes
4. Lead only created after OTP verified
5. OTP attempts capped at 3 — after 3 wrong attempts, a new OTP must be requested

**What this eliminates:**
- Bot submissions (bots don't have real SIM cards)
- Fake name + real phone combinations (consumer confirms their own number)
- ~80% of fake lead attempts

**Implementation:**
```python
# FastAPI: POST /leads
def create_lead(lead_data: LeadCreate):
    # Generate OTP
    otp = generate_4_digit_otp()
    
    # Store temporarily (NOT in leads table yet — in otp_pending table)
    store_pending_otp(
        phone=lead_data.consumer_phone,
        otp=otp,
        lead_data=lead_data,
        expires_at=now() + timedelta(minutes=10)
    )
    
    # Send via Twilio
    twilio.messages.create(
        to=lead_data.consumer_phone,
        from_=TWILIO_NUMBER,
        body=f"Your TradeRefer verification code is {otp}. Do not share this."
    )
    
    return {"otp_sent": True}

# FastAPI: POST /leads/{pending_id}/verify-otp
def verify_otp(pending_id: str, otp: str):
    pending = get_pending_otp(pending_id)
    if pending.otp != otp:
        increment_attempts(pending_id)
        raise HTTPException(400, "Invalid OTP")
    
    # Now create the actual lead
    lead = create_lead_in_db(pending.lead_data)
    return {"lead_id": lead.id}
```

**Cost:** $0.08 per SMS via Twilio. On a $3 lead: 2.7% overhead. Acceptable.

---

### Layer 2 — Duplicate Phone Check

**What it stops:** Same consumer submitting multiple times to the same business (to help a referrer).

**How it works:**
Database constraint: unique index on (consumer_phone, business_id) where status NOT IN ('EXPIRED').

If a duplicate is detected, return 409 with message:
"You've already submitted an enquiry to this business."

**Important:** This check happens BEFORE sending the OTP (save cost and avoid frustration).

---

### Layer 3 — IP Velocity Check

**What it stops:** One person with multiple SIMs submitting many leads from one location.

**How it works:**
- Log IP address on every lead submission attempt (before OTP)
- If same IP has submitted to 2 different businesses in the last 60 minutes → reject with message "Too many enquiries. Please try again later."
- Do not reveal the reason is IP-based (prevents circumvention)

**Note:** This may occasionally affect legitimate users on shared IPs (offices, cafes). Accept this tradeoff — false positives are rare and the protection is worth it.

---

### Layer 4 — Referrer Quality Score

**What it stops:** Referrers whose leads consistently fail (suggesting fake leads that businesses won't unlock).

**How it works:**
Every referrer has a `quality_score` (0–100, starts at 100).

Score decreases when:
- Their lead expires without being unlocked: -2 points
- Business disputes their lead (upheld): -10 points
- Velocity flag triggered: -5 points

Score increases when:
- Lead is unlocked: +1 point
- PIN confirmed: +3 points
- Score recovers 1 point per week automatically (decay toward 100)

**Thresholds:**
- Score < 70: Flag in admin panel for manual review
- Score < 50: Automatic payout hold — all earnings frozen pending review
- Score < 30: Account suspended, admin must manually reinstate

**Implementation:** Update score in background job after each lead event.

---

### Layer 5 — Device Fingerprinting

**What it stops:** Same person creating multiple referrer accounts or consumer accounts to game the system.

**How it works:**
Use FingerprintJS (free tier, client-side) to generate a device hash.
Store hash on lead submission and on referrer/business signup.

Flag in admin panel if:
- Same device hash appears on multiple referrer accounts
- Same device hash appears on both a referrer account AND consumer submissions for that referrer's leads

**Note:** Don't auto-block based on device hash — use it as an investigation signal only. VPNs and shared devices create false positives.

---

### Layer 6 — 7-Day Payout Hold

**What it stops:** Referrer earns money, immediately withdraws, then fraud is discovered with no recourse.

**How it works:**
- Every referrer_earning record has `available_at = created_at + 7 days`
- Earnings cannot be withdrawn until available_at has passed
- If PIN confirmed → available_at is set to NOW() (immediate release)
- If dispute raised within 7 days and upheld → earning reversed before it ever pays out

**This is your last line of defence.** It gives you time to catch fraud before money leaves.

---

### Layer 7 — Business Dispute Investigation

**What it stops:** Businesses claiming leads were fake to get refunds.

**How it works:**
Business clicks "Report Issue" on a lead.
Admin reviews with this checklist:

```
FRAUD INVESTIGATION CHECKLIST

1. Was OTP verified?
   → Always yes (can't submit without it). If somehow no: instant refund.

2. Did Twilio deliver the OTP SMS?
   → Check delivery_status in notifications table.
   → If "failed": possible invalid number. Lean toward refund.
   → If "delivered": consumer had a working phone. Lean toward deny.

3. Did the business actually view the lead after unlocking?
   → Check unlocked_at vs first_viewed_at timestamp.
   → If business unlocked but never opened: suspicious. May warrant refund.
   → If business opened within 10 minutes: they saw the lead. Deny refund.

4. How many disputes has this business raised in 30 days?
   → > 20% dispute rate: business is gaming. Deny all recent ones.

5. Does the consumer's phone appear in other platforms?
   → Can manually check with Twilio Lookup API.

6. Has this referrer had disputes from other businesses?
   → Check referrer quality score history.
```

**Valid refund grounds (accept these):**
- Twilio shows SMS delivery failed (invalid number)
- Same consumer phone submitted to same business twice (duplicate check bug)
- Clear evidence of referrer-business collusion

**Invalid refund grounds (always deny these):**
- Consumer didn't respond after contact
- Job too small
- Consumer went with someone else
- Business just doesn't like the lead

---

## The Three-Party Confirmation Logic

This is the heart of the trust system. Here is the complete truth table:

```
Business Confirms  |  Consumer Confirms  |  PIN Entered  |  Result
─────────────────────────────────────────────────────────────────────
✅ Yes (pin)       |  N/A                |  ✅ Correct   |  CONFIRMED — pay immediately
✅ Yes             |  N/A                |  ❌ Wrong×3   |  UNCONFIRMED — pay after 7 days
✅ Yes (on way)    |  N/A                |  ⌛ Expired   |  UNCONFIRMED — pay after 7 days
❌ No (ignored)    |  ❌ No              |  N/A          |  UNCONFIRMED — pay after 7 days
❌ No              |  ✅ "Yes I went"    |  N/A          |  FLAGGED → admin review
✅ On way sent     |  ✅ PIN confirmed   |  ✅ Match     |  CONFIRMED — pay immediately
```

**Consumer says YES but business says NO:**
This is a DISPUTE flag, not an automatic penalty.
Admin reviews the evidence (see Layer 7 above).
Referrer is still paid after 7-day hold regardless of outcome.
Business's trust_score is decremented if pattern emerges.

---

## What NOT to Do (Common Mistakes)

❌ **Don't make referrer payout contingent on consumer survey response.**
Most consumers won't respond. If you do this, 70% of legitimate referrers won't get paid.

❌ **Don't auto-penalise businesses based solely on consumer reports.**
Consumers can lie, misunderstand, or forget. Use it as a signal, not a verdict.

❌ **Don't add too many verification steps to the consumer form.**
Every extra step loses real leads. OTP is the only hard gate. Everything else is silent.

❌ **Don't over-engineer fraud prevention before you have real traffic.**
Build Layer 1 (OTP) and Layer 6 (hold period) first. Add the rest as real fraud patterns emerge.

---

## Estimated Fraud Rates

With all 7 layers active:
- Fake lead attempts: ~0.5% get through (down from industry average of 25%)
- Business disputes: ~5% of unlocked leads (vs 15-20% on unverified platforms)
- False positive rate (legitimate leads flagged): ~0.2%

The PIN system is the most powerful anti-fraud feature. Once it's live, fake lead attempts become nearly impossible because they require two coordinated people at the same physical location.
