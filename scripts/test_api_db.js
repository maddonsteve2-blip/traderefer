/**
 * QUICK TEST FOR GOOGLE PLACES API
 * Tests just one suburb/trade combo to verify API key and DB connection work
 */

const pg = require('pg');
require('dotenv').config({ path: 'apps/web/.env.local' });

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

console.log('=== Google Places API Test ===');
console.log('API Key:', GOOGLE_API_KEY ? 'Present' : 'Missing');
console.log('DB URL:', DATABASE_URL ? 'Present' : 'Missing');

async function testAPI() {
    console.log('\n--- Testing Google Places API ---');
    try {
        const res = await fetch(`https://places.googleapis.com/v1/places:searchText`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_API_KEY,
                'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.websiteUri,places.internationalPhoneNumber'
            },
            body: JSON.stringify({ 
                textQuery: 'electrician in Sydney NSW', 
                maxResultCount: 1, 
                languageCode: 'en', 
                regionCode: 'AU' 
            }),
        });

        if (!res.ok) {
            const err = await res.text();
            console.error('❌ API Error:', res.status, err.substring(0, 200));
            return false;
        }
        
        const data = await res.json();
        console.log('✅ API Success! Found', data.places?.length || 0, 'places');
        if (data.places?.length > 0) {
            console.log('   Example:', data.places[0].displayName?.text);
        }
        return true;
    } catch (error) {
        console.error('❌ API Exception:', error.message);
        return false;
    }
}

async function testDB() {
    console.log('\n--- Testing Database Connection ---');
    const db = new pg.Client(DATABASE_URL);
    try {
        await db.connect();
        const result = await db.query('SELECT COUNT(*) as count FROM businesses LIMIT 1');
        console.log('✅ DB Success! Connected, businesses count:', result.rows[0].count);
        await db.end();
        return true;
    } catch (error) {
        console.error('❌ DB Error:', error.message);
        return false;
    }
}

async function main() {
    const apiOk = await testAPI();
    const dbOk = await testDB();
    
    console.log('\n=== Results ===');
    console.log('API Status:', apiOk ? '✅ Working' : '❌ Failed');
    console.log('DB Status:', dbOk ? '✅ Working' : '❌ Failed');
    
    if (apiOk && dbOk) {
        console.log('\n🎉 All systems ready! The fill script should work.');
    } else {
        console.log('\n⚠️  Fix the issues above before running the fill script.');
    }
}

main().catch(console.error);
