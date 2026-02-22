import asyncio
import asyncpg
import os
from dotenv import load_dotenv

async def run():
    # Try different paths
    load_dotenv('apps/api/.env.local')
    url = os.getenv('DATABASE_URL')
    if not url:
        load_dotenv('.env.local')
        url = os.getenv('DATABASE_URL')
        
    print(f"Connecting to {url}")
    try:
        conn = await asyncpg.connect(url)
        print("Connected!")
        await conn.close()
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(run())
