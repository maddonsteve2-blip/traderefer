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
