/**
 * Consolidate duplicated trade_category labels (audit 2026-06-12 PM, item 1).
 *
 * Synonym labels split one trade's inventory across two parallel /local and
 * /top page trees (Electrical 1,813 + Electrician 512, Plumbing 1,729 +
 * Plumber 329, ...), halving both page sets' strength. This relabels every
 * active business whose trade_category appears in
 * apps/web/lib/trade-synonyms.json to the canonical label. Retired slugs 308
 * via apps/web/lib/trade-redirects.ts.
 *
 * Claimed / user-owned rows are skipped (their owners chose the category).
 *
 * Usage:
 *   node scripts/consolidate_trade_taxonomy.js            # dry run
 *   node scripts/consolidate_trade_taxonomy.js --execute  # apply
 */
const pg = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'apps', 'web', '.env.local') });

const SYNONYMS = require(path.join(__dirname, '..', 'apps', 'web', 'lib', 'trade-synonyms.json'));
const EXECUTE = process.argv.includes('--execute');

async function main() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  let totalMoved = 0;
  const moves = [];
  for (const [from, to] of Object.entries(SYNONYMS)) {
    if (from === '//') continue;
    const r = await client.query(
      `SELECT COUNT(*) AS n FROM businesses
       WHERE status = 'active' AND trade_category = $1
         AND user_id IS NULL AND is_claimed = false`,
      [from]
    );
    const n = Number(r.rows[0].n);
    if (n > 0) {
      moves.push({ from, to, n });
      totalMoved += n;
    }
  }

  moves.sort((a, b) => b.n - a.n);
  console.log(`Relabels planned (${moves.length} labels, ${totalMoved} businesses):`);
  for (const m of moves) console.log(`  ${m.from} -> ${m.to}  (${m.n})`);

  if (!EXECUTE) {
    console.log('\nDRY RUN — re-run with --execute to apply.');
    await client.end();
    return;
  }

  await client.query('BEGIN');
  try {
    for (const m of moves) {
      await client.query(
        `UPDATE businesses SET trade_category = $2, updated_at = now()
         WHERE status = 'active' AND trade_category = $1
           AND user_id IS NULL AND is_claimed = false`,
        [m.from, m.to]
      );
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  }

  const after = await client.query(
    `SELECT COUNT(DISTINCT trade_category) AS labels FROM businesses WHERE status = 'active'`
  );
  console.log(`\nApplied. Distinct active trade labels now: ${after.rows[0].labels}`);
  await client.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
