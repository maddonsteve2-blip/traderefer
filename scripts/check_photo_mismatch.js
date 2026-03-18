/**
 * CHECK PHOTO MISMATCH
 * 
 * Find businesses that Google shows with photos but our DB shows as having none
 */

const { Pool } = require('pg');
require('dotenv').config({ path: 'apps/web/.env.local' });

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

const pool = new Pool({ connectionString: DATABASE_URL });

async function checkMismatch() {
    // Get businesses with no photos in our DB
    const result = await pool.query(`
        SELECT id, business_name, suburb, city, state, business_phone, source_url, photo_urls
        FROM businesses
        WHERE status = 'active' 
          AND (photo_urls IS NULL OR photo_urls::text = '{}')
          AND source_url IS NOT NULL
        LIMIT 10
    `);

    console.log(`\nChecking ${result.rows.length} businesses with no photos in DB...\n`);

    for (const biz of result.rows) {
        console.log(`\n=== ${biz.business_name} | ${biz.suburb}, ${biz.state} ===`);
        console.log(`source_url: ${biz.source_url.substring(0, 80)}...`);

        // Try to find this business via text search
        try {
            const query = `${biz.business_name} ${biz.suburb || ''} ${biz.state || ''}`.trim();
            const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': GOOGLE_API_KEY,
                    'X-Goog-FieldMask': 'places.id,places.displayName,places.photos,places.internationalPhoneNumber',
                },
                body: JSON.stringify({ textQuery: query, maxResultCount: 3 }),
            });

            if (!res.ok) {
                console.log(`  API Error: ${res.status}`);
                continue;
            }

            const data = await res.json();
            const places = data.places || [];
            console.log(`  Google results: ${places.length}`);

            for (let i = 0; i < places.length; i++) {
                const p = places[i];
                const phoneMatch = biz.business_phone && p.internationalPhoneNumber && 
                    biz.business_phone.replace(/\s+/g, '').replace(/^\+61/, '0') === 
                    p.internationalPhoneNumber.replace(/\s+/g, '').replace(/^\+61/, '0');
                
                console.log(`    ${i + 1}. ${p.displayName?.text || 'No name'} | Photos: ${(p.photos || []).length} | Phone: ${p.internationalPhoneNumber || 'N/A'} ${phoneMatch ? '✅ MATCH' : ''}`);
            }

            if (places.length === 0) {
                console.log(`  No results found on Google`);
            }

        } catch (error) {
            console.log(`  Error: ${error.message}`);
        }
    }

    await pool.end();
}

checkMismatch().catch(e => { console.error('FATAL:', e); process.exit(1); });
