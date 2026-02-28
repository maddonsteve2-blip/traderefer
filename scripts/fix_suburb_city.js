/**
 * Fix suburb/city columns for Google Places businesses.
 * The fill script stored them backwards:
 *   suburb = Google locality (e.g. "Sydney", "Hobart")
 *   city = our AUSTRALIA_LOCATIONS suburb (e.g. "Ashfield", "Battery Point")
 *
 * This script fixes it to:
 *   suburb = AUSTRALIA_LOCATIONS suburb name (e.g. "Ashfield")
 *   city = AUSTRALIA_LOCATIONS parent city (e.g. "Sydney")
 */

const pg = require('pg');
const fs = require('fs');
require('dotenv').config({ path: 'apps/web/.env.local' });

// Parse AUSTRALIA_LOCATIONS
const constFile = fs.readFileSync('apps/web/lib/constants.ts', 'utf-8');
const match = constFile.match(/export const AUSTRALIA_LOCATIONS[^=]*=\s*(\{[\s\S]*\});/);
if (!match) { console.error('Could not parse AUSTRALIA_LOCATIONS'); process.exit(1); }
const AUSTRALIA_LOCATIONS = eval('(' + match[1] + ')');

// Build suburb → parent city mapping
const suburbToCity = {};
for (const [state, cities] of Object.entries(AUSTRALIA_LOCATIONS)) {
    for (const [cityName, suburbs] of Object.entries(cities)) {
        for (const suburb of suburbs) {
            suburbToCity[suburb.toLowerCase()] = cityName;
        }
    }
}

async function run() {
    const db = new pg.Client(process.env.DATABASE_URL);
    await db.connect();

    // Get all businesses where suburb != city (these are the swapped ones)
    const res = await db.query(`
        SELECT DISTINCT city as current_city, suburb as current_suburb
        FROM businesses 
        WHERE suburb != city
    `);

    console.log(`Found ${res.rows.length} distinct suburb/city combos to check\n`);

    let totalFixed = 0;

    for (const row of res.rows) {
        // current_city has our suburb name, current_suburb has Google's locality
        const ourSuburb = row.current_city;
        const parentCity = suburbToCity[ourSuburb.toLowerCase()];

        if (!parentCity) {
            console.log(`  SKIP: "${ourSuburb}" not found in AUSTRALIA_LOCATIONS`);
            continue;
        }

        const result = await db.query(`
            UPDATE businesses 
            SET suburb = $1, city = $2
            WHERE city = $3 AND suburb = $4
        `, [ourSuburb, parentCity, ourSuburb, row.current_suburb]);

        console.log(`  Fixed ${result.rowCount} rows: suburb="${ourSuburb}", city="${parentCity}" (was suburb="${row.current_suburb}", city="${ourSuburb}")`);
        totalFixed += result.rowCount;
    }

    // Also fix records where suburb = city
    const sameRes = await db.query(`
        SELECT DISTINCT city as current_city
        FROM businesses 
        WHERE suburb = city
    `);

    for (const row of sameRes.rows) {
        const parentCity = suburbToCity[row.current_city.toLowerCase()];
        if (!parentCity || parentCity === row.current_city) continue;

        const result = await db.query(`
            UPDATE businesses 
            SET city = $1
            WHERE suburb = $2 AND city = $2
        `, [parentCity, row.current_city]);

        if (result.rowCount > 0) {
            console.log(`  Fixed ${result.rowCount} rows: suburb="${row.current_city}", city="${parentCity}" (was city="${row.current_city}")`);
            totalFixed += result.rowCount;
        }
    }

    console.log(`\n========== DONE: Fixed ${totalFixed} businesses ==========`);
    await db.end();
}

run().catch(console.error);
