// Ingest samples.json (from sample_prices.py) into material_prices.
// Append-only: every run adds fresh sample rows; pages read the latest per
// material+retailer. Run from apps/web:  node scripts/materials/ingest-prices.mjs
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const here = dirname(fileURLToPath(import.meta.url));
const envFile = readFileSync(join(here, "../../.env.local"), "utf8");
const dbUrl = envFile.match(/^DATABASE_URL="?([^"\n]+)"?/m)?.[1];
if (!dbUrl) throw new Error("DATABASE_URL not found");
const sql = neon(dbUrl);

const samples = JSON.parse(readFileSync(join(here, "samples.json"), "utf8"));
let ok = 0;
for (const s of samples) {
    const rows = await sql`
        INSERT INTO material_prices (material_id, retailer, price_low, price_typical, price_high, sample_size)
        SELECT id, ${s.retailer}, ${s.low}, ${s.typical}, ${s.high}, ${s.sample_size}
        FROM materials WHERE slug = ${s.slug}
        RETURNING id
    `;
    if (rows.length) ok++;
    else console.warn(`⚠ no material row for slug: ${s.slug}`);
}
console.log(`Inserted ${ok}/${samples.length} price samples.`);
