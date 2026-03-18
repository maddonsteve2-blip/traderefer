const { Pool } = require('pg');
require('dotenv').config({ path: 'apps/web/.env.local' });
const db = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
    const r = await db.query(`UPDATE businesses SET website_scraped = false WHERE status = 'active' AND website IS NOT NULL AND website != ''`);
    console.log(`Reset website_scraped for ${r.rowCount} businesses`);
    await db.end();
})();
