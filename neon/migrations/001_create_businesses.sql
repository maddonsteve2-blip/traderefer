CREATE TABLE businesses (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES neon_auth.user(id) ON DELETE CASCADE,

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
  referral_fee_cents    INTEGER NOT NULL DEFAULT 800,  -- $8.00 = 800 cents

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
