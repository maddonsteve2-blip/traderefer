/**
 * FIX DESCRIPTIONS V2
 * 
 * More aggressive detection of review-based descriptions.
 * 1. Match descriptions against business_reviews table directly
 * 2. Broader review-language patterns
 * 3. Replace with proper generated descriptions
 */

const { Pool } = require('pg');
require('dotenv').config({ path: 'apps/web/.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });

function generateDescription(biz) {
    const name = biz.business_name;
    const trade = (biz.trade_category || '').toLowerCase();
    const suburb = biz.suburb || '';
    const state = biz.state || '';
    const rating = biz.avg_rating ? parseFloat(biz.avg_rating) : 0;
    const reviews = biz.total_reviews ? parseInt(biz.total_reviews) : 0;
    const location = [suburb, state].filter(Boolean).join(', ');

    const tradeServices = {
        plumbing: 'plumbing services including repairs, installations, and emergency callouts',
        electrical: 'electrical services including wiring, switchboard upgrades, and safety inspections',
        carpentry: 'carpentry and joinery for residential and commercial projects',
        landscaping: 'landscaping, garden design, and outdoor living solutions',
        roofing: 'roof repairs, restorations, and new roof installations',
        painting: 'interior and exterior painting for homes and commercial properties',
        cleaning: 'professional cleaning services for residential and commercial properties',
        building: 'building and construction for new homes, renovations, and extensions',
        concreting: 'concreting for driveways, paths, slabs, and decorative finishes',
        tiling: 'wall and floor tiling for bathrooms, kitchens, and outdoor areas',
        plastering: 'plastering, rendering, and wall finishing services',
        fencing: 'fence installation, repairs, and custom fencing solutions',
        'air conditioning': 'air conditioning installation, servicing, and repairs',
        'bathroom renovation': 'complete bathroom renovations and remodelling',
        'kitchen renovation': 'kitchen renovations, custom cabinetry, and fit-outs',
        demolition: 'demolition services for residential and commercial sites',
        earthmoving: 'earthmoving, excavation, and site preparation',
        flooring: 'flooring installation including timber, vinyl, and carpet',
        'garage doors': 'garage door installation, repairs, and automation',
        'glazing & windows': 'glass replacement, window repairs, and glazing services',
        guttering: 'gutter installation, cleaning, and leaf guard fitting',
        'pest control': 'pest control and termite inspection services',
        'pool & spa': 'pool and spa construction, maintenance, and repairs',
        scaffolding: 'scaffolding hire and erection for construction projects',
        'solar energy': 'solar panel installation and energy solutions',
        'tree services': 'tree lopping, removal, and stump grinding',
        waterproofing: 'waterproofing for bathrooms, balconies, and foundations',
        locksmith: 'locksmith services for homes, businesses, and automotive',
        bricklayer: 'bricklaying for new builds, extensions, and repairs',
        handyman: 'general handyman services for home maintenance and repairs',
        insulation: 'insulation installation for ceilings, walls, and underfloor',
    };

    const services = tradeServices[trade] || `professional ${trade} services`;

    if (rating >= 4.5 && reviews >= 10) {
        return `${name} is a top-rated ${trade} business serving ${location}. With a ${rating}-star rating from ${reviews} reviews, they are one of the most trusted ${trade} providers in the area. Specialising in ${services}, ${name} delivers quality workmanship and reliable service. Contact them today for a free quote.`;
    } else if (rating >= 4.0 && reviews >= 5) {
        return `${name} provides expert ${services} in ${location}. Rated ${rating} stars by ${reviews} customers, they are known for quality work and professional service. Get in touch with ${name} for a free, no-obligation quote.`;
    } else if (reviews > 0) {
        return `${name} offers ${services} in ${location}. With ${reviews} customer review${reviews > 1 ? 's' : ''} and a focus on quality workmanship, they serve homes and businesses across the ${suburb} area. Contact ${name} for a free quote.`;
    } else {
        return `${name} is a ${trade} specialist serving ${location} and surrounding areas. They offer ${services} for residential and commercial clients. Reach out to ${name} for a free, no-obligation quote.`;
    }
}

async function fix() {
    console.log('=== Fix Descriptions V2 (Aggressive) ===\n');

    // Step 1: Find descriptions that exactly match or overlap with reviews
    console.log('Step 1: Finding descriptions that match reviews in DB...');
    const reviewMatches = await pool.query(`
        SELECT DISTINCT b.id
        FROM businesses b
        JOIN business_reviews r ON r.business_id = b.id
        WHERE b.status = 'active'
          AND b.description IS NOT NULL AND b.description != ''
          AND (
            b.description = r.review_text
            OR LEFT(b.description, 100) = LEFT(r.review_text, 100)
            OR b.description LIKE LEFT(r.review_text, 50) || '%'
          )
    `);
    console.log(`  Found ${reviewMatches.rows.length} matching review entries`);

    // Step 2: Find descriptions with broader review-like language
    console.log('Step 2: Finding review-like descriptions with broad patterns...');
    const patternMatches = await pool.query(`
        SELECT id
        FROM businesses
        WHERE status = 'active'
          AND description IS NOT NULL AND description != ''
          AND (
            -- First/second person
            description ~* '\\m(I |we |my |our |us |me |I''m |I''ve |we''re |we''ve )'
            -- Recommendation language
            OR description ~* '(recommend|highly recomend|reccomend)'
            -- Customer experience language
            OR description ~* '(great job|amazing job|fantastic job|excellent job|wonderful job|brilliant job|awesome job|stellar job|superb job)'
            OR description ~* '(great work|amazing work|fantastic work|excellent work|wonderful work|brilliant work)'
            OR description ~* '(great service|amazing service|fantastic service|excellent service|wonderful service|brilliant service)'
            OR description ~* '(very (happy|pleased|satisfied|impressed) with)'
            OR description ~* '(couldn.t (be happier|ask for|fault|recommend))'
            OR description ~* '(thank(s| you)|cheers)'
            OR description ~* '(above and beyond|went the extra mile|second to none)'
            OR description ~* '(top (bloke|guy|man|notch|quality|job))'
            -- Hiring/using language
            OR description ~* '(hired|engaged|called|contacted|got .+ from) (him|her|them|this)'
            OR description ~* '(will (definitely |certainly |100% )?use (again|them|him|her))'
            OR description ~* '(used .+ (for|to) )'
            OR description ~* '(had .+ (come|install|fix|repair|replace|paint|clean|build|do ))'
            -- Third person review style
            OR description ~* '\\m(he |she |they )(did|was|were|came|arrived|has|have|completed|finished|installed|fixed|repaired)'
            OR description ~* '(the (team|crew|guys|boys|lads) (did|were|came|arrived))'
            -- Review-specific phrases
            OR description ~* '(unbeatable price|no hassle|no fuss|bang for|value for money|worth every|couldn.t be)'
            OR description ~* '(courteous and|professional and friendly|friendly and professional|prompt and|reliable and)'
            OR description ~* '(fixed promptly|done quickly|finished on time|completed on time|arrived on time|turned up on time)'
            OR description ~* '(five star|5 star|10/10|10 out of 10)'
            -- Got/Bought something
            OR description ~* '^(Got |Bought |Had |Used |Called |Hired |Engaged )'
            OR description ~* '(small issue|only (complaint|issue|problem|negative))'
          )
          -- Exclude ones already properly generated
          AND description NOT LIKE '%specialist serving%'
          AND description NOT LIKE '%top-rated%'
          AND description NOT LIKE '%provides expert%'
          AND description NOT LIKE '%offers %services in%'
    `);
    console.log(`  Found ${patternMatches.rows.length} pattern matches`);

    // Combine all IDs
    const allIds = new Set([
        ...reviewMatches.rows.map(r => r.id),
        ...patternMatches.rows.map(r => r.id),
    ]);
    console.log(`\nTotal unique businesses to fix: ${allIds.size}`);

    if (allIds.size === 0) {
        console.log('Nothing to fix!');
        await pool.end();
        return;
    }

    // Fetch full data for these businesses
    const idArray = Array.from(allIds);
    const businesses = await pool.query(`
        SELECT id, business_name, trade_category, suburb, state, avg_rating, total_reviews
        FROM businesses WHERE id = ANY($1)
    `, [idArray]);

    // Batch update
    const BATCH = 500;
    let fixed = 0;

    for (let i = 0; i < businesses.rows.length; i += BATCH) {
        const batch = businesses.rows.slice(i, i + BATCH);
        const cases = [];
        const params = [];
        let paramIdx = 1;

        for (const biz of batch) {
            const desc = generateDescription(biz);
            cases.push(`WHEN id = $${paramIdx} THEN $${paramIdx + 1}`);
            params.push(biz.id, desc);
            paramIdx += 2;
        }

        const idPlaceholders = batch.map((_, idx) => `$${idx * 2 + 1}`).join(',');
        await pool.query(`
            UPDATE businesses
            SET description = CASE ${cases.join(' ')} END, updated_at = now()
            WHERE id IN (${idPlaceholders})
        `, params);

        fixed += batch.length;
        console.log(`  Updated ${fixed}/${businesses.rows.length}`);
    }

    console.log(`\n✅ Fixed ${fixed} descriptions`);

    // Verify: how many review-like descriptions remain?
    const remaining = await pool.query(`
        SELECT COUNT(*) as cnt FROM businesses
        WHERE status = 'active' AND description IS NOT NULL
          AND description ~* '\\m(I |we |my |our )'
          AND description NOT LIKE '%specialist serving%'
          AND description NOT LIKE '%top-rated%'
          AND description NOT LIKE '%provides expert%'
    `);
    console.log(`Remaining review-like descriptions: ${remaining.rows[0].cnt}`);

    await pool.end();
}

fix().catch(e => { console.error('FATAL:', e); process.exit(1); });
