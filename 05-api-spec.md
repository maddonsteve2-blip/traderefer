# 05 — API Specification

All routes are on the FastAPI backend hosted on Railway.
Base URL (production): `https://api.traderefer.com.au`
Base URL (local dev): `http://localhost:8000`

All protected routes require a Supabase JWT in the Authorization header:
`Authorization: Bearer <supabase_jwt_token>`

All amounts are in **cents** (integers). Never use floats for money.
All timestamps are **ISO 8601 UTC**.

---

## Auth

Supabase Auth handles signup/login. The frontend calls Supabase directly.
FastAPI validates the JWT on every protected request using the Supabase JWT secret.

```python
# FastAPI dependency — use on every protected route
async def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = verify_supabase_jwt(token)
    return payload  # contains user_id, role
```

---

## Public Routes (no auth required)

### GET `/businesses`
Browse the public directory.

**Query params:**
- `suburb` (string) — filter by suburb name
- `category` (string) — filter by trade category
- `q` (string) — full text search
- `page` (int, default 1)
- `limit` (int, default 20, max 50)

**Response 200:**
```json
{
  "businesses": [
    {
      "id": "uuid",
      "business_name": "Bob's Plumbing",
      "slug": "bobs-plumbing",
      "trade_category": "Plumber",
      "suburb": "Newtown",
      "state": "VIC",
      "description": "25 years experience...",
      "unlock_fee_cents": 800,
      "connection_rate": 87.5,
      "total_confirmed": 42,
      "logo_url": "https://...",
      "is_verified": true
    }
  ],
  "total": 156,
  "page": 1,
  "limit": 20
}
```

---

### GET `/businesses/{slug}`
Single business listing page data.

**Response 200:**
```json
{
  "id": "uuid",
  "business_name": "Bob's Plumbing",
  "slug": "bobs-plumbing",
  "trade_category": "Plumber",
  "description": "...",
  "suburb": "Newtown",
  "state": "VIC",
  "service_radius_km": 20,
  "business_phone": "0412000000",
  "website": "https://bobsplumbing.com.au",
  "unlock_fee_cents": 800,
  "connection_rate": 87.5,
  "total_confirmed": 42,
  "response_rating": 94.2,
  "logo_url": "https://...",
  "photo_urls": ["https://...", "https://..."],
  "is_verified": true
}
```

---

### GET `/r/{business_slug}/{link_code}`
Resolve a referral link. Called when consumer clicks referrer's link.
Increments click counter. Returns business data for the landing page.

**Response 200:**
```json
{
  "business": { ... },  // same shape as GET /businesses/{slug}
  "referral_link_id": "uuid",
  "referrer_name": "Jane"  // shown on landing page: "Jane thinks you'd love Bob's Plumbing"
}
```

**Response 404:** Link code not found or inactive.

---

### POST `/leads`
Consumer submits a lead enquiry. Step 1 of 2 (phone verification follows).

**Body:**
```json
{
  "referral_link_id": "uuid",
  "business_id": "uuid",
  "consumer_name": "Sarah Thompson",
  "consumer_phone": "0412345678",
  "consumer_email": "sarah@email.com",
  "consumer_suburb": "Newtown",
  "job_description": "Burst pipe in bathroom, urgent, water turned off"
}
```

**Server-side checks before creating lead:**
1. Does business exist and is active?
2. Does referral_link_id match business_id?
3. Is consumer_phone already used for this business (duplicate)?
4. IP velocity check (max 2 unique business leads per IP per hour)

**Response 200 (success — OTP sent):**
```json
{
  "lead_id": "uuid",
  "otp_sent": true,
  "message": "We sent a verification code to 0412 XXX XXX"
}
```

**Response 409 (duplicate):**
```json
{
  "error": "duplicate_lead",
  "message": "You've already submitted an enquiry to this business"
}
```

---

### POST `/leads/{lead_id}/verify-otp`
Consumer enters the OTP sent to their phone.

**Body:**
```json
{
  "otp": "4829"
}
```

**Response 200:**
```json
{
  "verified": true,
  "message": "Enquiry confirmed! Bob's Plumbing will be in touch soon."
}
```

**Response 400:**
```json
{
  "error": "invalid_otp",
  "message": "Incorrect code. Please try again.",
  "attempts_remaining": 2
}
```

**After verification:**
- Lead status → `PENDING`
- Business notified via email
- Referrer notified in-app

---

## Business Routes (auth required, role: business)

### GET `/business/profile`
Get own business profile.

**Response 200:** Full business object including wallet_balance_cents, trust_score.

---

### PUT `/business/profile`
Update business profile.

**Body (all optional):**
```json
{
  "description": "Updated description",
  "unlock_fee_cents": 1000,
  "service_radius_km": 30,
  "business_phone": "0413000000"
}
```

---

### GET `/business/leads`
Get leads inbox.

**Query params:**
- `status` — filter by status (PENDING, UNLOCKED, CONFIRMED, etc.)
- `page`, `limit`

**Response 200:**
```json
{
  "leads": [
    {
      "id": "uuid",
      "status": "PENDING",
      "consumer_suburb": "Newtown",
      "job_description": "Burst pipe...",
      "unlock_fee_cents": 800,
      "created_at": "2026-02-19T10:30:00Z",
      "expires_at": "2026-02-21T10:30:00Z",
      // consumer fields only present if status != PENDING
      "consumer_name": null,
      "consumer_phone": null,
      "consumer_email": null
    }
  ]
}
```

---

### POST `/business/leads/{lead_id}/unlock`
Business pays to unlock a lead.

**Body:**
```json
{
  "payment_method": "card",  // "card" or "wallet"
  // If card:
  "eway_token": "token_from_eway_js"
}
```

**Server-side:**
1. Check lead status is PENDING
2. Check lead not expired
3. If wallet: check balance >= unlock_fee_cents
4. If card: charge via eWAY
5. Deduct/charge, update lead status to UNLOCKED
6. Create referrer_earning record (status=PENDING)
7. Send referrer notification

**Response 200:**
```json
{
  "lead": {
    "id": "uuid",
    "status": "UNLOCKED",
    "consumer_name": "Sarah Thompson",
    "consumer_phone": "0412345678",
    "consumer_email": "sarah@email.com",
    "consumer_suburb": "Newtown",
    "job_description": "Burst pipe in bathroom..."
  },
  "payment": {
    "amount_cents": 800,
    "method": "card",
    "reference": "eway_txn_123"
  }
}
```

**Response 402 (insufficient wallet):**
```json
{
  "error": "insufficient_balance",
  "balance_cents": 400,
  "required_cents": 800
}
```

---

### POST `/business/leads/{lead_id}/on-the-way`
Business taps "I'm on my way". Triggers PIN generation and SMS sends.

**Body:** (empty)

**Server-side:**
1. Check lead status is UNLOCKED
2. Generate 4-digit PIN
3. Store in lead_pins with 4hr expiry
4. Send SMS to consumer (Twilio)
5. Send SMS + push notification to business (Twilio + FCM)
6. Update lead status to ON_THE_WAY

**Response 200:**
```json
{
  "message": "On the way confirmed. Connection code sent to consumer.",
  "pin_expires_at": "2026-02-19T14:30:00Z"
}
```

---

### POST `/business/leads/{lead_id}/confirm-pin`
Business enters PIN given to them by the consumer.

**Body:**
```json
{
  "pin": "4829"
}
```

**Server-side:**
1. Check lead status is ON_THE_WAY
2. Check pin_expires_at not passed
3. Look up lead_pin record
4. If attempts >= 3: return lockout error
5. Increment attempts
6. Compare PIN
7. If match: mark confirmed, release referrer earning immediately
8. Update trust_score and connection_rate on business

**Response 200 (correct PIN):**
```json
{
  "confirmed": true,
  "message": "Visit confirmed! Your referrer has been paid."
}
```

**Response 400 (wrong PIN):**
```json
{
  "confirmed": false,
  "message": "Incorrect code. Ask the customer to check their SMS.",
  "attempts_remaining": 2
}
```

**Response 423 (too many attempts):**
```json
{
  "error": "pin_locked",
  "message": "Too many incorrect attempts. The lead will auto-release payment in 7 days."
}
```

---

### POST `/business/wallet/topup`
Add credit to business wallet.

**Body:**
```json
{
  "amount_cents": 5000,    // $50
  "eway_token": "token"
}
```

**Bonus tiers:**
- $50 topup → $55 credit (10% bonus)
- $100 topup → $115 credit (15% bonus)
- $200+ topup → $240 credit (20% bonus)

**Response 200:**
```json
{
  "new_balance_cents": 5500,
  "bonus_applied_cents": 500,
  "payment_reference": "eway_txn_456"
}
```

---

### GET `/business/wallet/transactions`
Get wallet transaction history.

**Response 200:**
```json
{
  "transactions": [
    {
      "id": "uuid",
      "type": "UNLOCK",
      "amount_cents": -800,
      "balance_after_cents": 4700,
      "lead_id": "uuid",
      "created_at": "..."
    }
  ]
}
```

---

### POST `/business/leads/{lead_id}/dispute`
Business disputes a lead.

**Body:**
```json
{
  "reason": "invalid_phone",
  "notes": "Number was disconnected when I called"
}
```

Valid reasons: `invalid_phone`, `identity_fraud`, `duplicate`, `other`

**Response 200:**
```json
{
  "dispute_id": "uuid",
  "message": "Dispute received. We'll review and respond within 24 hours."
}
```

---

## Referrer Routes (auth required, role: referrer)

### GET `/referrer/dashboard`
Summary data for referrer homepage.

**Response 200:**
```json
{
  "wallet_balance_cents": 3475,
  "pending_cents": 1225,
  "total_earned_cents": 15640,
  "total_leads_sent": 23,
  "total_leads_unlocked": 18,
  "unlock_rate": 78.3,
  "quality_score": 92
}
```

---

### GET `/referrer/links`
All referral links this referrer has created.

**Response 200:**
```json
{
  "links": [
    {
      "id": "uuid",
      "business_name": "Bob's Plumbing",
      "business_slug": "bobs-plumbing",
      "link_code": "abc123xyz",
      "link_url": "https://traderefer.com.au/r/bobs-plumbing/abc123xyz",
      "clicks": 47,
      "leads_created": 8,
      "leads_unlocked": 6,
      "total_earned_cents": 4200
    }
  ]
}
```

---

### POST `/referrer/links`
Create a new referral link for a business.

**Body:**
```json
{
  "business_id": "uuid"
}
```

**Response 200:**
```json
{
  "link_id": "uuid",
  "link_url": "https://traderefer.com.au/r/bobs-plumbing/abc123xyz",
  "link_code": "abc123xyz"
}
```

---

### GET `/referrer/earnings`
Earnings history.

**Response 200:**
```json
{
  "earnings": [
    {
      "id": "uuid",
      "lead_id": "uuid",
      "business_name": "Bob's Plumbing",
      "gross_cents": 560,
      "status": "AVAILABLE",
      "available_at": "2026-02-26T10:30:00Z",
      "created_at": "2026-02-19T10:30:00Z"
    }
  ]
}
```

---

### POST `/referrer/payouts`
Request a payout.

**Body:**
```json
{
  "amount_cents": 3475,   // must be >= 2000 ($20 minimum)
  "method": "paypal",
  "destination": "jane@email.com"
}
```

**Server-side:**
1. Check amount_cents >= 2000
2. Check referrer wallet_balance_cents >= amount_cents
3. Check referrer has payout details set up
4. Create payout_request record
5. Deduct from wallet_balance_cents immediately
6. Admin processes on Thursdays

**Response 200:**
```json
{
  "payout_id": "uuid",
  "status": "PENDING",
  "message": "Payout requested. Expected by Friday."
}
```

---

### PUT `/referrer/payout-details`
Save or update payout method.

**Body:**
```json
{
  "method": "paypal",
  "paypal_email": "jane@email.com",
  "abn": "12345678901"
}
```

---

## Admin Routes (auth required, role: admin)

### GET `/admin/leads` — List all leads with filters
### GET `/admin/disputes` — List open disputes
### POST `/admin/disputes/{id}/resolve` — Resolve a dispute
### GET `/admin/referrers` — List referrers, filter by quality_score
### GET `/admin/businesses` — List businesses, filter by trust_score
### POST `/admin/payouts/batch` — Process pending payout requests
### GET `/admin/stats` — Platform revenue, lead volume, daily active users

---

## Background Jobs (Cron — run via Railway)

These are not HTTP endpoints — they run on schedule via a separate Railway cron service.

### `expire-leads` — Run every 15 minutes
Mark leads as EXPIRED if `expires_at < NOW()` and `status = 'PENDING'`
Send consumer notification and referrer notification.

### `release-earnings` — Run every hour
For each `referrer_earning` where `status = 'PENDING'` and `available_at <= NOW()`:
- Update status to `AVAILABLE`
- Add to referrer's `wallet_balance_cents`
- Send referrer "your earning is now available" notification

### `expiry-reminder` — Run every hour
Send 24hr reminder email to businesses with leads expiring in 24 hours.

### `send-quality-nudge` — Run daily
Flag referrers whose `unlock_rate` has dropped below 30% in last 30 days.
Send internal alert to admin.

### `abn-reminder` — Run weekly
Email referrers who have earned > $500 total but still have no ABN on file.
