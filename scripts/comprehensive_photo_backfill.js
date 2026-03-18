/**
 * COMPREHENSIVE PHOTO BACKFILL
 * 
 * Searches by CID and Place ID, only adds photos we don't already have.
 * Uses smart dedup to avoid duplicates.
 * 
 * Usage: node scripts/comprehensive_photo_backfill.js [--state NSW] [--limit 1000]
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'apps', 'web', '.env.local') });

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

const CONCURRENT = 30;
const MAX_PHOTOS = 10;

const args = process.argv.slice(2);
const LIMIT = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : null;
const STATE = args.includes('--state') ? args[args.indexOf('--state') + 1] : null;

const stats = { processed: 0, found: 0, photosAdded: 0, duplicatesSkipped: 0, errors: 0, startTime: 0 };

function photoUrl(photoName, maxWidth = 800) {
    return `https://places.googleapis.com/v1/${photoName}/media?key=${GOOGLE_API_KEY}&maxWidthPx=${maxWidth}&maxHeightPx=${maxWidth}`;
}

function parsePhotoUrls(photoUrls) {
    if (!photoUrls) return [];
    if (Array.isArray(photoUrls)) return photoUrls.filter(Boolean);
    if (typeof photoUrls === 'string') {
        return photoUrls.replace(/[{}]/g, '').split(',').filter(u => u && u.length > 5);
    }
    return [];
}

// Extract CID from source_url
function extractCid(sourceUrl) {
    if (!sourceUrl) return null;
    const match = sourceUrl.match(/cid=([^&]+)/);
    return match ? match[1] : null;
}

// Extract Place ID from source_url
function extractPlaceId(sourceUrl) {
    if (!sourceUrl) return null;
    if (sourceUrl.startsWith('ChIJ')) return sourceUrl.trim();
    const match = sourceUrl.match(/ChIJ[A-Za-z0-9_-]+/);
    return match ? match[0] : null;
}

// Search by CID (convert CID to Place ID via text search)
async function searchByCid(cid, businessName, suburb, state) {
    try {
        // Search by business name + location to find the CID business
        const query = `${businessName} ${suburb || ''} ${state || ''}`.trim();
        const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_API_KEY,
                'X-Goog-FieldMask': 'places.id,places.displayName,places.photos,places.internationalPhoneNumber',
            },
            body: JSON.stringify({ textQuery: query, maxResultCount: 3 }),
        });

        if (!res.ok) return null;
        const data = await res.json();
        const places = data.places || [];
        
        // Find the place that matches our CID by checking if it has the same CID in the URL
        for (const p of places) {
            if (p.googleMapsUri && p.googleMapsUri.includes(`cid=${cid}`)) {
                return p;
            }
        }
        return null;
    } catch {
        return null;
    }
}

// Get Place Details by Place ID
async function getPlaceDetails(placeId) {
    try {
        const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
            headers: {
                'X-Goog-Api-Key': GOOGLE_API_KEY,
                'X-Goog-FieldMask': 'places.photos,places.editorialSummary,places.reviews,places.rating,places.userRatingCount,places.internationalPhoneNumber,places.websiteUri',
            },
        });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

// Merge photos avoiding duplicates
function mergePhotos(existingUrls, newUrls) {
    const existingSet = new Set(existingUrls);
    const merged = [...existingUrls];
    
    for (const url of newUrls) {
        if (!existingSet.has(url)) {
            merged.push(url);
            existingSet.add(url);
        }
    }
    
    return merged.slice(0, MAX_PHOTOS);
}

async function processBusiness(pool, biz) {
    try {
        let place = null;
        let searchMethod = 'unknown';

        // Try Place ID first (most reliable)
        const placeId = extractPlaceId(biz.source_url);
        if (placeId) {
            place = await getPlaceDetails(placeId);
            searchMethod = 'place_id';
        }

        // Try CID resolution
        if (!place) {
            const cid = extractCid(biz.source_url);
            if (cid) {
                place = await searchByCid(cid, biz.business_name, biz.suburb, biz.state);
                searchMethod = 'cid';
            }
        }

        // Final fallback: text search by name + location
        if (!place) {
            const query = `${biz.business_name} ${biz.suburb || ''} ${biz.state || ''}`.trim();
            const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': GOOGLE_API_KEY,
                    'X-Goog-FieldMask': 'places.id,places.photos,places.displayName,places.internationalPhoneNumber',
                },
                body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
            });
            
            if (res.ok) {
                const data = await res.json();
                place = data.places?.[0] || null;
                searchMethod = 'text_search';
            }
        }

        if (!place) {
            stats.errors++;
            return;
        }

        stats.found++;

        // Get existing photos
        const existingUrls = parsePhotoUrls(biz.photo_urls);
        const existingCount = existingUrls.length;

        // Get new photos from Google
        const newPhotoUrls = (place.photos || [])
            .slice(0, MAX_PHOTOS)
            .map(p => photoUrl(p.name))
            .filter(Boolean);

        if (newPhotoUrls.length === 0) {
            return; // No photos available
        }

        // Merge photos, avoiding duplicates
        const mergedUrls = mergePhotos(existingUrls, newPhotoUrls);
        const addedCount = mergedUrls.length - existingCount;

        if (addedCount <= 0) {
            stats.duplicatesSkipped++;
            return;
        }

        // Update database
        const photoUrlsStr = `{${mergedUrls.join(',')}}`;
        const logoUrl = mergedUrls[0] || biz.logo_url;
        const coverPhoto = mergedUrls.length > 1 ? mergedUrls[1] : mergedUrls[0] || biz.cover_photo_url;

        await pool.query(`
            UPDATE businesses 
            SET photo_urls = $1, 
                logo_url = COALESCE(NULLIF($2, ''), logo_url),
                cover_photo_url = COALESCE(NULLIF($3, ''), cover_photo_url),
                updated_at = now()
            WHERE id = $4
        `, [photoUrlsStr, logoUrl, coverPhoto, biz.id]);

        stats.photosAdded += addedCount;
        console.log(`✅ ${biz.business_name} | ${biz.suburb}, ${biz.state} | ${searchMethod} | ${existingCount} → ${mergedUrls.length} photos (+${addedCount})`);

    } catch (error) {
        console.error(`❌ Error processing ${biz.business_name}:`, error.message);
        stats.errors++;
    }
}

async function run() {
    console.log('=== Comprehensive Photo Backfill ===');
    console.log(`State: ${STATE || 'ALL'} | Limit: ${LIMIT || 'ALL'}\n`);

    const pool = new Pool({ connectionString: DATABASE_URL, max: 20 });

    // Query businesses that need photos (0-5 photos to avoid ones that are already well-stocked)
    const conditions = [
        "status = 'active'",
        "(photo_urls IS NULL OR photo_urls::text = '{}' OR array_length(string_to_array(trim(both '{}' from photo_urls::text), ','), 1) <= 5)"
    ];
    
    if (STATE) conditions.push(`state = '${STATE}'`);
    
    const where = conditions.join(' AND ');
    const limitSql = LIMIT ? `LIMIT ${LIMIT}` : '';

    const result = await pool.query(`
        SELECT id, business_name, suburb, city, state, business_phone, source_url, photo_urls
        FROM businesses
        WHERE ${where}
        ORDER BY created_at DESC
        ${limitSql}
    `);

    const businesses = result.rows;
    console.log(`Found ${businesses.length} businesses needing photos\n`);

    if (businesses.length === 0) {
        await pool.end();
        return;
    }

    stats.startTime = Date.now();

    // Process in batches
    for (let i = 0; i < businesses.length; i += CONCURRENT) {
        const batch = businesses.slice(i, i + CONCURRENT);
        await Promise.all(batch.map(biz => processBusiness(pool, biz)));

        const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(0);
        const rate = elapsed > 0 ? (stats.processed / (elapsed / 60)).toFixed(0) : 0;
        console.log(`Progress: ${stats.processed}/${businesses.length} | Found: ${stats.found} | Photos added: ${stats.photosAdded} | Duplicates: ${stats.duplicatesSkipped} | Errors: ${stats.errors} | ${rate}/min`);
    }

    await pool.end();

    const totalTime = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(1);
    console.log(`\n========== COMPLETE ==========`);
    console.log(`Time: ${totalTime} minutes`);
    console.log(`Processed: ${stats.processed} | Found: ${stats.found} | Photos added: ${stats.photosAdded} | Duplicates skipped: ${stats.duplicatesSkipped} | Errors: ${stats.errors}`);
}

run().catch(e => { console.error('FATAL:', e); process.exit(1); });
