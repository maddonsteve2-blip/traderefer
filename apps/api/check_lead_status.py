"""
Check the current lead status and conversation
"""
import asyncio
import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

load_dotenv(".env.local")

async def check_lead():
    db_url = os.getenv("DATABASE_URL").replace("postgresql://", "postgresql+asyncpg://")
    engine = create_async_engine(db_url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as db:
        result = await db.execute(text("""
            SELECT id, consumer_name, consumer_phone, screening_status, 
                   screening_conversation, created_at
            FROM leads
            WHERE consumer_phone = '+61413600191'
            ORDER BY created_at DESC
            LIMIT 1
        """))
        lead = result.mappings().first()
        
        if lead:
            print(f"\n📋 Lead ID: {lead['id']}")
            print(f"👤 Consumer: {lead['consumer_name']}")
            print(f"📱 Phone: {lead['consumer_phone']}")
            print(f"📊 Status: {lead['screening_status']}")
            print(f"💬 Conversation: {lead['screening_conversation']}")
            print(f"🕐 Created: {lead['created_at']}")
        else:
            print("❌ No lead found for +61413600191")

asyncio.run(check_lead())
