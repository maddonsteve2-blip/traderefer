/**
 * CLEAN BROKEN PHOTOS
 * 
 * Remove all broken Google Places API URLs from photo_urls, logo_url, cover_photo_url.
 * Keep only working Vercel Blob URLs.
 * 
 * Usage: node scripts/clean_broken_photos.js [--dry-run]
 */

const { Pool } = require('pg');
require('dotenv').config({ path: 'apps/web/.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

async function clean() {
    console.log(`=== Clean Broken Photo URLs ===${DRY_RUN ? ' (DRY RUN)' : ''}\n`);

    // Get all businesses with photos
    const result = await pool.query(`
        SELECT id, business_name, photo_urls, logo_url, cover_photo_url
        FROM businesses
        WHERE status = 'active'
    `);

    console.log(`Total businesses: ${result.rows.length}\n`);

    let photosCleanedCount = 0;
    let logosCleanedCount = 0;
    let coversCleanedCount = 0;
    let googleUrlsRemoved = 0;
    let blobUrlsKept = 0;

    for (const biz of result.rows) {
        const updates = [];
        const params = [];
        let paramIdx = 1;

        // Clean photo_urls
        if (biz.photo_urls) {
            const urls = Array.isArray(biz.photo_urls) ? biz.photo_urls : [];
            const cleanUrls = urls.filter(url => {
                if (url && url.includes('places.googleapis.com')) {
                    googleUrlsRemoved++;
                    return false; // Remove broken Google API URLs
                }
                if (url && url.includes('blob.vercel-storage.com')) {
                    blobUrlsKept++;
                    return true; // Keep working Blob URLs
                }
                return false; // Remove unknown URLs
            });

            if (cleanUrls.length !== urls.length) {
                const photoStr = cleanUrls.length > 0 ? `{${cleanUrls.join(',')}}` : '{}';
                updates.push(`photo_urls = $${paramIdx++}`);
                params.push(photoStr);
                photosCleanedCount++;
            }
        }

        // Clean logo_url
        if (biz.logo_url && biz.logo_url.includes('places.googleapis.com')) {
            updates.push(`logo_url = NULL`);
            logosCleanedCount++;
        }

        // Clean cover_photo_url
        if (biz.cover_photo_url && biz.cover_photo_url.includes('places.googleapis.com')) {
            updates.push(`cover_photo_url = NULL`);
            coversCleanedCount++;
        }

        if (updates.length > 0 && !DRY_RUN) {
            params.push(biz.id);
            await pool.query(
                `UPDATE businesses SET ${updates.join(', ')}, updated_at = now() WHERE id = $${paramIdx}`,
                params
            );
        }
    }

    console.log(`========== ${DRY_RUN ? 'DRY RUN ' : ''}COMPLETE ==========`);
    console.log(`Businesses with photo_urls cleaned: ${photosCleanedCount}`);
    console.log(`Broken Google API URLs removed: ${googleUrlsRemoved}`);
    console.log(`Working Blob URLs kept: ${blobUrlsKept}`);
    console.log(`Broken logo_urls nulled: ${logosCleanedCount}`);
    console.log(`Broken cover_photo_urls nulled: ${coversCleanedCount}`);

    await pool.end();
}

clean().catch(e => { console.error('FATAL:', e); process.exit(1); });
