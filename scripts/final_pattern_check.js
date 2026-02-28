
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
        const placeId = "ChIJKRziUhYV1GoRaHexCDrV0u8"; // Jack Heathcote
        console.log("Creating task...");
        const postRes = await dfRequest('/v3/business_data/google/reviews/task_post', 'POST', [{ "place_id": placeId, "limit": 2 }]);

        if (postRes.tasks?.[0]?.id) {
            const taskId = postRes.tasks[0].id;
            console.log(`Task ID: ${taskId}. Waiting 30s... (Reviews take time)`);
            await new Promise(r => setTimeout(r, 30000));

            // Try BOTH patterns to be sure
            console.log("Checking pattern 1: /task_get/$id");
            const res1 = await dfRequest(`/v3/business_data/google/reviews/task_get/${taskId}`, 'GET');
            console.log("Result 1 Status:", res1.status_message);

            console.log("Checking pattern 2: /task_get/regular/$id");
            const res2 = await dfRequest(`/v3/business_data/google/reviews/task_get/regular/${taskId}`, 'GET');
            console.log("Result 2 Status:", res2.status_message);
        }
    } catch (e) {
        console.error(e);
    }
}

run();
