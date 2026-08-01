// Pull the leading dollar range out of each job's cost answer, so job-level
// cost overrides can be kept in sync with what the FAQ actually claims.
// Usage (from apps/web):  node scripts/materials/extract-costs.mjs [slug ...]
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const answers = JSON.parse(readFileSync(join(here, "answers.json"), "utf8"));
const slugs = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(answers);

const RANGE = /\$([\d,]+)(?:\s*(?:to|–|-)\s*\$?([\d,]+))?([^.]{0,30})/;

for (const slug of slugs) {
    const entries = answers[slug];
    if (!entries) { console.log(`${slug.padEnd(36)} MISSING`); continue; }
    const cost = entries.find((e) => /how much|cost|price/i.test(e.q));
    if (!cost) { console.log(`${slug.padEnd(36)} no cost question`); continue; }
    const first = cost.a.split(/(?<=[.!?])\s/)[0];
    const m = first.match(RANGE);
    if (!m) { console.log(`${slug.padEnd(36)} no $ figure`); continue; }
    const low = Number(m[1].replace(/,/g, ""));
    const high = m[2] ? Number(m[2].replace(/,/g, "")) : low;
    const tail = (m[3] || "").replace(/\s+/g, " ").trim().slice(0, 28);
    console.log(`${slug.padEnd(36)} ${String(low).padStart(6)} - ${String(high).padStart(6)}  ${tail}`);
}
