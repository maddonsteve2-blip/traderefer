
const https = require('https');

const username = "stevejford1@gmail.com";
const password = "9e95e192163e7cd0";
const auth = "Basic " + Buffer.from(username + ":" + password).toString('base64');

const postData = JSON.stringify([
    {
        "categories": ["plumber"],
        "filters": [
            ["address_info.city", "=", "Belmont"],
            "and",
            ["rating.value", ">", 4.0]
        ],
        "order_by": ["rating.value,desc"],
        "limit": 5
    }
]);

const options = {
    hostname: 'api.dataforseo.com',
    path: '/v3/business_data/business_listings/search/live',
    method: 'POST',
    headers: {
        'Authorization': auth,
        'Content-Type': 'application/json'
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            console.log(JSON.stringify(parsed, null, 2));
        } catch (e) {
            console.error("Failed to parse response:", data);
        }
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(postData);
req.end();
