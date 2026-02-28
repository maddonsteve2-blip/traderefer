-- Migration 014: Support for unclaimed businesses, claiming, and delisting
-- 1. Modify businesses table to support scraped, unclaimed data
ALTER TABLE businesses ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS is_claimed BOOLEAN DEFAULT FALSE;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS claim_status TEXT DEFAULT 'unclaimed' CHECK (claim_status IN ('unclaimed', 'pending', 'claimed'));
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'organic';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS external_id TEXT; -- For cross-referencing scraper source IDs

-- 2. Create table for business claim requests
CREATE TABLE IF NOT EXISTS business_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    claimer_name TEXT NOT NULL,
    claimer_email TEXT NOT NULL,
    claimer_phone TEXT,
    proof_url TEXT, -- Link to uploaded proof (license, ABN docs)
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create table for delisting requests
CREATE TABLE IF NOT EXISTS delisting_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    requester_name TEXT NOT NULL,
    requester_email TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'ignored')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_businesses_is_claimed ON businesses(is_claimed);
CREATE INDEX IF NOT EXISTS idx_businesses_claim_status ON businesses(claim_status);
CREATE INDEX IF NOT EXISTS idx_business_claims_status ON business_claims(status);
CREATE INDEX IF NOT EXISTS idx_delisting_requests_status ON delisting_requests(status);
