
/**
 * TRADEREFER NATIONAL SCALER - SCRIPT 01
 * POPULATE SCRAPE QUEUE
 */

const postgres = require('postgres');

const DATABASE_URL = "postgresql://neondb_owner:npg_qsxKWSvGyk65@ep-steep-violet-aikad8l7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = postgres(DATABASE_URL);

const TRADES = [
    "Plumber", "Electrician", "Carpenter", "Painter", "Handyman",
    "Gardener", "Landscaper", "Tiler", "Roofing", "Concreter",
    "Fencing", "Builder", "Cleaner", "Tree Surgeon"
];

const TARGET_CITIES = [
    { city: "Geelong", state: "VIC" },
    { city: "Melbourne", state: "VIC" },
    { city: "Sydney", state: "NSW" },
    { city: "Brisbane", state: "QLD" },
    { city: "Perth", state: "WA" },
    { city: "Adelaide", state: "SA" },
    { city: "Canberra", state: "ACT" }
];

async function init() {
    console.log("🏙️ Initializing Scrape Queue for National Rollout...");
    let count = 0;

    for (const { city, state } of TARGET_CITIES) {
        for (const trade of TRADES) {
            try {
                await sql`
                    INSERT INTO scrape_queue (city_name, trade_category)
                    VALUES (${city}, ${trade})
                    ON CONFLICT (city_name, trade_category) DO NOTHING
                `;
                count++;
            } catch (e) {
                console.error(`Failed for ${city} | ${trade}:`, e.message);
            }
        }
    }

    console.log(`✅ Success! Added ${count} target combinations to the queue.`);
    process.exit(0);
}

init();
