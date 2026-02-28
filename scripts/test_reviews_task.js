
const https = require('https');

const username = "stevejford1@gmail.com";
const password = "9e95e192163e7cd0";
const auth = "Basic " + Buffer.from(username + ":" + password).toString('base64');

async function dfRequest(path, method = 'POST', data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.dataforseo.com',
            path: path,
            method: method,
            headers: {
                'Authorization': auth,
                'Content-Type': 'application/json'
            }
        };
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    console.error("Parse Error. Body:", body);
                    reject(e);
                }
            });
        });
        req.on('error', reject);
        if (data && method === 'POST') req.write(JSON.stringify(data));
        req.end();
    });
}

async function run() {
    try {
        const placeId = "ChIJKRziUhYV1GoRaHexCDrV0u8";

        console.log(`Step 1: Posting review task...`);
        const postRes = await dfRequest('/v3/business_data/google/reviews/task_post', 'POST', [{
            "place_id": placeId,
            "limit": 5
        }]);

        if (postRes.tasks?.[0]?.id) {
            const taskId = postRes.tasks[0].id;
            console.log(`Task ID: ${taskId}. Waiting 20s...`);
            await new Promise(r => setTimeout(r, 20000));

            console.log("Step 2: Fetching result via GET...");
            const getRes = await dfRequest(`/v3/business_data/google/reviews/task_get/regular/${taskId}`, 'GET');
            console.log("Status:", getRes.status_message);
            if (getRes.tasks?.[0]?.result?.[0]?.items) {
                console.log(`✅ Success! Found ${getRes.tasks[0].result[0].items.length} reviews.`);
                getRes.tasks[0].result[0].items.slice(0, 2).forEach(r => {
                    console.log(`Review by ${r.profile_name}: ${r.rating?.value} stars - "${r.review_text?.substring(0, 50)}..."`);
                });
            } else {
                console.log("No result yet. Response:", JSON.stringify(getRes, null, 2));
            }
        }
    } catch (e) {
        console.error(e);
    }
}

run();
