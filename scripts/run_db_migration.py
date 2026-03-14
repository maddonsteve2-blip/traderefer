"""
Run location fix DB migration against Neon PostgreSQL.
Reads SQL from neon/migrations/015_fix_location_data.sql and executes in batches.
"""
import psycopg2
import re
import sys

CONN_STRING = "postgresql://neondb_owner:npg_qsxKWSvGyk65@ep-steep-violet-aikad8l7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require"
SQL_FILE = r"C:\Users\61479\Documents\trade-refer-stitch\neon\migrations\015_fix_location_data.sql"

def main():
    # Read SQL file
    with open(SQL_FILE, 'r') as f:
        content = f.read()
    
    # Extract UPDATE statements
    statements = [line.strip() for line in content.split('\n') 
                  if line.strip().startswith('UPDATE')]
    
    print(f"Total UPDATE statements: {len(statements)}")
    
    # Connect
    conn = psycopg2.connect(CONN_STRING)
    conn.autocommit = False
    cur = conn.cursor()
    
    total_affected = 0
    batch_size = 50
    errors = []
    
    for i in range(0, len(statements), batch_size):
        batch = statements[i:i+batch_size]
        batch_num = i // batch_size + 1
        batch_affected = 0
        
        try:
            for stmt in batch:
                cur.execute(stmt)
                batch_affected += cur.rowcount
            conn.commit()
            total_affected += batch_affected
            print(f"  Batch {batch_num}: {len(batch)} statements, {batch_affected} rows affected")
        except Exception as e:
            conn.rollback()
            errors.append(f"Batch {batch_num}: {e}")
            print(f"  Batch {batch_num}: ERROR - {e}")
    
    cur.close()
    conn.close()
    
    print(f"\n=== SUMMARY ===")
    print(f"Statements executed: {len(statements)}")
    print(f"Total rows affected: {total_affected}")
    print(f"Errors: {len(errors)}")
    for err in errors:
        print(f"  {err}")
    
    if errors:
        sys.exit(1)

if __name__ == "__main__":
    main()
