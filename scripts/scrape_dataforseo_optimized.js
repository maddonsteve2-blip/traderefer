
const https = require('https');
const postgres = require('postgres');

/**
 * DATAFORSEO NATIONAL SCALING ENGINE v3.2 (FULL GEELONG PILOT)
 * 
 * IMPROVED: Uses Task Method for BOTH Discovery and Reviews for stability/batching.
 * - Standard Discovery: task_post + polling
 * - Standard Reviews: task_post + polling
 */

const DATAFORSEO_AUTH = "Basic c3RldmVqZm9yZDFAZ21haWwuY29tOjllOTVlMTkyMTYzZTdjZDA=";
const DATABASE_URL = "postgresql://neondb_owner:npg_qsxKWSvGyk65@ep-steep-violet-aikad8l7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const sql = postgres(DATABASE_URL);

const TRADES = ["Plumbing", "Electrical", "Carpentry", "Roofing", "Painting", "Landscaping", "Handyman", "Fencing"];
const GEELONG_SUBURBS = ["Belmont", "Highton", "Grovedale", "Geelong West", "Ocean Grove", "Torquay", "Lara", "Leopold"];

const MAX_CONCURRENT = 30;
let activeRequests = 0;

async function dfRequest(path, method = 'POST', data = null) {
    while (activeRequests >= MAX_CONCURRENT) await new Promise(r => setTimeout(r, 100));
    activeRequests++;
    try {
        return await new Promise((resolve, reject) => {
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
    } finally {
        activeRequests--;
    }
}

async function run() {
    console.log("🚀 Launching DataForSEO Batch Engine...");

    // STEP 1: BATCHED DISCOVERY (TASK_POST)
    const discoveryPending = [];
    const searchTasks = [];
    for (const trade of TRADES) {
        for (const suburb of GEELONG_SUBURBS) {
            searchTasks.push({
                "categories": [trade.toLowerCase()],
                "filters": [
                    ["address_info.city", "=", suburb],
                    "and", ["address_info.region", "=", "Victoria"],
                    "and", ["rating.value", ">=", 4.0]
                ],
                "limit": 10
            });
        }
    }

    console.log(`📡 Posting ${searchTasks.length} discovery tasks...`);
    for (let i = 0; i < searchTasks.length; i += 100) {
        const res = await dfRequest('/v3/business_data/business_listings/search/task_post', 'POST', searchTasks.slice(i, i + 100));
        if (res.tasks) {
            res.tasks.forEach(t => { if (t.id) discoveryPending.push(t.id); });
        }
    }

    console.log(`⏳ Waiting for discovery results (30s)...`);
    await new Promise(r => setTimeout(r, 30000));

    const businessQueue = [];
    const remainingDiscovery = [...discoveryPending];
    for (const id of remainingDiscovery) {
        const getRes = await dfRequest(`/v3/business_data/business_listings/search/task_get/regular/${id}`, 'GET');
        const items = getRes.tasks?.[0]?.result?.[0]?.items || [];
        const trade = getRes.tasks?.[0]?.data?.categories?.[0] || 'Unknown';
        const suburb = getRes.tasks?.[0]?.data?.filters?.[0]?.[2] || 'Unsorted';

        for (const item of items) {
            try {
                const sourceUrl = item.place_id || item.url;
                const trustScore = Math.round((item.rating?.value || 4.0) * 20);

                const existing = await sql`SELECT id FROM businesses WHERE source_url = ${sourceUrl} LIMIT 1`;
                let bizId;
                if (existing.length > 0) {
                    bizId = existing[0].id;
                    await sql`UPDATE businesses SET avg_rating = ${item.rating?.value}, total_reviews = ${item.rating?.votes_count}, trust_score = ${trustScore}, updated_at = now() WHERE id = ${bizId}`;
                } else {
                    const slug = (item.title + "-" + suburb).toLowerCase().replace(/[^a-z0-9]+/g, '-') + "-" + Math.floor(Math.random() * 1000);
                    const ins = await sql`
                        INSERT INTO businesses (business_name, slug, trade_category, suburb, city, state, address, business_phone, website, trust_score, avg_rating, total_reviews, is_verified, status, listing_visibility, data_source, source_url)
                        VALUES (${item.title}, ${slug}, ${trade}, ${suburb}, 'Geelong', 'VIC', ${item.address}, ${item.phone}, ${item.url}, ${trustScore}, ${item.rating?.value}, ${item.rating?.votes_count}, true, 'active', 'public', 'DataForSEO', ${sourceUrl})
                        RETURNING id
                    `;
                    bizId = ins[0].id;
                }
                if (item.place_id) businessQueue.push({ bizId, place_id: item.place_id });
            } catch (e) { }
        }
    }

    console.log(`✅ Discovery Complete. ${businessQueue.length} businesses ready for deep review extraction.`);

    // STEP 2: REVIEW EXTRACTION (TASK_POST)
    if (businessQueue.length > 0) {
        const reviewPending = [];
        console.log(`💬 Posting ${businessQueue.length} review tasks...`);
        for (let i = 0; i < businessQueue.length; i += 100) {
            const batch = businessQueue.slice(i, i + 100);
            const res = await dfRequest('/v3/business_data/google/reviews/task_post', 'POST', batch.map(b => ({ "place_id": b.place_id, "limit": 5 })));
            if (res.tasks) {
                res.tasks.forEach((t, idx) => { if (t.id) reviewPending.push({ taskId: t.id, bizId: batch[idx].bizId }); });
            }
        }

        console.log(`⏳ Waiting for reviews (60s)...`);
        await new Promise(r => setTimeout(r, 60000));

        let reviewsSaved = 0;
        for (const task of reviewPending) {
            const getRes = await dfRequest(`/v3/business_data/google/reviews/task_get/${task.taskId}`, 'GET');
            const reviews = getRes.tasks?.[0]?.result?.[0]?.items || [];
            for (const r of reviews) {
                try {
                    await sql`
                        INSERT INTO business_reviews (business_id, profile_name, rating, review_text, review_highlights, owner_answer, source, external_id)
                        VALUES (${task.bizId}, ${r.profile_name}, ${r.rating?.value}, ${r.review_text}, ${JSON.stringify(r.review_highlights || [])}, ${r.owner_answer}, 'google_maps', ${r.review_id})
                        ON CONFLICT (external_id) DO NOTHING
                    `;
                    reviewsSaved++;
                } catch (e) { }
            }
        }
        console.log(`✅ Finished. Saved ${reviewsSaved} reviews.`);
    }

    console.log("\n🏁 Engine cycle complete.");
    process.exit(0);
}

run();
