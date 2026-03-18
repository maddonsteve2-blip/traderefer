/**
 * CLEAN DUPLICATE PHOTOS
 * 
 * Remove duplicate photo URLs from all businesses
 */

const { Pool } = require('pg');
require('dotenv').config({ path: 'apps/web/.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function cleanDuplicates() {
    console.log('Checking for businesses with duplicate photos...\n');

    // Get businesses with photo URLs
    const result = await pool.query(`
        SELECT id, business_name, slug, suburb, state, photo_urls
        FROM businesses
        WHERE status = 'active' AND photo_urls IS NOT NULL AND photo_urls != '{}'
        ORDER BY created_at DESC
        LIMIT 1000
    `);

    let cleaned = 0;
    let duplicatesFound = 0;

    for (const biz of result.rows) {
        let urls;
        if (Array.isArray(biz.photo_urls)) {
            urls = biz.photo_urls.filter(u => u && u.length > 5);
        } else if (typeof biz.photo_urls === 'string') {
            urls = biz.photo_urls.replace(/[{}]/g, '').split(',').filter(u => u && u.length > 5);
        } else {
            continue;
        }

        if (urls.length === 0) continue;

        // Check for duplicates
        const urlSet = new Set();
        const uniqueUrls = [];
        let hasDuplicates = false;

        for (const url of urls) {
            if (!urlSet.has(url)) {
                urlSet.add(url);
                uniqueUrls.push(url);
            } else {
                hasDuplicates = true;
            }
        }

        if (hasDuplicates) {
            duplicatesFound++;
            console.log(`🧹 Cleaning duplicates for ${biz.business_name} | ${biz.suburb}, ${biz.state}`);
            console.log(`   Before: ${urls.length} URLs | After: ${uniqueUrls.length} URLs`);

            // Update database with deduplicated URLs
            const photoUrlsStr = `{${uniqueUrls.join(',')}}`;
            await pool.query(`
                UPDATE businesses 
                SET photo_urls = $1, updated_at = now()
                WHERE id = $2
            `, [photoUrlsStr, biz.id]);

            cleaned++;
        }
    }

    console.log(`\n========== COMPLETE ==========`);
    console.log(`Businesses checked: ${result.rows.length}`);
    console.log(`Businesses with duplicates: ${duplicatesFound}`);
    console.log(`Businesses cleaned: ${cleaned}`);

    await pool.end();
}

cleanDuplicates().catch(e => { console.error('FATAL:', e); process.exit(1); });
