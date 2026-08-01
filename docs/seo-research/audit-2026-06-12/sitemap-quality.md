# Sitemap quality audit — should all ~51.4k URLs stay in the sitemap?

**Date:** 2026-06-12
**Question:** Is it safe to submit all ~51,400 URLs to Google, or should the sitemap be slimmed — and if so, by what criteria and to what size?
**Context:** GSC shows 39.8k "Crawled — currently not indexed". Domain is weak: 11 clicks / 3,458 impressions / avg position 15.3 over 28 days.

**Verdict: do not keep submitting all 51.4k. Slim to a ~37.5k core (moderate) or ~30.6k core (aggressive). Exact gates below.**

---

## 1. Sitemap inventory (verified 2026-06-12)

| Child sitemap | URLs | Current eligibility gate (route.ts) |
|---|---|---|
| /sitemaps/general | 812 | hardcoded pages + states + cities (>=2 biz) + trade job types |
| /sitemaps/profiles (chunked -1..-4) | 33,632 | active + public + slug + name — **no quality gate** |
| /sitemaps/suburbs | 1,175 | >=2 businesses OR >=2 trade categories per suburb |
| /sitemaps/trades | 14,551 | >=2 businesses **OR SUM(total_reviews) > 0** per suburb×trade |
| /sitemaps/top | 1,264 | >=3 rated businesses per trade×city |
| **Total** | **51,434** | |

Generator: `apps/web/app/sitemaps/[sitemap]/route.ts`. Chunk count for profiles is derived from `countProfileUrls()` in `apps/web/lib/sitemaps.ts` — **any gate change must be made in both places** or the sitemap index and chunk contents will disagree.

## 2. Live crawl sample (56 pages fetched, sequential, UA "SitemapQualityAudit")

### 2a. 30 business profiles (spread evenly across sm-profiles.xml, seeded random)

All 30: **HTTP 200**, **no robots meta tag and no X-Robots-Tag header** (= indexable by default). Raw results in `C:\Users\61479\smaudit\profiles-results.psv`.

| Signal | Count | % |
|---|---|---|
| aggregateRating JSON-LD present (rendered only when total_reviews >= 3) | 22/30 | 73% |
| Project Gallery section present (photo_urls non-empty) | 13/30 | 43% |
| No rating schema AND no gallery (page-visible thin) | 6/30 | 20% |
| RICH (rating schema OR gallery) | 24/30 | 80% |

Review counts on sampled rich pages are real Google-imported counts (e.g. amigo-rubbish-removal 537 reviews @4.9, shane-s-trees 992 @4.9, ben-s-curtains 162 @5.0).

**Description quality:** every page has an About paragraph, but it is generated/imported template text, not unique content. Verified example (decking-darwin, a thin page): meta description "Decking Darwin: decking in Coconut Grove, Darwin. 5.0★ from 1 review…", About text "Looking for decking in Coconut Grove? Decking Darwin helps customers … compare options, review completed work, and request free quotes for merbau decking installation, composite decking installation…" — a fill-in-the-blanks template (name/suburb/services substituted). JSON-LD description likewise templated ("…offers professional decking services in Coconut Grove, NT. With 1 customer review and a focus on quality workmanship…"). The unique-text payload of a profile without reviews/photos is effectively zero; differentiation across 33k pages comes almost entirely from the review count/rating and photos.

Note: first `"description"` in page JSON-LD is the site-wide Organization schema (155 chars, identical on every page); the business description is the second block.

### 2b. 10 trade pages (suburb × trade)

All 10: HTTP 200, `index, follow`. Business counts from titles:

| Count in title | Pages |
|---|---|
| 1 business | **7/10** (e.g. "1 Carpenters in Keilor 3036", "1 Plumbers in Henley Beach South 5022", "1 Stonemasons in Docklands 3008") |
| 2–3 businesses | 2/10 |
| 7 businesses | 1/10 |

**70% of the sampled trade pages list a single business** — they exist only because the `OR SUM(total_reviews) > 0` clause lets 1-business combos through. A "1 Carpenters in X" page is a doorway-page duplicate of that business's profile. DB confirms scale: 6,437 of 14,560 gate-passing trade groups (44.2%) are single-business (sampling overshot at n=10, DB number is the truth).

### 2c. 8 suburb pages + 8 top pages

All 16: HTTP 200, `index, follow`. Suburb pages list 2–60 tradies ("17 Trusted Tradies in Campsie NSW 2194" … "60 Trusted Tradies in Ascot Vale VIC 3032") — healthy. Top pages render fine ("Top Locksmiths in Brisbane" etc.). Raw results in `C:\Users\61479\smaudit\{trades,suburbs,top}-results.psv`.

## 3. Database truth (Neon Postgres, `businesses` table, sitemap-eligible filter)

Eligible rows (active + public + slug + name): **33,632 — exactly matches the profiles sitemap.**

| Metric | Count | % of 33,632 |
|---|---|---|
| total_reviews > 0 | 30,619 | 91.0% |
| total_reviews >= 3 (aggregateRating renders) | 26,315 | 78.2% |
| total_reviews >= 5 | 23,739 | 70.6% |
| total_reviews >= 10 | 19,223 | 57.2% |
| total_reviews >= 20 | 13,924 | 41.4% |
| avg_rating > 0 | 30,619 | 91.0% |
| photo_urls non-empty | 14,364 | 42.7% |
| description non-empty | 33,632 | 100% (but templated — see 2a) |
| description >= 200 chars | 17,253 | 51.3% |
| **RICH: reviews >= 3 OR photos** | **28,217** | **83.9%** |
| reviews >= 5 OR (reviews >= 1 AND photos) | 26,167 | 77.8% |
| reviews >= 3 AND avg_rating >= 4.0 | 25,164 | 74.8% |
| **Zero-signal: 0 reviews AND 0 photos** | **2,542** | **7.6%** |
| is_claimed = true | **1** | 0.003% |

Data sources: Google Places 28,881 (94.5% with reviews), DataForSEO 4,748 (69.9% with reviews), organic 2. **The entire directory is scraped; one single business is claimed.** This is the structural quality risk: Google has the same review data first-hand on Maps, so an unclaimed aggregator page adds nothing unless it carries extra signal (photos + many reviews + working internal ecosystem).

Page-group gates re-run against DB:

| Group | Current gate | Alternative gates |
|---|---|---|
| Trade pages (suburb×trade) | 14,560 | **>=2 biz: 8,123** · >=3 biz: 4,834 · single-biz-via-reviews: 6,437 |
| Suburb pages | 1,178 | >=3 biz: 1,089 · >=5 biz: 1,006 |

(DB group counts are ~10 higher than sitemap counts because `sitemapSuburbSegment()` drops groups without a resolvable postcode.)

## 4. Interpretation

1. **The profiles are not classically thin** — 91% carry real review counts, 84% have >=3 reviews or photos. The web sample (80% rich) agrees with the DB (84%).
2. **But the domain cannot carry 51k pages.** 39.8k crawled-not-indexed means Googlebot has fetched and *declined to index* — a quality/authority verdict, not a discovery problem. With 11 clicks and position 15.3, submitting everything tells Google "all 51k are equally important", which dilutes crawl priority across templated near-duplicates.
3. **The single worst tier is trade pages, not profiles.** 6,437 single-business doorway pages (44% of the trades sitemap) duplicate profile content under a second URL. This is the cheapest, highest-confidence cut.
4. **The weakest profiles** are the 5,415 with <3 reviews and no photos (16.1%) — template-only pages whose only unique data is NAP. The 2,542 zero-signal ones are pure boilerplate.
5. Suburbs (1,175) and top (1,264) are healthy, well-gated tiers — keep.
6. Caveat: removing a URL from the sitemap does **not** deindex or noindex it; the pages stay live and internally linked and can still be indexed organically. Slimming concentrates crawl-budget and trust signals on the core — it is reversible at any time by relaxing the gate.

## 5. Recommendation

**Do not submit all 51.4k.** Gate the two weak tiers:

### Change 1 — trades sitemap: require 2+ businesses (drop the review OR-clause)

`apps/web/app/sitemaps/[sitemap]/route.ts`, `tradesSitemap()`:

```sql
-- before
HAVING COUNT(*) >= 2 OR COALESCE(SUM(total_reviews), 0) > 0
-- after
HAVING COUNT(*) >= 2
```

Effect: 14,551 → **~8,120** (−6,437 single-business doorway pages).

### Change 2 — profiles sitemap: add a quality gate

Add to the WHERE clause of `profilesSitemap()` in route.ts **and identically to `countProfileUrls()` in `apps/web/lib/sitemaps.ts`** (the sitemap index derives chunk count from it):

```sql
AND (
    total_reviews >= 5
    OR (total_reviews >= 1 AND COALESCE(array_length(photo_urls, 1), 0) > 0)
)
```

Effect: 33,632 → **~26,170** (−7,465 weakest profiles). Moderate alternative: `total_reviews >= 3 OR photos` → 28,217. Aggressive alternative for fastest trust-building: `total_reviews >= 10` → 19,223.

Chunk-stability note: ordering stays `created_at, id` so existing chunk membership shifts only where gated rows are removed; chunks compact from 4 to 3 (26,170 / 10,000). Google re-fetches the index daily (revalidate 86400), so this settles in one cycle.

### Keep unchanged
general (812), suburbs (1,175), top (1,264).

### Expected sitemap size after gating

| Tier | Now | Recommended | Aggressive |
|---|---|---|---|
| general | 812 | 812 | 812 |
| profiles | 33,632 | **26,170** (r>=5 or r>=1+photo) | 19,223 (r>=10) |
| suburbs | 1,175 | 1,175 | 1,175 |
| trades | 14,551 | **8,120** (>=2 biz) | 4,834 (>=3 biz) |
| top | 1,264 | 1,264 | 1,264 |
| **Total** | **51,434** | **~37,540 (−27%)** | **~27,310 (−47%)** |

Start with the recommended tier. If after 6–8 weeks the indexed ratio of submitted URLs isn't improving, step down to the aggressive tier rather than up. The dropped pages remain live and crawlable; re-add them by relaxing the gate once the domain earns authority (more claimed businesses, organic reviews, backlinks).

---

## Appendix: raw artifacts

- Sampled URL lists + per-page results: `C:\Users\61479\smaudit\` (`profiles-results.psv`, `trades-results.psv`, `suburbs-results.psv`, `top-results.psv`, `*-sample.txt`)
- Downloaded sitemaps: `C:\Users\61479\sm-{general,profiles,suburbs,trades,top}.xml` (counts 812 / 33,632 / 1,175 / 14,551 / 1,264)
- DB query scripts: `C:\Users\61479\smaudit\db-{cols,stats,tiers}.js` (run from `apps/web`, reads DATABASE_URL from `.env.local`)
- Sampling: seeded (42) stratified-random — file divided into N equal strata, one uniform pick per stratum
