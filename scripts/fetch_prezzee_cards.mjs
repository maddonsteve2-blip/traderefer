/**
 * Fetch Prezzee product catalogue and generate CARDS array for rewards/page.tsx
 * Run: node scripts/fetch_prezzee_cards.mjs
 */
const USER = "prezzee";
const PASS = "wkn1hdt*DCX.wfu*ywy";
const AUTH = `Basic ${Buffer.from(`${USER}:${PASS}`).toString("base64")}`;

const ENDPOINTS = [
  "https://partner-api.prezzee.com/v2/products",
  "https://partner-api.prezzee.com/v3/products",
  "https://partner-api.prezzee.com/v1/products",
  "https://partner-api.prezzee.com/v2/gift-cards",
  "https://api.prezzee.com/v2/products",
  "https://prezzee.com.au/api/v3/products",
];

async function tryEndpoint(url) {
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: AUTH,
        "User-Agent": "TradeRefer/1.0",
      },
      signal: AbortSignal.timeout(10000),
    });
    console.log(`  ${url} → ${res.status}`);
    if (res.ok) {
      const data = await res.json();
      return data;
    }
    const text = await res.text();
    console.log(`  Body: ${text.slice(0, 200)}`);
  } catch (e) {
    console.log(`  ${url} → ERROR: ${e.message}`);
  }
  return null;
}

function getImageUrl(p) {
  return (
    p.image_url || p.imageUrl || p.image || p.thumbnail_url ||
    p.thumbnail || p.card_image_url || p.gift_card_image_url ||
    p.cardImageUrl || p.product_image || null
  );
}

function getName(p) {
  return p.name || p.product_name || p.title || p.display_name || `Card ${p.id}`;
}

async function main() {
  console.log("Trying Prezzee API endpoints...\n");

  let products = null;
  for (const url of ENDPOINTS) {
    const data = await tryEndpoint(url);
    if (data) {
      const items = data?.data || data?.products || data?.items ||
                    data?.gift_cards || (Array.isArray(data) ? data : []);
      if (items.length > 0) {
        console.log(`\n✓ Found ${items.length} products from ${url}`);
        products = items;
        break;
      }
      console.log(`  (no items in response - keys: ${Object.keys(data).join(", ")})`);
    }
  }

  if (!products) {
    console.log("\nAll endpoints failed. Trying public Prezzee store API...");
    // Try the consumer BFF
    try {
      const res = await fetch("https://prezzee.com.au/consumer-bff/v1/products?country=AU&pageSize=400", {
        headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(10000),
      });
      console.log(`  consumer-bff → ${res.status}`);
      if (res.ok) {
        const data = await res.json();
        console.log("  Keys:", Object.keys(data).join(", "));
        products = data?.data || data?.products || data?.items || (Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.log(`  consumer-bff → ERROR: ${e.message}`);
    }
  }

  if (!products || products.length === 0) {
    console.log("\n✗ Could not fetch product catalogue from any endpoint.");
    process.exit(1);
  }

  // Generate CARDS array entries
  const BASE = "https://files.poweredbyprezzee.com/products/7af951a6-2a13-004b-f0eb-a87382a5b2e7";
  const entries = [];
  for (const p of products) {
    const name = getName(p);
    const url = getImageUrl(p);
    if (!url) {
      console.log(`  skip (no image): ${name}`);
      continue;
    }
    entries.push({ name, url });
  }

  console.log(`\n✓ ${entries.length} cards with images\n`);
  console.log("// CARDS array for rewards/page.tsx:");
  console.log("const CARDS = [");
  for (const e of entries) {
    const name = e.name.replace(/"/g, '\\"');
    console.log(`  { name: "${name}", url: "${e.url}" },`);
  }
  console.log("];");
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });
