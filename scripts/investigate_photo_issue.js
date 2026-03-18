/**
 * INVESTIGATE PHOTO ISSUE
 * 
 * Check if logo_url/cover_photo_url are duplicating photo_urls entries,
 * and check if businesses had photos overwritten by backfill scripts.
 */

const { Pool } = require('pg');
require('dotenv').config({ path: 'apps/web/.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function investigate() {
    // 1. How many businesses have exactly 4 photos?
    const counts = await pool.query(`
        SELECT array_length(photo_urls, 1) as photo_count, COUNT(*) as biz_count
        FROM businesses
        WHERE status = 'active' AND photo_urls IS NOT NULL AND photo_urls != '{}'
        GROUP BY array_length(photo_urls, 1)
        ORDER BY biz_count DESC
    `);
    
    console.log('=== PHOTO COUNT DISTRIBUTION ===');
    for (const row of counts.rows) {
        console.log(`  ${row.photo_count} photos: ${row.biz_count} businesses`);
    }

    // 2. Check if logo_url or cover_photo_url are in photo_urls
    const overlap = await pool.query(`
        SELECT COUNT(*) as total,
            COUNT(*) FILTER (WHERE logo_url = ANY(photo_urls)) as logo_in_photos,
            COUNT(*) FILTER (WHERE cover_photo_url = ANY(photo_urls)) as cover_in_photos,
            COUNT(*) FILTER (WHERE logo_url = ANY(photo_urls) AND cover_photo_url = ANY(photo_urls)) as both_in_photos
        FROM businesses
        WHERE status = 'active' AND photo_urls IS NOT NULL AND photo_urls != '{}'
    `);
    
    console.log('\n=== LOGO/COVER OVERLAP WITH PHOTO_URLS ===');
    console.log(`  Total with photos: ${overlap.rows[0].total}`);
    console.log(`  logo_url IN photo_urls: ${overlap.rows[0].logo_in_photos}`);
    console.log(`  cover_photo_url IN photo_urls: ${overlap.rows[0].cover_in_photos}`);
    console.log(`  Both IN photo_urls: ${overlap.rows[0].both_in_photos}`);

    // 3. Check how many photos are Google Places API URLs vs blob URLs
    const sample = await pool.query(`
        SELECT id, business_name, slug, photo_urls, logo_url, cover_photo_url
        FROM businesses
        WHERE status = 'active' 
          AND photo_urls IS NOT NULL AND photo_urls != '{}'
          AND array_length(photo_urls, 1) = 4
        ORDER BY updated_at DESC
        LIMIT 5
    `);

    console.log('\n=== SAMPLE BUSINESSES WITH 4 PHOTOS ===');
    for (const biz of sample.rows) {
        console.log(`\n--- ${biz.business_name} (${biz.slug}) ---`);
        console.log(`  logo_url: ${(biz.logo_url || 'null').substring(0, 60)}...`);
        console.log(`  cover_photo_url: ${(biz.cover_photo_url || 'null').substring(0, 60)}...`);
        const urls = Array.isArray(biz.photo_urls) ? biz.photo_urls : [];
        urls.forEach((url, i) => {
            const isLogo = url === biz.logo_url;
            const isCover = url === biz.cover_photo_url;
            const flags = [isLogo ? 'SAME AS LOGO' : '', isCover ? 'SAME AS COVER' : ''].filter(Boolean).join(', ');
            console.log(`  photo_urls[${i}]: ${url.substring(0, 60)}... ${flags ? `⚠️ ${flags}` : ''}`);
        });
    }

    // 4. Check where the business profile page renders photos from
    console.log('\n=== CHECKING PROFILE PAGE RENDERING ===');
    console.log('Need to check: apps/web/app/b/[slug]/page.tsx');

    await pool.end();
}

investigate().catch(e => { console.error('FATAL:', e); process.exit(1); });
