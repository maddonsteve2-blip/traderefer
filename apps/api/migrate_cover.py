import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def run():
    e = create_async_engine(
        "postgresql+asyncpg://neondb_owner:npg_qsxKWSvGyk65@ep-steep-violet-aikad8l7-pooler.c-4.us-east-1.aws.neon.tech/neondb",
        echo=False
    )
    async with e.begin() as c:
        await c.execute(text("ALTER TABLE businesses ADD COLUMN IF NOT EXISTS cover_photo_url TEXT"))
        print("Done - cover_photo_url column added")
    await e.dispose()

asyncio.run(run())
