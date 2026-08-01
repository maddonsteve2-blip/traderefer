// Per-job cost overrides. Some job types within a trade have materially
// different pricing than the trade-level TRADE_COST_GUIDE average (e.g.
// turf laying is far cheaper per m² than general landscaping). Keyed by
// job slug (see jobToSlug in lib/constants.ts).
export const JOB_COST_OVERRIDES: Record<string, { unit: string; low: number; high: number; note?: string }> = {
    "turf-laying": { unit: "/m²", low: 25, high: 50, note: "supplied and laid; turf alone $10-$19/m²" },
    // Maintenance/resurfacing jobs priced far below their trade's full-build
    // bucket, and premium-material jobs priced above it. Each figure matches
    // the job's published FAQ answer (batch 3) — one price story per page.
    "deck-sanding-and-sealing": { unit: "/m²", low: 35, high: 70 },
    "deck-oiling-and-staining": { unit: "/m²", low: 15, high: 35 },
    "tile-regrouting": { unit: "/m²", low: 15, high: 40 },
    "bathroom-tap-installation": { unit: " per tap", low: 150, high: 400 },
    "frameless-shower-screen-installation": { unit: " per screen", low: 900, high: 2200 },
    "shower-screen-replacement": { unit: " per screen", low: 275, high: 1008, note: "screen only; fitting labour on top" },
    "kitchen-splashback-installation": { unit: "/m²", low: 60, high: 180 },
    "stone-benchtop-installation": { unit: " per benchtop", low: 4800, high: 7500, note: "typical 5m² kitchen, installed" },
    "engineered-timber-flooring-installation": { unit: "/m²", low: 160, high: 250, note: "installed; board cost dominates" },
    "glass-pool-fencing": { unit: " per metre", low: 400, high: 800, note: "frameless; semi-frameless from ~$250/m" },
    "aluminium-slat-fencing": { unit: " per metre", low: 250, high: 600 },
    "waterproofing-and-tiling": { unit: "/m²", low: 60, high: 180 },
    "waterproofing-membrane-installation": { unit: "/m²", low: 30, high: 80 },
    "kitchen-sink-installation": { unit: " supply and install", low: 600, high: 1600, note: "labour-only swap $250-$600" },
    "vanity-installation": { unit: " supply and install", low: 800, high: 2500 },

    // Jobs Bing's AI surfaces already cite us for (AI Search Queries report,
    // 2026-08-01). Each figure mirrors that job's own published cost answer:
    // their trades' coarse guides were wrong by up to two orders of magnitude
    // (Locksmith reads $80-$250 per job, but a key cut is $5-$15).
    "key-cutting": { unit: " per key", low: 5, high: 15, note: "car and transponder keys from $80" },
    "lock-rekeying": { unit: " per lock", low: 60, high: 150 },
    "emergency-lockout-service": { unit: " per callout", low: 100, high: 250, note: "after hours costs more" },
    "lock-change-and-replacement": { unit: " per lock", low: 150, high: 400 },
    "digital-lock-installation": { unit: " installed", low: 350, high: 900 },
    "home-alarm-system-installation": { unit: " installed", low: 600, high: 2500 },
    "cctv-installation": { unit: " installed", low: 1500, high: 4000, note: "typical four-camera home system" },
    "security-camera-installation": { unit: " installed", low: 1500, high: 4000 },
    "commercial-cctv-installation": { unit: " installed", low: 3000, high: 8000, note: "six to eight cameras" },
    "alarm-system-upgrade": { unit: " installed", low: 400, high: 1800 },
    "smart-home-security-system": { unit: " installed", low: 800, high: 3000 },
    "access-control-system-installation": { unit: " installed", low: 1200, high: 5000 },
    "intercom-system-installation": { unit: " installed", low: 500, high: 2500 },
    "video-doorbell-installation": { unit: " to install", low: 150, high: 500, note: "labour only; doorbell extra" },
    "motion-sensor-installation": { unit: " per sensor", low: 80, high: 250 },
    "back-to-base-monitoring": { unit: " per month", low: 25, high: 60 },
    "alarm-monitoring-service": { unit: " per month", low: 25, high: 60 },
    "security-system-servicing": { unit: " per visit", low: 120, high: 350 },
    "security-lighting-installation": { unit: " per light", low: 150, high: 600 },
    "hoarder-clean-up": { unit: " per job", low: 1000, high: 10000 },
    "hoarder-house-clean-up": { unit: " per job", low: 2000, high: 10000 },
    "tree-removal": { unit: " per tree", low: 500, high: 5000 },
    "stump-grinding": { unit: " per stump", low: 100, high: 400 },
    "tree-lopping": { unit: " per job", low: 300, high: 2500 },
    "emergency-tree-removal": { unit: " per job", low: 800, high: 6000 },
    "termite-inspection": { unit: " per inspection", low: 250, high: 600 },
    "termite-treatment": { unit: " per treatment", low: 1500, high: 5000 },
    "cockroach-treatment": { unit: " per treatment", low: 150, high: 400 },
    "scaffolding-hire-residential": { unit: "/m²", low: 40, high: 80, note: "roughly $500-$3,000 per house job" },
    "scaffolding-hire-commercial": { unit: "/m²", low: 50, high: 100 },
    "vertical-blinds-installation": { unit: " per window", low: 80, high: 250 },
    "roller-blinds-installation": { unit: " per window", low: 80, high: 250 },
    "plantation-shutters-installation": { unit: "/m²", low: 400, high: 900 },
    "suspended-ceiling-installation": { unit: "/m²", low: 50, high: 100 },
    "roof-flashing-repair": { unit: " per repair", low: 300, high: 1500 },
    "emergency-roof-repair": { unit: " per callout", low: 300, high: 2500 },
    "roof-inspection": { unit: " per inspection", low: 150, high: 400 },
    "roof-tile-replacement": { unit: " per repair", low: 300, high: 1800 },
};

/**
 * Returns the cost guide for a specific job, preferring a job-level override
 * over the trade-level fallback. Single source of truth for hero copy, meta
 * descriptions, and AggregateOffer JSON-LD on the job page.
 */
export function jobCostGuide(
    jobSlug: string,
    tradeFallback: { unit: string; low: number; high: number } | undefined
): { unit: string; low: number; high: number; note?: string } | undefined {
    return JOB_COST_OVERRIDES[jobSlug] || tradeFallback;
}
