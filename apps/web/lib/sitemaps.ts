import { sql } from "@/lib/db";

// Googlebot drops connections on the single 5+ MB profiles sitemap, so profile
// URLs are served as numbered chunks (/sitemaps/profiles-1, -2, ...) capped at
// this many URLs each. The sitemap index derives its chunk list from the same
// count so the two always agree.
export const PROFILES_CHUNK_SIZE = 10000;

// The WHERE clause (including the quality gate) must stay identical to
// profilesSitemap() in app/sitemaps/[sitemap]/route.ts, or the chunk count
// in the sitemap index will disagree with the chunk contents.
export async function countProfileUrls() {
    const [row] = await sql<{ count: string }[]>`
        SELECT COUNT(*) AS count
        FROM businesses
        WHERE status = 'active'
          AND (listing_visibility = 'public' OR listing_visibility IS NULL)
          AND slug IS NOT NULL
          AND slug != ''
          AND business_name IS NOT NULL
          AND business_name != ''
          AND (
              total_reviews >= 5
              OR (total_reviews >= 1 AND COALESCE(array_length(photo_urls, 1), 0) > 0)
          )
    `;
    return Number(row.count);
}

export function profilesChunkCount(totalUrls: number) {
    return Math.max(1, Math.ceil(totalUrls / PROFILES_CHUNK_SIZE));
}

// ---------------------------------------------------------------------------
// Google-trimmed sitemap (SEO_RECOVERY_PLAN.md Phase 1).
//
// /sitemap.xml serves ONLY pages that pass the Google index gates so the
// submitted set stays curated (~2k URLs against 1 referring domain);
// /sitemap-full.xml keeps the full tree for Bing Webmaster Tools. The XML
// helpers below are duplicated from app/sitemaps/[sitemap]/route.ts on
// purpose — the Bing-facing route stays byte-identical to what is live.
// ---------------------------------------------------------------------------

import { getCanonicalSuburbSlug, isPostcodeValidForState, parseSuburbSlug } from "@/lib/postcodes";
import { GOOGLE_GATES, GOOGLE_SITEMAP_TIER } from "@/lib/seo/index-policy";

const BASE_URL = "https://traderefer.au";

type UrlEntry = {
    loc: string;
    // Omitted (null) when we have no real modification date — a fabricated
    // "today" on every crawl teaches engines to distrust the whole field.
    lastmod: string | null;
    changefreq: string;
    priority: string;
};

function todayIso() {
    return new Date().toISOString().slice(0, 10);
}

function xmlEscape(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function slugifyValue(value: string) {
    return String(value || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function dateString(value: unknown, fallback = todayIso()) {
    if (!value) return fallback;
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return String(value).slice(0, 10);
}

function entry(loc: string, lastmod: string | null = null, changefreq = "weekly", priority = "0.7"): UrlEntry {
    return { loc, lastmod, changefreq, priority };
}

function postcodeFromAddress(address: string | null, state: string) {
    if (!address) return null;
    const matches = address.match(/\b\d{4}\b/g) || [];
    return matches.find((postcode) => isPostcodeValidForState(postcode, state)) || null;
}

function suburbSegment(suburbSlug: string, state: string, address: string | null) {
    const canonical = getCanonicalSuburbSlug(suburbSlug, state);
    const { postcode } = parseSuburbSlug(canonical);
    if (postcode && isPostcodeValidForState(postcode, state)) return canonical;

    const addressPostcode = postcodeFromAddress(address, state);
    return addressPostcode ? `${canonical}-${addressPostcode}` : null;
}

async function googleCoreEntries(): Promise<UrlEntry[]> {
    const entries: UrlEntry[] = [
        entry(BASE_URL, null, "daily", "1.0"),
        entry(`${BASE_URL}/businesses`, null, "daily", "0.9"),
        entry(`${BASE_URL}/categories`, null, "weekly", "0.95"),
        entry(`${BASE_URL}/locations`, null, "weekly", "0.95"),
        entry(`${BASE_URL}/local`, null, "weekly", "0.9"),
        entry(`${BASE_URL}/costs`, null, "weekly", "0.9"),
        entry(`${BASE_URL}/find-a-plumber-near-me`, null, "weekly", "0.95"),
        entry(`${BASE_URL}/find-an-electrician-near-me`, null, "weekly", "0.95"),
        entry(`${BASE_URL}/about`, null, "monthly", "0.5"),
        entry(`${BASE_URL}/contact`, null, "monthly", "0.5"),
        entry(`${BASE_URL}/terms`, null, "monthly", "0.3"),
        entry(`${BASE_URL}/privacy`, null, "monthly", "0.3"),
        entry(`${BASE_URL}/cookies`, null, "monthly", "0.2"),
    ];

    const states = await sql<{ s: string }[]>`
        SELECT DISTINCT LOWER(state) AS s
        FROM businesses
        WHERE status = 'active'
          AND (listing_visibility = 'public' OR listing_visibility IS NULL)
          AND state IS NOT NULL
          AND state != ''
    `;
    for (const row of states) {
        entries.push(entry(`${BASE_URL}/local/${row.s}`, null, "weekly", "0.9"));
    }

    const cities = await sql<{ s: string; c: string }[]>`
        SELECT LOWER(state) AS s, LOWER(REPLACE(city, ' ', '-')) AS c
        FROM businesses
        WHERE status = 'active'
          AND (listing_visibility = 'public' OR listing_visibility IS NULL)
          AND state IS NOT NULL AND state != ''
          AND city IS NOT NULL AND city != ''
        GROUP BY LOWER(state), LOWER(REPLACE(city, ' ', '-'))
        HAVING COUNT(*) >= ${GOOGLE_GATES.cityMinBusinesses}
    `;
    for (const row of cities) {
        entries.push(entry(`${BASE_URL}/local/${row.s}/${row.c}`, null, "weekly", "0.85"));
    }

    return entries;
}

async function googleTradeEntries(): Promise<UrlEntry[]> {
    const today = todayIso();
    const rows = await sql<{ s: string; c: string; sub: string; trade_category: string; lastmod: Date | string | null; addr: string | null }[]>`
        SELECT LOWER(state) AS s,
               LOWER(REPLACE(city, ' ', '-')) AS c,
               LOWER(REPLACE(suburb, ' ', '-')) AS sub,
               trade_category,
               MAX(COALESCE(updated_at, created_at))::date AS lastmod,
               MAX(address) AS addr
        FROM businesses
        WHERE status = 'active'
          AND (listing_visibility = 'public' OR listing_visibility IS NULL)
          AND state IS NOT NULL AND state != ''
          AND city IS NOT NULL AND city != ''
          AND suburb IS NOT NULL AND suburb != ''
          AND trade_category IS NOT NULL AND trade_category != ''
        GROUP BY LOWER(state), LOWER(REPLACE(city, ' ', '-')), LOWER(REPLACE(suburb, ' ', '-')), trade_category
        HAVING COUNT(*) >= ${GOOGLE_GATES.localTradeMinBusinesses}
    `;
    const entries: UrlEntry[] = [];
    for (const row of rows) {
        const suburb = suburbSegment(row.sub, row.s, row.addr);
        if (!suburb) continue;
        entries.push(entry(
            `${BASE_URL}/local/${row.s}/${row.c}/${suburb}/${slugifyValue(row.trade_category)}`,
            dateString(row.lastmod, today),
            "weekly",
            "0.7"
        ));
    }
    return entries;
}

async function googleTopEntries(): Promise<UrlEntry[]> {
    const rows = await sql<{ trade_category: string; s: string; c: string; lastmod: Date | string | null }[]>`
        SELECT trade_category, LOWER(state) AS s, LOWER(REPLACE(city, ' ', '-')) AS c,
               MAX(COALESCE(updated_at, created_at))::date AS lastmod
        FROM businesses
        WHERE status = 'active'
          AND (listing_visibility = 'public' OR listing_visibility IS NULL)
          AND trade_category IS NOT NULL
          AND state IS NOT NULL
          AND city IS NOT NULL
          AND avg_rating > 0
          AND total_reviews > 0
        GROUP BY trade_category, LOWER(state), LOWER(REPLACE(city, ' ', '-'))
        HAVING COUNT(*) >= ${GOOGLE_SITEMAP_TIER.topMinBusinesses}
           AND SUM(total_reviews) >= ${GOOGLE_SITEMAP_TIER.topMinReviews}
        ORDER BY trade_category, s, c
    `;
    return rows.map((row) => entry(`${BASE_URL}/top/${slugifyValue(row.trade_category)}/${row.s}/${row.c}`, dateString(row.lastmod), "weekly", "0.8"));
}

async function googleProfileEntries(): Promise<UrlEntry[]> {
    // Claimed profiles only — the claim loop grows this list, and each claim
    // both flips the page's googlebot gate and enters it here automatically.
    const rows = await sql<{ slug: string; lastmod: Date | string | null }[]>`
        SELECT slug, COALESCE(updated_at, created_at)::date AS lastmod
        FROM businesses
        WHERE status = 'active'
          AND (listing_visibility = 'public' OR listing_visibility IS NULL)
          AND slug IS NOT NULL AND slug != ''
          AND is_claimed = true
        ORDER BY created_at ASC, id ASC
    `;
    return rows.map((row) => entry(`${BASE_URL}/b/${row.slug}`, dateString(row.lastmod), "weekly", "0.6"));
}

export async function googleSitemapXml() {
    const groups = await Promise.all([
        googleCoreEntries(),
        googleTradeEntries(),
        googleTopEntries(),
        googleProfileEntries(),
    ]);
    const body = groups.flat().map((e) =>
        `  <url><loc>${xmlEscape(e.loc)}</loc>${e.lastmod ? `<lastmod>${xmlEscape(e.lastmod)}</lastmod>` : ""}<changefreq>${xmlEscape(e.changefreq)}</changefreq><priority>${xmlEscape(e.priority)}</priority></url>`
    ).join("\n");
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;
}
