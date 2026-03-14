const pg = require('pg');
require('dotenv').config({ path: 'apps/web/.env.local' });

const client = new pg.Client(process.env.DATABASE_URL);

(async () => {
    await client.connect();
    try {
        await client.query('ALTER TABLE businesses ADD COLUMN IF NOT EXISTS licence_number TEXT');
        await client.query("ALTER TABLE businesses ADD COLUMN IF NOT EXISTS payment_methods TEXT[] DEFAULT '{}'");
        await client.query('ALTER TABLE businesses ADD COLUMN IF NOT EXISTS facebook_url TEXT');
        await client.query('ALTER TABLE businesses ADD COLUMN IF NOT EXISTS instagram_url TEXT');
        await client.query('ALTER TABLE businesses ADD COLUMN IF NOT EXISTS linkedin_url TEXT');
        await client.query('ALTER TABLE businesses ADD COLUMN IF NOT EXISTS tiktok_url TEXT');
        console.log('Migration 016 complete - added licence_number, payment_methods, social links');
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await client.end();
    }
})();
