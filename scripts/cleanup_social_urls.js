/**
 * One-time cleanup: mark social media website URLs as website_scraped = true
 * since they can never yield scrapeable business data.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', 'apps', 'web', '.env.local') });
const { Pool } = require('pg');
const db = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    const r = await db.query(`
        UPDATE businesses 
        SET website_scraped = true
        WHERE status = 'active'
          AND website ~* '(facebook\\.com|instagram\\.com|twitter\\.com|x\\.com|linkedin\\.com|youtube\\.com|tiktok\\.com)'
          AND (website_scraped IS NOT TRUE)
        RETURNING id
    `);
    console.log(`Marked ${r.rowCount} social media URLs as scraped.`);

    // Also mark permanent dead links (404/410 known patterns)
    const r2 = await db.query(`
        UPDATE businesses
        SET website_scraped = true
        WHERE status = 'active'
          AND website ~* '^https?://(www\\.)?google\\.com'
          AND (website_scraped IS NOT TRUE)
        RETURNING id
    `);
    console.log(`Marked ${r2.rowCount} Google URLs as scraped.`);
}

main().catch(console.error).finally(() => db.end());
