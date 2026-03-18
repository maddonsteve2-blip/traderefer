/**
 * DIAGNOSE PHOTOS
 * 
 * Check how many photos are broken Google API URLs vs working Blob URLs
 * and test if Google API URLs actually resolve to images
 */

const { Pool } = require('pg');
require('dotenv').config({ path: 'apps/web/.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function diagnose() {
    console.log('=== PHOTO URL DIAGNOSIS ===\n');

    // 1. Count URL types
    const result = await pool.query(`
        SELECT id, business_name, photo_urls, logo_url, cover_photo_url
        FROM businesses
        WHERE status = 'active' AND photo_urls IS NOT NULL AND photo_urls != '{}'
        LIMIT 5000
    `);

    let googleApiCount = 0;
    let blobCount = 0;
    let otherCount = 0;
    let mixedCount = 0;
    let totalUrls = 0;
    let googleApiUrls = 0;
    let blobUrls = 0;
    let otherUrls = 0;

    for (const biz of result.rows) {
        const urls = Array.isArray(biz.photo_urls) ? biz.photo_urls : [];
        let hasGoogle = false;
        let hasBlob = false;

        for (const url of urls) {
            totalUrls++;
            if (url.includes('places.googleapis.com')) {
                googleApiUrls++;
                hasGoogle = true;
            } else if (url.includes('blob.vercel-storage.com')) {
                blobUrls++;
                hasBlob = true;
            } else {
                otherUrls++;
            }
        }

        if (hasGoogle && hasBlob) mixedCount++;
        else if (hasGoogle) googleApiCount++;
        else if (hasBlob) blobCount++;
        else otherCount++;
    }

    console.log(`Businesses checked: ${result.rows.length}`);
    console.log(`\nBusinesses by photo URL type:`);
    console.log(`  Google API URLs only: ${googleApiCount}`);
    console.log(`  Blob URLs only: ${blobCount}`);
    console.log(`  Mixed (both): ${mixedCount}`);
    console.log(`  Other: ${otherCount}`);

    console.log(`\nTotal photo URLs: ${totalUrls}`);
    console.log(`  Google API: ${googleApiUrls} (BROKEN - can't load in browser)`);
    console.log(`  Blob: ${blobUrls} (WORKING)`);
    console.log(`  Other: ${otherUrls}`);

    // 2. Test if a Google API URL actually resolves
    const sampleBiz = result.rows.find(b => {
        const urls = Array.isArray(b.photo_urls) ? b.photo_urls : [];
        return urls.some(u => u.includes('places.googleapis.com'));
    });

    if (sampleBiz) {
        const sampleUrl = sampleBiz.photo_urls.find(u => u.includes('places.googleapis.com'));
        console.log(`\n=== TESTING GOOGLE API URL ===`);
        console.log(`Business: ${sampleBiz.business_name}`);
        console.log(`URL: ${sampleUrl.substring(0, 100)}...`);
        
        try {
            const res = await fetch(sampleUrl, { redirect: 'follow' });
            console.log(`Status: ${res.status}`);
            console.log(`Content-Type: ${res.headers.get('content-type')}`);
            console.log(`Content-Length: ${res.headers.get('content-length')}`);
            
            if (res.ok) {
                console.log(`✅ URL works server-side (but may be blocked in browser by referrer restrictions)`);
            } else {
                console.log(`❌ URL returns error: ${res.status} ${res.statusText}`);
                const body = await res.text();
                console.log(`Response: ${body.substring(0, 200)}`);
            }
        } catch (error) {
            console.log(`❌ Fetch error: ${error.message}`);
        }
    }

    // 3. Count businesses with NO photos at all
    const noPhotos = await pool.query(`
        SELECT COUNT(*) as cnt FROM businesses
        WHERE status = 'active' AND (photo_urls IS NULL OR photo_urls = '{}')
    `);
    console.log(`\nBusinesses with NO photos: ${noPhotos.rows[0].cnt}`);

    // 4. Count total businesses
    const total = await pool.query(`SELECT COUNT(*) as cnt FROM businesses WHERE status = 'active'`);
    console.log(`Total active businesses: ${total.rows[0].cnt}`);

    // 5. Check logo_url and cover_photo_url types
    const logoCheck = await pool.query(`
        SELECT 
            COUNT(*) FILTER (WHERE logo_url LIKE '%places.googleapis.com%') as google_logos,
            COUNT(*) FILTER (WHERE logo_url LIKE '%blob.vercel-storage.com%') as blob_logos,
            COUNT(*) FILTER (WHERE logo_url IS NULL OR logo_url = '') as no_logos
        FROM businesses WHERE status = 'active'
    `);
    console.log(`\nLogo URLs:`);
    console.log(`  Google API: ${logoCheck.rows[0].google_logos}`);
    console.log(`  Blob: ${logoCheck.rows[0].blob_logos}`);
    console.log(`  None: ${logoCheck.rows[0].no_logos}`);

    await pool.end();
}

diagnose().catch(e => { console.error('FATAL:', e); process.exit(1); });
