
const https = require('https');
const postgres = require('postgres');

// Configuration
const DATAFORSEO_AUTH = "Basic c3RldmVqZm9yZDFAZ21haWwuY29tOjllOTVlMTkyMTYzZTdjZDA=";
const DATABASE_URL = "postgresql://neondb_owner:npg_qsxKWSvGyk65@ep-steep-violet-aikad8l7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const sql = postgres(DATABASE_URL);

async function dfRequest(path, method = 'POST', data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.dataforseo.com',
            path: path, method: method,
            headers: { 'Authorization': DATAFORSEO_AUTH, 'Content-Type': 'application/json' }
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

async function debugItems() {
    console.log("🔍 Checking item structure in Business Listings Search...");
    const res = await dfRequest('/v3/business_data/business_listings/search/live', 'POST', [{
        "categories": ["plumber"],
        "filters": [["address_info.city", "=", "Belmont"]],
        "limit": 1
    }]);

    if (res.tasks?.[0]?.result?.[0]?.items?.[0]) {
        const item = res.tasks[0].result[0].items[0];
        console.log("ITEM KEYS:", Object.keys(item));
        console.log("PLACE_ID:", item.place_id);
    } else {
        console.log("No items found. Response:", JSON.stringify(res, null, 2));
    }
    process.exit(0);
}

debugItems();
