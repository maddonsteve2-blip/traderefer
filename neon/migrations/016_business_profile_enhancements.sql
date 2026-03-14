-- Migration 016: Add licence number, payment methods, and social links to businesses
-- Closes competitive gaps vs Localsearch.com.au

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS licence_number TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS payment_methods TEXT[] DEFAULT '{}';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS facebook_url TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS tiktok_url TEXT;
