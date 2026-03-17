const { Pool } = require('pg');
require('dotenv').config({ path: 'apps/web/.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
    // Overall stats across all states
    const res = await pool.query(`
        SELECT state,
               COUNT(*) as total,
               COUNT(*) FILTER (WHERE description IS NULL) as no_desc,
               COUNT(*) FILTER (WHERE description IS NOT NULL) as has_desc,
               COUNT(*) FILTER (WHERE photo_urls IS NULL OR photo_urls::text = '{}') as no_photos,
               ROUND(AVG(COALESCE(array_length(string_to_array(trim(both '{}' from photo_urls::text), ','), 1), 0))) as avg_photos
        FROM businesses
        WHERE data_source = 'Google Places' AND status = 'active'
        GROUP BY state
        ORDER BY total DESC
    `);

    console.log('\n=== Description & Photo stats by state ===\n');
    console.log('State | Total  | No Desc | Has Desc | No Photos | Avg Photos');
    console.log('------|--------|---------|----------|-----------|----------');
    let totalAll = 0, noDescAll = 0, hasDescAll = 0, noPhotosAll = 0;
    for (const r of res.rows) {
        totalAll += parseInt(r.total);
        noDescAll += parseInt(r.no_desc);
        hasDescAll += parseInt(r.has_desc);
        noPhotosAll += parseInt(r.no_photos);
        console.log(`${r.state.padEnd(5)} | ${String(r.total).padStart(6)} | ${String(r.no_desc).padStart(7)} | ${String(r.has_desc).padStart(8)} | ${String(r.no_photos).padStart(9)} | ${String(r.avg_photos).padStart(10)}`);
    }
    console.log(`ALL   | ${String(totalAll).padStart(6)} | ${String(noDescAll).padStart(7)} | ${String(hasDescAll).padStart(8)} | ${String(noPhotosAll).padStart(9)} |`);
    console.log(`\nMissing descriptions: ${noDescAll} / ${totalAll} (${((noDescAll/totalAll)*100).toFixed(1)}%)`);
    console.log(`Missing photos: ${noPhotosAll} / ${totalAll} (${((noPhotosAll/totalAll)*100).toFixed(1)}%)`);

    await pool.end();
}

check().catch(e => { console.error(e); process.exit(1); });
