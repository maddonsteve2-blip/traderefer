/**
 * Batch compute logo background colors for all businesses.
 * Replicates the exact same pixel analysis as BusinessLogo.tsx but server-side using sharp.
 * Stores results in businesses.logo_bg_color column.
 *
 * Usage: node scripts/compute_logo_colors.js [--limit N] [--force]
 */

const pg = require('pg');
const sharp = require('sharp');
require('dotenv').config({ path: 'apps/web/.env.local' });

const CONCURRENCY = 20;
const SAMPLE_SIZE = 64;

// ── Parse CLI args ──
const args = process.argv.slice(2);
const force = args.includes('--force');
const limitIdx = args.indexOf('--limit');
const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 0;

// ── Pixel analysis (same logic as BusinessLogo.tsx) ──
function analyzePixels(data) {
    let totalLuminance = 0, opaquePixels = 0, transparentPixels = 0;
    let edgeDark = 0, edgeLight = 0;

    // Build edge pixel index set (outer 3px ring)
    const edgeIndices = new Set();
    for (let x = 0; x < SAMPLE_SIZE; x++) {
        for (let y = 0; y < 3; y++) edgeIndices.add(y * SAMPLE_SIZE + x);
        for (let y = SAMPLE_SIZE - 3; y < SAMPLE_SIZE; y++) edgeIndices.add(y * SAMPLE_SIZE + x);
    }
    for (let y = 0; y < SAMPLE_SIZE; y++) {
        for (let x = 0; x < 3; x++) edgeIndices.add(y * SAMPLE_SIZE + x);
        for (let x = SAMPLE_SIZE - 3; x < SAMPLE_SIZE; x++) edgeIndices.add(y * SAMPLE_SIZE + x);
    }

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
        if (a < 30) { transparentPixels++; continue; }
        opaquePixels++;
        const lum = (r * 299 + g * 587 + b * 114) / 1000;
        totalLuminance += lum;
        const pi = i / 4;
        if (edgeIndices.has(pi)) lum < 128 ? edgeDark++ : edgeLight++;
    }

    const hasTransparency = transparentPixels > SAMPLE_SIZE * SAMPLE_SIZE * 0.05;
    const avgLuminance = opaquePixels > 0 ? totalLuminance / opaquePixels : 128;
    const dominantEdge = edgeDark > edgeLight * 2 ? 'dark' : edgeLight > edgeDark * 2 ? 'light' : 'mixed';

    // Background selection — exact same logic as BusinessLogo.tsx
    let bg;
    if (hasTransparency) {
        bg = avgLuminance > 200 ? '#1c1c1e' : avgLuminance > 128 ? '#2c2c2e' : '#ffffff';
    } else {
        if (dominantEdge === 'dark') bg = '#f8f8f8';
        else if (dominantEdge === 'light') bg = '#1c1c1e';
        else bg = avgLuminance > 128 ? '#1c1c1e' : '#f8f8f8';
    }

    return bg;
}

async function computeLogoColor(logoUrl) {
    const url = logoUrl.replace(/^http:\/\//i, 'https://');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (TradeRefer Logo Analyzer)' },
            signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const buffer = Buffer.from(await res.arrayBuffer());
        const { data } = await sharp(buffer)
            .resize(SAMPLE_SIZE, SAMPLE_SIZE, { fit: 'fill' })
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });

        return analyzePixels(data);
    } catch (err) {
        clearTimeout(timeout);
        throw err;
    }
}

async function main() {
    const client = new pg.Client(process.env.DATABASE_URL);
    await client.connect();

    // Get businesses that need processing
    const where = force ? '' : 'AND logo_bg_color IS NULL';
    const limitClause = limit > 0 ? `LIMIT ${limit}` : '';
    const { rows } = await client.query(
        `SELECT id, business_name, logo_url FROM businesses WHERE logo_url IS NOT NULL AND logo_url != '' ${where} ORDER BY id ${limitClause}`
    );

    console.log(`Found ${rows.length} logos to process${force ? ' (force mode)' : ''}`);

    let done = 0, ok = 0, failed = 0;

    // Process in batches of CONCURRENCY
    for (let i = 0; i < rows.length; i += CONCURRENCY) {
        const batch = rows.slice(i, i + CONCURRENCY);
        const results = await Promise.allSettled(
            batch.map(async (biz) => {
                try {
                    const bg = await computeLogoColor(biz.logo_url);
                    await client.query('UPDATE businesses SET logo_bg_color = $1 WHERE id = $2', [bg, biz.id]);
                    ok++;
                    return bg;
                } catch (err) {
                    failed++;
                    console.error(`  ✗ ${biz.business_name}: ${err.message}`);
                    return null;
                }
            })
        );
        done += batch.length;
        const rate = (done / ((Date.now() - startTime) / 1000)).toFixed(0);
        process.stdout.write(`\r  ${done}/${rows.length} processed (${ok} ok, ${failed} failed) — ${rate}/s`);
    }

    console.log(`\n\nDone! ${ok} colors computed, ${failed} failed.`);
    await client.end();
}

const startTime = Date.now();
main().catch(err => { console.error('Fatal:', err); process.exit(1); });
