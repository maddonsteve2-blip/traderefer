const { Pool } = require('pg');
require('dotenv').config({ path: 'apps/web/.env.local' });
const db = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
    console.log('Adding scrape tracking columns...');
    await db.query(`
        ALTER TABLE businesses
        ADD COLUMN IF NOT EXISTS scraped_description BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS scraped_logo BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS scraped_email BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS scraped_phone BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS website_scraped_at TIMESTAMPTZ
    `);
    console.log('Done — columns added.');
    await db.end();
})();
