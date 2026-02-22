# 04 — Database Schema

All tables live in Supabase (Postgres). Use Supabase Auth for authentication — it provides the `auth.users` table automatically.

---

## Overview

```
auth.users          ← Supabase managed (email, password, id)
     │
     ├── businesses          ← Business profiles
     ├── referrers           ← Referrer profiles
     └── admins              ← Admin users

businesses
     │
     ├── referral_links      ← One per referrer-business pair
     ├── leads               ← All leads linked to a business
     └── wallet_transactions ← Money in/out of business wallet

leads
     │
     ├── lead_pins           ← PIN codes for connection confirmation
     ├── referrer_earnings   ← What referrer earns per lead
     └── disputes            ← Raised by businesses

referrers
     │
     ├── referral_links      ← Their links
     ├── referrer_earnings   ← Their money
     └── payout_requests     ← Withdrawal requests
```

---

## Table: `businesses`

```sql
CREATE TABLE businesses (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Profile
  business_name       TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE,      -- "bobs-plumbing" — used in URLs
  trade_category      TEXT NOT NULL,             -- "Plumber", "Electrician", etc.
  description         TEXT,
  abn                 TEXT,
  website             TEXT,

  -- Location
  suburb              TEXT NOT NULL,
  state               TEXT NOT NULL DEFAULT 'VIC',
  service_radius_km   INTEGER NOT NULL DEFAULT 20,
  lat                 DECIMAL(9,6),
  lng                 DECIMAL(9,6),

  -- Contact
  business_phone      TEXT NOT NULL,
  business_email      TEXT NOT NULL,

  -- Pricing
  unlock_fee_cents    INTEGER NOT NULL DEFAULT 800,  -- $8.00 = 800 cents
  -- 300 cents minimum ($3.00), no hard maximum

  -- Wallet
  wallet_balance_cents INTEGER NOT NULL DEFAULT 0,

  -- Trust & Quality
  trust_score         INTEGER NOT NULL DEFAULT 100,  -- 0–100
  connection_rate     DECIMAL(5,2) DEFAULT 0,         -- % of leads that get PIN confirmed
  total_leads_unlocked INTEGER NOT NULL DEFAULT 0,
  total_confirmed     INTEGER NOT NULL DEFAULT 0,
  response_rating     DECIMAL(5,2) DEFAULT 0,         -- % contacted within 48hrs

  -- Status
  status              TEXT NOT NULL DEFAULT 'active', -- active, suspended, banned
  is_verified         BOOLEAN NOT NULL DEFAULT FALSE,  -- licence verified by admin
  listing_rank        INTEGER NOT NULL DEFAULT 0,      -- higher = appears first

  -- Media
  logo_url            TEXT,
  photo_urls          TEXT[] DEFAULT '{}',

  -- Timestamps
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_businesses_suburb ON businesses(suburb);
CREATE INDEX idx_businesses_trade_category ON businesses(trade_category);
CREATE INDEX idx_businesses_status ON businesses(status);
CREATE INDEX idx_businesses_slug ON businesses(slug);
```

---

## Table: `referrers`

```sql
CREATE TABLE referrers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Profile
  full_name             TEXT NOT NULL,
  email                 TEXT NOT NULL,
  phone                 TEXT NOT NULL,

  -- Tax / Compliance
  abn                   TEXT,
  tax_withheld          BOOLEAN NOT NULL DEFAULT FALSE,
  -- If no ABN: withhold 47% from payouts

  -- Payout Details
  paypal_email          TEXT,
  bank_bsb              TEXT,
  bank_account_number   TEXT,
  preferred_payout      TEXT DEFAULT 'paypal',  -- 'paypal' or 'bank'

  -- Earnings
  wallet_balance_cents  INTEGER NOT NULL DEFAULT 0,   -- available to withdraw
  pending_cents         INTEGER NOT NULL DEFAULT 0,   -- in 7-day hold
  total_earned_cents    INTEGER NOT NULL DEFAULT 0,   -- all time

  -- Quality Score
  quality_score         INTEGER NOT NULL DEFAULT 100,  -- 0–100
  unlock_rate           DECIMAL(5,2) DEFAULT 0,         -- % of their leads that get unlocked
  total_leads_sent      INTEGER NOT NULL DEFAULT 0,
  total_leads_unlocked  INTEGER NOT NULL DEFAULT 0,

  -- Status
  status                TEXT NOT NULL DEFAULT 'active',  -- active, flagged, banned

  -- Timestamps
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_referrers_status ON referrers(status);
CREATE INDEX idx_referrers_quality_score ON referrers(quality_score);
```

---

## Table: `referral_links`

One row per referrer-business combination. Created when a referrer grabs their link for a business.

```sql
CREATE TABLE referral_links (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id     UUID NOT NULL REFERENCES referrers(id) ON DELETE CASCADE,
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- The unique code embedded in the URL
  -- URL format: traderefer.com.au/r/{business_slug}/{link_code}
  link_code       TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,

  -- Stats
  clicks          INTEGER NOT NULL DEFAULT 0,
  leads_created   INTEGER NOT NULL DEFAULT 0,
  leads_unlocked  INTEGER NOT NULL DEFAULT 0,
  total_earned_cents INTEGER NOT NULL DEFAULT 0,

  -- Status
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_referral_links_unique ON referral_links(referrer_id, business_id);
CREATE INDEX idx_referral_links_link_code ON referral_links(link_code);
```

---

## Table: `leads`

The most important table. Every lead that enters the system.

```sql
CREATE TABLE leads (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id           UUID NOT NULL REFERENCES businesses(id),
  referral_link_id      UUID NOT NULL REFERENCES referral_links(id),
  referrer_id           UUID NOT NULL REFERENCES referrers(id),

  -- Consumer Details (stored after OTP verification)
  consumer_name         TEXT NOT NULL,
  consumer_phone        TEXT NOT NULL,
  consumer_email        TEXT NOT NULL,
  consumer_suburb       TEXT NOT NULL,
  job_description       TEXT NOT NULL,

  -- Fraud Prevention
  consumer_ip           TEXT,
  consumer_device_hash  TEXT,
  otp_verified_at       TIMESTAMPTZ,

  -- Lead Status
  -- PENDING: created, not yet unlocked
  -- UNLOCKED: business paid, has consumer details
  -- ON_THE_WAY: "on my way" triggered, PIN sent
  -- CONFIRMED: PIN entered correctly
  -- UNCONFIRMED: PIN window expired without confirmation
  -- EXPIRED: business didn't unlock within 48hrs
  -- DISPUTED: business raised a dispute
  status                TEXT NOT NULL DEFAULT 'PENDING',

  -- Unlock Details
  unlock_fee_cents      INTEGER,            -- fee at time of unlock (snapshot)
  unlocked_at           TIMESTAMPTZ,
  unlock_payment_type   TEXT,              -- 'card' or 'wallet'
  payment_reference     TEXT,             -- eWAY transaction ID

  -- On The Way
  on_the_way_at         TIMESTAMPTZ,
  pin_expires_at        TIMESTAMPTZ,

  -- Confirmation
  confirmed_at          TIMESTAMPTZ,

  -- Expiry
  expires_at            TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '48 hours'),

  -- Timestamps
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leads_business_id ON leads(business_id);
CREATE INDEX idx_leads_referrer_id ON leads(referrer_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_consumer_phone ON leads(consumer_phone);
-- Used for duplicate check: same phone → same business
CREATE UNIQUE INDEX idx_leads_phone_business ON leads(consumer_phone, business_id)
  WHERE status NOT IN ('EXPIRED', 'DISPUTED');
CREATE INDEX idx_leads_expires_at ON leads(expires_at);
```

---

## Table: `lead_pins`

```sql
CREATE TABLE lead_pins (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  pin         TEXT NOT NULL,       -- "4829" — 4 digit numeric string
  attempts    INTEGER NOT NULL DEFAULT 0,  -- max 3 attempts before lockout
  is_used     BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at  TIMESTAMPTZ NOT NULL,  -- NOW() + 4 hours

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lead_pins_lead_id ON lead_pins(lead_id);
```

---

## Table: `referrer_earnings`

```sql
CREATE TABLE referrer_earnings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id         UUID NOT NULL REFERENCES referrers(id),
  lead_id             UUID NOT NULL REFERENCES leads(id),

  -- Amount
  gross_cents         INTEGER NOT NULL,  -- unlock_fee * 0.7 (rounded down)
  platform_cut_cents  INTEGER NOT NULL,  -- unlock_fee * 0.3

  -- Status
  -- PENDING: lead unlocked, in 7-day hold
  -- AVAILABLE: 7 days passed OR PIN confirmed — ready to withdraw
  -- PAID: included in a payout batch
  -- REVERSED: dispute was upheld, earning cancelled
  status              TEXT NOT NULL DEFAULT 'PENDING',

  -- Timing
  available_at        TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  -- Override to NOW() when PIN confirmed
  paid_at             TIMESTAMPTZ,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_referrer_earnings_referrer_id ON referrer_earnings(referrer_id);
CREATE INDEX idx_referrer_earnings_status ON referrer_earnings(status);
CREATE INDEX idx_referrer_earnings_available_at ON referrer_earnings(available_at);
```

---

## Table: `wallet_transactions`

Business wallet top-ups and deductions.

```sql
CREATE TABLE wallet_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID NOT NULL REFERENCES businesses(id),

  -- Amount (always positive, direction determined by type)
  amount_cents    INTEGER NOT NULL,

  -- Type
  -- TOPUP: business loaded wallet credit
  -- TOPUP_BONUS: bonus applied (e.g. 10% on $50 load)
  -- UNLOCK: lead unlock deducted
  -- REFUND: dispute refund
  type            TEXT NOT NULL,

  -- Reference
  lead_id         UUID REFERENCES leads(id),
  payment_ref     TEXT,  -- eWAY transaction ID for topups
  notes           TEXT,

  -- Balance after this transaction
  balance_after_cents INTEGER NOT NULL,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wallet_transactions_business_id ON wallet_transactions(business_id);
```

---

## Table: `disputes`

```sql
CREATE TABLE disputes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id       UUID NOT NULL REFERENCES leads(id),
  business_id   UUID NOT NULL REFERENCES businesses(id),

  reason        TEXT NOT NULL,   -- 'invalid_phone', 'identity_fraud', 'duplicate', 'other'
  notes         TEXT,

  -- Resolution
  -- OPEN: pending admin review
  -- REFUND: admin approved refund
  -- DENIED: admin denied refund
  status        TEXT NOT NULL DEFAULT 'OPEN',
  admin_notes   TEXT,
  resolved_at   TIMESTAMPTZ,
  resolved_by   UUID REFERENCES admins(id),

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_disputes_lead_id ON disputes(lead_id);
CREATE INDEX idx_disputes_status ON disputes(status);
```

---

## Table: `payout_requests`

```sql
CREATE TABLE payout_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id     UUID NOT NULL REFERENCES referrers(id),

  amount_cents    INTEGER NOT NULL,   -- must be >= 2000 ($20.00 minimum)

  -- Method
  method          TEXT NOT NULL,      -- 'paypal' or 'bank'
  destination     TEXT NOT NULL,      -- PayPal email OR BSB:account

  -- Status
  -- PENDING: requested, not yet processed
  -- PROCESSING: admin has sent payment
  -- PAID: confirmed paid
  -- FAILED: payment failed, will retry
  status          TEXT NOT NULL DEFAULT 'PENDING',
  processed_at    TIMESTAMPTZ,
  payment_ref     TEXT,  -- PayPal transaction ID or bank reference

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payout_requests_referrer_id ON payout_requests(referrer_id);
CREATE INDEX idx_payout_requests_status ON payout_requests(status);
```

---

## Table: `admins`

```sql
CREATE TABLE admins (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id),
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Table: `notifications`

Log of all SMS/emails/push sent. Important for debugging and compliance.

```sql
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who it was sent to
  recipient_type TEXT NOT NULL,  -- 'business', 'referrer', 'consumer'
  recipient_id   UUID,           -- null for consumer (no account)
  recipient_phone TEXT,
  recipient_email TEXT,

  -- What was sent
  channel     TEXT NOT NULL,     -- 'sms', 'email', 'push'
  type        TEXT NOT NULL,     -- 'lead_arrived', 'pin_sent', 'earning_released', etc.
  body        TEXT NOT NULL,

  -- Delivery
  provider_ref TEXT,             -- Twilio SID, SMTPtoGo message ID
  status       TEXT NOT NULL DEFAULT 'sent',  -- sent, delivered, failed

  -- Context
  lead_id     UUID REFERENCES leads(id),

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_lead_id ON notifications(lead_id);
CREATE INDEX idx_notifications_recipient_type ON notifications(recipient_type, recipient_id);
```

---

## Key Business Logic in SQL

### Check for duplicate lead (same consumer, same business)
```sql
SELECT id FROM leads
WHERE consumer_phone = $1
  AND business_id = $2
  AND status NOT IN ('EXPIRED')
LIMIT 1;
```

### Release earnings after 7 days (run nightly via cron)
```sql
UPDATE referrer_earnings
SET status = 'AVAILABLE'
WHERE status = 'PENDING'
  AND available_at <= NOW();

-- Also update referrer wallet balance
UPDATE referrers r
SET wallet_balance_cents = wallet_balance_cents + (
  SELECT COALESCE(SUM(gross_cents), 0)
  FROM referrer_earnings re
  WHERE re.referrer_id = r.id
    AND re.status = 'AVAILABLE'
    AND re.paid_at IS NULL
);
```

### Get leads inbox for a business (sorted by recency)
```sql
SELECT
  l.id,
  l.status,
  l.consumer_suburb,
  l.job_description,
  l.created_at,
  l.unlock_fee_cents,
  l.expires_at,
  -- Only reveal consumer details if UNLOCKED
  CASE WHEN l.status != 'PENDING' THEN l.consumer_name ELSE NULL END as consumer_name,
  CASE WHEN l.status != 'PENDING' THEN l.consumer_phone ELSE NULL END as consumer_phone,
  CASE WHEN l.status != 'PENDING' THEN l.consumer_email ELSE NULL END as consumer_email
FROM leads l
WHERE l.business_id = $1
  AND l.status NOT IN ('EXPIRED')
ORDER BY l.created_at DESC;
```
