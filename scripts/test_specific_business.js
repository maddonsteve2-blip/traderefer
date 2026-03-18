/**
 * TEST SPECIFIC BUSINESS
 * 
 * Test the backfill logic on a specific business we know has photos
 */

const { Pool } = require('pg');
require('dotenv').config({ path: 'apps/web/.env.local' });

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

const pool = new Pool({ connectionString: DATABASE_URL });

async function testBusiness() {
    // Get Sydney Roofing Uz Pty Ltd - we know it has 8 photos
    const result = await pool.query(`
        SELECT id, business_name, suburb, city, state, business_phone, source_url, photo_urls
        FROM businesses
        WHERE business_name = 'Sydney Roofing Uz Pty Ltd' AND suburb = 'Greenacre' AND state = 'NSW'
    `);

    if (result.rows.length === 0) {
        console.log('Business not found in DB');
        await pool.end();
        return;
    }

    const biz = result.rows[0];
    console.log(`\n=== ${biz.business_name} ===`);
    console.log(`Phone: ${biz.business_phone}`);
    console.log(`source_url: ${biz.source_url}`);
    console.log(`Current photos: ${biz.photo_urls || 'none'}`);

    // Test the search logic
    try {
        const query = biz.business_phone.replace(/\s+/g, '');
        console.log(`\nSearching by phone: "${query}"`);

        const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_API_KEY,
                'X-Goog-FieldMask': 'places.id,places.displayName,places.photos,places.internationalPhoneNumber,places.rating,places.businessStatus',
            },
            body: JSON.stringify({ textQuery: query, maxResultCount: 3 }),
        });

        if (!res.ok) {
            console.log(`API Error: ${res.status} ${res.statusText}`);
            await pool.end();
            return;
        }

        const data = await res.json();
        const places = data.places || [];
        console.log(`Results: ${places.length}`);

        for (let i = 0; i < places.length; i++) {
            const p = places[i];
            console.log(`  ${i + 1}. ${p.displayName?.text || 'No name'}`);
            console.log(`       Place ID: ${p.id}`);
            console.log(`       Phone: ${p.internationalPhoneNumber || 'N/A'}`);
            console.log(`       Photos: ${(p.photos || []).length}`);
            console.log(`       Status: ${p.businessStatus || 'N/A'}`);
        }

        // Try to get Place Details for the first result
        if (places.length > 0) {
            const placeId = places[0].id.replace('places/', '');
            console.log(`\nTrying Place Details for: ${placeId}`);
            
            const detailsRes = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
                headers: {
                    'X-Goog-Api-Key': GOOGLE_API_KEY,
                    'X-Goog-FieldMask': 'places.photos,places.editorialSummary,places.reviews,places.rating,places.userRatingCount',
                },
            });
            
            if (detailsRes.ok) {
                const details = await detailsRes.json();
                console.log(`Place Details - Photos: ${(details.photos || []).length} | Reviews: ${(details.reviews || []).length} | Editorial: ${details.editorialSummary ? 'yes' : 'no'}`);
            } else {
                console.log(`Place Details failed: ${detailsRes.status}`);
            }
        }

    } catch (error) {
        console.log(`Error: ${error.message}`);
    }

    await pool.end();
}

testBusiness().catch(e => { console.error('FATAL:', e); process.exit(1); });
