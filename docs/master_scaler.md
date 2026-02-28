
# 🌍 TRADEREFER NATIONAL SCALER - MASTER SCRIPT
**Location:** `/scripts/sc_master_national.js`

This script is the "Control Tower" for the entire Australian trade-refer expansion. It automates the process of finding businesses, verifying their quality, and enriching them with real Google Reviews.

---

## 🛠️ Commands
Run the master script using **Node.js**:

| Command | Action |
| :--- | :--- |
| `node scripts/sc_master_national.js --all` | **Full Cycle**: Discover businesses AND enrich them with reviews. |
| `node scripts/sc_master_national.js --init` | **Reset Queue**: Repopulates the queue with all major AU cities/trades. |
| `node scripts/sc_master_national.js --discover` | **Find Businesses**: Searches for high-rated businesses (4+ stars). |
| `node scripts/sc_master_national.js --enrich` | **Deep Enrichment**: Fetches and imports real Google reviews. |
| `node scripts/sc_master_national.js --status` | **Dashboard**: Shows progress and performance metrics. |

---

## 🚦 Processing Phases

### 1. Initialization (`--init`)
- Populates the `scrape_queue` table.
- Cities: Geelong, Melbourne, Sydney, Brisbane, Perth, Adelaide, Canberra.
- Trades: Plumbers, Electricians, Roofers, Landscapers, Painters, etc.

### 2. Discovery Engine (`--discover`)
- Pulls one pending city/trade from the queue.
- Uses DataForSEO `search/live` to find top 50 businesses.
- Filters for **4.0+ ratings**.
- De-duplicates against existing businesses using `place_id`.

### 3. Enrichment Engine (`--enrich`)
- Targets businesses that have a `place_id` but **zero reviews** in our database.
- Uses DataForSEO `task_post` and `task_get` to fetch top 10 real reviews.
- Imports review text, profile names, and ratings for maximal SEO benefit.

### 4. Status Monitor (`--status`)
- Real-time report of:
    - Number of completed vs pending cities.
    - Total businesses collected.
    - Total real reviews imported.

---

## 🔑 Technical Details
- **API**: DataForSEO (Business Data & Google Reviews)
- **Database**: Neon (PostgreSQL)
- **Unique Identifier**: Google `place_id` (stored in `source_url`)
