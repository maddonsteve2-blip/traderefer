/**
 * GOOGLE PLACES TRADE FILLER v2
 * Uses Google Places API (New) Text Search to fill all trades per suburb.
 * Captures MAXIMUM data: phone, website, description, opening hours,
 * payment options, multiple photos, reviews, Google Maps URL, services.
 * Skips trades that already exist. Saves logos locally + uploads to Blob.
 *
 * Usage:
 *   node scripts/fill_google_places.js                  (all states)
 *   node scripts/fill_google_places.js --state NSW      (one state)
 *   node scripts/fill_google_places.js --dry-run        (preview)
 *   node scripts/fill_google_places.js --empty-only     (only suburbs with 0 businesses)
 */

const pg = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: 'apps/web/.env.local' });

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL || process.env.DATABASE_URL_FROM_DOTENV;
const LOGOS_DIR = path.join(__dirname, '..', 'logos-cache');
const RESULTS_PER_TRADE = 5;
const MIN_PER_TRADE = 3;
const MAX_PHOTOS = 6;
const MIN_LOGO_BYTES = 2000;
const DELAY_MS = 300;

// Ensure logos-cache dir exists
if (!fs.existsSync(LOGOS_DIR)) fs.mkdirSync(LOGOS_DIR, { recursive: true });

const STATE_FULL = {
    VIC: "Victoria", NSW: "New South Wales", QLD: "Queensland",
    WA: "Western Australia", SA: "South Australia",
    ACT: "Australian Capital Territory", TAS: "Tasmania", NT: "Northern Territory",
};

const TRADE_SEARCH_MAP = {
    "Plumbing": "plumber", "Electrical": "electrician", "Carpentry": "carpenter",
    "Landscaping": "landscaper", "Roofing": "roofer", "Painting": "painter",
    "Cleaning": "cleaning service", "Building": "builder", "Concreting": "concreter",
    "Tiling": "tiler", "Plastering": "plasterer", "Fencing": "fencing contractor",
    "Demolition": "demolition contractor", "Excavation": "excavation contractor",
    "Air Conditioning & Heating": "air conditioning", "Solar & Energy": "solar installation",
    "Pest Control": "pest control", "Tree Lopping & Removal": "tree service",
    "Gardening & Lawn Care": "gardener", "Mowing": "lawn mowing service",
    "Pool & Spa": "pool service", "Bathroom Renovation": "bathroom renovation",
    "Kitchen Renovation": "kitchen renovation", "Flooring": "flooring contractor",
    "Glazing & Windows": "glazier", "Guttering": "gutter installer",
    "Handyman": "handyman", "Insulation": "insulation contractor",
    "Locksmith": "locksmith", "Paving": "paving contractor",
    "Rendering": "rendering contractor", "Scaffolding": "scaffolding",
    "Security Systems": "security system installer", "Waterproofing": "waterproofing contractor",
    "Welding & Fabrication": "welder", "Garage Doors": "garage door service",
    "Blinds & Curtains": "blinds curtains", "Cabinet Making": "cabinet maker",
    "Decking": "decking contractor", "Drainage": "drainage contractor",
    "Gas Fitting": "gas fitter", "Irrigation": "irrigation contractor",
    "Rubbish Removal": "rubbish removal", "Shed Building": "shed builder",
    "Stonemasonry": "stonemason",
};

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

// --- Google Places Text Search (maximum fields) ---
async function searchPlaces(query, maxResults = 5) {
    const fieldMask = [
        'places.id', 'places.displayName', 'places.formattedAddress',
        'places.shortFormattedAddress',
        'places.nationalPhoneNumber', 'places.internationalPhoneNumber',
        'places.websiteUri', 'places.googleMapsUri',
        'places.rating', 'places.userRatingCount',
        'places.photos', 'places.addressComponents', 'places.location',
        'places.regularOpeningHours', 'places.businessStatus',
        'places.editorialSummary',
        'places.types', 'places.primaryType', 'places.primaryTypeDisplayName',
        'places.reviews', 'places.paymentOptions',
    ].join(',');

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
        const err = await res.text();
        throw new Error(`Google API ${res.status}: ${err.substring(0, 200)}`);
    }
    const data = await res.json();
    return data.places || [];
}

// --- Save reviews from search results (no extra API call needed) ---
async function saveReviews(reviews, placeId, businessDbId, db) {
    if (!reviews || reviews.length === 0) return 0;
    let added = 0;
    for (const r of reviews) {
        if (!r.text?.text) continue;
        const externalId = `gp-${placeId}-${r.publishTime || added}`;
        try {
            await db.query(`
                INSERT INTO business_reviews (
                    business_id, profile_name, rating, review_text,
                    review_highlights, owner_answer, source, external_id
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
                ON CONFLICT (external_id) DO NOTHING
            `, [
                businessDbId,
                r.authorAttribution?.displayName || 'Anonymous',
                r.rating || 0,
                r.text.text,
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

// --- Fetch multiple photos for a place ---
async function fetchMultiplePhotos(place, slug) {
    if (!place.photos || place.photos.length === 0) return { logo: null, photos: [] };
    let logoUrl = null;
    const photoUrls = [];

    const photosToFetch = place.photos.slice(0, MAX_PHOTOS);
    for (let pi = 0; pi < photosToFetch.length; pi++) {
        const photoRef = photosToFetch[pi].name;
        const size = 400; // gallery photos only, no logos from Google Places
        const photoUrl = `https://places.googleapis.com/v1/${photoRef}/media?maxWidthPx=${size}&maxHeightPx=${size}&key=${GOOGLE_API_KEY}`;
        try {
            const res = await fetch(photoUrl, { signal: AbortSignal.timeout(10000) });
            if (!res.ok) continue;
            const ct = res.headers.get('content-type') || 'image/jpeg';
            if (!ct.startsWith('image/')) continue;
            const buf = await res.arrayBuffer();
            if (buf.byteLength < MIN_LOGO_BYTES) continue;

            const ext = ct.includes('png') ? 'png' : 'jpg';
            const suffix = pi === 0 ? '' : `-${pi}`;
            const filename = `${slug}${suffix}.${ext}`;
            const localPath = path.join(LOGOS_DIR, filename);
            fs.writeFileSync(localPath, Buffer.from(buf));

            // Try Blob upload
            let blobUrl = null;
            if (BLOB_TOKEN) {
                try {
                    const blobRes = await fetch(`https://blob.vercel-storage.com/logos/${filename}`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${BLOB_TOKEN}`, 'x-content-type': ct, 'x-cache-control-max-age': '31536000' },
                        body: Buffer.from(buf),
                    });
                    if (blobRes.ok) { const j = await blobRes.json(); blobUrl = j.url; }
                } catch { /* Blob failed */ }
            }

            if (pi === 0) logoUrl = blobUrl;
            if (blobUrl) photoUrls.push(blobUrl);
        } catch { /* skip */ }
    }
    return { logo: logoUrl, photos: photoUrls };
}

// --- Extract opening hours ---
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

// --- Extract payment options ---
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

// --- Extract services from types ---
function extractServices(place) {
    const types = place.types || [];
    return types.filter(t => !['point_of_interest', 'establishment', 'political', 'locality', 'sublocality'].includes(t))
        .map(t => t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
}

// --- Extract location from addressComponents ---
function extractLocation(place) {
    const components = place.addressComponents || [];
    let suburb = '', city = '', state = '';
    for (const c of components) {
        const types = c.types || [];
        if (types.includes('locality')) city = c.longText;
        if (types.includes('sublocality') || types.includes('sublocality_level_1')) suburb = c.longText;
        if (types.includes('administrative_area_level_1')) state = c.shortText;
    }
    return { suburb: suburb || city, city, state };
}

const delay = (ms) => new Promise(r => setTimeout(r, ms));

// --- Main ---
async function run() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const stateFilter = args.includes('--state') ? args[args.indexOf('--state') + 1] : null;
    const emptyOnly = args.includes('--empty-only');

    if (!GOOGLE_API_KEY) { console.error('ERROR: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not found'); process.exit(1); }

    const db = new pg.Client(DATABASE_URL);
    await db.connect();

    // Build suburb list
    let allSuburbs = [];
    for (const [state, cities] of Object.entries(AUSTRALIA_LOCATIONS)) {
        if (stateFilter && state !== stateFilter) continue;
        for (const [city, suburbs] of Object.entries(cities)) {
            for (const suburb of suburbs) {
                allSuburbs.push({ state, city, suburb });
            }
        }
    }

    // --empty-only: filter to suburbs with 0 businesses
    if (emptyOnly) {
        const countRes = await db.query(`SELECT LOWER(suburb) as sub, COUNT(*) as cnt FROM businesses GROUP BY LOWER(suburb)`);
        const subCounts = {};
        for (const r of countRes.rows) subCounts[r.sub] = parseInt(r.cnt);
        const before = allSuburbs.length;
        allSuburbs = allSuburbs.filter(s => !subCounts[s.suburb.toLowerCase()]);
        console.log(`--empty-only: filtered ${before} → ${allSuburbs.length} suburbs with 0 businesses`);
    }

    const trades = Object.entries(TRADE_SEARCH_MAP);
    console.log(`Checking ${allSuburbs.length} suburbs × ${trades.length} trades`);

    // Find missing/thin combos (resume-safe: skips suburb+trade with >= MIN_PER_TRADE businesses)
    let totalJobs = [];
    let skippedFull = 0;
    for (const s of allSuburbs) {
        const res = await db.query(
            `SELECT trade_category, COUNT(*) as cnt FROM businesses 
             WHERE status = 'active' AND suburb ILIKE $1 AND city ILIKE $2 AND state ILIKE $3
             AND business_phone IS NOT NULL
             GROUP BY trade_category`,
            [s.suburb, s.city, s.state]
        );
        const tradeCounts = {};
        for (const r of res.rows) tradeCounts[(r.trade_category || '').toLowerCase()] = parseInt(r.cnt);
        
        for (const [tradeName, searchTerm] of trades) {
            const existing = tradeCounts[tradeName.toLowerCase()] || 0;
            if (existing >= MIN_PER_TRADE) { skippedFull++; continue; }
            totalJobs.push({ ...s, tradeName, searchTerm, existing });
        }
    }
    console.log(`Skipped ${skippedFull} suburb+trade combos already at >= ${MIN_PER_TRADE} businesses (resume)`);

    console.log(`${totalJobs.length} suburb+trade combos need filling\n`);

    if (dryRun) {
        const byState = {};
        for (const j of totalJobs) byState[j.state] = (byState[j.state] || 0) + 1;
        for (const [st, cnt] of Object.entries(byState)) console.log(`  ${st}: ${cnt} combos`);
        const searchCost = (totalJobs.length / 1000 * 35).toFixed(2);
        const photoCost = (totalJobs.length * RESULTS_PER_TRADE * MAX_PHOTOS / 1000 * 7).toFixed(2);
        console.log(`\nEstimated cost: Text Search ~$${searchCost} + Photos ~$${photoCost} = ~$${(parseFloat(searchCost) + parseFloat(photoCost)).toFixed(2)}`);
        console.log('--dry-run complete.');
        await db.end();
        return;
    }

    let totalAdded = 0, totalLogos = 0, totalApiCalls = 0, totalSkipped = 0, totalReviews = 0;

    for (let i = 0; i < totalJobs.length; i++) {
        const j = totalJobs[i];
        const stateFull = STATE_FULL[j.state] || j.state;

        if (i % 10 === 0 || i === 0) {
            console.log(`\n--- Progress: ${i}/${totalJobs.length} | added: ${totalAdded} | logos: ${totalLogos} | reviews: ${totalReviews} | API: ${totalApiCalls} ---`);
        }

        process.stdout.write(`[${i + 1}] ${j.state}>${j.suburb}>${j.tradeName}... `);

        try {
            totalApiCalls++;
            const query = `${j.searchTerm} in ${j.suburb} ${stateFull} Australia`;
            let places = await searchPlaces(query, RESULTS_PER_TRADE);

            if (places.length === 0 && j.suburb !== j.city) {
                totalApiCalls++;
                const fallbackQuery = `${j.searchTerm} in ${j.city} ${stateFull} Australia`;
                places = await searchPlaces(fallbackQuery, RESULTS_PER_TRADE);
            }

            if (places.length === 0) {
                console.log('0 results');
                totalSkipped++;
                await delay(DELAY_MS);
                continue;
            }

            let added = 0, logos = 0;

            let noPhone = 0;
            for (const place of places) {
                const sourceUrl = place.id;
                if (!sourceUrl) continue;

                // SKIP businesses without phone, logo, OR website — all 3 required
                const phone = place.nationalPhoneNumber || place.internationalPhoneNumber || null;
                if (!phone) { noPhone++; continue; }
                if (!place.photos || place.photos.length === 0) { noPhone++; continue; }
                if (!place.websiteUri) { noPhone++; continue; }

                try {
                    const name = place.displayName?.text || 'Unknown';
                    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')
                        + '-' + Math.random().toString(36).substr(2, 5);
                    const trustScore = Math.round((place.rating || 4.0) * 20);
                    const loc = extractLocation(place);

                    // Fetch multiple photos (logo + gallery)
                    const { logo: logoUrl, photos: photoUrls } = await fetchMultiplePhotos(place, slug);
                    if (logoUrl) logos++;

                    // Extract all enriched data
                    const description = place.editorialSummary?.text || null;
                    const openingHours = extractOpeningHours(place);
                    const paymentOpts = extractPaymentOptions(place);
                    const services = extractServices(place);
                    const googleMapsUrl = place.googleMapsUri || null;
                    const coverPhoto = photoUrls.length > 1 ? photoUrls[1] : (photoUrls[0] || null);

                    // Convert arrays to PostgreSQL format
                    const paymentOptsStr = paymentOpts.length > 0 ? `{${paymentOpts.join(',')}}` : '{}';
                    const servicesStr = services.length > 0 ? `{${services.join(',')}}` : null;
                    const photoUrlsStr = photoUrls.length > 0 ? `{${photoUrls.join(',')}}` : '{}';

                    const placeLat = place.location?.latitude || null;
                    const placeLng = place.location?.longitude || null;

                    const insertRes = await db.query(`
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
                            lat = COALESCE(EXCLUDED.lat, businesses.lat),
                            lng = COALESCE(EXCLUDED.lng, businesses.lng),
                            description = COALESCE(EXCLUDED.description, businesses.description),
                            opening_hours = COALESCE(EXCLUDED.opening_hours, businesses.opening_hours),
                            payment_options = CASE WHEN EXCLUDED.payment_options != '{}' THEN EXCLUDED.payment_options ELSE businesses.payment_options END,
                            services = COALESCE(EXCLUDED.services, businesses.services),
                            google_maps_url = COALESCE(EXCLUDED.google_maps_url, businesses.google_maps_url),
                            photo_urls = CASE WHEN array_length(EXCLUDED.photo_urls, 1) > 0 THEN EXCLUDED.photo_urls ELSE businesses.photo_urls END,
                            cover_photo_url = COALESCE(EXCLUDED.cover_photo_url, businesses.cover_photo_url),
                            business_phone = COALESCE(EXCLUDED.business_phone, businesses.business_phone),
                            updated_at = now()
                        RETURNING id
                    `, [
                        name, slug, j.tradeName,
                        j.suburb, j.city, j.state,
                        phone,
                        place.rating || 0, place.userRatingCount || 0,
                        sourceUrl, 'Google Places',
                        logoUrl, place.formattedAddress || null,
                        place.websiteUri || null, trustScore,
                        true, 'active', 'public', false, 'unclaimed',
                        placeLat, placeLng,
                        description,
                        openingHours ? JSON.stringify(openingHours) : null,
                        paymentOptsStr,
                        servicesStr,
                        googleMapsUrl,
                        photoUrlsStr,
                        coverPhoto,
                    ]);
                    added++;

                    // Save reviews from search results (no extra API call!)
                    const bizId = insertRes.rows[0]?.id;
                    if (bizId && place.reviews && place.reviews.length > 0) {
                        const revCount = await saveReviews(place.reviews, sourceUrl, bizId, db);
                        totalReviews += revCount;
                    }
                } catch (e) {
                    if (e.message.includes('duplicate')) { 
                        console.log(`  ⚠️  Skipped (duplicate): ${place.displayName?.text}`);
                    } else if (e.message.includes('column')) {
                        console.log(`  ❌ Schema error: ${e.message.substring(0, 80)}`);
                    } else {
                        console.log(`  ❌ Error: ${e.message.substring(0, 80)}`);
                    }
                }
            }

            totalAdded += added;
            totalLogos += logos;
            
            // Update progress display immediately when businesses are added
            if (added > 0) {
                console.log(`+${added} (${logos} logos${noPhone ? ', ' + noPhone + ' skipped-no-phone' : ''}) [total: ${totalAdded}]`);
                console.log(`\n--- Progress: ${i + 1}/${totalJobs.length} | added: ${totalAdded} | logos: ${totalLogos} | reviews: ${totalReviews} | API: ${totalApiCalls} ---`);
            } else {
                console.log(`+${added} (${logos} logos${noPhone ? ', ' + noPhone + ' skipped-no-phone' : ''})`);
            }
        } catch (e) {
            console.log(`ERR: ${e.message.substring(0, 100)}`);
        }

        await delay(DELAY_MS);
    }

    await db.end();
    console.log(`\n========== COMPLETE ==========`);
    console.log(`API calls: ${totalApiCalls}`);
    console.log(`Businesses added: ${totalAdded}`);
    console.log(`Logos saved: ${totalLogos} (local: ${LOGOS_DIR})`);
    console.log(`Reviews added: ${totalReviews}`);
    console.log(`Trades with no results: ${totalSkipped}`);
}

run().catch(console.error);
