const postgres = require('postgres');
require('dotenv').config({ path: 'apps/web/.env.local' });
const db = postgres(process.env.DATABASE_URL);

(async () => {
    const [biz] = await db`
        SELECT id, business_name, suburb, state, slug
        FROM businesses
        WHERE status = 'active'
          AND enriched_at IS NULL
          AND (photo_urls IS NULL OR photo_urls = '{}' OR array_length(photo_urls, 1) IS NULL)
        ORDER BY total_reviews DESC NULLS LAST
        LIMIT 1
    `;
    console.log('Testing:', biz.business_name, '-', biz.suburb, biz.state);

    const r = await fetch('https://traderefer.au/api/enrich-business', {
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
    console.log('Status:', r.status);
    const d = await r.json();
    console.log('Result:', JSON.stringify(d, null, 2));
    await db.end();
})();
