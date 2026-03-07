"""
Migration: Referrer Applications & Profile
- referrer_applications table (approval workflow)
- referrers: profile_bio, tagline, profile_photo_url columns
Run once: python migrate_applications.py
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

        cur.execute("""
            CREATE TABLE IF NOT EXISTS referrer_applications (
                id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                referrer_id      UUID REFERENCES referrers(id) ON DELETE CASCADE,
                business_id      UUID REFERENCES businesses(id) ON DELETE CASCADE,
                status           TEXT NOT NULL DEFAULT 'pending',
                message          TEXT,
                reminder_count   INT DEFAULT 0,
                last_reminder_at TIMESTAMPTZ,
                applied_at       TIMESTAMPTZ DEFAULT now(),
                reviewed_at      TIMESTAMPTZ,
                UNIQUE(referrer_id, business_id)
            )
        """)
        print("  ✓ referrer_applications table created")

        cur.execute("""
            ALTER TABLE referrers
              ADD COLUMN IF NOT EXISTS profile_bio        TEXT,
              ADD COLUMN IF NOT EXISTS tagline            TEXT,
              ADD COLUMN IF NOT EXISTS profile_photo_url  TEXT
        """)
        print("  ✓ referrers profile columns added")

    conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    run()
