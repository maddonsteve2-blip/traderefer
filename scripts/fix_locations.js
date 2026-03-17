/**
 * FIX LOCATION DATA — Master Script
 * 
 * Phases:
 *   1. Import all places from au_location_lookup.json into locations_reference table
 *   2. Match existing businesses to reference (name+state, postcode+name, name-only)
 *   3. Identify mismatches (wrong state, wrong parent city, suburb-as-city)
 *   4. Fix businesses table and create 301 redirects
 *   5. Verify and output summary
 *
 * Usage:
 *   node scripts/fix_locations.js                          (full run)
 *   node scripts/fix_locations.js --dry-run                (preview only, no writes)
 *   node scripts/fix_locations.js --phase import           (only import JSON)
 *   node scripts/fix_locations.js --phase match            (only match + fix)
 *   node scripts/fix_locations.js --phase verify           (only verify)
 */

const pg = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'apps', 'web', '.env.local') });

const DRY_RUN = process.argv.includes('--dry-run');
const PHASE = (() => {
  const idx = process.argv.indexOf('--phase');
  return idx !== -1 ? process.argv[idx + 1] : 'all';
})();

const JSON_PATH = process.argv.find(a => a.endsWith('.json')) 
  || 'C:\\Users\\61479\\Downloads\\serviceseeking2\\au_location_lookup.json';

const STATE_SLUGS = {
  'ACT': 'australian-capital-territory',
  'NSW': 'new-south-wales',
  'NT': 'northern-territory',
  'QLD': 'queensland',
  'SA': 'south-australia',
  'TAS': 'tasmania',
  'VIC': 'victoria',
  'WA': 'western-australia'
};

function slugify(text) {
  if (!text) return '';
  return text.toLowerCase()
    .replace(/['']/g, '')
    .replace(/&/g, 'and')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function extractPostcode(address) {
  if (!address) return null;
  // Australian postcodes are 4 digits, typically at the end or before state
  const match = address.match(/\b(\d{4})\b/);
  return match ? match[1] : null;
}

// ─── COUNTERS ───
const stats = {
  imported: 0,
  importSkipped: 0,
  matchedByPostcodeName: 0,
  matchedByNameState: 0,
  matchedByNameOnly: 0,
  unmatched: 0,
  wrongState: 0,
  wrongParentCity: 0,
  suburbAsCity: 0,
  businessesUpdated: 0,
  redirectsCreated: 0,
  markedActive: 0,
  verificationMismatches: 0,
};

async function main() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  console.log('Connected to database.');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE'}`);
  console.log(`Phase: ${PHASE}`);
  console.log('');

  // Load JSON
  console.log(`Loading JSON from ${JSON_PATH}...`);
  const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
  console.log(`Loaded. Stats from file: ${JSON.stringify(data._STATS, null, 2)}`);
  console.log('');

  try {
    if (PHASE === 'all' || PHASE === 'import') {
      await phaseImport(client, data);
    }
    if (PHASE === 'all' || PHASE === 'match') {
      await phaseMatchAndFix(client, data);
    }
    if (PHASE === 'all' || PHASE === 'verify') {
      await phaseVerify(client);
    }

    printSummary();
  } catch (err) {
    console.error('FATAL ERROR:', err);
  } finally {
    await client.end();
  }
}

// ═══════════════════════════════════════════════════════════════════
// PHASE 1: IMPORT all places from JSON into locations_reference
// ═══════════════════════════════════════════════════════════════════
async function phaseImport(client, data) {
  console.log('═══════════════════════════════════════════');
  console.log('PHASE 1: IMPORT locations_reference');
  console.log('═══════════════════════════════════════════');

  // Clear existing data
  if (!DRY_RUN) {
    await client.query('DELETE FROM locations_reference');
    console.log('Cleared existing locations_reference data.');
  }

  const byPostcodeName = data.by_postcode_name || {};
  const byNameState = data.by_name_state || {};

  // Track what we've imported to avoid duplicates
  const importedKeys = new Set(); // slug|state_code

  // Import from by_postcode_name first (primary source - has postcodes)
  console.log(`\nImporting from by_postcode_name (${Object.keys(byPostcodeName).length} entries)...`);
  const batchSize = 100;
  let batch = [];
  let count = 0;

  for (const [key, entry] of Object.entries(byPostcodeName)) {
    const dedupKey = `${(entry.slug || slugify(entry.name))}|${entry.state_code}`;
    if (importedKeys.has(dedupKey)) {
      stats.importSkipped++;
      continue;
    }
    importedKeys.add(dedupKey);

    batch.push(entry);
    if (batch.length >= batchSize) {
      await insertBatch(client, batch);
      count += batch.length;
      if (count % 1000 === 0) process.stdout.write(`  ${count} imported...\r`);
      batch = [];
    }
  }
  if (batch.length > 0) {
    await insertBatch(client, batch);
    count += batch.length;
  }
  console.log(`  ${count} imported from by_postcode_name.`);

  // Import from by_name_state for entries not already covered
  console.log(`\nImporting remaining from by_name_state (${Object.keys(byNameState).length} entries)...`);
  let extraCount = 0;
  batch = [];

  for (const [key, entry] of Object.entries(byNameState)) {
    const dedupKey = `${(entry.slug || slugify(entry.name))}|${entry.state_code}`;
    if (importedKeys.has(dedupKey)) {
      stats.importSkipped++;
      continue;
    }
    importedKeys.add(dedupKey);

    batch.push(entry);
    if (batch.length >= batchSize) {
      await insertBatch(client, batch);
      extraCount += batch.length;
      batch = [];
    }
  }
  if (batch.length > 0) {
    await insertBatch(client, batch);
    extraCount += batch.length;
  }
  console.log(`  ${extraCount} additional imported from by_name_state.`);

  stats.imported = count + extraCount;
  console.log(`\nTotal imported: ${stats.imported} (skipped ${stats.importSkipped} duplicates)`);

  // Verify import count
  if (!DRY_RUN) {
    const res = await client.query('SELECT COUNT(*) as cnt, COUNT(DISTINCT type) as types FROM locations_reference');
    console.log(`  DB count: ${res.rows[0].cnt}`);
    const typeRes = await client.query("SELECT type, COUNT(*) as cnt FROM locations_reference GROUP BY type ORDER BY type");
    for (const r of typeRes.rows) {
      console.log(`    ${r.type}: ${r.cnt}`);
    }
  }
  console.log('');
}

async function insertBatch(client, batch) {
  if (DRY_RUN) return;
  
  // Build multi-row INSERT with parameterized values
  const values = [];
  const placeholders = [];
  let paramIdx = 1;

  for (const entry of batch) {
    const slug = entry.slug || slugify(entry.name);
    const stateCode = entry.state_code || '';
    const stateSlug = entry.state_slug || STATE_SLUGS[stateCode] || slugify(stateCode);
    
    placeholders.push(
      `($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++})`
    );
    values.push(
      entry.name || '',
      slug,
      entry.postcode || null,
      entry.type || 'suburb',
      stateCode,
      stateSlug,
      entry.parent_city || null,
      entry.parent_city_slug || null,
      entry.parent_city_postcode || null,
      entry.population || 0,
      entry.correct_url_pattern || null,
      false
    );
  }

  const sql = `INSERT INTO locations_reference 
    (name, slug, postcode, type, state_code, state_slug, parent_city_name, parent_city_slug, parent_city_postcode, population, correct_url_pattern, is_active)
    VALUES ${placeholders.join(', ')}
    ON CONFLICT DO NOTHING`;

  await client.query(sql, values);
}

// ═══════════════════════════════════════════════════════════════════
// PHASE 2: MATCH existing businesses and FIX mismatches
// ═══════════════════════════════════════════════════════════════════
async function phaseMatchAndFix(client, data) {
  console.log('═══════════════════════════════════════════');
  console.log('PHASE 2: MATCH & FIX businesses');
  console.log('═══════════════════════════════════════════');

  const byPostcodeName = data.by_postcode_name || {};
  const byNameState = data.by_name_state || {};
  const byNameOnly = data.by_name_only || {};
  const ambiguousNames = new Set((data.ambiguous_names || []).map(n => (typeof n === 'string' ? n : n.name).toLowerCase()));

  // Get all unique suburb+city+state combos with their trade categories
  console.log('\nFetching unique suburb+city+state combos from businesses...');
  const combos = await client.query(`
    SELECT DISTINCT suburb, city, state 
    FROM businesses 
    WHERE status = 'active' AND suburb IS NOT NULL
    ORDER BY state, city, suburb
  `);
  console.log(`  Found ${combos.rows.length} unique suburb+city+state combos.`);

  // Also get a representative address per suburb+state for postcode extraction
  const addressMap = {};
  const addrRes = await client.query(`
    SELECT DISTINCT ON (suburb, state) suburb, state, address
    FROM businesses
    WHERE status = 'active' AND address IS NOT NULL
    ORDER BY suburb, state, address
  `);
  for (const row of addrRes.rows) {
    addressMap[`${row.suburb}|${row.state}`] = row.address;
  }

  const fixes = []; // Array of { suburb, oldCity, newCity, oldState, newState, reason, ref }
  const matched = new Set(); // Track matched reference entries
  const unmatchedList = [];

  console.log('\nMatching each suburb against reference...');
  for (const row of combos.rows) {
    const suburbName = row.suburb;
    const currentCity = row.city;
    const currentState = row.state;

    if (!suburbName) continue;

    // Try matching in priority order
    let ref = null;
    let matchMethod = '';

    // 1. Try name + state FIRST (most reliable since we trust state more than extracted postcode)
    const nsKey = `${suburbName.toLowerCase()}|${currentState.toLowerCase()}`;
    if (byNameState[nsKey]) {
      ref = byNameState[nsKey];
      matchMethod = 'name+state';
      stats.matchedByNameState++;
    }

    // 2. Try postcode + name (can detect wrong-state if postcode disagrees)
    if (!ref) {
      const address = addressMap[`${suburbName}|${currentState}`];
      const postcode = extractPostcode(address);
      if (postcode) {
        const key = `${postcode}|${suburbName.toLowerCase()}`;
        if (byPostcodeName[key]) {
          ref = byPostcodeName[key];
          matchMethod = 'postcode+name';
          stats.matchedByPostcodeName++;
        }
      }
    }

    // 3. Try name only (last resort, only if unambiguous AND same state)
    if (!ref) {
      const nameLower = suburbName.toLowerCase();
      if (!ambiguousNames.has(nameLower) && byNameOnly[nameLower]) {
        const candidate = byNameOnly[nameLower];
        // Only accept name-only match if state matches — too risky otherwise
        if (candidate.state_code.toUpperCase() === currentState.toUpperCase()) {
          ref = candidate;
          matchMethod = 'name-only';
          stats.matchedByNameOnly++;
        } else {
          // State mismatch on name-only — not safe to auto-fix
          stats.unmatched++;
          unmatchedList.push({ suburb: suburbName, city: currentCity, state: currentState, note: `name-only match found in ${candidate.state_code} but business is in ${currentState}` });
          continue;
        }
      }
    }

    if (!ref) {
      stats.unmatched++;
      unmatchedList.push({ suburb: suburbName, city: currentCity, state: currentState });
      continue;
    }

    // Track matched reference entry
    const refKey = `${ref.slug}|${ref.state_code}`;
    matched.add(refKey);

    // Determine the correct city for this suburb
    let correctCity = null;
    let correctCitySlug = null;
    let correctState = ref.state_code;
    let correctStateSlug = ref.state_slug;

    if (ref.type === 'city' || ref.type === 'standalone_town') {
      // This place IS a city/town — its "city" should be itself
      correctCity = ref.name;
      correctCitySlug = ref.slug;
    } else if (ref.type === 'suburb') {
      // This place is a suburb — it should be under parent_city
      correctCity = ref.parent_city;
      correctCitySlug = ref.parent_city_slug;
    }

    if (!correctCity) continue; // Safety check

    // Check for mismatches
    const stateMatch = currentState.toUpperCase() === correctState.toUpperCase();
    const cityMatch = currentCity && slugify(currentCity) === correctCitySlug;

    if (!stateMatch) {
      stats.wrongState++;
      fixes.push({
        suburb: suburbName,
        oldCity: currentCity,
        newCity: correctCity,
        oldState: currentState,
        newState: correctState,
        oldStateSlug: STATE_SLUGS[currentState] || slugify(currentState),
        newStateSlug: correctStateSlug,
        newCitySlug: correctCitySlug,
        reason: 'WRONG_STATE',
        matchMethod,
        ref
      });
    } else if (!cityMatch) {
      // Determine if it's suburb-as-city or wrong-parent
      if (ref.type === 'suburb' && slugify(currentCity) === ref.slug) {
        stats.suburbAsCity++;
        fixes.push({
          suburb: suburbName,
          oldCity: currentCity,
          newCity: correctCity,
          oldState: currentState,
          newState: correctState,
          oldStateSlug: STATE_SLUGS[currentState] || slugify(currentState),
          newStateSlug: correctStateSlug,
          newCitySlug: correctCitySlug,
          reason: 'SUBURB_AS_CITY',
          matchMethod,
          ref
        });
      } else {
        stats.wrongParentCity++;
        fixes.push({
          suburb: suburbName,
          oldCity: currentCity,
          newCity: correctCity,
          oldState: currentState,
          newState: correctState,
          oldStateSlug: STATE_SLUGS[currentState] || slugify(currentState),
          newStateSlug: correctStateSlug,
          newCitySlug: correctCitySlug,
          reason: 'WRONG_PARENT_CITY',
          matchMethod,
          ref
        });
      }
    }
    // else: match is correct, no fix needed
  }

  console.log(`\nMatching complete:`);
  console.log(`  Matched by postcode+name: ${stats.matchedByPostcodeName}`);
  console.log(`  Matched by name+state: ${stats.matchedByNameState}`);
  console.log(`  Matched by name-only: ${stats.matchedByNameOnly}`);
  console.log(`  Unmatched: ${stats.unmatched}`);
  console.log(`\nFixes needed:`);
  console.log(`  Wrong state: ${stats.wrongState}`);
  console.log(`  Suburb as city: ${stats.suburbAsCity}`);
  console.log(`  Wrong parent city: ${stats.wrongParentCity}`);
  console.log(`  Total fixes: ${fixes.length}`);

  // Log unmatched for manual review
  if (unmatchedList.length > 0) {
    console.log(`\n--- UNMATCHED (${unmatchedList.length}) — needs manual review ---`);
    for (const u of unmatchedList.slice(0, 50)) {
      console.log(`  ${u.suburb} | city=${u.city} | state=${u.state}${u.note ? ' | ' + u.note : ''}`);
    }
    if (unmatchedList.length > 50) {
      console.log(`  ... and ${unmatchedList.length - 50} more`);
    }
  }

  // Log all fixes
  if (fixes.length > 0) {
    console.log(`\n--- FIXES TO APPLY ---`);
    for (const fix of fixes) {
      const oldCitySlug = slugify(fix.oldCity);
      const suburbSlug = slugify(fix.suburb);
      console.log(`  [${fix.reason}] (via ${fix.matchMethod}) ${fix.suburb}:`);
      console.log(`    OLD: /local/${fix.oldStateSlug}/${oldCitySlug}/${suburbSlug}/...`);
      console.log(`    NEW: /local/${fix.newStateSlug}/${fix.newCitySlug}/${suburbSlug}/...`);
    }
  }

  // Apply fixes
  if (fixes.length > 0 && !DRY_RUN) {
    console.log('\n--- APPLYING FIXES ---');
    await applyFixes(client, fixes);
  }

  // Mark matched locations as is_active
  console.log('\n--- MARKING ACTIVE LOCATIONS ---');
  if (!DRY_RUN) {
    await markActiveLocations(client, combos.rows);
  }
}

async function applyFixes(client, fixes) {
  // Step 1: Get ALL trade categories for ALL affected suburbs in ONE query
  console.log('  Fetching all trade categories for affected suburbs...');
  const allTrades = await client.query(`
    SELECT DISTINCT suburb, city, state, trade_category 
    FROM businesses 
    WHERE status = 'active'
  `);
  
  // Build lookup: "suburb|city|state" -> [trade_categories]
  const tradeLookup = {};
  for (const row of allTrades.rows) {
    const key = `${row.suburb}|${row.city}|${row.state}`;
    if (!tradeLookup[key]) tradeLookup[key] = [];
    tradeLookup[key].push(row.trade_category);
  }
  console.log(`  Built trade lookup with ${Object.keys(tradeLookup).length} suburb combos.`);

  // Step 2: Generate all redirects in memory
  console.log('  Generating redirects in memory...');
  const redirects = []; // [{old_url, new_url, reason}]

  for (const fix of fixes) {
    const oldStateSlug = fix.oldStateSlug;
    const newStateSlug = fix.newStateSlug;
    const oldCitySlug = slugify(fix.oldCity);
    const newCitySlug = fix.newCitySlug;
    const suburbSlug = slugify(fix.suburb);

    // Suburb page redirect
    const oldSuburbUrl = `/local/${oldStateSlug}/${oldCitySlug}/${suburbSlug}`;
    const newSuburbUrl = `/local/${newStateSlug}/${newCitySlug}/${suburbSlug}`;
    if (oldSuburbUrl !== newSuburbUrl) {
      redirects.push({ old_url: oldSuburbUrl, new_url: newSuburbUrl, reason: fix.reason });
    }

    // Trade page redirects
    const tradeKey = `${fix.suburb}|${fix.oldCity}|${fix.oldState}`;
    const trades = tradeLookup[tradeKey] || [];
    for (const tc of trades) {
      const tradeSlug = slugify(tc);
      const oldUrl = `/local/${oldStateSlug}/${oldCitySlug}/${suburbSlug}/${tradeSlug}`;
      const newUrl = `/local/${newStateSlug}/${newCitySlug}/${suburbSlug}/${tradeSlug}`;
      if (oldUrl !== newUrl) {
        redirects.push({ old_url: oldUrl, new_url: newUrl, reason: fix.reason });
      }
    }
  }
  console.log(`  Generated ${redirects.length} redirects in memory.`);

  // Step 3: Batch insert redirects (batches of 200)
  console.log('  Inserting redirects into DB...');
  const rBatchSize = 200;
  for (let i = 0; i < redirects.length; i += rBatchSize) {
    const batch = redirects.slice(i, i + rBatchSize);
    const values = [];
    const placeholders = [];
    let pIdx = 1;
    for (const r of batch) {
      placeholders.push(`($${pIdx++}, $${pIdx++}, $${pIdx++})`);
      values.push(r.old_url, r.new_url, r.reason);
    }
    await client.query(
      `INSERT INTO location_redirects (old_url, new_url, reason) VALUES ${placeholders.join(', ')}
       ON CONFLICT (old_url) DO UPDATE SET new_url = EXCLUDED.new_url, reason = EXCLUDED.reason`,
      values
    );
    stats.redirectsCreated += batch.length;
    if ((i + rBatchSize) % 1000 === 0 || i + rBatchSize >= redirects.length) {
      console.log(`    ${Math.min(i + rBatchSize, redirects.length)}/${redirects.length} redirects inserted...`);
    }
  }

  // Step 4: Batch update businesses — group fixes by (newCity, newState, oldCity, oldState) to minimize queries
  console.log('  Updating businesses table...');
  const updateGroups = {};
  for (const fix of fixes) {
    const key = `${fix.newCity}||${fix.newState}||${fix.oldCity}||${fix.oldState}`;
    if (!updateGroups[key]) {
      updateGroups[key] = { ...fix, suburbs: [] };
    }
    updateGroups[key].suburbs.push(fix.suburb);
  }

  for (const [key, group] of Object.entries(updateGroups)) {
    const stateChanged = group.oldState.toUpperCase() !== group.newState.toUpperCase();
    
    // Build the suburbs array for ANY() 
    if (stateChanged) {
      const result = await client.query(
        `UPDATE businesses SET city = $1, state = $2, updated_at = NOW()
         WHERE suburb = ANY($3) AND city = $4 AND state = $5`,
        [group.newCity, group.newState, group.suburbs, group.oldCity, group.oldState]
      );
      stats.businessesUpdated += result.rowCount;
    } else {
      const result = await client.query(
        `UPDATE businesses SET city = $1, updated_at = NOW()
         WHERE suburb = ANY($2) AND city = $3 AND state = $4`,
        [group.newCity, group.suburbs, group.oldCity, group.oldState]
      );
      stats.businessesUpdated += result.rowCount;
    }
  }

  console.log(`  Businesses updated: ${stats.businessesUpdated}`);
  console.log(`  Redirects created: ${stats.redirectsCreated}`);
}

async function markActiveLocations(client, combos) {
  console.log('  Matching active suburbs to locations_reference...');
  let marked = 0;

  // Group by state for batched updates
  const byState = {};
  for (const row of combos) {
    if (!row.suburb) continue;
    const st = row.state.toUpperCase();
    if (!byState[st]) byState[st] = [];
    byState[st].push(row.suburb);
  }

  for (const [state, suburbs] of Object.entries(byState)) {
    // Batch: mark all suburbs for this state as active in one query
    const result = await client.query(
      `UPDATE locations_reference SET is_active = true, updated_at = NOW()
       WHERE LOWER(state_code) = LOWER($1) AND LOWER(name) = ANY(SELECT LOWER(unnest($2::text[]))) AND is_active = false`,
      [state, suburbs]
    );
    marked += result.rowCount;
  }

  stats.markedActive = marked;
  console.log(`  Marked ${marked} locations as active.`);
}

// ═══════════════════════════════════════════════════════════════════
// PHASE 3: VERIFY
// ═══════════════════════════════════════════════════════════════════
async function phaseVerify(client) {
  console.log('═══════════════════════════════════════════');
  console.log('PHASE 3: VERIFICATION');
  console.log('═══════════════════════════════════════════');

  // Check for remaining mismatches
  const mismatches = await client.query(`
    SELECT 
      lr.name,
      lr.postcode,
      lr.type AS correct_type,
      lr.state_code AS correct_state,
      lr.parent_city_slug AS correct_parent,
      b.state AS current_state,
      b.city AS current_city,
      CASE
        WHEN UPPER(lr.state_code) != UPPER(b.state) THEN 'WRONG STATE'
        WHEN lr.type = 'suburb' AND lr.parent_city_slug IS NOT NULL 
             AND lr.parent_city_slug != '' 
             AND LOWER(REPLACE(REPLACE(REPLACE(b.city, ' ', '-'), '''', ''), '&', 'and')) != lr.parent_city_slug 
             THEN 'WRONG PARENT CITY'
        ELSE 'OK'
      END AS issue
    FROM locations_reference lr
    JOIN (
      SELECT DISTINCT suburb, city, state FROM businesses WHERE status = 'active'
    ) b ON LOWER(lr.name) = LOWER(b.suburb) AND UPPER(lr.state_code) = UPPER(b.state)
    WHERE lr.is_active = true
      AND (
        UPPER(lr.state_code) != UPPER(b.state)
        OR (lr.type = 'suburb' AND lr.parent_city_slug IS NOT NULL AND lr.parent_city_slug != '' 
            AND LOWER(REPLACE(REPLACE(REPLACE(b.city, ' ', '-'), '''', ''), '&', 'and')) != lr.parent_city_slug)
      )
    ORDER BY lr.name
  `);

  stats.verificationMismatches = mismatches.rows.length;

  if (mismatches.rows.length === 0) {
    console.log('  ✅ ZERO mismatches remaining! All locations are correct.');
  } else {
    console.log(`  ⚠️  ${mismatches.rows.length} mismatches remaining:`);
    for (const m of mismatches.rows.slice(0, 30)) {
      console.log(`    ${m.name}: ${m.issue} — correct_state=${m.correct_state} current=${m.current_state}, correct_parent=${m.correct_parent} current_city=${m.current_city}`);
    }
    if (mismatches.rows.length > 30) {
      console.log(`    ... and ${mismatches.rows.length - 30} more`);
    }
  }

  // Additional stats
  const refCount = await client.query('SELECT COUNT(*) as cnt FROM locations_reference');
  const activeCount = await client.query('SELECT COUNT(*) as cnt FROM locations_reference WHERE is_active = true');
  const redirectCount = await client.query('SELECT COUNT(*) as cnt FROM location_redirects');
  const bizCount = await client.query("SELECT COUNT(*) as cnt FROM businesses WHERE status = 'active'");

  console.log(`\n  Reference table: ${refCount.rows[0].cnt} total entries`);
  console.log(`  Active locations: ${activeCount.rows[0].cnt}`);
  console.log(`  Redirects stored: ${redirectCount.rows[0].cnt}`);
  console.log(`  Active businesses: ${bizCount.rows[0].cnt}`);
  console.log('');
}

// ═══════════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════════
function printSummary() {
  console.log('═══════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════════');
  console.log(`  Total places imported to locations_reference: ${stats.imported}`);
  console.log(`  Duplicates skipped during import: ${stats.importSkipped}`);
  console.log(`  ---`);
  console.log(`  Matched by postcode+name: ${stats.matchedByPostcodeName}`);
  console.log(`  Matched by name+state: ${stats.matchedByNameState}`);
  console.log(`  Matched by name-only: ${stats.matchedByNameOnly}`);
  console.log(`  Unmatched (manual review): ${stats.unmatched}`);
  console.log(`  ---`);
  console.log(`  Wrong state fixes: ${stats.wrongState}`);
  console.log(`  Suburb-as-city fixes: ${stats.suburbAsCity}`);
  console.log(`  Wrong parent city fixes: ${stats.wrongParentCity}`);
  console.log(`  ---`);
  console.log(`  Businesses updated: ${stats.businessesUpdated}`);
  console.log(`  301 Redirects created: ${stats.redirectsCreated}`);
  console.log(`  Locations marked active: ${stats.markedActive}`);
  console.log(`  ---`);
  console.log(`  Verification mismatches remaining: ${stats.verificationMismatches}`);
  console.log(`  ${stats.verificationMismatches === 0 ? '✅ ALL CLEAR' : '⚠️  NEEDS ATTENTION'}`);
}

main().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});
