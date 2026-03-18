const { Pool } = require('pg');
require('dotenv').config({ path: 'apps/web/.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
    // What do source_urls look like for businesses with no description?
    const res = await pool.query(`
        SELECT 
            CASE 
                WHEN source_url IS NULL THEN 'NULL'
                WHEN source_url LIKE '%ChIJ%' THEN 'Has PlaceID'
                WHEN source_url LIKE '%google.com/maps%' THEN 'Google Maps URL (no ChIJ)'
                WHEN source_url LIKE '%maps.google%' THEN 'maps.google URL'
                ELSE 'Other: ' || substring(source_url, 1, 50)
            END as url_type,
            COUNT(*) as cnt,
            COUNT(*) FILTER (WHERE description IS NULL) as no_desc,
            COUNT(*) FILTER (WHERE photo_urls IS NULL OR photo_urls::text = '{}') as no_photos
        FROM businesses
        WHERE status = 'active' AND data_source = 'Google Places'
        GROUP BY url_type
        ORDER BY cnt DESC
    `);

    console.log('\n=== source_url types for Google Places businesses ===\n');
    for (const r of res.rows) {
        console.log(`${String(r.cnt).padStart(6)} total | ${String(r.no_desc).padStart(6)} no desc | ${String(r.no_photos).padStart(6)} no photo | ${r.url_type}`);
    }

    // Sample some without ChIJ
    const samples = await pool.query(`
        SELECT business_name, source_url, suburb, state
        FROM businesses
        WHERE status = 'active' AND data_source = 'Google Places'
          AND description IS NULL
          AND source_url IS NOT NULL
          AND source_url NOT LIKE '%ChIJ%'
        LIMIT 5
    `);
    console.log('\n=== Sample businesses without Place ID ===\n');
    for (const r of samples.rows) {
        console.log(`${r.business_name} | ${r.suburb}, ${r.state} | ${(r.source_url || '').substring(0, 100)}`);
    }

    // How many have NO source_url at all?
    const nullUrl = await pool.query(`
        SELECT COUNT(*) as cnt FROM businesses 
        WHERE status = 'active' AND data_source = 'Google Places' AND source_url IS NULL
    `);
    console.log(`\nBusinesses with NULL source_url: ${nullUrl.rows[0].cnt}`);

    await pool.end();
}

check().catch(e => { console.error(e); process.exit(1); });
