import asyncio
import asyncpg
import os
from dotenv import load_dotenv

async def migrate():
    load_dotenv('apps/api/.env.local')
    url = os.getenv('DATABASE_URL')
    if not url:
        print("DATABASE_URL not found in apps/api/.env.local")
        return

    print(f"Connecting to database...")
    try:
        conn = await asyncpg.connect(url)
        print("Connected! Applying migration...")
        
        # SQL Migration
        sql = """
        CREATE TABLE IF NOT EXISTS projects (
            id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
            title               TEXT NOT NULL,
            description         TEXT,
            cover_photo_url     TEXT,
            is_featured         BOOLEAN NOT NULL DEFAULT FALSE,
            created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS project_photos (
            id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            url                 TEXT NOT NULL,
            created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_projects_business_id ON projects(business_id);
        CREATE INDEX IF NOT EXISTS idx_project_photos_project_id ON project_photos(project_id);
        """
        
        await conn.execute(sql)
        print("Migration applied successfully!")
        await conn.close()
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(migrate())
