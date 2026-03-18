/**
 * TEST PHOTO DOWNLOAD
 * 
 * Test different methods to fetch Google Places photos server-side
 */

require('dotenv').config({ path: 'apps/web/.env.local' });
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

async function test() {
    console.log('=== Testing Photo Download Methods ===\n');

    // Step 1: Search for a known business to get fresh photo references
    console.log('1. Searching for a known business...');
    const searchRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_API_KEY,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.photos',
        },
        body: JSON.stringify({ textQuery: 'Westcore Plumbing Yangebup WA', maxResultCount: 1 }),
    });

    const searchData = await searchRes.json();
    const place = searchData.places?.[0];
    if (!place) { console.log('No results'); return; }

    console.log(`Found: ${place.displayName?.text}`);
    console.log(`Place ID: ${place.id}`);
    console.log(`Photos available: ${place.photos?.length || 0}`);

    if (!place.photos || place.photos.length === 0) { console.log('No photos'); return; }

    const photoRef = place.photos[0];
    console.log(`Photo ref name: ${photoRef.name}`);

    // Method 1: Direct URL with key param (this is what fill_v3 stores)
    console.log('\n2. Method 1: Direct URL with ?key= param...');
    const url1 = `https://places.googleapis.com/v1/${photoRef.name}/media?key=${GOOGLE_API_KEY}&maxWidthPx=800&maxHeightPx=800`;
    try {
        const res1 = await fetch(url1, { redirect: 'manual' });
        console.log(`   Status: ${res1.status}`);
        console.log(`   Content-Type: ${res1.headers.get('content-type')}`);
        if (res1.status === 302) {
            console.log(`   Redirect to: ${res1.headers.get('location')?.substring(0, 100)}...`);
        }
        if (!res1.ok && res1.status !== 302) {
            const body = await res1.text();
            console.log(`   Error: ${body.substring(0, 200)}`);
        }
    } catch (e) { console.log(`   Error: ${e.message}`); }

    // Method 2: Using X-Goog-Api-Key header
    console.log('\n3. Method 2: Header-based auth...');
    const url2 = `https://places.googleapis.com/v1/${photoRef.name}/media?maxWidthPx=800&maxHeightPx=800`;
    try {
        const res2 = await fetch(url2, {
            headers: { 'X-Goog-Api-Key': GOOGLE_API_KEY },
            redirect: 'manual',
        });
        console.log(`   Status: ${res2.status}`);
        console.log(`   Content-Type: ${res2.headers.get('content-type')}`);
        if (res2.status === 302) {
            const redirectUrl = res2.headers.get('location');
            console.log(`   Redirect to: ${redirectUrl?.substring(0, 100)}...`);
            
            // Follow the redirect
            console.log('\n4. Following redirect...');
            const res3 = await fetch(redirectUrl);
            console.log(`   Final Status: ${res3.status}`);
            console.log(`   Content-Type: ${res3.headers.get('content-type')}`);
            console.log(`   Content-Length: ${res3.headers.get('content-length')}`);
            
            if (res3.ok) {
                const buf = await res3.arrayBuffer();
                console.log(`   ✅ Downloaded ${buf.byteLength} bytes!`);
                console.log(`   This redirect URL works WITHOUT API key - it's a direct image URL`);
                console.log(`   Redirect URL: ${redirectUrl}`);
            }
        }
        if (!res2.ok && res2.status !== 302) {
            const body = await res2.text();
            console.log(`   Error: ${body.substring(0, 200)}`);
        }
    } catch (e) { console.log(`   Error: ${e.message}`); }

    // Method 3: Old Places API format
    console.log('\n5. Method 3: Legacy Places API photo URL...');
    // The old format uses photo_reference from the old API, not compatible
    console.log('   Skipped - not compatible with new API photo refs');

    // Method 4: Skip download and just use the redirect URL directly
    console.log('\n6. Method 4: Get redirect URL for direct use...');
    try {
        const res4 = await fetch(url2, {
            headers: { 'X-Goog-Api-Key': GOOGLE_API_KEY },
            redirect: 'manual',
        });
        if (res4.status === 302) {
            const redirectUrl = res4.headers.get('location');
            console.log(`   ✅ Redirect URL (no API key needed):`);
            console.log(`   ${redirectUrl}`);
            console.log(`\n   This URL can be stored in the DB and served directly to browsers!`);
        }
    } catch (e) { console.log(`   Error: ${e.message}`); }
}

test().catch(e => { console.error('FATAL:', e); process.exit(1); });
