/**
 * EMERGENCY PHOTO CLEANUP
 * 
 * Remove duplicate photo URLs from all businesses
 */

const { Pool } = require('pg');
require('dotenv').config({ path: 'apps/web/.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function emergencyCleanup() {
    console.log('🚨 EMERGENCY PHOTO CLEANUP - Removing duplicates from all businesses...\n');

    // Get all businesses with photos
    const result = await pool.query(`
        SELECT id, business_name, slug, suburb, state, photo_urls
        FROM businesses
        WHERE status = 'active' AND photo_urls IS NOT NULL AND photo_urls != '{}'
    `);

    console.log(`Found ${result.rows.length} businesses to check\n`);

    let cleaned = 0;
    let totalDuplicatesRemoved = 0;

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

        // Remove duplicates while preserving order
        const seen = new Set();
        const uniqueUrls = [];
        let duplicatesRemoved = 0;

        for (const url of urls) {
            if (!seen.has(url)) {
                seen.add(url);
                uniqueUrls.push(url);
            } else {
                duplicatesRemoved++;
            }
        }

        if (duplicatesRemoved > 0) {
            console.log(`🧹 ${biz.business_name} | ${biz.suburb}, ${biz.state}`);
            console.log(`   Before: ${urls.length} | After: ${uniqueUrls.length} | Removed: ${duplicatesRemoved}`);

            // Update database
            const photoUrlsStr = `{${uniqueUrls.join(',')}}`;
            await pool.query(`
                UPDATE businesses 
                SET photo_urls = $1, updated_at = now()
                WHERE id = $2
            `, [photoUrlsStr, biz.id]);

            cleaned++;
            totalDuplicatesRemoved += duplicatesRemoved;
        }
    }

    console.log(`\n========== COMPLETE ==========`);
    console.log(`Businesses checked: ${result.rows.length}`);
    console.log(`Businesses cleaned: ${cleaned}`);
    console.log(`Total duplicates removed: ${totalDuplicatesRemoved}`);

    await pool.end();
}

emergencyCleanup().catch(e => { console.error('FATAL:', e); process.exit(1); });
