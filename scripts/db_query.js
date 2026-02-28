const pg = require('pg');
require('dotenv').config({ path: 'apps/web/.env.local' });
const c = new pg.Client(process.env.DATABASE_URL);
const query = process.argv[2];
c.connect()
  .then(() => c.query(query))
  .then(r => { console.log(JSON.stringify(r.rows, null, 2)); c.end(); })
  .catch(e => { console.error(e.message); c.end(); });
