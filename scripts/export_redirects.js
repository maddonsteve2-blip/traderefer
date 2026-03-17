/**
 * Export location_redirects table to a static TypeScript file
 * for use in Next.js middleware (Edge Runtime compatible).
 * 
 * Usage: node scripts/export_redirects.js
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

  const result = await client.query(
    'SELECT old_url, new_url FROM location_redirects ORDER BY old_url'
  );

  console.log(`Found ${result.rows.length} redirects in DB.`);

  // Build the TS file content
  const lines = result.rows.map(r => `  "${r.old_url}": "${r.new_url}",`);

  const ts = `// Auto-generated from location_redirects table
// Generated: ${new Date().toISOString().split('T')[0]}
// Total redirects: ${result.rows.length}
// DO NOT EDIT MANUALLY — run: node scripts/export_redirects.js

export const LOCATION_REDIRECTS: Record<string, string> = {
${lines.join('\n')}
};
`;

  const outPath = path.join(__dirname, '..', 'apps', 'web', 'lib', 'location-redirects.ts');
  fs.writeFileSync(outPath, ts, 'utf8');
  console.log(`Written to ${outPath}`);

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
