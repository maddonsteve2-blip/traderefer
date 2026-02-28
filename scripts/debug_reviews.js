
const https = require('https');

const username = "stevejford1@gmail.com";
const password = "9e95e192163e7cd0";
const auth = "Basic " + Buffer.from(username + ":" + password).toString('base64');

// Testing with a known high-review business from Geelong
const postData = JSON.stringify([
    {
        "place_id": "ChIJKRziUhYV1GoRaHexCDrV0u8", // Jack Heathcote Plumbing
        "limit": 3
    }
]);

const options = {
    hostname: 'api.dataforseo.com',
    path: '/v3/business_data/google/reviews/live',
    method: 'POST',
    headers: {
        'Authorization': auth,
        'Content-Type': 'application/json'
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => console.log(JSON.stringify(JSON.parse(data), null, 2)));
});

req.write(postData);
req.end();
