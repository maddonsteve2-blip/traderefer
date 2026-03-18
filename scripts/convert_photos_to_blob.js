/**
 * BACKGROUND PHOTO CONVERTER
 * 
 * Converts Google Places API photo URLs to Vercel Blob storage URLs.
 * Runs in the background at its own pace - won't slow down the fill scripts.
 * 
 * Finds businesses where logo_url or photo_urls contain "places.googleapis.com"
 * and downloads + uploads them to Blob storage, then updates the DB.
 * 
 * Usage:
 *   node scripts/convert_photos_to_blob.js [--limit 500] [--concurrency 5]
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'apps', 'web', '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const LOGOS_DIR = path.join(__dirname, '..', 'logos-cache');

if (!fs.existsSync(LOGOS_DIR)) fs.mkdirSync(LOGOS_DIR, { recursive: true });

const args = process.argv.slice(2);
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) : null;
const concIdx = args.indexOf('--concurrency');
const CONCURRENCY = concIdx !== -1 ? parseInt(args[concIdx + 1]) : 5;

const stats = {
    processed: 0,
    logosConverted: 0,
    photosConverted: 0,
    errors: 0,
    skipped: 0,
    startTime: Date.now(),
};

async function downloadAndUploadToBlob(url, slug, index) {
    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
        if (!res.ok) return null;

        const buf = await res.arrayBuffer();
        if (buf.byteLength < 2000) return null;

        const ct = res.headers.get('content-type') || 'image/jpeg';
        const ext = ct.includes('png') ? 'png' : ct.includes('webp') ? 'webp' : 'jpg';
        const filename = `${slug}-${index}.${ext}`;
        const localPath = path.join(LOGOS_DIR, filename);

        // Save locally
        fs.writeFileSync(localPath, Buffer.from(buf));

        // Upload to Blob
        if (BLOB_TOKEN) {
            try {
                const blobRes = await fetch(`https://blob.vercel-storage.com/${filename}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${BLOB_TOKEN}`,
                        'x-content-type': ct,
                        'x-cache-control-max-age': '31536000',
                    },
                    body: Buffer.from(buf),
                });
                if (blobRes.ok) {
                    const j = await blobRes.json();
                    return j.url;
                }
            } catch { /* Blob upload failed */ }
        }

        return null;
    } catch {
        return null;
    }
}

function isGooglePlacesUrl(url) {
    return url && url.includes('places.googleapis.com');
}

async function processBusinessBatch(pool, businesses) {
    await Promise.all(businesses.map(async (biz) => {
        try {
            const updates = {};
            const slug = biz.slug || biz.id;

            // Convert logo_url
            if (isGooglePlacesUrl(biz.logo_url)) {
                const blobUrl = await downloadAndUploadToBlob(biz.logo_url, slug, 'logo');
                if (blobUrl) {
                    updates.logo_url = blobUrl;
                    stats.logosConverted++;
                }
            }

            // Convert cover_photo_url
            if (isGooglePlacesUrl(biz.cover_photo_url)) {
                const blobUrl = await downloadAndUploadToBlob(biz.cover_photo_url, slug, 'cover');
                if (blobUrl) {
                    updates.cover_photo_url = blobUrl;
                }
            }

            // Convert photo_urls array
            let photoUrls = [];
            try {
                if (biz.photo_urls && Array.isArray(biz.photo_urls)) {
                    photoUrls = biz.photo_urls;
                } else if (typeof biz.photo_urls === 'string') {
                    photoUrls = biz.photo_urls.replace(/[{}]/g, '').split(',').filter(Boolean);
                }
            } catch { photoUrls = []; }

            const googlePhotoUrls = photoUrls.filter(isGooglePlacesUrl);
            if (googlePhotoUrls.length > 0) {
                const newPhotoUrls = [];
                for (let i = 0; i < photoUrls.length; i++) {
                    if (isGooglePlacesUrl(photoUrls[i])) {
                        const blobUrl = await downloadAndUploadToBlob(photoUrls[i], slug, i);
                        newPhotoUrls.push(blobUrl || photoUrls[i]); // Keep original if upload fails
                        if (blobUrl) stats.photosConverted++;
                    } else {
                        newPhotoUrls.push(photoUrls[i]); // Keep non-Google URLs as-is
                    }
                }
                updates.photo_urls = `{${newPhotoUrls.join(',')}}`;
            }

            // Apply updates
            if (Object.keys(updates).length > 0) {
                const setClauses = [];
                const values = [];
                let paramIdx = 1;

                for (const [col, val] of Object.entries(updates)) {
                    setClauses.push(`${col} = $${paramIdx}`);
                    values.push(val);
                    paramIdx++;
                }
                values.push(biz.id);

                await pool.query(
                    `UPDATE businesses SET ${setClauses.join(', ')} WHERE id = $${paramIdx}`,
                    values
                );
            }

            stats.processed++;
        } catch (error) {
            stats.errors++;
        }
    }));
}

async function run() {
    if (!DATABASE_URL) { console.error('ERROR: DATABASE_URL not found'); process.exit(1); }
    if (!BLOB_TOKEN) { console.error('ERROR: BLOB_READ_WRITE_TOKEN not found'); process.exit(1); }

    const pool = new Pool({ connectionString: DATABASE_URL, max: 5 });

    console.log('=== Photo URL to Blob Converter ===');
    console.log(`Concurrency: ${CONCURRENCY}${LIMIT ? ` | Limit: ${LIMIT}` : ''}\n`);

    // Find businesses with Google Places photo URLs
    const limitClause = LIMIT ? `LIMIT ${LIMIT}` : '';
    const result = await pool.query(`
        SELECT id, slug, logo_url, cover_photo_url, photo_urls
        FROM businesses
        WHERE status = 'active'
          AND (
            logo_url LIKE '%places.googleapis.com%'
            OR cover_photo_url LIKE '%places.googleapis.com%'
            OR photo_urls::text LIKE '%places.googleapis.com%'
          )
        ORDER BY created_at DESC
        ${limitClause}
    `);

    console.log(`Found ${result.rows.length} businesses with Google Places photo URLs\n`);

    if (result.rows.length === 0) {
        console.log('Nothing to convert!');
        await pool.end();
        return;
    }

    stats.startTime = Date.now();

    // Process in batches
    for (let i = 0; i < result.rows.length; i += CONCURRENCY) {
        const batch = result.rows.slice(i, i + CONCURRENCY);
        await processBusinessBatch(pool, batch);

        const elapsed = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(1);
        const rate = (stats.processed / (elapsed || 0.1)).toFixed(1);
        console.log(`Progress: ${stats.processed}/${result.rows.length} | Logos: ${stats.logosConverted} | Photos: ${stats.photosConverted} | Errors: ${stats.errors} | ${rate}/min | ${elapsed}min`);
    }

    await pool.end();

    const totalTime = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(1);
    console.log(`\n========== COMPLETE ==========`);
    console.log(`Time: ${totalTime} minutes`);
    console.log(`Processed: ${stats.processed} | Logos: ${stats.logosConverted} | Photos: ${stats.photosConverted}`);
    console.log(`Errors: ${stats.errors}`);
}

run().catch(console.error);
