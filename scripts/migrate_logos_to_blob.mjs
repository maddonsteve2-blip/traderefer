/**
 * Fetches every business logo from Google, uploads to Vercel Blob,
 * and saves the permanent blob URL back to the businesses table.
 * 
 * Run: node scripts/migrate_logos_to_blob.mjs
 * Requires: BLOB_READ_WRITE_TOKEN and DATABASE_URL in apps/web/.env.local
 */
import { put } from "@vercel/blob";
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

// Load env from apps/web/.env.local
const envFile = readFileSync(".env.local", "utf-8");
for (const line of envFile.split("\n")) {
    const [key, ...rest] = line.split("=");
    if (key && rest.length) {
        process.env[key.trim()] = rest.join("=").trim().replace(/^"|"$/g, "");
    }
}

const sql = neon(process.env.DATABASE_URL);
const CONCURRENCY = 5;
const MIN_REAL_BYTES = 2000; // <2KB = Google's generic silhouette placeholder

async function fetchImage(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; TradeRefer/1.0)" },
        signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (!ct.startsWith("image/")) return null;
    const buf = await res.arrayBuffer();
    return { buffer: buf, contentType: ct, size: buf.byteLength };
}

async function run() {
    const rows = await sql`
        SELECT id, slug, logo_url 
        FROM businesses 
        WHERE logo_url IS NOT NULL 
          AND logo_url NOT LIKE '%vercel-storage%'
          AND logo_url NOT LIKE '%blob.vercel%'
        ORDER BY id
    `;
    console.log(`Processing ${rows.length} logos...`);

    let uploaded = 0, skipped = 0, failed = 0;

    for (let i = 0; i < rows.length; i += CONCURRENCY) {
        const batch = rows.slice(i, i + CONCURRENCY);

        await Promise.all(batch.map(async (row) => {
            try {
                const img = await fetchImage(row.logo_url);
                if (!img) {
                    // Unreachable — null out
                    await sql`UPDATE businesses SET logo_url = NULL WHERE id = ${row.id}`;
                    failed++;
                    return;
                }
                if (img.size < MIN_REAL_BYTES) {
                    // Generic placeholder — null out
                    await sql`UPDATE businesses SET logo_url = NULL WHERE id = ${row.id}`;
                    skipped++;
                    return;
                }
                // Upload to Vercel Blob
                const ext = img.contentType.includes("png") ? "png" : "jpg";
                const blob = await put(`logos/${row.slug}.${ext}`, img.buffer, {
                    access: "public",
                    contentType: img.contentType,
                    addRandomSuffix: false,
                });
                await sql`UPDATE businesses SET logo_url = ${blob.url} WHERE id = ${row.id}`;
                uploaded++;
            } catch (e) {
                console.error(`\nFailed ${row.slug}: ${e.message}`);
                failed++;
            }
        }));

        process.stdout.write(`\r${i + batch.length}/${rows.length} — ${uploaded} uploaded, ${skipped} placeholders nulled, ${failed} failed`);
    }

    console.log(`\n\nDone! ${uploaded} logos saved to Vercel Blob, ${skipped} placeholders nulled, ${failed} failed`);
}

run().catch(console.error);
