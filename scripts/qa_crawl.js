/**
 * QA crawler for traderefer.au — BFS over internal links from seed pages,
 * recording status codes, redirect targets, and collecting external links.
 * Read-only (GET), concurrency-capped, ~450 URL budget.
 */
const BASE = "https://traderefer.au";
const MAX_URLS = 450;
const CONCURRENCY = 8;
const CRAWL_DEPTH = 2; // extract links from pages at depth < CRAWL_DEPTH

const SEEDS = [
  "/", "/local", "/locations", "/categories", "/businesses", "/about",
  "/support", "/contact", "/claim", "/compare", "/quotes", "/rewards",
  "/privacy", "/terms", "/cookies", "/remove", "/register", "/login", "/signup",
  "/find-a-plumber-near-me", "/find-an-electrician-near-me",
  "/trades/plumbing", "/trades/electrical", "/trades/blocked-drain-repair",
  "/local/vic", "/local/vic/geelong", "/local/vic/geelong/armstrong-creek-3217",
  "/local/vic/geelong/armstrong-creek-3217/carpentry",
  "/local/vic/geelong/armstrong-creek-3217/carpentry/timber-deck-construction",
  "/top/plumbing/vic/geelong", "/b/nortova-carpentry-armstrong-creek",
  "/local/nsw", "/local/nsw/sydney", "/local/qld/brisbane", "/local/wa/perth",
];

const queue = SEEDS.map((p) => ({ path: p, depth: 0, from: "(seed)" }));
const seen = new Set(SEEDS);
const results = []; // {path, status, redirect, from}
const externals = new Map(); // url -> from

function normalize(href, fromPath) {
  try {
    const u = new URL(href, BASE + fromPath);
    if (u.origin !== BASE) return { external: u.href };
    let p = u.pathname;
    if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
    if (/\.(png|jpg|jpeg|svg|ico|css|js|webp|woff2?)$/i.test(p)) return null;
    if (p.startsWith("/_next") || p.startsWith("/ingest") || p.startsWith("/api/")) return null;
    return { internal: p + (u.search && p === "/businesses" ? u.search : "") };
  } catch { return null; }
}

async function fetchOne(item) {
  const url = BASE + item.path;
  try {
    const res = await fetch(url, {
      redirect: "manual",
      headers: { "User-Agent": "TradeReferQA/1.0 (internal link check)" },
      signal: AbortSignal.timeout(25000),
    });
    const status = res.status;
    const redirect = res.headers.get("location") || "";
    let html = "";
    if (status === 200 && item.depth < CRAWL_DEPTH && (res.headers.get("content-type") || "").includes("text/html")) {
      html = await res.text();
    } else {
      try { res.body?.cancel?.(); } catch { /* noop */ }
    }
    results.push({ path: item.path, status, redirect, from: item.from });

    if (html) {
      const hrefs = [...html.matchAll(/href="([^"#]+)"/g)].map((m) => m[1]);
      for (const h of hrefs) {
        const n = normalize(h, item.path);
        if (!n) continue;
        if (n.external) {
          if (!externals.has(n.external)) externals.set(n.external, item.path);
          continue;
        }
        if (!seen.has(n.internal) && seen.size < MAX_URLS) {
          seen.add(n.internal);
          queue.push({ path: n.internal, depth: item.depth + 1, from: item.path });
        }
      }
    }
  } catch (e) {
    results.push({ path: item.path, status: 0, redirect: "", from: item.from, error: String(e).slice(0, 80) });
  }
}

async function main() {
  while (queue.length) {
    const batch = queue.splice(0, CONCURRENCY);
    await Promise.all(batch.map(fetchOne));
    if (results.length % 80 < CONCURRENCY) console.error(`  ...${results.length} checked, ${queue.length} queued`);
  }

  const bad = results.filter((r) => r.status >= 400 || r.status === 0);
  const redirects = results.filter((r) => r.status >= 300 && r.status < 400);

  console.log(`\n== Crawled ${results.length} internal URLs`);
  console.log(`OK(2xx): ${results.filter((r) => r.status >= 200 && r.status < 300).length}`);
  console.log(`Redirects(3xx): ${redirects.length}`);
  console.log(`BROKEN(4xx/5xx/err): ${bad.length}`);
  if (bad.length) {
    console.log("\n-- BROKEN:");
    for (const b of bad) console.log(`  ${b.status} ${b.path}  (linked from ${b.from}) ${b.error || ""}`);
  }
  if (redirects.length) {
    console.log("\n-- REDIRECTS (internal links pointing at non-canonical URLs):");
    for (const r of redirects.slice(0, 40)) console.log(`  ${r.status} ${r.path} -> ${r.redirect}  (from ${r.from})`);
  }

  console.log(`\n== External links found: ${externals.size}`);
  const extResults = [];
  const extList = [...externals.entries()].slice(0, 60);
  for (let i = 0; i < extList.length; i += CONCURRENCY) {
    await Promise.all(extList.slice(i, i + CONCURRENCY).map(async ([url, from]) => {
      try {
        let res = await fetch(url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(20000), headers: { "User-Agent": "Mozilla/5.0 (compatible; TradeReferQA/1.0)" } });
        if (res.status === 405 || res.status === 403) {
          res = await fetch(url, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(20000), headers: { "User-Agent": "Mozilla/5.0 (compatible; TradeReferQA/1.0)" } });
          try { res.body?.cancel?.(); } catch { /* noop */ }
        }
        extResults.push({ url, status: res.status, from });
      } catch (e) {
        extResults.push({ url, status: 0, from, error: String(e).slice(0, 60) });
      }
    }));
  }
  const extBad = extResults.filter((r) => r.status >= 400 || r.status === 0);
  console.log(`External BROKEN: ${extBad.length}`);
  for (const b of extBad) console.log(`  ${b.status} ${b.url}  (from ${b.from}) ${b.error || ""}`);
}

main();
