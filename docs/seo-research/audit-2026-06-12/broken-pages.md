# Broken Pages & Broken Internal Links — traderefer.au

**Audit date:** 2026-06-12
**Method:** Live HTTP crawl (curl, HTTP/1.1, sequential). 18 seed pages fetched and parsed for internal hrefs → 602 unique internal URLs discovered → 250 status-checked (proportional sample per path-prefix; all nav/footer/business/claim/top links included) + 9 legacy/guessable routes + 6 soft-404 body spot-checks + 8 follow-up verifications. **~273 unique URLs checked, ~296 HTTP requests total.**

---

## 1. Hard-broken URLs (404)

| # | URL | Status | Linked from (source page) | Anchor text |
|---|-----|--------|---------------------------|-------------|
| 1 | `/about` | 404 | **Every** `/local/[state]/[city]/[suburb]/[trade]` page (verified on `/local/act/canberra/canberra-2600/plumbing`) | "How we verify" + "How It Works" (2 links per page) |
| 2 | `/top/painter/vic/melbourne/melbourne-3000` | 404 | `/b/derek-son-painting-group` (Browse More block) | "Top Rated in Melbourne" |
| 3 | `/top/plumbing/wa/fremantle/bibra-lake-6163` | 404 | `/b/hilton-plumbing` | "Top Rated in Bibra Lake" |
| 4 | `/top/plumbing/qld/brisbane/brisbane-4000` | 404 | `/b/brisbane-plumbing-and-drainage-brisbane` | "Top Rated in Brisbane" |
| 5 | `/top/plumbing/sa/adelaide/kensington-5068` | 404 | `/b/ken-hall-plumbers-kensington` | "Top Rated in Kensington" |
| 6 | `/trades` | 404 | No internal links found pointing to it (route has no index page — `app/(public)/trades/` only contains category subfolders and `[job]`) | n/a |

**Sample result: 4 of 4 business profiles tested have a broken "Top Rated in {suburb}" link.** This is effectively a sitewide defect on every `/b/[slug]` page (see root cause below).

### Root causes (confirmed in repo)

**(a) `/about` does not exist as a route** — there is no `about` directory under `apps/web/app`. Yet it is hardcoded twice in
`apps/web/app/(public)/local/[state]/[city]/[suburb]/[trade]/page.tsx` (the only file with `href="/about"`).
Given the sitemap scale (~51k URLs), this template likely serves tens of thousands of indexed pages — each emitting **2 broken links**.

**(b) Business-profile "Top Rated" links can never resolve.** `apps/web/app/b/[slug]/page.tsx:1193` builds
`/top/${tradeSlug}/${stateSlug}/${citySlug}/${suburbWithPostcode}` unconditionally (suburb slug includes the postcode, e.g. `bibra-lake-6163`).
But `apps/web/app/(public)/top/[trade]/[state]/[city]/[suburb]/page.tsx`:
- never strips the postcode — it does `formatSlug(suburb)` → `"Bibra Lake 6163"` → `b.suburb ILIKE '%Bibra Lake 6163%'`, which **cannot match** a DB suburb of `"Bibra Lake"` (contrast: the `/local/.../[suburb]` page correctly uses `parseSuburbSlug` from `@/lib/postcodes`);
- additionally calls `notFound()` when `businesses.length < 3` (line 153) and requires `avg_rating IS NOT NULL`.

Net effect: **every** postcode-suffixed "Top Rated in {suburb}" link 404s.

---

## 2. Internal links pointing at redirects (307)

| Source page | Link | Redirects to | Hops | Verdict |
|-------------|------|--------------|------|---------|
| `/rewards` | `/dashboard/referrer` | `/login?redirect_url=…` | 1 | Auth gate — expected for logged-out, but a crawler-visible 307 |
| `/rewards` | `/onboarding/business` | `/login?redirect_url=…` | 1 | Same |
| `/rewards` | `/onboarding/referrer` | `/login?redirect_url=…` | 1 | Same |
| `/b/derek-son-painting-group` | `/dashboard/referrer/refer/derek-son-painting-group` | `/login?redirect_url=…` | 1 | Same |
| (no internal links) | `/signup` | `/register` (307) | 1 | Clean legacy redirect; nothing links to it |

- **No redirect chains (>1 hop) found.** All 307s land on `/login` (200) or `/register` (200) in one hop.
- **Top offender: `/rewards`** (3 of the 5 redirecting link targets).
- **No `/signup` or `/sign-in` hrefs found on any crawled page** — all auth links correctly use `/register` and `/login`.

---

## 3. Soft-404 behavior

| URL | Status | Behavior |
|-----|--------|----------|
| `/local/nsw/fakecity/fakesuburb` | **200** | **Soft-404.** Renders the full suburb template: `<title>Trusted Tradies in Fakesuburb NSW</title>`, H1 "Best Trades in Fakesuburb", self-referencing canonical. Mitigated by `<meta name="robots" content="noindex, follow">`, but the status should be 404 — any URL garbage under `/local/{state}/{x}/{y}` produces a 200 page. |
| `/local/xx` (invalid state) | 404 | Clean. |
| `/b/nonexistent-business-xyz123` | 404 | Clean. |
| `/sign-in` | 404 | Clean. |

Spot-checked 200 bodies for error/empty states — all rendered real content (no "couldn't load" / "no businesses" empty shells):
`/local/act/canberra/canberra-2600/plumbing/blocked-drain-repair`, `/compare`, `/quotes`, `/local/nsw/sydney/ashfield-2372`, `/top/electrician/vic/geelong`.
(The "Page not found" string visible in page source is the embedded Next.js not-found component in the RSC flight payload, not rendered content.)

**Data-quality side note:** `/local/nsw/sydney/ashfield-2372` titles itself "136 Trusted Tradies in Ashfield NSW 2372" — Ashfield (Sydney) is postcode **2131**; 2372 belongs to a different NSW locality. Postcode mapping bug, linked from the `/local/nsw/sydney` city page.

---

## 4. Infrastructure checks

| URL | Status |
|-----|--------|
| `/robots.txt` | 200 |
| `/sitemap.xml` | 200 |

## 5. Status summary of the 250-URL sample

| Status | Count | Notes |
|--------|-------|-------|
| 200 | 243 | |
| 307 | 4 | auth-gated dashboard/onboarding links (above) |
| 404 | 3 | `/about`, `/trades`, `/top/painter/vic/melbourne/melbourne-3000` |

Plus 3 additional 404s found in the targeted business-profile follow-up (rows 3–5 in section 1).

---

## Recommended fixes (priority order)

1. **Fix the "Top Rated in {suburb}" link on every business profile** (`apps/web/app/b/[slug]/page.tsx:1193`). Either make `top/[trade]/[state]/[city]/[suburb]/page.tsx` strip the postcode with `parseSuburbSlug` (matching the `/local` suburb page) *and* only render the link when the target has ≥3 rated businesses — or drop the suburb segment and link to the city-level `/top/{trade}/{state}/{city}` page, which works. Today ~100% of business profiles emit a 404 internal link.
2. **Fix the two `/about` links in the suburb/trade template** (`apps/web/app/(public)/local/[state]/[city]/[suburb]/[trade]/page.tsx`). Either create `/about` or repoint "How we verify" / "How It Works" to an existing page/anchor. This template multiplies 2 broken links across tens of thousands of indexed pages.
3. **Return a real 404 for unknown suburbs** in `/local/[state]/[city]/[suburb]` instead of a 200 + noindex template — bring it in line with the clean 404 behavior of `/local/[state]` and `/b/[slug]`, so invalid local URLs (the historical sitemap pollution source) stop consuming crawl budget.
