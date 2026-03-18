const { Pool } = require('pg');
require('dotenv').config({ path: 'apps/web/.env.local' });
const db = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
    // Find columns with 'user' or 'clerk' or 'owner' in name
    const cols = await db.query(`
        SELECT table_name, column_name FROM information_schema.columns
        WHERE table_name IN ('businesses','referrers')
        AND (column_name LIKE '%clerk%' OR column_name LIKE '%user%' OR column_name LIKE '%owner%')
        ORDER BY table_name, column_name
    `);
    console.log('Relevant columns:');
    cols.rows.forEach(r => console.log(`  ${r.table_name}.${r.column_name}`));

    // Try to find admin user
    const r = await db.query(`
        SELECT id, business_name, business_email, owner_name
        FROM businesses
        WHERE business_email ILIKE '%stevejford%' OR owner_name ILIKE '%steve%'
        LIMIT 5
    `);
    console.log('\nSteve businesses:');
    r.rows.forEach(row => console.log(`  ${row.id} | ${row.business_name} | ${row.business_email} | ${row.owner_name}`));

    // Check referrers
    const r2 = await db.query(`
        SELECT id, full_name, email
        FROM referrers
        WHERE email ILIKE '%stevejford%' OR full_name ILIKE '%steve%'
        LIMIT 5
    `);
    console.log('\nSteve referrers:');
    r2.rows.forEach(row => console.log(`  ${row.id} | ${row.full_name} | ${row.email}`));

    await db.end();
})();
