CREATE TABLE businesses (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES neon_auth.user(id) ON DELETE CASCADE,

  -- Profile
  business_name       TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE,      -- "bobs-plumbing" â€” used in URLs
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

  -- Wallet
  wallet_balance_cents INTEGER NOT NULL DEFAULT 0,

  -- Trust & Quality
  trust_score         INTEGER NOT NULL DEFAULT 100,  -- 0â€“100
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
  features            TEXT[] DEFAULT '{}',

  -- Payouts
  stripe_account_id   TEXT,

  -- Timestamps
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_businesses_suburb ON businesses(suburb);
CREATE INDEX idx_businesses_trade_category ON businesses(trade_category);
CREATE INDEX idx_businesses_status ON businesses(status);
CREATE INDEX idx_businesses_slug ON businesses(slug);
CREATE TABLE referrers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES neon_auth.user(id) ON DELETE CASCADE,

  -- Profile
  full_name             TEXT NOT NULL,
  email                 TEXT NOT NULL,
  phone                 TEXT NOT NULL,

  -- Tax / Compliance
  abn                   TEXT,
  tax_withheld          BOOLEAN NOT NULL DEFAULT FALSE,

  -- Payout Details
  paypal_email          TEXT,
  bank_bsb              TEXT,
  bank_account_number   TEXT,
  preferred_payout      TEXT DEFAULT 'paypal',

  -- Earnings
  wallet_balance_cents  INTEGER NOT NULL DEFAULT 0,
  pending_cents         INTEGER NOT NULL DEFAULT 0,
  total_earned_cents    INTEGER NOT NULL DEFAULT 0,

  -- Quality Score
  quality_score         INTEGER NOT NULL DEFAULT 100,
  unlock_rate           DECIMAL(5,2) DEFAULT 0,
  total_leads_sent      INTEGER NOT NULL DEFAULT 0,
  total_leads_unlocked  INTEGER NOT NULL DEFAULT 0,

  -- Status
  status                TEXT NOT NULL DEFAULT 'active',

  -- Timestamps
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_referrers_status ON referrers(status);
CREATE INDEX idx_referrers_quality_score ON referrers(quality_score);
CREATE TABLE referral_links (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id     UUID NOT NULL REFERENCES referrers(id) ON DELETE CASCADE,
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

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
CREATE TABLE leads (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id           UUID NOT NULL REFERENCES businesses(id),
  referral_link_id      UUID NOT NULL REFERENCES referral_links(id),
  referrer_id           UUID NOT NULL REFERENCES referrers(id),

  -- Consumer Details
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
  status                TEXT NOT NULL DEFAULT 'PENDING',

  -- Unlock Details
  unlock_fee_cents      INTEGER,
  unlocked_at           TIMESTAMPTZ,
  unlock_payment_type   TEXT,
  payment_reference     TEXT,

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
CREATE UNIQUE INDEX idx_leads_phone_business ON leads(consumer_phone, business_id)
  WHERE status NOT IN ('EXPIRED', 'DISPUTED');
CREATE INDEX idx_leads_expires_at ON leads(expires_at);
CREATE TABLE lead_pins (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  pin         TEXT NOT NULL,
  attempts    INTEGER NOT NULL DEFAULT 0,
  is_used     BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at  TIMESTAMPTZ NOT NULL,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lead_pins_lead_id ON lead_pins(lead_id);
CREATE TABLE referrer_earnings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id         UUID NOT NULL REFERENCES referrers(id),
  lead_id             UUID NOT NULL REFERENCES leads(id),

  -- Amount
  gross_cents         INTEGER NOT NULL,
  platform_cut_cents  INTEGER NOT NULL,

  -- Status
  status              TEXT NOT NULL DEFAULT 'PENDING',

  -- Timing
  available_at        TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  paid_at             TIMESTAMPTZ,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_referrer_earnings_referrer_id ON referrer_earnings(referrer_id);
CREATE INDEX idx_referrer_earnings_status ON referrer_earnings(status);
CREATE INDEX idx_referrer_earnings_available_at ON referrer_earnings(available_at);
CREATE TABLE wallet_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID NOT NULL REFERENCES businesses(id),

  -- Amount
  amount_cents    INTEGER NOT NULL,

  -- Type
  type            TEXT NOT NULL,

  -- Reference
  lead_id         UUID REFERENCES leads(id),
  payment_ref     TEXT,
  notes           TEXT,

  -- Balance after this transaction
  balance_after_cents INTEGER NOT NULL,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wallet_transactions_business_id ON wallet_transactions(business_id);
CREATE TABLE disputes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id       UUID NOT NULL REFERENCES leads(id),
  business_id   UUID NOT NULL REFERENCES businesses(id),

  reason        TEXT NOT NULL,
  notes         TEXT,

  -- Resolution
  status        TEXT NOT NULL DEFAULT 'OPEN',
  admin_notes   TEXT,
  resolved_at   TIMESTAMPTZ,
  resolved_by   UUID REFERENCES neon_auth.user(id), -- Admins are neon_auth users

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_disputes_lead_id ON disputes(lead_id);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE TABLE payout_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id     UUID NOT NULL REFERENCES referrers(id),

  amount_cents    INTEGER NOT NULL,

  -- Method
  method          TEXT NOT NULL,
  destination     TEXT NOT NULL,

  -- Status
  status          TEXT NOT NULL DEFAULT 'PENDING',
  processed_at    TIMESTAMPTZ,
  payment_ref     TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payout_requests_referrer_id ON payout_requests(referrer_id);
CREATE INDEX idx_payout_requests_status ON payout_requests(status);
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who it was sent to
  recipient_type TEXT NOT NULL,
  recipient_id   UUID,
  recipient_phone TEXT,
  recipient_email TEXT,

  -- What was sent
  channel     TEXT NOT NULL,
  type        TEXT NOT NULL,
  body        TEXT NOT NULL,

  -- Delivery
  provider_ref TEXT,
  status       TEXT NOT NULL DEFAULT 'sent',

  -- Context
  lead_id     UUID REFERENCES leads(id),

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_lead_id ON notifications(lead_id);
CREATE INDEX idx_notifications_recipient_type ON notifications(recipient_type, recipient_id);
INSERT INTO businesses (business_name, slug, trade_category, suburb, business_phone, business_email, unlock_fee_cents, is_verified)
VALUES 
('Bob\'s Plumbing', 'bobs-plumbing', 'Plumber', 'Newtown', '0412000000', 'bob@plumbing.com', 800, true),
('Jane\'s Electrical', 'janes-electrical', 'Electrician', 'Geelong', '0413000000', 'jane@electrical.com', 1000, true),
('Dave\'s Builders', 'daves-builders', 'Builder', 'Belmont', '0414000000', 'dave@builders.com', 1500, true),
('Sarah\'s Carpenters', 'sarahs-carpenters', 'Carpenter', 'Highton', '0415000000', 'sarah@carpenters.com', 1200, true),
('Tom\'s Cleaners', 'toms-cleaners', 'Cleaner', 'Grovedale', '0416000000', 'tom@cleaners.com', 500, true);
