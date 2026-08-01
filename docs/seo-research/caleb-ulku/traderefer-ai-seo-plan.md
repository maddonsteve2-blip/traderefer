# TradeRefer AI SEO Plan

Created: 2026-06-03

This plan is about ranking TradeRefer higher and making it more likely to be recommended by Google, AI Overviews, ChatGPT-style agents, Perplexity-style answer engines, and future local recommendation layers. It is not a plan to create a new tool.

## Current GSC Snapshot

Source: TradeRefer GSC API, pulled 2026-06-01T21:00:19Z, last 28 days from 2026-05-02 to 2026-05-30.

- Total clicks: 11
- Total impressions: 1,717
- Average position: 9.7
- Unique queries: 76
- Unique pages: 508
- Home page: 9 clicks from 25 impressions
- Profile pages: 242 pages, 853 impressions, 1 click, weighted position 5.26
- Local pages: 257 pages, 914 impressions, 1 click, weighted position 13.97
- Trade pages: 8 pages, 13 impressions, 0 clicks

Most urgent signal: many profile and local pages are ranking, but users are not clicking. This is both a CTR problem and a trust/usefulness problem.

## Caleb Research Principles Applied To TradeRefer

1. Entity alignment beats keyword stuffing.

TradeRefer must make each entity obvious: business, trade, service, suburb, city, state, referral, and claimed profile. Every indexable page should prove what entity it represents and why it exists.

2. AI content is fine only when it executes a real strategy.

Do not generate broad city/service pages blindly. AI can help write briefs, metadata, answer blocks, schema, and FAQs, but publishing must be gated by real data and QA.

3. Reviews and trust signals need specificity.

AI systems and users need concrete service, outcome, and location details. Generic trust language is weak. Profile pages should surface specific business attributes only when we actually have evidence.

4. Local pages need both topical and geographic relevance.

A page for a trade in a suburb should show matching businesses, service coverage, and useful local context. If it cannot, it should not be indexable yet.

5. Clicks are lagging indicators, but zero-click rankings are actionable.

If a page ranks top 3 and gets no clicks, fix the snippet, title, trust signals, and page promise before creating more pages.

## Priority 1: CTR Rescue For Ranking Pages

Start with zero-click pages that already have impressions and strong positions:

- `https://traderefer.au/b/landscapers-pro-mgu9z`
- `https://traderefer.au/local/nsw/wollongong/fairy-meadow/electrician`
- `https://traderefer.au/b/oms-construction-pty-ltd-oxpxs`
- `https://traderefer.au/b/hsy-joinery-pty-ltd-jcm2o`
- `https://traderefer.au/b/western-sheds-garages-y4prz`
- `https://traderefer.au/local/nt/darwin/leanyer/waterproofing`
- `https://traderefer.au/b/b-m-electric-pty-ltd-tetlu`
- `https://traderefer.au/b/revive-pdkfv`
- `https://traderefer.au/b/tnt-fabrication-sklxp`
- `https://traderefer.au/b/marrvale-qld-pty-ltd-gold-coast-painting-contractors`

Actions:

- Rewrite title/meta patterns for `/b/` profiles to include business name, primary service/trade, service area, and a clear reason to click.
- Rewrite `/local/` titles/metas to promise a useful comparison page, not a generic directory page.
- Add a first-screen answer block on priority local pages: who is listed, where they serve, how to compare, and next action.
- Add profile trust snippets near the top: claimed status, listed services, service area, referral action, and visible reviews if available.
- Ensure profile and local schema matches visible content.

## Priority 2: Page Eligibility Rules

Every indexable programmatic page should pass a quality gate.

Profile pages can be indexable when they have:

- business name,
- canonical slug,
- at least one trade/service category,
- service location or area,
- useful contact/referral action,
- visible business detail beyond just a name,
- schema that matches visible facts.

Local trade pages can be indexable when they have:

- at least one strong matching business, preferably more,
- valid state/city/suburb/postcode combination,
- canonical URL,
- no duplicate suburb/city variant,
- visible business list or useful empty-state alternative,
- page-specific intro based on actual matching data,
- internal links to related canonical pages.

Pages should be noindexed or excluded from sitemaps when they are:

- empty or near-empty,
- invalid state/postcode combinations,
- duplicate suburb variants,
- impossible geography,
- service/location combinations with no useful business coverage,
- generated solely from keyword combinations without evidence.

## Priority 3: AI-Extractable Page Blocks

Add reusable page sections that help AI systems and users extract the answer.

For profile pages:

- "What this business appears to offer"
- "Service areas"
- "Useful for"
- "TradeRefer referral action"
- "Business details"
- "Similar trades near this area"

For local pages:

- "TradeRefer lists [trade] businesses serving [suburb/city]"
- "How to compare [trade] businesses in [place]"
- "Listed businesses"
- "Nearby suburbs"
- "Related services"
- "FAQ"

The first 200 words should contain the clear answer and the action. Do not bury the reason to use the page.

## Priority 4: Review And Attribute Strategy

TradeRefer should collect and display more specific profile attributes:

- emergency availability,
- residential/commercial,
- licensed/insured where known,
- service radius,
- common job types,
- suburbs served,
- claimed profile status,
- business owner supplied descriptions,
- referral response rate if available.

For claimed businesses, add onboarding prompts that ask owners for concrete facts, not marketing slogans:

- What services do you actually want leads for?
- Which suburbs do you serve regularly?
- What jobs do you not do?
- What makes you a good fit for urgent, residential, commercial, or specialist work?
- What proof can we show publicly?

## Priority 5: Manual AI Visibility Testing

Do not start by buying citation-tracking software. Start with a manual prompt set and record whether TradeRefer is recommended or cited.

Test prompts:

- "Find electricians in Fairy Meadow NSW and compare options."
- "Who can help with waterproofing in Leanyer NT?"
- "Find a landscaper near me and explain how to compare them."
- "What is the best way to get quotes from local tradies in Australia?"
- "Where can I find trusted tradespeople in Geelong?"

Record:

- whether TradeRefer appears,
- which competitors appear,
- what sources are cited,
- what attributes the AI used,
- whether the prompt resolves to Google Maps, marketplace sites, business websites, or directories.

## Priority 6: Weekly Operating Loop

Each week:

1. Pull GSC latest, pages, zero-click, query intent, and crawl issues.
2. Select the top 10 zero-click pages with position under 5.
3. Audit title, meta, H1, first 200 words, schema, visible trust, and internal links.
4. Patch the page/template or noindex it if it cannot meet the quality gate.
5. Run manual AI prompt tests for the same locations/trades.
6. Monitor 7, 14, and 28 day changes by template.

## First Sprint

Sprint goal: recover trust and improve CTR on pages Google already surfaces.

Deliverables:

- Profile metadata rewrite for priority `/b/` pages.
- Local page answer block and title/meta rewrite for priority `/local/` pages.
- Page eligibility rules implemented in sitemap/noindex logic.
- Schema audit for profile and local templates.
- Manual AI prompt test log for 10 priority queries.
- Updated GSC rescue report after 7 days.

Do not create more programmatic pages until this sprint is done and measured.
