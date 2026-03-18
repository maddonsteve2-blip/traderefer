/**
 * CHECK REAL DUPLICATES
 * 
 * Check the actual database for duplicate photo URLs
 */

const { Pool } = require('pg');
require('dotenv').config({ path: 'apps/web/.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkRealDuplicates() {
    console.log('Checking actual database for duplicate photo URLs...\n');

    // Get businesses and check their photo arrays carefully
    const result = await pool.query(`
        SELECT id, business_name, slug, suburb, state, photo_urls
        FROM businesses
        WHERE status = 'active' AND photo_urls IS NOT NULL AND photo_urls != '{}'
        ORDER BY created_at DESC
        LIMIT 20
    `);

    for (const biz of result.rows) {
        console.log(`\n=== ${biz.business_name} | ${biz.suburb}, ${biz.state} ===`);
        console.log(`Raw photo_urls type: ${typeof biz.photo_urls}`);
        console.log(`Raw photo_urls: ${JSON.stringify(biz.photo_urls).substring(0, 200)}...`);
        
        let urls;
        if (Array.isArray(biz.photo_urls)) {
            urls = biz.photo_urls;
            console.log(`Array length: ${urls.length}`);
        } else if (typeof biz.photo_urls === 'string') {
            urls = biz.photo_urls.replace(/[{}]/g, '').split(',').filter(u => u && u.length > 5);
            console.log(`String parsed length: ${urls.length}`);
        } else {
            console.log('Unknown format');
            continue;
        }

        // Check for exact duplicates
        const urlCounts = new Map();
        urls.forEach(url => {
            urlCounts.set(url, (urlCounts.get(url) || 0) + 1);
        });

        const duplicates = Array.from(urlCounts.entries()).filter(([url, count]) => count > 1);
        
        if (duplicates.length > 0) {
            console.log(`❌ DUPLICATES FOUND:`);
            duplicates.forEach(([url, count]) => {
                console.log(`   ${count}x: ${url.substring(0, 80)}...`);
            });
        } else {
            console.log(`✅ No duplicates`);
        }

        // Show first few URLs
        console.log(`First 3 URLs:`);
        urls.slice(0, 3).forEach((url, i) => {
            console.log(`  ${i + 1}. ${url.substring(0, 80)}...`);
        });
    }

    await pool.end();
}

checkRealDuplicates().catch(e => { console.error('FATAL:', e); process.exit(1); });
