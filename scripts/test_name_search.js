const { Pool } = require('pg');
require('dotenv').config({ path: 'apps/web/.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function testNameSearch() {
    const result = await pool.query(`
        SELECT business_name, suburb, state, business_phone 
        FROM businesses 
        WHERE business_name = 'Sydney Roofing Uz Pty Ltd' AND suburb = 'Greenacre' AND state = 'NSW'
    `);

    if (result.rows.length === 0) {
        console.log('Business not found');
        await pool.end();
        return;
    }

    const biz = result.rows[0];
    console.log(`Testing: ${biz.business_name}`);
    console.log(`Phone: ${biz.business_phone}`);
    
    const query = `${biz.business_name} ${biz.suburb} ${biz.state}`;
    console.log(`Search query: "${query}"`);

    try {
        const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
                'X-Goog-FieldMask': 'places.displayName,places.photos,places.internationalPhoneNumber',
            },
            body: JSON.stringify({ textQuery: query, maxResultCount: 3 }),
        });

        const data = await res.json();
        console.log(`Results: ${data.places?.length || 0}`);
        
        if (data.places && data.places.length > 0) {
            const p = data.places[0];
            console.log(`Found: ${p.displayName?.text} | Photos: ${(p.photos || []).length} | Phone: ${p.internationalPhoneNumber || 'N/A'}`);
            
            // Try Place Details
            if (p.id) {
                const placeId = p.id.replace('places/', '');
                const detailsRes = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
                    headers: {
                        'X-Goog-Api-Key': process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
                        'X-Goog-FieldMask': 'places.photos,places.editorialSummary,places.reviews',
                    },
                });
                
                if (detailsRes.ok) {
                    const details = await detailsRes.json();
                    console.log(`Place Details - Photos: ${(details.photos || []).length} | Reviews: ${(details.reviews || []).length}`);
                }
            }
        }

    } catch (error) {
        console.log(`Error: ${error.message}`);
    }

    await pool.end();
}

testNameSearch().catch(e => { console.error('FATAL:', e); process.exit(1); });
