"""
Add twilio_from_number column to leads table using psycopg2
"""
import os
from dotenv import load_dotenv
import psycopg2

load_dotenv(".env.local")

# Get DATABASE_URL and keep it as-is for psycopg2
db_url = os.getenv("DATABASE_URL")

print("Connecting to database...")
conn = psycopg2.connect(db_url)
cur = conn.cursor()

print("Adding twilio_from_number column to leads table...")

# Add the column
cur.execute("""
    ALTER TABLE leads 
    ADD COLUMN IF NOT EXISTS twilio_from_number VARCHAR(20)
""")

conn.commit()
print("✅ Column added successfully!")

# Verify
cur.execute("""
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'leads' 
    AND column_name = 'twilio_from_number'
""")

row = cur.fetchone()
if row:
    print(f"✅ Verified: {row[0]} ({row[1]})")
else:
    print("❌ Column not found after creation")

cur.close()
conn.close()
