
const https = require('https');

const DATAFORSEO_AUTH = "Basic c3RldmVqZm9yZDFAZ21haWwuY29tOjllOTVlMTkyMTYzZTdjZDA=";

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

async function debugDiscoveryTask() {
    console.log("🚀 Debugging Discovery Task Flow...");
    const postRes = await dfRequest('/v3/business_data/business_listings/search/task_post', 'POST', [{
        "categories": ["plumbing"],
        "filters": [["address_info.city", "=", "Belmont"]],
        "limit": 1
    }]);

    if (!postRes.tasks?.[0]?.id) {
        console.log("❌ Task POST failed:", postRes);
        return;
    }

    const taskId = postRes.tasks[0].id;
    console.log(`✅ Task Posted. ID: ${taskId}. Waiting 20s...`);
    await new Promise(r => setTimeout(r, 20000));

    console.log("🔍 Checking Pattern 1: /task_get/" + taskId);
    const res1 = await dfRequest(`/v3/business_data/business_listings/search/task_get/${taskId}`, 'GET');
    console.log(`Result 1 Status: ${res1.status_message} (items: ${res1.tasks?.[0]?.result?.[0]?.items?.length || 0})`);

    console.log("🔍 Checking Pattern 2: /task_get/regular/" + taskId);
    const res2 = await dfRequest(`/v3/business_data/business_listings/search/task_get/regular/${taskId}`, 'GET');
    console.log(`Result 2 Status: ${res2.status_message} (items: ${res2.tasks?.[0]?.result?.[0]?.items?.length || 0})`);

    process.exit(0);
}

debugDiscoveryTask();
