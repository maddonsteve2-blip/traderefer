"""
Add twilio_from_number column to leads table
"""
import asyncio
import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

load_dotenv(".env.local")

async def add_column():
    db_url = os.getenv("DATABASE_URL").replace("postgresql://", "postgresql+asyncpg://")
    engine = create_async_engine(db_url)
    
    async with engine.begin() as conn:
        print("Adding twilio_from_number column to leads table...")
        
        # Add the column
        await conn.execute(text("""
            ALTER TABLE leads 
            ADD COLUMN IF NOT EXISTS twilio_from_number VARCHAR(20)
        """))
        
        print("✅ Column added successfully!")
        
        # Verify
        result = await conn.execute(text("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'leads' 
            AND column_name = 'twilio_from_number'
        """))
        
        row = result.fetchone()
        if row:
            print(f"✅ Verified: {row[0]} ({row[1]})")
        else:
            print("❌ Column not found after creation")

asyncio.run(add_column())
