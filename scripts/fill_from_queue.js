/**
 * FILL FROM QUEUE
 * Reads suburb+trade combos logged by empty /local/... pages from the fill_queue table
 * and fills them using the Google Places API.
 *
 * Usage:
 *   node scripts/fill_from_queue.js              (fill all queued)
 *   node scripts/fill_from_queue.js --dry-run    (preview queue only)
 *   node scripts/fill_from_queue.js --limit 50   (cap at 50 combos)
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

// Map slug-style trade names back to TRADE_SEARCH_MAP keys
function resolveSearchTerm(tradeSlug) {
    const normalized = tradeSlug.replace(/-/g, ' ').toLowerCase();
    for (const [key, val] of Object.entries(TRADE_SEARCH_MAP)) {
        if (key.toLowerCase() === normalized) return { tradeName: key, searchTerm: val };
    }
    // Fuzzy: find closest key
    for (const [key, val] of Object.entries(TRADE_SEARCH_MAP)) {
        if (key.toLowerCase().includes(normalized) || normalized.includes(key.toLowerCase())) {
            return { tradeName: key, searchTerm: val };
        }
    }
    // Fallback: use the slug as-is
    return { tradeName: tradeSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), searchTerm: normalized };
}

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
    if (!res.ok) throw new Error(`Google API ${res.status}: ${(await res.text()).substring(0, 200)}`);
    return (await res.json()).places || [];
}

async function fetchAndSavePhoto(place, slug) {
    if (!place.photos?.length) return null;
    const photoUrl = `https://places.googleapis.com/v1/${place.photos[0].name}/media?maxWidthPx=200&maxHeightPx=200&key=${GOOGLE_API_KEY}`;
    try {
        const res = await fetch(photoUrl, { signal: AbortSignal.timeout(10000) });
        if (!res.ok) return null;
        const ct = res.headers.get('content-type') || 'image/jpeg';
        if (!ct.startsWith('image/')) return null;
        const buf = await res.arrayBuffer();
        if (buf.byteLength < MIN_LOGO_BYTES) return null;
        const ext = ct.includes('png') ? 'png' : 'jpg';
        const filename = `${slug}.${ext}`;
        fs.writeFileSync(path.join(LOGOS_DIR, filename), Buffer.from(buf));
        if (BLOB_TOKEN) {
            try {
                const blobRes = await fetch(`https://blob.vercel-storage.com/logos/${filename}`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${BLOB_TOKEN}`, 'x-content-type': ct, 'x-cache-control-max-age': '31536000' },
                    body: Buffer.from(buf),
                });
                if (blobRes.ok) return (await blobRes.json()).url;
            } catch { /* fallback to local */ }
        }
        return null;
    } catch { return null; }
}

async function fetchReviews(placeId, businessDbId, db) {
    try {
        const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
            headers: { 'X-Goog-Api-Key': GOOGLE_API_KEY, 'X-Goog-FieldMask': 'reviews' },
        });
        if (!res.ok) return 0;
        const reviews = (await res.json()).reviews || [];
        let added = 0;
        for (const r of reviews) {
            if (!r.text?.text) continue;
            const externalId = `gp-${placeId}-${r.publishTime || added}`;
            try {
                await db.query(`
                    INSERT INTO business_reviews (business_id, profile_name, rating, review_text, review_highlights, owner_answer, source, external_id)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (external_id) DO NOTHING
                `, [businessDbId, r.authorAttribution?.displayName || 'Anonymous', r.rating || 0, r.text.text, JSON.stringify([]), null, 'google_places', externalId]);
                added++;
            } catch { /* skip dupes */ }
        }
        return added;
    } catch { return 0; }
}

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

const delay = ms => new Promise(r => setTimeout(r, ms));

async function run() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const limitIdx = args.indexOf('--limit');
    const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1]) : 9999;

    if (!GOOGLE_API_KEY) { console.error('ERROR: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not set'); process.exit(1); }

    const db = new pg.Client(process.env.DATABASE_URL);
    await db.connect();

    // Read queue — unfilled only, oldest first
    const queueRes = await db.query(`
        SELECT id, state, city, suburb, trade, first_seen_at
        FROM fill_queue
        WHERE filled_at IS NULL
        ORDER BY first_seen_at ASC
        LIMIT $1
    `, [limit]);

    const queue = queueRes.rows;
    console.log(`\n📋 Fill queue: ${queue.length} combos pending\n`);

    if (queue.length === 0) {
        console.log('Nothing to fill. Queue is empty.');
        await db.end();
        return;
    }

    if (dryRun) {
        const byState = {};
        for (const row of queue) byState[row.state.toUpperCase()] = (byState[row.state.toUpperCase()] || 0) + 1;
        console.log('Queue breakdown by state:');
        for (const [st, cnt] of Object.entries(byState)) console.log(`  ${st}: ${cnt}`);
        console.log(`\nSample entries:`);
        queue.slice(0, 10).forEach(r => console.log(`  ${r.state.toUpperCase()} / ${r.suburb} / ${r.trade}`));
        const est = (queue.length / 1000 * 32).toFixed(2);
        console.log(`\nEstimated Google API cost: ~$${est} (Text Search, +reviews ~doubles)`);
        console.log('--dry-run complete.');
        await db.end();
        return;
    }

    let totalAdded = 0, totalLogos = 0, totalApiCalls = 0, totalSkipped = 0, totalReviews = 0;

    for (let i = 0; i < queue.length; i++) {
        const row = queue[i];
        const stateUpper = row.state.toUpperCase();
        const stateFull = STATE_FULL[stateUpper] || stateUpper;
        const { tradeName, searchTerm } = resolveSearchTerm(row.trade);

        if (i % 20 === 0) {
            console.log(`\n--- [${i}/${queue.length}] added:${totalAdded} logos:${totalLogos} reviews:${totalReviews} api:${totalApiCalls} ---`);
        }

        process.stdout.write(`[${i + 1}] ${stateUpper}/${row.suburb}/${tradeName}... `);

        try {
            totalApiCalls++;
            let places = await searchPlaces(`${searchTerm} in ${row.suburb} ${stateFull} Australia`, RESULTS_PER_TRADE);

            if (places.length === 0 && row.suburb !== row.city) {
                totalApiCalls++;
                places = await searchPlaces(`${searchTerm} in ${row.city} ${stateFull} Australia`, RESULTS_PER_TRADE);
            }

            if (places.length === 0) {
                process.stdout.write('0 results\n');
                totalSkipped++;
                // Still mark as filled so we don't keep retrying a genuinely empty area
                await db.query('UPDATE fill_queue SET filled_at = NOW() WHERE id = $1', [row.id]);
                await delay(DELAY_MS);
                continue;
            }

            let added = 0, logos = 0;
            for (const place of places) {
                if (!place.id) continue;
                try {
                    const name = place.displayName?.text || 'Unknown';
                    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')
                        + '-' + Math.random().toString(36).substr(2, 5);
                    const trustScore = Math.round((place.rating || 4.0) * 20);
                    const loc = extractLocation(place);
                    let logoUrl = null;
                    if (place.photos?.length) {
                        const result = await fetchAndSavePhoto(place, slug);
                        if (result && !result.startsWith('LOCAL:')) { logoUrl = result; logos++; }
                        else if (result) logos++;
                    }
                    const insertRes = await db.query(`
                        INSERT INTO businesses (
                            business_name, slug, trade_category, suburb, city, state, business_phone,
                            avg_rating, total_reviews, source_url, data_source,
                            logo_url, address, website, trust_score,
                            is_verified, status, listing_visibility, is_claimed, claim_status,
                            lat, lng
                        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
                        ON CONFLICT (source_url) DO UPDATE SET
                            avg_rating = EXCLUDED.avg_rating, total_reviews = EXCLUDED.total_reviews,
                            logo_url = COALESCE(EXCLUDED.logo_url, businesses.logo_url), updated_at = now()
                        RETURNING id
                    `, [
                        name, slug, tradeName,
                        loc.suburb || row.suburb, loc.city || row.city, loc.state || stateUpper,
                        place.nationalPhoneNumber || null,
                        place.rating || 0, place.userRatingCount || 0,
                        place.id, 'Google Places',
                        logoUrl, place.formattedAddress || null, place.websiteUri || null, trustScore,
                        true, 'active', 'public', false, 'unclaimed',
                        place.location?.latitude || null, place.location?.longitude || null,
                    ]);
                    added++;
                    const bizId = insertRes.rows[0]?.id;
                    if (bizId && (place.userRatingCount || 0) > 0) {
                        totalApiCalls++;
                        totalReviews += await fetchReviews(place.id, bizId, db);
                    }
                } catch (e) {
                    if (!e.message?.includes('duplicate')) { /* skip */ }
                }
            }

            totalAdded += added;
            totalLogos += logos;
            process.stdout.write(`+${added} businesses (${logos} logos)\n`);

            // Mark as filled
            await db.query('UPDATE fill_queue SET filled_at = NOW() WHERE id = $1', [row.id]);
        } catch (e) {
            process.stdout.write(`ERR: ${e.message?.substring(0, 80)}\n`);
        }

        await delay(DELAY_MS);
    }

    await db.end();
    console.log(`\n========== COMPLETE ==========`);
    console.log(`Queue processed:   ${queue.length}`);
    console.log(`Businesses added:  ${totalAdded}`);
    console.log(`Logos saved:       ${totalLogos}`);
    console.log(`Reviews added:     ${totalReviews}`);
    console.log(`API calls:         ${totalApiCalls}`);
    console.log(`No results (skipped): ${totalSkipped}`);
}

run().catch(console.error);
