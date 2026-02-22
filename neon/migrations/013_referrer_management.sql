-- Migration 013: Referrer management features for businesses
-- Adds per-referrer fee override + notes to referral_links
-- Creates referrer_bonuses table for one-off bonus tracking

-- 1. Add custom_fee_cents to referral_links (NULL = use business default)
ALTER TABLE referral_links ADD COLUMN custom_fee_cents INTEGER;

-- 2. Add business_notes for private notes about a referrer
ALTER TABLE referral_links ADD COLUMN business_notes TEXT;

-- 3. Create referrer_bonuses table
CREATE TABLE referrer_bonuses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  referrer_id     UUID NOT NULL REFERENCES referrers(id) ON DELETE CASCADE,
  referral_link_id UUID REFERENCES referral_links(id) ON DELETE SET NULL,

  amount_cents    INTEGER NOT NULL,
  reason          TEXT,

  -- Payment tracking
  funded_from     TEXT NOT NULL DEFAULT 'wallet',  -- 'wallet' or 'card'
  payment_ref     TEXT,  -- Stripe payment intent ID if card-charged

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_referrer_bonuses_business_id ON referrer_bonuses(business_id);
CREATE INDEX idx_referrer_bonuses_referrer_id ON referrer_bonuses(referrer_id);

