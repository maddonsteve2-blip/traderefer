# TradeRefer Complete Site Audit — 2026-06-12

Four parallel investigations: sitemap quality, broken pages, city/postcode integrity, drill-down UX.
Detail files: [sitemap-quality.md](sitemap-quality.md), [broken-pages.md](broken-pages.md),
[city-postcode-integrity.md](city-postcode-integrity.md), [drilldown-ux.md](drilldown-ux.md).

## Headline answers

**Submit all ~51k URLs to Google?** No. Slim to ~37.5k by quality-gating profiles (≥5 reviews, or ≥1 review + photos → 26,170) and trades pages (≥2 businesses, drop the OR-reviews loophole → 8,120). Dropped pages stay live; this concentrates crawl trust. Aggressive fallback tier (~27.3k) pre-planned if no improvement in 6–8 weeks.

**Structural risk to know:** only 1 of 33,632 businesses is claimed; all descriptions are templated. Indexation ceiling is set by this, not by technical SEO.

## Priority list

### P0 — actively damaging, fix first
1. **30 suburbs have wrong canonical postcodes and the site 308-redirects CORRECT URLs to WRONG ones** (verified live: hornsby-2077→hornsby-2000, ryde-2112→ryde-2122; also ashfield-2372 in sitemap, real postcode 2131). Cause: postcode map regenerated 2026-05-25 from poisoned reference rows (PO-Box postcodes) + first-4-digit-token-of-arbitrary-address fallback; 167 suburbs silently flipped. Fix the 30 confirmed entries + anchor tests; add diff-guard to scripts/regenerate_postcodes.js; longer term use a real postal dataset. 461 sitemap URLs affected.

### P1 — sitewide broken links (template bugs)
2. **Every /b/ profile emits a broken "Top Rated in {suburb}" link** — apps/web/app/b/[slug]/page.tsx:1193 links postcode-suffixed slug; /top suburb query ILIKEs the raw slug and 404s. 4/4 profiles tested broken.
3. **/about 404s but is linked twice from every suburb/trade page** (hardcoded in local/[state]/[city]/[suburb]/[trade]/page.tsx).

### P2 — sitemap + data hygiene
4. Apply the sitemap quality gates (see above; must update both the chunk query and countProfileUrls() in lib/sitemaps.ts).
5. Junk city `qld/douglas` still live + indexable (12 sitemap URLs, 26 businesses actually Kirwan/Townsville/Port Douglas). Cleanup SQL + validate city segment in sitemap GROUP BY against locations_reference. City segment is otherwise never validated — any future junk city value mints an indexable subtree.
6. Unknown locations soft-404: /local/nsw/fakecity/fakesuburb returns 200+noindex rendered template; should be 404.

### P3 — drill-down UX (strategic)
7. **Duplicate trade taxonomy splits inventory** (Plumber/Plumbing, Electrician/Electrical, Painter/Painting): /trades/plumbing flow lands on "0 Plumbers Found" in Bondi while the plumber sits under /plumber. Merge synonyms with redirect map.
8. **Empty pages wired into the main flow**: every trade page links 6 job pages with 0 listings; homepage "Popular searches" includes a 0-result noindex page (Electrical in Gold Coast). Only link job pages with inventory; fix empty-state CTA (→ city-trade results + /quotes, not /register).
9. **City level is noise**: 168-suburb alphabetical wall, no trade selector; Sydney metro split into LGA "cities" (Epping NSW lives under "Parramatta", invisible from "Sydney"). The page humans want (/top/[trade]/[state]/[city]) exists but is orphaned — only 8 hand-picked links on /categories. Add "Popular trades in [city]" block on city pages linking /top pages.
10. /top pages' upward link is malformed: fabricates /local/nsw/sydney/plumber which renders "Best Trades in Plumber".
11. /categories: 384 links, inconsistent routing (identical cards → /businesses vs /trades), nav label "Trade Guides" ≠ H1 "All Trade Categories". /locations re-exposes 1-business "cities" that /local hides.

## Click depths (home → profile)
Hero search: 2 · footer city shortcut: 4 · full /local drill: 6 (7th click hits an empty job page).

## What was healthy
Suburbs + top sitemaps; auth links (/register, /login, no stray /signup); clean 404s for unknown profiles/states; no redirect chains; /businesses directory is the best UX surface on the site; old bogus cities (brookside, epping-as-city, dee-why, glebe) already 404 with zero inbound links.
