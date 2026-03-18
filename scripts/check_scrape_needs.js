const { Pool } = require('pg');
require('dotenv').config({ path: 'apps/web/.env.local' });
const db = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
    const r = await db.query(`
        SELECT 
            COUNT(*) as total_active,
            COUNT(*) FILTER (WHERE website IS NOT NULL AND website != '') as has_website,
            COUNT(*) FILTER (WHERE website_scraped IS NOT TRUE AND website IS NOT NULL AND website != '') as unscraped,
            COUNT(*) FILTER (WHERE (description IS NULL OR description = '') AND website IS NOT NULL AND website != '') as need_desc,
            COUNT(*) FILTER (WHERE (business_email IS NULL OR business_email = '') AND website IS NOT NULL AND website != '') as need_email,
            COUNT(*) FILTER (WHERE (business_phone IS NULL OR business_phone = '') AND website IS NOT NULL AND website != '') as need_phone,
            COUNT(*) FILTER (WHERE (logo_url IS NULL OR logo_url = '') AND website IS NOT NULL AND website != '') as need_logo
        FROM businesses WHERE status = 'active'
    `);
    console.log(JSON.stringify(r.rows[0], null, 2));
    await db.end();
})();
