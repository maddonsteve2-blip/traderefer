const { Pool } = require('pg');
require('dotenv').config({ path: 'apps/web/.env.local' });
const p = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
    // Check Summit Roof Restoration
    const r1 = await p.query(
        "SELECT business_name, LEFT(description, 200) as d FROM businesses WHERE business_name ILIKE '%summit roof%' LIMIT 3"
    );
    console.log('=== Summit Roof Restoration ===');
    r1.rows.forEach(x => console.log(`${x.business_name}: ${x.d}`));

    // Check remaining review-like descriptions
    const r2 = await p.query(
        "SELECT business_name, LEFT(description, 150) as d FROM businesses WHERE status='active' AND description ~* '\\m(I |we |my |our )' AND description NOT LIKE '%specialist serving%' AND description NOT LIKE '%top-rated%' AND description NOT LIKE '%provides expert%' AND description NOT LIKE '%offers %services in%' LIMIT 5"
    );
    console.log('\n=== Remaining review-like (sample) ===');
    r2.rows.forEach(x => console.log(`${x.business_name}: ${x.d}`));

    await p.end();
})();
