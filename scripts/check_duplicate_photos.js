/**
 * CHECK DUPLICATE PHOTOS
 * 
 * Check if businesses have duplicate photo URLs in the database
 */

const { Pool } = require('pg');
require('dotenv').config({ path: 'apps/web/.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkDuplicates() {
    // Check DBM Custom Homes specifically
    const result = await pool.query(`
        SELECT id, business_name, slug, suburb, state, photo_urls
        FROM businesses
        WHERE slug = 'dbm-custom-homes-ycmqc'
    `);

    if (result.rows.length === 0) {
        console.log('Business not found');
        await pool.end();
        return;
    }

    const biz = result.rows[0];
    console.log(`\n=== ${biz.business_name} ===`);
    console.log(`Slug: ${biz.slug}`);
    console.log(`Location: ${biz.suburb}, ${biz.state}`);
    console.log(`Photo URLs: ${biz.photo_urls}`);

    // Parse and check for duplicates
    if (biz.photo_urls) {
        let urls;
        if (Array.isArray(biz.photo_urls)) {
            urls = biz.photo_urls.filter(u => u && u.length > 5);
        } else if (typeof biz.photo_urls === 'string') {
            urls = biz.photo_urls.replace(/[{}]/g, '').split(',').filter(u => u && u.length > 5);
        } else {
            urls = [];
        }
        console.log(`\nParsed ${urls.length} URLs:`);
        
        const urlSet = new Set();
        const duplicates = [];
        
        urls.forEach((url, index) => {
            if (urlSet.has(url)) {
                duplicates.push({ index: index + 1, url });
            } else {
                urlSet.add(url);
            }
            console.log(`  ${index + 1}. ${url.substring(0, 80)}...`);
        });

        if (duplicates.length > 0) {
            console.log(`\n❌ Found ${duplicates.length} duplicates:`);
            duplicates.forEach(d => {
                console.log(`    Position ${d.index}: ${d.url.substring(0, 80)}...`);
            });
        } else {
            console.log(`\n✅ No duplicates found`);
        }

        console.log(`\nUnique URLs: ${urlSet.size} | Total URLs: ${urls.length}`);
    }

    await pool.end();
}

checkDuplicates().catch(e => { console.error('FATAL:', e); process.exit(1); });
