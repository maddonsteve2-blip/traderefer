const { Pool } = require('pg');
require('dotenv').config({ path: 'apps/web/.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
    const res = await pool.query(`
        SELECT business_name,
               array_length(string_to_array(trim(both '{}' from photo_urls::text), ','), 1) as photo_count,
               CASE WHEN description IS NOT NULL THEN substring(description, 1, 80) ELSE 'NO DESC' END as desc_preview
        FROM businesses
        WHERE state = 'ACT' AND data_source = 'Google Places'
        ORDER BY created_at DESC
        LIMIT 15
    `);
    
    console.log('\n=== Recent ACT businesses (photo count + description) ===\n');
    for (const row of res.rows) {
        console.log(`${(row.photo_count || 0).toString().padStart(2)} photos | ${row.desc_preview.padEnd(80)} | ${row.business_name}`);
    }

    // Summary stats
    const summary = await pool.query(`
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE description IS NOT NULL) as with_desc,
            COUNT(*) FILTER (WHERE photo_urls IS NOT NULL AND photo_urls::text != '{}') as with_photos,
            ROUND(AVG(array_length(string_to_array(trim(both '{}' from photo_urls::text), ','), 1))) as avg_photos
        FROM businesses
        WHERE state = 'ACT' AND data_source = 'Google Places'
    `);
    const s = summary.rows[0];
    console.log(`\n--- Summary: ${s.total} total | ${s.with_desc} with description | ${s.with_photos} with photos | avg ${s.avg_photos} photos ---`);
    
    await pool.end();
}

check().catch(e => { console.error(e); process.exit(1); });
