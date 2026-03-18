/**
 * GENERATE DESCRIPTIONS
 * 
 * For businesses missing descriptions, generates them from existing DB data.
 * No API calls needed — uses business_name, trade_category, suburb, state, rating, reviews.
 * 
 * Also attempts to backfill photos for CID-URL businesses via text search.
 * 
 * Usage:
 *   node scripts/generate_descriptions.js [--state NSW] [--limit 5000] [--with-photos]
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'apps', 'web', '.env.local') });

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

const CONCURRENT = 50;
const MAX_PHOTOS = 10;

const args = process.argv.slice(2);
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) : null;
const stateIdx = args.indexOf('--state');
const STATE_FILTER = stateIdx !== -1 ? args[stateIdx + 1] : null;
const WITH_PHOTOS = args.includes('--with-photos');

const stats = { processed: 0, descGenerated: 0, photosUpdated: 0, photosAdded: 0, errors: 0, startTime: 0 };

function photoUrl(photoName, maxWidth = 800) {
    return `https://places.googleapis.com/v1/${photoName}/media?key=${GOOGLE_API_KEY}&maxWidthPx=${maxWidth}&maxHeightPx=${maxWidth}`;
}

function parsePhotoUrls(photoUrls) {
    if (!photoUrls) return [];
    if (Array.isArray(photoUrls)) return photoUrls.filter(Boolean);
    if (typeof photoUrls === 'string') {
        return photoUrls.replace(/[{}]/g, '').split(',').filter(u => u && u.length > 5);
    }
    return [];
}

function generateDescription(biz) {
    const name = biz.business_name || 'This business';
    const trade = (biz.trade_category || '').toLowerCase();
    const suburb = biz.suburb || biz.city || '';
    const state = biz.state || '';
    const rating = biz.avg_rating ? parseFloat(biz.avg_rating) : null;
    const reviews = biz.total_reviews ? parseInt(biz.total_reviews) : 0;
    const phone = biz.business_phone || '';
    const website = biz.website || '';

    // Build natural-sounding description
    let parts = [];

    // Opening line with rating
    if (rating && rating >= 4.0) {
        parts.push(`${name} is a highly rated ${trade} business`);
    } else if (rating) {
        parts.push(`${name} is a professional ${trade} business`);
    } else {
        parts.push(`${name} is a trusted ${trade} business`);
    }

    // Location
    if (suburb && state) {
        parts[0] += ` serving ${suburb} and surrounding areas in ${state}`;
    } else if (suburb) {
        parts[0] += ` based in ${suburb}`;
    } else if (state) {
        parts[0] += ` operating in ${state}`;
    }
    parts[0] += '.';

    // Rating + reviews
    if (rating && reviews > 0) {
        if (rating >= 4.5) {
            parts.push(`With an outstanding ${rating}-star rating from ${reviews} customer reviews, they are one of the top-rated ${trade} providers in the area.`);
        } else if (rating >= 4.0) {
            parts.push(`They hold a strong ${rating}-star rating based on ${reviews} customer reviews.`);
        } else if (rating >= 3.0) {
            parts.push(`Rated ${rating} stars from ${reviews} reviews.`);
        }
    } else if (rating && rating >= 4.0) {
        parts.push(`They have earned a ${rating}-star rating for their quality work.`);
    }

    // Contact info
    const contactParts = [];
    if (phone) contactParts.push(`call ${phone}`);
    if (website) contactParts.push('visit their website');
    if (contactParts.length > 0) {
        parts.push(`Contact ${name} today — ${contactParts.join(' or ')} for a free quote.`);
    }

    return parts.join(' ');
}

// Text search for photos (for CID businesses)
async function searchForPhotos(businessName, suburb, state) {
    try {
        const query = `${businessName} ${suburb || ''} ${state || ''}`.trim();
        const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_API_KEY,
                'X-Goog-FieldMask': 'places.photos',
            },
            body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.places?.[0]?.photos || null;
    } catch {
        return null;
    }
}

async function processBatch(pool, businesses) {
    await Promise.all(businesses.map(async (biz) => {
        try {
            const updates = [];
            const params = [];
            let paramIdx = 1;

            // Generate description if missing
            if (!biz.description) {
                const desc = generateDescription(biz);
                if (desc) {
                    updates.push(`description = $${paramIdx++}`);
                    params.push(desc);
                    stats.descGenerated++;
                }
            }

            // Try to get photos via text search if requested and needed
            if (WITH_PHOTOS) {
                const existingUrls = parsePhotoUrls(biz.photo_urls);
                if (existingUrls.length < 6) {
                    const photos = await searchForPhotos(biz.business_name, biz.suburb, biz.state);
                    if (photos && photos.length > 0) {
                        const newUrls = photos.slice(0, MAX_PHOTOS).map(p => photoUrl(p.name)).filter(Boolean);
                        if (newUrls.length > existingUrls.length) {
                            const blobUrls = existingUrls.filter(u => u.includes('blob.vercel-storage.com'));
                            const allUrls = [...blobUrls];
                            for (const url of newUrls) {
                                if (!allUrls.some(e => e === url)) allUrls.push(url);
                            }
                            const finalUrls = allUrls.slice(0, MAX_PHOTOS);
                            updates.push(`photo_urls = $${paramIdx++}`);
                            params.push(`{${finalUrls.join(',')}}`);
                            updates.push(`logo_url = COALESCE(NULLIF($${paramIdx++}, ''), logo_url)`);
                            params.push(finalUrls[0]);
                            updates.push(`cover_photo_url = COALESCE(NULLIF($${paramIdx++}, ''), cover_photo_url)`);
                            params.push(finalUrls.length > 1 ? finalUrls[1] : finalUrls[0]);
                            stats.photosUpdated++;
                            stats.photosAdded += finalUrls.length - existingUrls.length;
                        }
                    }
                }
            }

            if (updates.length === 0) {
                stats.processed++;
                return;
            }

            updates.push(`updated_at = now()`);
            params.push(biz.id);
            await pool.query(
                `UPDATE businesses SET ${updates.join(', ')} WHERE id = $${paramIdx}`,
                params
            );
            stats.processed++;
        } catch (error) {
            stats.errors++;
            stats.processed++;
        }
    }));
}

async function run() {
    console.log('=== Generate Descriptions' + (WITH_PHOTOS ? ' + Photo Backfill' : '') + ' ===');
    console.log(`State: ${STATE_FILTER || 'ALL'} | Limit: ${LIMIT || 'ALL'}\n`);

    const pool = new Pool({ connectionString: DATABASE_URL, max: 20 });

    const conditions = ["status = 'active'"];
    
    const needConditions = ["description IS NULL"];
    if (WITH_PHOTOS) {
        needConditions.push("(photo_urls IS NULL OR photo_urls::text = '{}' OR array_length(string_to_array(trim(both '{}' from photo_urls::text), ','), 1) < 6)");
    }
    conditions.push(`(${needConditions.join(' OR ')})`);
    
    if (STATE_FILTER) conditions.push(`state = '${STATE_FILTER}'`);

    const where = conditions.join(' AND ');
    const limitSql = LIMIT ? `LIMIT ${LIMIT}` : '';

    const result = await pool.query(`
        SELECT id, business_name, trade_category, suburb, city, state,
               avg_rating, total_reviews, business_phone, website,
               description, photo_urls, logo_url, cover_photo_url
        FROM businesses
        WHERE ${where}
        ORDER BY created_at DESC
        ${limitSql}
    `);

    const businesses = result.rows;
    console.log(`Found ${businesses.length} businesses to process\n`);

    if (businesses.length === 0) {
        console.log('Nothing to do!');
        await pool.end();
        return;
    }

    stats.startTime = Date.now();

    for (let i = 0; i < businesses.length; i += CONCURRENT) {
        const batch = businesses.slice(i, i + CONCURRENT);
        await processBatch(pool, batch);

        const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(0);
        const rate = elapsed > 0 ? (stats.processed / (elapsed / 60)).toFixed(0) : 0;
        console.log(`Progress: ${stats.processed}/${businesses.length} | Desc: ${stats.descGenerated} | Photos: ${stats.photosUpdated} (+${stats.photosAdded}) | Err: ${stats.errors} | ${rate}/min`);
    }

    await pool.end();
    const totalTime = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(1);
    console.log(`\n========== COMPLETE ==========`);
    console.log(`Time: ${totalTime} minutes`);
    console.log(`Descriptions generated: ${stats.descGenerated} | Photos: ${stats.photosUpdated} (+${stats.photosAdded}) | Errors: ${stats.errors}`);
}

run().catch(e => { console.error('FATAL:', e); process.exit(1); });
