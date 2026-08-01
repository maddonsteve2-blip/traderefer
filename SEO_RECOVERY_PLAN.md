# TradeRefer Google Recovery Plan (2026-07-28)

**Diagnosis (data: GSC coverage export + live GSC API + DataForSEO, 2026-07-28):**
Launch-era conditional noindex tagged ~36k pages; Google processed them May 1–9 and the index collapsed 3,073 → 5 pages. The May 12 fix (`f2ea1649`) landed after the wipe. Since then Google refuses to re-index: 44,617 "Crawled - currently not indexed" (quality/authority rejection), ~81k discovered URLs, **1 backlink / 1 referring domain**, sitemap advertising ~29k URLs (20.5k of them unclaimed profile stubs). Crawling is deprioritized to near-zero. Bing ranks the site fine (1–2k impressions/day) → no technical blocker; Google's authority bar is the gate. Homepage indexed, PASS verdict, no penalty in evidence.

**Strategy:** keep the domain. Prune the indexable surface to what can win, rebuild authority through links, and progressively re-release pages as each batch proves it sticks. Pruning fixes the quality signal; links fix the authority signal; neither works alone.

---

## Phase 0 — Rule-outs & housekeeping (this week, ~30 min, Steve)

- [ ] GSC UI → **Manual Actions** + **Security Issues** tabs (API can't read these). Expected: clean.
- [ ] Ship the uncommitted SEO fixes sitting in the working tree.

## Phase 1 — Prune & gate (build, ~1–2 days, Claude)

**Bing is preserved throughout** — it currently sends 1–2k impressions/day across the long tail, and pruning must not touch it:
- All new gates target Google only via Next Metadata `robots: { index: true, googleBot: { index: false, follow: true } }` → generic robots meta stays `index, follow` (Bing reads this), `googlebot` meta carries the noindex (only Google obeys it).
- Sitemap split: trimmed sitemap → GSC + robots.txt; full ~29k sitemap → submitted directly in Bing Webmaster Tools only (Google never sees it).
- Junk 308s/404s apply to both engines (correct hygiene; 308s transfer Bing rankings to the canonical URL).
- Nice-to-have later: IndexNow for instant Bing indexing.

**Nothing user-facing is removed.** All real city/suburb/trade pages stay live, navigable, and working as join/lead-capture surfaces (Bing, direct, email, ads). Gates are Google-index-only and **dynamic**: empty pages keep their "be the first to join" CTA, and when businesses join and a page crosses the threshold, it flips to Google-indexable automatically — the footprint grows back as real supply grows. Only impossible combos (e.g. wrong-state city pairs) die, via 308 to the correct page.

- [x] **Central index policy** — `apps/web/lib/seo/index-policy.ts` (`googleIndexable` + `directoryRobots`), used by all 8 directory page types + the Google sitemap. 9 unit tests. *(built 2026-07-28)*
- [x] **Tighten thresholds** (calibrated on live DB 2026-07-28): trade ≥4 (1,431 pages), job ≥5, suburb hubs ≥2 categories (1,120), top pages ≥3 + ≥5 reviews, profiles claimed OR 50+ reviews w/ photos (~3.5k of 23,850; only 1 claimed today).
- [x] **Sitemap split** — `/sitemap.xml` now the curated Google urlset (**2,284 URLs**: core + landers + 8 states + 59 cities + 1,431 trade combos + strong /top + claimed profiles); `/sitemap-full.xml` serves the old full index for Bing Webmaster Tools; robots.txt keeps pointing at `/sitemap.xml`.
- [x] **Junk hygiene** — already handled: wrong-city 308s live (June); the 2,052 404s are intentionally delisted businesses (`delisted_no_logo`) — leave as 404s, nothing to fix.
- [x] **Keep link equity flowing** — state/city/suburb hubs remain Google-indexable; mesh intact.
- [ ] **Differentiate Tier-1 pages**: referral counts, reviews, real data — the answer to "why this page over hipages." *(remaining Phase-1 content work; not blocking deploy)*
- [ ] Deploy (Steve approves) → resubmit `/sitemap.xml` in GSC → submit `/sitemap-full.xml` in BWT.

Verified pre-deploy: `tsc` clean (one pre-existing unrelated test-type error), 68/68 vitest, `next build` compiles, and live render shows strong pages `robots: index` + `googlebot: index` while thin pages show `robots: index` + `googlebot: noindex` — Bing untouched, Google gated.

## Phase 2 — Links (GTM, starts week 1, never stops — THE fix)

- [ ] **Claim-your-profile loop**: email listed businesses → claim page → embeddable "Recommended on TradeRefer" badge linking back. Even 1–2% of ~24k businesses = hundreds of real referring domains. Rails already exist (Resend / Instantly / ReachInbox). ⚠ AU Spam Act: frame as listing-notification/claim notice, honour removals.
- [ ] AU citations & directories (~20–30 quick wins), SourceBottle (AU HARO) weekly, trade-association + supplier partnerships.
- [ ] Every new backlink URL → `oi` push so the link gets crawled and counted.
- [ ] Target: **30–50 referring domains in 90 days** minimum viable.

## Phase 3 — Drip release (mechanical, evidence-gated)

- [ ] Batch 1 = the initial sitemap set: submit + `oi index --file batch1.txt --dripfeed 14 --yes` + GSC Request Indexing for top ~50.
- [ ] **Release rule**: batch N+1 only when batch N is ≥60–70% indexed AND holding for 2+ weeks. If a batch won't stick → more links, not more pages.
- [ ] Weekly automated GSC coverage snapshot (gsc CLI, scheduled task) to track: submitted-vs-indexed %, referring domains, sitemap fetch recency.

## Checkpoints & expectations

- Indexation should start moving 4–8 weeks after prune + first links land; meaningful Google traffic 2–4 months.
- Bing traffic keeps flowing throughout — don't break what works.
- **12-week checkpoint**: if 30+ links have landed and batch 1 still won't stick, revisit scope (much smaller site, same domain). A fresh domain stays off the table — same content + zero links = same outcome minus domain age.
