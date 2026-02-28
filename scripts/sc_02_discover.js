
/**
 * TRADEREFER NATIONAL SCALER - SCRIPT 02
 * DISCOVERY ENGINE
 * 
 * Picks a "Pending" task from the queue and performs discovery.
 */

const https = require('https');
const postgres = require('postgres');

const DATAFORSEO_AUTH = "Basic c3RldmVqZm9yZDFAZ21haWwuY29tOjllOTVlMTkyMTYzZTdjZDA=";
const DATABASE_URL = "postgresql://neondb_owner:npg_qsxKWSvGyk65@ep-steep-violet-aikad8l7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = postgres(DATABASE_URL);

async function dfRequest(path, method = 'POST', data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.dataforseo.com',
            path: path, method: method,
            headers: { 'Authorization': DATAFORSEO_AUTH, 'Content-Type': 'application/json' },
            timeout: 120000
        };
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
            });
        });
        req.on('error', reject);
        if (data && method === 'POST') req.write(JSON.stringify(data));
        req.end();
    });
}

function generateSlug(name, city) {
    return (name + "-" + city).toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + "-" + Math.floor(Math.random() * 1000);
}

async function runDiscovery() {
    // 1. Get next pending task
    const [nextTask] = await sql`SELECT * FROM scrape_queue WHERE status = 'pending' LIMIT 1`;
    if (!nextTask) {
        console.log("🏁 No pending tasks in queue. Australia is fully discovered!");
        process.exit(0);
    }

    console.log(`🎯 Targeted Discovery: ${nextTask.trade_category} in ${nextTask.city_name}`);
    await sql`UPDATE scrape_queue SET status = 'in_progress', last_scraped_at = now() WHERE id = ${nextTask.id}`;

    try {
        const searchTasks = [{
            "categories": [nextTask.trade_category.toLowerCase()],
            "filters": [
                ["address_info.city", "=", nextTask.city_name],
                "and", ["address_info.region", "=", "Victoria"],
                "and", ["rating.value", ">=", 4.0]
            ],
            "limit": 10
        }];

        console.log("📡 Requesting LIVE business data...");
        const res = await dfRequest('/v3/business_data/business_listings/search/live', 'POST', searchTasks);

        if (res.status_code !== 20000 || !res.tasks?.[0]?.result?.[0]?.items) {
            console.log("Debug Response:", JSON.stringify(res, null, 2));
            throw new Error(res.status_message || "API failure from DataForSEO");
        }

        const items = res.tasks[0].result[0].items;

        let savedCount = 0;
        for (const item of items) {
            try {
                const sourceUrl = item.place_id || item.url;
                const trustScore = Math.round((item.rating?.value || 4.0) * 20);

                await sql`
                    INSERT INTO businesses (
                        business_name, slug, trade_category, suburb, city, state, 
                        address, business_phone, website, trust_score, avg_rating, total_reviews,
                        is_verified, status, listing_visibility, data_source, source_url,
                        is_claimed, claim_status, logo_url
                    )
                    VALUES (
                        ${item.title}, ${generateSlug(item.title, nextTask.city_name)}, ${nextTask.trade_category}, 
                        ${item.address_info?.city || nextTask.city_name}, ${nextTask.city_name}, 'VIC',
                        ${item.address}, ${item.phone}, ${item.url}, ${trustScore}, 
                        ${item.rating?.value}, ${item.rating?.votes_count}, true, 'active', 
                        'public', 'DataForSEO', ${sourceUrl}, false, 'unclaimed', ${item.logo || null}
                    )
                    ON CONFLICT (source_url) DO UPDATE SET
                        avg_rating = EXCLUDED.avg_rating,
                        total_reviews = EXCLUDED.total_reviews,
                        updated_at = now()
                `;
                savedCount++;
            } catch (e) { }
        }

        await sql`UPDATE scrape_queue SET status = 'completed' WHERE id = ${nextTask.id}`;
        console.log(`✅ Completed Search: ${savedCount} high-rated businesses saved.`);

    } catch (err) {
        console.error("❌ Discovery Failed:", err.message);
        await sql`UPDATE scrape_queue SET status = 'failed', error_log = ${err.message} WHERE id = ${nextTask.id}`;
    }

    process.exit(0);
}

runDiscovery();
