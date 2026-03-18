const { Pool } = require('pg');
require('dotenv').config({ path: 'apps/web/.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
    const res = await pool.query(`
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE source_url LIKE '%ChIJ%') as has_placeid,
            COUNT(*) FILTER (WHERE source_url LIKE '%maps.google.com%cid=%') as still_cid
        FROM businesses WHERE status = 'active'
    `);
    
    const r = res.rows[0];
    console.log('\n=== Place ID Status ===');
    console.log(`Total active businesses: ${r.total}`);
    console.log(`With Place ID (ChIJ): ${r.has_placeid} (${((r.has_placeid/r.total)*100).toFixed(1)}%)`);
    console.log(`Still CID URLs: ${r.still_cid} (${((r.still_cid/r.total)*100).toFixed(1)}%)`);
    console.log(`Without any Google URL: ${r.total - r.has_placeid - r.still_cid}`);

    await pool.end();
}
check().catch(e => { console.error(e); process.exit(1); });
