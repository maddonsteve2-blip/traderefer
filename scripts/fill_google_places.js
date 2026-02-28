/**
 * GOOGLE PLACES TRADE FILLER
 * Uses Google Places API (New) Text Search to fill all trades per suburb.
 * Skips trades that already exist. Saves logos locally + uploads to Blob if available.
 * Fetches reviews via Place Details API.
 *
 * Usage:
 *   node scripts/fill_google_places.js                  (all states)
 *   node scripts/fill_google_places.js --state NSW      (one state)
 *   node scripts/fill_google_places.js --dry-run        (preview)
 */

const pg = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: 'apps/web/.env.local' });

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const LOGOS_DIR = path.join(__dirname, '..', 'logos-cache');
const RESULTS_PER_TRADE = 5;
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
const match = constFile.match(/export const AUSTRALIA_LOCATIONS[^=]*=\s*(\{[\s\S]*\});/);
if (!match) { console.error('Could not parse AUSTRALIA_LOCATIONS'); process.exit(1); }
const AUSTRALIA_LOCATIONS = eval('(' + match[1] + ')');

// --- Google Places Text Search ---
async function searchPlaces(query, maxResults = 5) {
    const fieldMask = [
        'places.id', 'places.displayName', 'places.formattedAddress',
        'places.nationalPhoneNumber', 'places.websiteUri', 'places.rating',
        'places.userRatingCount', 'places.photos', 'places.addressComponents',
        'places.location',
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

// --- Fetch photo, save locally, try Blob upload ---
async function fetchAndSavePhoto(place, slug) {
    if (!place.photos || place.photos.length === 0) return null;
    const photoRef = place.photos[0].name;
    const photoUrl = `https://places.googleapis.com/v1/${photoRef}/media?maxWidthPx=200&maxHeightPx=200&key=${GOOGLE_API_KEY}`;

    try {
        const res = await fetch(photoUrl, { signal: AbortSignal.timeout(10000) });
        if (!res.ok) return null;
        const ct = res.headers.get('content-type') || 'image/jpeg';
        if (!ct.startsWith('image/')) return null;
        const buf = await res.arrayBuffer();
        if (buf.byteLength < MIN_LOGO_BYTES) return null;

        const ext = ct.includes('png') ? 'png' : 'jpg';
        const filename = `${slug}.${ext}`;
        const localPath = path.join(LOGOS_DIR, filename);

        // Save locally
        fs.writeFileSync(localPath, Buffer.from(buf));

        // Try Blob upload
        if (BLOB_TOKEN) {
            try {
                const blobRes = await fetch(`https://blob.vercel-storage.com/logos/${filename}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${BLOB_TOKEN}`,
                        'x-content-type': ct,
                        'x-cache-control-max-age': '31536000',
                    },
                    body: Buffer.from(buf),
                });
                if (blobRes.ok) {
                    const blobJson = await blobRes.json();
                    return blobJson.url; // Return Blob URL if it works
                }
            } catch { /* Blob failed, use local */ }
        }

        // Return a marker so we know logo exists locally
        return `LOCAL:${filename}`;
    } catch {
        return null;
    }
}

// --- Fetch reviews via Place Details ---
async function fetchReviews(placeId, businessDbId, db) {
    try {
        const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
            method: 'GET',
            headers: { 'X-Goog-Api-Key': GOOGLE_API_KEY, 'X-Goog-FieldMask': 'reviews' },
        });
        if (!res.ok) return 0;
        const data = await res.json();
        const reviews = data.reviews || [];
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
                    null,
                    'google_places',
                    externalId,
                ]);
                added++;
            } catch { /* skip dupes */ }
        }
        return added;
    } catch { return 0; }
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

    if (!GOOGLE_API_KEY) { console.error('ERROR: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not found'); process.exit(1); }

    const db = new pg.Client(process.env.DATABASE_URL);
    await db.connect();

    // Build suburb list
    const allSuburbs = [];
    for (const [state, cities] of Object.entries(AUSTRALIA_LOCATIONS)) {
        if (stateFilter && state !== stateFilter) continue;
        for (const [city, suburbs] of Object.entries(cities)) {
            for (const suburb of suburbs) {
                allSuburbs.push({ state, city, suburb });
            }
        }
    }

    const trades = Object.entries(TRADE_SEARCH_MAP);
    console.log(`Checking ${allSuburbs.length} suburbs × ${trades.length} trades`);

    // Find missing combos
    let totalJobs = [];
    for (const s of allSuburbs) {
        const res = await db.query(
            "SELECT DISTINCT trade_category FROM businesses WHERE status = 'active' AND (city ILIKE $1 OR suburb ILIKE $1)",
            [s.suburb]
        );
        const existingTrades = new Set(res.rows.map(r => r.trade_category?.toLowerCase() || ''));
        for (const [tradeName, searchTerm] of trades) {
            const tradeLC = tradeName.toLowerCase();
            const hasIt = [...existingTrades].some(t =>
                t.includes(tradeLC) || tradeLC.includes(t) || t.includes(searchTerm) || searchTerm.includes(t)
            );
            if (!hasIt) totalJobs.push({ ...s, tradeName, searchTerm });
        }
    }

    console.log(`${totalJobs.length} suburb+trade combos need filling\n`);

    if (dryRun) {
        const byState = {};
        for (const j of totalJobs) byState[j.state] = (byState[j.state] || 0) + 1;
        for (const [st, cnt] of Object.entries(byState)) console.log(`  ${st}: ${cnt} combos`);
        const estimatedCost = (totalJobs.length / 1000 * 32).toFixed(2);
        console.log(`\nEstimated Google API cost: ~$${estimatedCost} (Text Search only, +reviews ~doubles it)`);
        console.log('--dry-run complete.');
        await db.end();
        return;
    }

    let totalAdded = 0, totalLogos = 0, totalApiCalls = 0, totalSkipped = 0, totalReviews = 0;

    for (let i = 0; i < totalJobs.length; i++) {
        const j = totalJobs[i];
        const stateFull = STATE_FULL[j.state] || j.state;

        if (i % 50 === 0) {
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

            for (const place of places) {
                const sourceUrl = place.id;
                if (!sourceUrl) continue;

                try {
                    const name = place.displayName?.text || 'Unknown';
                    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')
                        + '-' + Math.random().toString(36).substr(2, 5);
                    const trustScore = Math.round((place.rating || 4.0) * 20);
                    const loc = extractLocation(place);

                    // Fetch & save photo
                    let logoUrl = null;
                    if (place.photos && place.photos.length > 0) {
                        const result = await fetchAndSavePhoto(place, slug);
                        if (result) {
                            logoUrl = result.startsWith('LOCAL:') ? null : result; // Only store Blob URLs in DB
                            logos++;
                        }
                    }

                    const placeLat = place.location?.latitude || null;
                    const placeLng = place.location?.longitude || null;

                    const insertRes = await db.query(`
                        INSERT INTO businesses (
                            business_name, slug, trade_category, suburb, city, state, business_phone,
                            avg_rating, total_reviews, source_url, data_source,
                            logo_url, address, website, trust_score,
                            is_verified, status, listing_visibility, is_claimed, claim_status,
                            lat, lng
                        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
                        ON CONFLICT (source_url) DO UPDATE SET
                            avg_rating = EXCLUDED.avg_rating,
                            total_reviews = EXCLUDED.total_reviews,
                            logo_url = COALESCE(EXCLUDED.logo_url, businesses.logo_url),
                            lat = COALESCE(EXCLUDED.lat, businesses.lat),
                            lng = COALESCE(EXCLUDED.lng, businesses.lng),
                            updated_at = now()
                        RETURNING id
                    `, [
                        name, slug, j.tradeName,
                        j.suburb, j.city, j.state,
                        place.nationalPhoneNumber || null,
                        place.rating || 0, place.userRatingCount || 0,
                        sourceUrl, 'Google Places',
                        logoUrl, place.formattedAddress || null,
                        place.websiteUri || null, trustScore,
                        true, 'active', 'public', false, 'unclaimed',
                        placeLat, placeLng,
                    ]);
                    added++;

                    // Fetch reviews
                    const bizId = insertRes.rows[0]?.id;
                    if (bizId && (place.userRatingCount || 0) > 0) {
                        totalApiCalls++;
                        const revCount = await fetchReviews(sourceUrl, bizId, db);
                        totalReviews += revCount;
                    }
                } catch (e) {
                    if (!e.message.includes('duplicate')) { /* skip */ }
                }
            }

            totalAdded += added;
            totalLogos += logos;
            console.log(`+${added} (${logos} logos)`);
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
