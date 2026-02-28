
const https = require('https');
const postgres = require('postgres');

// Configuration
const DATAFORSEO_AUTH = "Basic c3RldmVqZm9yZDFAZ21haWwuY29tOjllOTVlMTkyMTYzZTdjZDA=";
const DATABASE_URL = "postgresql://neondb_owner:npg_qsxKWSvGyk65@ep-steep-violet-aikad8l7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const sql = postgres(DATABASE_URL);

// Targeting the most popular trades first to hit 4+ and 5 stars
const TRADES = [
    "Plumber", "Electrician", "Carpenter", "Landscaper", "Handyman",
    "Painter", "Cleaner", "Concreter", "Tiler", "Fencing", "Roofing"
];

// Start with core Geelong areas
const GEELONG_SUBURBS = [
    "Geelong", "Belmont", "Highton", "Grovedale", "Geelong West",
    "Ocean Grove", "Torquay", "Lara", "Leopold", "Newtown",
    "South Geelong", "East Geelong", "North Geelong", "Hamlyn Heights"
];

async function fetchFromDataForSEO(category, suburb) {
    console.log(`\n🔍 Searching: ${category} in ${suburb}, VIC (4.0+)`);

    return new Promise((resolve, reject) => {
        const postData = JSON.stringify([
            {
                "categories": [category.toLowerCase()],
                "filters": [
                    ["address_info.city", "=", suburb],
                    "and",
                    ["address_info.region", "=", "Victoria"],
                    "and",
                    ["rating.value", ">=", 4.0]
                ],
                "order_by": ["rating.value,desc"],
                "limit": 10
            }
        ]);

        const options = {
            hostname: 'api.dataforseo.com',
            path: '/v3/business_data/business_listings/search/live',
            method: 'POST',
            headers: {
                'Authorization': DATAFORSEO_AUTH,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.status_code === 20000 && parsed.tasks && parsed.tasks[0].result) {
                        resolve(parsed.tasks[0].result[0].items || []);
                    } else if (parsed.status_code === 40207) {
                        console.error("❌ API Error: Access Denied. Check Whitelist.");
                        resolve([]);
                    } else {
                        console.log(`⚠️ Info: ${parsed.status_message}`);
                        resolve([]);
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

function generateSlug(name) {
    return name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

async function run() {
    let totalProcessed = 0;
    try {
        console.log("🚀 Starting Programmatic Scrape for TradeRefer.au...");

        for (const trade of TRADES) {
            for (const suburb of GEELONG_SUBURBS) {
                const items = await fetchFromDataForSEO(trade, suburb);

                if (items.length === 0) continue;
                console.log(`✅ Found ${items.length} records.`);

                for (const item of items) {
                    const trustScore = Math.round((item.rating?.value || 4.0) * 20);
                    const sourceUrl = item.place_id || item.url || null;

                    try {
                        // 1. Try to find existing business to "Improve" it
                        // We check by source_url (if exists) OR by name + suburb to catch the google_maps entries
                        const existing = await sql`
                            SELECT id, business_name FROM businesses 
                            WHERE source_url = ${sourceUrl} 
                            OR (business_name = ${item.title} AND suburb = ${suburb})
                            LIMIT 1
                        `;

                        if (existing.length > 0) {
                            // IMPROVE existing data
                            await sql`
                                UPDATE businesses SET
                                    business_name = ${item.title},
                                    trade_category = ${trade},
                                    address = ${item.address || null},
                                    business_phone = ${item.phone || null},
                                    website = ${item.url || null},
                                    trust_score = ${trustScore},
                                    data_source = 'DataForSEO',
                                    source_url = ${sourceUrl},
                                    updated_at = now()
                                WHERE id = ${existing[0].id}
                            `;
                            console.log(`   ✨ Improved: ${item.title}`);
                        } else {
                            // INSERT new data
                            const slug = generateSlug(item.title + "-" + suburb) + "-" + Math.floor(Math.random() * 1000);
                            await sql`
                                INSERT INTO businesses (
                                    business_name, slug, trade_category, suburb, city, state, 
                                    address, business_phone, website, trust_score, is_verified, 
                                    status, listing_visibility, data_source, source_url, description
                                ) VALUES (
                                    ${item.title}, ${slug}, ${trade}, ${suburb}, 'Geelong', 'VIC',
                                    ${item.address || null}, ${item.phone || null}, ${item.url || null}, 
                                    ${trustScore}, true, 'active', 'public', 'DataForSEO', ${sourceUrl},
                                    ${item.description || `Highly rated ${trade} in ${suburb}`}
                                )
                            `;
                            console.log(`   ➕ Added: ${item.title}`);
                        }
                        totalProcessed++;
                    } catch (dbErr) {
                        console.error(`   ❌ DB Error for ${item.title}:`, dbErr.message);
                    }
                }
                await new Promise(r => setTimeout(r, 1000));
            }
        }

    } catch (err) {
        console.error("\n💥 Fatal error:", err);
    } finally {
        console.log(`\n🏁 Finished. Total records processed/improved: ${totalProcessed}`);
        process.exit(0);
    }
}

run();
