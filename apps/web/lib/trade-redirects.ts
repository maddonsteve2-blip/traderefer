import synonyms from "./trade-synonyms.json";

// Slug-level mirror of lib/trade-synonyms.json: the 2026-06-12 taxonomy
// consolidation relabeled synonym trade_category values (Electrician ->
// Electrical, ...), so their old /local and /top URL segments must 308 to the
// canonical trade slug instead of rendering freshly-emptied pages.

export function slugifyTrade(value: string): string {
    return String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

const SLUG_REDIRECTS: Record<string, string> = {};
for (const [from, to] of Object.entries(synonyms as Record<string, string>)) {
    if (from === "//") continue;
    const fromSlug = slugifyTrade(from);
    const toSlug = slugifyTrade(to);
    if (fromSlug && toSlug && fromSlug !== toSlug) {
        SLUG_REDIRECTS[fromSlug] = toSlug;
    }
}

/** Returns the canonical trade slug if `tradeSlug` belongs to a retired synonym, else null. */
export function retiredTradeSlugTarget(tradeSlug: string): string | null {
    return SLUG_REDIRECTS[slugifyTrade(tradeSlug)] ?? null;
}
