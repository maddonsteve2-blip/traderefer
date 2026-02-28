
const https = require('https');
const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

/**
 * FULL GEELONG SCALE-UP ENGINE (LIVE SEARCH EDITION)
 * - Uses /business_data/business_listings/search/live
 * - Loops suburbs and broad trades carefully
 * - Populates 'unclaimed' business profiles
 */

const DATAFORSEO_AUTH = "Basic c3RldmVqZm9yZDFAZ21haWwuY29tOjllOTVlMTkyMTYzZTdjZDA=";
const DATABASE_URL = "postgresql://neondb_owner:npg_qsxKWSvGyk65@ep-steep-violet-aikad8l7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const sql = postgres(DATABASE_URL);

// Load Suburbs and Trades
let suburbs = ["Geelong", "Belmont", "Highton", "Grovedale", "Lara", "Corio", "Torquay", "Ocean Grove"];
try {
    const suburbsRaw = fs.readFileSync(path.join(__dirname, 'geelong_config.py'), 'utf-8');
    const matches = suburbsRaw.match(/"([^"]+)"/g);
    if (matches) suburbs = matches.map(s => s.replace(/"/g, '')).filter(s => s !== 'VIC');
} catch (e) {
    console.log("Using default suburbs list.");
}

const tradeShortlist = JSON.parse(fs.readFileSync(path.join(__dirname, 'trade_shortlist.json'), 'utf-8'));

const BROAD_TRADES = [
    "Plumber", "Electrician", "Carpenter", "Painter", "Handyman",
    "Gardener", "Landscaper", "Tiler", "Roofing", "Concreter",
    "Fencing", "Builder", "Cleaner", "Tree Surgeon"
];

const MAX_CONCURRENT = 10;
let activeRequests = 0;

async function fetchLive(category, suburb) {
    while (activeRequests >= MAX_CONCURRENT) await new Promise(r => setTimeout(r, 100));
    activeRequests++;

    return new Promise((resolve) => {
        const postData = JSON.stringify([{
            "categories": [category.toLowerCase()],
            "filters": [
                ["address_info.city", "=", suburb],
                "and", ["address_info.region", "=", "Victoria"],
                "and", ["rating.value", ">=", 4.0]
            ],
            "limit": 10
        }]);

        const req = https.request({
            hostname: 'api.dataforseo.com',
            path: '/v3/business_data/business_listings/search/live',
            method: 'POST',
            headers: { 'Authorization': DATAFORSEO_AUTH, 'Content-Type': 'application/json' },
            timeout: 60000
        }, (res) => {
            let data = '';
            res.on('data', (c) => data += c);
            res.on('end', () => {
                activeRequests--;
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.status_code === 20000 && parsed.tasks?.[0]?.result) {
                        resolve(parsed.tasks[0].result[0].items || []);
                    } else {
                        resolve([]);
                    }
                } catch (e) { resolve([]); }
            });
        });
        req.on('error', () => { activeRequests--; resolve([]); });
        req.write(postData);
        req.end();
    });
}

function generateSlug(name, suburb) {
    return (name + "-" + suburb).toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + "-" + Math.floor(Math.random() * 1000);
}

async function run() {
    console.log("🏙️ Starting Live Geelong Directory Rebuild...");
    let totalSaved = 0;

    for (const trade of BROAD_TRADES) {
        console.log(`\n🔍 Sector: ${trade}`);
        for (const suburb of suburbs) {
            const items = await fetchLive(trade, suburb);
            if (!items.length) continue;

            console.log(`  📍 ${suburb}: Found ${items.length} top-tier businesses.`);
            for (const item of items) {
                try {
                    const sourceUrl = item.place_id || item.url || generateSlug(item.title, suburb);
                    const trustScore = Math.round((item.rating?.value || 4.0) * 20);

                    await sql`
                        INSERT INTO businesses (
                            business_name, slug, trade_category, suburb, city, state, 
                            address, business_phone, website, trust_score, avg_rating, total_reviews,
                            is_verified, status, listing_visibility, data_source, source_url,
                            is_claimed, claim_status
                        )
                        VALUES (
                            ${item.title}, ${generateSlug(item.title, suburb)}, ${trade}, ${suburb}, 'Geelong', 'VIC',
                            ${item.address || null}, ${item.phone || null}, ${item.url || null}, 
                            ${trustScore}, ${item.rating?.value || 4.0}, ${item.rating?.votes_count || 0},
                            true, 'active', 'public', 'DataForSEO', ${sourceUrl},
                            false, 'unclaimed'
                        )
                        ON CONFLICT (source_url) DO UPDATE SET
                            avg_rating = ${item.rating?.value},
                            total_reviews = ${item.rating?.votes_count},
                            updated_at = now()
                    `;
                    totalSaved++;
                } catch (e) { }
            }
        }
    }

    console.log(`\n🏆 Build Complete. Total Unclaimed Profiles Created: ${totalSaved}`);
    process.exit(0);
}

run();
