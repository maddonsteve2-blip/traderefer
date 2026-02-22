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
