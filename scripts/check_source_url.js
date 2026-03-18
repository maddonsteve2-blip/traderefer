const { Pool } = require('pg');
require('dotenv').config({ path: 'apps/web/.env.local' });
const p = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
p.query("SELECT source_url, business_name FROM businesses WHERE data_source = 'Google Places' AND source_url IS NOT NULL LIMIT 5")
  .then(r => { console.log(JSON.stringify(r.rows, null, 2)); p.end(); })
  .catch(e => { console.error(e); p.end(); });
