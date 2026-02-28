
/**
 * TRADEREFER NATIONAL SCALER - MASTER CONTROL SCRIPT
 * --------------------------------------------------
 * Combines Discovery, Enrichment, and Queue Management into one command.
 * 
 * Usage:
 * node scripts/sc_master_national.js --all       (Discover + Enrich)
 * node scripts/sc_master_national.js --init      (Setup DB Queue)
 * node scripts/sc_master_national.js --discover  (Search Businesses)
 * node scripts/sc_master_national.js --enrich    (Import Reviews)
 * node scripts/sc_master_national.js --status    (Show Dashboard)
 */

const https = require('https');
const postgres = require('postgres');

const DATAFORSEO_AUTH = "Basic c3RldmVqZm9yZDFAZ21haWwuY29tOjllOTVlMTkyMTYzZTdjZDA=";
const DATABASE_URL = "postgresql://neondb_owner:npg_qsxKWSvGyk65@ep-steep-violet-aikad8l7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = postgres(DATABASE_URL);

// --- 🌐 GLOBAL API REQUEST WRAPPER ---
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

// --- 🏙️ PHASE 1: INITIALIZE QUEUE ---
async function initQueue() {
    console.log("🏙️ Initializing Scrape Queue for National Rollout...");
    const cities = ["Geelong", "Melbourne", "Sydney", "Brisbane", "Perth", "Adelaide", "Canberra"];
    const trades = [
        "Plumbers", "Electricians", "Roofers", "Landscapers", "Painters",
        "Tilers", "Concreters", "Carpenters", "Fencers", "Glaziers",
        "Air Conditioning", "Plasterers", "Locksmiths", "Solar Installation"
    ];

    let count = 0;
    for (const city of cities) {
        for (const trade of trades) {
            await sql`
                INSERT INTO scrape_queue (city_name, trade_category, status)
                VALUES (${city}, ${trade}, 'pending')
                ON CONFLICT (city_name, trade_category) DO NOTHING
            `;
            count++;
        }
    }
    console.log(`✅ Success! Queue ready with ${count} combinations.`);
}

// --- 🔍 PHASE 2: DISCOVERY ENGINE ---
async function runDiscover() {
    console.log("🔍 Launching Discovery Engine...");

    const task = await sql`
        SELECT * FROM scrape_queue 
        WHERE status = 'pending' 
        ORDER BY id ASC LIMIT 1
    `;

    if (task.length === 0) {
        console.log("✅ No pending Discovery tasks.");
        return false;
    }

    const { id, city_name, trade_category } = task[0];
    const city = city_name;
    const trade = trade_category;

    const STATE_MAP = {
        // Victoria - Geelong suburbs
        "Geelong": "Victoria", "Melbourne": "Victoria", "Belmont": "Victoria",
        "Highton": "Victoria", "Newtown": "Victoria", "Grovedale": "Victoria",
        "Waurn Ponds": "Victoria", "Corio": "Victoria", "Norlane": "Victoria",
        "Lara": "Victoria", "Leopold": "Victoria", "Ocean Grove": "Victoria",
        "Torquay": "Victoria", "Drysdale": "Victoria", "Barwon Heads": "Victoria",
        "Clifton Springs": "Victoria",
        // NSW
        "Sydney": "New South Wales", "Newcastle": "New South Wales", "Wollongong": "New South Wales",
        // QLD
        "Brisbane": "Queensland", "Gold Coast": "Queensland", "Sunshine Coast": "Queensland",
        // WA - Perth suburbs
        "Perth": "Western Australia", "Fremantle": "Western Australia", "Joondalup": "Western Australia",
        "Rockingham": "Western Australia", "Mandurah": "Western Australia", "Armadale": "Western Australia",
        "Midland": "Western Australia", "Cannington": "Western Australia", "Ellenbrook": "Western Australia",
        "Baldivis": "Western Australia", "Stirling": "Western Australia", "Scarborough": "Western Australia",
        "Canning Vale": "Western Australia", "Karrinyup": "Western Australia", "Clarkson": "Western Australia",
        // SA - Adelaide suburbs
        "Adelaide": "South Australia", "Glenelg": "South Australia", "Norwood": "South Australia",
        "Unley": "South Australia", "Prospect": "South Australia", "Campbelltown": "South Australia",
        "Salisbury": "South Australia", "Elizabeth": "South Australia", "Tea Tree Gully": "South Australia",
        "Modbury": "South Australia", "Marion": "South Australia", "Morphett Vale": "South Australia",
        "Noarlunga": "South Australia", "Mount Barker": "South Australia", "Port Adelaide": "South Australia",
        // ACT / TAS / NT
        "Canberra": "Australian Capital Territory",
        "Hobart": "Tasmania",
        "Darwin": "Northern Territory"
    };
    const region = STATE_MAP[city] || "Victoria";
    const state = region === "Victoria" ? "VIC" : region === "New South Wales" ? "NSW" : 
                  region === "Queensland" ? "QLD" : region === "Western Australia" ? "WA" :
                  region === "South Australia" ? "SA" : region === "Australian Capital Territory" ? "ACT" :
                  region === "Tasmania" ? "TAS" : "NT";

    console.log(`📍 Searching: ${trade} in ${city} (${state})...`);

    await sql`UPDATE scrape_queue SET status = 'in_progress' WHERE id = ${id}`;

    const searchRes = await dfRequest('/v3/business_data/business_listings/search/live', 'POST', [{
        "categories": [trade.toLowerCase()],
        "filters": [
            ["address_info.city", "=", city],
            "and", ["address_info.region", "=", region]
        ],
        "limit": 50
    }]);

    const items = searchRes.tasks?.[0]?.result?.[0]?.items || [];
    let added = 0;

    for (const item of items) {
        try {
            const slug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substr(2, 5);
            const trustScore = Math.round((item.rating?.value || 4.0) * 20);
            const sourceUrl = item.place_id || item.url;
            if (!sourceUrl) continue;
            // Convert old-style Google profile photo URLs to working format
            const rawLogo = item.logo || null;
            const logoUrl = rawLogo
                ? rawLogo.replace(/\/s\d+-[^/]+\/photo\.jpg$/, '/s200-c/photo.jpg')
                : null;
            await sql`
                INSERT INTO businesses (
                    business_name, slug, trade_category, suburb, city, state, business_phone,
                    avg_rating, total_reviews, source_url, data_source,
                    logo_url, address, website, trust_score,
                    is_verified, status, listing_visibility, is_claimed, claim_status
                )
                VALUES (
                    ${item.title},
                    ${slug},
                    ${trade},
                    ${item.address_info?.city || city},
                    ${city}, ${state}, ${item.phone || null},
                    ${item.rating?.value || 0}, ${item.rating?.votes_count || 0},
                    ${sourceUrl}, 'DataForSEO',
                    ${logoUrl}, ${item.address || null}, ${item.url || null}, ${trustScore},
                    true, 'active', 'public', false, 'unclaimed'
                )
                ON CONFLICT (source_url) DO UPDATE SET
                    avg_rating = EXCLUDED.avg_rating,
                    total_reviews = EXCLUDED.total_reviews,
                    logo_url = COALESCE(EXCLUDED.logo_url, businesses.logo_url),
                    updated_at = now()
            `;
            added++;
        } catch (e) {
            console.log(`   ⚠️  Skipped ${item.title}: ${e.message}`);
        }
    }

    await sql`UPDATE scrape_queue SET status = 'completed', last_scraped_at = NOW() WHERE id = ${id}`;
    console.log(`✅ Discovery Done: Found ${added} high-rated businesses.`);
    return true;
}

// --- 💎 PHASE 3: ENRICHMENT ENGINE ---
async function runEnrich() {
    console.log("💎 Launching Enrichment Engine (Reviews)...");

    const targets = await sql`
        SELECT b.id, b.source_url as place_id, b.business_name, b.city
        FROM businesses b
        LEFT JOIN business_reviews br ON br.business_id = b.id
        WHERE b.source_url LIKE 'ChIJ%' 
        AND br.id IS NULL
        AND b.total_reviews > 0
        LIMIT 20
    `;

    if (targets.length === 0) {
        console.log("✅ All businesses enriched.");
        return;
    }

    console.log(`💬 Posting tasks for ${targets.length} businesses...`);
    const reviewTasks = targets.map(t => ({
        "place_id": t.place_id,
        "location_name": "Victoria,Australia",
        "language_name": "English",
        "depth": 10
    }));

    const postRes = await dfRequest('/v3/business_data/google/reviews/task_post', 'POST', reviewTasks);

    if (postRes.status_code !== 20000) {
        console.error("❌ Task Post Failed:", postRes.status_message);
        return;
    }

    const pending = postRes.tasks.map((t, idx) => ({
        taskId: t.id,
        bizId: targets[idx].id,
        bizName: targets[idx].business_name
    })).filter(p => p.taskId !== null);

    console.log(`⏳ Tasks posted. Polling for readiness...`);

    let readyCount = 0;
    let attempts = 0;
    while (attempts < 5) {
        const readyRes = await dfRequest('/v3/business_data/google/reviews/tasks_ready', 'GET');
        const readyIds = (readyRes.tasks?.[0]?.result || []).map(r => r.id);
        const readyMatching = pending.filter(p => readyIds.includes(p.taskId));

        console.log(`🚦 Ready Check ${attempts + 1}: ${readyMatching.length} ready...`);

        if (readyMatching.length > 0) {
            for (const task of readyMatching) {
                const getRes = await dfRequest(`/v3/business_data/google/reviews/task_get/${task.taskId}`, 'GET');
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
                }
                console.log(`  ✨ Enhanced: ${task.bizName} (+${items.length} reviews)`);
                pending.splice(pending.indexOf(task), 1);
            }
        }
        if (pending.length === 0) break;
        attempts++;
        await new Promise(r => setTimeout(r, 45000));
    }
}

// --- 📊 PHASE 4: STATUS DASHBOARD ---
async function showStatus() {
    console.log("\n📊 SCALER DASHBOARD");
    const queue = await sql`SELECT status, count(*) FROM scrape_queue GROUP BY status`;
    const bizCount = await sql`SELECT count(*) FROM businesses`;
    const revCount = await sql`SELECT count(*) FROM business_reviews`;

    console.log("========================================");
    queue.forEach(q => console.log(`- ${q.status.toUpperCase()}: ${q.count}`));
    console.log(`- 🏢 Total Businesses: ${bizCount[0].count}`);
    console.log(`- 💬 Total Reviews:    ${revCount[0].count}`);
    console.log("========================================\n");
}

// --- 🚀 MAIN ENTRY POINT ---
async function main() {
    const args = process.argv.slice(2);

    if (args.includes('--init')) {
        await initQueue();
    }

    if (args.includes('--discover') || args.includes('--all')) {
        let more = true;
        while (more) {
            more = await runDiscover();
        }
    }

    if (args.includes('--enrich') || args.includes('--all')) {
        await runEnrich();
    }

    if (args.includes('--status') || args.length === 0) {
        await showStatus();
    }

    console.log("👋 All Master Scraper tasks finalized.");
    process.exit(0);
}

main();
