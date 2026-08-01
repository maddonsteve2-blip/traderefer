# TradeRefer SEO Rescue Status

Last updated: 2026-05-26

## Current Live State

The first SEO rescue pass and the first DeepSyte-driven metadata/accessibility uplift are deployed to production on Vercel and merged to the upstream GitHub repository.

The next rescue pass added dynamic, template-specific Open Graph image generation for homepage, profile, local trade, suburb, top-list, near-me, and trade/job guide templates. The current live pass also reduces public-page mobile weight by removing the embedded Google Maps iframe from profile pages, lazy-loading address autocomplete, disabling eager route prefetches on key public directory templates, replacing the oversized remote local-page hero image with the existing local WebP asset, deferring Clerk/PostHog/Google Analytics away from anonymous SEO routes, optimizing public profile photo/logo payloads through Next image delivery, and tightening noindex referral application pages discovered in GSC.

The latest route-flow rescue pass is deployed and verified on production. It fixes public navigation from the landing page, restores the public business directory render path, adds a real noindex listing-removal support page, prevents homepage popular-search links from emitting bad city/postcode combinations, and adds repo-side Vercel monorepo build config for the GitHub-connected deployment.

The selector-level focus follow-up is also deployed. The homepage rewards marquee no longer injects duplicated off-screen carousel cards into the keyboard tab order; the visible `/rewards` path is now the normal "See all 335 brands" CTA.

The latest sitemap cleanup pass is deployed and verified. It responds to a GSC zero-click/indexation contradiction: `/local/act/canberra/queanbeyan/excavation` was `noindex, follow` live but still present in the trade sitemap while the canonical NSW Queanbeyan page was also submitted. The sitemap generator now only emits suburb and suburb/trade URLs when the suburb segment has a valid state/postcode signal from the canonical lookup or the business address, keeping unsupported state/suburb combinations out of XML.

- Production domain: `https://traderefer.au`
- Vercel deployment: `https://traderefer-gt5cyuoo3-stevejfords-projects.vercel.app` for commit `30a5c66a`
- Upstream PR: `https://github.com/maddonsteve2-blip/traderefer/pull/1` (merged)
- Active upstream PR for dynamic OG images: `https://github.com/maddonsteve2-blip/traderefer/pull/2`
- Fork containing rescue commits: `https://github.com/stevejford/traderefer`
- Railway API deployment: `828c4e70-3422-4c62-b3e5-a7ad2a1cc4d8` for commit `4abaddb4`

Local commits:

- `cfa6fa98 Rescue TradeRefer SEO indexation`
- `eee3c1ee Add TradeRefer SEO rescue monitoring`
- `4abaddb4 Document TradeRefer SEO rescue status`
- `52e79312 Improve SEO metadata and accessibility signals`
- `c4a77e6f Strengthen visible focus styles`
- `bdde8997 Force visible focus outline`
- `9cd430b7 Fix homepage rewards carousel focus order`
- `41bf84aa Include public web assets in Vercel deploys`
- `79f34d7a Use lightweight business logo placeholders`
- `9e6ec85e Disable footer prefetch on public SEO pages`
- `89123c22 Disable directory page link prefetch`
- `4bc1ed35 Document public asset performance pass`
- `d0b3de4a Optimize public profile photos`
- `790e180c Document profile photo performance pass`
- `a14a3d36 Optimize rendered business logos`
- `e11486e5 Preserve logo aspect ratio`
- `d0cd9172 Document logo optimization evidence`
- `9bf62f3b Clean up refer indexation flow`
- `edb9f70c Tighten refer page metadata`
- `4a806d5c Add refer social metadata`
- `30a5c66a Exclude invalid local URLs from sitemaps`

The upstream repository is still behind the fork rescue branch. The fork branch has deployed rescue commits through `30a5c66a`; PR #2 is open, clean, and mergeable, but a merge attempt from `stevejford` failed with `does not have the correct permissions to execute MergePullRequest`, so upstream merge still needs a repo maintainer.

## Live Sitemap Counts

Run:

```bash
npm run seo:monitor
```

Current verified counts:

- `general`: 812 URLs
- `profiles`: 33,632 URLs
- `suburbs`: 1,175 URLs
- `trades`: 14,551 URLs
- `top`: 1,264 URLs

The generic national near-me URLs are no longer in the XML sitemap. Known bad postcode variants such as `/local/nsw/epping/epping-3076/...` are no longer in XML. The invalid ACT Queanbeyan trade URL `/local/act/canberra/queanbeyan/excavation` is also gone from XML while `/local/nsw/queanbeyan/queanbeyan-2620/excavation` remains submitted.

## Verified Live Behaviors

The monitor currently checks these URLs:

- `/local/nsw/epping/epping-3076/drainage` redirects with `308` to `/local/nsw/epping/epping-2118/drainage`.
- `/local/act/canberra/queanbeyan/excavation` remains `noindex, follow` and is absent from XML.
- `/local/nsw/queanbeyan/queanbeyan-2620/excavation` remains `index, follow` and present in XML.
- `/local/nsw/sydney/caringbah-2229/air-conditioning-heating` is `index, follow`.
- `/local/nsw/sydney/caringbah-2229/air-conditioning-heating/split-system-air-conditioner-electrical` is `noindex, follow`.
- `/top/air-conditioning-heating/nsw/parramatta` is `index, follow`.
- `/air-conditioning-specialists-near-me` is `noindex, follow`.

## Live Route-Flow Verification

Rendered Chrome sweep from the production landing page on 2026-05-26 after deployment found 84 unique internal routes and 0 route-flow issues:

- `/businesses` returns `200` and renders `Find Verified Trades Near You`.
- Visible `/businesses?category=...` category links render the directory page.
- Public directory browsing no longer triggers `/api/enrich-business`.
- The public header and mobile menu expose `/register`, not `/signup`.
- Visible homepage `/local/...` popular-search links no longer redirect from bad city/postcode combinations.
- `/remove` returns `200`, renders `Request a business listing removal`, and emits `noindex, follow`.

DeepSyte CLI confirmation runs:

- Broken production before deploy: `https://web-phi-eight-56.vercel.app/dashboard/runs/KL7dmkvXgLi_0-k363S76`.
- Fixed production after deploy: `https://web-phi-eight-56.vercel.app/dashboard/runs/zCpe_1eljoZEXrdG-ciHA`.

## GSC State

Latest GSC cache seen during rescue monitor:

- Pulled at: `2026-05-25T20:58:54.996111+00:00`
- Last 28 days: 11 clicks, 3,458 impressions, 0.32% CTR, average position 15.3

The existing `gsc_token.json` has readonly scope only. Sitemap listing works, but submitting from this workspace still fails with `403 insufficient authentication scopes`.

The cleaned sitemap has been resubmitted in Google Search Console. Readonly verification shows:

- Path: `https://traderefer.au/sitemap.xml`
- Last submitted: `2026-05-26T08:13:44.856Z`
- Last downloaded: `2026-05-26T08:13:46.375Z`
- Pending: `false`
- Warnings: `0`
- Errors: `0`

## DeepSyte State

DeepSyte MCP is connected and was used for sampled public-page audits across homepage, local trade, suburb, top, profile, and generic near-me templates.

Observed state and fixes:

- DeepSyte run evidence: `https://www.deepsyte.com/dashboard/runs/Fbv29oZ7TbD7-83yvGvnl` and `https://www.deepsyte.com/dashboard/runs/fl2kCPImF01cyYApXDbys`.
- Homepage description is shorter and clearer.
- Local trade page title is shorter; sampled page changed from `2 Verified Air Conditioning Specialists in Caringbah 2229 | TradeRefer` to `2 Air Conditioning Specialists in Caringbah 2229`.
- Suburb, top, profile, and generic near-me templates now emit complete OG/Twitter image metadata.
- Public profile pages now include the shared footer landmark.
- App-wide skip link is present.
- Orange-on-white CTA contrast now passes DeepSyte sampled contrast checks.
- Live computed styles confirm focused CTA links receive a 3px outline plus 6px focus halo.

- Selector-level focus follow-up completed on 2026-05-26:
  - Local DeepSyte check after patch: homepage first 45 focus stops had 0 invisible focus indicators and no off-screen rewards-card links. Only the intended skip link starts offscreen.
  - Live DeepSyte check after deployment: homepage first 45 focus stops had 0 invisible focus indicators, 122 focusable elements, and the only `/rewards` tab stop was the visible "See all 335 brands" link.
  - Live template samples for `/businesses`, `/local/nsw/sydney/caringbah-2229/air-conditioning-heating`, `/top/air-conditioning-heating/nsw/parramatta`, and `/b/derek-son-painting-group` had 0 invisible focus indicators in the checked tab stops.
  - Evidence: `https://web-phi-eight-56.vercel.app/dashboard/runs/3i7mz5JzbvYmBL7VxDgwm` and `https://www.deepsyte.com/dashboard/runs/kjGqEzXwtzLYdGklZx9kK`.
- Residual DeepSyte aggregate finding should be treated as superseded for the checked selectors, but a future full aggregate a11y run can confirm the scanner no longer reports the old `WCAG 2.4.7` item.
- Template-specific OG images are live on production via `apps/web/app/api/og/route.tsx` and `apps/web/lib/og-image.ts`.
- Live metadata checks show homepage, local trade, top-list, near-me, and plumber guide pages now emit `/api/og?...` image URLs instead of `og-default.jpg`.
- DeepSyte OG preview for `/local/nsw/sydney/caringbah-2229/air-conditioning-heating` scored `100/100`, found `og:image` and `twitter:image` using `/api/og`, validated 1200x630 dimensions, and rendered the local trade card successfully.
- Mobile performance pass is live on production. DeepSyte evidence:
  - Profile before: 74 resources, 24 fetches, ~1,385 KB transfer.
  - Profile after: 43 resources, 5 fetches, ~927 KB transfer, no embedded Google Maps iframe.
  - Local trade after final pass: 40 resources, 4 fetches, ~1,009 KB transfer; the 607 KB remote Unsplash hero was replaced by `/images/hero-construction.webp`.
  - Top-list after: 40 resources, 4 fetches, ~105 KB page-size summary, with no failed network requests in the sampled run.
- DeepSyte run evidence for this pass: `https://www.deepsyte.com/dashboard/runs/4YOLPaw0BOGwYgEAhcStE`, `https://www.deepsyte.com/dashboard/runs/808UDTo6puiJVrvMnGuqA`, and `https://www.deepsyte.com/dashboard/runs/FSVjq0ITmUqlxd5Veor8h`.
- Anonymous-route JS deferral pass is live on production. DeepSyte evidence:
  - Profile `/b/derek-son-painting-group`: 24 resources, 1 fetch, 527 KB transfer, LCP 1024ms, no failed requests, and no Clerk/GTM/GA/PostHog/ingest resources.
  - Local trade `/local/nsw/sydney/caringbah-2229/air-conditioning-heating`: 20 resources, 0 fetches, 599 KB transfer, LCP 672ms, no failed requests, and no Clerk/GTM/GA/PostHog/ingest resources.
  - Top-list `/top/air-conditioning-heating/nsw/parramatta`: 20 resources, 0 fetches, 587 KB transfer, LCP 704ms, no failed requests, and no Clerk/GTM/GA/PostHog/ingest resources.
- DeepSyte run evidence for anonymous-route JS deferral: `https://www.deepsyte.com/dashboard/runs/Mw6BYZ3Hfrkx_a0st3R2V`, `https://www.deepsyte.com/dashboard/runs/gv9xOuO8fRBrdNo8Ia5Od`, and `https://www.deepsyte.com/dashboard/runs/MJ9K2RgecrZ-Z3q4lFLkH`.
- Public asset and directory performance pass is live on production. DeepSyte evidence:
  - Before the Vercel ignore fix, `/businesses` returned 404s for `/logo.png`, `/logo-dark.png`, and `/images/hero-construction.webp` because root `.vercelignore` excluded `*.png` and `*.webp`.
  - After the public asset allow-list, those asset URLs return `200` and failed network requests are gone.
  - Before the fallback-logo patch, `/businesses` downloaded raw `/logo.png` at ~799 KB as repeated business-card fallback imagery.
  - After the fallback-logo patch, `/businesses` no longer includes raw `/logo.png`; only optimized 64px logo variants remain at ~2 KB each.
  - After disabling footer and directory-card prefetches, `/businesses` dropped from 49 captured resources / ~1,792 KB network to 32 resources / 516 KB in DeepSyte perf, with 0 failed requests and no `_rsc`, homepage hero, or raw-logo resource entries in the targeted check.
  - Evidence: `https://www.deepsyte.com/dashboard/runs/3kKRBK1N-PRBwD0SeA_HW`, `https://www.deepsyte.com/dashboard/runs/24KW2na69XcDHoVxvpC5C`, `https://www.deepsyte.com/dashboard/runs/17IK_-TtjSfpvT4V5Bctj`, `https://www.deepsyte.com/dashboard/runs/hBhTeYvOe_BWRMJlu56bO`, and `https://www.deepsyte.com/dashboard/runs/PAYcm8-MQl-llPAK3yLwk`.
- Public profile photo performance pass is live on production. DeepSyte evidence:
  - `/b/derek-son-painting-group` now renders gallery photos through Next image optimization instead of raw remote `<img>` delivery.
  - Visible business logos with a stored background or skipped pixel analysis now also use Next image optimization while the hidden canvas-analysis path remains unchanged.
  - Public profile gallery is capped to the first 6 project photos to preserve visible proof without forcing every crawler/visitor to fetch the full media set.
  - DeepSyte profile run after deployment: 29 resources, 652 KB transfer, 0 failed network requests, 0 console errors, FCP/LCP 236 ms in the browser-session perf read.
  - Image waterfall after deployment: 9 image requests, 185 KB total; gallery/cover requests use `/_next/image?...w=384&q=75` for remote Vercel Blob assets.
  - After the logo optimization follow-up, the same profile still has 29 resources, 0 failed requests, and 0 console errors; image waterfall is 9 image requests, 135 KB total, with the profile logo served as `/_next/image?...w=96&q=75` rather than the raw 57 KB Vercel Blob file.
  - Rendered SEO audit still passes the profile basics: 60-character title, 152-character description, canonical `https://traderefer.au/b/derek-son-painting-group`, robots allowed, `en-AU`, sitemap reference in robots.txt, 10/10 image alt coverage, and LocalBusiness-type schema present as `HousePainter`.
  - Evidence: `https://www.deepsyte.com/dashboard/runs/3SflkKytwACbXvAAm2ANn`, `https://www.deepsyte.com/dashboard/runs/nWdCTz1HbbJTSlvjGMv5d`, and `https://www.deepsyte.com/dashboard/runs/KxKUaZF-sKFK6xIy93WnL`.
- GSC-driven referral application page cleanup is live on production:
  - GSC position-change data exposed `/b/4-ken-pty-ltd-4ken-scaffolding-hire-manufacture-services-sydney-uwl71/refer` receiving impressions as a low-value intermediary page.
  - `/b/[slug]/refer` now emits `robots: noindex, follow`, canonicals to the main `/b/[slug]` profile, and permanent-redirects noncanonical hashed slugs to the canonical refer slug while preserving `src`.
  - The refer page no longer links to the nonexistent `/sign-in` route; existing members go to `/login?redirect_url=...`.
  - Client redirects in public/referrer profile views were also changed from `/sign-in` to `/login`.
  - Live refer-page metadata check: title `Refer 4 Ken Pty Ltd | 4KEN Scaffoldin...`, canonical and `og:url` both point to `https://traderefer.au/b/4-ken-pty-ltd-4ken-scaffolding-hire-manufacture-services-sydney`, OG/Twitter images are present, and there are 0 `/sign-in` links.
  - DeepSyte SEO reports the expected canonical/OG mismatch warning because this noindex application URL intentionally consolidates to the profile URL; title, description, robots, OG image, Twitter image, language, viewport, and image-alt coverage pass.
- Remaining public-page weight is mostly first-party Next.js chunks, font files, favicon/icon transfer, and remote business media served from the Railway API.
- Route-flow pass DeepSyte state:
  - DeepSyte MCP browser navigation is working again; session evidence from the resumed audit: `https://www.deepsyte.com/dashboard/runs/MoGzlDxfwJcuYRAi_kMsO`.
  - DeepSyte CLI `doctor` now passes API reachability and API-key validity against `https://api.deepsyte.com`.
  - DeepSyte CLI controlled local Chrome successfully against the built local app.
  - DeepSyte CLI verified `/businesses` renders `Find Verified Trades Near You` instead of `This page couldn't load`.
  - DeepSyte CLI verified `/remove` renders `Request a business listing removal`, emits `robots: noindex, follow`, and canonicalizes to `https://traderefer.au/remove`.
  - DeepSyte route-flow run: `https://web-phi-eight-56.vercel.app/dashboard/runs/-goQxtCsY94UWQepDypD-`.
  - Some DeepSyte snapshot upload attempts returned API `502`, so keep the local Chrome route-sweep output as the primary route evidence for this pass.

## Current Local Validation

Latest local/live checks:

- Vercel GitHub deployment for fork commit `30a5c66a` completed successfully and aliases `https://traderefer.au`.
- `https://traderefer.au/businesses` returns `200`, renders `Find Verified Trades Near You`, and keeps `robots: index, follow`.
- `https://traderefer.au/remove` returns `200`, renders `Request a business listing removal`, and keeps `robots: noindex, follow`.
- DeepSyte live focus check confirms the homepage rewards marquee is no longer in the keyboard tab order and representative public templates show 0 invisible focus indicators in sampled tab stops.
- `https://traderefer.au/logo.png` and `https://traderefer.au/images/hero-construction.webp` return `200` after the Vercel public asset ignore fix.
- DeepSyte `/businesses` check after the directory prefetch pass: 32 resources, 516 KB transfer, 0 failed network requests, no raw `/logo.png`, no homepage hero prefetch, and no idle `_rsc` prefetch entries in the targeted resource check.
- DeepSyte `/b/derek-son-painting-group` check after the profile photo/logo pass: 29 resources, 660 KB transfer, 0 failed network requests, 0 console errors, profile SEO metadata/canonical/schema still present from the previous rendered SEO check, and image waterfall reduced to optimized Next image requests for cover/gallery/logo media. Image-only transfer is now 135 KB.
- GSC-driven `/b/.../refer` cleanup verified live: canonical hashed refer URL returns `308` to the canonical slug, canonical refer page returns `200`, `robots: noindex, follow`, canonical profile URL, profile `og:url`, OG/Twitter image metadata, 0 `/sign-in` links, and a valid `/login?redirect_url=...` link.
- Production route-flow sweep from `https://traderefer.au/` found 84 visible internal routes and 0 issues.
- Production route-flow sweep found 0 `/signup` links, 0 bad `/local/` redirecting popular-search links, and 0 `/api/enrich-business` calls from public directory browsing.
- GSC sitemap listing confirms `https://traderefer.au/sitemap.xml` was submitted and downloaded on `2026-05-26` with 0 errors and 0 warnings.
- `pnpm.cmd --dir apps/web exec eslint app/page.tsx "app/(public)/businesses/page.tsx" app/remove/page.tsx components/RuntimeShell.tsx lib/public-routes.ts` passed with one existing `<img>` performance warning on directory thumbnails.
- `pnpm.cmd --dir apps/web build` completed successfully after the route-flow, focus-order, public-asset, and directory-prefetch changes.
- Built local app served at `http://localhost:3020` and was swept from the landing page with rendered Chrome.
- Route-flow sweep found 84 unique internal routes exposed from desktop/mobile landing-page navigation and content links.
- Route-flow sweep found zero real failures after retrying two transient category navigations.
- Verified no visible landing-page links point to `/signup`; public header and mobile menu point to `/register`.
- Verified no visible `/local/` popular-search links redirect because of bad city/postcode combinations.
- Verified `/businesses` and visible `/businesses?category=...` links render the directory shell instead of the generic client error state.
- Verified `/businesses` no longer triggers public `/api/enrich-business` requests during rendered navigation.
- Verified `/remove` is a real support route and noindexed.
- `pnpm.cmd --dir apps/web build` completed with `LASTEXITCODE=0`.
- `pnpm.cmd --dir apps/web exec eslint app/layout.tsx app/page.tsx components/RuntimeShell.tsx components/AuthenticatedRuntimeShell.tsx components/GoogleAnalytics.tsx components/ClientProviders.tsx components/PostHogPageView.tsx components/LeadForm.tsx instrumentation-client.ts lib/public-routes.ts` passed.
- `pnpm.cmd --dir apps/web exec eslint components/AddressAutocomplete.tsx` passed.
- `pnpm.cmd --dir apps/web exec eslint app/api/og/route.tsx lib/og-image.ts app/page.tsx app/layout.tsx` passed.
- `curl -I http://localhost:3000/api/og?...` returned `200` with `content-type: image/png`.
- `curl -I https://traderefer.au/api/og?...` returned `200` with `content-type: image/png` after deployment.
- Live HTML checks confirm profile pages no longer contain `maps.google.com/maps?...output=embed`, profile pages include `Open location in Google Maps`, and local trade pages use `/images/hero-construction.webp` instead of the remote Unsplash hero.
- Live HTML checks confirm home, profile, local, and top SEO pages do not include Clerk, Google Tag Manager, or PostHog markers; `/login` still includes Clerk as expected.
- `git diff --check` passed.
- `node scripts/seo_rescue_monitor.mjs` returned `Status: OK` after the invalid local URL sitemap cleanup deployed; watched URL indexation/redirect rules are stable.
- `pnpm --filter web build` completed successfully after the sitemap eligibility patch.
- Repo-wide `pnpm --filter web lint` still fails on pre-existing legacy lint debt; this pass did not add new lint failures in the touched files.
- Broad targeted lint across old directory templates still reports pre-existing `any`, unused import, React set-state-in-effect, and `<img>` warnings/errors unrelated to this performance pass.
- `pnpm.cmd --dir apps/web exec eslint 'app/b/[slug]/page.tsx'` still reports pre-existing `any`/unused-import errors in that legacy profile file; the production `pnpm.cmd --dir apps/web build` passed after the profile image patch.

## Daily Monitoring

Codex automation created:

```text
traderefer-seo-rescue-monitor
```

It runs every 24 hours from this workspace and executes:

```bash
node scripts/seo_rescue_monitor.mjs
```

Watch for:

- sitemap count regressions
- generic near-me URLs leaking back into XML
- invalid postcode variants leaking back into XML
- key URL robots/canonical/redirect behavior changing
- stale GSC cache
- movement in clicks, impressions, CTR, and page-template performance

## Next Recovery Gates

1. Merge the fork rescue commits upstream so `maddonsteve2-blip/traderefer` reflects the deployed production state.
2. Reduce remaining first-party JS/font/icon weight where it materially affects crawl/render cost.
3. Monitor GSC at 7, 14, and 28 days before adding any new programmatic page sets.
