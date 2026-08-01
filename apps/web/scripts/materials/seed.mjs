// Seed the materials data layer: applies schema.sql (idempotent) and upserts
// materials.json + job-materials.json. Safe to re-run any time — it never
// deletes, only inserts/updates. Run from apps/web:  node scripts/materials/seed.mjs
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const here = dirname(fileURLToPath(import.meta.url));
const envFile = readFileSync(join(here, "../../.env.local"), "utf8");
const dbUrl = envFile.match(/^DATABASE_URL="?([^"\n]+)"?/m)?.[1];
if (!dbUrl) throw new Error("DATABASE_URL not found in apps/web/.env.local");
const sql = neon(dbUrl);

const materials = JSON.parse(readFileSync(join(here, "materials.json"), "utf8"));
const jobMaterials = JSON.parse(readFileSync(join(here, "job-materials.json"), "utf8"));

// Validate: every mapping references a defined material, and every job slug
// exists in the live JOB_TYPES taxonomy (guards against silent orphans).
const materialSlugs = new Set(materials.map((m) => m.slug));
const constantsTs = readFileSync(join(here, "../../lib/constants.ts"), "utf8");
const jobTypesSrc = constantsTs.match(/export const JOB_TYPES[^=]*=\s*({[\s\S]*?})\s*;\s*\n/)[1];
const jobSlug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const validJobSlugs = new Set(
    [...jobTypesSrc.matchAll(/"([^"]+)"/g)].map((m) => jobSlug(m[1]))
);

let bad = 0;
for (const [job, mats] of Object.entries(jobMaterials)) {
    if (!validJobSlugs.has(job)) { console.warn(`⚠ unknown job slug: ${job}`); bad++; }
    for (const { m } of mats) {
        if (!materialSlugs.has(m)) { console.warn(`⚠ ${job} references unknown material: ${m}`); bad++; }
    }
}
if (bad > 0) { console.error(`${bad} validation problems — fix before seeding.`); process.exit(1); }

// Apply schema (statement by statement — the HTTP driver runs one at a time).
const schema = readFileSync(join(here, "schema.sql"), "utf8");
for (const stmt of schema.split(";").map((s) => s.trim()).filter(Boolean)) {
    await sql.query(stmt);
}

for (const m of materials) {
    await sql`
        INSERT INTO materials (slug, name, category, unit, aliases)
        VALUES (${m.slug}, ${m.name}, ${m.category}, ${m.unit}, ${m.aliases})
        ON CONFLICT (slug) DO UPDATE
        SET name = EXCLUDED.name, category = EXCLUDED.category,
            unit = EXCLUDED.unit, aliases = EXCLUDED.aliases, updated_at = now()
    `;
}

const idRows = await sql`SELECT id, slug FROM materials`;
const idBySlug = Object.fromEntries(idRows.map((r) => [r.slug, r.id]));

let links = 0;
for (const [job, mats] of Object.entries(jobMaterials)) {
    for (let i = 0; i < mats.length; i++) {
        const { m, q = null, opt = false } = mats[i];
        await sql`
            INSERT INTO job_materials (job_slug, material_id, qty_note, optional, sort)
            VALUES (${job}, ${idBySlug[m]}, ${q}, ${opt}, ${i})
            ON CONFLICT (job_slug, material_id) DO UPDATE
            SET qty_note = EXCLUDED.qty_note, optional = EXCLUDED.optional, sort = EXCLUDED.sort
        `;
        links++;
    }
}

const [counts] = await sql`SELECT
    (SELECT COUNT(*) FROM materials) AS materials,
    (SELECT COUNT(*) FROM job_materials) AS job_links,
    (SELECT COUNT(DISTINCT job_slug) FROM job_materials) AS jobs_mapped`;
console.log(`Seeded: ${counts.materials} materials, ${counts.job_links} links across ${counts.jobs_mapped} jobs (${links} upserted this run).`);
