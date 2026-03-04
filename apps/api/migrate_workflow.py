"""
Migration: TradeRefer Workflow v2
- New lead statuses (SCREENING, MEETING_VERIFIED, VALID_LEAD, PAYMENT_PENDING_CONFIRMATION,
  CONFIRMED_SUCCESS, DECLINED, UNCONFIRMED)
- lead_surveys table for dual-YES confirmation flow
- Referrer accountability columns
- Prezzee payout columns
Run once: python migrate_workflow.py
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

        # ── leads: new columns ──────────────────────────────────────────
        cur.execute("""
            ALTER TABLE leads
                ADD COLUMN IF NOT EXISTS screening_status TEXT DEFAULT 'PENDING',
                ADD COLUMN IF NOT EXISTS screening_conversation JSONB DEFAULT '[]',
                ADD COLUMN IF NOT EXISTS meeting_verified_at TIMESTAMPTZ,
                ADD COLUMN IF NOT EXISTS surveys_sent_at TIMESTAMPTZ,
                ADD COLUMN IF NOT EXISTS business_survey_outcome TEXT,
                ADD COLUMN IF NOT EXISTS customer_survey_outcome TEXT,
                ADD COLUMN IF NOT EXISTS surveys_closed_at TIMESTAMPTZ,
                ADD COLUMN IF NOT EXISTS refund_issued_at TIMESTAMPTZ,
                ADD COLUMN IF NOT EXISTS refund_reason TEXT
        """)
        print("  ✓ leads columns added")

        # ── lead_surveys table ──────────────────────────────────────────
        cur.execute("""
            CREATE TABLE IF NOT EXISTS lead_surveys (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
                respondent_type TEXT NOT NULL,
                survey_round INT NOT NULL DEFAULT 0,
                sent_at TIMESTAMPTZ DEFAULT now(),
                response_raw TEXT,
                outcome TEXT,
                outcome_reason TEXT,
                job_value_cents INT,
                created_at TIMESTAMPTZ DEFAULT now()
            )
        """)
        print("  ✓ lead_surveys table created")

        # ── referrers: accountability columns ───────────────────────────
        cur.execute("""
            ALTER TABLE referrers
                ADD COLUMN IF NOT EXISTS accountability_stage TEXT DEFAULT 'none',
                ADD COLUMN IF NOT EXISTS accountability_updated_at TIMESTAMPTZ
        """)
        print("  ✓ referrers accountability columns added")

        # ── payout_requests: Prezzee columns ────────────────────────────
        cur.execute("""
            ALTER TABLE payout_requests
                ADD COLUMN IF NOT EXISTS prezzee_order_uuid TEXT,
                ADD COLUMN IF NOT EXISTS destination_email TEXT
        """)
        print("  ✓ payout_requests Prezzee columns added")

    conn.close()
    print("\n✅ Migration complete")

if __name__ == "__main__":
    run()
