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
  referrer_payout_amount_cents INTEGER,
  referral_fee_snapshot_cents INTEGER,
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
