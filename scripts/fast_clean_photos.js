/**
 * FAST CLEAN PHOTOS
 * 
 * Uses bulk SQL to quickly remove broken Google API URLs.
 * Runs 3 fast SQL statements instead of 33K individual updates.
 */

const { Pool } = require('pg');
require('dotenv').config({ path: 'apps/web/.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fastClean() {
    console.log('=== Fast Photo Cleanup (Bulk SQL) ===\n');

    // Step 1: NULL out broken logo_urls
    console.log('Step 1: Cleaning broken logo_urls...');
    const r1 = await pool.query(`
        UPDATE businesses 
        SET logo_url = NULL, updated_at = now()
        WHERE logo_url LIKE '%places.googleapis.com%'
    `);
    console.log(`  Fixed ${r1.rowCount} broken logo_urls\n`);

    // Step 2: NULL out broken cover_photo_urls
    console.log('Step 2: Cleaning broken cover_photo_urls...');
    const r2 = await pool.query(`
        UPDATE businesses 
        SET cover_photo_url = NULL, updated_at = now()
        WHERE cover_photo_url LIKE '%places.googleapis.com%'
    `);
    console.log(`  Fixed ${r2.rowCount} broken cover_photo_urls\n`);

    // Step 3: For photo_urls, we need to filter arrays.
    // Businesses that have ONLY Google API URLs -> set to empty
    console.log('Step 3a: Emptying photo_urls that are ALL Google API URLs...');
    const r3a = await pool.query(`
        UPDATE businesses
        SET photo_urls = '{}', updated_at = now()
        WHERE photo_urls IS NOT NULL 
          AND photo_urls != '{}'
          AND NOT EXISTS (
            SELECT 1 FROM unnest(photo_urls) AS url
            WHERE url NOT LIKE '%places.googleapis.com%'
          )
    `);
    console.log(`  Cleared ${r3a.rowCount} businesses (all URLs were broken)\n`);

    // Step 3b: For businesses with MIXED URLs (some blob, some Google API) - keep only blob
    console.log('Step 3b: Filtering mixed photo_urls to keep only Blob URLs...');
    const r3b = await pool.query(`
        UPDATE businesses
        SET photo_urls = (
            SELECT COALESCE(array_agg(url), '{}')
            FROM unnest(photo_urls) AS url
            WHERE url LIKE '%blob.vercel-storage.com%'
        ), updated_at = now()
        WHERE photo_urls IS NOT NULL 
          AND photo_urls != '{}'
          AND EXISTS (
            SELECT 1 FROM unnest(photo_urls) AS url
            WHERE url LIKE '%places.googleapis.com%'
          )
          AND EXISTS (
            SELECT 1 FROM unnest(photo_urls) AS url
            WHERE url LIKE '%blob.vercel-storage.com%'
          )
    `);
    console.log(`  Filtered ${r3b.rowCount} businesses (kept only Blob URLs)\n`);

    // Step 4: Also set logo_url and cover_photo_url from remaining blob photos where possible
    console.log('Step 4: Setting logo_url from remaining Blob photos where missing...');
    const r4 = await pool.query(`
        UPDATE businesses
        SET logo_url = photo_urls[1], updated_at = now()
        WHERE logo_url IS NULL
          AND photo_urls IS NOT NULL 
          AND photo_urls != '{}'
          AND array_length(photo_urls, 1) > 0
          AND photo_urls[1] LIKE '%blob.vercel-storage.com%'
    `);
    console.log(`  Set ${r4.rowCount} logo_urls from Blob photos\n`);

    console.log('Step 5: Setting cover_photo_url from remaining Blob photos where missing...');
    const r5 = await pool.query(`
        UPDATE businesses
        SET cover_photo_url = CASE 
            WHEN array_length(photo_urls, 1) > 1 THEN photo_urls[2]
            ELSE photo_urls[1]
        END, updated_at = now()
        WHERE cover_photo_url IS NULL
          AND photo_urls IS NOT NULL 
          AND photo_urls != '{}'
          AND array_length(photo_urls, 1) > 0
    `);
    console.log(`  Set ${r5.rowCount} cover_photo_urls from remaining photos\n`);

    // Final stats
    const stats = await pool.query(`
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE photo_urls IS NOT NULL AND photo_urls != '{}' AND array_length(photo_urls, 1) > 0) as with_photos,
            COUNT(*) FILTER (WHERE logo_url IS NOT NULL AND logo_url != '') as with_logo,
            COUNT(*) FILTER (WHERE cover_photo_url IS NOT NULL AND cover_photo_url != '') as with_cover
        FROM businesses WHERE status = 'active'
    `);
    
    console.log('========== COMPLETE ==========');
    console.log(`Total active businesses: ${stats.rows[0].total}`);
    console.log(`With photos: ${stats.rows[0].with_photos}`);
    console.log(`With logo: ${stats.rows[0].with_logo}`);
    console.log(`With cover: ${stats.rows[0].with_cover}`);

    await pool.end();
}

fastClean().catch(e => { console.error('FATAL:', e); process.exit(1); });
