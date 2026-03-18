/**
 * DIRECT TEST - Test the exact INSERT statement from fill_google_places.js
 */

const pg = require('pg');
require('dotenv').config({ path: 'apps/web/.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

async function testInsert() {
    console.log('=== Testing Exact INSERT Statement ===');
    
    const db = new pg.Client(DATABASE_URL);
    await db.connect();
    
    try {
        // Test with minimal data first
        const result = await db.query(`
            INSERT INTO businesses (
                business_name, slug, trade_category, suburb, city, state, business_phone,
                avg_rating, total_reviews, source_url, data_source,
                logo_url, address, website, trust_score,
                is_verified, status, listing_visibility, is_claimed, claim_status,
                lat, lng, description, opening_hours, payment_options,
                services, google_maps_url, photo_urls, cover_photo_url
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29)
            ON CONFLICT (source_url) DO UPDATE SET
                avg_rating = EXCLUDED.avg_rating,
                total_reviews = EXCLUDED.total_reviews,
                logo_url = COALESCE(EXCLUDED.logo_url, businesses.logo_url),
                lat = COALESCE(EXCLUDED.lat, businesses.lat),
                lng = COALESCE(EXCLUDED.lng, businesses.lng),
                description = COALESCE(EXCLUDED.description, businesses.description),
                opening_hours = COALESCE(EXCLUDED.opening_hours, businesses.opening_hours),
                payment_options = CASE WHEN EXCLUDED.payment_options != '{}' THEN EXCLUDED.payment_options ELSE businesses.payment_options END,
                services = COALESCE(EXCLUDED.services, businesses.services),
                google_maps_url = COALESCE(EXCLUDED.google_maps_url, businesses.google_maps_url),
                photo_urls = CASE WHEN array_length(EXCLUDED.photo_urls, 1) > 0 THEN EXCLUDED.photo_urls ELSE businesses.photo_urls END,
                cover_photo_url = COALESCE(EXCLUDED.cover_photo_url, businesses.cover_photo_url),
                business_phone = COALESCE(EXCLUDED.business_phone, businesses.business_phone),
                updated_at = now()
            RETURNING id
        `, [
            'Test Business', 'test-business-123', 'Plumbing',
            'Test Suburb', 'Test City', 'ACT', '+61 2 1234 5678',
            4.5, 10, 'https://test.com', 'Google Places',
            'https://logo.url', '123 Test St', 'https://website.com', 80,
            true, 'active', 'public', false, 'unclaimed',
            -35.2809, 149.1300,
            'Test description',
            '{"monday": "9-5"}',
            '{cash,card}',
            '{plumbing}',
            'https://maps.google.com',
            '{photo1.jpg}',
            'https://cover.photo'
        ]);
        
        console.log('✅ INSERT SUCCESS! ID:', result.rows[0].id);
        
        // Clean up
        await db.query('DELETE FROM businesses WHERE slug = $1', ['test-business-123']);
        console.log('✅ Cleaned up test record');
        
    } catch (error) {
        console.error('❌ INSERT FAILED:', error.message);
        console.error('Full error:', error);
    }
    
    await db.end();
}

testInsert().catch(console.error);
