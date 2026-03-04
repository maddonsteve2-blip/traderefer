"""
Add requires_admin_review column to leads table
"""
import os
from dotenv import load_dotenv
import psycopg2

load_dotenv(".env.local")

db_url = os.getenv("DATABASE_URL")

print("Connecting to database...")
conn = psycopg2.connect(db_url)
cur = conn.cursor()

print("Adding requires_admin_review column to leads table...")

# Add the column
cur.execute("""
    ALTER TABLE leads 
    ADD COLUMN IF NOT EXISTS requires_admin_review BOOLEAN DEFAULT false
""")

conn.commit()
print("✅ Column added successfully!")

# Verify
cur.execute("""
    SELECT column_name, data_type, column_default
    FROM information_schema.columns 
    WHERE table_name = 'leads' 
    AND column_name = 'requires_admin_review'
""")

row = cur.fetchone()
if row:
    print(f"✅ Verified: {row[0]} ({row[1]}) default={row[2]}")
else:
    print("❌ Column not found after creation")

cur.close()
conn.close()
