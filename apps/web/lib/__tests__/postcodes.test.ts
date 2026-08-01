import { describe, expect, it } from "vitest";

import anchorsJson from "../postcode-anchors.json";
import {
  SUBURB_POSTCODES,
  getCanonicalSuburbSlug,
  getPostcode,
  isPostcodeValidForState,
} from "../postcodes";

// "//"-keyed entry is a comment, everything else is state → { suburb → postcode }
const ANCHORS = Object.entries(anchorsJson).filter(
  (entry): entry is [string, Record<string, string>] => typeof entry[1] !== "string"
);

describe("postcode anchors (audit 2026-06-12)", () => {
  // A regeneration of postcodes.ts must never silently flip these. If one of
  // these fails, the map regressed — fix the data source, don't edit the anchor
  // unless you have postal-dataset evidence the anchor itself is wrong.
  for (const [state, suburbs] of ANCHORS) {
    for (const [slug, postcode] of Object.entries(suburbs)) {
      it(`${state}/${slug} → ${postcode}`, () => {
        expect(SUBURB_POSTCODES[state]?.[slug]).toBe(postcode);
      });
    }
  }
});

describe("canonical slug redirect targets", () => {
  it("sends previously-wrong slugs to the correct postcode", () => {
    // These exact pairs were live wrong-direction 308s before the 2026-06-12 fix.
    expect(getCanonicalSuburbSlug("hornsby-2000", "nsw")).toBe("hornsby-2077");
    expect(getCanonicalSuburbSlug("ryde-2122", "nsw")).toBe("ryde-2112");
    expect(getCanonicalSuburbSlug("ashfield-2372", "nsw")).toBe("ashfield-2131");
    expect(getCanonicalSuburbSlug("chatswood-2057", "new-south-wales")).toBe("chatswood-2067");
    expect(getCanonicalSuburbSlug("kallangur-1269", "qld")).toBe("kallangur-4503");
  });

  it("keeps already-correct slugs stable (no redirect ping-pong)", () => {
    expect(getCanonicalSuburbSlug("hornsby-2077", "nsw")).toBe("hornsby-2077");
    expect(getCanonicalSuburbSlug("ryde-2112", "new-south-wales")).toBe("ryde-2112");
    expect(getCanonicalSuburbSlug("kallangur-4503", "queensland")).toBe("kallangur-4503");
  });

  it("accepts state codes and state slugs interchangeably", () => {
    expect(getPostcode("hornsby", "NSW")).toBe("2077");
    expect(getPostcode("hornsby", "new-south-wales")).toBe("2077");
  });
});

describe("map hygiene", () => {
  it("every map entry is a postcode valid for its state", () => {
    for (const [state, suburbs] of Object.entries(SUBURB_POSTCODES)) {
      for (const [slug, postcode] of Object.entries(suburbs)) {
        expect(
          isPostcodeValidForState(postcode, state),
          `${state}/${slug} has out-of-range postcode ${postcode}`
        ).toBe(true);
      }
    }
  });

  it("every anchored suburb exists in the generated map", () => {
    for (const [state, suburbs] of ANCHORS) {
      for (const slug of Object.keys(suburbs)) {
        expect(SUBURB_POSTCODES[state], `state ${state} missing from map`).toBeDefined();
        expect(SUBURB_POSTCODES[state][slug], `${state}/${slug} missing from map`).toBeDefined();
      }
    }
  });
});
