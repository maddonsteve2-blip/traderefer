/**
 * BUSINESS PHOTO FILLER
 * 
 * Queries Google Places API to fetch ALL available photo URLs for businesses
 * that are missing photos. Stores Google Places photo URLs directly in the DB.
 * 
 * Skips:
 * - Businesses that already have Blob storage URLs
 * - Businesses that already have the same Google photo URLs
 * - Businesses without a source_url (no Google Places link)
 * 
 * Usage:
 *   node scripts/fill_business_photos.js [--limit 1000] [--state NSW] [--min-photos 6]
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'apps', 'web', '.env.local') });

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

// Configuration
const CONCURRENT = 50;       // Google allows 6000 QPM
const MAX_PHOTOS = 10;       // Max photos per business
const DEFAULT_MIN = 6;       // Skip businesses with this many or more photos already

const args = process.argv.slice(2);
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) : null;
const stateIdx = args.indexOf('--state');
const STATE_FILTER = stateIdx !== -1 ? args[stateIdx + 1] : null;
const minIdx = args.indexOf('--min-photos');
const MIN_PHOTOS = minIdx !== -1 ? parseInt(args[minIdx + 1]) : DEFAULT_MIN;

const stats = {
    processed: 0,
    updated: 0,
    photosAdded: 0,
    skipped: 0,
    errors: 0,
    notFound: 0,
    startTime: 0,
};

// Build a Google Places photo URL
function photoUrl(photoName, maxWidth = 800) {
    return `https://places.googleapis.com/v1/${photoName}/media?key=${GOOGLE_API_KEY}&maxWidthPx=${maxWidth}&maxHeightPx=${maxWidth}`;
}

// Extract place ID from source_url
function extractPlaceId(sourceUrl) {
    if (!sourceUrl) return null;
    // Direct place ID (starts with ChIJ)
    if (sourceUrl.startsWith('ChIJ')) return sourceUrl.trim();
    // Google Maps URL with place ID path: /place/.../data=...!1s<placeId>
    const placeIdMatch = sourceUrl.match(/ChIJ[A-Za-z0-9_-]+/);
    if (placeIdMatch) return placeIdMatch[0];
    return null;
}

// Get photos directly via Place Details API (fast, reliable, cheap)
async function getPlacePhotos(placeId) {
    try {
        const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
            headers: {
                'X-Goog-Api-Key': GOOGLE_API_KEY,
                'X-Goog-FieldMask': 'photos',
            },
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.photos || null;
    } catch {
        return null;
    }
}

// Fallback: search by name + location
async function searchPlacePhotos(businessName, suburb, state) {
    try {
        const query = `${businessName} ${suburb} ${state} Australia`;
        const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_API_KEY,
                'X-Goog-FieldMask': 'places.photos',
            },
            body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.places?.[0]?.photos || null;
    } catch {
        return null;
    }
}

function countExistingPhotos(photoUrls) {
    if (!photoUrls) return 0;
    if (Array.isArray(photoUrls)) return photoUrls.filter(u => u && u.length > 5).length;
    if (typeof photoUrls === 'string') {
        const cleaned = photoUrls.replace(/[{}]/g, '').trim();
        if (!cleaned) return 0;
        return cleaned.split(',').filter(u => u && u.length > 5).length;
    }
    return 0;
}

function parsePhotoUrls(photoUrls) {
    if (!photoUrls) return [];
    if (Array.isArray(photoUrls)) return photoUrls.filter(Boolean);
    if (typeof photoUrls === 'string') {
        return photoUrls.replace(/[{}]/g, '').split(',').filter(u => u && u.length > 5);
    }
    return [];
}

function hasBlobUrl(photoUrls) {
    const urls = parsePhotoUrls(photoUrls);
    return urls.some(u => u.includes('blob.vercel-storage.com'));
}

async function processBatch(pool, businesses) {
    await Promise.all(businesses.map(async (biz) => {
        try {
            // Try direct Place Details API first (fast + reliable)
            const placeId = extractPlaceId(biz.source_url);
            let photos = null;
            
            if (placeId) {
                photos = await getPlacePhotos(placeId);
            }
            
            // Fallback to text search if no place ID or no photos found
            if (!photos || photos.length === 0) {
                photos = await searchPlacePhotos(biz.business_name, biz.suburb || '', biz.state || '');
            }
            
            if (!photos || photos.length === 0) {
                stats.notFound++;
                stats.processed++;
                return;
            }

            // Get all photo URLs
            const newPhotoUrls = photos
                .slice(0, MAX_PHOTOS)
                .map(p => photoUrl(p.name))
                .filter(Boolean);

            if (newPhotoUrls.length === 0) {
                stats.skipped++;
                stats.processed++;
                return;
            }

            // Merge with existing photos (keep blob URLs, add new Google URLs)
            const existingUrls = parsePhotoUrls(biz.photo_urls);
            const blobUrls = existingUrls.filter(u => u.includes('blob.vercel-storage.com'));
            
            // Combine: blob URLs first, then new Google URLs (avoid duplicates)
            const allUrls = [...blobUrls];
            for (const url of newPhotoUrls) {
                // Skip if we already have a very similar URL
                const isDupe = allUrls.some(existing => existing === url);
                if (!isDupe) allUrls.push(url);
            }

            // Cap at MAX_PHOTOS
            const finalUrls = allUrls.slice(0, MAX_PHOTOS);
            const photoUrlsStr = `{${finalUrls.join(',')}}`;
            const logoUrl = finalUrls[0] || biz.logo_url;
            const coverPhoto = finalUrls.length > 1 ? finalUrls[1] : finalUrls[0] || biz.cover_photo_url;

            // Update DB
            await pool.query(`
                UPDATE businesses 
                SET photo_urls = $1, 
                    logo_url = COALESCE(NULLIF($2, ''), logo_url),
                    cover_photo_url = COALESCE(NULLIF($3, ''), cover_photo_url)
                WHERE id = $4
            `, [photoUrlsStr, logoUrl, coverPhoto, biz.id]);

            stats.updated++;
            stats.photosAdded += finalUrls.length - blobUrls.length;
            stats.processed++;
        } catch (error) {
            stats.errors++;
            stats.processed++;
        }
    }));
}

async function run() {
    if (!GOOGLE_API_KEY) { console.error('ERROR: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not found'); process.exit(1); }
    if (!DATABASE_URL) { console.error('ERROR: DATABASE_URL not found'); process.exit(1); }

    const pool = new Pool({ connectionString: DATABASE_URL, max: 10 });

    console.log('=== Business Photo Filler ===');
    console.log(`Concurrent: ${CONCURRENT} | Max photos: ${MAX_PHOTOS} | Min existing: ${MIN_PHOTOS}`);
    if (STATE_FILTER) console.log(`State: ${STATE_FILTER}`);
    if (LIMIT) console.log(`Limit: ${LIMIT}`);
    console.log('');

    // Find businesses needing photos
    const stateCondition = STATE_FILTER ? `AND state = '${STATE_FILTER}'` : '';
    const limitClause = LIMIT ? `LIMIT ${LIMIT}` : '';

    const result = await pool.query(`
        SELECT id, business_name, slug, suburb, state, source_url, logo_url, cover_photo_url, photo_urls
        FROM businesses
        WHERE status = 'active'
          AND data_source = 'Google Places'
          ${stateCondition}
          AND (
            photo_urls IS NULL 
            OR photo_urls::text = '{}' 
            OR photo_urls::text = ''
            OR array_length(
                string_to_array(trim(both '{}' from photo_urls::text), ','), 1
            ) < ${MIN_PHOTOS}
          )
        ORDER BY created_at DESC
        ${limitClause}
    `);

    console.log(`Found ${result.rows.length} businesses needing photos\n`);

    if (result.rows.length === 0) {
        console.log('All businesses have enough photos!');
        await pool.end();
        return;
    }

    stats.startTime = Date.now();

    // Process in batches
    for (let i = 0; i < result.rows.length; i += CONCURRENT) {
        const batch = result.rows.slice(i, i + CONCURRENT);
        await processBatch(pool, batch);

        const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(0);
        const rate = elapsed > 0 ? (stats.processed / (elapsed / 60)).toFixed(0) : '0';
        console.log(
            `Progress: ${stats.processed}/${result.rows.length} | ` +
            `Updated: ${stats.updated} | Photos: ${stats.photosAdded} | ` +
            `Not found: ${stats.notFound} | Errors: ${stats.errors} | ` +
            `Rate: ${rate}/min`
        );
    }

    await pool.end();

    const totalTime = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(1);
    console.log(`\n========== COMPLETE ==========`);
    console.log(`Time: ${totalTime} minutes`);
    console.log(`Processed: ${stats.processed} | Updated: ${stats.updated} | Photos added: ${stats.photosAdded}`);
    console.log(`Not found: ${stats.notFound} | Skipped: ${stats.skipped} | Errors: ${stats.errors}`);
}

run().catch(console.error);
