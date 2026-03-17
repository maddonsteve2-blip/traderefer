/**
 * Fill businesses for specific suburb+trade combinations from CSV
 * Reads Table.csv and populates only the affected URLs
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
const lines = csvContent.split('\n').slice(1).filter(l => l.trim()); // Skip header

// Extract suburb+trade combinations from URLs
const jobs = [];
for (const line of lines) {
    const url = line.split(',')[0];
    if (!url.includes('/local/')) continue;
    
    // Parse: /local/[state]/[city]/[suburb]/[trade]/[job-type]
    const parts = url.split('/').filter(Boolean);
    if (parts.length < 7) continue; // Need at least local/state/city/suburb/trade/job
    
    const [_, state, city, suburb, trade, jobType] = parts;
    
    // Format for display
    const formatSlug = (s) => s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    jobs.push({
        state: state.toUpperCase(),
        city: formatSlug(city),
        suburb: formatSlug(suburb),
        trade: formatSlug(trade),
        jobType: formatSlug(jobType),
        url
    });
}

console.log(`Found ${jobs.length} affected suburb+trade combinations from CSV\n`);

// Trade search terms mapping
const TRADE_SEARCH_MAP = {
    "Drainage": "drainage contractor",
    "Demolition": "demolition contractor",
    "Painting": "painter",
    "Irrigation": "irrigation contractor",
    "Rubbish Removal": "rubbish removal",
    "Cabinet Making": "cabinet maker",
    "Bathroom Renovation": "bathroom renovation",
    "Carpentry": "carpenter",
    "Excavation": "excavation contractor",
    "Guttering": "gutter installer",
    "Shed Building": "shed builder",
    "Gardening & Lawn Care": "gardener",
    "Solar & Energy": "solar installation",
    "Tree Lopping & Removal": "tree service",
    "Pest Control": "pest control",
};

async function searchPlaces(query, maxResults = 5) {
    // Use legacy Text Search API (more likely to be enabled)
    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    url.searchParams.set('query', query);
    url.searchParams.set('key', GOOGLE_API_KEY);
    url.searchParams.set('region', 'au');

    const res = await fetch(url);

    if (!res.ok) {
        const err = await res.text();
        console.error(`API error: ${err}`);
        return [];
    }

    const data = await res.json();
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error(`API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
        return [];
    }

    // Convert legacy format to new format for compatibility
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
    
    // Extract photo_reference from the name format
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
        if (types.includes('locality')) city = c.longText;
        if (types.includes('sublocality') || types.includes('sublocality_level_1')) suburb = c.longText;
        if (types.includes('administrative_area_level_1')) state = c.shortText;
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

    for (const job of jobs) {
        const searchTerm = TRADE_SEARCH_MAP[job.trade] || job.trade.toLowerCase();
        const query = `${searchTerm} in ${job.suburb}, ${job.city} ${job.state}`;
        
        console.log(`\n[${jobs.indexOf(job) + 1}/${jobs.length}] Searching: ${query}`);
        
        const places = await searchPlaces(query, RESULTS_PER_TRADE);
        console.log(`  Found ${places.length} results`);
        
        for (const place of places) {
            const name = place.displayName?.text;
            const phone = place.nationalPhoneNumber || place.internationalPhoneNumber;
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
    }

    console.log(`\n✅ Complete! Inserted ${inserted} businesses, skipped ${skipped}`);
    await db.end();
}

run().catch(console.error);
