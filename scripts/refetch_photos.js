/**
 * REFETCH PHOTOS
 * 
 * Properly re-fetches photos for businesses missing them.
 * Uses Google Places API to search by business name + suburb,
 * resolves photo URLs to direct googleusercontent.com URLs
 * (NOT API URLs with embedded key).
 * 
 * Strategy:
 * 1. Use google_maps_url to extract Place ID if available
 * 2. Otherwise search by business name + suburb + state
 * 3. For each photo, call the media endpoint with header auth
 * 4. Capture the redirect URL (direct image URL, no API key needed)
 * 5. Store the direct image URLs in photo_urls
 * 6. Set logo_url = photo_urls[0], cover_photo_url = photo_urls[1]
 * 
 * Usage: node scripts/refetch_photos.js [--limit 100] [--concurrency 5]
 */

const { Pool } = require('pg');
require('dotenv').config({ path: 'apps/web/.env.local' });

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });

const args = process.argv.slice(2);
const LIMIT = parseInt(args[args.indexOf('--limit') + 1]) || 500;
const CONCURRENCY = parseInt(args[args.indexOf('--concurrency') + 1]) || 5;
const MAX_PHOTOS = 10;
const DELAY_BETWEEN_BATCHES = 1000; // ms

let stats = { processed: 0, photosAdded: 0, errors: 0, skipped: 0, apiCalls: 0, startTime: Date.now() };

// Extract Place ID from google_maps_url
function extractPlaceId(url) {
    if (!url) return null;
    // Format: https://www.google.com/maps/place/.../data=...
    // Or contains place_id
    const match = url.match(/place_id[=:]([A-Za-z0-9_-]+)/);
    if (match) return match[1];
    
    // Try to extract from the URL path
    const placeMatch = url.match(/\/place\/[^/]+\/@[^/]+\/data=.*!1s(0x[a-f0-9]+:0x[a-f0-9]+)/);
    if (placeMatch) return null; // CID format, not Place ID
    
    return null;
}

// Search for a business using Text Search API
async function searchBusiness(businessName, suburb, state) {
    const query = `${businessName} ${suburb} ${state} Australia`;
    stats.apiCalls++;
    
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_API_KEY,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.photos',
        },
        body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
    });

    if (!res.ok) {
        if (res.status === 429) {
            await new Promise(r => setTimeout(r, 5000));
            return searchBusiness(businessName, suburb, state); // retry once
        }
        throw new Error(`Search API ${res.status}`);
    }

    const data = await res.json();
    return data.places?.[0] || null;
}

// Get Place Details by Place ID
async function getPlaceById(placeId) {
    stats.apiCalls++;
    
    const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
        headers: {
            'X-Goog-Api-Key': GOOGLE_API_KEY,
            'X-Goog-FieldMask': 'id,displayName,photos',
        },
    });

    if (!res.ok) {
        if (res.status === 429) {
            await new Promise(r => setTimeout(r, 5000));
            return getPlaceById(placeId);
        }
        throw new Error(`Details API ${res.status}`);
    }

    return await res.json();
}

// Resolve a photo reference to a direct image URL
async function resolvePhotoUrl(photoName, maxWidth = 800) {
    const url = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidth}&maxHeightPx=${maxWidth}`;
    
    const res = await fetch(url, {
        headers: { 'X-Goog-Api-Key': GOOGLE_API_KEY },
        redirect: 'manual', // Don't follow redirect, capture the URL
    });

    if (res.status === 302) {
        return res.headers.get('location'); // Direct googleusercontent.com URL
    }

    // Try skipHttpRedirect
    const url2 = `${url}&skipHttpRedirect=true`;
    const res2 = await fetch(url2, {
        headers: { 'X-Goog-Api-Key': GOOGLE_API_KEY },
    });
    
    if (res2.ok) {
        const data = await res2.json();
        return data.photoUri || null;
    }

    return null;
}

// Process a single business
async function processBusiness(biz) {
    try {
        let place = null;

        // Try Place ID from google_maps_url first
        const placeId = extractPlaceId(biz.google_maps_url);
        if (placeId) {
            try {
                place = await getPlaceById(placeId);
            } catch (e) {
                // Fall through to search
            }
        }

        // Fall back to text search
        if (!place || !place.photos?.length) {
            place = await searchBusiness(biz.business_name, biz.suburb, biz.state);
        }

        if (!place || !place.photos?.length) {
            stats.skipped++;
            return;
        }

        // Resolve up to MAX_PHOTOS photo URLs
        const photoRefs = place.photos.slice(0, MAX_PHOTOS);
        const photoUrls = [];

        for (const ref of photoRefs) {
            try {
                const directUrl = await resolvePhotoUrl(ref.name);
                if (directUrl) {
                    photoUrls.push(directUrl);
                }
            } catch (e) {
                // Skip this photo
            }
        }

        if (photoUrls.length === 0) {
            stats.skipped++;
            return;
        }

        // Merge with existing blob photos (if any)
        const existingUrls = Array.isArray(biz.photo_urls) ? biz.photo_urls.filter(u => u && u.length > 5) : [];
        const allUrls = [...new Set([...existingUrls, ...photoUrls])].slice(0, MAX_PHOTOS);

        // Update database
        const photoUrlsStr = `{${allUrls.join(',')}}`;
        const logoUrl = allUrls[0];
        const coverUrl = allUrls.length > 1 ? allUrls[1] : allUrls[0];

        await pool.query(`
            UPDATE businesses
            SET photo_urls = $1,
                logo_url = COALESCE(NULLIF(logo_url, ''), $2),
                cover_photo_url = COALESCE(NULLIF(cover_photo_url, ''), $3),
                updated_at = now()
            WHERE id = $4
        `, [photoUrlsStr, logoUrl, coverUrl, biz.id]);

        stats.photosAdded += allUrls.length - existingUrls.length;
        stats.processed++;

    } catch (e) {
        stats.errors++;
        if (stats.errors <= 10) {
            console.error(`  Error [${biz.business_name}]: ${e.message}`);
        }
    }
}

async function run() {
    console.log('=== Refetch Photos ===');
    console.log(`Limit: ${LIMIT} | Concurrency: ${CONCURRENCY} | Max photos: ${MAX_PHOTOS}\n`);

    // First test if API works
    console.log('Testing API access...');
    try {
        const testRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_API_KEY,
                'X-Goog-FieldMask': 'places.id',
            },
            body: JSON.stringify({ textQuery: 'plumber Sydney', maxResultCount: 1 }),
        });
        
        if (!testRes.ok) {
            const err = await testRes.json();
            console.error(`❌ API NOT WORKING: ${err.error?.message || testRes.status}`);
            console.error('Enable billing at: https://console.cloud.google.com/billing/enable?project=643902729199');
            await pool.end();
            return;
        }
        console.log('✅ API is working!\n');
    } catch (e) {
        console.error(`❌ API error: ${e.message}`);
        await pool.end();
        return;
    }

    // Get businesses needing photos (prioritize those with google_maps_url)
    const result = await pool.query(`
        SELECT id, business_name, slug, suburb, state, google_maps_url, photo_urls
        FROM businesses
        WHERE status = 'active'
          AND (photo_urls IS NULL OR photo_urls = '{}' OR array_length(photo_urls, 1) IS NULL OR array_length(photo_urls, 1) < 3)
        ORDER BY 
            CASE WHEN google_maps_url IS NOT NULL AND google_maps_url != '' THEN 0 ELSE 1 END,
            total_reviews DESC NULLS LAST
        LIMIT $1
    `, [LIMIT]);

    console.log(`Found ${result.rows.length} businesses needing photos\n`);

    // Process in batches
    for (let i = 0; i < result.rows.length; i += CONCURRENCY) {
        const batch = result.rows.slice(i, i + CONCURRENCY);
        await Promise.all(batch.map(processBusiness));

        const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(0);
        const pct = ((i + batch.length) / result.rows.length * 100).toFixed(1);
        console.log(`[${pct}%] ${i + batch.length}/${result.rows.length} | Photos: ${stats.photosAdded} | Errors: ${stats.errors} | Skipped: ${stats.skipped} | API calls: ${stats.apiCalls} | ${elapsed}s`);

        if (DELAY_BETWEEN_BATCHES > 0) {
            await new Promise(r => setTimeout(r, DELAY_BETWEEN_BATCHES));
        }
    }

    console.log('\n========== COMPLETE ==========');
    console.log(`Processed: ${stats.processed}`);
    console.log(`Photos added: ${stats.photosAdded}`);
    console.log(`Skipped (no photos found): ${stats.skipped}`);
    console.log(`Errors: ${stats.errors}`);
    console.log(`API calls: ${stats.apiCalls}`);
    console.log(`Time: ${((Date.now() - stats.startTime) / 1000 / 60).toFixed(1)} minutes`);

    await pool.end();
}

run().catch(e => { console.error('FATAL:', e); process.exit(1); });
