/**
 * TEST WITH NEW SUBURB/TRADE - Tests a combination that definitely doesn't exist
 */

const pg = require('pg');
require('dotenv').config({ path: 'apps/web/.env.local' });

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

async function testNewCombo() {
    console.log('=== Testing NEW suburb/trade combo ===');
    
    // Test a remote suburb with a trade that likely doesn't exist
    const testCombo = {
        state: 'WA', 
        suburb: 'Kununurra', 
        trade: 'Solar Installation'
    };
    
    console.log(`Testing: ${testCombo.trade} in ${testCombo.suburb}, ${testCombo.state}`);
    
    // First check if any exist
    const db = new pg.Client(DATABASE_URL);
    await db.connect();
    
    const existing = await db.query(
        'SELECT COUNT(*) as count FROM businesses WHERE suburb = $1 AND trade_category = $2',
        [testCombo.suburb, testCombo.trade]
    );
    
    console.log(`Existing businesses: ${existing.rows[0].count}`);
    
    // Test API call
    try {
        const res = await fetch(`https://places.googleapis.com/v1/places:searchText`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_API_KEY,
                'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.websiteUri,places.internationalPhoneNumber'
            },
            body: JSON.stringify({ 
                textQuery: `${testCombo.trade} in ${testCombo.suburb} ${testCombo.state}`, 
                maxResultCount: 3, 
                languageCode: 'en', 
                regionCode: 'AU' 
            }),
        });

        if (!res.ok) {
            const err = await res.text();
            console.error('❌ API Error:', res.status, err.substring(0, 200));
            await db.end();
            return;
        }
        
        const data = await res.json();
        console.log(`✅ API found ${data.places?.length || 0} places`);
        
        if (data.places && data.places.length > 0) {
            // Try to add one
            const place = data.places[0];
            const business = {
                business_name: place.displayName?.text || 'Unknown',
                slug: place.displayName?.text?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '-' + Math.random().toString(36).substr(2, 5),
                address: place.formattedAddress || '',
                business_phone: place.internationalPhoneNumber || '',
                website: place.websiteUri || '',
                avg_rating: place.rating || 0,
                total_reviews: place.userRatingCount || 0,
                trade_category: testCombo.trade,
                suburb: testCombo.suburb,
                city: testCombo.suburb,
                state: testCombo.state,
                status: 'active',
                listing_visibility: 'public',
                is_verified: true,
                data_source: 'google_places_test',
                source_url: `https://places.googleapis.com/v1/places/${place.name || 'unknown'}` || null
            };

            try {
                await db.query(`
                    INSERT INTO businesses (
                        business_name, slug, address, business_phone, website, avg_rating, total_reviews,
                        trade_category, suburb, city, state, status, listing_visibility, is_verified, data_source, source_url
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                `, [
                    business.business_name, business.slug, business.address, business.business_phone, business.website,
                    business.avg_rating, business.total_reviews, business.trade_category, business.suburb,
                    business.city, business.state, business.status, business.listing_visibility,
                    business.is_verified, business.data_source, business.source_url
                ]);
                
                console.log(`✅ SUCCESS: Added "${business.business_name}" to database`);
                
                // Verify it was added
                const verify = await db.query(
                    'SELECT * FROM businesses WHERE slug = $1',
                    [business.slug]
                );
                console.log(`Verification: Found ${verify.rows.length} record with slug: ${business.slug}`);
                
            } catch (insertErr) {
                console.error('❌ Insert failed:', insertErr.message);
            }
        }
        
    } catch (error) {
        console.error('❌ API Exception:', error.message);
    }
    
    await db.end();
}

testNewCombo().catch(console.error);
