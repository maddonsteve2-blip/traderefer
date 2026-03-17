/**
 * Regenerate apps/web/lib/postcodes.ts from DB data.
 * 
 * Sources (in priority order):
 * 1. Extract postcode from businesses.address field
 * 2. Look up from locations_reference table
 * 
 * Usage: node scripts/regenerate_postcodes.js
 */

const pg = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'apps', 'web', '.env.local') });

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
      state,
      address
    FROM businesses
    WHERE status = 'active' AND suburb IS NOT NULL
    ORDER BY LOWER(REPLACE(suburb, ' ', '-')), state, address DESC NULLS LAST
  `);

  // Get all postcodes from locations_reference as fallback
  const refRows = await client.query(`
    SELECT LOWER(slug) as slug, state_code, postcode
    FROM locations_reference
    WHERE postcode IS NOT NULL AND postcode != ''
  `);
  const refLookup = {};
  for (const r of refRows.rows) {
    refLookup[`${r.slug}|${r.state_code}`] = r.postcode;
  }

  // Also query ALL businesses (not just distinct) for address postcodes 
  const allAddresses = await client.query(`
    SELECT LOWER(REPLACE(suburb, ' ', '-')) as suburb_slug, state, address
    FROM businesses
    WHERE status = 'active' AND suburb IS NOT NULL AND address IS NOT NULL
  `);

  // Build address postcode lookup from all businesses
  const addressPostcodes = {};
  for (const row of allAddresses.rows) {
    const key = `${row.suburb_slug}|${row.state}`;
    if (addressPostcodes[key]) continue;
    const pc = extractPostcode(row.address);
    if (pc) addressPostcodes[key] = pc;
  }

  // Build the postcode map
  const postcodeMap = {}; // state -> { slug -> postcode }
  let total = 0;
  let fromAddress = 0;
  let fromRef = 0;
  let missing = 0;

  for (const row of businesses.rows) {
    const { suburb_slug, state } = row;
    if (!postcodeMap[state]) postcodeMap[state] = {};

    // Priority 1: From business address
    const addrKey = `${suburb_slug}|${state}`;
    let pc = addressPostcodes[addrKey];
    if (pc) {
      postcodeMap[state][suburb_slug] = pc;
      fromAddress++;
      total++;
      continue;
    }

    // Priority 2: From locations_reference
    pc = refLookup[`${suburb_slug}|${state}`];
    if (pc) {
      postcodeMap[state][suburb_slug] = pc;
      fromRef++;
      total++;
      continue;
    }

    // Still missing
    console.log(`  MISSING postcode: ${suburb_slug} (${state})`);
    missing++;
  }

  console.log(`\nResults: ${total} postcodes found, ${missing} missing`);
  console.log(`  From address: ${fromAddress}`);
  console.log(`  From reference: ${fromRef}`);

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
// Generated from businesses.address field + locations_reference
// ${totalSuburbs} suburbs across ${states.length} states
// Last updated: ${new Date().toISOString().split('T')[0]}
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

/**
 * Look up postcode for a suburb slug + state (code or slug).
 * Accepts both "NSW" and "new-south-wales" formats.
 * Returns the postcode string or null if not found.
 */
export function getPostcode(suburbSlug: string, stateCodeOrSlug: string): string | null {
    const slug = suburbSlug.toLowerCase();
    const normalized = stateCodeOrSlug.toLowerCase();
    const state = STATE_SLUG_TO_CODE[normalized] || stateCodeOrSlug.toUpperCase();
    return SUBURB_POSTCODES[state]?.[slug] ?? null;
}

/**
 * Parse a suburb slug that may contain a postcode suffix.
 * e.g. "parramatta-2150" → { suburb: "parramatta", postcode: "2150" }
 * e.g. "armstrong-creek-3217" → { suburb: "armstrong-creek", postcode: "3217" }
 * e.g. "parramatta" → { suburb: "parramatta", postcode: null }
 */
export function parseSuburbSlug(slug: string): { suburb: string; postcode: string | null } {
    const match = slug.match(/^(.+)-(\\d{4})$/);
    if (match) {
        return { suburb: match[1], postcode: match[2] };
    }
    return { suburb: slug, postcode: null };
}
`;

  const outPath = path.join(__dirname, '..', 'apps', 'web', 'lib', 'postcodes.ts');
  fs.writeFileSync(outPath, ts, 'utf8');
  console.log(`\nWritten ${totalSuburbs} suburbs to ${outPath}`);

  await client.end();
}

function extractPostcode(address) {
  if (!address) return null;
  // Match Australian postcodes (4 digits, typically at end or before "Australia")
  const match = address.match(/\b(\d{4})\b(?:\s*,?\s*Australia)?/);
  if (match) {
    const pc = match[1];
    // Australian postcodes: 0200-0299 (ACT), 0800-0999 (NT), 1000-2999 (NSW), 3000-3999 (VIC),
    // 4000-4999 (QLD), 5000-5999 (SA), 6000-6999 (WA), 7000-7999 (TAS)
    const n = parseInt(pc);
    if ((n >= 200 && n <= 299) || (n >= 800 && n <= 999) || (n >= 1000 && n <= 7999)) {
      return pc;
    }
  }
  return null;
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
