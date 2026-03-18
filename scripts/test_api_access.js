/**
 * Test which Google APIs are accessible with the current key
 */
require('dotenv').config({ path: 'apps/web/.env.local' });
const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

async function test() {
    console.log(`API Key: ${KEY?.substring(0, 15)}...`);
    console.log(`Project: 643902729199\n`);

    // Test 1: Geocoding API
    console.log('1. Geocoding API...');
    try {
        const r = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=Sydney+Australia&key=${KEY}`);
        const d = await r.json();
        console.log(`   Status: ${d.status} ${d.error_message || ''}`);
    } catch (e) { console.log(`   Error: ${e.message}`); }

    // Test 2: Places API (Legacy) - Nearby Search
    console.log('2. Places API (Legacy) - Text Search...');
    try {
        const r = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=plumber+Sydney&key=${KEY}`);
        const d = await r.json();
        console.log(`   Status: ${d.status} ${d.error_message || ''}`);
        if (d.results?.[0]) {
            console.log(`   First result: ${d.results[0].name}`);
            if (d.results[0].photos?.[0]) {
                console.log(`   Has photos: yes (${d.results[0].photos.length})`);
                const photoRef = d.results[0].photos[0].photo_reference;
                console.log(`   Photo ref: ${photoRef?.substring(0, 40)}...`);
                
                // Test 3: Places Photo (Legacy)
                console.log('3. Places Photo API (Legacy)...');
                const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${KEY}`;
                const pr = await fetch(photoUrl, { redirect: 'manual' });
                console.log(`   Photo Status: ${pr.status}`);
                if (pr.status === 302) {
                    const loc = pr.headers.get('location');
                    console.log(`   ✅ Redirects to: ${loc?.substring(0, 80)}...`);
                } else {
                    const body = await pr.text();
                    console.log(`   Response: ${body.substring(0, 200)}`);
                }
            }
        }
    } catch (e) { console.log(`   Error: ${e.message}`); }

    // Test 4: Places API (New) - Text Search
    console.log('4. Places API (New) - Text Search...');
    try {
        const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': KEY,
                'X-Goog-FieldMask': 'places.id,places.displayName',
            },
            body: JSON.stringify({ textQuery: 'plumber Sydney', maxResultCount: 1 }),
        });
        if (r.ok) {
            const d = await r.json();
            console.log(`   ✅ OK: ${d.places?.[0]?.displayName?.text || 'no results'}`);
        } else {
            const d = await r.json();
            console.log(`   ❌ ${r.status}: ${d.error?.message?.substring(0, 100)}`);
        }
    } catch (e) { console.log(`   Error: ${e.message}`); }
}

test().catch(console.error);
