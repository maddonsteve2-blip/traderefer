
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
        console.log("Step 1: Discovering business via Business Listings...");
        const search = await dfRequest('/v3/business_data/business_listings/search/live', [{
            "categories": ["plumber"],
            "filters": [["address_info.city", "=", "Belmont"]],
            "limit": 5
        }]);

        const items = search.tasks?.[0]?.result?.[0]?.items;
        if (!items || items.length === 0) {
            console.log("No businesses found.");
            return;
        }

        for (const business of items) {
            console.log(`\nBusiness: ${business.title}, Place ID: ${business.place_id}`);
            if (business.place_id) {
                console.log("Fetching reviews...");
                const reviews = await dfRequest('/v3/business_data/google/reviews/live', [{
                    "place_id": business.place_id,
                    "limit": 3
                }]);
                console.log(`Reviews Status: ${reviews.status_code}, Items: ${reviews.tasks?.[0]?.result?.[0]?.items_count || 0}`);
                if (reviews.tasks?.[0]?.result?.[0]?.items) {
                    reviews.tasks[0].result[0].items.forEach(r => console.log(`- ${r.profile_name}: ${r.rating?.value} stars`));
                }
            }
        }
    } catch (e) {
        console.error(e);
    }
}

run();
