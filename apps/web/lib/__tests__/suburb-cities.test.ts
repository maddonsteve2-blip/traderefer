import { describe, expect, it } from "vitest";
import { SUBURB_CITIES, getCanonicalCitySlug } from "../suburb-cities";

// Anchor cases from the 2026-06-12 city-segment audit: these suburbs were
// reachable under junk city segments (brookside, cannington, dee-why,
// liverpool, douglas) and must resolve to their real parent city so the
// /local pages can 308 wrong-city URLs.
const ANCHORS: Array<[state: string, suburb: string, city: string]> = [
    ["nsw", "oatley", "sydney"],
    ["nsw", "brookvale", "sydney"],
    ["qld", "mitchelton", "brisbane"],
    ["wa", "maddington", "perth"],
    ["qld", "douglas", "townsville"],
    ["qld", "kirwan", "townsville"],
    ["qld", "craiglie", "port-douglas"],
    ["qld", "port-douglas", "port-douglas"],
    ["vic", "armstrong-creek", "geelong"],
];

describe("getCanonicalCitySlug", () => {
    it.each(ANCHORS)("%s/%s -> %s", (state, suburb, city) => {
        expect(getCanonicalCitySlug(state, suburb)).toBe(city);
    });

    it("accepts postcode-suffixed suburb slugs", () => {
        expect(getCanonicalCitySlug("nsw", "oatley-2223")).toBe("sydney");
        expect(getCanonicalCitySlug("QLD", "kirwan-4817")).toBe("townsville");
    });

    it("returns null for unknown suburbs (no redirect)", () => {
        expect(getCanonicalCitySlug("nsw", "not-a-real-suburb")).toBeNull();
        expect(getCanonicalCitySlug("zz", "oatley")).toBeNull();
    });

    it("emits only slug-safe city values", () => {
        for (const suburbs of Object.values(SUBURB_CITIES)) {
            for (const city of Object.values(suburbs)) {
                expect(city).toMatch(/^[a-z0-9-]+$/);
            }
        }
    });
});
