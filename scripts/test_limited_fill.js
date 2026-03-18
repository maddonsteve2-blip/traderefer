/**
 * LIMITED FILL TEST - Runs just 3 suburb/trade combos and exits
 * Based on fill_google_places.js but with strict limits
 */

const pg = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: 'apps/web/.env.local' });

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

// Test just 3 combos
const TEST_COMBOS = [
    { state: 'ACT', suburb: 'Canberra', trade: 'Electrician' },
    { state: 'ACT', suburb: 'Canberra', trade: 'Plumbing' },
    { state: 'ACT', suburb: 'Canberra', trade: 'Carpentry' }
];

const LOGOS_DIR = path.join(__dirname, '..', 'logos-cache');
if (!fs.existsSync(LOGOS_DIR)) fs.mkdirSync(LOGOS_DIR, { recursive: true });

async function searchPlaces(query, maxResults = 3) {
    const res = await fetch(`https://places.googleapis.com/v1/places:searchText`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_API_KEY,
            'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.websiteUri,places.internationalPhoneNumber,places.photos'
        },
        body: JSON.stringify({ textQuery: query, maxResultCount: maxResults, languageCode: 'en', regionCode: 'AU' }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Google API ${res.status}: ${err.substring(0, 200)}`);
    }
    const data = await res.json();
    return data.places || [];
}

async function insertBusiness(db, place, state, suburb, trade) {
    const business = {
        business_name: place.displayName?.text || 'Unknown',
        slug: place.displayName?.text?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '-' + Math.random().toString(36).substr(2, 5),
        address: place.formattedAddress || '',
        phone: place.internationalPhoneNumber || '',
        website: place.websiteUri || '',
        avg_rating: place.rating || 0,
        total_reviews: place.userRatingCount || 0,
        trade_category: trade,
        suburb: suburb,
        city: suburb,
        state: state,
        status: 'active',
        listing_visibility: 'public',
        is_verified: true,
        source: 'google_places_test'
    };

    await db.query(`
        INSERT INTO businesses (
            business_name, slug, address, phone, website, avg_rating, total_reviews,
            trade_category, suburb, city, state, status, listing_visibility, is_verified, source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (business_name, suburb, state) DO NOTHING
    `, [
        business.business_name, business.slug, business.address, business.phone, business.website,
        business.avg_rating, business.total_reviews, business.trade_category, business.suburb,
        business.city, business.state, business.status, business.listing_visibility,
        business.is_verified, business.source
    ]);

    return business;
}

async function main() {
    console.log('=== LIMITED FILL TEST ===');
    console.log('Testing', TEST_COMBOS.length, 'suburb/trade combos\n');

    const db = new pg.Client(DATABASE_URL);
    await db.connect();

    let totalAdded = 0;
    let totalApiCalls = 0;

    for (const combo of TEST_COMBOS) {
        console.log(`--- ${combo.suburb} ${combo.trade} ---`);
        
        try {
            const query = `${combo.trade} in ${combo.suburb} ${combo.state}`;
            const places = await searchPlaces(query);
            totalApiCalls++;
            
            console.log(`  Found ${places.length} places`);
            
            for (const place of places) {
                try {
                    await insertBusiness(db, place, combo.state, combo.suburb, combo.trade);
                    totalAdded++;
                    console.log(`  ✅ Added: ${place.displayName?.text}`);
                } catch (err) {
                    console.log(`  ⚠️  Skipped (likely exists): ${place.displayName?.text}`);
                }
            }
            
            // Small delay between API calls
            await new Promise(resolve => setTimeout(resolve, 500));
            
        } catch (error) {
            console.error(`  ❌ Error: ${error.message}`);
        }
        
        console.log('');
    }

    await db.end();

    console.log('=== TEST COMPLETE ===');
    console.log(`API calls made: ${totalApiCalls}`);
    console.log(`Businesses added: ${totalAdded}`);
    console.log('\n✅ If this worked, the main fill script should work too!');
}

main().catch(console.error);
