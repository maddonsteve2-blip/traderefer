/**
 * RAW PHOTO CHECK
 * 
 * Check actual raw photo_urls stored in DB and compare visually
 */

const { Pool } = require('pg');
require('dotenv').config({ path: 'apps/web/.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
    // Check Westcore Plumbing specifically (from screenshot)
    const result = await pool.query(`
        SELECT id, business_name, slug, photo_urls, logo_url, cover_photo_url,
               photo_urls::text as raw_text
        FROM businesses
        WHERE slug LIKE '%westcore%' OR slug LIKE '%westcor%'
        OR business_name ILIKE '%westcore%'
        LIMIT 3
    `);

    for (const biz of result.rows) {
        console.log(`\n========================================`);
        console.log(`${biz.business_name} (${biz.slug})`);
        console.log(`========================================`);
        
        // Show raw text representation
        console.log(`\nRaw DB text (first 500 chars):`);
        console.log(biz.raw_text?.substring(0, 500));
        
        console.log(`\nType of photo_urls: ${typeof biz.photo_urls}`);
        console.log(`Is array: ${Array.isArray(biz.photo_urls)}`);
        
        if (Array.isArray(biz.photo_urls)) {
            console.log(`Array length: ${biz.photo_urls.length}`);
            biz.photo_urls.forEach((url, i) => {
                console.log(`\n  [${i}] Length: ${url.length}`);
                console.log(`      URL: ${url}`);
            });
        }
        
        console.log(`\nlogo_url: ${biz.logo_url}`);
        console.log(`cover_photo_url: ${biz.cover_photo_url}`);
        
        // Check if logo/cover match any photo_urls
        if (Array.isArray(biz.photo_urls)) {
            const logoMatch = biz.photo_urls.findIndex(u => u === biz.logo_url);
            const coverMatch = biz.photo_urls.findIndex(u => u === biz.cover_photo_url);
            console.log(`\nlogo_url matches photo_urls[${logoMatch}]`);
            console.log(`cover_photo_url matches photo_urls[${coverMatch}]`);
        }
    }

    // Also check a broader sample - how many have ALL photos from same Place ID?
    const sample = await pool.query(`
        SELECT id, business_name, slug, photo_urls
        FROM businesses
        WHERE status = 'active' 
          AND photo_urls IS NOT NULL AND photo_urls != '{}'
          AND array_length(photo_urls, 1) BETWEEN 3 AND 4
        ORDER BY updated_at DESC
        LIMIT 20
    `);

    console.log('\n\n========================================');
    console.log('CHECKING IF PHOTOS ARE FROM SAME PLACE ID');
    console.log('========================================');

    for (const biz of sample.rows) {
        const urls = Array.isArray(biz.photo_urls) ? biz.photo_urls : [];
        
        // Extract photo name (the unique part after /photos/)
        const photoNames = urls.map(url => {
            const match = url.match(/\/photos\/([^/]+)\//);
            return match ? match[1].substring(0, 20) : 'unknown';
        });
        
        // Check maxWidth params
        const widths = urls.map(url => {
            const match = url.match(/maxWidthPx=(\d+)/);
            return match ? match[1] : '?';
        });
        
        const uniqueNames = new Set(photoNames);
        const allSame = uniqueNames.size === 1;
        
        console.log(`${biz.business_name}: ${urls.length} photos, ${uniqueNames.size} unique IDs, widths: [${widths.join(',')}] ${allSame ? '❌ ALL SAME!' : '✅'}`);
    }

    await pool.end();
}

check().catch(e => { console.error('FATAL:', e); process.exit(1); });
