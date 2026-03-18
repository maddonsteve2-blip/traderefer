const postgres = require('postgres');
require('dotenv').config({ path: 'apps/web/.env.local' });
const db = postgres(process.env.DATABASE_URL);

(async () => {
    // Check logo_url types
    const logos = await db`
        SELECT 
            COUNT(*) FILTER (WHERE logo_url IS NULL OR logo_url = '') as null_logos,
            COUNT(*) FILTER (WHERE logo_url LIKE '%blob.vercel%') as blob_logos,
            COUNT(*) FILTER (WHERE logo_url LIKE '%places.googleapis%') as google_logos,
            COUNT(*) FILTER (WHERE logo_url IS NOT NULL AND logo_url != '' AND logo_url NOT LIKE '%blob.vercel%' AND logo_url NOT LIKE '%places.googleapis%') as other_logos
        FROM businesses WHERE status = 'active'
    `;
    console.log('Logo URLs:', JSON.stringify(logos[0], null, 2));

    // Sample the "other" logos
    const otherSamples = await db`
        SELECT logo_url FROM businesses 
        WHERE status='active' AND logo_url IS NOT NULL AND logo_url != '' 
          AND logo_url NOT LIKE '%blob.vercel%' AND logo_url NOT LIKE '%places.googleapis%'
        LIMIT 5
    `;
    console.log('\nOther logo samples:');
    otherSamples.forEach(r => console.log('  ', r.logo_url?.substring(0, 100)));

    // Check photo_urls with broken entries
    const photos = await db`
        SELECT 
            COUNT(*) FILTER (WHERE photo_urls IS NOT NULL AND photo_urls != '{}' AND array_length(photo_urls,1) > 0) as with_photos,
            COUNT(*) FILTER (WHERE photo_urls IS NULL OR photo_urls = '{}' OR array_length(photo_urls,1) IS NULL) as no_photos
        FROM businesses WHERE status = 'active'
    `;
    console.log('\nPhoto URLs:', JSON.stringify(photos[0], null, 2));

    // Check if any photo_urls still contain google API URLs
    const broken = await db`
        SELECT COUNT(*) as cnt FROM businesses
        WHERE status = 'active' AND EXISTS (
            SELECT 1 FROM unnest(photo_urls) as url WHERE url LIKE '%places.googleapis%'
        )
    `;
    console.log('\nBusinesses with remaining Google API photo URLs:', broken[0].cnt);

    // Check first page of businesses (what the user sees)
    const firstPage = await db`
        SELECT business_name, logo_url IS NOT NULL as has_logo, 
               array_length(photo_urls, 1) as photo_count,
               LEFT(logo_url, 60) as logo_preview
        FROM businesses WHERE status = 'active'
        ORDER BY total_reviews DESC NULLS LAST
        LIMIT 15
    `;
    console.log('\nFirst page businesses:');
    firstPage.forEach(r => console.log(`  ${r.business_name}: logo=${r.has_logo} photos=${r.photo_count || 0} | ${r.logo_preview || 'NULL'}`));

    await db.end();
})();
