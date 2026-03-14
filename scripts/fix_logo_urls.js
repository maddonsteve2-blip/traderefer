/**
 * Fix logo_url for businesses where logo_url is the same as one of their photo_urls.
 * These are project/work photos from Google Places that were incorrectly used as logos.
 * Sets logo_url to NULL so the letter avatar shows instead.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', 'apps', 'web', '.env.local') });
const pg = require('pg');

async function run() {
    const db = new pg.Client(process.env.DATABASE_URL);
    await db.connect();

    // Find businesses where logo_url appears in photo_urls array
    const result = await db.query(`
        UPDATE businesses 
        SET logo_url = NULL 
        WHERE logo_url IS NOT NULL 
          AND photo_urls IS NOT NULL 
          AND logo_url = ANY(photo_urls)
        RETURNING id, business_name, logo_url
    `);

    console.log(`Fixed ${result.rowCount} businesses:`);
    for (const row of result.rows) {
        console.log(`  - ${row.business_name} (${row.id})`);
    }

    await db.end();
}

run().catch(e => { console.error(e); process.exit(1); });
