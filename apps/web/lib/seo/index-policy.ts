import type { Metadata } from "next";

/**
 * Central Google index gates — SEO_RECOVERY_PLAN.md Phase 1.
 *
 * The generic robots meta stays `index, follow` so Bing keeps ranking the full
 * long tail; only the `googlebot` meta carries the gate (Google documents the
 * engine-specific meta, Bing ignores it). Gates are dynamic: a page that
 * crosses its threshold (businesses join, reviews land, profile claimed)
 * becomes Google-indexable on the next render — nothing is deleted.
 *
 * Thresholds calibrated against live DB counts 2026-07-28 so the
 * Google-indexable directory surface stays in the low thousands until domain
 * authority grows (1 referring domain at calibration time):
 *   localTrade >= 4  → 1,431 pages (>=2 was 5,888 — the rejected pile)
 *   suburb cats >= 2 → 1,120 hubs
 *   profile claimed or 50+ reviews w/ photos → ~3,516 of 23,850
 */
export const GOOGLE_GATES = {
    cityMinBusinesses: 2,
    suburbMinCategories: 2,
    localTradeMinBusinesses: 4,
    localJobMinBusinesses: 5,
    topMinBusinesses: 3,
    topMinReviews: 5,
    profileMinReviews: 50,
} as const;

/**
 * Stricter tier for what gets actively submitted in the Google sitemap (the
 * release valve): only pages we are confident will index AND hold. Pages that
 * pass googleIndexable but miss this tier are crawlable via internal links,
 * just not pushed.
 */
export const GOOGLE_SITEMAP_TIER = {
    topMinBusinesses: 5,
    topMinReviews: 20,
} as const;

export type GoogleIndexInput =
    | { page: "state"; businessCount: number }
    | { page: "city"; businessCount: number }
    | { page: "suburb"; categories: number }
    | { page: "localTrade"; businessCount: number }
    | { page: "localJob"; businessCount: number }
    | { page: "topCity" | "topSuburb"; businessCount: number; totalReviews: number }
    | { page: "profile"; isClaimed: boolean; totalReviews: number; photoCount: number };

export function googleIndexable(input: GoogleIndexInput): boolean {
    switch (input.page) {
        case "state":
            return input.businessCount > 0;
        case "city":
            return input.businessCount >= GOOGLE_GATES.cityMinBusinesses;
        case "suburb":
            return input.categories >= GOOGLE_GATES.suburbMinCategories;
        case "localTrade":
            return input.businessCount >= GOOGLE_GATES.localTradeMinBusinesses;
        case "localJob":
            return input.businessCount >= GOOGLE_GATES.localJobMinBusinesses;
        case "topCity":
        case "topSuburb":
            return input.businessCount >= GOOGLE_GATES.topMinBusinesses
                && input.totalReviews >= GOOGLE_GATES.topMinReviews;
        case "profile":
            return input.isClaimed
                || (input.totalReviews >= GOOGLE_GATES.profileMinReviews && input.photoCount > 0);
    }
}

/** Directory-page robots: indexable everywhere, Google only past the gate. */
export function directoryRobots(input: GoogleIndexInput): Metadata["robots"] {
    return {
        index: true,
        follow: true,
        googleBot: { index: googleIndexable(input), follow: true },
    };
}
