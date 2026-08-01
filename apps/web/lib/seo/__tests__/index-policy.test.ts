import { describe, expect, it } from "vitest";
import { GOOGLE_GATES, directoryRobots, googleIndexable } from "../index-policy";

describe("googleIndexable", () => {
    it("gates local trade pages at the calibrated business count", () => {
        expect(googleIndexable({ page: "localTrade", businessCount: GOOGLE_GATES.localTradeMinBusinesses })).toBe(true);
        expect(googleIndexable({ page: "localTrade", businessCount: GOOGLE_GATES.localTradeMinBusinesses - 1 })).toBe(false);
        expect(googleIndexable({ page: "localTrade", businessCount: 0 })).toBe(false);
    });

    it("gates job pages harder than trade pages", () => {
        expect(GOOGLE_GATES.localJobMinBusinesses).toBeGreaterThan(GOOGLE_GATES.localTradeMinBusinesses);
        expect(googleIndexable({ page: "localJob", businessCount: 5 })).toBe(true);
        expect(googleIndexable({ page: "localJob", businessCount: 4 })).toBe(false);
    });

    it("gates suburb hubs on category spread, not raw count", () => {
        expect(googleIndexable({ page: "suburb", categories: 2 })).toBe(true);
        expect(googleIndexable({ page: "suburb", categories: 1 })).toBe(false);
    });

    it("keeps state and city hubs open at low thresholds", () => {
        expect(googleIndexable({ page: "state", businessCount: 1 })).toBe(true);
        expect(googleIndexable({ page: "state", businessCount: 0 })).toBe(false);
        expect(googleIndexable({ page: "city", businessCount: 2 })).toBe(true);
        expect(googleIndexable({ page: "city", businessCount: 1 })).toBe(false);
    });

    it("requires both count and reviews on top pages", () => {
        expect(googleIndexable({ page: "topCity", businessCount: 3, totalReviews: 5 })).toBe(true);
        expect(googleIndexable({ page: "topCity", businessCount: 3, totalReviews: 4 })).toBe(false);
        expect(googleIndexable({ page: "topSuburb", businessCount: 2, totalReviews: 100 })).toBe(false);
    });

    it("opens profiles for claimed businesses regardless of reviews", () => {
        expect(googleIndexable({ page: "profile", isClaimed: true, totalReviews: 0, photoCount: 0 })).toBe(true);
    });

    it("opens unclaimed profiles only when heavily reviewed with photos", () => {
        expect(googleIndexable({ page: "profile", isClaimed: false, totalReviews: 50, photoCount: 1 })).toBe(true);
        expect(googleIndexable({ page: "profile", isClaimed: false, totalReviews: 50, photoCount: 0 })).toBe(false);
        expect(googleIndexable({ page: "profile", isClaimed: false, totalReviews: 49, photoCount: 5 })).toBe(false);
    });
});

describe("directoryRobots", () => {
    it("always leaves the generic robots meta indexable for Bing", () => {
        const closed = directoryRobots({ page: "localTrade", businessCount: 0 });
        expect(closed).toMatchObject({ index: true, follow: true });
    });

    it("carries the gate on the googleBot directive only", () => {
        expect(directoryRobots({ page: "localTrade", businessCount: 9 })).toEqual({
            index: true,
            follow: true,
            googleBot: { index: true, follow: true },
        });
        expect(directoryRobots({ page: "localTrade", businessCount: 1 })).toEqual({
            index: true,
            follow: true,
            googleBot: { index: false, follow: true },
        });
    });
});
