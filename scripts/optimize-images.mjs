import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PUBLIC_DIR = join(__dirname, '..', 'apps', 'web', 'public', 'images');

// Ensure output dir exists
if (!existsSync(PUBLIC_DIR)) mkdirSync(PUBLIC_DIR, { recursive: true });

function download(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function convertToWebP(inputBuffer, outputPath, opts = {}) {
  const result = await sharp(inputBuffer)
    .webp({ quality: opts.quality || 75 })
    .resize(opts.width || undefined, opts.height || undefined, { fit: 'cover' })
    .toFile(outputPath);
  return result;
}

// ── 1. Hero Image ──
async function optimizeHero() {
  const heroPath = join(PUBLIC_DIR, 'hero-construction.jpg');
  const heroWebP = join(PUBLIC_DIR, 'hero-construction.webp');
  
  console.log('\n── Hero Image ──');
  const original = readFileSync(heroPath);
  console.log(`  Original: ${(original.length / 1024).toFixed(1)}KB (JPG)`);
  
  const result = await sharp(original)
    .resize(1200, 800, { fit: 'cover' })
    .webp({ quality: 70 })
    .toFile(heroWebP);
  
  console.log(`  Optimized: ${(result.size / 1024).toFixed(1)}KB (WebP)`);
  console.log(`  Saved: ${((1 - result.size / original.length) * 100).toFixed(0)}%`);
}

// ── 2. Prezzee Card Images ──
const PREZZEE_CARDS = [
  { name: 'prezzee-smart-card', url: 'https://files.poweredbyprezzee.com/products/7af951a6-2a13-004b-f0eb-a87382a5b2e7/8eff8e56-2718-4514-8e1a-15ca1eb22793/Prezzee_3D_-_AU_%281%29_452_280.gif' },
  { name: 'groceries', url: 'https://files.poweredbyprezzee.com/products/7af951a6-2a13-004b-f0eb-a87382a5b2e7/e1ffa9be-102f-427c-b96d-4bcfe883f1e3/AU_Prezzee_Groceries_SKU_452_280.png' },
  { name: 'foodie', url: 'https://files.poweredbyprezzee.com/products/7af951a6-2a13-004b-f0eb-a87382a5b2e7/18ceb08f-a6ea-4676-80e0-a4044a0647c0/AU_Prezzee_Foodie_452_280.png' },
  { name: 'entertainment', url: 'https://files.poweredbyprezzee.com/products/7af951a6-2a13-004b-f0eb-a87382a5b2e7/91f8ddc2-9f41-47dd-b657-aef3dadb89f6/Prezzee_Entertainment_SKU_452_280.png' },
  { name: 'fuel', url: 'https://files.poweredbyprezzee.com/products/7af951a6-2a13-004b-f0eb-a87382a5b2e7/8375906a-b45f-4acc-8c1e-019a2df55842/Prezzee_Fuel_Category_452_280.png' },
  { name: 'travel', url: 'https://files.poweredbyprezzee.com/products/7af951a6-2a13-004b-f0eb-a87382a5b2e7/0517fd0a-e366-41f1-9a10-567eb7b4e698/Prezzee_Travel_SKU_452_280.png' },
  { name: 'luxury', url: 'https://files.poweredbyprezzee.com/products/7af951a6-2a13-004b-f0eb-a87382a5b2e7/9513c78c-2e6e-48a3-8db4-8f18fe3541ad/Prezzee_Luxury_Category_SKU_Updated_29725_452_280.png' },
  { name: 'bunnings', url: 'https://files.poweredbyprezzee.com/products/7af951a6-2a13-004b-f0eb-a87382a5b2e7/c587b0fd-e805-4640-aa0a-770928a2f2c0/Bunnings_Warehouse_Updated_452_280.jpg' },
  { name: 'chemist-warehouse', url: 'https://files.poweredbyprezzee.com/products/7af951a6-2a13-004b-f0eb-a87382a5b2e7/6b25c485-1b86-4ae4-9be6-5c83a843fbc2/CHEMIST_WAREHOUSE_AUD_452_280.jpg' },
  { name: 'coles', url: 'https://files.poweredbyprezzee.com/products/7af951a6-2a13-004b-f0eb-a87382a5b2e7/b3ff6a24-1cc8-4e46-8bf3-cc45e2d9c9c6/coles_gc_452_280.jpg' },
  { name: 'aesop', url: 'https://files.poweredbyprezzee.com/products/7af951a6-2a13-004b-f0eb-a87382a5b2e7/e2e08a45-a21b-4559-9265-df2225e65813/Aesop_452_280.png' },
  { name: 'asos', url: 'https://files.poweredbyprezzee.com/products/7af951a6-2a13-004b-f0eb-a87382a5b2e7/d51836b2-4416-4840-b9ff-5baacbb0dcbd/ASOS_452_280.png' },
];

async function optimizePrezzeeCards() {
  console.log('\n── Prezzee Card Images ──');
  const prezzeeDir = join(PUBLIC_DIR, 'prezzee');
  if (!existsSync(prezzeeDir)) mkdirSync(prezzeeDir, { recursive: true });

  let totalOriginal = 0;
  let totalOptimized = 0;

  for (const card of PREZZEE_CARDS) {
    try {
      console.log(`  Downloading: ${card.name}...`);
      const buffer = await download(card.url);
      totalOriginal += buffer.length;

      const outPath = join(prezzeeDir, `${card.name}.webp`);
      const result = await sharp(buffer, { animated: false }) // Take first frame of GIFs
        .resize(452, 280, { fit: 'cover' })
        .webp({ quality: 75 })
        .toFile(outPath);
      
      totalOptimized += result.size;
      console.log(`    ${(buffer.length / 1024).toFixed(1)}KB → ${(result.size / 1024).toFixed(1)}KB (${((1 - result.size / buffer.length) * 100).toFixed(0)}% saved)`);
    } catch (err) {
      console.error(`    ❌ Failed: ${card.name}`, err.message);
    }
  }

  console.log(`\n  Total: ${(totalOriginal / 1024).toFixed(1)}KB → ${(totalOptimized / 1024).toFixed(1)}KB (${((1 - totalOptimized / totalOriginal) * 100).toFixed(0)}% saved)`);
}

// ── Run ──
async function main() {
  console.log('🖼️  Image Optimization Script');
  console.log('============================');
  
  await optimizeHero();
  await optimizePrezzeeCards();
  
  console.log('\n✅ All done! Update your code to use the optimized images.');
}

main().catch(console.error);
