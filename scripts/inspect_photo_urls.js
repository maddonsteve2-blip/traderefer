/**
 * INSPECT PHOTO URLS
 * 
 * Look at the actual photo URLs to find the real duplicate pattern
 */

const { Pool } = require('pg');
require('dotenv').config({ path: 'apps/web/.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function inspect() {
    // Check Westcore Plumbing (from the screenshot)
    const result = await pool.query(`
        SELECT id, business_name, slug, suburb, state, photo_urls
        FROM businesses
        WHERE business_name ILIKE '%westcore plumbing%'
        OR business_name ILIKE '%westcor%'
        LIMIT 5
    `);

    if (result.rows.length === 0) {
        console.log('Westcore not found, checking random businesses with exactly 4 photos...');
    }

    // Also get businesses with exactly 4 photos (user said they all have 4)
    const result2 = await pool.query(`
        SELECT id, business_name, slug, suburb, state, photo_urls
        FROM businesses
        WHERE status = 'active' 
          AND photo_urls IS NOT NULL 
          AND photo_urls != '{}'
          AND array_length(photo_urls, 1) = 4
        ORDER BY updated_at DESC
        LIMIT 10
    `);

    const allRows = [...result.rows, ...result2.rows];
    
    for (const biz of allRows) {
        console.log(`\n========================================`);
        console.log(`${biz.business_name} | ${biz.suburb}, ${biz.state} | slug: ${biz.slug}`);
        console.log(`========================================`);
        
        const urls = Array.isArray(biz.photo_urls) ? biz.photo_urls : [];
        console.log(`Total URLs: ${urls.length}`);
        
        // Extract the photo ID (the part after /photos/)
        const photoIds = urls.map(url => {
            const match = url.match(/\/photos\/([^/]+)\//);
            return match ? match[1] : 'unknown';
        });
        
        // Extract maxWidthPx
        const widths = urls.map(url => {
            const match = url.match(/maxWidthPx=(\d+)/);
            return match ? match[1] : 'unknown';
        });

        // Extract the Place ID
        const placeIds = urls.map(url => {
            const match = url.match(/\/places\/([^/]+)\//);
            return match ? match[1] : 'unknown';
        });

        urls.forEach((url, i) => {
            console.log(`\n  Photo ${i + 1}:`);
            console.log(`    Place ID: ${placeIds[i]}`);
            console.log(`    Photo ID: ${photoIds[i].substring(0, 30)}...`);
            console.log(`    Width: ${widths[i]}`);
            console.log(`    Full URL length: ${url.length}`);
        });

        // Check for duplicate photo IDs
        const idCounts = {};
        photoIds.forEach(id => { idCounts[id] = (idCounts[id] || 0) + 1; });
        const dupIds = Object.entries(idCounts).filter(([_, count]) => count > 1);
        
        if (dupIds.length > 0) {
            console.log(`\n  ❌ DUPLICATE PHOTO IDs FOUND:`);
            dupIds.forEach(([id, count]) => console.log(`    ${count}x: ${id.substring(0, 40)}...`));
        }

        // Check for duplicate widths (same photo, different size)
        const widthCounts = {};
        widths.forEach(w => { widthCounts[w] = (widthCounts[w] || 0) + 1; });
        console.log(`\n  Width distribution: ${JSON.stringify(widthCounts)}`);
    }

    await pool.end();
}

inspect().catch(e => { console.error('FATAL:', e); process.exit(1); });
