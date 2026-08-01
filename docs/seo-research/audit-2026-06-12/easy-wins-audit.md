# Easily-Actionable SEO Audit — traderefer.au — 2026-06-12 (PM)

> **STATUS 2026-06-12 evening: ALL ITEMS SHIPPED** (commits 1af56709, 82ef9428,
> 235f4404; taxonomy relabel applied to prod DB via
> scripts/consolidate_trade_taxonomy.js — 1,651 businesses, 170 → 111 labels).
> Bonus find during item 4: job pages' getBusinesses joined a nonexistent
> "referrals" table, so every job page rendered ZERO businesses — fixed
> (referral_links). Item 9 shipped via next.config redirects() with /ingest +
> /api excluded. Still open (tracked separately): city-segment validation incl.
> the dead 483-entry LOCATION_REDIRECTS middleware map (matcher excludes /local
> so it never ran), postal-dataset import, douglas cleanup.

Scope: whole site, focused on changes that are easy to ship. Every finding below was
verified against the live site and/or exact code lines today — not inferred.
Context: this builds on the morning audit (`city-postcode-integrity.md` etc.) whose P0s
are now fixed and deployed (postcode redirects, sitemap slim-down + chunking, broken
links, /about, business dedupe + logo-less purge → 23,850 active listings).

## Verified state (the good)

- robots.txt correct; sitemap index chunked and quality-gated; all sitemap queries filter `status='active'`.
- Schema coverage is strong: FAQPage (41 pages' worth), BreadcrumbList (35), Service,
  Organization, LocalBusiness + AggregateRating + Review + Geo on `/b/` profiles,
  WebSite on layout. No major schema gaps.
- www → apex 308 correct; HTTPS everywhere; suburb-slug canonicalisation now correct.
- Listing/suburb/trade pages have conditional robots gating (`index: count >= 2 …`) — right pattern.

## Quick wins (ranked: impact ÷ effort)

### 1. Consolidate the duplicated trade taxonomy (HIGH impact, easy — DB only)
170 distinct `trade_category` labels; synonym pairs split the same keyword's inventory
across two parallel `/local`/`/top` page trees, halving page strength:
- Electrical 1,813 + Electrician 512
- Plumbing 1,729 + Plumber 329
- Painting 1,443 + Painter 206
- plus long tail: "Construction company"→Building, "Landscape designer"→Landscaping, etc.
Fix: extend `scripts/fix_winner_trade_labels.js` mechanics into a one-shot synonym-map
relabel (same as today's 428-row relabel). Old minority pages (e.g. `/local/.../plumber`)
fall to 0–1 businesses → drop out of sitemap and noindex automatically via existing gates.
No code change needed.

### 2. `/top` raw-param canonical + mixed-case duplicate surface (HIGH, easy)
`/top/Plumbing/VIC/Geelong` returns **200** and the canonical echoes the raw params —
i.e. every casing variant self-canonicalises, an infinite duplicate-URL surface.
File: `apps/web/app/(public)/top/[trade]/[state]/[city]/page.tsx` (canonical built from
raw `params`). Fix: slugify/lowercase params; `permanentRedirect` when request ≠ canonical
(same pattern as the suburb pages); build canonical from resolved values. Same for the
`[suburb]` variant.

### 3. Footer "Browse by Trade" links point at parameterized search (MED-HIGH, trivial)
`components/DirectoryFooter.tsx:114` — sitewide footer equity goes to
`/businesses?category=X` (thin, parameterized). Repoint the 8 links at the static
`/trades/<trade>` cost-guide hubs (indexable, in the general sitemap) or top city trade pages.

### 4. Job pages: blanket noindex on a large long-tail surface (HIGH opportunity, easy, measured)
`/local/.../[trade]/[job]/page.tsx:67` — `robots: { index: false }` unconditionally.
These pages are linked from every trade page, carry FAQPage + Service schema and real
listings, and target long-tail queries ("timber deck construction armstrong creek").
Fix: mirror the existing conditional gate (`index: count >= 3`), and add the qualifying
subset to the trades sitemap. Roll out gradually (e.g. min 3 businesses + ≥1 review).

### 5. `/businesses/[slug]` legacy route uses 307 (LOW-MED, one line)
`apps/web/app/(public)/businesses/[slug]/page.tsx` uses `redirect()` (307 temporary) to
`/b/<slug>`. Change to `permanentRedirect()` so old indexed URLs pass equity.

### 6. Three orphaned legacy landing pages (LOW-MED, trivial)
`/local/bathroom-renovations-perth`, `/local/asbestos-removal-bendigo`,
`/local/gutter-cleaning-geelong` — live 200, zero internal links. Either 308 them to the
equivalent `/local/<state>/<city>/<suburb>/<trade>` page or link them from the relevant
trade guide.

### 7. Suburb pages have no ISR (perf/CWV, one line)
Trade pages export `revalidate = 3600`; suburb pages have no caching config (fully dynamic).
Add `export const revalidate = 3600;` to `[suburb]/page.tsx` — better TTFB at 1,124-suburb scale.

### 8. Metadata hygiene (LOW, quick batch)
- `/referrer/[id]` (public, no metadata) — add noindex + basic metadata.
- `/claim`, `/compare`, `/support`, onboarding pages — add basic metadata or explicit noindex.
- OG images missing on `/about`, `/local`, `/locations`; Twitter image missing on `/categories`.
- A few static titles >60 chars (`/locations` ~70, `/local` ~67, `/categories` ~70) — trim.
  (Homepage title is 58 chars — fine, despite what a quick scan suggests.)

### 9. Trailing-slash URLs serve 200 (LOW — canonical already mitigates)
`/local/vic/geelong/` returns 200 with correct non-slash canonical. Next.js default would
308; something (middleware/config) bypasses it. Worth restoring the redirect to stop the
duplicate crawl surface, but canonicals make this non-urgent.

## Not easy / already tracked (don't re-litigate)
- City-segment whitelist + generic `SUBURB_TO_CITY` redirects (morning audit §B) — medium effort, still open.
- Postal-dataset import to fix `locations_reference` root cause — open.
- qld/douglas DB cleanup SQL (morning audit §C) — open, small but data-sensitive.
- 1-of-23,850 claimed businesses = E-E-A-T/indexation ceiling — product problem, not a quick fix.
- GSC: expect 404/308 churn for ~9.8k delisted profile URLs over coming weeks (healthy).

## Suggested order
1 (taxonomy relabel) → 2 (/top canonicals) → 3 (footer links) → 5 (307→308) → 7 (ISR)
→ 6 (legacy redirects) → 8 (metadata batch) → 4 (job-page indexing, behind a count gate,
watch GSC for 2 weeks) → 9.
