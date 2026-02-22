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

  -- Payouts
  stripe_account_id     TEXT,

  -- Timestamps
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_referrers_status ON referrers(status);
CREATE INDEX idx_referrers_quality_score ON referrers(quality_score);
