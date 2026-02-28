
const https = require('https');

const username = "stevejford1@gmail.com";
const password = "9e95e192163e7cd0";
const auth = "Basic " + Buffer.from(username + ":" + password).toString('base64');

async function dfRequest(path, data) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.dataforseo.com',
            path: path,
            method: 'POST',
            headers: { 'Authorization': auth, 'Content-Type': 'application/json' }
        };
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve(JSON.parse(body)));
        });
        req.on('error', reject);
        req.write(JSON.stringify(data));
        req.end();
    });
}

async function run() {
    try {
        console.log("Step 1: Discovering business...");
        const search = await dfRequest('/v3/business_data/google/search/live', [{
            "keyword": "Jack Heathcote Plumbing Belmont VIC",
            "limit": 1
        }]);

        const business = search.tasks?.[0]?.result?.[0]?.items?.[0];
        if (!business) {
            console.log("Business not found.");
            return;
        }

        const placeId = business.place_id;
        console.log(`Found Business: ${business.title}, Place ID: ${placeId}`);

        console.log("\nStep 2: Fetching reviews using place_id...");
        const reviews = await dfRequest('/v3/business_data/google/reviews/live', [{
            "place_id": placeId,
            "limit": 3
        }]);

        console.log(JSON.stringify(reviews, null, 2));
    } catch (e) {
        console.error(e);
    }
}

run();
