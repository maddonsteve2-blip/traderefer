const { Pool } = require('pg');
require('dotenv').config({ path: 'apps/web/.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
    const cols = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='business_reviews' ORDER BY ordinal_position`);
    console.log('=== business_reviews schema ===');
    cols.rows.forEach(c => console.log(`  ${c.column_name} | ${c.data_type}`));

    const count = await pool.query(`SELECT COUNT(*) as total, COUNT(DISTINCT business_id) as biz_count FROM business_reviews`);
    console.log(`\nTotal reviews: ${count.rows[0].total} across ${count.rows[0].biz_count} businesses`);

    const sample = await pool.query(`SELECT external_id, profile_name, rating, substring(review_text,1,60) as txt FROM business_reviews LIMIT 3`);
    console.log('\nSample reviews:');
    sample.rows.forEach(r => console.log(`  [${r.external_id}] ${r.profile_name} (${r.rating}★): ${r.txt}`));

    // Check how many businesses have CID URLs and what we're missing
    const missing = await pool.query(`
        SELECT 
            COUNT(*) as total_cid,
            COUNT(*) FILTER (WHERE description LIKE '%is a%rated%business%' OR description LIKE '%is a trusted%' OR description LIKE '%is a professional%') as generated_desc,
            COUNT(*) FILTER (WHERE business_email IS NULL) as no_email,
            COUNT(*) FILTER (WHERE business_phone IS NULL OR business_phone = '') as no_phone,
            COUNT(*) FILTER (WHERE website IS NULL OR website = '') as no_website
        FROM businesses 
        WHERE status = 'active' AND source_url LIKE '%maps.google.com%cid=%'
    `);
    const m = missing.rows[0];
    console.log(`\n=== CID businesses (${m.total_cid} total) ===`);
    console.log(`  Generated descriptions: ${m.generated_desc}`);
    console.log(`  Missing email: ${m.no_email}`);
    console.log(`  Missing phone: ${m.no_phone}`);
    console.log(`  Missing website: ${m.no_website}`);

    await pool.end();
}
check().catch(e => { console.error(e); process.exit(1); });
