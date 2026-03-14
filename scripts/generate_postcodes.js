/**
 * Extract suburb → postcode mappings from the businesses table address field.
 * Generates a TypeScript lookup file at apps/web/lib/postcodes.ts
 */
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', 'apps', 'web', '.env.local') });
const { Pool } = require('pg');

const db = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });

async function main() {
    // Extract postcodes from address field — take the most common postcode per suburb+state
    const res = await db.query(`
        SELECT suburb, state, 
            (REGEXP_MATCHES(address, '(\\d{4})\\s*$'))[1] as postcode,
            COUNT(*) as cnt
        FROM businesses
        WHERE address IS NOT NULL AND address != ''
          AND suburb IS NOT NULL AND suburb != ''
          AND state IS NOT NULL
          AND address ~ '\\d{4}\\s*$'
        GROUP BY suburb, state, (REGEXP_MATCHES(address, '(\\d{4})\\s*$'))[1]
        ORDER BY suburb, state, cnt DESC
    `);

    // For each suburb+state, pick the most common postcode
    const lookup = {};
    const seen = new Set();
    for (const row of res.rows) {
        const key = `${row.suburb.toLowerCase()}|${row.state.toUpperCase()}`;
        if (seen.has(key)) continue; // already got the most common one (sorted by cnt DESC)
        seen.add(key);
        
        const stateCode = row.state.toUpperCase();
        if (!lookup[stateCode]) lookup[stateCode] = {};
        
        // Use lowercase suburb slug as key
        const suburbSlug = row.suburb.toLowerCase().replace(/\s+/g, '-');
        lookup[stateCode][suburbSlug] = row.postcode;
    }

    // Count totals
    let total = 0;
    for (const state of Object.keys(lookup)) {
        total += Object.keys(lookup[state]).length;
    }
    console.log(`Extracted ${total} suburb→postcode mappings across ${Object.keys(lookup).length} states`);

    // Generate TypeScript file
    const lines = [
        '// Auto-generated suburb → postcode lookup',
        '// Generated from businesses.address field',
        `// ${total} suburbs across ${Object.keys(lookup).length} states`,
        `// Last updated: ${new Date().toISOString().split('T')[0]}`,
        '',
        'export const SUBURB_POSTCODES: Record<string, Record<string, string>> = {',
    ];

    for (const state of Object.keys(lookup).sort()) {
        const suburbs = lookup[state];
        const sortedSuburbs = Object.keys(suburbs).sort();
        lines.push(`    "${state}": {`);
        for (const suburb of sortedSuburbs) {
            lines.push(`        "${suburb}": "${suburbs[suburb]}",`);
        }
        lines.push(`    },`);
    }
    lines.push('};');
    lines.push('');
    lines.push('/**');
    lines.push(' * Look up postcode for a suburb slug + state code.');
    lines.push(' * Returns the postcode string or null if not found.');
    lines.push(' */');
    lines.push('export function getPostcode(suburbSlug: string, stateCode: string): string | null {');
    lines.push('    const slug = suburbSlug.toLowerCase();');
    lines.push('    const state = stateCode.toUpperCase();');
    lines.push('    return SUBURB_POSTCODES[state]?.[slug] ?? null;');
    lines.push('}');
    lines.push('');
    lines.push('/**');
    lines.push(' * Parse a suburb slug that may contain a postcode suffix.');
    lines.push(' * e.g. "parramatta-2150" → { suburb: "parramatta", postcode: "2150" }');
    lines.push(' * e.g. "armstrong-creek-3217" → { suburb: "armstrong-creek", postcode: "3217" }');
    lines.push(' * e.g. "parramatta" → { suburb: "parramatta", postcode: null }');
    lines.push(' */');
    lines.push('export function parseSuburbSlug(slug: string): { suburb: string; postcode: string | null } {');
    lines.push('    const match = slug.match(/^(.+)-(\\d{4})$/);');
    lines.push('    if (match) {');
    lines.push('        return { suburb: match[1], postcode: match[2] };');
    lines.push('    }');
    lines.push('    return { suburb: slug, postcode: null };');
    lines.push('}');
    lines.push('');

    const outPath = path.join(__dirname, '..', 'apps', 'web', 'lib', 'postcodes.ts');
    fs.writeFileSync(outPath, lines.join('\n'));
    console.log(`Written to ${outPath}`);

    await db.end();
}

main().catch(e => { console.error(e); process.exit(1); });
