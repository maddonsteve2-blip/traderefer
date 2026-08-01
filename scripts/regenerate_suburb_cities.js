/**
 * Regenerate apps/web/lib/suburb-cities.ts — the canonical suburb → city
 * mapping for the /local URL tree.
 *
 * Why: the city URL segment was never validated anywhere; any business row
 * with a junk city minted an entire crawlable subtree, and the 483-entry
 * static LOCATION_REDIRECTS map never ran (the middleware matcher excludes
 * /local). The /local pages use this map to 308 wrong-city URLs to the
 * canonical one (audit 2026-06-12 §B).
 *
 * An entry is only emitted when EVERY active business for that
 * (state, suburb) agrees on one city — ambiguous suburbs are skipped and
 * logged, so the redirect can never bounce between cities.
 *
 * Usage: node scripts/regenerate_suburb_cities.js
 */
const pg = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'apps', 'web', '.env.local') });

const OUT_PATH = path.join(__dirname, '..', 'apps', 'web', 'lib', 'suburb-cities.ts');

async function main() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const { rows } = await client.query(`
    SELECT UPPER(state) AS st,
           LOWER(REPLACE(suburb, ' ', '-')) AS sub,
           LOWER(REPLACE(city, ' ', '-')) AS city,
           COUNT(*) AS n
    FROM businesses
    WHERE status = 'active'
      AND state IS NOT NULL AND state != ''
      AND city IS NOT NULL AND city != ''
      AND suburb IS NOT NULL AND suburb != ''
    GROUP BY 1, 2, 3
  `);

  const byKey = new Map(); // "ST|sub" -> Map(city -> n)
  for (const r of rows) {
    const key = `${r.st}|${r.sub}`;
    if (!byKey.has(key)) byKey.set(key, new Map());
    byKey.get(key).set(r.city, Number(r.n));
  }

  const map = {}; // state -> { suburbSlug -> citySlug }
  let emitted = 0;
  const ambiguous = [];
  for (const [key, cities] of byKey) {
    const [st, sub] = key.split('|');
    if (cities.size > 1) {
      ambiguous.push(`${st}/${sub}: ${[...cities.entries()].map(([c, n]) => `${c}(${n})`).join(', ')}`);
      continue;
    }
    const city = cities.keys().next().value;
    if (!map[st]) map[st] = {};
    map[st][sub] = city;
    emitted++;
  }

  console.log(`Emitted ${emitted} unanimous (state, suburb) -> city entries.`);
  if (ambiguous.length) {
    console.log(`Skipped ${ambiguous.length} ambiguous suburbs (no redirect for these):`);
    for (const a of ambiguous) console.log(`  ${a}`);
  }

  const states = Object.keys(map).sort();
  const lines = [];
  for (const st of states) {
    lines.push(`    "${st}": {`);
    for (const sub of Object.keys(map[st]).sort()) {
      lines.push(`        "${sub}": "${map[st][sub]}",`);
    }
    lines.push(`    },`);
  }

  const ts = `// Auto-generated suburb → canonical city slug lookup for the /local tree.
// Source: unanimous (state, suburb) -> city among active businesses.
// ${emitted} suburbs across ${states.length} states. Ambiguous suburbs are
// intentionally absent (no redirect). Last updated: ${new Date().toISOString().split('T')[0]}
// Regenerate: node scripts/regenerate_suburb_cities.js

export const SUBURB_CITIES: Record<string, Record<string, string>> = {
${lines.join('\n')}
};

/**
 * Canonical city slug for a (state, suburb-slug) pair, or null when the
 * suburb is unknown or ambiguous. Accepts postcode-suffixed suburb slugs.
 */
export function getCanonicalCitySlug(stateSlug: string, suburbSlug: string): string | null {
    const state = String(stateSlug || "").trim().toUpperCase();
    const suburb = String(suburbSlug || "")
        .trim()
        .toLowerCase()
        .replace(/-\\d{4}$/, ""); // strip postcode suffix
    return SUBURB_CITIES[state]?.[suburb] ?? null;
}
`;

  fs.writeFileSync(OUT_PATH, ts, 'utf8');
  console.log(`Written ${emitted} entries to ${OUT_PATH}`);
  await client.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
