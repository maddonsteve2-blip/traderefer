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
