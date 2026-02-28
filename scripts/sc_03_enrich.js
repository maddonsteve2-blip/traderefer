/**
 * TRADEREFER NATIONAL SCALER - SCRIPT 03
 * ENRICHMENT ENGINE
 * 
 * Deep-fetches Google Reviews and Logos for businesses that lack them.
 * UPDATED: Corrected GET URL to match DataForSEO documentation.
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

async function runEnrichment() {
    console.log("💎 Launching Deep Enrichment Engine...");

    // 1. Find businesses that need reviews (limit to 10 for deep diagnostic)
    const targets = await sql`
        SELECT b.id, b.source_url as place_id, b.business_name, b.city, b.state
        FROM businesses b
        LEFT JOIN business_reviews br ON br.business_id = b.id
        WHERE b.source_url LIKE 'ChIJ%' 
        AND br.id IS NULL
        AND b.total_reviews > 0
        LIMIT 10
    `;

    if (targets.length === 0) {
        console.log("✅ All businesses are enriched.");
        process.exit(0);
    }

    console.log(`💬 Posting review tasks for ${targets.length} businesses...`);

    // We'll use a safer broad location if specific city naming is ambiguous
    const reviewTasks = targets.map(t => ({
        "place_id": t.place_id,
        "location_name": "Victoria,Australia", // Safer default for regional matching
        "language_name": "English",
        "depth": 10
    }));

    const postRes = await dfRequest('/v3/business_data/google/reviews/task_post', 'POST', reviewTasks);

    if (!postRes.tasks || postRes.status_code !== 20000) {
        console.error("❌ Task Post Failed:", JSON.stringify(postRes, null, 2));
        process.exit(1);
    }

    const pending = postRes.tasks.map((t, idx) => ({
        taskId: t.id,
        bizId: targets[idx].id,
        bizName: targets[idx].business_name
    })).filter(p => p.taskId !== null);

    console.log(`⏳ ${pending.length} tasks successfully posted.`);

    // Check loop
    let attempts = 0;
    const maxAttempts = 10; // Check every 30s, up to 5 mins total

    while (attempts < maxAttempts) {
        console.log(`🚦 Checking for ready tasks (Attempt ${attempts + 1}/${maxAttempts})...`);
        const readyRes = await dfRequest('/v3/business_data/google/reviews/tasks_ready', 'GET');

        const readyIds = (readyRes.tasks?.[0]?.result || []).map(r => r.id);
        const readyMatching = pending.filter(p => readyIds.includes(p.taskId));

        console.log(`📡 ${readyMatching.length} of our tasks are ready.`);

        if (readyMatching.length > 0) {
            let reviewCount = 0;
            for (const task of readyMatching) {
                try {
                    console.log(`📥 Fetching reviews: ${task.bizName}...`);
                    // FIX: No "regular", no extra segments. Just task_get/{id}
                    const getRes = await dfRequest(`/v3/business_data/google/reviews/task_get/${task.taskId}`, 'GET');

                    if (getRes.status_code !== 20000) {
                        console.log(`  ⚠️ Skipping ${task.bizName}: ${getRes.status_message}`);
                        continue;
                    }

                    const items = getRes.tasks?.[0]?.result?.[0]?.items || [];
                    for (const r of items) {
                        if (!r.review_text) continue;
                        await sql`
                            INSERT INTO business_reviews (
                                business_id, profile_name, rating, review_text, review_highlights, 
                                owner_answer, source, external_id
                            )
                            VALUES (
                                ${task.bizId}, ${r.profile_name}, ${r.rating?.value}, ${r.review_text}, 
                                ${JSON.stringify(r.review_highlights || [])}, ${r.owner_answer}, 
                                'google_maps', ${r.review_id}
                            )
                            ON CONFLICT (external_id) DO NOTHING
                        `;
                        reviewCount++;
                    }
                    console.log(`  ✨ Enhanced: ${task.bizName} (+${items.length} reviews)`);

                    // Mark task as processed so we don't fetch it twice
                    pending.splice(pending.indexOf(task), 1);
                } catch (e) {
                    console.error(`  ❌ Failed Enrichment for ${task.bizName}:`, e.message);
                }
            }
            if (pending.length === 0) break;
        }

        attempts++;
        await new Promise(r => setTimeout(r, 30000));
    }

    console.log(`\n🏆 Enrichment Run Complete.`);
    process.exit(0);
}

runEnrichment();
