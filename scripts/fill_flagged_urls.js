/**
 * Fill businesses for URLs flagged by Google Search Console
 * Reads Table.csv and populates only the affected suburb+trade combinations
 */

const pg = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: 'apps/web/.env.local' });

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const LOGOS_DIR = path.join(__dirname, '..', 'logos-cache');
const RESULTS_PER_TRADE = 5;
const MAX_PHOTOS = 6;
const MIN_LOGO_BYTES = 2000;
const DELAY_MS = 300;

if (!fs.existsSync(LOGOS_DIR)) fs.mkdirSync(LOGOS_DIR, { recursive: true });

// Parse CSV file
const csvPath = path.join(__dirname, '..', 'Table.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.split('\n').slice(1).filter(l => l.trim());

// Extract unique suburb+trade combinations from /local/ URLs
const jobs = new Set();
for (const line of lines) {
    const url = line.split(',')[0];
    if (!url.includes('/local/')) continue;
    
    // Parse: /local/[state]/[city]/[suburb]/[trade]/...
    const parts = url.split('/').filter(Boolean);
    if (parts.length < 5) continue;
    
    const [_, state, city, suburb, trade] = parts;
    
    // Skip postcode-suffixed URLs (already handled by redirects)
    if (/-\d{4}$/.test(suburb)) continue;
    
    // Format for display
    const formatSlug = (s) => s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    const key = `${state.toUpperCase()}|${formatSlug(city)}|${formatSlug(suburb)}|${formatSlug(trade)}`;
    jobs.add(key);
}

const jobsArray = Array.from(jobs).map(key => {
    const [state, city, suburb, trade] = key.split('|');
    return { state, city, suburb, trade };
});

console.log(`Found ${jobsArray.length} unique suburb+trade combinations from CSV\n`);

// Trade search terms mapping
const TRADE_SEARCH_MAP = {
    "Plumbing": "plumber",
    "Electrical": "electrician",
    "Carpentry": "carpenter",
    "Landscaping": "landscaper",
    "Roofing": "roofer",
    "Painting": "painter",
    "Cleaning": "cleaning service",
    "Building": "builder",
    "Concreting": "concreter",
    "Tiling": "tiler",
    "Plastering": "plasterer",
    "Fencing": "fencing contractor",
    "Demolition": "demolition contractor",
    "Excavation": "excavation contractor",
    "Air Conditioning Heating": "air conditioning",
    "Solar Energy": "solar installation",
    "Pest Control": "pest control",
    "Tree Lopping Removal": "tree service",
    "Gardening Lawn Care": "gardener",
    "Mowing": "lawn mowing service",
    "Pool Spa": "pool service",
    "Bathroom Renovation": "bathroom renovation",
    "Kitchen Renovation": "kitchen renovation",
    "Flooring": "flooring contractor",
    "Glazing Windows": "glazier",
    "Guttering": "gutter installer",
    "Handyman": "handyman",
    "Insulation": "insulation contractor",
    "Drainage": "drainage contractor",
    "Irrigation": "irrigation contractor",
    "Rubbish Removal": "rubbish removal",
    "Cabinet Making": "cabinet maker",
    "Shed Building": "shed builder",
    "Decking": "deck builder",
    "Paving": "paving contractor",
    "Scaffolding": "scaffolding",
    "Stonemasonry": "stonemason",
    "Waterproofing": "waterproofing contractor",
    "Rendering": "renderer",
    "Garage Doors": "garage door installer",
    "Locksmith": "locksmith",
    "Security Systems": "security system installer",
    "Welding Fabrication": "welder",
    "Blinds Curtains": "blinds installer",
};

async function searchPlaces(query, maxResults = 5) {
    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    url.searchParams.set('query', query);
    url.searchParams.set('key', GOOGLE_API_KEY);
    url.searchParams.set('region', 'au');

    const res = await fetch(url);
    if (!res.ok) {
        console.error(`API error: ${await res.text()}`);
        return [];
    }

    const data = await res.json();
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error(`API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
        return [];
    }

    const places = (data.results || []).slice(0, maxResults).map(place => ({
        displayName: { text: place.name },
        formattedAddress: place.formatted_address,
        nationalPhoneNumber: place.formatted_phone_number,
        websiteUri: place.website,
        googleMapsUri: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
        rating: place.rating,
        userRatingCount: place.user_ratings_total,
        photos: place.photos ? place.photos.map(p => ({ name: `places/${place.place_id}/photos/${p.photo_reference}` })) : [],
        addressComponents: place.address_components,
        location: place.geometry?.location,
        businessStatus: place.business_status,
        place_id: place.place_id
    }));

    return places;
}

async function downloadLogo(photoReference) {
    if (!photoReference) return null;
    
    const ref = photoReference.split('/').pop();
    const url = new URL('https://maps.googleapis.com/maps/api/place/photo');
    url.searchParams.set('photoreference', ref);
    url.searchParams.set('maxwidth', '400');
    url.searchParams.set('key', GOOGLE_API_KEY);
    
    const res = await fetch(url);
    if (!res.ok) return null;
    
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength < MIN_LOGO_BYTES) return null;
    
    return Buffer.from(buffer);
}

async function uploadToBlob(buffer, filename) {
    if (!BLOB_TOKEN) return null;
    
    const res = await fetch(`https://blob.vercel-storage.com/${filename}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${BLOB_TOKEN}` },
        body: buffer,
    });
    
    if (!res.ok) return null;
    const data = await res.json();
    return data.url;
}

function extractLocation(place) {
    const components = place.addressComponents || [];
    let suburb = '', city = '', state = '';
    for (const c of components) {
        const types = c.types || [];
        if (types.includes('locality')) city = c.longText || c.long_name;
        if (types.includes('sublocality') || types.includes('sublocality_level_1')) suburb = c.longText || c.long_name;
        if (types.includes('administrative_area_level_1')) state = c.shortText || c.short_name;
    }
    return { suburb: suburb || city, city, state };
}

const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function run() {
    if (!GOOGLE_API_KEY) {
        console.error('ERROR: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not found');
        process.exit(1);
    }

    const db = new pg.Client(process.env.DATABASE_URL);
    await db.connect();

    let inserted = 0;
    let skipped = 0;
    let apiCalls = 0;

    for (const job of jobsArray) {
        const searchTerm = TRADE_SEARCH_MAP[job.trade] || job.trade.toLowerCase();
        const query = `${searchTerm} in ${job.suburb}, ${job.city} ${job.state}`;
        
        console.log(`\n[${jobsArray.indexOf(job) + 1}/${jobsArray.length}] Searching: ${query}`);
        
        const places = await searchPlaces(query, RESULTS_PER_TRADE);
        apiCalls++;
        console.log(`  Found ${places.length} results`);
        
        for (const place of places) {
            const name = place.displayName?.text;
            const phone = place.nationalPhoneNumber;
            const website = place.websiteUri;
            const address = place.formattedAddress;
            const rating = place.rating || 0;
            const reviewCount = place.userRatingCount || 0;
            const mapsUrl = place.googleMapsUri;
            const location = extractLocation(place);
            
            if (!name || !phone) {
                console.log(`  ⏭️  Skipped ${name || 'unnamed'} (no phone)`);
                skipped++;
                continue;
            }
            
            // Check if already exists
            const existing = await db.query(
                `SELECT id FROM businesses WHERE business_name ILIKE $1 AND business_phone = $2`,
                [name, phone]
            );
            
            if (existing.rows.length > 0) {
                console.log(`  ⏭️  Skipped ${name} (already exists)`);
                skipped++;
                continue;
            }
            
            // Download logo
            let logoUrl = null;
            let logoBlob = null;
            if (place.photos && place.photos.length > 0) {
                const photoName = place.photos[0].name;
                const logoBuffer = await downloadLogo(photoName);
                apiCalls++;
                
                if (logoBuffer) {
                    const ext = 'jpg';
                    const filename = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}.${ext}`;
                    const localPath = path.join(LOGOS_DIR, filename);
                    fs.writeFileSync(localPath, logoBuffer);
                    
                    logoBlob = await uploadToBlob(logoBuffer, filename);
                    logoUrl = `/logos-cache/${filename}`;
                }
            }
            
            // Insert business
            await db.query(
                `INSERT INTO businesses (
                    business_name, business_phone, business_email, business_website,
                    trade_category, suburb, city, state, street_address,
                    logo_url, logo_blob_url, google_maps_url,
                    trust_score, status, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())`,
                [
                    name, phone, null, website,
                    job.trade, location.suburb || job.suburb, location.city || job.city, location.state || job.state,
                    address,
                    logoUrl, logoBlob, mapsUrl,
                    Math.min(rating * 20, 100), 'active'
                ]
            );
            
            console.log(`  ✅ Added ${name} (${phone})`);
            inserted++;
        }
        
        await delay(DELAY_MS);
        
        // Progress update every 10 jobs
        if ((jobsArray.indexOf(job) + 1) % 10 === 0) {
            console.log(`\n--- Progress: ${jobsArray.indexOf(job) + 1}/${jobsArray.length} | added: ${inserted} | skipped: ${skipped} | API calls: ${apiCalls} ---\n`);
        }
    }

    console.log(`\n✅ Complete! Inserted ${inserted} businesses, skipped ${skipped}, API calls: ${apiCalls}`);
    await db.end();
}

run().catch(console.error);
