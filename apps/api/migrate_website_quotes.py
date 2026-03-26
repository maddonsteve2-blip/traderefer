"""
Migration: website quote requests and matches
- Adds separate tables for free website-originated quotes
- Keeps referral-paid leads isolated from website quote traffic
Run once: python migrate_website_quotes.py
"""
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(".env.local")
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")


def run():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    with conn.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS website_quote_requests (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                source_type TEXT NOT NULL DEFAULT 'website',
                source_page TEXT,
                target_business_id UUID REFERENCES businesses(id),
                trade_category TEXT,
                consumer_name TEXT NOT NULL,
                consumer_phone TEXT NOT NULL,
                consumer_email TEXT NOT NULL,
                consumer_address TEXT,
                consumer_suburb TEXT,
                consumer_city TEXT,
                consumer_state TEXT,
                job_description TEXT NOT NULL,
                urgency TEXT NOT NULL DEFAULT 'warm',
                target_match_count INTEGER NOT NULL DEFAULT 1,
                claimed_match_count INTEGER NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'PENDING',
                admin_review_required BOOLEAN NOT NULL DEFAULT false,
                admin_notified_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
            )
            """
        )
        print("  ✓ website_quote_requests table created")

        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS website_quote_matches (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                request_id UUID NOT NULL REFERENCES website_quote_requests(id) ON DELETE CASCADE,
                business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
                match_type TEXT NOT NULL DEFAULT 'auto',
                match_rank INTEGER NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'NEW',
                is_claimed_snapshot BOOLEAN NOT NULL DEFAULT false,
                allocated_by_admin_user_id UUID,
                allocated_at TIMESTAMPTZ,
                notified_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                UNIQUE (request_id, business_id)
            )
            """
        )
        print("  ✓ website_quote_matches table created")

        cur.execute("CREATE INDEX IF NOT EXISTS idx_website_quote_requests_status ON website_quote_requests(status)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_website_quote_requests_target_business_id ON website_quote_requests(target_business_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_website_quote_requests_created_at ON website_quote_requests(created_at DESC)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_website_quote_matches_request_id ON website_quote_matches(request_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_website_quote_matches_business_id ON website_quote_matches(business_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_website_quote_matches_status ON website_quote_matches(status)")
        print("  ✓ website quote indexes created")

    conn.close()
    print("\n✅ Website quote migration complete")


if __name__ == "__main__":
    run()
