const { Pool } = require('pg');

// Standalone towns that should be suburbs of larger cities
const STANDALONE_FIXES = [
  { name: 'Blair Athol', state: 'NSW', parent_city: 'Sydney' },
  { name: 'Enmore', state: 'NSW', parent_city: 'Sydney' },
  { name: 'Glendale', state: 'NSW', parent_city: 'Newcastle' },
  { name: 'Griffith', state: 'NSW', parent_city: 'Griffith' }, // Griffith is its own city
  { name: 'Killarney Vale', state: 'NSW', parent_city: 'Newcastle' },
  { name: 'Melville', state: 'WA', parent_city: 'Perth' },
  { name: 'Millicent', state: 'SA', parent_city: 'Mount Gambier' },
  { name: 'Mount Gambier', state: 'SA', parent_city: 'Mount Gambier' }, // Regional city
  { name: 'Nilgen', state: 'WA', parent_city: 'Perth' },
  { name: 'Queanbeyan', state: 'NSW', parent_city: 'Canberra' },
  { name: 'Terranora', state: 'NSW', parent_city: 'Gold Coast' }, // Near Gold Coast/Tweed Heads
  { name: 'The Rocks', state: 'NSW', parent_city: 'Sydney' }
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fixStandaloneTowns() {
  console.log('Fixing standalone towns incorrectly marked as cities...');
  
  for (const fix of STANDALONE_FIXES) {
    console.log(`\nProcessing ${fix.name}, ${fix.state} -> parent: ${fix.parent_city}`);
    
    // Update locations_reference
    const lrResult = await pool.query(
      `UPDATE locations_reference 
       SET type = 'suburb', 
           parent_city_name = $1,
           correct_url_pattern = 'suburb',
           updated_at = NOW()
       WHERE name = $2 AND state_code = $3`,
      [fix.parent_city, fix.name, fix.state]
    );
    
    console.log(`  locations_reference: ${lrResult.rowCount} rows updated`);
    
    // Update businesses to use the parent city
    const bizResult = await pool.query(
      `UPDATE businesses 
       SET city = $1 
       WHERE city = $2 AND state = $3`,
      [fix.parent_city, fix.name, fix.state]
    );
    
    console.log(`  businesses: ${bizResult.rowCount} rows updated`);
  }
  
  console.log('\n✅ Standalone towns fix complete!');
}

async function main() {
  try {
    await fixStandaloneTowns();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
