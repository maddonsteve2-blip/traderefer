const postgres = require('postgres');
require('dotenv').config({ path: 'apps/web/.env.local' });
const db = postgres(process.env.DATABASE_URL);

(async () => {
    // Get a real business without photos
    const [biz] = await db`
        SELECT id, business_name, suburb, state, slug 
        FROM businesses 
        WHERE status = 'active' 
          AND (photo_urls IS NULL OR photo_urls = '{}' OR array_length(photo_urls, 1) IS NULL)
        LIMIT 1
    `;
    console.log('Test business:', JSON.stringify(biz));

    // Call the production enrichment endpoint
    const res = await fetch('https://traderefer.au/api/enrich-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            businessId: biz.id,
            businessName: biz.business_name,
            suburb: biz.suburb,
            state: biz.state,
            slug: biz.slug,
            currentPhotoCount: 0,
            hasEditorialDescription: false,
        }),
    });

    console.log('Status:', res.status);
    const body = await res.text();
    console.log('Response:', body.substring(0, 500));

    // Check if photos were added
    const [after] = await db`
        SELECT photo_urls, logo_url, enriched_at, LEFT(description, 100) as desc_preview
        FROM businesses WHERE id = ${biz.id}
    `;
    console.log('\nAfter enrichment:', JSON.stringify(after, null, 2));

    await db.end();
})();
