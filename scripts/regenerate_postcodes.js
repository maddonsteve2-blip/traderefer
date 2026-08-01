/**
 * Regenerate apps/web/lib/postcodes.ts from DB data.
 *
 * Sources (in priority order):
 * 1. apps/web/lib/postcode-anchors.json — curated, audit-verified truth (always wins)
 * 2. locations_reference table
 * 3. Valid postcode extracted from businesses.address field
 *
 * Safety rails (added 2026-06-12 after a regeneration silently flipped 167 suburbs,
 * see docs/seo-research/audit-2026-06-12/city-postcode-integrity.md):
 * - every entry that differs from the committed map is printed (old → new);
 * - if more than MAX_CHANGE_RATIO of existing entries would change or disappear,
 *   the script aborts WITHOUT writing (override with --force after reviewing the diff);
 * - anchor values can never be overridden, not even with --force.
 *
 * Usage: node scripts/regenerate_postcodes.js [--force]
 */

const pg = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'apps', 'web', '.env.local') });

const OUT_PATH = path.join(__dirname, '..', 'apps', 'web', 'lib', 'postcodes.ts');
const ANCHORS_PATH = path.join(__dirname, '..', 'apps', 'web', 'lib', 'postcode-anchors.json');
const MAX_CHANGE_RATIO = 0.05;

// state → { slug → postcode }, skipping the "//" comment key
const ANCHORS = {};
for (const [state, suburbs] of Object.entries(require(ANCHORS_PATH))) {
  if (typeof suburbs === 'object') ANCHORS[state] = suburbs;
}

async function main() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  console.log('Connected to database.');

  // Get all active suburb/state combos with addresses
  const businesses = await client.query(`
    SELECT DISTINCT ON (LOWER(REPLACE(suburb, ' ', '-')), state)
      LOWER(REPLACE(suburb, ' ', '-')) as suburb_slug,
      UPPER(state) as state,
      address
    FROM businesses
    WHERE status = 'active' AND suburb IS NOT NULL
    ORDER BY LOWER(REPLACE(suburb, ' ', '-')), state, address DESC NULLS LAST
  `);

  // Get all postcodes from locations_reference as fallback
  const refRows = await client.query(`
    SELECT LOWER(slug) as slug, UPPER(state_code) as state_code, postcode
    FROM locations_reference
    WHERE postcode IS NOT NULL AND postcode != ''
  `);
  const refLookup = {};
  for (const r of refRows.rows) {
    if (isPostcodeValidForState(r.postcode, r.state_code)) {
      refLookup[`${r.slug}|${r.state_code}`] = r.postcode;
    }
  }

  // Also query ALL businesses (not just distinct) for address postcodes 
  const allAddresses = await client.query(`
    SELECT LOWER(REPLACE(suburb, ' ', '-')) as suburb_slug, UPPER(state) as state, address
    FROM businesses
    WHERE status = 'active' AND suburb IS NOT NULL AND address IS NOT NULL
  `);

  // Build address postcode lookup from all businesses
  const addressPostcodes = {};
  for (const row of allAddresses.rows) {
    const key = `${row.suburb_slug}|${row.state}`;
    if (addressPostcodes[key]) continue;
    const pc = extractPostcode(row.address, row.state);
    if (pc) addressPostcodes[key] = pc;
  }

  // Build the postcode map
  const postcodeMap = {}; // state -> { slug -> postcode }
  let total = 0;
  let fromAddress = 0;
  let fromRef = 0;
  let missing = 0;

  let fromAnchor = 0;

  for (const row of businesses.rows) {
    const { suburb_slug, state } = row;
    if (!postcodeMap[state]) postcodeMap[state] = {};

    // Curated anchors are authoritative — the reference table and address
    // fallback have both produced wrong postcodes for these suburbs before.
    const anchorPc = ANCHORS[state] && ANCHORS[state][suburb_slug];
    if (anchorPc) {
      postcodeMap[state][suburb_slug] = anchorPc;
      fromAnchor++;
      total++;
      continue;
    }

    const addrKey = `${suburb_slug}|${state}`;
    let pc = refLookup[`${suburb_slug}|${state}`];
    if (pc) {
      postcodeMap[state][suburb_slug] = pc;
      fromRef++;
      total++;
      continue;
    }

    pc = addressPostcodes[addrKey];
    if (pc) {
      postcodeMap[state][suburb_slug] = pc;
      fromAddress++;
      total++;
      continue;
    }

    // Still missing
    console.log(`  MISSING postcode: ${suburb_slug} (${state})`);
    missing++;
  }

  // Anchored suburbs stay in the map even with no active businesses, so the
  // anchor unit test (apps/web/lib/__tests__/postcodes.test.ts) stays green.
  for (const [state, suburbs] of Object.entries(ANCHORS)) {
    if (!postcodeMap[state]) postcodeMap[state] = {};
    for (const [slug, pc] of Object.entries(suburbs)) {
      if (!postcodeMap[state][slug]) {
        postcodeMap[state][slug] = pc;
        fromAnchor++;
        total++;
      }
    }
  }

  console.log(`\nResults: ${total} postcodes found, ${missing} missing`);
  console.log(`  From anchors: ${fromAnchor}`);
  console.log(`  From address: ${fromAddress}`);
  console.log(`  From reference: ${fromRef}`);

  // ---- Diff-guard against the committed map ------------------------------
  const existing = readExistingMap(OUT_PATH);
  if (existing) {
    const existingKeys = Object.keys(existing);
    const changed = [];
    const removed = [];
    let added = 0;
    for (const key of existingKeys) {
      const [state, slug] = key.split('/');
      const next = postcodeMap[state] && postcodeMap[state][slug];
      if (next === undefined) removed.push(key);
      else if (next !== existing[key]) changed.push(`${key}: ${existing[key]} -> ${next}`);
    }
    for (const [state, suburbs] of Object.entries(postcodeMap)) {
      for (const slug of Object.keys(suburbs)) {
        if (existing[`${state}/${slug}`] === undefined) added++;
      }
    }

    if (changed.length) {
      console.log(`\nCHANGED entries (${changed.length}):`);
      for (const line of changed) console.log(`  ${line}`);
    }
    if (removed.length) {
      console.log(`\nREMOVED entries (${removed.length}):`);
      for (const key of removed) console.log(`  ${key}: ${existing[key]}`);
    }
    console.log(`\nDiff vs committed map: ${changed.length} changed, ${removed.length} removed, ${added} added (of ${existingKeys.length} existing)`);

    const ratio = (changed.length + removed.length) / existingKeys.length;
    if (ratio > MAX_CHANGE_RATIO && !process.argv.includes('--force')) {
      console.error(
        `\nABORTED: ${(ratio * 100).toFixed(1)}% of existing entries would change ` +
        `(limit ${MAX_CHANGE_RATIO * 100}%). The last silent mass-change shipped 30 wrong ` +
        `canonical postcodes (audit 2026-06-12). Review the diff above; rerun with --force ` +
        `only if every change is intentional. Nothing was written.`
      );
      await client.end();
      process.exit(1);
    }
  } else {
    console.warn(`\nWARNING: could not parse existing map at ${OUT_PATH} — diff-guard skipped.`);
  }

  // ---- Anchor integrity (cannot be bypassed) ------------------------------
  const anchorViolations = [];
  for (const [state, suburbs] of Object.entries(ANCHORS)) {
    for (const [slug, pc] of Object.entries(suburbs)) {
      const got = postcodeMap[state] && postcodeMap[state][slug];
      if (got !== pc) anchorViolations.push(`${state}/${slug}: expected ${pc}, generated ${got}`);
    }
  }
  if (anchorViolations.length) {
    console.error('\nABORTED: generated map violates curated anchors:');
    for (const v of anchorViolations) console.error(`  ${v}`);
    console.error('Fix the generator (or, with postal-dataset evidence, the anchors file). Nothing was written.');
    await client.end();
    process.exit(1);
  }

  // Sort states and suburbs
  const states = Object.keys(postcodeMap).sort();
  const lines = [];
  for (const state of states) {
    lines.push(`    "${state}": {`);
    const slugs = Object.keys(postcodeMap[state]).sort();
    for (const slug of slugs) {
      lines.push(`        "${slug}": "${postcodeMap[state][slug]}",`);
    }
    lines.push(`    },`);
  }

  const totalSuburbs = Object.values(postcodeMap).reduce((acc, m) => acc + Object.keys(m).length, 0);

  // Write the TS file, preserving the STATE_SLUG_TO_CODE and functions at the bottom
  const ts = `// Auto-generated suburb → postcode lookup
// Sources: lib/postcode-anchors.json (curated, wins) > locations_reference > businesses.address fallback
// ${totalSuburbs} suburbs across ${states.length} states
// Last updated: ${new Date().toISOString().split('T')[0]}
// Anchors are asserted by lib/__tests__/postcodes.test.ts — update the anchors file, not this one.
// Regenerate: node scripts/regenerate_postcodes.js

export const SUBURB_POSTCODES: Record<string, Record<string, string>> = {
${lines.join('\n')}
};

const STATE_SLUG_TO_CODE: Record<string, string> = {
    "new-south-wales": "NSW",
    "victoria": "VIC",
    "queensland": "QLD",
    "western-australia": "WA",
    "south-australia": "SA",
    "tasmania": "TAS",
    "australian-capital-territory": "ACT",
    "northern-territory": "NT",
};

const STATE_POSTCODE_RANGES: Record<string, Array<[number, number]>> = {
    ACT: [[2600, 2618], [2900, 2920]],
    NSW: [[2000, 2599], [2619, 2899], [2921, 2999]],
    NT: [[800, 899]],
    QLD: [[4000, 4999]],
    SA: [[5000, 5999]],
    TAS: [[7000, 7999]],
    VIC: [[3000, 3999]],
    WA: [[6000, 6799]],
};

export function normalizeStateCode(stateCodeOrSlug: string): string {
    const normalized = String(stateCodeOrSlug || "").trim().toLowerCase();
    return STATE_SLUG_TO_CODE[normalized] || normalized.toUpperCase();
}

function normalizeSuburbSlug(suburbSlug: string): string {
    let decoded = String(suburbSlug || "").trim();
    try { decoded = decodeURIComponent(decoded); } catch { /* keep raw */ }
    return decoded
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export function isPostcodeValidForState(postcode: string | null | undefined, stateCodeOrSlug: string): boolean {
    if (!postcode || !/^\\d{4}$/.test(postcode)) return false;
    const state = normalizeStateCode(stateCodeOrSlug);
    const ranges = STATE_POSTCODE_RANGES[state];
    if (!ranges) return false;
    const numericPostcode = Number(postcode);
    return ranges.some(([min, max]) => numericPostcode >= min && numericPostcode <= max);
}

/**
 * Look up postcode for a suburb slug + state (code or slug).
 * Accepts both "NSW" and "new-south-wales" formats.
 * Returns the postcode string or null if not found.
 */
export function getPostcode(suburbSlug: string, stateCodeOrSlug: string): string | null {
    const slug = normalizeSuburbSlug(suburbSlug);
    const state = normalizeStateCode(stateCodeOrSlug);
    const postcode = SUBURB_POSTCODES[state]?.[slug] ?? null;
    return isPostcodeValidForState(postcode, state) ? postcode : null;
}

/**
 * Parse a suburb slug that may contain a postcode suffix.
 * e.g. "parramatta-2150" → { suburb: "parramatta", postcode: "2150" }
 * e.g. "armstrong-creek-3217" → { suburb: "armstrong-creek", postcode: "3217" }
 * e.g. "parramatta" → { suburb: "parramatta", postcode: null }
 */
export function parseSuburbSlug(slug: string): { suburb: string; postcode: string | null } {
    const normalized = normalizeSuburbSlug(slug);
    const match = normalized.match(/^(.+)-(\\d{4})$/);
    if (match) {
        return { suburb: match[1], postcode: match[2] };
    }
    return { suburb: normalized, postcode: null };
}

export function getCanonicalSuburbSlug(suburbSlug: string, stateCodeOrSlug: string): string {
    const { suburb, postcode } = parseSuburbSlug(suburbSlug);
    const knownPostcode = getPostcode(suburb, stateCodeOrSlug);

    if (knownPostcode) return \`\${suburb}-\${knownPostcode}\`;
    if (postcode && isPostcodeValidForState(postcode, stateCodeOrSlug)) return \`\${suburb}-\${postcode}\`;
    return suburb;
}

export function getDisplayPostcode(suburbSlug: string, stateCodeOrSlug: string): string | null {
    const { suburb, postcode } = parseSuburbSlug(suburbSlug);
    if (postcode && isPostcodeValidForState(postcode, stateCodeOrSlug)) return postcode;
    return getPostcode(suburb, stateCodeOrSlug);
}
`;

  fs.writeFileSync(OUT_PATH, ts, 'utf8');
  console.log(`\nWritten ${totalSuburbs} suburbs to ${OUT_PATH}`);

  await client.end();
}

/**
 * Parse the committed SUBURB_POSTCODES map out of postcodes.ts.
 * Returns a flat { "STATE/slug": "postcode" } object, or null if unreadable.
 * The format is stable because this script is the only writer.
 */
function readExistingMap(tsPath) {
  if (!fs.existsSync(tsPath)) return null;
  const src = fs.readFileSync(tsPath, 'utf8');
  const start = src.indexOf('export const SUBURB_POSTCODES');
  if (start === -1) return null;
  const end = src.indexOf('};', start);
  if (end === -1) return null;

  const map = {};
  let state = null;
  for (const line of src.slice(start, end).split('\n')) {
    const stateMatch = line.match(/^\s{4}"([A-Z]+)": \{/);
    if (stateMatch) { state = stateMatch[1]; continue; }
    const entryMatch = line.match(/^\s{8}"([^"]+)": "(\d{4})",/);
    if (entryMatch && state) map[`${state}/${entryMatch[1]}`] = entryMatch[2];
  }
  return Object.keys(map).length ? map : null;
}

function extractPostcode(address, stateCode) {
  if (!address) return null;
  // Match Australian postcodes (4 digits, typically at end or before "Australia")
  const matches = address.match(/\b\d{4}\b/g) || [];
  return matches.find((pc) => isPostcodeValidForState(pc, stateCode)) || null;
}

function isPostcodeValidForState(postcode, stateCode) {
  if (!postcode || !/^\d{4}$/.test(String(postcode))) return false;
  const n = parseInt(postcode, 10);
  const ranges = {
    ACT: [[2600, 2618], [2900, 2920]],
    NSW: [[2000, 2599], [2619, 2899], [2921, 2999]],
    NT: [[800, 899]],
    QLD: [[4000, 4999]],
    SA: [[5000, 5999]],
    TAS: [[7000, 7999]],
    VIC: [[3000, 3999]],
    WA: [[6000, 6799]],
  }[String(stateCode || '').toUpperCase()];
  return !!ranges && ranges.some(([min, max]) => n >= min && n <= max);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
