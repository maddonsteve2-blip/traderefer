require('dotenv').config({ path: require('path').join(__dirname, '..', 'apps', 'web', '.env.local') });
const { Pool } = require('pg');
const db = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    const r = await db.query(`
        SELECT 
            COUNT(*) as total_active,
            COUNT(*) FILTER (WHERE website IS NOT NULL AND website != '') as has_website,
            COUNT(*) FILTER (WHERE description IS NOT NULL AND description != '') as has_desc,
            COUNT(*) FILTER (WHERE logo_url IS NOT NULL AND logo_url != '') as has_logo,
            COUNT(*) FILTER (WHERE business_email IS NOT NULL AND business_email != '') as has_email,
            COUNT(*) FILTER (WHERE business_phone IS NOT NULL AND business_phone != '') as has_phone,
            COUNT(*) FILTER (WHERE website_scraped = true) as scraped_true
        FROM businesses WHERE status = 'active'
    `);
    console.log('=== DB Stats (active businesses) ===');
    console.log(JSON.stringify(r.rows[0], null, 2));

    // Check if website_scraped column exists
    const col = await db.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'businesses' AND column_name = 'website_scraped'
    `);
    console.log('\nwebsite_scraped column exists:', col.rows.length > 0);

    // Sample Facebook/social URLs still in DB
    const social = await db.query(`
        SELECT COUNT(*) as facebook_urls FROM businesses 
        WHERE status = 'active' AND website ILIKE '%facebook.com%'
    `);
    console.log('\nFacebook URLs in website field:', social.rows[0].facebook_urls);

    const social2 = await db.query(`
        SELECT COUNT(*) as social_urls FROM businesses 
        WHERE status = 'active' AND website ~* '(facebook\\.com|instagram\\.com|twitter\\.com|linkedin\\.com|youtube\\.com|tiktok\\.com)'
    `);
    console.log('All social media URLs:', social2.rows[0].social_urls);

    // How many have website_scraped = true (already attempted)
    const scraped = await db.query(`
        SELECT 
            COUNT(*) FILTER (WHERE website_scraped = true AND (description IS NULL OR description = '')) as scraped_no_desc,
            COUNT(*) FILTER (WHERE website_scraped = true AND (logo_url IS NULL OR logo_url = '')) as scraped_no_logo,
            COUNT(*) FILTER (WHERE website_scraped = true AND (business_email IS NULL OR business_email = '')) as scraped_no_email
        FROM businesses WHERE status = 'active'
    `);
    console.log('\nScraped but still missing (permanent failures):');
    console.log(JSON.stringify(scraped.rows[0], null, 2));
}

main().catch(console.error).finally(() => db.end());
