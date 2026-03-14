/**
 * Null out logo_url for Google Places businesses (not real logos).
 * Keeps DataForSEO logos intact (those have real item.logo field).
 * Businesses without logos will show initials avatar.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', 'apps', 'web', '.env.local') });
const pg = require('pg');

async function run() {
    const db = new pg.Client(process.env.DATABASE_URL);
    await db.connect();

    const result = await db.query(`
        UPDATE businesses 
        SET logo_url = NULL 
        WHERE logo_url IS NOT NULL 
          AND data_source = 'Google Places'
        RETURNING id, business_name
    `);

    console.log(`Cleared fake logos for ${result.rowCount} Google Places businesses (now showing initials)`);

    const kept = await db.query(`
        SELECT count(*) FROM businesses WHERE logo_url IS NOT NULL
    `);
    console.log(`Kept ${kept.rows[0].count} real logos (DataForSEO etc.)`);

    await db.end();
}

run().catch(e => { console.error(e); process.exit(1); });
