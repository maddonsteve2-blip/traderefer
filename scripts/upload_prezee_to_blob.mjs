/**
 * Fetch Prezzee product catalogue → download card images → upload to Vercel Blob
 * Outputs: scripts/prezee-blob-index.json  (array of { name, slug, imageUrl })
 *
 * Run from: c:\Users\61479\Documents\trade-refer-stitch\apps\web
 *   node ../../scripts/upload_prezee_to_blob.mjs
 */
import { put } from "@vercel/blob";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env from apps/web/.env.local
const envFile = readFileSync(join(__dirname, "../apps/web/.env.local"), "utf-8");
for (const line of envFile.split("\n")) {
    const [key, ...rest] = line.split("=");
    if (key && rest.length) {
        process.env[key.trim()] = rest.join("=").trim().replace(/^"|"$/g, "");
    }
}
// Also load .env.blob for BLOB token if not already loaded
const blobEnvPath = join(__dirname, "../apps/web/.env.blob");
if (existsSync(blobEnvPath)) {
    const blobEnv = readFileSync(blobEnvPath, "utf-8");
    for (const line of blobEnv.split("\n")) {
        const [key, ...rest] = line.split("=");
        if (key && rest.length && !process.env[key.trim()]) {
            process.env[key.trim()] = rest.join("=").trim().replace(/^"|"$/g, "");
        }
    }
}

const PREZZEE_API = "https://partner-api.prezzee.com/v2/products";
const PREZZEE_USER = "prezzee";
const PREZZEE_PASS = "wkn1hdt*DCX.wfu*ywy";
const AUTH_HEADER = `Basic ${Buffer.from(`${PREZZEE_USER}:${PREZZEE_PASS}`).toString("base64")}`;
const OUT_INDEX = join(__dirname, "prezee-blob-index.json");
const CONCURRENCY = 4;

async function fetchCatalogue() {
    const res = await fetch(PREZZEE_API, {
        headers: { Accept: "application/json", Authorization: AUTH_HEADER },
        signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`Catalogue fetch failed: ${res.status} ${await res.text()}`);
    const data = await res.json();
    const items = data?.data || data?.products || (Array.isArray(data) ? data : []);
    console.log(`  Catalogue returned ${items.length} products`);
    return items;
}

async function downloadImage(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": "TradeRefer/1.0" },
        signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "image/png";
    if (!ct.startsWith("image/")) return null;
    const buf = await res.arrayBuffer();
    if (buf.byteLength < 500) return null; // skip tiny/broken images
    return { buffer: buf, contentType: ct };
}

function slugify(name) {
    return (name || "card")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

function getImageUrl(product) {
    // Try various field names the API might use
    return (
        product.image_url ||
        product.imageUrl ||
        product.image ||
        product.thumbnail_url ||
        product.thumbnail ||
        product.card_image_url ||
        null
    );
}

async function processChunk(chunk, existingBySlug) {
    const results = [];
    for (const product of chunk) {
        const name = product.name || product.product_name || product.title || `Card ${product.id}`;
        const slug = slugify(name);
        const imageUrl = getImageUrl(product);

        if (!imageUrl) {
            console.log(`  skip (no image): ${name}`);
            continue;
        }

        // If already uploaded, reuse
        if (existingBySlug[slug]) {
            results.push({ name, slug, imageUrl: existingBySlug[slug], categories: product.categories || [] });
            continue;
        }

        try {
            const img = await downloadImage(imageUrl);
            if (!img) {
                console.log(`  skip (download failed): ${name}`);
                continue;
            }

            const ext = img.contentType.includes("png") ? "png" : img.contentType.includes("svg") ? "svg" : "jpg";
            const blobPath = `prezee-cards/${slug}.${ext}`;
            const blob = await put(blobPath, img.buffer, {
                access: "public",
                contentType: img.contentType,
            });

            console.log(`  ✓ ${name} → ${blob.url}`);
            results.push({ name, slug, imageUrl: blob.url, categories: product.categories || [] });
        } catch (e) {
            console.warn(`  ✗ ${name}: ${e.message}`);
        }
    }
    return results;
}

async function main() {
    console.log("Fetching Prezzee product catalogue...");
    let products = [];
    try {
        products = await fetchCatalogue();
    } catch (e) {
        console.error(`Failed to fetch catalogue: ${e.message}`);
        process.exit(1);
    }

    if (products.length === 0) {
        console.error("No products returned from catalogue.");
        process.exit(1);
    }

    // Load existing index to skip already-uploaded images
    let existing = [];
    if (existsSync(OUT_INDEX)) {
        try { existing = JSON.parse(readFileSync(OUT_INDEX, "utf-8")); } catch { existing = []; }
    }
    const existingBySlug = Object.fromEntries(existing.map(e => [e.slug, e.imageUrl]));
    console.log(`  ${existing.length} already in index, ${products.length - existing.length} to process`);

    const allResults = [...existing];
    const existingSlugs = new Set(existing.map(e => e.slug));

    const toProcess = products.filter(p => !existingSlugs.has(slugify(p.name || p.product_name || p.title || "")));

    // Process in chunks for concurrency
    for (let i = 0; i < toProcess.length; i += CONCURRENCY) {
        const chunk = toProcess.slice(i, i + CONCURRENCY);
        const chunkResults = await processChunk(chunk, existingBySlug);
        allResults.push(...chunkResults);

        // Save progress after each chunk
        writeFileSync(OUT_INDEX, JSON.stringify(allResults, null, 2));
        if (i % 20 === 0) console.log(`Progress: ${Math.min(i + CONCURRENCY, toProcess.length)}/${toProcess.length}`);
    }

    writeFileSync(OUT_INDEX, JSON.stringify(allResults, null, 2));
    console.log(`\nDone! ${allResults.length} cards in index → ${OUT_INDEX}`);
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });
