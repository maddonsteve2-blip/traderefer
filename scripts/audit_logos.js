/**
 * Fetches every logo_url, checks if it's a real image (>2KB),
 * and nulls out placeholder/broken ones in the DB.
 */
const { neon } = require("@neondatabase/serverless");
require("dotenv").config({ path: "apps/web/.env.local" });

const sql = neon(process.env.DATABASE_URL);
const PLACEHOLDER_MAX_BYTES = 2000; // Google's default silhouette is ~868 bytes
const CONCURRENCY = 10;

async function checkUrl(url) {
    try {
        const res = await fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0 (compatible; TradeRefer/1.0)" },
            signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) return { ok: false, size: 0 };
        const ct = res.headers.get("content-type") || "";
        if (!ct.startsWith("image/")) return { ok: false, size: 0 };
        const buf = await res.arrayBuffer();
        return { ok: buf.byteLength > PLACEHOLDER_MAX_BYTES, size: buf.byteLength };
    } catch {
        return { ok: false, size: 0 };
    }
}

async function run() {
    const rows = await sql`SELECT id, logo_url FROM businesses WHERE logo_url IS NOT NULL`;
    console.log(`Checking ${rows.length} logos...`);

    let real = 0, placeholder = 0, failed = 0;
    const nullIds = [];

    // Process in batches
    for (let i = 0; i < rows.length; i += CONCURRENCY) {
        const batch = rows.slice(i, i + CONCURRENCY);
        const results = await Promise.all(batch.map(r => checkUrl(r.logo_url)));
        for (let j = 0; j < batch.length; j++) {
            const { ok, size } = results[j];
            if (ok) {
                real++;
            } else if (size === 0) {
                failed++;
                nullIds.push(batch[j].id);
            } else {
                placeholder++;
                nullIds.push(batch[j].id);
            }
        }
        process.stdout.write(`\r${i + batch.length}/${rows.length} checked — ${real} real, ${placeholder} placeholders, ${failed} failed`);
    }

    console.log(`\n\nResults: ${real} real logos, ${placeholder} placeholders, ${failed} unreachable`);
    console.log(`Nulling out ${nullIds.length} entries...`);

    if (nullIds.length > 0) {
        // Batch update in chunks of 100
        for (let i = 0; i < nullIds.length; i += 100) {
            const chunk = nullIds.slice(i, i + 100);
            await sql`UPDATE businesses SET logo_url = NULL WHERE id = ANY(${chunk}::uuid[])`;
        }
        console.log(`Done — ${nullIds.length} logo_urls set to NULL`);
    }
    console.log(`${real} real logos remain in the database`);
}

run().catch(console.error);
