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
