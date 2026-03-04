"""
Create a fresh test lead to test the twilio_from_number fix.
This will delete any existing test leads and create a new one.
"""
import asyncio
import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

load_dotenv(".env.local")

async def create_fresh_test_lead():
    db_url = os.getenv("DATABASE_URL").replace("postgresql://", "postgresql+asyncpg://")
    engine = create_async_engine(db_url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as db:
        # 1. Delete old test leads
        print("🗑️  Deleting old test leads...")
        await db.execute(text("""
            DELETE FROM leads 
            WHERE consumer_phone = '+61413600191' 
            AND consumer_name = 'Steve Test'
        """))
        await db.commit()
        
        # 2. Get Stephen's Handyman business ID
        biz_result = await db.execute(text("""
            SELECT id, business_name, trade_category, referral_fee_cents
            FROM businesses 
            WHERE slug = 'stephen-s-handyman'
            LIMIT 1
        """))
        biz = biz_result.mappings().first()
        
        if not biz:
            print("❌ Stephen's Handyman not found")
            return
        
        print(f"✅ Found business: {biz['business_name']}")
        
        # 3. Create new lead using the API endpoint (to trigger Q1 SMS with twilio_from_number)
        import httpx
        
        lead_data = {
            "business_id": str(biz["id"]),
            "consumer_name": "Steve Test",
            "consumer_phone": "+61413600191",
            "consumer_email": "stevejford007@gmail.com",
            "consumer_suburb": "Brisbane CBD",
            "consumer_address": "123 Test St, Brisbane",
            "job_description": "Blocked toilet needs fixing",
            "lead_urgency": "hot"
        }
        
        print("\n📤 Creating new lead via API...")
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "https://api.traderefer.au/leads/",
                json=lead_data
            )
            
            if resp.status_code == 200:
                result = resp.json()
                lead_id = result["id"]
                print(f"✅ Lead created: {lead_id}")
                print(f"📱 Q1 SMS should be sent to +61413600191")
                
                # Check if twilio_from_number was set
                await asyncio.sleep(2)
                check = await db.execute(text("""
                    SELECT id, screening_status, twilio_from_number
                    FROM leads
                    WHERE id = :id
                """), {"id": lead_id})
                lead = check.mappings().first()
                
                if lead and lead["twilio_from_number"]:
                    print(f"✅ twilio_from_number stored: {lead['twilio_from_number']}")
                    print(f"✅ All future SMS will use this same number!")
                else:
                    print("⚠️  twilio_from_number not set - deployment may not be live yet")
                
                print("\n📱 Check your phone for Q1 SMS and reply to test the flow!")
            else:
                print(f"❌ Failed to create lead: {resp.status_code}")
                print(resp.text)

asyncio.run(create_fresh_test_lead())
