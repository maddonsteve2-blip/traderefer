"""
Check referrer table schema
"""
import os
from dotenv import load_dotenv
import psycopg2

load_dotenv(".env.local")

db_url = os.getenv("DATABASE_URL")
conn = psycopg2.connect(db_url)
cur = conn.cursor()

print("Referrer table schema:")
print("-" * 80)

cur.execute("""
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns 
    WHERE table_name = 'referrers'
    ORDER BY ordinal_position
""")

for row in cur.fetchall():
    nullable = "NULL" if row[2] == "YES" else "NOT NULL"
    default = f"DEFAULT {row[3]}" if row[3] else ""
    print(f"{row[0]:30} {row[1]:20} {nullable:10} {default}")

cur.close()
conn.close()
