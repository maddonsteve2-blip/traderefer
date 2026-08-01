// Ingest retail-products.jsonl into retail_products, token-match unlinked
// products to canonical materials, and recompute material price ranges from
// the full linked product set (p10/median/p90 — outlier-robust).
// Run from apps/web:  node scripts/materials/ingest-products.mjs
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const here = dirname(fileURLToPath(import.meta.url));
const envFile = readFileSync(join(here, "../../.env.local"), "utf8");
const dbUrl = envFile.match(/^DATABASE_URL="?([^"\n]+)"?/m)?.[1];
if (!dbUrl) throw new Error("DATABASE_URL not found");
const sql = neon(dbUrl);

// --- load + dedupe (last occurrence wins = freshest price) ---
const lines = readFileSync(join(here, "retail-products.jsonl"), "utf8").trim().split("\n");
const bySku = new Map();
for (const line of lines) {
    const p = JSON.parse(line);
    bySku.set(p.sku, p);
}
const products = [...bySku.values()];
console.log(`${products.length} unique products from ${lines.length} rows`);

// --- batched upsert ---
const CHUNK = 100;
for (let i = 0; i < products.length; i += CHUNK) {
    const chunk = products.slice(i, i + CHUNK);
    const params = [];
    const values = chunk.map((p, j) => {
        params.push("bunnings", p.sku, p.name, p.brand ?? null, p.price, p.category ?? null);
        const b = j * 6;
        return `($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6})`;
    }).join(",");
    await sql.query(
        `INSERT INTO retail_products (retailer, sku, name, brand, price, category_path)
         VALUES ${values}
         ON CONFLICT (retailer, sku) DO UPDATE
         SET name = EXCLUDED.name, brand = EXCLUDED.brand, price = EXCLUDED.price,
             category_path = EXCLUDED.category_path, scraped_at = now()`,
        params
    );
}
console.log("Upserted into retail_products.");

// --- token-match unlinked products to materials ---
const STOP = new Set(["per", "each", "with", "and", "kit", "pack", "the", "mm", "kg", "l", "m", "lm"]);
// Trailing-s stemming so "paver" matches "Pavers" — without it whole material
// families never link. Keep in sync with refine-ranges.mjs.
const stem = (w) => (w.length > 3 ? w.replace(/s$/, "") : w);
const tokens = (t) => new Set(
    (t.toLowerCase().match(/[a-z0-9]+/g) || []).filter((w) => w.length > 2 && !STOP.has(w)).map(stem)
);
const mats = await sql`SELECT id, name, aliases FROM materials`;
const matWant = mats.map((m) => ({ id: m.id, want: tokens(m.name + " " + (m.aliases || []).join(" ")) }));

const unlinked = await sql`SELECT id, name FROM retail_products WHERE material_id IS NULL`;
let linked = 0;
const updates = [];
for (const p of unlinked) {
    const pt = tokens(p.name);
    let best = null, bestScore = 0;
    for (const m of matWant) {
        const need = Math.min(2, m.want.size);
        const score = [...m.want].filter((w) => pt.has(w)).length;
        if (score >= need && score > bestScore) { best = m.id; bestScore = score; }
    }
    if (best) updates.push([p.id, best]), linked++;
}
for (let i = 0; i < updates.length; i += CHUNK) {
    const chunk = updates.slice(i, i + CHUNK);
    await sql.query(
        `UPDATE retail_products AS rp SET material_id = v.mid::int
         FROM (VALUES ${chunk.map((_, j) => `($${j * 2 + 1}::int,$${j * 2 + 2}::int)`).join(",")}) AS v(id, mid)
         WHERE rp.id = v.id::int`,
        chunk.flat()
    );
}
console.log(`Matched ${linked} of ${unlinked.length} unlinked products to materials.`);

// --- recompute ranges (>=3 linked products; skip if sampled <20h ago) ---
const rows = await sql`
    WITH ranked AS (
        SELECT material_id,
               percentile_cont(0.10) WITHIN GROUP (ORDER BY price) AS p10,
               percentile_cont(0.50) WITHIN GROUP (ORDER BY price) AS p50,
               percentile_cont(0.90) WITHIN GROUP (ORDER BY price) AS p90,
               COUNT(*) AS n
        FROM retail_products
        WHERE material_id IS NOT NULL AND retailer = 'bunnings'
        GROUP BY material_id
        HAVING COUNT(*) >= 3
    )
    INSERT INTO material_prices (material_id, retailer, price_low, price_typical, price_high, sample_size)
    SELECT r.material_id, 'bunnings', ROUND(r.p10::numeric, 2), ROUND(r.p50::numeric, 2), ROUND(r.p90::numeric, 2), r.n
    FROM ranked r
    WHERE NOT EXISTS (
        SELECT 1 FROM material_prices mp
        WHERE mp.material_id = r.material_id AND mp.retailer = 'bunnings'
          AND mp.sampled_at > now() - interval '20 hours'
          AND mp.sample_size >= r.n
    )
    RETURNING material_id
`;
console.log(`Refreshed price ranges for ${rows.length} materials from catalog data.`);
