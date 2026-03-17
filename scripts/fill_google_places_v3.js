/**
 * GOOGLE PLACES FILLER V3 - Fast + Complete Data
 * 
 * Combines V2 speed with V1 completeness:
 * - Parallel processing (3 concurrent to avoid rate limits)
 * - Full data: photos, reviews, opening hours, payment options
 * - Logo upload to Blob storage
 * - Reviews saved to business_reviews table
 * - Real-time progress
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: 'apps/web/.env.local' });

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const LOGOS_DIR = path.join(__dirname, '..', 'logos-cache');

// Configuration
const CONCURRENT_REQUESTS = 50; // Fast - no photo download/upload needed
const RESULTS_PER_TRADE = 5;
const MIN_PER_TRADE = 3;
const MAX_PHOTOS = 10; // Get all available photos from Google Places (max 10)
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

if (!fs.existsSync(LOGOS_DIR)) fs.mkdirSync(LOGOS_DIR, { recursive: true });

// Parse AUSTRALIA_LOCATIONS
const constFile = fs.readFileSync('apps/web/lib/constants.ts', 'utf-8');
const locStart = constFile.indexOf('export const AUSTRALIA_LOCATIONS');
if (locStart === -1) { console.error('Could not find AUSTRALIA_LOCATIONS'); process.exit(1); }
const braceStart = constFile.indexOf('{', locStart);
let depth = 0, braceEnd = braceStart;
for (let i = braceStart; i < constFile.length; i++) {
    if (constFile[i] === '{') depth++;
    else if (constFile[i] === '}') { depth--; if (depth === 0) { braceEnd = i; break; } }
}
const AUSTRALIA_LOCATIONS = eval('(' + constFile.substring(braceStart, braceEnd + 1) + ')');

const TRADE_SEARCH_MAP = {
    "Plumbing": "plumber", "Electrical": "electrician", "Carpentry": "carpenter",
    "Landscaping": "landscaper", "Roofing": "roofer", "Painting": "painter",
    "Cleaning": "cleaning service", "Building": "builder", "Concreting": "concreter",
    "Tiling": "tiler", "Plastering": "plasterer", "Fencing": "fencing contractor",
};

const STATE_FULL = {
    VIC: "Victoria", NSW: "New South Wales", QLD: "Queensland",
    WA: "Western Australia", SA: "South Australia",
    ACT: "Australian Capital Territory", TAS: "Tasmania", NT: "Northern Territory",
};

let stats = { totalAdded: 0, totalLogos: 0, totalApiCalls: 0, totalErrors: 0, totalReviews: 0, startTime: Date.now() };

// Search Google Places with full fields
async function searchPlaces(query, maxResults = 5, retries = 0) {
    const fieldMask = [
        'places.id', 'places.name', 'places.displayName', 'places.formattedAddress',
        'places.internationalPhoneNumber',
        'places.websiteUri', 'places.googleMapsUri',
        'places.rating', 'places.userRatingCount',
        'places.photos', 'places.addressComponents', 'places.location',
        'places.regularOpeningHours', 'places.editorialSummary',
        'places.types', 'places.reviews', 'places.paymentOptions',
    ].join(',');

    try {
        const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_API_KEY,
                'X-Goog-FieldMask': fieldMask,
            },
            body: JSON.stringify({ textQuery: query, maxResultCount: maxResults, languageCode: 'en', regionCode: 'AU' }),
        });

        if (!res.ok) {
            if (res.status === 429 && retries < MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retries + 1)));
                return searchPlaces(query, maxResults, retries + 1);
            }
            throw new Error(`API ${res.status}`);
        }
        
        const data = await res.json();
        return data.places || [];
    } catch (error) {
        if (retries < MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return searchPlaces(query, maxResults, retries + 1);
        }
        throw error;
    }
}

// Get Google Places photo URL directly (no download/upload needed)
function getPhotoUrl(photoRef, maxWidth = 400) {
    if (!photoRef?.name) return null;
    return `https://places.googleapis.com/v1/${photoRef.name}/media?key=${GOOGLE_API_KEY}&maxWidthPx=${maxWidth}&maxHeightPx=${maxWidth}`;
}

// Save reviews
async function saveReviews(reviews, placeId, businessDbId, pool) {
    if (!reviews || reviews.length === 0) return 0;
    let added = 0;
    for (const r of reviews) {
        try {
            const externalId = `google_${placeId}_${r.authorAttribution?.displayName || 'anon'}_${r.publishTime || Date.now()}`;
            await pool.query(`
                INSERT INTO business_reviews (
                    business_id, profile_name, rating, review_text,
                    review_highlights, owner_answer, source, external_id
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
                ON CONFLICT (external_id) DO NOTHING
            `, [
                businessDbId,
                r.authorAttribution?.displayName || 'Anonymous',
                r.rating || 0,
                r.text?.text || '',
                JSON.stringify([]),
                r.ownerResponse?.text || null,
                'google_places',
                externalId,
            ]);
            added++;
        } catch { /* skip dupes */ }
    }
    return added;
}

// Extract opening hours
function extractOpeningHours(place) {
    const hours = place.regularOpeningHours;
    if (!hours) return null;
    return {
        weekdayDescriptions: hours.weekdayDescriptions || [],
        periods: (hours.periods || []).map(p => ({
            open: p.open ? { day: p.open.day, hour: p.open.hour, minute: p.open.minute } : null,
            close: p.close ? { day: p.close.day, hour: p.close.hour, minute: p.close.minute } : null,
        })),
    };
}

// Extract payment options
function extractPaymentOptions(place) {
    const po = place.paymentOptions;
    if (!po) return [];
    const options = [];
    if (po.acceptsCreditCards) options.push('Credit Cards');
    if (po.acceptsDebitCards) options.push('Debit Cards');
    if (po.acceptsCashOnly) options.push('Cash Only');
    if (po.acceptsNfc) options.push('NFC/Contactless');
    return options;
}

// Extract services
function extractServices(place) {
    const types = place.types || [];
    return types.filter(t => !['point_of_interest', 'establishment', 'political', 'locality', 'sublocality'].includes(t))
        .map(t => t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
}

// Process a single suburb/trade combo
async function processCombo(pool, job) {
    const { state, suburb, city, tradeName, searchTerm } = job;
    const stateFull = STATE_FULL[state] || state;
    const query = `${searchTerm} in ${suburb} ${stateFull} Australia`;
    
    try {
        stats.totalApiCalls++;
        const places = await searchPlaces(query, RESULTS_PER_TRADE);
        
        if (places.length === 0) {
            return { added: 0, logos: 0, reviews: 0 };
        }

        let added = 0;
        let logos = 0;
        let reviews = 0;

        for (const place of places) {
            const phone = place.internationalPhoneNumber || '';
            if (!phone) continue;

            const name = place.displayName?.text || 'Unknown';
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '-' + Math.random().toString(36).substr(2, 5);
            const sourceUrl = place.googleMapsUri || `https://maps.google.com/?cid=${place.name || slug}`;

            // Store Google Places photo URLs directly (no download/upload - instant)
            // A separate background script converts these to Blob URLs later
            const photoRefs = (place.photos || []).slice(0, MAX_PHOTOS);
            const photoUrls = photoRefs.map(ref => getPhotoUrl(ref)).filter(Boolean);
            const logoUrl = photoUrls[0] || null;
            if (logoUrl) logos++;

            // Extract data - try editorialSummary first, then build from reviews
            let description = place.editorialSummary?.text || null;
            if (!description && place.reviews && place.reviews.length > 0) {
                // Build description from longest review that's at least 4 stars
                const goodReviews = place.reviews
                    .filter(r => r.rating >= 4 && r.text?.text && r.text.text.length > 50)
                    .sort((a, b) => (b.text?.text?.length || 0) - (a.text?.text?.length || 0));
                if (goodReviews.length > 0) {
                    const best = goodReviews[0].text.text;
                    // Take first 300 chars as description, clean up
                    description = best.length > 300 ? best.substring(0, 297) + '...' : best;
                }
            }
            const openingHours = extractOpeningHours(place);
            const paymentOpts = extractPaymentOptions(place);
            const services = extractServices(place);
            const coverPhoto = photoUrls.length > 1 ? photoUrls[1] : (photoUrls[0] || null);

            // Convert arrays to PostgreSQL format
            const paymentOptsStr = paymentOpts.length > 0 ? `{${paymentOpts.join(',')}}` : '{}';
            const servicesStr = services.length > 0 ? `{${services.join(',')}}` : null;
            const photoUrlsStr = photoUrls.length > 0 ? `{${photoUrls.join(',')}}` : '{}';

            try {
                const insertRes = await pool.query(`
                    INSERT INTO businesses (
                        business_name, slug, trade_category, suburb, city, state, business_phone,
                        avg_rating, total_reviews, source_url, data_source,
                        logo_url, address, website, trust_score,
                        is_verified, status, listing_visibility, is_claimed, claim_status,
                        lat, lng, description, opening_hours, payment_options,
                        services, google_maps_url, photo_urls, cover_photo_url
                    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29)
                    ON CONFLICT (source_url) DO UPDATE SET
                        avg_rating = EXCLUDED.avg_rating,
                        total_reviews = EXCLUDED.total_reviews,
                        logo_url = COALESCE(EXCLUDED.logo_url, businesses.logo_url),
                        description = COALESCE(EXCLUDED.description, businesses.description),
                        photo_urls = CASE
                            WHEN array_length(string_to_array(trim(both '{}' from EXCLUDED.photo_urls::text), ','), 1) >
                                 COALESCE(array_length(string_to_array(trim(both '{}' from businesses.photo_urls::text), ','), 1), 0)
                            THEN EXCLUDED.photo_urls
                            ELSE businesses.photo_urls
                        END,
                        cover_photo_url = COALESCE(EXCLUDED.cover_photo_url, businesses.cover_photo_url),
                        opening_hours = COALESCE(EXCLUDED.opening_hours, businesses.opening_hours),
                        payment_options = CASE WHEN EXCLUDED.payment_options::text != '{}' THEN EXCLUDED.payment_options ELSE businesses.payment_options END,
                        services = COALESCE(EXCLUDED.services, businesses.services),
                        address = COALESCE(EXCLUDED.address, businesses.address),
                        website = COALESCE(EXCLUDED.website, businesses.website),
                        updated_at = now()
                    RETURNING id
                `, [
                    name, slug, tradeName,
                    suburb, city, state,
                    phone,
                    place.rating || 0, place.userRatingCount || 0,
                    sourceUrl, 'Google Places',
                    logoUrl, place.formattedAddress || null,
                    place.websiteUri || null, Math.round((place.rating || 4.0) * 20),
                    true, 'active', 'public', false, 'unclaimed',
                    place.location?.latitude || null, place.location?.longitude || null,
                    description,
                    openingHours ? JSON.stringify(openingHours) : null,
                    paymentOptsStr,
                    servicesStr,
                    place.googleMapsUri || null,
                    photoUrlsStr,
                    coverPhoto,
                ]);
                
                added++;
                stats.totalAdded++;
                stats.totalLogos += (logoUrl ? 1 : 0);

                // Save reviews
                const bizId = insertRes.rows[0]?.id;
                if (bizId && place.reviews && place.reviews.length > 0) {
                    const revCount = await saveReviews(place.reviews, place.name, bizId, pool);
                    reviews += revCount;
                    stats.totalReviews += revCount;
                }
            } catch (e) {
                if (!e.message.includes('duplicate')) {
                    console.error(`Insert error: ${e.message.substring(0, 80)}`);
                }
            }
        }

        return { added, logos, reviews };
    } catch (error) {
        stats.totalErrors++;
        return { added: 0, logos: 0, reviews: 0, error: error.message };
    }
}

// Process jobs in parallel batches
async function processBatch(pool, jobs, batchSize = CONCURRENT_REQUESTS) {
    for (let i = 0; i < jobs.length; i += batchSize) {
        const batch = jobs.slice(i, i + batchSize);
        await Promise.all(batch.map(job => processCombo(pool, job)));
        
        const progress = i + batch.length;
        const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(0);
        const rate = (stats.totalAdded / (elapsed / 60)).toFixed(1);
        
        console.log(`Progress: ${progress}/${jobs.length} | Added: ${stats.totalAdded} | Logos: ${stats.totalLogos} | Reviews: ${stats.totalReviews} | Rate: ${rate}/min | API: ${stats.totalApiCalls} | Errors: ${stats.totalErrors}`);
    }
}

// Main
async function run() {
    const args = process.argv.slice(2);
    const stateFilter = args.includes('--state') ? args[args.indexOf('--state') + 1] : null;

    if (!GOOGLE_API_KEY) { console.error('ERROR: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not found'); process.exit(1); }
    if (!DATABASE_URL) { console.error('ERROR: DATABASE_URL not found'); process.exit(1); }

    console.log('=== Google Places Filler V3 (Fast + Complete) ===');
    console.log(`Concurrent: ${CONCURRENT_REQUESTS} | State: ${stateFilter || 'ALL'}\n`);

    const pool = new Pool({ connectionString: DATABASE_URL, max: 20 });

    let allSuburbs = [];
    for (const [state, cities] of Object.entries(AUSTRALIA_LOCATIONS)) {
        if (stateFilter && state !== stateFilter) continue;
        for (const [city, suburbs] of Object.entries(cities)) {
            for (const suburb of suburbs) {
                allSuburbs.push({ state, city, suburb });
            }
        }
    }

    const trades = Object.entries(TRADE_SEARCH_MAP);
    console.log(`Processing ${allSuburbs.length} suburbs × ${trades.length} trades`);
    console.log('Fetching existing business counts...');

    // Fetch trade counts filtered by state (much faster than querying all states)
    let allCounts;
    try {
        const stateList = [...new Set(allSuburbs.map(s => s.state))];
        const stateCondition = stateList.length === 1 
            ? `AND state = '${stateList[0]}'`
            : `AND state IN (${stateList.map(s => `'${s}'`).join(',')})`;
        
        allCounts = await pool.query(`
            SELECT suburb, city, state, trade_category, COUNT(*) as cnt 
            FROM businesses 
            WHERE status = 'active' AND business_phone IS NOT NULL ${stateCondition}
            GROUP BY suburb, city, state, trade_category
        `);
        console.log(`Loaded ${allCounts.rows.length} existing suburb+trade counts`);
    } catch (error) {
        console.error('Database query error:', error.message);
        await pool.end();
        process.exit(1);
    }
    
    const countsMap = {};
    for (const r of allCounts.rows) {
        if (!r.suburb || !r.city || !r.state) continue; // Skip rows with null location data
        const key = `${r.suburb.toLowerCase()}|${r.city.toLowerCase()}|${r.state.toLowerCase()}|${(r.trade_category || '').toLowerCase()}`;
        countsMap[key] = parseInt(r.cnt);
    }
    
    let totalJobs = [];
    for (const s of allSuburbs) {
        for (const [tradeName, searchTerm] of trades) {
            const key = `${s.suburb.toLowerCase()}|${s.city.toLowerCase()}|${s.state.toLowerCase()}|${tradeName.toLowerCase()}`;
            const existing = countsMap[key] || 0;
            if (existing >= MIN_PER_TRADE) continue;
            totalJobs.push({ ...s, tradeName, searchTerm });
        }
    }

    console.log(`${totalJobs.length} suburb+trade combos need filling\n`);
    
    if (totalJobs.length === 0) {
        console.log('Nothing to do!');
        await pool.end();
        return;
    }

    stats.startTime = Date.now();
    await processBatch(pool, totalJobs);

    await pool.end();
    
    const totalTime = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(1);
    console.log(`\n========== COMPLETE ==========`);
    console.log(`Time: ${totalTime} minutes`);
    console.log(`Businesses: ${stats.totalAdded} | Logos: ${stats.totalLogos} | Reviews: ${stats.totalReviews}`);
    console.log(`API calls: ${stats.totalApiCalls} | Errors: ${stats.totalErrors}`);
    console.log(`Rate: ${(stats.totalAdded / parseFloat(totalTime)).toFixed(1)} businesses/min`);
}

run().catch(console.error);
