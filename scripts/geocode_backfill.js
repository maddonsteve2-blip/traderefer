/**
 * Geocode Backfill Script
 * Fetches lat/lng for all businesses that have address but no lat/lng.
 * Uses Nominatim (OpenStreetMap) — completely FREE, no API key needed.
 * Rate limit: 1 request/second (enforced by BATCH_DELAY_MS).
 * 
 * Usage: node scripts/geocode_backfill.js [--dry-run] [--limit=500]
 * 
 * Cost: $0
 * Time: ~3 hours for 11,000 businesses at 1 req/sec
 */

const pg = require('pg');
require('dotenv').config({ path: 'apps/web/.env.local' });

const DRY_RUN = process.argv.includes('--dry-run');
const limitArg = process.argv.find(a => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1]) : 99999;
const BATCH_DELAY_MS = 1100; // Nominatim requires max 1 req/sec

async function geocode(address) {
    // Nominatim (OpenStreetMap) - free, no API key
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=au`;
    const res = await fetch(url, {
        signal: AbortSignal.timeout(10000),
        headers: { 'User-Agent': 'TradeRefer/1.0 (traderefer.au)' } // Nominatim requires a User-Agent
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data[0]) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function run() {
    const db = new pg.Client(process.env.DATABASE_URL);
    await db.connect();

    // Get all businesses missing lat/lng that have an address or at least suburb+state
    const res = await db.query(`
        SELECT id, address, suburb, city, state 
        FROM businesses 
        WHERE (lat IS NULL OR lng IS NULL)
          AND status = 'active'
        ORDER BY created_at DESC
        LIMIT $1
    `, [LIMIT]);

    console.log(`Found ${res.rows.length} businesses to geocode`);
    if (DRY_RUN) { console.log('--dry-run mode, exiting'); await db.end(); return; }

    let success = 0, failed = 0, apiCalls = 0;

    for (let i = 0; i < res.rows.length; i++) {
        const biz = res.rows[i];

        // Build best query string — prefer full address, fall back to suburb+state
        const query = biz.address
            ? biz.address
            : `${biz.suburb || biz.city}, ${biz.state}, Australia`;

        if (i % 100 === 0) {
            console.log(`\n--- ${i}/${res.rows.length} | success: ${success} | failed: ${failed} | API: ${apiCalls} ---`);
        }

        try {
            apiCalls++;
            const coords = await geocode(query);

            if (coords) {
                await db.query(
                    'UPDATE businesses SET lat = $1, lng = $2 WHERE id = $3',
                    [coords.lat, coords.lng, biz.id]
                );
                success++;
                process.stdout.write('.');
            } else {
                // Try fallback: suburb + state
                if (biz.address) {
                    apiCalls++;
                    const fallback = await geocode(`${biz.suburb || biz.city}, ${biz.state}, Australia`);
                    if (fallback) {
                        await db.query(
                            'UPDATE businesses SET lat = $1, lng = $2 WHERE id = $3',
                            [fallback.lat, fallback.lng, biz.id]
                        );
                        success++;
                        process.stdout.write('f');
                    } else {
                        failed++;
                        process.stdout.write('x');
                    }
                } else {
                    failed++;
                    process.stdout.write('x');
                }
            }
        } catch (err) {
            failed++;
            process.stdout.write('E');
        }

        await sleep(BATCH_DELAY_MS);
    }

    console.log(`\n\n========== DONE ==========`);
    console.log(`Success: ${success} | Failed: ${failed} | API calls: ${apiCalls}`);
    console.log(`Cost: $0 (Nominatim/OpenStreetMap - free)`);
    await db.end();
}

run().catch(console.error);
