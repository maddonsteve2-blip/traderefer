// Second-pass price-range refinement over the crawled catalog.
// Fixes the two failure modes the first ingest left behind:
//   1. Unmatched materials (plurals + missing aliases) -> re-match with a
//      stemmed-token matcher plus alias phrase matching.
//   2. Corrupted ranges (pallets/kits/multi-packs polluting per-unit stats)
//      -> per-m² pack normalisation from the product name, sample/swatch
//      exclusion, then median-anchored trimming before p10/p50/p90.
// Run from apps/web:  node scripts/materials/refine-ranges.mjs
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const here = dirname(fileURLToPath(import.meta.url));
const envFile = readFileSync(join(here, "../../.env.local"), "utf8");
const dbUrl = envFile.match(/^DATABASE_URL="?([^"\n]+)"?/m)?.[1];
if (!dbUrl) throw new Error("DATABASE_URL not found");
const sql = neon(dbUrl);

// --- matcher (stemmed tokens + alias phrases) ---
const STOP = new Set(["per", "each", "with", "and", "kit", "pack", "the", "mm", "kg", "l", "m", "lm"]);
const stem = (w) => (w.length > 3 ? w.replace(/s$/, "") : w);
const tokens = (t) => new Set(
    (t.toLowerCase().match(/[a-z0-9]+/g) || []).filter((w) => w.length > 2 && !STOP.has(w)).map(stem)
);

const mats = await sql`SELECT id, slug, name, unit, aliases FROM materials`;
const matDefs = mats.map((m) => ({
    id: m.id,
    slug: m.slug,
    unit: m.unit,
    // A token match must include at least one token from the material NAME —
    // alias-only pairs are too loose ("wet area" alone linked shower trays
    // to sanitary silicone).
    nameTokens: tokens(m.name),
    want: tokens(m.name + " " + (m.aliases || []).join(" ")),
    // Phrase matching only for aliases long enough to be unambiguous.
    phrases: (m.aliases || []).map((a) => a.toLowerCase()).filter((a) => a.length >= 8),
}));

function matchMaterial(name) {
    const nameLc = name.toLowerCase();
    const pt = tokens(name);
    let best = null, bestScore = 0;
    for (const m of matDefs) {
        // Alias phrase match beats token scoring (longest phrase wins via score boost).
        const phrase = m.phrases.find((ph) => nameLc.includes(ph));
        const tokenScore = [...m.want].filter((w) => pt.has(w)).length;
        const hasNameToken = [...m.nameTokens].some((w) => pt.has(w));
        const score = phrase ? 100 + phrase.length : (hasNameToken ? tokenScore : 0);
        if (score > bestScore && (phrase || score >= 2)) {
            best = m.id; bestScore = score;
        }
    }
    return best;
}

// Re-validate EXISTING links under the tightened rules, then match unlinked.
const allProducts = await sql`SELECT id, name, material_id FROM retail_products`;
let linked = 0, unlinkedCount = 0;
const relink = [], unlink = [];
for (const p of allProducts) {
    const target = matchMaterial(p.name);
    if (p.material_id && target !== p.material_id) {
        if (target) relink.push([p.id, target]); else unlink.push(p.id);
    } else if (!p.material_id && target) {
        relink.push([p.id, target]); linked++;
    }
}
const CHUNK = 100;
for (let i = 0; i < unlink.length; i += CHUNK) {
    const chunk = unlink.slice(i, i + CHUNK);
    await sql.query(
        `UPDATE retail_products SET material_id = NULL WHERE id = ANY($1::int[])`,
        [chunk]
    );
    unlinkedCount += chunk.length;
}
for (let i = 0; i < relink.length; i += CHUNK) {
    const chunk = relink.slice(i, i + CHUNK);
    await sql.query(
        `UPDATE retail_products AS rp SET material_id = v.mid::int
         FROM (VALUES ${chunk.map((_, j) => `($${j * 2 + 1}::int,$${j * 2 + 2}::int)`).join(",")}) AS v(id, mid)
         WHERE rp.id = v.id::int`,
        chunk.flat()
    );
}
console.log(`Links: +${linked} new, ${unlinkedCount} removed as bad, ${relink.length - linked} moved.`);

// --- recompute ranges with normalisation + trimming ---
const linkedProducts = await sql`
    SELECT material_id, name, price::float AS price
    FROM retail_products
    WHERE material_id IS NOT NULL AND retailer = 'bunnings'
`;
const byMat = new Map();
for (const p of linkedProducts) {
    if (!byMat.has(p.material_id)) byMat.set(p.material_id, []);
    byMat.get(p.material_id).push(p);
}

const JUNK = /\b(sample|swatch|colour chip|color chip)\b/i;
const AREA = /(\d+(?:\.\d+)?)\s*(?:m²|m2|sqm|square met)/i;
// Plain-metre lengths ("5.4m", "2.4 m") — must not swallow mm/cm/m² forms.
const LENGTH = /(\d+(?:\.\d+)?)\s*m(?![m²2c])\b/i;

function median(xs) {
    const s = [...xs].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
function percentile(xs, q) {
    const s = [...xs].sort((a, b) => a - b);
    if (s.length === 1) return s[0];
    const pos = (s.length - 1) * q;
    const lo = Math.floor(pos), hi = Math.ceil(pos);
    return s[lo] + (s[hi] - s[lo]) * (pos - lo);
}

let refreshed = 0, skipped = [];
for (const m of matDefs) {
    const pool = byMat.get(m.id) || [];
    let prices = [];
    for (const p of pool) {
        if (JUNK.test(p.name) || !(p.price > 0)) continue;
        if (m.unit === "per m²") {
            // Only comparable once normalised: parse pack area from the name,
            // divide, and drop products that state no area at all.
            const area = p.name.match(AREA);
            const a = area ? parseFloat(area[1]) : null;
            if (a && a >= 0.2 && a <= 100) prices.push(p.price / a);
        } else if (m.unit === "per lm") {
            // Timber/rail is priced per stocked length ("5.4m") — normalise
            // to lineal metres or the label is off by the piece length.
            const len = p.name.match(LENGTH);
            const l = len ? parseFloat(len[1]) : null;
            if (l && l >= 0.9 && l <= 7.2) prices.push(p.price / l);
        } else {
            prices.push(p.price);
        }
    }
    if (prices.length === 0) { skipped.push(m.slug); continue; }

    // Median-anchored trim: kill pallet/kit/multi-pack outliers.
    let med = median(prices);
    let kept = prices.filter((x) => x >= med / 3 && x <= med * 3);
    if (kept.length === 0) kept = [med];
    let lo = percentile(kept, 0.10), hi = percentile(kept, 0.90);
    if (lo > 0 && hi / lo > 8) {
        med = median(kept);
        kept = kept.filter((x) => x >= med / 2 && x <= med * 2);
        lo = percentile(kept, 0.10); hi = percentile(kept, 0.90);
    }
    const typ = median(kept);

    await sql`
        INSERT INTO material_prices (material_id, retailer, price_low, price_typical, price_high, sample_size)
        VALUES (${m.id}, 'bunnings', ${lo.toFixed(2)}, ${typ.toFixed(2)}, ${hi.toFixed(2)}, ${kept.length})
    `;
    refreshed++;
}
console.log(`Refreshed ${refreshed} materials (trimmed + normalised).`);
if (skipped.length) console.log(`No usable products for ${skipped.length}: ${skipped.join(", ")}`);

// --- coverage report: job-linked materials whose latest range renders ---
const cover = await sql`
    WITH latest AS (
        SELECT DISTINCT ON (material_id) material_id, price_low::float AS lo, price_high::float AS hi
        FROM material_prices ORDER BY material_id, sampled_at DESC
    )
    SELECT m.slug,
           CASE WHEN l.material_id IS NULL THEN 'unpriced'
                WHEN l.lo > 0 AND l.hi / l.lo > 8 THEN 'suppressed'
                ELSE 'ok' END AS state
    FROM materials m
    JOIN job_materials jm ON jm.material_id = m.id
    LEFT JOIN latest l ON l.material_id = m.id
    GROUP BY m.slug, state
`;
const bad = cover.filter((r) => r.state !== "ok");
console.log(`Job-linked materials rendering a price: ${cover.length - bad.length}/${cover.length}`);
if (bad.length) bad.forEach((r) => console.log(`  ${r.state}: ${r.slug}`));
