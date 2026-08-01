# Build spec — `/trade-cost-index` (Australian Trade Job Cost Index)

Executes `LINK_PLAN.md` §5 (digital-PR data play). Written 2026-07-30 against the real
data layer in `apps/web/scripts/materials/` + the live schema (`schema.sql`) — every
number below was computed from the repo's actual data files on this date and must be
**recomputed from the live DB at build/send time**, not copied.

**Truth rule (governs this whole document):** every stat published on the page or used
in a pitch must be derivable from `materials` / `material_prices` / `job_materials` /
`retail_products`. Anything not yet derivable is marked ⛔ PLACEHOLDER with the date it
becomes real. Never fabricate; never imply a second retailer, regional coverage, or
trend history that doesn't exist yet.

---

## 1. What the dataset actually is (verified 2026-07-30)

| Fact | Value | Source |
|---|---|---|
| Canonical materials tracked | **160** across **30 trade categories** | `materials.json` |
| Job types mapped to materials | **148** | `job-materials.json` |
| Materials with a live retail price range | **122 of 160** | `samples.json` (ingested via `ingest-prices.mjs`) |
| Individual price points behind those ranges | **837** | `samples.json` (`sample_size` sum) |
| Scraped retail catalog (facts only: name/brand/price/category) | **55,064 products**, 7 top-level categories, median price **$41.30** — crawl still running, recount at publish | `retail-products.jsonl` |
| Retailer | **Bunnings only** | `sample_prices.py`, `crawl_catalog.py` |
| Sample vintage | **One snapshot, July 2026** | `sampled_at` in `material_prices` |
| Jobs where *every* required material has a price | **75 of 148** | computed (join `job-materials.json` × `samples.json`) |
| Jobs with ≥1 priced material | **134 of 148** | computed |

**Hard limits the page and pitches must respect:**

- **No month-on-month movement exists yet.** First trend stat becomes real after the
  August 2026 re-sample (~day 30). Until then the page is a *price benchmark*, not a
  *tracker* — say so.
- **No labour data in the DB.** `TRADE_COST_GUIDE` in `lib/constants.ts` is editorial
  industry-average rates ("based on industry averages" is already the on-page wording),
  not sampled data. Any materials-vs-labour framing must attribute the two sides
  separately (see pitch angle 4).
- **No regional/store-level pricing** → no state-by-state comparison, ever, until the
  data supports it (LINK_PLAN §5 already bans this).
- **Search-sample noise is real.** Known bad matches in today's data: `copper-pipe-15mm`
  low of $1.45 is a *saddle-clip 10-pack*, `security-camera-kit` low of $14 is an
  accessory, `sir-walter-turf` low of $7.64 is not per-m² turf. The QA gate in §4 is a
  publish blocker, not a nice-to-have.

---

## 2. Data shown on the page

All computed at request/build time from the live DB (same LATERAL latest-sample pattern
as `lib/materials.ts:getJobMaterials`), never hardcoded.

1. **Headline benchmark table — "What the materials for common trade jobs cost"**
   Top 15–20 jobs ranked by typical materials cost, drawn ONLY from the fully-priced
   pool (75 jobs today; grows as sampling covers the remaining 38 materials).
   Columns: job → required materials count → materials cost range (low–high, typical) →
   link to the job page. Today's top entries for reference (pre-QA, recompute):
   small bathroom renovation ~$550–$1,420 (8 materials), hot water system replacement
   ~$214–$614, interior painting ~$180–$653, EV charger install ~$179–$623,
   flat-pack kitchen install ~$334–$519.
2. **Category medians** — median typical price per trade category (30 categories,
   e.g. what a "typical plumbing line-item" costs vs electrical vs tiling).
3. **Price-spread spotlight** — 5–8 items where spec choice swings the cost hardest
   (same item, cheapest vs dearest current listing): basin mixer tap $13–$326,
   freestanding bath $46–$1,477, deadbolt $14–$499 (each must pass the §4 QA gate
   before appearing).
4. **Catalog scale stats** — N products tracked, N price points, N materials, N job
   types, retailer named, sampled month. These are the citation-bait fragments.
5. **One shareable chart image** (top-10 jobs by materials cost, horizontal bars)
   watermarked **"Source: traderefer.au/trade-cost-index"** — the §5
   graphic-replication tactic. Rendered to a static PNG at build (reuse the
   `og-image.ts` approach), plus a "download the chart" link.
6. **Freshness line** — reuse the exact `JobMaterialsCard.tsx` pattern:
   max(`sampled_at`) → "Prices sampled July 2026". Shown twice: under the H1 and in
   the methodology block.

---

## 3. Page structure (AEO rules)

Route: `apps/web/app/(public)/trade-cost-index/page.tsx` (server component, ISR daily).
Data access: new `lib/cost-index.ts` (aggregation queries only; return `[]`-safe like
`lib/materials.ts` so the page never 500s on DB failure).

Order on page:

1. **H1**: "Australian Trade Job Cost Index — what the materials for 148 common trade
   jobs cost" (page `<title>` short per the shortened-titles convention, e.g.
   "Trade Job Cost Index — Australia").
2. **Front-loaded answer block** (≤60 words, first thing after the H1): direct answer
   with number + date + source. Template:
   > "The retail materials for a small bathroom renovation cost **$550–$1,420** in
   > Australia as of **July 2026**, based on **837 live price points** across **122
   > building materials** sampled from Bunnings. This index tracks materials costs for
   > **148 common trade jobs**, updated monthly."
3. **Citable stat fragments** — each key stat as a standalone, quote-ready sentence in
   its own anchored element (`<p id="stat-bathroom-materials">` etc.), phrased so an
   LLM or journalist can lift it whole with attribution: number + unit + "as of
   [month]" + "TradeRefer Trade Cost Index". 6–10 of them, one per §2 data block.
   No stat may appear ONLY inside a chart image — every charted number also exists as
   HTML text.
4. **Headline table** (§2.1) — semantic `<table>`, no JS required to render, job names
   link to `/trades/[job]` pages (internal-link equity into the job-page cluster).
5. **Price-spread spotlight** (§2.3) + category medians (§2.2).
6. **Chart image** (§2.5) with visible source watermark and download link.
7. **Methodology** (H2: "Methodology and data source" — the honesty section):
   - Prices are **retail shelf prices from Bunnings** (named, not "major retailers" —
     n.b. the current `JobMaterialsCard` footer says "major Australian hardware
     retailers", plural; this page must be singular and specific, and consider
     aligning the card's wording in the same PR).
   - How sampled: automated monthly sampling of the retailer's public product listings;
     **55,000+ catalogued products**; per-material ranges = cheapest/median/dearest of
     up to 8 relevant matches (moving to percentile ranges over all linked catalog
     products as matching lands — `schema.sql` `retail_products.material_id`).
   - What the numbers are NOT: not trade/wholesale prices, not quotes, not labour
     (labour guidance on job pages is industry-average editorial, sourced separately),
     not regional. Quantities vary per job.
   - Update cadence: monthly re-sample (`sample_prices.py` → `ingest-prices.mjs`);
     history is append-only (`material_prices`), so trend lines start appearing from
     the second sample onward.
   - Contact: founder attribution ("Built in Geelong by TradeRefer") + email for
     journalists/data requests.
8. **FAQ block** (3–5 questions: "Are these trade prices?", "Where does the data come
   from?", "How often is it updated?", "Why do ranges vary so much?") — answers are the
   methodology restated; wire into the existing FAQPage JSON-LD pattern used on job
   pages.
9. **JSON-LD**: `Dataset` (name, description, temporalCoverage, dateModified =
   max(sampled_at), creator = TradeRefer, distribution → the page URL) + `WebPage` +
   `FAQPage`. `Dataset` is the one journalists' tools and AI engines key on.

**Indexing wiring (don't skip):**
- `lib/seo/index-policy.ts`: this page is a static editorial asset — full
  `index, follow` for ALL engines including googlebot (no gate input applies; confirm
  it doesn't inherit a directory gate).
- Add to BOTH sitemaps (curated Google + full Bing) in `lib/sitemaps.ts`.
- Confirm robots.txt allows AI crawlers (GPTBot/ClaudeBot/PerplexityBot) on this path —
  citation by AI engines is half the point (LINK_PLAN §1).
- On publish: push the URL through Omega Indexer (`oi`) per the recovery-plan rule.

---

## 4. Publish-blocking QA gate (truth rule enforcement)

Before the page ships and before ANY pitch email goes out:

1. **Outlier sweep**: for every material surfaced on the page, eyeball the
   `examples` titles in `samples.json` (or linked `retail_products` rows) and confirm
   low/high match the canonical item, not an accessory/fitting. Known offenders today:
   `copper-pipe-15mm`, `security-camera-kit`, `sir-walter-turf`, `pool-pump`,
   `irrigation-controller`, `timber-picket` (all have >25× low→high ratios — that's a
   match-noise signature, not a market fact). Suppress or re-sample; never publish a
   number you can't defend to a journalist in one email.
2. **Prefer catalog percentiles over search samples** wherever a material has linked
   `retail_products` rows (the schema's stated intent) — p10/p50/p90 across all linked
   SKUs is far more defensible than 8 search results.
3. **Recount everything** (materials, samples, products, jobs) from the live DB into
   the page's stat fragments — the counts in this spec are 2026-07-30 file snapshots
   and the crawl was still running when counted.
4. **Cross-check the two headline jobs** (bathroom reno, hot water) by hand against
   bunnings.com.au before first send — these are the numbers journalists will spot-check.

---

## 5. Five pitch angles

Every stat below is derivable today unless marked ⛔. Recompute + QA-gate (§4) before
sending. Press-release rule from LINK_PLAN §5 stands: newswire = brand mention/naked
URL only, no anchors.

**Angle 1 — "The real materials bill behind your reno" (cost-of-living / consumer)**
The quote-transparency angle: before you accept a $25k bathroom quote, here's what the
materials actually cost at retail. Lead stat: *"The retail materials for a small
bathroom renovation total $550–$1,420 (July 2026) — the rest of your quote is labour,
margin and fixtures upgrades."* Supporting: hot water replacement materials ~$214–$614;
interior painting ~$180–$653. Derivable NOW (75 fully-priced jobs). Best fit:
news.com.au, Yahoo Finance AU, Finder.

**Angle 2 — "Same item, 10× the price" (spec-choice spread)**
How fixture choice swings a quote: basin mixer taps run $13–$326 at the same retailer,
freestanding baths $46–$1,477, deadbolts $14–$499. Story: ask your tradie WHICH tap is
in the quote. Derivable NOW — but every cited pair must pass the §4 outlier sweep
(some current spreads are match noise). Best fit: Canstar Blue, Yahoo Finance, BHG.

**Angle 3 — "Australia's materials-cost tracker" (month-on-month movement)**
⛔ PLACEHOLDER until the second monthly sample lands (~late Aug 2026). From then:
"materials for the average bathroom reno rose/fell X% this month," top-5
movers/fallers. This is LINK_PLAN §5 angle 1 and becomes the *recurring* monthly hook —
pitch it as a standing data series, which is what earns repeat citations. Do NOT pitch
movement stats before two samples exist. Best fit: news.com.au, Finder, Domain,
realestate.com.au.

**Angle 4 — "Where your reno dollar goes" (materials vs labour split)**
⚠ Only half derivable: materials side = real sampled data; labour side =
`TRADE_COST_GUIDE` editorial industry averages ($80–$200/hr plumbing etc.). Honest
framing required: *"sampled retail materials data (TradeRefer Cost Index) combined
with published industry labour-rate ranges"* — two sources, attributed separately. If
an outlet wants pure-data, offer angle 1 instead. Best fit: Domain, realestate.com.au,
Houzz AU.

**Angle 5 — "Geelong founder builds the dataset Bunnings never published" (founder/local)**
The story IS the data asset: solo founder in Geelong scraped and normalised 55,000+
retail products into a live materials-cost index covering 148 trade jobs, after
surviving a near-total Google de-index. Stats: 55,064 products, 160 materials, 837
price points, built solo. Derivable NOW (counts + true founder story). Best fit:
Geelong Advertiser (highest-probability hit per LINK_PLAN), SmartCompany.

---

## 6. Target publications (verified 2026-07-30 via WebSearch/WebFetch)

| # | Outlet | Status | Person / entry point | Angle |
|---|---|---|---|---|
| 1 | **news.com.au** (finance/cost-of-living) | ✅ outlet verified | **Frank Chung**, senior journalist, ex-finance editor — ✅ verified (Muck Rack/X; frank.chung@news.com.au) | 1, 3 |
| 2 | **Finder.com.au** (Insights/data desk) | ✅ outlet verified | **Graham Cooke**, head of consumer research / data journalist, edits Insights — ✅ verified; insights analyst **Joshua Godfrey** — ✅ verified | 1, 3 |
| 3 | **Yahoo Finance Australia** | ✅ outlet verified | **Tamika Seeto**, finance reporter — ✅ verified; **Belinda Grant-Geary**, editorial head — ✅ verified. (Stew Perrie has moved to Yahoo Lifestyle — don't pitch him for money stories.) | 1, 2 |
| 4 | **Canstar Blue** | ✅ outlet verified | **Meagan Lawrence**, Consumer Editor — ✅ verified (canstarblue.com.au/about-us/editorial-team) | 2 |
| 5 | **Domain** (domain.com.au/news, national desk) | ✅ outlet verified | Byline **Suki Reid** verified on Muck Rack, but beat fit for reno-cost data ⚠ unverified — pitch the national news desk | 3, 4 |
| 6 | **realestate.com.au** (News/Lifestyle desk) | ✅ outlet + lifestyle desk verified (REA content team, News Corp journalists) | ⚠ no current named journalist verified — pitch via the news desk / REA content team | 3, 4 |
| 7 | **SmartCompany** | ✅ outlet verified | **Eloise Keating**, senior editor since 2014 — ✅ verified | 5 |
| 8 | **Geelong Advertiser** | ✅ outlet verified (News Corp; editor **Phillippa Butt** ✅ verified) | Business-desk reporter name ⚠ unverified (directory lists Courtney Crane, journalist — low confidence; confirm current byline before sending) | 5 |
| 9 | **Houzz Australia** | ✅ outlet verified; editorial submissions address **aueditor@houzz.com** ✅ verified | ⚠ no named editor verified | 4, 2 |
| 10 | **Better Homes & Gardens Australia** (bhg.com.au, Are Media) | ✅ outlet verified | ⚠ no named journalist verified — pitch via site contact | 2 |

Tracking per LINK_PLAN §5: spreadsheet with name, publication, their relevant article,
a similar article, template + customised portion per email. 3–5 tailored emails/week
(the §8 weekly cadence slot). Any hit → push URL through `oi` same day.

---

## 7. SourceBottle weekly setup

Verified active 2026-07-30 (live call-outs with August 2026 deadlines; free tier
sufficient; optional paid pitching upgrade — skip it for now).

**One-time setup (~30 min):**
1. Register free at sourcebottle.com **as Steve, founder of TradeRefer** (LINK_PLAN §6:
   journalists verify — the founder is the credible expert, not "the SEO manager").
2. Create the free Expert Profile: founder of TradeRefer.au, Australian trades
   marketplace; expertise = trade job costs, building materials pricing, hiring
   tradies, small-business/marketplace building. Mention the Cost Index by URL —
   the profile is searchable by journalists.
3. Subscribe to the source digest emails and select topics: business/finance,
   home & garden/lifestyle, property, cost-of-living adjacent categories.
4. Add a reusable response skeleton to the PR spreadsheet: 2-sentence credential,
   1 citable stat from the live index (recomputed, per the truth rule), offer of
   custom data cuts, link to `/trade-cost-index`.

**Weekly cadence (fits the 30-min §8 slot):**
1. Scan digests Mon/Wed/Fri; respond **same day** to anything trades /
   home-improvement / renovation-cost / cost-of-living / founder-story shaped.
2. Every response: answer their actual question first, then one stat + the index link;
   offer a custom data pull (the index can slice by job/category on request — that
   offer is the differentiator).
3. Log every response + outcome in the PR spreadsheet; any published link → `oi`
   immediately; count landed links against the LINK_PLAN §8 RD metrics.
4. Anchor discipline: responses produce editorial links you don't control — that's
   fine (branded/naked by nature). Never request exact-match anchors (LINK_PLAN §2).

---

## 8. Success criteria / metrics

- Page live + indexed by Bing inside month 1 (LINK_PLAN §8 day-30 checkpoint);
  submitted in both sitemaps; `oi`-pushed.
- 90-day realistic expectation per doctrine: **0–3 earned placements** (this is the $0
  DIY version of a $5k campaign) — the asset compounds monthly, so a zero-hit first
  month is not failure.
- Monthly: re-sample lands (append-only) → freshness label auto-updates → angle-3
  tracker pitches unlock from sample #2.
- Every stat on the page traceable to a live DB query — if a journalist asks "show me,"
  the answer is a SQL query, not a shrug.
