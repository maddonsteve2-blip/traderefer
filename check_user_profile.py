import os
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import text
from dotenv import load_dotenv

async def check_email():
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
        # Check businesses table
        biz_query = text("SELECT * FROM businesses WHERE business_email = :email")
        biz_res = await session.execute(biz_query, {"email": email})
        biz = biz_res.mappings().all()
        
        # Check referrers table
        ref_query = text("SELECT * FROM referrers WHERE email = :email")
        ref_res = await session.execute(ref_query, {"email": email})
        ref = ref_res.mappings().all()

        print(f"Checking email: {email}")
        print(f"Results in businesses: {len(biz)}")
        for b in biz:
            print(f"  - Business: {b.get('business_name')} (ID: {b.get('id')})")
            
        print(f"Results in referrers: {len(ref)}")
        for r in ref:
            print(f"  - Referrer: {r.get('full_name')} (ID: {r.get('id')})")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_email())
