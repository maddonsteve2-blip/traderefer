
const postgres = require('postgres');
const DATABASE_URL = "postgresql://neondb_owner:npg_qsxKWSvGyk65@ep-steep-violet-aikad8l7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function test() {
    console.log("Testing connection...");
    const sql = postgres(DATABASE_URL, { ssl: 'require' });
    try {
        const result = await sql`SELECT 1 as test`;
        console.log("Connection successful:", result);
    } catch (err) {
        console.error("Connection failed:", err);
    } finally {
        await sql.end();
    }
}

test();
