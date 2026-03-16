const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const env = fs.readFileSync(path.join(__dirname, '..', 'apps', 'api', '.env.local'), 'utf8');
const match = env.match(/DATABASE_URL=(.+)/);
if (!match) { console.error('No DATABASE_URL found'); process.exit(1); }
const dbUrl = match[1].trim().replace(/^["']|["']$/g, '');

const sql = `
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, endpoint)
);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
`;

async function main() {
    const client = new Client(dbUrl);
    await client.connect();
    await client.query(sql);
    console.log('Migration OK: push_subscriptions table created');
    await client.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
