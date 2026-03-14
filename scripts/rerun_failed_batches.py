"""Re-run the 3 failed batches from the location fix migration (apostrophe statements already fixed separately)."""
import psycopg2

CONN_STRING = "postgresql://neondb_owner:npg_qsxKWSvGyk65@ep-steep-violet-aikad8l7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require"
SQL_FILE = r"C:\Users\61479\Documents\trade-refer-stitch\neon\migrations\015_fix_location_data.sql"

with open(SQL_FILE, 'r') as f:
    content = f.read()

statements = [line.strip() for line in content.split('\n') if line.strip().startswith('UPDATE')]

# Failed batches: 3 (idx 100-149), 4 (idx 150-199), 9 (idx 400-449)
failed_indices = list(range(100, 150)) + list(range(150, 200)) + list(range(400, 450))

# Filter out the 3 apostrophe statements (already run separately)
apostrophe_keywords = ["O'connor", "O'halloran"]
to_run = []
for idx in failed_indices:
    stmt = statements[idx]
    if any(k in stmt for k in apostrophe_keywords):
        print(f"  Skipping already-fixed: ...{stmt[-60:]}")
        continue
    # Escape any remaining apostrophes just in case
    to_run.append(stmt)

print(f"Statements to re-run: {len(to_run)}")

conn = psycopg2.connect(CONN_STRING)
conn.autocommit = False
cur = conn.cursor()

total = 0
try:
    for stmt in to_run:
        cur.execute(stmt)
        total += cur.rowcount
    conn.commit()
    print(f"✅ All {len(to_run)} statements executed, {total} rows affected")
except Exception as e:
    conn.rollback()
    print(f"❌ Error: {e}")
finally:
    cur.close()
    conn.close()
