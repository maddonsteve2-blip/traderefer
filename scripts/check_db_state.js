const { Pool } = require('pg');
require('dotenv').config({ path: 'apps/web/.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
    const r = await pool.query(`
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE google_maps_url IS NOT NULL AND google_maps_url != '') as with_gmaps,
            COUNT(*) FILTER (WHERE source_url LIKE '%maps.google%' OR source_url LIKE '%goo.gl%') as with_cid_source,
            COUNT(*) FILTER (WHERE photo_urls IS NULL OR photo_urls = '{}' OR array_length(photo_urls,1) IS NULL) as no_photos,
            COUNT(*) FILTER (WHERE photo_urls IS NOT NULL AND photo_urls != '{}' AND array_length(photo_urls,1) > 0) as with_photos,
            COUNT(*) FILTER (WHERE logo_url IS NOT NULL AND logo_url != '') as with_logo,
            COUNT(*) FILTER (WHERE logo_url LIKE '%blob.vercel%') as blob_logos,
            COUNT(*) FILTER (WHERE cover_photo_url IS NOT NULL AND cover_photo_url != '') as with_cover
        FROM businesses WHERE status = 'active'
    `);
    console.log(JSON.stringify(r.rows[0], null, 2));
    await pool.end();
})();
