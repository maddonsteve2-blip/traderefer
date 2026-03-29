/**
 * Quick test for Google Places API key validity
 * Run: node scripts/test-google-places-key.js
 */

const API_KEY = process.argv[2] || "AIzaSyBFzuPuULGXMP5psT7B_Uy4eXBEgpQMs6M";
const TEST_INPUT = "42 Main St, Sydney";

async function testAutocomplete() {
  console.log("\n[1] Testing Places Autocomplete API...");
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(TEST_INPUT)}&components=country:au&types=address&key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.status === "OK") {
    console.log(`  ✅ Autocomplete OK — ${data.predictions.length} results`);
    console.log(`     First result: "${data.predictions[0]?.description}"`);
    return data.predictions[0]?.place_id;
  } else {
    console.log(`  ❌ Autocomplete FAILED — status: ${data.status}`);
    if (data.error_message) console.log(`     Error: ${data.error_message}`);
    return null;
  }
}

async function testPlaceDetails(placeId) {
  if (!placeId) { console.log("\n[2] Skipping Place Details (no place_id)"); return; }
  console.log(`\n[2] Testing Place Details API (place_id: ${placeId})...`);
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=address_components,formatted_address&key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.status === "OK") {
    console.log(`  ✅ Place Details OK`);
    console.log(`     Formatted: "${data.result?.formatted_address}"`);
  } else {
    console.log(`  ❌ Place Details FAILED — status: ${data.status}`);
    if (data.error_message) console.log(`     Error: ${data.error_message}`);
  }
}

async function testJsApiRestrictions() {
  console.log("\n[3] Testing Maps JS API WITHOUT referrer (server-side simulation)...");
  const url = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&callback=Function.prototype`;
  const res = await fetch(url);
  const text = await res.text();
  const errMatch = text.match(/ApiNotActivatedMapError|InvalidKeyMapError|RefererNotAllowedMapError|MissingKeyMapError/);
  if (res.status === 200 && !errMatch) {
    console.log(`  ✅ Maps JS API OK (no referrer)`);
  } else {
    console.log(`  ❌ Maps JS API issue — ${errMatch?.[0] || `status ${res.status}`}`);
  }

  console.log("\n[3b] Testing Maps JS API WITH referrer: https://traderefer.au (browser simulation)...");
  const res2 = await fetch(url, { headers: { Referer: "https://traderefer.au/onboarding/referrer", Origin: "https://traderefer.au" } });
  const text2 = await res2.text();
  const errMatch2 = text2.match(/ApiNotActivatedMapError|InvalidKeyMapError|RefererNotAllowedMapError|MissingKeyMapError/);
  if (res2.status === 200 && !errMatch2) {
    console.log(`  ✅ Maps JS API OK (with traderefer.au referrer) — NO referrer restrictions blocking it`);
  } else {
    console.log(`  ❌ Maps JS API blocked with traderefer.au referrer — ${errMatch2?.[0] || `status ${res2.status}`}`);
    console.log(`     ⚠ KEY HAS REFERRER RESTRICTIONS — remove them in Google Cloud Console`);
  }

  console.log("\n[3c] Testing Autocomplete REST WITH referrer (simulates browser fetch)...");
  const acUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=42+Main+St+Sydney&components=country:au&types=address&key=${API_KEY}`;
  const res3 = await fetch(acUrl, { headers: { Referer: "https://traderefer.au/onboarding/referrer", Origin: "https://traderefer.au" } });
  const data3 = await res3.json();
  if (data3.status === "OK") {
    console.log(`  ✅ Autocomplete OK with referrer`);
  } else {
    console.log(`  ❌ Autocomplete FAILED with referrer — ${data3.status}: ${data3.error_message || ""}`);
  }
}

async function testKeyInfo() {
  console.log("\n[4] Checking key/quota via Geocoding API (sanity check)...");
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=Sydney+NSW+Australia&key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.status === "OK") {
    console.log(`  ✅ Geocoding OK — key is valid and active`);
  } else {
    console.log(`  ❌ Geocoding FAILED — status: ${data.status}`);
    if (data.error_message) console.log(`     Error: ${data.error_message}`);
  }
}

(async () => {
  console.log("=== Google Places API Key Test ===");
  console.log(`Key: ${API_KEY.slice(0, 10)}...${API_KEY.slice(-4)}`);

  try {
    const placeId = await testAutocomplete();
    await testPlaceDetails(placeId);
    await testJsApiRestrictions();
    await testKeyInfo();
  } catch (err) {
    console.error("\n❌ Unexpected error:", err.message);
  }

  console.log("\n=== Done ===\n");
})();
