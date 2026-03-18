/**
 * CHECK DESCRIPTIONS
 * 
 * Analyze what types of descriptions are in the database
 */

const { Pool } = require('pg');
require('dotenv').config({ path: 'apps/web/.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
    console.log('=== Description Analysis ===\n');

    // Total counts
    const counts = await pool.query(`
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE description IS NOT NULL AND description != '') as has_desc,
            COUNT(*) FILTER (WHERE description IS NULL OR description = '') as no_desc
        FROM businesses WHERE status = 'active'
    `);
    console.log(`Total: ${counts.rows[0].total} | With desc: ${counts.rows[0].has_desc} | No desc: ${counts.rows[0].no_desc}\n`);

    // Check for review-like descriptions by matching against reviews table
    const reviewMatches = await pool.query(`
        SELECT COUNT(DISTINCT b.id) as matched
        FROM businesses b
        JOIN business_reviews r ON r.business_id = b.id
        WHERE b.status = 'active'
          AND b.description IS NOT NULL
          AND b.description != ''
          AND (
            b.description = r.review_text
            OR b.description LIKE r.review_text || '%'
            OR r.review_text LIKE b.description || '%'
          )
    `);
    console.log(`Descriptions matching a review: ${reviewMatches.rows[0].matched}`);

    // Check for review-like patterns (first/second person)
    const reviewLike = await pool.query(`
        SELECT COUNT(*) as cnt FROM businesses
        WHERE status = 'active'
          AND description IS NOT NULL AND description != ''
          AND (
            description ~* '\\m(I |we |my |our |us )' 
            OR description ~* '(recommend|hired|called him|called her|called them|great job|amazing job|fantastic job|excellent job|wonderful job)'
            OR description ~* '(thank you|thanks |very happy with|very pleased|very satisfied|will use again|will definitely use)'
            OR description ~* '(he (did|was|came|arrived|has)|she (did|was|came|arrived|has)|they (did|were|came|arrived|have))'
          )
    `);
    console.log(`Descriptions with review-like patterns: ${reviewLike.rows[0].cnt}`);

    // Check for generated/generic descriptions
    const generic = await pool.query(`
        SELECT COUNT(*) as cnt FROM businesses
        WHERE status = 'active'
          AND description IS NOT NULL AND description != ''
          AND description ~* '(is a [0-9.]+-star rated|specialist serving|for a free quote today)'
    `);
    console.log(`Generic/generated descriptions: ${generic.rows[0].cnt}`);

    // Sample some review-like descriptions
    const samples = await pool.query(`
        SELECT business_name, suburb, state, trade_category, 
               LEFT(description, 200) as desc_preview
        FROM businesses
        WHERE status = 'active'
          AND description IS NOT NULL AND description != ''
          AND (
            description ~* '\\m(I |we |my |our )' 
            OR description ~* '(recommend|hired|great job|thank you|very happy with|he did|he was|she did)'
          )
        ORDER BY random()
        LIMIT 10
    `);
    console.log(`\n=== Sample Review-Like Descriptions ===`);
    for (const s of samples.rows) {
        console.log(`\n${s.business_name} | ${s.suburb}, ${s.state} | ${s.trade_category}`);
        console.log(`  "${s.desc_preview}..."`);
    }

    // Sample some real/editorial descriptions
    const editorial = await pool.query(`
        SELECT business_name, suburb, state, trade_category,
               LEFT(description, 200) as desc_preview
        FROM businesses
        WHERE status = 'active'
          AND description IS NOT NULL AND description != ''
          AND description !~* '\\m(I |we |my |our )'
          AND description !~* '(recommend|hired|great job|thank you|very happy with|he did|he was|she did|will use again)'
          AND description !~* '(is a [0-9.]+-star rated)'
        ORDER BY random()
        LIMIT 10
    `);
    console.log(`\n=== Sample Real/Editorial Descriptions ===`);
    for (const s of editorial.rows) {
        console.log(`\n${s.business_name} | ${s.suburb}, ${s.state} | ${s.trade_category}`);
        console.log(`  "${s.desc_preview}..."`);
    }

    await pool.end();
}

check().catch(e => { console.error('FATAL:', e); process.exit(1); });
