# TradeRefer SEO & Data Growth Roadmap

This roadmap outlines the strategy for populating TradeRefer with business data to drive organic search traffic through Programmatic SEO (pSEO).

## Phase 1: Foundation & "Geelong Alpha" Test (Initial 7 Days)
**Objective:** Validate that scraped business data drives impressions and leads in a controlled local market.

- [x] **Database Preparation:** Modify `businesses` table to support `unclaimed` profiles and `user_id` as nullable.
- [x] **Claim & Delist Logic:** Create tables for handling business ownership claims and removal requests.
- [x] **Geelong Suburb Mapping:** Define a list of 30+ suburbs and 20+ trade categories for the test area.
- [x] **Data Harvesting:** Run the Google Maps scraper for the Geelong area.
- [x] **pSEO Subdomain/Routes:** Implement `local/[state]/[city]/[suburb]/[trade]` dynamic pages and state/city hubs.
- [x] **Dependency Fix:** Resolved Playwright Stealth issues.

## Phase 2: The "Trojan Horse" Conversion Hook
**Objective:** Convert directory visitors into registered users (Consumers or Tradies).

- [ ] **Locked Contact Content:** Show professional profiles but blur phone/email behind a "Free Sign-up" wall.
- [x] **Claim Your Business:** Implemented "Is this your business? Claim it for free" buttons on every unclaimed profile.
- [ ] **Verification Workflow:** Create an admin dashboard to review and approve `business_claims` based on ABN/License evidence.
- [x] **Delisting Form:** Added "Request Removal" link on profiles for compliance.

## Phase 3: SEO Content Expansion
**Objective:** Scale the pages and improve the "Search Quality" to beat competitors like ServiceSeeking and HiPages.

- [x] **Interlinking Footer:** Added Directory Footer to all hub pages for better crawlability.
- [ ] **Rich Data Snippets:** Add Schema.org `LocalBusiness` and `AggregateRating` markup to every profile.
- [ ] **Comparison Hub:** Create pages like "TradeRefer vs HiPages" to capture high-intent comparison traffic.
- [ ] **Referrer Network Integration:** Prompt users on directory pages to "Get a Vetted Referral" instead of just calling a random number.

## Phase 4: National Scale-Up (Week 2 Onwards)
**Objective:** Roll out the Geelong model to Melbourne, Sydney, Brisbane, etc.

- [ ] **City-by-City Rollout:** Scrape major cities in order of trade volume.
- [ ] **Bulk Verification:** Explore ABR (Australian Business Register) API for automatic validation of scraped ABNs.
- [ ] **Sitemap Generation:** Automate `sitemap.xml` updates to include the thousands of new programmatic pages.

## Status Tracking
| Phase | Task | Status | Priority |
| :--- | :--- | :--- | :--- |
| Phase 1 | DB Schema Updates | ✅ COMPLETED | High |
| Phase 1 | Scraper Setup | ✅ COMPLETED | High |
| Phase 1 | Geelong Config | ✅ COMPLETED | Medium |
| Phase 2 | Claim Form & Backend | ✅ COMPLETED | High |
| Phase 2 | Delisting Form | ✅ COMPLETED | Medium |
| Phase 2 | pSEO Route Templates | ✅ COMPLETED | High |
| Phase 3 | Interlinking Footer | ✅ COMPLETED | Medium |

---
**Last Updated:** February 28, 2026
