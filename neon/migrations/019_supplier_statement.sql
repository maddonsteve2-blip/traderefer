-- ATO Supplier Statement fields for referrer payout compliance
-- Supports the $74.99 auto-payout threshold + declaration fallback for >$75 edge cases

ALTER TABLE referrers ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE referrers ADD COLUMN IF NOT EXISTS supplier_statement_reason TEXT;
ALTER TABLE referrers ADD COLUMN IF NOT EXISTS supplier_statement_declared_at TIMESTAMPTZ;
ALTER TABLE referrers ADD COLUMN IF NOT EXISTS supplier_statement_ip VARCHAR(45);
