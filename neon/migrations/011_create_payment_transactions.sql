CREATE TABLE payment_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         UUID REFERENCES leads(id),
  business_id     UUID REFERENCES businesses(id),
  referrer_id     UUID REFERENCES referrers(id),
  
  type            TEXT NOT NULL, -- lead_unlock, referrer_payout, bonus, refund
  amount_cents    INTEGER NOT NULL,
  platform_fee_cents INTEGER,
  status          TEXT NOT NULL DEFAULT 'PENDING', -- pending, completed, failed, refunded

  eway_transaction_id TEXT,
  paypal_transaction_id TEXT,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_transactions_lead_id ON payment_transactions(lead_id);
CREATE INDEX idx_payment_transactions_business_id ON payment_transactions(business_id);
CREATE INDEX idx_payment_transactions_referrer_id ON payment_transactions(referrer_id);
