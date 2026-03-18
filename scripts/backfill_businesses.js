/**
 * BUSINESS BACKFILL SCRIPT
 * 
 * Backfills missing descriptions AND photos for existing businesses.
 * Uses Place Details API with place IDs extracted from source_url.
 * 
 * Targets:
 * - Businesses with no description
 * - Businesses with fewer than 6 photos
 * 
 * Dedup: Uses source_url place ID as identifier. Only ADDS data, never removes.
 * Photo merge: Keeps existing Blob URLs, adds new Google photo URLs, caps at 10.
 * 
 * Usage:
 *   node scripts/backfill_businesses.js [--limit 1000] [--state NSW] [--photos-only] [--desc-only]
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'apps', 'web', '.env.local') });

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

// Configuration
const CONCURRENT = 50;
const MAX_PHOTOS = 10;
const MIN_PHOTOS_THRESHOLD = 6; // Backfill if fewer than this

const args = process.argv.slice(2);
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) : null;
const stateIdx = args.indexOf('--state');
const STATE_FILTER = stateIdx !== -1 ? args[stateIdx + 1] : null;
const PHOTOS_ONLY = args.includes('--photos-only');
const DESC_ONLY = args.includes('--desc-only');

const stats = {
    processed: 0,
    descUpdated: 0,
    photosUpdated: 0,
    photosAdded: 0,
    skipped: 0,
    errors: 0,
    notFound: 0,
    startTime: 0,
};

// Extract place ID from source_url (Google Maps URI contains ChIJ... place IDs)
// For CID URLs, we'll need to resolve via text search
function extractPlaceId(sourceUrl) {
    if (!sourceUrl) return null;
    if (sourceUrl.startsWith('ChIJ')) return sourceUrl.trim();
    const match = sourceUrl.match(/ChIJ[A-Za-z0-9_-]+/);
    return match ? match[0] : null;
}

// Build Google Places photo URL
function photoUrl(photoName, maxWidth = 800) {
    return `https://places.googleapis.com/v1/${photoName}/media?key=${GOOGLE_API_KEY}&maxWidthPx=${maxWidth}&maxHeightPx=${maxWidth}`;
}

// Parse photo_urls from DB (could be PostgreSQL array string or JS array)
function parsePhotoUrls(photoUrls) {
    if (!photoUrls) return [];
    if (Array.isArray(photoUrls)) return photoUrls.filter(Boolean);
    if (typeof photoUrls === 'string') {
        return photoUrls.replace(/[{}]/g, '').split(',').filter(u => u && u.length > 5);
    }
    return [];
}

// Get full place details (photos + editorial summary + reviews)
async function getPlaceDetails(placeId, retries = 0) {
    try {
        const fields = 'photos,editorialSummary,reviews,rating,userRatingCount';
        const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
            headers: {
                'X-Goog-Api-Key': GOOGLE_API_KEY,
                'X-Goog-FieldMask': fields,
            },
        });
        if (!res.ok) {
            if (res.status === 429 && retries < 3) {
                await new Promise(r => setTimeout(r, 2000 * (retries + 1)));
                return getPlaceDetails(placeId, retries + 1);
            }
            return null;
        }
        return res.json();
    } catch {
        if (retries < 2) {
            await new Promise(r => setTimeout(r, 1000));
            return getPlaceDetails(placeId, retries + 1);
        }
        return null;
    }
}

// Fallback: search by phone first (most accurate), then name + location
async function searchPlaceDetails(businessName, suburb, state, phone) {
    try {
        let query = businessName;
        let maxResults = 1;
        
        // If we have a phone number, search by phone first (most accurate)
        if (phone) {
            query = phone.replace(/\s+/g, '');
            maxResults = 3; // Get multiple results to find the right one by name
        }
        
        const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_API_KEY,
                'X-Goog-FieldMask': 'places.photos,places.editorialSummary,places.reviews,places.rating,places.userRatingCount,places.displayName,places.internationalPhoneNumber',
            },
            body: JSON.stringify({ textQuery: query, maxResultCount: maxResults }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        const places = data.places || [];
        
        if (places.length === 0) return null;
        
        // If we searched by phone, find the one with matching business name
        if (phone && places.length > 1) {
            for (const p of places) {
                if (p.displayName?.text && p.displayName.text.toLowerCase().includes(businessName.toLowerCase())) {
                    return p;
                }
            }
        }
        
        // Return first result (or the only result)
        return places[0];
    } catch {
        return null;
    }
}

// Build description from place data
function buildDescription(place, biz) {
    // 1. Editorial summary from Google
    if (place.editorialSummary?.text) return place.editorialSummary.text;
    
    // 2. Best review (3+ stars, 30+ chars)
    if (place.reviews && place.reviews.length > 0) {
        const goodReviews = place.reviews
            .filter(r => r.rating >= 3 && r.text?.text && r.text.text.length > 30)
            .sort((a, b) => (b.text?.text?.length || 0) - (a.text?.text?.length || 0));
        if (goodReviews.length > 0) {
            const best = goodReviews[0].text.text;
            return best.length > 300 ? best.substring(0, 297) + '...' : best;
        }
    }
    
    // 3. Generate from business info
    const rating = place.rating || biz.avg_rating;
    const reviews = place.userRatingCount || biz.total_reviews;
    const ratingStr = rating ? `${rating}-star rated` : '';
    const reviewStr = reviews ? `with ${reviews} reviews` : '';
    const trade = (biz.trade_category || '').toLowerCase();
    const location = biz.suburb || biz.city || '';
    
    if (ratingStr || location) {
        return `${biz.business_name} is a ${ratingStr} ${trade} business${location ? ` serving ${location}` : ''}${biz.state ? `, ${biz.state}` : ''} ${reviewStr}.`.replace(/\s+/g, ' ').trim();
    }
    
    return null;
}

async function processBatch(pool, businesses) {
    await Promise.all(businesses.map(async (biz) => {
        try {
            // Try Place Details API first (fast + reliable)
            let placeId = extractPlaceId(biz.source_url);
            let place = null;
            
            if (placeId) {
                place = await getPlaceDetails(placeId);
            }
            
            // If we have a CID URL but no Place ID, resolve it via text search
            if (!place && biz.source_url && biz.source_url.includes('maps.google.com/cid=')) {
                const searchResult = await searchPlaceDetails(biz.business_name, biz.suburb, biz.state, biz.business_phone);
                if (searchResult && searchResult.id) {
                    placeId = searchResult.id.replace('places/', '');
                    place = await getPlaceDetails(placeId);
                }
            }
            
            // Final fallback to text search
            if (!place) {
                place = await searchPlaceDetails(biz.business_name, biz.suburb, biz.state, biz.business_phone);
            }
            
            if (!place) {
                stats.notFound++;
                stats.processed++;
                return;
            }

            const updates = [];
            const params = [];
            let paramIdx = 1;

            // --- DESCRIPTION ---
            if (!DESC_ONLY || !PHOTOS_ONLY) {
                // Only backfill if business has no description
                if (!biz.description) {
                    const desc = buildDescription(place, biz);
                    if (desc) {
                        updates.push(`description = $${paramIdx++}`);
                        params.push(desc);
                        stats.descUpdated++;
                    }
                }
            }

            // --- PHOTOS ---
            if (!PHOTOS_ONLY || !DESC_ONLY) {
                const existingUrls = parsePhotoUrls(biz.photo_urls);
                const existingCount = existingUrls.length;
                
                // Debug logging
                if (existingCount === 0 && place.photos && place.photos.length > 0) {
                    console.log(`  [DEBUG] ${biz.business_name}: DB has 0 photos, Google has ${place.photos.length} photos`);
                }
                
                if (existingCount < MIN_PHOTOS_THRESHOLD && place.photos && place.photos.length > 0) {
                    const newPhotoUrls = place.photos
                        .slice(0, MAX_PHOTOS)
                        .map(p => photoUrl(p.name))
                        .filter(Boolean);

                    if (newPhotoUrls.length > 0) {
                        // Keep existing Blob URLs, add new Google URLs
                        const blobUrls = existingUrls.filter(u => u.includes('blob.vercel-storage.com'));
                        const allUrls = [...blobUrls];
                        for (const url of newPhotoUrls) {
                            if (!allUrls.some(e => e === url)) allUrls.push(url);
                        }
                        const finalUrls = allUrls.slice(0, MAX_PHOTOS);
                        
                        if (finalUrls.length > existingCount) {
                            const photoUrlsStr = `{${finalUrls.join(',')}}`;
                            updates.push(`photo_urls = $${paramIdx++}`);
                            params.push(photoUrlsStr);
                            
                            const logoUrl = finalUrls[0];
                            const coverPhoto = finalUrls.length > 1 ? finalUrls[1] : finalUrls[0];
                            updates.push(`logo_url = COALESCE(NULLIF($${paramIdx++}, ''), logo_url)`);
                            params.push(logoUrl);
                            updates.push(`cover_photo_url = COALESCE(NULLIF($${paramIdx++}, ''), cover_photo_url)`);
                            params.push(coverPhoto);
                            
                            stats.photosUpdated++;
                            stats.photosAdded += finalUrls.length - existingCount;
                        }
                    }
                }
            }

            if (updates.length === 0) {
                const existingUrls = parsePhotoUrls(biz.photo_urls);
                const existingCount = existingUrls.length;
                const hasDesc = biz.description ? 'yes' : 'no';
                console.log(`  [SKIP] ${biz.business_name} | Photos: ${existingCount} | Desc: ${hasDesc} | Place photos: ${place.photos?.length || 0}`);
                stats.skipped++;
                stats.processed++;
                return;
            }

            updates.push(`updated_at = now()`);
            params.push(biz.id);
            await pool.query(
                `UPDATE businesses SET ${updates.join(', ')} WHERE id = $${paramIdx}`,
                params
            );
            
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

    console.log('=== Business Backfill (Descriptions + Photos) ===');
    console.log(`Concurrent: ${CONCURRENT} | State: ${STATE_FILTER || 'ALL'} | Limit: ${LIMIT || 'ALL'}`);
    if (PHOTOS_ONLY) console.log('Mode: PHOTOS ONLY');
    if (DESC_ONLY) console.log('Mode: DESCRIPTIONS ONLY');
    console.log();

    const pool = new Pool({ connectionString: DATABASE_URL, max: 20 });

    // Find businesses needing backfill
    const conditions = ["status = 'active'", "data_source = 'Google Places'"];
    
    // Must have a source_url to look up
    conditions.push("source_url IS NOT NULL");
    
    // Need EITHER missing description OR fewer than MIN_PHOTOS photos
    const needConditions = [];
    if (!PHOTOS_ONLY) needConditions.push("description IS NULL");
    if (!DESC_ONLY) needConditions.push(`(photo_urls IS NULL OR photo_urls::text = '{}' OR array_length(string_to_array(trim(both '{}' from photo_urls::text), ','), 1) < ${MIN_PHOTOS_THRESHOLD})`);
    
    if (needConditions.length > 0) {
        conditions.push(`(${needConditions.join(' OR ')})`);
    }
    
    if (STATE_FILTER) conditions.push(`state = '${STATE_FILTER}'`);

    const where = conditions.join(' AND ');
    const limitSql = LIMIT ? `LIMIT ${LIMIT}` : '';

    const result = await pool.query(`
        SELECT id, business_name, slug, trade_category, suburb, city, state,
               source_url, description, photo_urls, logo_url, cover_photo_url,
               avg_rating, total_reviews, business_phone
        FROM businesses
        WHERE ${where}
        ORDER BY created_at DESC
        ${limitSql}
    `);

    const businesses = result.rows;
    console.log(`Found ${businesses.length} businesses to backfill\n`);

    if (businesses.length === 0) {
        console.log('Nothing to do!');
        await pool.end();
        return;
    }

    stats.startTime = Date.now();

    // Process in batches
    for (let i = 0; i < businesses.length; i += CONCURRENT) {
        const batch = businesses.slice(i, i + CONCURRENT);
        await processBatch(pool, batch);

        const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(0);
        const rate = elapsed > 0 ? ((stats.processed / (elapsed / 60))).toFixed(0) : 0;
        console.log(`Progress: ${stats.processed}/${businesses.length} | Desc: ${stats.descUpdated} | Photos: ${stats.photosUpdated} (+${stats.photosAdded}) | Skip: ${stats.skipped} | NotFound: ${stats.notFound} | Err: ${stats.errors} | ${rate}/min`);
    }

    await pool.end();

    const totalTime = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(1);
    console.log(`\n========== COMPLETE ==========`);
    console.log(`Time: ${totalTime} minutes`);
    console.log(`Processed: ${stats.processed} | Descriptions: ${stats.descUpdated} | Photos: ${stats.photosUpdated} (+${stats.photosAdded} new)`);
    console.log(`Skipped: ${stats.skipped} | Not found: ${stats.notFound} | Errors: ${stats.errors}`);
}

run().catch(e => { console.error('FATAL:', e); process.exit(1); });
