
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

async function findLocation() {
    console.log("🔍 Looking up DataForSEO Location Code for 'Geelong'...");

    // Using the Business Data Locations endpoint
    const res = await dfRequest('/v3/business_data/google/locations', 'GET');

    // Filtering results for Geelong
    if (res.tasks && res.tasks[0] && res.tasks[0].result) {
        const locations = res.tasks[0].result;
        const geelong = locations.find(l => l.location_name && l.location_name.includes('Geelong'));
        console.log("Found Location Data:", JSON.stringify(geelong || "Not found in top results", null, 2));
    } else {
        console.log("Could not fetch locations list.");
    }
}

findLocation();
