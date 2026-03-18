/**
 * DEBUG MISSING PHOTOS
 * 
 * Sample businesses without photos and try different search strategies
 * to find the right Place ID and fetch photos.
 */

const { Pool } = require('pg');
require('dotenv').config({ path: 'apps/web/.env.local' });

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

const pool = new Pool({ connectionString: DATABASE_URL });

async function debugBusiness(biz) {
    console.log(`\n=== ${biz.business_name} | ${biz.suburb}, ${biz.state} ===`);
    console.log(`source_url: ${biz.source_url}`);
    console.log(`Current photos: ${biz.photo_urls || 'none'}`);

    // Try 3 different search strategies
    const searches = [
        { name: `${biz.business_name} ${biz.suburb} ${biz.state}`, desc: 'Name + Suburb + State' },
        { name: `${biz.business_name} ${biz.suburb}`, desc: 'Name + Suburb' },
        { name: `${biz.business_name} ${biz.state}`, desc: 'Name + State' },
    ];

    if (biz.business_phone) {
        searches.push({ name: `${biz.business_phone}`, desc: 'Phone only' });
    }

    for (const search of searches) {
        console.log(`\n--- Search: ${search.desc} ---`);
        console.log(`Query: "${search.name}"`);

        try {
            const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': GOOGLE_API_KEY,
                    'X-Goog-FieldMask': 'places.id,places.displayName,places.googleMapsUri,places.photos,places.internationalPhoneNumber,places.rating,places.businessStatus',
                },
                body: JSON.stringify({ textQuery: search.name, maxResultCount: 3 }),
            });

            if (!res.ok) {
                console.log(`  API Error: ${res.status} ${res.statusText}`);
                continue;
            }

            const data = await res.json();
            const places = data.places || [];
            console.log(`  Results: ${places.length}`);

            for (let i = 0; i < places.length; i++) {
                const p = places[i];
                console.log(`    ${i + 1}. ${p.displayName?.text || 'No name'}`);
                console.log(`       Place ID: ${p.id}`);
                console.log(`       Rating: ${p.rating || 'N/A'}`);
                console.log(`       Phone: ${p.internationalPhoneNumber || 'N/A'}`);
                console.log(`       Status: ${p.businessStatus || 'N/A'}`);
                console.log(`       Photos: ${(p.photos || []).length}`);
                console.log(`       Maps: ${p.googleMapsUri?.substring(0, 80)}...`);

                // Check if this matches our business
                const phoneMatch = biz.business_phone && p.internationalPhoneNumber && 
                    biz.business_phone.replace(/\s+/g, '').replace(/^\+61/, '0') === 
                    p.internationalPhoneNumber.replace(/\s+/g, '').replace(/^\+61/, '0');
                
                if (phoneMatch) {
                    console.log(`       ✅ PHONE MATCH - This is our business!`);
                }
            }

            if (places.length === 0) {
                console.log(`  No results found`);
            }

        } catch (error) {
            console.log(`  Error: ${error.message}`);
        }
    }

    console.log(`---\n`);
}

async function run() {
    // Get sample businesses without photos from different states
    const result = await pool.query(`
        SELECT id, business_name, suburb, city, state, business_phone, source_url, photo_urls
        FROM businesses
        WHERE status = 'active' 
          AND (photo_urls IS NULL OR photo_urls::text = '{}')
          AND business_name IS NOT NULL
        ORDER BY RANDOM()
        LIMIT 5
    `);

    console.log(`\nDebugging ${result.rows.length} businesses without photos...\n`);

    for (const biz of result.rows) {
        await debugBusiness(biz);
    }

    await pool.end();
}

run().catch(e => { console.error('FATAL:', e); process.exit(1); });
