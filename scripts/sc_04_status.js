
/**
 * TRADEREFER NATIONAL SCALER - SCRIPT 04
 * DASHBOARD & STATUS
 * 
 * Reports progress across all cities and categories.
 */

const postgres = require('postgres');

const DATABASE_URL = "postgresql://neondb_owner:npg_qsxKWSvGyk65@ep-steep-violet-aikad8l7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = postgres(DATABASE_URL);

async function report() {
    console.log("📊 DISCOVERY PROGRESS DASHBOARD\n" + "=".repeat(40));

    const [stats] = await sql`
        SELECT 
            COUNT(*) FILTER (WHERE status = 'pending') as pending,
            COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
            COUNT(*) FILTER (WHERE status = 'completed') as completed,
            COUNT(*) FILTER (WHERE status = 'failed') as failed,
            COUNT(*) as total
        FROM scrape_queue
    `;

    const bizCount = await sql`SELECT COUNT(*) FROM businesses`;
    const reviewCount = await sql`SELECT COUNT(*) FROM business_reviews`;

    console.log(`- Total Queue Items:   ${stats.total}`);
    console.log(`- ⏳ Pending:           ${stats.pending}`);
    console.log(`- 🔄 In Progress:       ${stats.in_progress}`);
    console.log(`- ✅ Completed:         ${stats.completed}`);
    console.log(`- ❌ Failed:            ${stats.failed}`);
    console.log("-".repeat(40));
    console.log(`- 🏢 Total Businesses:  ${bizCount[0].count}`);
    console.log(`- 💬 Total Reviews:     ${reviewCount[0].count}`);
    console.log("=".repeat(40));

    // Show recent failures
    const failures = await sql`SELECT city_name, trade_category, error_log FROM scrape_queue WHERE status = 'failed' LIMIT 5`;
    if (failures.length > 0) {
        console.log("\n⚠️ RECENT FAILURES:");
        failures.forEach(f => console.log(`- ${f.city_name} | ${f.trade_category}: ${f.error_log}`));
    }

    process.exit(0);
}

report();
