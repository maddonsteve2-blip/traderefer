
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = "postgresql://neondb_owner:npg_qsxKWSvGyk65@ep-steep-violet-aikad8l7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function importData() {
    const dataPath = path.join(__dirname, 'scraped_geelong_ss_trades.json');
    if (!fs.existsSync(dataPath)) {
        console.error("Data file not found at", dataPath);
        return;
    }

    const businesses = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log(`Found ${businesses.length} businesses to import.`);

    const client = new Client({
        connectionString: DATABASE_URL,
    });

    try {
        await client.connect();
        console.log("Connected to database.");

        for (const biz of businesses) {
            const slug = (biz.name || "").toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const category = biz.category_slug || "other";
            const suburb = (biz.suburb || "").split(',')[0].trim();
            const state = "VIC";
            const city = "Geelong";

            // Map trust_score from rating text (e.g., "5.0")
            let trustScore = 0;
            if (biz.rating) {
                const ratingNum = parseFloat(biz.rating);
                if (!isNaN(ratingNum)) {
                    trustScore = Math.round(ratingNum * 20); // 5.0 -> 100
                }
            }

            try {
                // Upsert based on URL to avoid duplicates
                await client.query(`
                    INSERT INTO businesses (
                        business_name, slug, trade_category, suburb, city, state, 
                        is_verified, status, trust_score, listing_visibility, data_source, source_url
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                    ON CONFLICT (source_url) DO UPDATE SET
                        business_name = EXCLUDED.business_name,
                        trade_category = EXCLUDED.trade_category,
                        suburb = EXCLUDED.suburb,
                        trust_score = EXCLUDED.trust_score
                `, [
                    biz.name,
                    slug,
                    category,
                    suburb,
                    city,
                    state,
                    true, // Defaulting to verified for now as SS listings usually are
                    'active',
                    trustScore,
                    'public',
                    'ServiceSeeking',
                    biz.url
                ]);
                console.log(`Imported: ${biz.name}`);
            } catch (err) {
                console.error(`Failed to import ${biz.name}:`, err.message);
            }
        }

        console.log("Import complete.");
    } catch (err) {
        console.error("Connection error:", err);
    } finally {
        await client.end();
    }
}

importData();
