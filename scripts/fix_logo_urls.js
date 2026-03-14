/**
 * Restore logo_url from photo_urls[1] (Postgres 1-indexed) for businesses
 * where logo_url was incorrectly set to NULL.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', 'apps', 'web', '.env.local') });
const pg = require('pg');

async function run() {
    const db = new pg.Client(process.env.DATABASE_URL);
    await db.connect();

    const result = await db.query(`
        UPDATE businesses 
        SET logo_url = photo_urls[1]
        WHERE logo_url IS NULL 
          AND photo_urls IS NOT NULL 
          AND array_length(photo_urls, 1) > 0
        RETURNING id, business_name
    `);

    console.log(`Restored logos for ${result.rowCount} businesses`);
    await db.end();
}

run().catch(e => { console.error(e); process.exit(1); });
