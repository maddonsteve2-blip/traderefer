/**
 * CHECK ARRAY DUPLICATES
 * 
 * Check if photo_urls arrays contain duplicate values in the database
 */

const { Pool } = require('pg');
require('dotenv').config({ path: 'apps/web/.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkArrayDuplicates() {
    console.log('Checking for duplicate photo URLs in database arrays...\n');

    // Get businesses and check their photo arrays
    const result = await pool.query(`
        SELECT id, business_name, slug, suburb, state, photo_urls
        FROM businesses
        WHERE status = 'active' AND photo_urls IS NOT NULL AND photo_urls != '{}'
        ORDER BY created_at DESC
        LIMIT 100
    `);

    let businessesWithDuplicates = 0;
    let totalDuplicates = 0;

    for (const biz of result.rows) {
        let urls;
        
        // Handle different photo_urls formats
        if (Array.isArray(biz.photo_urls)) {
            urls = biz.photo_urls;
        } else if (typeof biz.photo_urls === 'string') {
            urls = biz.photo_urls.replace(/[{}]/g, '').split(',').filter(u => u && u.length > 5);
        } else {
            continue;
        }

        if (urls.length === 0) continue;

        // Check for duplicates in the array
        const urlCounts = new Map();
        urls.forEach(url => {
            urlCounts.set(url, (urlCounts.get(url) || 0) + 1);
        });

        const duplicates = Array.from(urlCounts.entries()).filter(([url, count]) => count > 1);
        
        if (duplicates.length > 0) {
            businessesWithDuplicates++;
            console.log(`❌ ${biz.business_name} | ${biz.suburb}, ${biz.state} | ${urls.length} total URLs`);
            
            duplicates.forEach(([url, count]) => {
                console.log(`   Duplicate (${count}x): ${url.substring(0, 80)}...`);
                totalDuplicates += count - 1; // Count extra duplicates
            });
        }
    }

    console.log(`\n========== COMPLETE ==========`);
    console.log(`Businesses checked: ${result.rows.length}`);
    console.log(`Businesses with array duplicates: ${businessesWithDuplicates}`);
    console.log(`Total duplicate entries: ${totalDuplicates}`);

    await pool.end();
}

checkArrayDuplicates().catch(e => { console.error('FATAL:', e); process.exit(1); });
