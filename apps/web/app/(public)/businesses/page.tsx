import { sql } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Star, ShieldCheck, ChevronRight, ChevronLeft, DollarSign, Gift, Zap, Flame, Clock, ExternalLink, Phone, Filter } from "lucide-react";
import Link from "next/link";
import { BusinessLogo } from "@/components/BusinessLogo";
import { proxyLogoUrl } from "@/lib/logo";
import { BusinessDirectorySidebar } from "@/components/BusinessDirectorySidebar";
import { Suspense } from "react";
import { BackToDashboard } from "@/components/BackToDashboard";
import { generateFallbackDescription } from "@/lib/business-utils";
import { getBusinessHoursStatus, toOpeningHoursSchema } from "@/lib/business-hours";
import { Metadata } from "next";
import { TRADE_COST_GUIDE, TRADE_NOUNS } from "@/lib/constants";
import { EnrichTrigger } from "@/components/EnrichTrigger";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;

function mapCategory(sCat: string) {
    if (sCat === "Plumbing") return "Plumb";
    if (sCat === "Electrical") return "Electric";
    if (sCat === "Carpentry") return "Carpent";
    if (sCat === "Building") return "Builder";
    if (sCat === "Landscaping") return "Landscap";
    if (sCat === "Painting") return "Paint";
    if (sCat === "Cleaning") return "Clean";
    if (sCat === "Concreting") return "Concret";
    if (sCat === "Gardening & Lawn Care") return "Garden";
    return sCat;
}

// Get the centre lat/lng of a suburb from our DB (average of existing businesses in that suburb)
async function getSuburbCentre(suburb: string, city: string, state: string): Promise<{ lat: number; lng: number } | null> {
    try {
        const res = await sql`
            SELECT AVG(lat) as lat, AVG(lng) as lng
            FROM businesses
            WHERE (suburb ILIKE ${'%' + suburb + '%'} OR city ILIKE ${'%' + suburb + '%'})
              AND state ILIKE ${state}
              AND lat IS NOT NULL AND lng IS NOT NULL
            LIMIT 1
        `;
        const row = res[0];
        if (row?.lat && row?.lng) return { lat: Number(row.lat), lng: Number(row.lng) };

        // Fall back to city centre
        if (city) {
            const res2 = await sql`
                SELECT AVG(lat) as lat, AVG(lng) as lng
                FROM businesses
                WHERE city ILIKE ${'%' + city + '%'}
                  AND state ILIKE ${state}
                  AND lat IS NOT NULL AND lng IS NOT NULL
                LIMIT 1
            `;
            const row2 = res2[0];
            if (row2?.lat && row2?.lng) return { lat: Number(row2.lat), lng: Number(row2.lng) };
        }
    } catch { }
    return null;
}

async function getBusinesses(
    category?: string, suburb?: string, search?: string,
    state?: string, city?: string, page = 1,
    openNow?: boolean, is24h?: boolean
) {
    try {
        const sCat = category?.trim() || "";
        const sSub = suburb?.trim() || "";
        const sQ = search?.trim() || "";
        const sState = state?.trim() || "";
        const sCity = city?.trim() || "";
        const offset = (page - 1) * PAGE_SIZE;
        const mappedCat = mapCategory(sCat);

        const catFilter = sCat ? sql`AND trade_category ILIKE ${'%' + mappedCat + '%'}` : sql``;
        const stateFilter = sState ? sql`AND state ILIKE ${sState}` : sql``;
        const searchFilter = sQ ? sql`AND (business_name ILIKE ${'%' + sQ + '%'} OR trade_category ILIKE ${'%' + sQ + '%'} OR description ILIKE ${'%' + sQ + '%'})` : sql``;

        // Trading hours filters
        const open24hFilter = is24h ? sql`
            AND b.opening_hours IS NOT NULL
            AND jsonb_array_length(b.opening_hours->'periods') = 1
            AND (b.opening_hours->'periods'->0->'open'->>'day')::int = 0
            AND (b.opening_hours->'periods'->0->'open'->>'hour')::int = 0
            AND b.opening_hours->'periods'->0->'close' IS NULL
        ` : sql``;
        const openNowFilter = (openNow && !is24h) ? sql`
            AND b.opening_hours IS NOT NULL
            AND (
                (jsonb_array_length(b.opening_hours->'periods') = 1
                 AND (b.opening_hours->'periods'->0->'open'->>'day')::int = 0
                 AND (b.opening_hours->'periods'->0->'open'->>'hour')::int = 0
                 AND b.opening_hours->'periods'->0->'close' IS NULL)
                OR EXISTS (
                    SELECT 1 FROM jsonb_array_elements(b.opening_hours->'periods') p
                    WHERE (p->'open'->>'day')::int = EXTRACT(DOW FROM NOW() AT TIME ZONE 'Australia/Sydney')::int
                      AND (p->'open'->>'hour')::int * 60 + (p->'open'->>'minute')::int
                          <= EXTRACT(HOUR FROM NOW() AT TIME ZONE 'Australia/Sydney')::int * 60
                           + EXTRACT(MINUTE FROM NOW() AT TIME ZONE 'Australia/Sydney')::int
                      AND (p->'close' IS NULL
                           OR (p->'close'->>'hour')::int * 60 + (p->'close'->>'minute')::int
                              > EXTRACT(HOUR FROM NOW() AT TIME ZONE 'Australia/Sydney')::int * 60
                              + EXTRACT(MINUTE FROM NOW() AT TIME ZONE 'Australia/Sydney')::int)
                )
            )
        ` : sql``;

        const baseWhere = sql`
            WHERE b.status = 'active'
              AND (b.listing_visibility = 'public' OR b.listing_visibility IS NULL)
              ${catFilter} ${stateFilter} ${searchFilter} ${open24hFilter} ${openNowFilter}
        `;

        // Try exact suburb first
        if (sSub) {
            const suburbFilter = sql`AND (suburb ILIKE ${'%' + sSub + '%'} OR city ILIKE ${'%' + sSub + '%'})`;
            const suburbWhere = sql`${baseWhere} ${suburbFilter}`;

            const suburbCount = await sql`SELECT COUNT(*) as total FROM businesses b ${suburbWhere}`;
            const suburbTotal = Number(suburbCount[0]?.total ?? 0);

            if (suburbTotal > 0) {
                // Has results — sort by distance if we have lat/lng for this suburb
                const centre = await getSuburbCentre(sSub, sCity, sState);

                let businesses;
                if (centre) {
                    businesses = await sql`
                        SELECT b.*,
                            (SELECT COUNT(*) FROM deals d WHERE d.business_id = b.id AND d.is_active = true AND (d.expires_at IS NULL OR d.expires_at > now())) as deal_count,
                            (SELECT COUNT(*) FROM campaigns c WHERE c.business_id = b.id AND c.is_active = true AND c.starts_at <= now() AND c.ends_at > now()) as campaign_count,
                            CASE WHEN b.lat IS NOT NULL AND b.lng IS NOT NULL
                                THEN ROUND(CAST(111.045 * SQRT(POWER(b.lat - ${centre.lat}, 2) + POWER(b.lng * COS(RADIANS(${centre.lat})) - ${centre.lng} * COS(RADIANS(${centre.lat})), 2)) AS numeric), 1)
                                ELSE 999
                            END as distance_km
                        FROM businesses b
                        ${suburbWhere}
                        ORDER BY distance_km ASC, b.avg_rating DESC, b.created_at DESC
                        LIMIT ${PAGE_SIZE} OFFSET ${offset}
                    `;
                } else {
                    businesses = await sql`
                        SELECT b.*,
                            (SELECT COUNT(*) FROM deals d WHERE d.business_id = b.id AND d.is_active = true AND (d.expires_at IS NULL OR d.expires_at > now())) as deal_count,
                            (SELECT COUNT(*) FROM campaigns c WHERE c.business_id = b.id AND c.is_active = true AND c.starts_at <= now() AND c.ends_at > now()) as campaign_count
                        FROM businesses b
                        ${suburbWhere}
                        ORDER BY b.avg_rating DESC, b.created_at DESC
                        LIMIT ${PAGE_SIZE} OFFSET ${offset}
                    `;
                }
                return { businesses, total: suburbTotal, totalPages: Math.ceil(suburbTotal / PAGE_SIZE), nearbyFallback: null };
            }

            // No results in exact suburb — try radius-based proximity (50km, then 150km)
            const centre = await getSuburbCentre(sSub, sCity, sState);

            if (centre) {
                for (const radiusKm of [50, 150]) {
                    const distExpr = sql`111.045 * SQRT(POWER(b.lat - ${centre.lat}, 2) + POWER(b.lng * COS(RADIANS(${centre.lat})) - ${centre.lng} * COS(RADIANS(${centre.lat})), 2))`;
                    const radiusResults = await sql`
                        SELECT b.*,
                            (SELECT COUNT(*) FROM deals d WHERE d.business_id = b.id AND d.is_active = true AND (d.expires_at IS NULL OR d.expires_at > now())) as deal_count,
                            (SELECT COUNT(*) FROM campaigns c WHERE c.business_id = b.id AND c.is_active = true AND c.starts_at <= now() AND c.ends_at > now()) as campaign_count,
                            ROUND(CAST(${distExpr} AS numeric), 1) as distance_km
                        FROM businesses b
                        ${baseWhere}
                          AND b.lat IS NOT NULL AND b.lng IS NOT NULL
                          AND ${distExpr} < ${radiusKm}
                        ORDER BY distance_km ASC, b.avg_rating DESC, b.created_at DESC
                        LIMIT ${PAGE_SIZE} OFFSET ${offset}
                    `;
                    if (radiusResults.length > 0) {
                        const countRes = await sql`
                            SELECT COUNT(*) as total FROM businesses b
                            ${baseWhere}
                              AND b.lat IS NOT NULL AND b.lng IS NOT NULL
                              AND ${distExpr} < ${radiusKm}
                        `;
                        return {
                            businesses: radiusResults,
                            total: Number(countRes[0]?.total ?? 0),
                            totalPages: Math.ceil(Number(countRes[0]?.total ?? 0) / PAGE_SIZE),
                            nearbyFallback: `within ${radiusKm}km of ${sSub}`
                        };
                    }
                }
            }

            // Last resort: city or state filter
            const cityFilter = sCity
                ? sql`AND (suburb ILIKE ${'%' + sCity + '%'} OR city ILIKE ${'%' + sCity + '%'})`
                : sState ? sql`AND state ILIKE ${sState}` : sql``;
            const cityWhere = sql`${baseWhere} ${cityFilter}`;
            const cityCount = await sql`SELECT COUNT(*) as total FROM businesses b ${cityWhere}`;
            const cityTotal = Number(cityCount[0]?.total ?? 0);
            const businesses = await sql`
                SELECT b.*,
                    (SELECT COUNT(*) FROM deals d WHERE d.business_id = b.id AND d.is_active = true AND (d.expires_at IS NULL OR d.expires_at > now())) as deal_count,
                    (SELECT COUNT(*) FROM campaigns c WHERE c.business_id = b.id AND c.is_active = true AND c.starts_at <= now() AND c.ends_at > now()) as campaign_count
                FROM businesses b
                ${cityWhere}
                ORDER BY b.created_at DESC
                LIMIT ${PAGE_SIZE} OFFSET ${offset}
            `;
            return {
                businesses, total: cityTotal,
                totalPages: Math.ceil(cityTotal / PAGE_SIZE),
                nearbyFallback: sCity || sState || 'nearby area'
            };
        }

        // No suburb — city or state filter only
        const locationFilter = sCity
            ? sql`AND (suburb ILIKE ${'%' + sCity + '%'} OR city ILIKE ${'%' + sCity + '%'})`
            : sql``;
        const whereClause = sql`${baseWhere} ${locationFilter}`;

        const [businesses, countResult] = await Promise.all([
            sql`
                SELECT b.*,
                    (SELECT COUNT(*) FROM deals d WHERE d.business_id = b.id AND d.is_active = true AND (d.expires_at IS NULL OR d.expires_at > now())) as deal_count,
                    (SELECT COUNT(*) FROM campaigns c WHERE c.business_id = b.id AND c.is_active = true AND c.starts_at <= now() AND c.ends_at > now()) as campaign_count
                FROM businesses b
                ${whereClause}
                ORDER BY b.avg_rating DESC, b.created_at DESC
                LIMIT ${PAGE_SIZE} OFFSET ${offset}
            `,
            sql`SELECT COUNT(*) as total FROM businesses b ${whereClause}`,
        ]);

        const total = Number(countResult[0]?.total ?? 0);
        return { businesses, total, totalPages: Math.ceil(total / PAGE_SIZE), nearbyFallback: null };
    } catch (error) {
        console.error("Database error:", error);
        return { businesses: [], total: 0, totalPages: 0, nearbyFallback: null };
    }
}

const STATE_LABELS: Record<string, string> = {
    VIC: "Victoria", NSW: "New South Wales", QLD: "Queensland",
    WA: "Western Australia", SA: "South Australia", ACT: "ACT",
    TAS: "Tasmania", NT: "Northern Territory",
};

async function getCounts() {
    try {
        const [stateRes, catRes] = await Promise.all([
            sql`SELECT state, COUNT(*) as cnt FROM businesses WHERE status = 'active' AND (listing_visibility = 'public' OR listing_visibility IS NULL) GROUP BY state`,
            sql`SELECT trade_category, COUNT(*) as cnt FROM businesses WHERE status = 'active' AND (listing_visibility = 'public' OR listing_visibility IS NULL) GROUP BY trade_category`,
        ]);
        const states: Record<string, number> = {};
        for (const r of stateRes) states[r.state] = Number(r.cnt);
        const categories: Record<string, number> = {};
        for (const r of catRes) categories[r.trade_category] = Number(r.cnt);
        return { states, categories };
    } catch {
        return { states: {}, categories: {} };
    }
}

export async function generateMetadata({
    searchParams,
}: {
    searchParams: Promise<{ category?: string; suburb?: string; q?: string; state?: string; city?: string; page?: string }>;
}): Promise<Metadata> {
    const params = await searchParams;
    const { category, suburb, state, city, page } = params;

    const tradeNoun = category ? (TRADE_NOUNS[category] || category) : null;
    const parts: string[] = [];
    if (tradeNoun) parts.push(tradeNoun);
    if (suburb) parts.push(`in ${suburb}`);
    else if (city) parts.push(`in ${city}`);
    if (state) parts.push(STATE_LABELS[state] || state);

    const cost = category ? TRADE_COST_GUIDE[category] : null;
    const priceStr = cost ? ` | $${cost.low}–$${cost.high}${cost.unit}` : "";

    const title = parts.length > 0
        ? `Best ${parts.join(', ')}${priceStr} | TradeRefer`
        : "Find Verified Trades Near You | Business Directory | TradeRefer";

    const description = parts.length > 0
        ? `Compare top rated ${(tradeNoun || 'tradespeople').toLowerCase()}${suburb ? ` in ${suburb}` : city ? ` in ${city}` : ''}${state ? `, ${STATE_LABELS[state] || state}` : ''}. ABN-verified, Google-reviewed local businesses. Get free quotes today on TradeRefer.`
        : "Browse 14,000+ verified Australian tradespeople. Compare ratings, reviews, and prices. Get free quotes from local businesses on TradeRefer.";

    // Add noindex to paginated pages to prevent duplicate content
    const isPaginated = page && parseInt(page) > 1;

    return {
        title,
        description,
        alternates: { canonical: "https://traderefer.au/businesses" },
        openGraph: { title, description },
        twitter: { card: 'summary_large_image', title, description },
        robots: isPaginated ? { index: false, follow: true } : { index: true, follow: true },
    };
}

function buildPageUrl(searchParams: Record<string, string | undefined>, page: number) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
        if (v && k !== "page") params.set(k, v);
    }
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return `/businesses${qs ? `?${qs}` : ""}`;
}

export default async function BusinessDirectory({
    searchParams
}: {
    searchParams: Promise<{ category?: string; suburb?: string; q?: string; state?: string; city?: string; page?: string; openNow?: string; is24h?: string }>
}) {
    const params = await searchParams;
    const { category, suburb, q, state, city } = params;
    const openNow = params.openNow === "true";
    const is24h = params.is24h === "true";
    const page = Math.max(1, parseInt(params.page || "1", 10));
    const [{ businesses, total, totalPages, nearbyFallback }, counts] = await Promise.all([
        getBusinesses(category, suburb, q, state, city, page, openNow, is24h),
        getCounts(),
    ]);

    const hasFilters = category || suburb || q || state || city || openNow || is24h;

    // Collect businesses needing enrichment (no photos, not yet enriched) — max 3 per page
    const needsEnrichment = businesses.filter((b: any) => {
        const photoCount = Array.isArray(b.photo_urls) ? b.photo_urls.length : 0;
        return photoCount < 1 && !b.enriched_at;
    }).map((b: any) => ({
        id: b.id, business_name: b.business_name, suburb: b.suburb, state: b.state, slug: b.slug,
    }));

    // Dynamic H1
    const h1Parts: string[] = [];
    if (category) h1Parts.push(category);
    else h1Parts.push("Trades");
    if (suburb) h1Parts.push(`in ${suburb}`);
    else if (city) h1Parts.push(`in ${city}`);
    if (state) h1Parts.push(STATE_LABELS[state] || state);
    const h1 = h1Parts.length > 1 ? `Best ${h1Parts.join(' ')}` : "Find Verified Trades Near You";
    const subHeading = suburb
        ? `Compare ${total.toLocaleString()} ${category || 'local trades'} in ${suburb}${city ? `, ${city}` : ''}. ABN-verified with real Google reviews.`
        : `Browse ${total.toLocaleString()} verified Australian tradespeople. Compare ratings, reviews, and prices.`;

    // Breadcrumbs
    const breadcrumbs: { name: string; href: string }[] = [
        { name: "Home", href: "/" },
        { name: "Find", href: "/businesses" },
    ];
    if (state) breadcrumbs.push({ name: STATE_LABELS[state] || state, href: `/businesses?state=${state}` });
    if (city) breadcrumbs.push({ name: city, href: `/businesses?state=${state}&city=${city}` });
    if (suburb) breadcrumbs.push({ name: suburb, href: `/businesses?state=${state}&city=${city}&suburb=${suburb}` });
    if (category) breadcrumbs.push({ name: category, href: "#" });

    // ── SCHEMA MARKUP (7 types) ──
    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbs.map((bc, i) => ({
            "@type": "ListItem",
            "position": i + 1,
            "name": bc.name,
            ...(bc.href !== "#" ? { "item": `https://traderefer.au${bc.href}` } : {}),
        })),
    };

    const cost = category ? TRADE_COST_GUIDE[category] : null;

    const itemListJsonLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": h1,
        "description": subHeading,
        "numberOfItems": businesses.length,
        "itemListElement": businesses.map((biz: any, i: number) => ({
            "@type": "ListItem",
            "position": i + 1,
            "url": `https://traderefer.au/b/${biz.slug}`,
            "name": biz.business_name,
            "item": {
                "@type": "LocalBusiness",
                "name": biz.business_name,
                "url": `https://traderefer.au/b/${biz.slug}`,
                ...(biz.business_phone ? { "telephone": biz.business_phone } : {}),
                ...(biz.website ? { "url": biz.website } : {}),
                "address": {
                    "@type": "PostalAddress",
                    ...(biz.address ? { "streetAddress": biz.address } : {}),
                    "addressLocality": biz.suburb || suburb || "",
                    ...(biz.city ? { "addressRegion": biz.city } : {}),
                    "addressCountry": "AU",
                },
                ...(biz.lat && biz.lng ? {
                    "geo": {
                        "@type": "GeoCoordinates",
                        "latitude": parseFloat(biz.lat),
                        "longitude": parseFloat(biz.lng),
                    }
                } : {}),
                ...(parseFloat(biz.avg_rating) > 0 && parseInt(biz.total_reviews) > 0 ? {
                    "aggregateRating": {
                        "@type": "AggregateRating",
                        "ratingValue": parseFloat(biz.avg_rating).toFixed(1),
                        "reviewCount": parseInt(biz.total_reviews),
                        "bestRating": "5",
                        "worstRating": "1",
                    }
                } : {}),
                ...(() => {
                    const hoursSchema = toOpeningHoursSchema(biz.opening_hours);
                    return hoursSchema.length > 0 ? { "openingHoursSpecification": hoursSchema } : {};
                })(),
                ...(biz.logo_url ? { "image": biz.logo_url } : {}),
                ...(biz.google_maps_url ? { "hasMap": biz.google_maps_url } : {}),
                "priceRange": cost ? `$${cost.low}–$${cost.high}${cost.unit}` : "$$",
            },
        })),
    };

    const serviceJsonLd = category && cost ? {
        "@context": "https://schema.org",
        "@type": "Service",
        "serviceType": category,
        "provider": { "@type": "Organization", "name": "TradeRefer", "url": "https://traderefer.au" },
        "areaServed": suburb ? {
            "@type": "Place",
            "name": `${suburb}${city ? `, ${city}` : ""}${state ? `, ${STATE_LABELS[state] || state}` : ""}`,
        } : { "@type": "Country", "name": "Australia" },
        "offers": {
            "@type": "AggregateOffer",
            "lowPrice": String(cost.low),
            "highPrice": String(cost.high),
            "priceCurrency": "AUD",
        },
    } : null;

    const faqItems = [
        { q: `How much does a ${category || 'tradesperson'} cost${suburb ? ` in ${suburb}` : ''}?`, a: cost ? `${category} typically costs $${cost.low}–$${cost.high}${cost.unit} in Australia. Prices vary based on job complexity, materials, and location.` : `Costs vary depending on the trade, job complexity, and your location. Get free quotes from verified businesses on TradeRefer to compare prices.` },
        { q: `How do I find a reliable ${category || 'tradesperson'}${suburb ? ` in ${suburb}` : ''}?`, a: `TradeRefer lists only ABN-verified businesses with real Google reviews. Compare ratings, read reviews, and get free quotes to find the right tradesperson for your job.` },
        { q: `Are the businesses on TradeRefer verified?`, a: `Yes. Every business on TradeRefer is ABN-verified and listed with real Google reviews and ratings. We verify business details to ensure quality and trust.` },
    ];
    const faqJsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqItems.map(({ q, a }) => ({
            "@type": "Question",
            "name": q,
            "acceptedAnswer": { "@type": "Answer", "text": a },
        })),
    };

    const orgJsonLd = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "TradeRefer",
        "url": "https://traderefer.au",
        "logo": "https://traderefer.au/logo.png",
        "description": "Australia's verified trade referral marketplace. Find ABN-verified local tradespeople with real Google reviews.",
        "sameAs": ["https://www.facebook.com/traderefer", "https://www.instagram.com/traderefer"],
    };

    const webPageJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": h1,
        "description": subHeading,
        "url": `https://traderefer.au/businesses${hasFilters ? `?${new URLSearchParams(params as any).toString()}` : ''}`,
        "isPartOf": { "@type": "WebSite", "name": "TradeRefer", "url": "https://traderefer.au" },
        "about": { "@type": "Thing", "name": category || "Trade Services" },
    };

    return (
        <>
        {needsEnrichment.length > 0 && <EnrichTrigger businesses={needsEnrichment} />}
        <main className="flex-1 pt-20 md:pt-28 pb-12 bg-zinc-50 min-h-screen">
            {/* ── JSON-LD SCHEMA (7 types) ── */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
            {serviceJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />

            <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
                <Suspense fallback={null}><BackToDashboard /></Suspense>

                {/* ── BREADCRUMBS ── */}
                <nav className="flex items-center flex-wrap gap-1.5 text-base text-zinc-500 mb-6" aria-label="Breadcrumb">
                    {breadcrumbs.map((bc, i) => (
                        <span key={i} className="flex items-center gap-1.5">
                            {i > 0 && <ChevronRight className="w-3 h-3 text-zinc-300" />}
                            {bc.href !== "#" ? (
                                <Link href={bc.href} className="font-bold hover:text-[#FF6600] transition-colors">{bc.name}</Link>
                            ) : (
                                <span className="font-bold text-zinc-900">{bc.name}</span>
                            )}
                        </span>
                    ))}
                </nav>

                {/* ── PAGE HEADER ── */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-4xl font-black text-zinc-900 mb-2">{h1}</h1>
                        <p className="text-zinc-600 text-lg leading-relaxed max-w-3xl">{subHeading}</p>
                    </div>
                    <Button asChild className="bg-[#FF6600] hover:bg-[#E65C00] text-white rounded-xl font-black border-none whitespace-nowrap h-11 px-6">
                        <Link href="/register?type=business">List Your Business Free</Link>
                    </Button>
                </div>

                {/* ── RESULT COUNT ── */}
                <p className="font-bold text-orange-600 mb-6 text-base">
                    {total > 0
                        ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total.toLocaleString()} ${total === 1 ? 'business' : 'businesses'}${hasFilters ? ' matching your filters' : ''}`
                        : `No businesses found${hasFilters ? ' for your search' : ''}`
                    }
                </p>

                {/* ── MOBILE FILTER TOGGLE ── */}
                <details className="lg:hidden mb-6 bg-white rounded-xl border border-zinc-200">
                    <summary className="flex items-center gap-2 px-4 py-3 font-black text-zinc-900 cursor-pointer select-none">
                        <Filter className="w-4 h-4 text-orange-500" /> Filter by Location & Trade
                    </summary>
                    <p className="px-4 text-zinc-500 text-sm font-medium -mt-1 mb-2">Use the filters below to narrow results to your state, city or suburb.</p>
                    <div className="px-4 pb-4">
                        <Suspense fallback={null}><BusinessDirectorySidebar counts={counts} total={total} /></Suspense>
                    </div>
                </details>

                {/* ── SIDEBAR + LISTINGS LAYOUT ── */}
                <div className="flex gap-8">
                    {/* Left Sidebar (desktop only) */}
                    <aside className="hidden lg:block w-[280px] shrink-0 sticky top-28 self-start max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200 scrollbar-track-transparent bg-white border border-zinc-200 rounded-2xl p-5">
                        <Suspense fallback={null}><BusinessDirectorySidebar counts={counts} total={total} /></Suspense>
                    </aside>
                    {/* Main Content — Single Column Listings */}
                    <div className="flex-1 min-w-0 space-y-4">

                        {nearbyFallback && suburb && (
                            <div className="flex items-start gap-3 bg-orange-50 border border-orange-100 rounded-2xl px-5 py-3.5">
                                <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                                <p className="font-bold text-orange-700 text-sm">
                                    {nearbyFallback.startsWith('within')
                                        ? <>No exact match in <span className="font-bold">{suburb}</span> — showing nearest results <span className="font-bold">{nearbyFallback}</span>, sorted by distance.</>
                                        : <>No businesses found in <span className="font-bold">{suburb}</span> — showing nearest from <span className="font-bold">{nearbyFallback}</span>.</>
                                    }
                                </p>
                            </div>
                        )}

                        {/* ── BUSINESS CARDS (single column, horizontal layout) ── */}
                        {businesses.map((biz: any) => {
                            const hoursStatus = getBusinessHoursStatus(biz.opening_hours);
                            const photos = Array.isArray(biz.photo_urls) ? biz.photo_urls : [];
                            return (
                            <div key={biz.id} className="bg-white rounded-2xl border border-zinc-200 p-5 sm:p-7 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group">
                                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                                    {/* Logo */}
                                    <BusinessLogo logoUrl={biz.logo_url} name={biz.business_name} photoUrls={biz.photo_urls} size="sm" bgColor={biz.logo_bg_color} className="sm:hidden" />
                                    <BusinessLogo logoUrl={biz.logo_url} name={biz.business_name} photoUrls={biz.photo_urls} size="md" bgColor={biz.logo_bg_color} className="hidden sm:flex" />

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        {/* Header Row */}
                                        <div className="flex items-start justify-between mb-1">
                                            <div className="flex-1 min-w-0">
                                                <Link href={`/b/${biz.slug}`} className="hover:underline">
                                                    <h3 className="text-2xl font-black text-zinc-900 group-hover:text-[#FF6600] transition-colors line-clamp-2">
                                                        {biz.business_name}
                                                    </h3>
                                                </Link>
                                                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                                    <span className="font-bold text-[#FF6600] text-base">{biz.trade_category}</span>
                                                    <span className="text-zinc-300">•</span>
                                                    <span className="flex items-center gap-1 text-zinc-500 text-base font-medium">
                                                        <MapPin className="w-3.5 h-3.5" />
                                                        {biz.suburb}{biz.city ? `, ${biz.city}` : ''} {biz.state}
                                                    </span>
                                                </div>
                                            </div>
                                            {biz.is_verified && (
                                                <div className="bg-orange-100 text-orange-600 p-1.5 rounded-full shrink-0 ml-2" title="ABN Verified">
                                                    <ShieldCheck className="w-4 h-4" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Live Opening Hours */}
                                        <div className="flex items-center gap-2 mt-2 mb-2">
                                            {hoursStatus.isOpen ? (
                                                <>
                                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                                    <span className="font-bold text-green-600 text-base">Open now</span>
                                                    {hoursStatus.closesAt && <span className="text-zinc-400 text-base">• Closes {hoursStatus.closesAt}</span>}
                                                </>
                                            ) : hoursStatus.opensAt ? (
                                                <>
                                                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                                                    <span className="font-bold text-red-500 text-base">Closed</span>
                                                    <span className="text-zinc-400 text-base">• Opens {hoursStatus.opensAt}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Clock className="w-3.5 h-3.5 text-zinc-300" />
                                                    <span className="text-zinc-400 text-base">Hours not available</span>
                                                </>
                                            )}
                                        </div>

                                        {/* Google Rating */}
                                        {parseFloat(biz.avg_rating) > 0 && (
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="flex items-center gap-0.5">
                                                    {[1,2,3,4,5].map(s => (
                                                        <Star key={s} className={`w-5 h-5 ${s <= Math.round(parseFloat(biz.avg_rating)) ? 'fill-orange-400 text-orange-400' : 'text-zinc-200'}`} />
                                                    ))}
                                                </div>
                                                <span className="font-bold text-zinc-900 text-base">{parseFloat(biz.avg_rating).toFixed(1)}</span>
                                                {parseInt(biz.total_reviews) > 0 && (
                                                    <span className="text-zinc-500 text-base">({biz.total_reviews} reviews)</span>
                                                )}
                                            </div>
                                        )}

                                        {/* Description */}
                                        <p className="text-zinc-600 leading-relaxed text-base line-clamp-3 mb-4">
                                            {biz.description || generateFallbackDescription(biz)}
                                        </p>

                                        {/* Photo Thumbnails */}
                                        {photos.length > 0 && (
                                            <div className="flex gap-2 mb-3">
                                                {photos.slice(0, 5).map((url: string, i: number) => (
                                                    <div key={i} className="w-16 h-16 rounded-lg overflow-hidden border border-zinc-100 shrink-0">
                                                        <img src={url} alt={`${biz.business_name} photo ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                                                    </div>
                                                ))}
                                                {photos.length > 5 && (
                                                    <Link href={`/b/${biz.slug}`} className="w-16 h-16 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0 hover:bg-zinc-200 transition-colors">
                                                        <span className="text-xs font-bold text-zinc-500">+{photos.length - 5}</span>
                                                    </Link>
                                                )}
                                            </div>
                                        )}

                                        {/* Badges Row */}
                                        <div className="flex items-center gap-2 flex-wrap mb-3">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full font-bold border border-green-100 text-sm">
                                                <DollarSign className="w-3 h-3" />
                                                ${((biz.referral_fee_cents || 1000) / 100).toFixed(0)} per lead
                                            </div>
                                            {Number(biz.deal_count) > 0 && (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full font-bold border border-orange-100 text-sm">
                                                    <Gift className="w-3 h-3" />
                                                    {biz.deal_count} {Number(biz.deal_count) === 1 ? 'deal' : 'deals'}
                                                </div>
                                            )}
                                            {biz.avg_response_minutes != null && biz.avg_response_minutes <= 120 && (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full font-bold border border-blue-100 text-sm">
                                                    <Zap className="w-3 h-3" />
                                                    {biz.avg_response_minutes < 60 ? `< ${biz.avg_response_minutes}m` : `< ${Math.ceil(biz.avg_response_minutes / 60)}h`} response
                                                </div>
                                            )}
                                            {Number(biz.campaign_count) > 0 && (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-full font-bold border border-red-100 animate-pulse text-sm">
                                                    <Flame className="w-3 h-3" />
                                                    Bonus active
                                                </div>
                                            )}
                                        </div>

                                        {/* CTA Buttons — Claim priority for unclaimed, Get Quote for claimed */}
                                        <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-zinc-100">
                                            {biz.is_claimed === false ? (
                                                <>
                                                    <Link href={`/claim/${biz.slug}`} className="px-6 py-3 bg-[#FF6600] hover:bg-[#E65C00] text-white font-black rounded-xl text-base transition-colors inline-flex items-center gap-1.5 shadow-sm">
                                                        <ShieldCheck className="w-4 h-4" /> Claim This Business
                                                    </Link>
                                                    <Link href={`/b/${biz.slug}#enquiry-form`} className="px-5 py-3 border-2 border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-black rounded-xl text-base transition-colors">
                                                        Get Quote
                                                    </Link>
                                                </>
                                            ) : (
                                                <>
                                                    <Link href={`/b/${biz.slug}#enquiry-form`} className="px-6 py-3 bg-[#FF6600] hover:bg-[#E65C00] text-white font-black rounded-xl text-base transition-colors">
                                                        Get a Free Quote
                                                    </Link>
                                                    {biz.business_phone && (
                                                        <a href={`tel:${biz.business_phone}`} className="px-5 py-3 border-2 border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-black rounded-xl text-base transition-colors inline-flex items-center gap-1.5">
                                                            <Phone className="w-4 h-4" /> Call
                                                        </a>
                                                    )}
                                                </>
                                            )}
                                            <Link href={`/b/${biz.slug}`} className="ml-auto px-5 py-3 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl text-base transition-colors inline-flex items-center gap-1.5">
                                                View Business <ChevronRight className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            );
                        })}

                        {/* Empty State */}
                        {businesses.length === 0 && (
                            <div className="bg-white rounded-2xl border border-zinc-200 p-16 text-center">
                                <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search className="w-8 h-8 text-zinc-200" />
                                </div>
                                <h2 className="text-xl font-black text-zinc-900 mb-2">No businesses found</h2>
                                <p className="text-zinc-500 mb-6 text-sm">Try adjusting your filters or check back soon.</p>
                                <Button asChild className="bg-[#FF6600] hover:bg-[#E65C00] text-white rounded-xl px-6 font-black">
                                    <Link href="/businesses">Clear filters</Link>
                                </Button>
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                                {page > 1 ? (
                                    <Link href={buildPageUrl(params, page - 1)}
                                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-zinc-200 rounded-xl font-bold text-zinc-700 hover:bg-zinc-50 transition-all text-sm">
                                        <ChevronLeft className="w-4 h-4" /> Prev
                                    </Link>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-zinc-50 border border-zinc-100 rounded-xl font-bold text-zinc-300 cursor-not-allowed text-sm">
                                        <ChevronLeft className="w-4 h-4" /> Prev
                                    </span>
                                )}

                                <div className="flex flex-wrap items-center justify-center gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                                        .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                                            if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                                            acc.push(p);
                                            return acc;
                                        }, [])
                                        .map((p, idx) =>
                                            p === "..." ? (
                                                <span key={`e-${idx}`} className="px-2 text-zinc-400 font-bold text-sm">…</span>
                                            ) : (
                                                <Link key={p} href={buildPageUrl(params, p as number)}
                                                    className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-all text-sm ${p === page
                                                            ? "bg-[#FF6600] text-white shadow-sm"
                                                            : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                                                        }`}>
                                                    {p}
                                                </Link>
                                            )
                                        )
                                    }
                                </div>

                                {page < totalPages ? (
                                    <Link href={buildPageUrl(params, page + 1)}
                                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-zinc-200 rounded-xl font-bold text-zinc-700 hover:bg-zinc-50 transition-all text-sm">
                                        Next <ChevronRight className="w-4 h-4" />
                                    </Link>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-zinc-50 border border-zinc-100 rounded-xl font-bold text-zinc-300 cursor-not-allowed text-sm">
                                        Next <ChevronRight className="w-4 h-4" />
                                    </span>
                                )}
                            </div>
                        )}

                        {/* ── FAQ SECTION (SEO) ── */}
                        <section className="mt-8 bg-white rounded-2xl border border-zinc-200 p-6">
                            <h2 className="text-xl font-black text-zinc-900 mb-4">Frequently Asked Questions</h2>
                            <div className="space-y-4">
                                {faqItems.map(({ q, a }, i) => (
                                    <details key={i} className="group">
                                        <summary className="font-bold text-zinc-800 text-base cursor-pointer hover:text-[#FF6600] transition-colors list-none flex items-center gap-2">
                                            <ChevronRight className="w-4 h-4 text-zinc-400 transition-transform group-open:rotate-90 shrink-0" />
                                            {q}
                                        </summary>
                                        <p className="text-zinc-600 text-base mt-2 ml-6 leading-relaxed">{a}</p>
                                    </details>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </main>

        {/* ── STICKY GET QUOTES CTA BAR ── */}
        {businesses.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-zinc-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] py-3 px-4 md:px-6 lg:hidden">
                <div className="container mx-auto flex items-center justify-between gap-4">
                    <div>
                        <p className="font-black text-zinc-900 text-sm">{total.toLocaleString()} verified {category ? category.toLowerCase() : 'trades'}</p>
                        <p className="text-zinc-500 text-xs">ABN-checked · Google reviewed</p>
                    </div>
                    <Button asChild size="sm" className="bg-[#FF6600] hover:bg-[#E65C00] text-white rounded-xl font-black h-10 px-5 border-none">
                        <Link href="/register?type=business">List Free</Link>
                    </Button>
                </div>
            </div>
        )}
        </>
    );
}
