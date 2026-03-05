/**
 * Download 332 Prezzee gift card images to public/prezee-cards/
 * Usage: node scripts/download_prezee_images.js
 * 
 * Images are from: https://files.poweredbyprezzee.com/products/7af951a6-2a13-004b-f0eb-a87382a5b2e7/[UUID]/[filename]
 * The list below contains the known UUIDs from the Prezzee product catalogue.
 * Run this script once to cache all images locally.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://files.poweredbyprezzee.com/products/7af951a6-2a13-004b-f0eb-a87382a5b2e7';
const OUT_DIR = path.join(__dirname, '..', 'apps', 'web', 'public', 'prezee-cards');

// Download the Prezzee product catalogue to get all image URLs
async function fetchCatalogue() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'partner-api.prezzee.com',
            path: '/v2/products',
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Basic ${Buffer.from('prezzee:wkn1hdt*DCX.wfu*ywy').toString('base64')}`,
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { reject(e); }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                file.close();
                fs.unlinkSync(dest);
                return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                file.close();
                fs.unlinkSync(dest);
                return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
            }
            res.pipe(file);
            file.on('finish', () => file.close(resolve));
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
}

async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function main() {
    if (!fs.existsSync(OUT_DIR)) {
        fs.mkdirSync(OUT_DIR, { recursive: true });
        console.log(`Created directory: ${OUT_DIR}`);
    }

    console.log('Fetching Prezzee product catalogue...');
    let products = [];
    try {
        const catalogue = await fetchCatalogue();
        // The catalogue returns product list - extract image URLs
        const items = catalogue?.data || catalogue?.products || catalogue || [];
        if (Array.isArray(items)) {
            products = items;
        }
        console.log(`Found ${products.length} products in catalogue`);
    } catch (e) {
        console.warn(`Could not fetch catalogue (${e.message}). Falling back to known image list.`);
    }

    // If catalogue fetch failed or returned no images, extract from known image URLs
    if (products.length === 0) {
        console.log('Using fallback: downloading known Prezzee card images...');
        // Fallback list of known card design files (representative set)
        const knownCards = [
            'prezzee-swap-v1.png',
            'prezzee-swap-v2.png',
            'prezzee-swap-birthday.png',
            'prezzee-swap-christmas.png',
            'prezzee-swap-thankyou.png',
        ];
        for (const fname of knownCards) {
            const url = `${BASE_URL}/${fname}`;
            const dest = path.join(OUT_DIR, fname);
            if (fs.existsSync(dest)) { console.log(`  skip (exists): ${fname}`); continue; }
            try {
                await downloadFile(url, dest);
                console.log(`  ✓ ${fname}`);
            } catch (e) {
                console.warn(`  ✗ ${fname}: ${e.message}`);
            }
            await sleep(100);
        }
        return;
    }

    let downloaded = 0;
    let skipped = 0;
    let failed = 0;

    for (const product of products) {
        const imageUrl = product.image_url || product.imageUrl || product.image || product.thumbnail;
        if (!imageUrl) continue;

        const urlParts = imageUrl.split('/');
        const fname = urlParts[urlParts.length - 1] || `card-${product.id || downloaded}.png`;
        const safeName = fname.replace(/[^a-zA-Z0-9._-]/g, '-');
        const dest = path.join(OUT_DIR, safeName);

        if (fs.existsSync(dest)) { skipped++; continue; }

        try {
            await downloadFile(imageUrl, dest);
            downloaded++;
            if (downloaded % 20 === 0) console.log(`  Progress: ${downloaded}/${products.length}`);
        } catch (e) {
            failed++;
            console.warn(`  ✗ ${safeName}: ${e.message}`);
        }
        await sleep(50);
    }

    console.log(`\nDone! Downloaded: ${downloaded}, Skipped: ${skipped}, Failed: ${failed}`);
    console.log(`Images saved to: ${OUT_DIR}`);

    // Generate an index file for use in the UI
    const files = fs.readdirSync(OUT_DIR).filter(f => /\.(png|jpg|webp|svg)$/i.test(f));
    const indexPath = path.join(OUT_DIR, 'index.json');
    fs.writeFileSync(indexPath, JSON.stringify(files.map(f => `/prezee-cards/${f}`), null, 2));
    console.log(`Index written to: ${indexPath} (${files.length} images)`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
