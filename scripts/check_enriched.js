const postgres = require('postgres');
require('dotenv').config({ path: 'apps/web/.env.local' });
const db = postgres(process.env.DATABASE_URL);

(async () => {
    const rows = await db`
        SELECT business_name, array_length(photo_urls, 1) as photos, enriched_at
        FROM businesses 
        WHERE status = 'active' AND enriched_at IS NOT NULL
        ORDER BY enriched_at DESC
        LIMIT 10
    `;
    console.log('Recently enriched businesses:');
    rows.forEach(r => console.log(`  ${r.business_name}: ${r.photos || 0} photos (enriched ${r.enriched_at})`));

    const total = await db`SELECT COUNT(*) as cnt FROM businesses WHERE enriched_at IS NOT NULL`;
    console.log(`\nTotal enriched: ${total[0].cnt}`);

    await db.end();
})();
