const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../apps/api/.env.local') });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w-]+/g, '')  // Remove all non-word chars
        .replace(/--+/g, '-');    // Replace multiple - with single -
}

async function importData() {
    await client.connect();
    console.log('Connected to database');

    const localPath = path.join(__dirname, 'scraped_businesses.json');
    const rootPath = path.join(__dirname, '../scraped_businesses.json');
    const jsonPath = fs.existsSync(localPath) ? localPath : rootPath;

    if (!fs.existsSync(jsonPath)) {
        console.error('File not found: scraped_businesses.json at ' + localPath + ' or ' + rootPath);
        await client.end();
        return;
    }

    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`Found ${data.length} businesses to import`);

    let imported = 0;
    let skipped = 0;

    for (const biz of data) {
        try {
            // Extract suburb from address (very basic extraction)
            // Assuming address format like "123 Street, Suburb Name VIC 3216"
            const suburbMatch = biz.address.match(/,\s*([^,]+)\s+VIC/i);
            const suburb = suburbMatch ? suburbMatch[1].trim() : 'Geelong';

            const slugBase = slugify(`${biz.name}-${suburb}`);
            let slug = slugBase;

            // Basic duplicate check by external_id
            const existing = await client.query('SELECT id FROM businesses WHERE external_id = $1', [biz.google_id]);

            if (existing.rows.length > 0) {
                skipped++;
                continue;
            }

            // Final mapping
            const query = `
        INSERT INTO businesses (
          business_name, slug, trade_category, suburb, 
          business_phone, website, trust_score, 
          external_id, data_source, is_claimed, claim_status,
          business_email, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (slug) DO NOTHING
      `;

            const values = [
                biz.name,
                slug,
                biz.category || 'Trade',
                suburb,
                biz.phone || 'Contact via Referral',
                biz.website || null,
                Math.round((biz.rating || 4.0) * 20), // Map 5 star to 100 score
                biz.google_id,
                'google_maps',
                false,
                'unclaimed',
                'contact@traderefer.au', // Placeholder
                'active'
            ];

            await client.query(query, values);
            imported++;

            if (imported % 10 === 0) console.log(`Progress: ${imported} imported...`);
        } catch (err) {
            console.error(`Failed to import ${biz.name}:`, err.message);
        }
    }

    console.log(`--- Finished ---`);
    console.log(`Imported: ${imported}`);
    console.log(`Skipped (existing): ${skipped}`);

    await client.end();
}

importData();
