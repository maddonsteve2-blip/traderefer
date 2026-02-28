/**
 * TRADEREFER - SUBURB-LEVEL QUEUE INIT
 * Populates scrape_queue with all suburbs for Geelong, Adelaide, Perth
 */

const postgres = require('postgres');

const DATABASE_URL = "postgresql://neondb_owner:npg_qsxKWSvGyk65@ep-steep-violet-aikad8l7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = postgres(DATABASE_URL);

const TRADES = [
    "Plumber", "Electrician", "Carpenter", "Painter", "Handyman",
    "Gardener", "Landscaper", "Builder", "Cleaner", "Tree Surgeon",
    "Tiler", "Roofer", "Concreter", "Fencer", "Plasterer",
    "Glazier", "Locksmith", "Air Conditioning Contractor", "Solar Panel Installer",
    "Cabinet Maker", "Bricklayer", "Waterproofer", "Paving Contractor",
    "Demolition Contractor", "Excavation Contractor", "Pest Control Service",
    "Pool Builder", "Gutter Cleaning Service", "Flooring Contractor", "Insulation Contractor"
];

const SUBURBS = [
    // --- GEELONG, VIC ---
    { city: "Geelong", state: "VIC", region: "Victoria" },
    { city: "Belmont", state: "VIC", region: "Victoria" },
    { city: "Highton", state: "VIC", region: "Victoria" },
    { city: "Newtown", state: "VIC", region: "Victoria" },
    { city: "Grovedale", state: "VIC", region: "Victoria" },
    { city: "Waurn Ponds", state: "VIC", region: "Victoria" },
    { city: "Corio", state: "VIC", region: "Victoria" },
    { city: "Norlane", state: "VIC", region: "Victoria" },
    { city: "Lara", state: "VIC", region: "Victoria" },
    { city: "Leopold", state: "VIC", region: "Victoria" },
    { city: "Ocean Grove", state: "VIC", region: "Victoria" },
    { city: "Torquay", state: "VIC", region: "Victoria" },
    { city: "Drysdale", state: "VIC", region: "Victoria" },
    { city: "Barwon Heads", state: "VIC", region: "Victoria" },
    { city: "Clifton Springs", state: "VIC", region: "Victoria" },

    // --- ADELAIDE, SA ---
    { city: "Adelaide", state: "SA", region: "South Australia" },
    { city: "Glenelg", state: "SA", region: "South Australia" },
    { city: "Norwood", state: "SA", region: "South Australia" },
    { city: "Unley", state: "SA", region: "South Australia" },
    { city: "Prospect", state: "SA", region: "South Australia" },
    { city: "Campbelltown", state: "SA", region: "South Australia" },
    { city: "Salisbury", state: "SA", region: "South Australia" },
    { city: "Elizabeth", state: "SA", region: "South Australia" },
    { city: "Tea Tree Gully", state: "SA", region: "South Australia" },
    { city: "Modbury", state: "SA", region: "South Australia" },
    { city: "Marion", state: "SA", region: "South Australia" },
    { city: "Morphett Vale", state: "SA", region: "South Australia" },
    { city: "Noarlunga", state: "SA", region: "South Australia" },
    { city: "Mount Barker", state: "SA", region: "South Australia" },
    { city: "Port Adelaide", state: "SA", region: "South Australia" },

    // --- PERTH, WA ---
    { city: "Perth", state: "WA", region: "Western Australia" },
    { city: "Fremantle", state: "WA", region: "Western Australia" },
    { city: "Joondalup", state: "WA", region: "Western Australia" },
    { city: "Rockingham", state: "WA", region: "Western Australia" },
    { city: "Mandurah", state: "WA", region: "Western Australia" },
    { city: "Armadale", state: "WA", region: "Western Australia" },
    { city: "Midland", state: "WA", region: "Western Australia" },
    { city: "Cannington", state: "WA", region: "Western Australia" },
    { city: "Ellenbrook", state: "WA", region: "Western Australia" },
    { city: "Baldivis", state: "WA", region: "Western Australia" },
    { city: "Stirling", state: "WA", region: "Western Australia" },
    { city: "Scarborough", state: "WA", region: "Western Australia" },
    { city: "Canning Vale", state: "WA", region: "Western Australia" },
    { city: "Karrinyup", state: "WA", region: "Western Australia" },
    { city: "Clarkson", state: "WA", region: "Western Australia" },
];

async function init() {
    console.log("🏙️ Building suburb-level queue for Geelong, Adelaide, Perth...");
    let count = 0;

    for (const { city, state } of SUBURBS) {
        for (const trade of TRADES) {
            try {
                await sql`
                    INSERT INTO scrape_queue (city_name, trade_category, status)
                    VALUES (${city}, ${trade}, 'pending')
                    ON CONFLICT (city_name, trade_category) DO NOTHING
                `;
                count++;
            } catch (e) {
                console.error(`Failed ${city} | ${trade}: ${e.message}`);
            }
        }
    }

    console.log(`✅ Done! Added ${count} suburb/trade combinations to queue.`);
    await sql.end();
}

init();
