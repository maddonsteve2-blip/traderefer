# 🗺️ TradeRefer.au Search & Scale Roadmap

This roadmap outlines how we scale the TradeRefer business directory from the **Geelong Pilot** to every city in Australia using the **DataForSEO Business Data API**.

## 🚀 Scaling Strategy

### 1. The "Batch-First" Architecture
To stay within DataForSEO rate limits and minimize costs, we use the **Standard Method** (Task-Based) instead of Live.
*   **Discovery**: `business_listings/search/live` (10 results per suburb/trade).
*   **Batching**: Group up to **100 businesses** in a single `reviews/task_post` call.
*   **Efficiency**: Reduces total requests by 100x compared to single-business polling.

### 2. Rate Limit Guardians
Our implementation follows these strict constraints to avoid 429 Errors:
*   **Max Concurrent Requests**: 30 (as per DataForSEO best practices).
*   **Throughput**: Steady flow (max 1,000 requests/min).
*   **Wait Time**: Standard review tasks take ~20-60 seconds. Our worker waits for completion before pulling data.

### 3. Data-Driven "Helpful Content"
To satisfy Google's 2025 "Helpful Content" requirements, we don't just dump raw data.
*   **Review Snippets**: We store up to 5 real reviews per business.
*   **Trust Score**: A calculated 0-100 metric based on rating value and volume.
*   **Local Market Reports**: Automated summaries like *"The 10 Best Verified Plumbers in Belmont (2026)"*.

---

## 📍 Geographic Rollout Schedule

| Phase | Region | Target Pages | Status |
| :--- | :--- | :--- | :--- |
| **Phase 1** | Geelong & Surf Coast | 1,000 | 🛠️ In Progress |
| **Phase 2** | Melbourne (West & North) | 5,000 | ⏳ Next |
| **Phase 3** | Regional Victoria (Ballarat, Bendigo) | 2,500 | ⏳ Planned |
| **Phase 4** | Major Capitals (Sydney, Brisbane, Perth) | 50,000+ | ⏳ Future |

## 🛠️ Tech Stack & Location
*   **Scraper Script**: `scripts/scrape_dataforseo_optimized.js`
*   **Database**: Neon Postgres (integrated with review storage)
*   **Documentation**: This file (`ROADMAP_SCALING.md`)

---

### Important Files
- [Optimized Scraper](file:///c:/Users/61479/Documents/trade-refer-stitch/scripts/scrape_dataforseo_optimized.js)
- [Database Schema Update](file:///c:/Users/61479/Documents/trade-refer-stitch/scripts/final_pattern_check.js) (Example patterns)
