/**
 * TEST PHOTO DOWNLOAD v2
 * 
 * Test if we can get working photo URLs from Google Places
 */

require('dotenv').config({ path: 'apps/web/.env.local' });
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

async function test() {
    console.log('=== Testing Photo Download ===\n');

    // Step 1: Search for a business
    console.log('1. Searching for business...');
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_API_KEY,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.photos',
        },
        body: JSON.stringify({ textQuery: 'plumber Sydney NSW Australia', maxResultCount: 1 }),
    });

    if (!res.ok) {
        console.log(`Search failed: ${res.status} ${res.statusText}`);
        const body = await res.text();
        console.log(body.substring(0, 300));
        return;
    }

    const data = await res.json();
    const place = data.places?.[0];
    if (!place) { console.log('No results'); return; }

    console.log(`Found: ${place.displayName?.text}`);
    console.log(`Photos: ${place.photos?.length || 0}`);

    if (!place.photos?.length) return;

    const photoName = place.photos[0].name;
    console.log(`Photo name: ${photoName}`);

    // Test Method A: ?key= param (what fill_v3 stores)
    console.log('\n2. Method A: ?key= param in URL...');
    const urlA = `https://places.googleapis.com/v1/${photoName}/media?key=${GOOGLE_API_KEY}&maxWidthPx=400`;
    const resA = await fetch(urlA, { redirect: 'manual' });
    console.log(`   Status: ${resA.status} | Type: ${resA.headers.get('content-type')}`);
    if (resA.status === 302) {
        const loc = resA.headers.get('location');
        console.log(`   ✅ Redirects to: ${loc?.substring(0, 80)}...`);
        console.log(`   This redirect URL is a direct image URL!`);
    } else if (!resA.ok) {
        const body = await resA.text();
        console.log(`   ❌ Error: ${body.substring(0, 200)}`);
    }

    // Test Method B: Header auth
    console.log('\n3. Method B: X-Goog-Api-Key header...');
    const urlB = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=400`;
    const resB = await fetch(urlB, { headers: { 'X-Goog-Api-Key': GOOGLE_API_KEY }, redirect: 'manual' });
    console.log(`   Status: ${resB.status} | Type: ${resB.headers.get('content-type')}`);
    if (resB.status === 302) {
        const loc = resB.headers.get('location');
        console.log(`   ✅ Redirects to: ${loc?.substring(0, 80)}...`);
        
        // Follow the redirect - does the final URL work without auth?
        console.log('\n4. Following redirect (no auth)...');
        const resC = await fetch(loc);
        console.log(`   Status: ${resC.status} | Type: ${resC.headers.get('content-type')} | Size: ${resC.headers.get('content-length')}`);
        if (resC.ok) {
            const buf = await resC.arrayBuffer();
            console.log(`   ✅ SUCCESS! Downloaded ${buf.byteLength} bytes`);
            console.log(`   This googleusercontent URL works without API key!`);
            console.log(`   URL: ${loc}`);
        }
    } else if (!resB.ok) {
        const body = await resB.text();
        console.log(`   ❌ Error: ${body.substring(0, 200)}`);
    }

    // Test Method C: skipHttpRedirect=true to get URL in JSON
    console.log('\n5. Method C: skipHttpRedirect=true...');
    const urlC = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=400&skipHttpRedirect=true`;
    const resD = await fetch(urlC, { headers: { 'X-Goog-Api-Key': GOOGLE_API_KEY } });
    console.log(`   Status: ${resD.status} | Type: ${resD.headers.get('content-type')}`);
    if (resD.ok) {
        const jsonData = await resD.json();
        console.log(`   Response: ${JSON.stringify(jsonData).substring(0, 300)}`);
        if (jsonData.photoUri) {
            console.log(`   ✅ Got photoUri: ${jsonData.photoUri.substring(0, 80)}...`);
        }
    } else {
        const body = await resD.text();
        console.log(`   ❌ Error: ${body.substring(0, 200)}`);
    }
}

test().catch(e => { console.error('FATAL:', e); process.exit(1); });
