import os
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import text
from dotenv import load_dotenv

async def deep_check():
    load_dotenv("apps/api/.env.local")
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL not found")
        return

    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if "?" in db_url:
        db_url = db_url.split("?")[0]

    engine = create_async_engine(db_url, connect_args={"ssl": True})
    email = "stevejford007@gmail.com"

    async with AsyncSession(engine) as session:
        # Get all tables
        tables_res = await session.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'"))
        tables = [row[0] for row in tables_res]
        print(f"Tables found: {tables}")

        for table in tables:
            # Get columns for this table
            cols_res = await session.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_name='{table}'"))
            cols = [row[0] for row in cols_res]
            
            for col in cols:
                # Basic check if col name has 'email' or 'name' or 'id'
                # But better just check all columns for the email string
                try:
                    query = text(f"SELECT COUNT(*) FROM {table} WHERE CAST({col} AS TEXT) ILIKE :val")
                    res = await session.execute(query, {"val": f"%{email}%"})
                    count = res.scalar()
                    if count > 0:
                        print(f"FOUND match in table '{table}', column '{col}': {count} occurrences")
                        # Fetch the data
                        data_res = await session.execute(text(f"SELECT * FROM {table} WHERE CAST({col} AS TEXT) ILIKE :val"), {"val": f"%{email}%"})
                        for row in data_res.mappings().all():
                            print(f"  - ROW DATA: {dict(row)}")
                except Exception as e:
                    # Some columns might not be castable or searchable, skip
                    pass

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(deep_check())
