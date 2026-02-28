
const https = require('https');
const postgres = require('postgres');

// Configuration
const DATAFORSEO_AUTH = "Basic c3RldmVqZm9yZDFAZ21haWwuY29tOjllOTVlMTkyMTYzZTdjZDA=";
const DATABASE_URL = "postgresql://neondb_owner:npg_qsxKWSvGyk65@ep-steep-violet-aikad8l7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const sql = postgres(DATABASE_URL);

async function dfseoRequest(path, method = 'POST', postData = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.dataforseo.com',
            path: path,
            method: method,
            headers: { 'Authorization': DATAFORSEO_AUTH, 'Content-Type': 'application/json' }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        });
        req.on('error', reject);
        if (postData) req.write(JSON.stringify(postData));
        req.end();
    });
}

async function fetchBusinesses(category, suburb) {
    console.log(`\n🔍 Searching: ${category} in ${suburb} (4.0+)`);
    const res = await dfseoRequest('/v3/business_data/business_listings/search/live', 'POST', [{
        "categories": [category.toLowerCase()],
        "filters": [
            ["address_info.city", "=", suburb],
            "and",
            ["address_info.region", "=", "Victoria"],
            "and",
            ["rating.value", ">=", 4.0]
        ],
        "order_by": ["rating.value,desc"],
        "limit": 5
    }]);

    if (res.status_code === 20000 && res.tasks && res.tasks[0].result) {
        return res.tasks[0].result[0].items || [];
    }
    return [];
}

async function fetchReviewsTask(place_id) {
    console.log(`   ⏳ Step 1: Posting review task for ${place_id}...`);
    const postRes = await dfseoRequest('/v3/business_data/google/reviews/task_post', 'POST', [{
        "place_id": place_id,
        "limit": 5
    }]);

    if (postRes.status_code === 20000 && postRes.tasks && postRes.tasks[0].id) {
        const taskId = postRes.tasks[0].id;
        console.log(`   ⏳ Step 2: Task created (${taskId}). Waiting for processing...`);

        // DataForSEO tasks usually take 10-60s for reviews, but let's try 5s first with a retry loop
        let attempts = 0;
        while (attempts < 5) {
            await new Promise(r => setTimeout(r, 7000));
            attempts++;

            console.log(`   ⏳ Step 3: Getting result (Attempt ${attempts})...`);
            const getRes = await dfseoRequest(`/v3/business_data/google/reviews/task_get/regular/${taskId}`, 'GET');

            if (getRes.status_code === 20000 && getRes.tasks && getRes.tasks[0].result) {
                return getRes.tasks[0].result[0].items || [];
            } else if (getRes.status_code === 40201) {
                console.log("   ⏰ Task still processing...");
            } else {
                console.log(`   ⚠️ Info: ${getRes.status_message}`);
                break;
            }
        }
    }
    return [];
}

async function run() {
    try {
        console.log("🚀 Starting DataForSEO Deep Scrape (Geelong Pilot)...");

        const trades = ["Plumber", "Electrician"];
        const suburbs = ["Belmont"];

        for (const trade of trades) {
            for (const suburb of suburbs) {
                const businesses = await fetchBusinesses(trade, suburb);
                console.log(`✅ Found ${businesses.length} businesses.`);

                for (const item of businesses) {
                    console.log(`\n👉 Business: ${item.title}`);
                    const trustScore = Math.round((item.rating?.value || 4.0) * 20);
                    const sourceUrl = item.place_id || item.url;

                    // 1. Upsert Business
                    const existing = await sql`
                        SELECT id FROM businesses 
                        WHERE source_url = ${sourceUrl} 
                        OR (business_name = ${item.title} AND suburb = ${suburb})
                        LIMIT 1
                    `;

                    let bizId;
                    if (existing.length > 0) {
                        bizId = existing[0].id;
                        await sql`
                            UPDATE businesses SET
                                avg_rating = ${item.rating?.value || null},
                                total_reviews = ${item.rating?.votes_count || 0},
                                business_phone = ${item.phone || null},
                                website = ${item.url || null},
                                trust_score = ${trustScore},
                                updated_at = now()
                            WHERE id = ${bizId}
                        `;
                        console.log(`   ✨ Updated stats.`);
                    } else {
                        const slug = (item.title + "-" + suburb).toLowerCase().replace(/[^a-z0-9]+/g, '-') + "-" + Math.floor(Math.random() * 1000);
                        const inserted = await sql`
                            INSERT INTO businesses (
                                business_name, slug, trade_category, suburb, city, state, 
                                address, business_phone, website, trust_score, avg_rating, total_reviews,
                                is_verified, status, listing_visibility, data_source, source_url, description
                            ) VALUES (
                                ${item.title}, ${slug}, ${trade}, ${suburb}, 'Geelong', 'VIC',
                                ${item.address || null}, ${item.phone || null}, ${item.url || null}, 
                                ${trustScore}, ${item.rating?.value || null}, ${item.rating?.votes_count || 0},
                                true, 'active', 'public', 'DataForSEO', ${sourceUrl},
                                ${item.description || `Highly rated ${trade} professional in ${suburb}`}
                            ) RETURNING id
                        `;
                        bizId = inserted[0].id;
                        console.log(`   ➕ Added business.`);
                    }

                    // 2. Fetch Reviews via Task API
                    if (item.place_id) {
                        const reviews = await fetchReviewsTask(item.place_id);
                        if (reviews.length > 0) {
                            console.log(`   ✅ Saved ${reviews.length} reviews.`);
                            for (const review of reviews) {
                                try {
                                    await sql`
                                        INSERT INTO business_reviews (
                                            business_id, profile_name, rating, review_text, 
                                            review_highlights, owner_answer, source, external_id
                                        ) VALUES (
                                            ${bizId}, ${review.profile_name}, ${review.rating?.value}, 
                                            ${review.review_text}, ${JSON.stringify(review.review_highlights || [])},
                                            ${review.owner_answer}, 'google_maps', ${review.review_id}
                                        ) ON CONFLICT (external_id) DO NOTHING
                                    `;
                                } catch (e) { }
                            }
                        } else {
                            console.log(`   ℹ️ No reviews found.`);
                        }
                    }
                    await new Promise(r => setTimeout(r, 2000));
                }
            }
        }
    } catch (err) {
        console.error("💥 Error:", err);
    } finally {
        process.exit(0);
    }
}

run();
