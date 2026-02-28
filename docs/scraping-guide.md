# TradeRefer Scraping Guide

How we populate the business directory with real Australian businesses.

---

## Overview

We use **Google Places API (New)** Text Search to find businesses per suburb/trade combo and store them in the Neon PostgreSQL database. Each run skips combos that already have enough businesses (skip threshold configurable).

---

## Main Script

**File:** `scripts/fill_google_places.js`

```bash
# Run for a specific state
node scripts/fill_google_places.js --state=NSW

# Dry-run (shows what would be scraped, no DB writes, no API calls)
node scripts/fill_google_places.js --state=VIC --dry-run

# Limit number of suburb/trade combos processed
node scripts/fill_google_places.js --state=QLD --max-jobs=500
```

### What it does per suburb+trade combo:
1. Checks if that suburb already has `MIN_PER_TRADE` (default: 3) businesses for that trade — **skips if yes**
2. Calls Google Places Text Search: `"Plumber in Ashfield NSW Australia"`
3. For each result: fetches photo, saves to `logos-cache/` + uploads to Vercel Blob
4. Calls Place Details API to fetch up to 5 reviews
5. Inserts business into `businesses` table with `suburb`, `city`, `state`, `lat`, `lng`
6. Inserts reviews into `business_reviews` table

### Key config (top of file):
| Variable | Default | Description |
|---|---|---|
| `MIN_PER_TRADE` | 3 | Skip if suburb already has this many for the trade |
| `RESULTS_PER_TRADE` | 5 | Max businesses to fetch per API call |
| `DELAY_MS` | 200 | Delay between API calls (ms) |
| `LOGOS_DIR` | `logos-cache/` | Local folder for downloaded logos |

---

## Geocoding Backfill

**File:** `scripts/geocode_backfill.js`

Fills `lat` and `lng` for businesses that have an address but no coordinates. Uses Google Geocoding API.

```bash
# Geocode all businesses missing lat/lng
node scripts/geocode_backfill.js

# Dry-run (just shows count)
node scripts/geocode_backfill.js --dry-run

# Limit to first 500
node scripts/geocode_backfill.js --limit=500
```

**Cost:** ~$0.005 per business geocoded. 11,454 businesses ≈ **$57 USD** total.

---

## Fix Scripts

**`scripts/fix_suburb_city.js`** — One-time fix that corrected swapped `suburb`/`city` columns for 8,978 businesses. Not needed again.

**`scripts/db_query.js`** — Quick DB query helper:
```bash
node scripts/db_query.js "SELECT COUNT(*) FROM businesses WHERE state = 'NSW'"
```

---

## Database Columns Used

| Column | Source | Notes |
|---|---|---|
| `business_name` | `place.displayName.text` | |
| `slug` | Generated | `name-xxxxx` (random suffix) |
| `trade_category` | From our `TRADE_CATEGORIES` list | e.g. "Plumbing Services" |
| `suburb` | From `AUSTRALIA_LOCATIONS` | e.g. "Ashfield" |
| `city` | From `AUSTRALIA_LOCATIONS` | e.g. "Sydney" |
| `state` | From `AUSTRALIA_LOCATIONS` | e.g. "NSW" |
| `lat` / `lng` | `place.location.latitude/longitude` | Used for distance sorting |
| `address` | `place.formattedAddress` | Full formatted address |
| `business_phone` | `place.nationalPhoneNumber` | |
| `website` | `place.websiteUri` | |
| `avg_rating` | `place.rating` | Google rating |
| `total_reviews` | `place.userRatingCount` | |
| `logo_url` | Vercel Blob URL | From place photo |
| `source_url` | `places.googleapis.com/v1/places/{id}` | Unique key, used for ON CONFLICT |
| `data_source` | `"Google Places"` | |

Reviews go into `business_reviews` table via Place Details API.

---

## Running Multiple States in Parallel

Open separate terminal windows:

```bash
node scripts/fill_google_places.js --state=SA
node scripts/fill_google_places.js --state=WA
node scripts/fill_google_places.js --state=VIC
node scripts/fill_google_places.js --state=NSW
node scripts/fill_google_places.js --state=QLD
node scripts/fill_google_places.js --state=TAS
node scripts/fill_google_places.js --state=NT
node scripts/fill_google_places.js --state=ACT
```

**Google Places API pricing:**
- Text Search: $0.032 per call
- Place Details (reviews): $0.017 per call
- Photo: ~$0.007 per photo
- Estimated: ~$0.05–0.10 per suburb/trade combo

**Google Cloud free trial:** $500 credit (check console.cloud.google.com for remaining balance).

---

## How Nearby Search Works (Frontend)

When a user selects a suburb on the directory page (`/businesses`):

1. **Exact match first** — finds businesses with `suburb ILIKE '%Ashfield%'`
2. **Distance sort** — if businesses have `lat`/`lng`, sorted by km from suburb centre
3. **Nearby fallback** — if 0 results, shows businesses from the parent city sorted by distance, with a banner: *"No results in Glebe — showing nearest results from Sydney"*

The suburb centre coordinates are derived by averaging `lat`/`lng` of existing businesses in that suburb.

---

## API Keys

| Key | Used For | Location |
|---|---|---|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Places API, Geocoding API | `apps/web/.env.local` |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob logo upload | `apps/web/.env.local` |
| `DATABASE_URL` | Neon PostgreSQL | `apps/web/.env.local` |

> **Note:** The Google Maps API key has no HTTP referrer restrictions (removed temporarily for server-side use). Re-add restrictions once scraping is complete.

---

## Location Data

All suburbs are defined in `apps/web/lib/constants.ts` under `AUSTRALIA_LOCATIONS`:

```
AUSTRALIA_LOCATIONS = {
  "NSW": {
    "Sydney": ["Ashfield", "Auburn", "Bankstown", ...],
    "Newcastle": ["Broadmeadow", "Charlestown", ...],
    ...
  },
  "VIC": { ... },
  ...
}
```

The fill script iterates every `state → city → suburb → trade` combo.
