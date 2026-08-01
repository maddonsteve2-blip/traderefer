# TradeRefer local drill-down UX walk — 2026-06-12

Method: every page fetched live with `curl --http1.1` (server-rendered HTML), links/H1s/robots extracted
from the raw HTML. Templates cross-checked against `apps/web/app/(public)/` in this repo.
37 page fetches total. Persona: "I live in [suburb] and need a [trade] — can I find them from the homepage?"

Legend per hop: `URL — HTTP status — H1 (title)` then what the page offers and whether the next hop is obvious.

---

## Path 1 — Homepage → "I need a plumber in a Sydney suburb"

**Hop 0:** `/` — 200 — H1 "Find trusted local tradies, get free quotes, and reward good referrals."
(title "TradeRefer | Find Trusted Local Tradies & Get Free Quotes"). 118 links (111 internal) — not overwhelming.

Navigation options visible in the homepage HTML for this persona:

| Option | Where it goes | Assessment |
|---|---|---|
| Hero search form (trade field "e.g. Plumbing" + location field "e.g. Richmond") | submits to `/businesses` | **Best path.** 1 interaction → filtered results → profile. |
| Header "Browse Businesses" | `/businesses` | Fine; filter sidebar there. |
| "Plumbers" quick chip | `/businesses?category=Plumbing` | Fine — but nationwide, no location. |
| Popular searches grid (20 links) | deep 5-segment URLs like `/local/nsw/sydney/sydney-2000/electrical` | **Trap — see below.** |
| State cards (8) | `/local/nsw` etc. | Starts the long drill-down. |
| Footer city links (8) | `/local/nsw/sydney` etc. | Skips 2 levels of the drill-down — good. |
| Footer "Plumber" | `/trades/plumbing` | Content guide, links onward by city. |

**Dead ends / confusion found on homepage links:**

1. **Popular search links point at single-postcode suburb pages, not the city.**
   "Electrical in Sydney" → `/local/nsw/sydney/sydney-2000/electrical` — 200 — H1 "Electrical in Sydney 2000"
   — **3 electricians found**. The label says "Sydney" (4,226 tradies); the page is postcode 2000 only.
   A human cannot tell why "Electrical in Sydney" has 3 results.
2. **"Electrical in Gold Coast"** → `/local/qld/gold-coast/gold-coast/electrical` — 200 —
   H1 "Electrical in Gold Coast" — **"0 Electricians Found"**, and the page is `noindex, follow`.
   The homepage links directly to an empty noindexed page. Its parent
   `/local/qld/gold-coast/gold-coast` is a phantom "Gold Coast" suburb (no postcode, not present in the
   Gold Coast city's own suburb list, noindex). Same postcode-less pattern for
   `sunshine-coast/sunshine-coast/...` links on the homepage.
3. **No "Plumbing in Sydney" popular link exists** (there is Building/Electrical in Sydney, Plumbing in
   Perth/Gold Coast/Canberra) — the persona's exact need isn't in the grid, so they fall back to search
   or the drill-down.

**Verdict for Path 1: WEIRD.** The hero search is a clean 2-interaction path, but every "Popular search"
link under it is a deep link into the weakest layer of the site (single-postcode suburb-trade pages),
including at least one 0-result noindex page.

---

## Path 2 — /local hub → NSW → Sydney → suburb → trade → job (5 levels)

**Hop 1:** `/local` — 200 — H1 "Local Service Directory" (title "Local Trade Directory | …").
58 links. 8 state cards with business/city counts ("New South Wales 9,132 businesses, 33 cities"),
8 popular-city shortcuts, link to `/locations`. Next hop obvious: yes.

**Hop 2:** `/local/nsw` — 200 — H1 "Trade Services in New South Wales". `index,follow`. 75 links.
- "Browse by City": **17 cities** (the /local hub promised "33 cities" — count mismatch).
  City list mixes Sydney (4,226) with Murrumbateman (2), Port Macquarie (2), Katoomba (7).
- "Most In-Demand Trades in New South Wales" → **exits the /local hierarchy** into
  `/businesses?category=Building&state=NSW` etc. Two different mental models on one page.
- Breadcrumb present (Home → Directory). Next hop obvious: yes, pick Sydney.

**Hop 3:** `/local/nsw/sydney` — 200 — H1 "Trades in Sydney, NSW" (title "4226 Trusted Tradies…").
**221 links, 168 of them suburb links** — over the ~200-link comfort threshold, and the page is a pure
alphabetical suburb chooser. **There is no trade selector at city level.** A user who wants "a plumber
in Sydney" cannot express the trade here; they must first commit to 1 of 168 suburbs, including
2-profile suburbs (Bellevue Hill 2, Botany Bay 2, Cambridge Park 2) listed beside 100+-profile ones.
Data oddity: `ashfield-2372` (Ashfield, Sydney is postcode 2131; 2372 is Ashford NSW territory).
Breadcrumb: Home → Directory → NSW. Next hop: obvious *if* you know your suburb; impossible to
shortcut if you just want "Sydney-wide plumber".

**Hop 4:** `/local/nsw/sydney/bondi-2026` — 200 — H1 "Best Trades in Bondi 2026". `index,follow`.
89 links. "Select a Trade Category" lists ~25 trades with counts. Problems:
- **Duplicate trade taxonomy**: "Electrician 6 profiles" AND "Electrical 1 profiles"; "Painting 4" AND
  "Painter 1"; "Landscaper 3" AND "Landscaping 1"; "Carpenter 1" AND "Carpentry 1". A human must guess
  which of two near-identical labels has their tradie.
- **Most trades show exactly 1 profile** — a pointless extra hop to a 1-listing page.
- "Bondi 2026" reads as the year 2026, not postcode 2026 (title "40 Trusted Tradies in Bondi NSW 2026",
  trade page "6 Electricians in Bondi 2026"). Coincidence of postcode and current year, but every
  Sydney-east suburb (2020s postcodes) has this ambiguity.
Next hop obvious: yes (click trade), modulo the duplicate-label guessing game.

**Hop 5 (trade):** `/local/nsw/sydney/bondi-2026/electrician` — 200 — H1 "Electrician in Bondi 2026, Sydney".
`index,follow`. 6 listings, each with `/b/...` View Profile + Request Quote. Cost guide, FAQ,
"Specific Electrician Services in Bondi" (6 job links). This level genuinely works.
Counter-case: `/local/nsw/sydney/bondi-2026/plumber` — 200 — "1 Plumbers Found" — **noindex,follow**.
The suburb page links straight into noindexed thin pages ("Plumber 1 profiles" → noindex page).
Grammar: "1 Plumbers Found", "How to Choose a Electrician".

**Hop 6 (job, level 5):** `/local/nsw/sydney/bondi-2026/electrician/switchboard-upgrade` — 200 —
H1 "Switchboard Upgrade in Bondi, Sydney" — **noindex,follow** — and the listings section says
**"No listings yet in Bondi — get quotes from electrician across Sydney instead."**
- The trade page (hop 5) advertised 6 job pages; this one (and by template, all of them) carries
  **zero businesses** — none of the 6 Bondi electricians appear on their own specialty pages.
- The escape link "See Electrician Across Sydney" **links back to
  `/local/nsw/sydney/bondi-2026/electrician`** — the page the user just came from, mislabeled
  ("Across Sydney" ≠ Bondi). Circular.
- "Request a Free Quote" → `/register?type=homeowner` (an account signup, not a quote form).
- Page does have correct breadcrumb links (NSW → Sydney → Bondi → Electrician) and nearby-suburb
  cross-links for the same job.

**Does each level add value?**
- /local: thin but harmless router.
- state: marginal — duplicates /local's city shortcuts, its trade links bail out to /businesses.
- city: **noise for navigation** — one giant suburb wall, no trade entry, blocks "trade in city" intent.
- suburb: useful concept, undermined by duplicate categories and 1-profile entries.
- trade: the real money page. Good.
- job: **negative value as linked** — empty, noindexed, circular escape hatch.

**Verdict for Path 2: WEIRD at levels 2–4, BROKEN at level 5** (empty noindexed job pages linked from
every trade page; noindexed 1-profile trade pages linked from every suburb page).

---

## Path 3 — VIC/Melbourne and QLD/Brisbane (to depth 4)

### VIC
1. `/local/vic` — 200 — "Trade Services in Victoria". 12 cities listed (hub claimed 22):
   Melbourne 5,949 next to Camperdown 2, Heathcote 2, Mortlake 2, Hamilton 5.
2. `/local/vic/melbourne` — 200 — "Trades in Melbourne, VIC". **229 links / 178 suburbs**, again no
   trade dimension; 1-profile suburbs linked (Aintree 1, Airport West 1).
3. `/local/vic/melbourne/richmond-3121` — 200 — "Best Trades in Richmond 3121". Duplicate taxonomy at
   scale: **"Plumbing 5 profiles" AND "Plumber 4 profiles"** as separate pages; "Electrician 9" AND
   "Electrical 5". A plumber-seeker sees two plumber categories with different businesses behind each.
4. `/local/vic/melbourne/richmond-3121/plumbing` — 200 — "Plumbing in Richmond 3121, Melbourne" —
   `index,follow`, 5 real listings with profiles/quotes. Works.

### QLD
1. `/local/qld` — 200 — 16 cities: Brisbane 2,673 beside Caboolture 2, Rockhampton 2, Willowbank 3.
   (Rockhampton — a city of 80k — shown with 2 profiles erodes trust in every other count.)
2. `/local/qld/brisbane` — 200 — 191 links / 139 suburbs, same trade-less suburb wall
   (Acacia Ridge 1, Albion 1 linked).
3. `/local/qld/brisbane/annerley-4103` — 200 — "Best Trades in Annerley 4103". Every trade displays
   exactly "5 profiles" (display cap?) — counts stop being believable.
4. `/local/qld/brisbane/annerley-4103/plumbing` — 200 — "5 Plumbers Found", real listings. Works.

**Verdict for Path 3: same template, same problems — SENSIBLE at depth 4, WEIRD at depths 1–3**
(tiny "cities" beside metros, suburb walls, duplicate/capped trade counts).

---

## Path 4 — Small state: Tasmania (full depth exists)

1. `/local/tas` — 200 — "Trade Services in Tasmania". Only 3 cities (Hobart 734, Launceston 379,
   Devonport 114) — at this size the state level is almost a no-op hop.
2. `/local/tas/hobart` — 200 — 24 suburbs. Oddity: suburb "Hobart 7000" has 24 profiles inside city
   "Hobart" with 734; "Battery Point 144" (a ~2,500-resident heritage suburb showing 144 tradies —
   service-area inflation is visible to anyone local).
3. `/local/tas/hobart/battery-point-7004` — 200 — 44 trade links, the uniform "5 profiles" cap again.
4. `/local/tas/hobart/battery-point-7004/plumbing` — 200 — "4 Plumbers Found" (suburb page said 5 —
   counts disagree one click apart), `index,follow`, real listings.

**Verdict for Path 4: SENSIBLE structurally** (same 5-level template all the way down), with the same
count-credibility issues; the state level adds nothing in small states.

---

## Path 5 — /categories

`/categories` — 200 — H1 "All Trade Categories" (linked from header as **"Trade Guides"** — label and
H1 don't match). **384 links** — well past the overwhelm threshold.

- Category headers are **inconsistent destinations**: Building/Painting/Landscaping/Cleaning →
  `/businesses?category=X` (directory app) but Electrical/Plumbing → `/trades/electrical|plumbing`
  (content guide). Two different page types from visually identical cards.
- Sub-links → `/trades/[job]` cost guides (e.g. `/trades/switchboard-upgrade` — 200 — "How Much Does
  switchboard upgrade Cost in Australia?" — lowercase job name in H1/title).
- "Top Rated Tradies by City" → 8 `/top/...` links (see Path 8).
- `/trades/plumbing` — 200 — "Find Plumbing Professionals Across Australia" — has the **one genuinely
  good trade→location flow on the site**: "Find Plumbing Businesses by City" →
  `/local/nsw/sydney?category=Plumbing` → every suburb link carries `?category=Plumbing` → suburb page
  **redirects** straight to `/local/.../[suburb]/plumbing` (confirmed in
  `apps/web/app/(public)/local/[state]/[city]/[suburb]/page.tsx` line ~172).
  **But the split taxonomy breaks it**: in Bondi the redirect target
  `/local/nsw/sydney/bondi-2026/plumbing` is a **"0 Plumbers Found"** noindex page, while the actual
  plumber sits on `/local/nsw/sydney/bondi-2026/plumber`. The guided flow dead-ends exactly where the
  category names diverge.

**Verdict for Path 5: WEIRD** — 384 links, mixed destination types, mislabeled in the nav, and its best
flow is sabotaged by the duplicate trade taxonomy.

---

## Path 6 — /locations

`/locations` — 200 — H1 "Find Local Tradies by Location". 169 links, 113 to `/local/...`. All states +
**every city including the long tail /local/nsw hides**: Camberwell 1 business/1 suburb, South Nowra 1,
Blaxland 1, Wagga Wagga 1, Coffs Harbour 1, Batlow 1, Dubbo 1, Goulburn 1, Griffith 1, Cobargo 1,
Merriwa 1… Each is a full city → suburb → trade subtree behind 1 business. `/local/nsw` curates these
out; `/locations` re-exposes them, so the two location indexes disagree about what cities exist.
Links land correctly on `/local/[state]/[city]`. Page is reachable from `/local` ("Browse All Cities &
Suburbs") but not from the homepage.

**Verdict for Path 6: SENSIBLE as an index, WEIRD in content** — it advertises dozens of 1-business
"cities" as if they were directories.

---

## Path 7 — /businesses directory

`/businesses` — 200 — H1 "Find Local Trades Near You". `index,follow`, real breadcrumb (Home → Find).
- Filter UI: search box ("Search business name, trade, suburb or city"), **state checkboxes + category
  checkboxes**, Open Now / 24h toggles. Template accepts `category, suburb, q, state, city, page`
  (confirmed in `apps/web/app/(public)/businesses/page.tsx`), so **trade + location filtering works**.
- `/businesses?category=Plumbing&state=NSW` — 200 — H1 "Best Plumbing New South Wales", breadcrumb
  Home → Find → New South Wales, listings link to `/b/[slug]` + `#enquiry-form`. Canonical of filtered
  views points to `/businesses` (fine).
- No suburb checkbox in the sidebar — suburb filtering only via free-text/q or query param, so
  "plumber in Bondi" works through the hero search but isn't composable from the sidebar alone.

**Verdict for Path 7: SENSIBLE — the best navigation surface on the site.** It's a parallel universe to
/local, though: same intent, different URLs, different filters, different counts.

---

## Path 8 — /top/[trade]/[state]/[city]

`/top/plumber/nsw/sydney` — 200 — H1 "Top 10 Plumber in Sydney, New South Wales" (grammar: "Plumber").
`index,follow`. Ranked top-10 with ratings, profiles, quote links, FAQ, nearby-city /top cross-links.
**As a destination, this is the page the Path-2 persona actually wanted at city level.**

Reachability from the homepage:
- Homepage: **zero /top links.**
- Only human entry: `/categories` ("Trade Guides") → "Top Rated Tradies by City" → **8 hand-picked
  combos** (electrician/plumber/painter × a few cities). Every other trade×city /top page is reachable
  only via /top↔/top nearby-city cross-links or business profile pages ("Top Rated in Melbourne" links
  to the suburb-level `/top/painter/vic/melbourne/melbourne-3000`).
- **Broken hierarchy link**: each /top page's breadcrumb-style link "Plumber" points to
  `/local/nsw/sydney/plumber` — a URL where "plumber" lands in the **suburb slot**. It renders (200) as
  a phantom suburb: H1 **"Best Trades in Plumber"**, "Get 3 Free Quotes in Plumber" (noindex). Every
  /top page links to a nonsense page one click away.

**Verdict for Path 8: effectively ORPHANED (and links out broken)** — the site's best city-level page
is unreachable for ~99% of trade×city combos and its upward link is malformed.

---

## Path 9 — Weird-city URLs: /local/nsw/epping and /local/qld/brookside

- `/local/nsw/epping` — **404**. `/local/qld/brookside` — **404**.
  Both were removed (matches recent repo commits "Exclude invalid local URLs from sitemaps" /
  "Document invalid local sitemap cleanup"), and neither is linked from any hub page fetched
  (grep across home/local/state/locations HTML: 0 hits). The damage is contained.
- The 404 itself is weak for curl/bots: server HTML ships **zero links** (client-rendered shell),
  title is the generic homepage title, and it carries `canonical → https://traderefer.au` on a 404.
  A human with JS gets the client not-found UI; a crawler gets an empty page.
- The **underlying confusion that created those URLs is still live**: Epping NSW now exists as
  `/local/nsw/parramatta/epping-2118` — i.e. under city "Parramatta" (1,003 businesses, 30 suburbs,
  its own page at `/local/nsw/parramatta` — 200 — "Trades in Parramatta, NSW"). Sydney metro is split
  into sibling "cities" (Sydney / Parramatta / Liverpool / Bankstown / Blacktown). A human in Epping
  who clicks **Sydney** (the only label they identify with) will never find Epping — it's not among
  Sydney's 168 suburbs. The breadcrumb "NSW → Parramatta → Epping" is technically consistent but
  doesn't match how anyone describes where they live.
- Related phantom still linked: `/local/qld/gold-coast/gold-coast` (200, noindex, postcode-less
  "Gold Coast" suburb inside Gold Coast city, absent from the city's own suburb list) — reached from
  the **homepage** popular searches. So postcode-less and postcode suburbs coexist in navigation.

**Verdict for Path 9: previously BROKEN, now patched to 404 — but the city-assignment model that
produced it (LGA-as-city, phantom no-postcode suburbs) is still confusing humans.**

---

## Path 10 — Business profile /b/derek-son-painting-group

`/b/derek-son-painting-group` — 200 — H1 "Derek & Son Painting — Painter in Melbourne".
Can the user climb back up? **Yes** — the profile links:
- "Painter in Melbourne" → `/local/vic/melbourne/melbourne-3000/painter` (suburb-trade page)
- "Top Rated in Melbourne" → `/top/painter/vic/melbourne/melbourne-3000` (suburb-level top page)
- "All Trades in Melbourne" → `/local/vic/melbourne/melbourne-3000` (suburb page)
- "VIC Directory" → `/local/vic`
Caveat: every link says "Melbourne" but three of the four go to the **melbourne-3000 CBD suburb**, not
the Melbourne city page — the label/level mismatch again. The chain skips the city level entirely
(suburb → state). No conventional breadcrumb strip, but functionally you can get back up.

**Verdict for Path 10: SENSIBLE, with mislabeled levels.**

---

## Cross-cutting evaluation

**Click depth, homepage → tradie profile in a given suburb:**
- Hero search: **2 interactions** (search trade+suburb → click profile). Best case.
- Footer city shortcut: **4 clicks** (Sydney → suburb → trade → profile).
- Full /local drill: **6 clicks** (/local → state → city → suburb → trade → profile) — and at hop 3 the
  user faces a 168-item suburb wall with no trade filter.
- If the user takes the job level: **7th click lands on an empty page** (0 listings, circular link).

**City level: meaningful or noise?** Noise for navigation. It adds no trade dimension, mixes metros with
2-profile towns, splits Sydney into LGA-named sibling "cities" no resident would pick, and its only
content is the suburb wall. (It is load-bearing for SEO URLs, but as a *page* it's a wall.)

**Suburb slug consistency:** suburbs-with-postcode (`bondi-2026`) and phantom postcode-less suburbs
(`gold-coast/gold-coast`, `sunshine-coast/sunshine-coast`) both appear in navigation — the latter from
the homepage itself, all noindex, one with 0 results.

**0–1 business levels linked:** everywhere — 1-profile trade links on every suburb page (→ noindex
pages), 1-business cities on /locations, 2-profile cities on state pages, 0-listing job pages on every
trade page.

**Link-count overwhelm:** Sydney 221 links, Melbourne 229, /categories 384. Everything else is fine.

**"Do I know where I am?"** State/city/suburb/trade pages have consistent breadcrumbs (Home → Directory
→ NSW → Sydney). Weak spots: "Bondi 2026" year/postcode ambiguity, /top's broken upward link, profile
pages calling a CBD suburb "Melbourne", and JSON-LD breadcrumb naming the city level "Top Sydney
Tradies" while the H1 says "Trades in Sydney".

---

## Suggested flow improvements (concrete)

1. **Kill or fix the job level as linked.** Only render job links on a trade page when the job page has
   ≥1 listing; otherwise render as plain text or link to the city-wide trade page. Fix the empty-state
   button to actually go up a level (`/local/[state]/[city]` filtered or `/top/[trade]/[state]/[city]`),
   and point "Request a Free Quote" at `/quotes?...` not `/register`.
2. **Merge the duplicate trade taxonomy** (Plumber/Plumbing, Electrician/Electrical, Painter/Painting,
   Carpenter/Carpentry, Landscaper/Landscaping) into one canonical category with synonym mapping, and
   make the suburb `?category=` redirect resolve through the synonym map so the /trades→city→suburb
   carry-through never lands on "0 Found".
3. **Add a trade selector to the city page** (top of page, above the suburb wall): "Popular trades in
   Sydney" linking to `/top/[trade]/[state]/[city]` — this simultaneously fixes the city-level dead
   zone and de-orphans the /top pages. Collapse the suburb wall behind grouped regions or a type-ahead.
4. **Stop linking thin nodes:** suppress suburb links with <3 profiles on city pages, trade links with
   0–1 profiles on suburb pages (or link them to the nearest level that has inventory), and drop
   1-business cities from /locations.
5. **Fix the homepage popular searches:** point them at `/top/[trade]/[state]/[city]` or city-wide
   results instead of single-postcode suburb pages; remove the phantom `gold-coast/gold-coast` style
   targets entirely.
6. **Fix the /top upward link** `/local/[state]/[city]/[trade-noun]` → it currently fabricates a suburb
   called "Plumber"; either link to `/businesses?category=X&city=Y` or to the city page.
7. **Label honestly:** rename "Trade Guides" → "Trades & Cost Guides" (or split), make profile-page
   links say "Melbourne CBD (3000)" when they target the suburb, and render postcodes as "Bondi NSW 2026"
   instead of "Bondi 2026" to defuse the year ambiguity.

## Raw hop log (URL — status — robots — note)

```
/                                                    200  —          homepage, 118 links
/local                                               200  —          8 states, counts overstate city lists
/local/nsw                                           200  index      17 cities (claims 33), trades exit to /businesses
/local/nsw/sydney                                    200  index      221 links, 168 suburbs, no trade selector
/local/nsw/sydney/bondi-2026                         200  index      dup taxonomy, many 1-profile trades
/local/nsw/sydney/bondi-2026/electrician             200  index      6 listings, good page
/local/nsw/sydney/bondi-2026/plumber                 200  noindex    1 listing, linked from suburb
/local/nsw/sydney/bondi-2026/plumbing                200  noindex    0 listings (redirect target of ?category=Plumbing)
/local/nsw/sydney/bondi-2026/electrician/switchboard-upgrade 200 noindex  0 listings, circular escape link
/local/vic                                           200  index      12 cities (claims 22)
/local/vic/melbourne                                 200  index      229 links, 178 suburbs
/local/vic/melbourne/richmond-3121                   200  index      Plumbing(5) + Plumber(4) split
/local/vic/melbourne/richmond-3121/plumbing          200  index      5 listings
/local/qld                                           200  index      Rockhampton "2 profiles"
/local/qld/brisbane                                  200  index      139 suburbs
/local/qld/brisbane/annerley-4103                    200  index      uniform "5 profiles" everywhere
/local/qld/brisbane/annerley-4103/plumbing           200  index      5 listings
/local/tas                                           200  index      3 cities
/local/tas/hobart                                    200  index      24 suburbs, Hobart-7000 inside Hobart
/local/tas/hobart/battery-point-7004                 200  index      44 trades, capped counts
/local/tas/hobart/battery-point-7004/plumbing        200  index      4 listings (suburb said 5)
/categories                                          200  —          384 links, mixed destinations, 8 /top seeds
/locations                                           200  —          113 local links incl. 1-business cities
/businesses                                          200  index      filters work, breadcrumbs, best surface
/businesses?category=Plumbing&state=NSW              200  index      "Best Plumbing New South Wales", works
/top/plumber/nsw/sydney                              200  index      great page; links to /local/nsw/sydney/plumber
/local/nsw/sydney/plumber                            200  noindex    phantom suburb "Plumber"
/local/nsw/epping                                    404  noindex    removed; no inbound links remain
/local/qld/brookside                                 404  noindex    removed; no inbound links remain
/local/nsw/parramatta                                200  index      Sydney suburb as sibling city; contains epping-2118
/local/qld/gold-coast                                200  index      35 suburbs, all with postcodes
/local/qld/gold-coast/gold-coast                     200  noindex    phantom postcode-less suburb, linked from homepage
/local/qld/gold-coast/gold-coast/electrical          200  noindex    0 electricians, linked from homepage
/local/nsw/sydney/sydney-2000/electrical             200  index      3 listings; homepage calls it "Electrical in Sydney"
/trades/plumbing                                     200  —          guide; city links carry ?category=Plumbing
/trades/switchboard-upgrade                          200  —          cost guide, lowercase H1
/b/derek-son-painting-group                          200  —          profile; links up to suburb/trade/top/state
```
