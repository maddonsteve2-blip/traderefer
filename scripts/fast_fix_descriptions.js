/**
 * FAST FIX REVIEW DESCRIPTIONS
 * 
 * Uses batch SQL to quickly replace review-based descriptions.
 * Generates descriptions in JS, then does a single bulk update.
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
    console.log('=== Fast Fix Review Descriptions ===\n');

    const result = await pool.query(`
        SELECT id, business_name, trade_category, suburb, state, avg_rating, total_reviews
        FROM businesses
        WHERE status = 'active'
          AND description IS NOT NULL AND description != ''
          AND (
            description ~* '\\m(I |we |my |our |us |me )'
            OR description ~* '(highly recommend|would recommend|can only recommend|recommend (him|her|them|this))'
            OR description ~* '(did a (great|fantastic|wonderful|amazing|excellent) job)'
            OR description ~* '(very (happy|pleased|satisfied) with)'
            OR description ~* '(thank(s| you))'
            OR description ~* '(hired|called|contacted) (him|her|them)'
            OR description ~* '\\m(he |she )(did|was|came|arrived|has|completed|finished)'
            OR description ~* '(will (definitely |certainly )?use (again|them))'
            OR description ~* '(great (job|work|service|experience))'
            OR description ~* '(couldn.t (be happier|ask for|fault))'
            OR description ~* '(above and beyond)'
            OR description ~* '(top (bloke|guy|man|notch))'
          )
    `);

    console.log(`Found ${result.rows.length} review-like descriptions to fix`);

    // Build all updates, then execute in batches of 500
    const BATCH = 500;
    let fixed = 0;

    for (let i = 0; i < result.rows.length; i += BATCH) {
        const batch = result.rows.slice(i, i + BATCH);
        
        // Build a single UPDATE with CASE statement
        const ids = [];
        const cases = [];
        let paramIdx = 1;
        const params = [];

        for (const biz of batch) {
            const desc = generateDescription(biz);
            ids.push(biz.id);
            cases.push(`WHEN id = $${paramIdx} THEN $${paramIdx + 1}`);
            params.push(biz.id, desc);
            paramIdx += 2;
        }

        // Add the ids array for the WHERE clause
        const idPlaceholders = ids.map((_, idx) => `$${idx * 2 + 1}`).join(',');
        
        const sql = `
            UPDATE businesses 
            SET description = CASE ${cases.join(' ')} END,
                updated_at = now()
            WHERE id IN (${idPlaceholders})
        `;

        await pool.query(sql, params);
        fixed += batch.length;
        console.log(`  Updated ${fixed}/${result.rows.length}`);
    }

    console.log(`\n✅ Fixed ${fixed} descriptions`);

    // Show samples
    const samples = await pool.query(`
        SELECT business_name, suburb, state, LEFT(description, 150) as d
        FROM businesses WHERE status = 'active' ORDER BY updated_at DESC LIMIT 5
    `);
    console.log('\nSamples:');
    for (const s of samples.rows) {
        console.log(`  ${s.business_name} | ${s.suburb}: "${s.d}..."`);
    }

    await pool.end();
}

fix().catch(e => { console.error('FATAL:', e); process.exit(1); });
