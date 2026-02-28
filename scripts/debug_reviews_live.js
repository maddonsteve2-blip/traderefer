
const https = require('https');

const DATAFORSEO_AUTH = "Basic c3RldmVqZm9yZDFAZ21haWwuY29tOjllOTVlMTkyMTYzZTdjZDA=";

async function dfRequest(path, method = 'POST', data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.dataforseo.com',
            path: path, method: method,
            headers: { 'Authorization': DATAFORSEO_AUTH, 'Content-Type': 'application/json' },
            timeout: 60000
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

async function test() {
    // Testing with Cre8flow Place ID: ChIJWdyyU44T1GoRLrUGSgsPUwI
    const placeId = "ChIJWdyyU44T1GoRLrUGSgsPUwI";

    console.log(`🔍 Testing LIVE Google Reviews for Place ID: ${placeId}`);

    const res = await dfRequest('/v3/business_data/google/reviews/live', 'POST', [{
        "place_id": placeId,
        "limit": 3
    }]);

    console.log("Full API Response:", JSON.stringify(res, null, 2));
}

test();
