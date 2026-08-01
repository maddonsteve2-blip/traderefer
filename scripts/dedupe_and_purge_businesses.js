/**
 * Dedupe duplicate business listings and delist logo-less listings.
 *
 * Phase 1 — DEDUPE: active businesses sharing (name, suburb, state) are one
 *   business listed twice (re-scrape minted "<slug>-<suburb>" copies, 2026-03-16).
 *   The best row wins (real logo > photos > cover > hours > website > description),
 *   missing fields on the winner are filled from the losers, losers get
 *   status='duplicate'.
 *
 * Phase 2 — PURGE: remaining active businesses with no logo_url render a
 *   generated-initials tile (see components/BusinessLogo.tsx fallback) and almost
 *   all of them have zero photos. They get status='delisted_no_logo'.
 *
 * Never touched: is_claimed=true, user_id IS NOT NULL, data_source='organic'.
 * Both phases are reversible: UPDATE businesses SET status='active' WHERE status IN
 * ('duplicate','delisted_no_logo').
 *
 * Usage:
 *   node scripts/dedupe_and_purge_businesses.js            # dry run, prints plan
 *   node scripts/dedupe_and_purge_businesses.js --execute  # applies changes
 */

const pg = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'apps', 'web', '.env.local') });

const EXECUTE = process.argv.includes('--execute');

// Fields copied from losers onto the winner when the winner's value is missing.
const MERGE_FIELDS = [
  'logo_url', 'logo_bg_color', 'cover_photo_url', 'opening_hours', 'website',
  'description', 'business_email', 'google_maps_url', 'abn',
];

function isMissing(v) {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

function score(b) {
  let s = 0;
  if (b.user_id || b.is_claimed) s += 1000; // never lose a real account's row
  if (!isMissing(b.logo_url)) s += 8;
  s += Math.min(b.photos, 10);
  if (!isMissing(b.cover_photo_url)) s += 3;
  if (b.opening_hours) s += 3;
  if (!isMissing(b.website)) s += 2;
  if ((b.description || '').length >= 150) s += 2;
  if (!isMissing(b.abn)) s += 1;
  return s;
}

async function main() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const { rows } = await client.query(`
    SELECT id, business_name, slug, suburb, city, state, data_source, user_id,
           is_claimed, logo_url, logo_bg_color, cover_photo_url, opening_hours,
           website, description, business_email, google_maps_url, abn,
           photo_urls, COALESCE(array_length(photo_urls, 1), 0) AS photos,
           created_at
    FROM businesses
    WHERE status = 'active'
  `);
  console.log(`Active businesses: ${rows.length}`);

  // ---- Phase 1: group duplicates --------------------------------------------
  const groups = new Map();
  for (const b of rows) {
    const key = `${(b.business_name || '').trim().toLowerCase()}|${(b.suburb || '').trim().toLowerCase()}|${(b.state || '').trim().toUpperCase()}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(b);
  }

  const loserIds = [];
  const mergeUpdates = []; // { id, fields: {col: value} }
  let dupGroups = 0;

  for (const members of groups.values()) {
    if (members.length < 2) continue;
    dupGroups++;
    members.sort((a, b) => {
      const d = score(b) - score(a);
      if (d !== 0) return d;
      const t = new Date(a.created_at) - new Date(b.created_at); // older first
      if (t !== 0) return t;
      return a.slug.length - b.slug.length; // bare slug preferred
    });
    const winner = members[0];
    const losers = members.slice(1).filter((l) => !l.user_id && !l.is_claimed);

    const fields = {};
    for (const col of MERGE_FIELDS) {
      if (!isMissing(winner[col])) continue;
      const donor = losers.find((l) => !isMissing(l[col]));
      if (donor) fields[col] = donor[col];
    }
    if (isMissing(winner.photo_urls)) {
      const donor = losers.find((l) => !isMissing(l.photo_urls));
      if (donor) fields.photo_urls = donor.photo_urls;
    }
    if (Object.keys(fields).length) mergeUpdates.push({ id: winner.id, fields, slug: winner.slug });
    loserIds.push(...losers.map((l) => l.id));

    // winner gains merged values for phase-2 logo accounting
    Object.assign(winner, fields);
  }

  // ---- Phase 2: logo-less purge (post-merge state) ---------------------------
  const loserSet = new Set(loserIds);
  const purge = rows.filter(
    (b) =>
      !loserSet.has(b.id) &&
      isMissing(b.logo_url) &&
      !b.user_id &&
      !b.is_claimed &&
      b.data_source !== 'organic'
  );
  const purgeWithPhotos = purge.filter((b) => !isMissing(b.photo_urls));

  console.log(`\nDuplicate groups: ${dupGroups}`);
  console.log(`Losers to mark 'duplicate': ${loserIds.length}`);
  console.log(`Winners receiving merged fields: ${mergeUpdates.length}`);
  console.log(`Logo-less to mark 'delisted_no_logo': ${purge.length} (${purgeWithPhotos.length} of them have photos)`);
  console.log(`Active after: ${rows.length - loserIds.length - purge.length}`);

  console.log('\nSample merges:');
  for (const m of mergeUpdates.slice(0, 5)) console.log(`  ${m.slug}: +${Object.keys(m.fields).join(', +')}`);
  console.log('Sample purges:');
  for (const b of purge.slice(0, 5)) console.log(`  ${b.slug} (${b.suburb}, ${b.state}) photos=${b.photos}`);

  if (!EXECUTE) {
    console.log('\nDRY RUN — nothing written. Re-run with --execute to apply.');
    await client.end();
    return;
  }

  // ---- Apply ----------------------------------------------------------------
  await client.query('BEGIN');
  try {
    for (const { id, fields } of mergeUpdates) {
      const cols = Object.keys(fields);
      const set = cols.map((c, i) => `${c} = $${i + 2}`).join(', ');
      await client.query(
        `UPDATE businesses SET ${set}, updated_at = now() WHERE id = $1`,
        [id, ...cols.map((c) => fields[c])]
      );
    }
    for (let i = 0; i < loserIds.length; i += 500) {
      await client.query(
        `UPDATE businesses SET status = 'duplicate', updated_at = now() WHERE id = ANY($1)`,
        [loserIds.slice(i, i + 500)]
      );
    }
    const purgeIds = purge.map((b) => b.id);
    for (let i = 0; i < purgeIds.length; i += 500) {
      await client.query(
        `UPDATE businesses SET status = 'delisted_no_logo', updated_at = now() WHERE id = ANY($1)`,
        [purgeIds.slice(i, i + 500)]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }

  const after = await client.query(`SELECT status, COUNT(*) FROM businesses GROUP BY status ORDER BY 2 DESC`);
  console.log('\nApplied. Status counts now:', JSON.stringify(after.rows));
  await client.end();
}

main().catch((err) => { console.error(err); process.exit(1); });
