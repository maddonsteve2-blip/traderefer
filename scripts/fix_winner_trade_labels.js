/**
 * Post-dedupe fix: where a duplicate group mixed trade_category spellings
 * (e.g. 'Carpenter' vs 'Carpentry'), relabel the surviving winner with the
 * spelling that has the larger sitewide active count, so winners stay on the
 * higher-traffic trade pages their duplicates used to occupy.
 *
 * Usage: node scripts/tmp_fix_winner_trades.js [--execute]
 */
const pg = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'apps', 'web', '.env.local') });

const EXECUTE = process.argv.includes('--execute');
const slugify = (s) =>
  String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

async function main() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  // Sitewide popularity of each trade label among ACTIVE rows
  const counts = await client.query(`
    SELECT trade_category, COUNT(*) AS n FROM businesses
    WHERE status = 'active' AND trade_category IS NOT NULL
    GROUP BY trade_category
  `);
  const popularity = new Map(counts.rows.map((r) => [r.trade_category, Number(r.n)]));

  // Winners and their delisted duplicates, joined by the dedupe key
  const rows = await client.query(`
    SELECT w.id AS winner_id, w.slug AS winner_slug, w.trade_category AS winner_trade,
           l.trade_category AS loser_trade
    FROM businesses w
    JOIN businesses l
      ON LOWER(TRIM(w.business_name)) = LOWER(TRIM(l.business_name))
     AND LOWER(COALESCE(w.suburb,'')) = LOWER(COALESCE(l.suburb,''))
     AND UPPER(w.state) = UPPER(l.state)
     AND w.id <> l.id
    WHERE w.status = 'active' AND l.status = 'duplicate'
  `);

  const updates = new Map(); // winner_id -> {slug, from, to}
  for (const r of rows.rows) {
    if (!r.winner_trade || !r.loser_trade) continue;
    if (slugify(r.winner_trade) === slugify(r.loser_trade)) continue;
    const wPop = popularity.get(r.winner_trade) || 0;
    const lPop = popularity.get(r.loser_trade) || 0;
    if (lPop > wPop) {
      updates.set(r.winner_id, { slug: r.winner_slug, from: r.winner_trade, to: r.loser_trade });
    }
  }

  console.log(`Winners with mixed-trade groups needing relabel: ${updates.size}`);
  let i = 0;
  for (const u of updates.values()) {
    if (i++ < 10) console.log(`  ${u.slug}: ${u.from} -> ${u.to}`);
  }

  if (!EXECUTE) {
    console.log('\nDRY RUN — re-run with --execute to apply.');
    await client.end();
    return;
  }

  await client.query('BEGIN');
  try {
    for (const [id, u] of updates) {
      await client.query(
        `UPDATE businesses SET trade_category = $2, updated_at = now() WHERE id = $1`,
        [id, u.to]
      );
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  }
  console.log(`Applied ${updates.size} relabels.`);
  await client.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
