/**
 * CID → Place ID Resolver
 * 
 * Converts businesses with CID URLs to Place ID URLs via Text Search API.
 * Updates source_url with googleMapsUri containing the ChIJ Place ID.
 * 
 * Usage: node scripts/resolve_cid_to_placeid.js [--state NSW] [--limit 100] [--test]
 */

const { Pool } = require('pg');
require('dotenv').config({ path: 'apps/web/.env.local' });

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
const CONCURRENT = 30;

const args = process.argv.slice(2);
const LIMIT = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : null;
const STATE = args.includes('--state') ? args[args.indexOf('--state') + 1] : null;
const TEST = args.includes('--test');

const stats = { processed: 0, resolved: 0, notFound: 0, errors: 0, startTime: 0 };

async function searchForPlaceId(name, suburb, state, phone) {
    try {
        const query = `${name} ${suburb || ''} ${state || 'Australia'}`.trim();
        const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_API_KEY,
                'X-Goog-FieldMask': 'places.id,places.displayName,places.googleMapsUri,places.internationalPhoneNumber',
            },
            body: JSON.stringify({ textQuery: query, maxResultCount: 3 }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        const places = data.places || [];
        if (places.length === 0) return null;

        // Match by phone if available (most accurate)
        if (phone) {
            const cleanPhone = phone.replace(/\s+/g, '').replace(/^\+61/, '0');
            for (const p of places) {
                const pPhone = (p.internationalPhoneNumber || '').replace(/\s+/g, '').replace(/^\+61/, '0');
                if (pPhone === cleanPhone) return p;
            }
        }

        // Return first result (usually correct for name+suburb)
        return places[0];
    } catch {
        return null;
    }
}

async function processBatch(pool, businesses) {
    await Promise.all(businesses.map(async (biz) => {
        try {
            const place = await searchForPlaceId(biz.business_name, biz.suburb, biz.state, biz.business_phone);
            
            if (!place || !place.googleMapsUri) {
                stats.notFound++;
                stats.processed++;
                return;
            }

            // Extract Place ID from googleMapsUri
            const placeId = place.id; // Format: places/ChIJ...
            const cleanPlaceId = placeId.replace('places/', '');

            if (TEST) {
                console.log(`  ${biz.business_name} | ${biz.suburb}, ${biz.state}`);
                console.log(`    OLD: ${biz.source_url.substring(0, 80)}`);
                console.log(`    NEW: ${place.googleMapsUri.substring(0, 80)} [${cleanPlaceId}]`);
                stats.resolved++;
                stats.processed++;
                return;
            }

            // Update source_url and google_maps_url with the Place ID URL
            await pool.query(`
                UPDATE businesses 
                SET source_url = $1, google_maps_url = $1, updated_at = now()
                WHERE id = $2
            `, [place.googleMapsUri, biz.id]);

            stats.resolved++;
            stats.processed++;
        } catch (error) {
            stats.errors++;
            stats.processed++;
        }
    }));
}

async function run() {
    console.log('=== CID → Place ID Resolver ===');
    console.log(`State: ${STATE || 'ALL'} | Limit: ${LIMIT || 'ALL'} | Mode: ${TEST ? 'TEST' : 'UPDATE'}\n`);

    const pool = new Pool({ connectionString: DATABASE_URL, max: 20 });

    const conditions = [
        "status = 'active'",
        "source_url LIKE '%maps.google.com%cid=%'",
    ];
    if (STATE) conditions.push(`state = '${STATE}'`);

    const where = conditions.join(' AND ');
    const limitSql = LIMIT ? `LIMIT ${LIMIT}` : '';

    const result = await pool.query(`
        SELECT id, business_name, suburb, city, state, business_phone, source_url
        FROM businesses
        WHERE ${where}
        ORDER BY created_at DESC
        ${limitSql}
    `);

    const businesses = result.rows;
    console.log(`Found ${businesses.length} CID businesses to resolve\n`);

    if (businesses.length === 0) {
        await pool.end();
        return;
    }

    stats.startTime = Date.now();

    for (let i = 0; i < businesses.length; i += CONCURRENT) {
        const batch = businesses.slice(i, i + CONCURRENT);
        await processBatch(pool, batch);

        const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(0);
        const rate = elapsed > 0 ? (stats.processed / (elapsed / 60)).toFixed(0) : 0;
        console.log(`Progress: ${stats.processed}/${businesses.length} | Resolved: ${stats.resolved} | Not found: ${stats.notFound} | Errors: ${stats.errors} | ${rate}/min`);
    }

    await pool.end();
    const totalTime = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(1);
    console.log(`\n========== COMPLETE ==========`);
    console.log(`Time: ${totalTime} minutes`);
    console.log(`Resolved: ${stats.resolved} | Not found: ${stats.notFound} | Errors: ${stats.errors}`);
    console.log(`\nSuccess rate: ${((stats.resolved / businesses.length) * 100).toFixed(1)}%`);
}

run().catch(e => { console.error('FATAL:', e); process.exit(1); });
