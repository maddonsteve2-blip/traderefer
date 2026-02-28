import { sql } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Star, ShieldCheck, ChevronRight, ChevronLeft, DollarSign, Gift, Zap, Flame } from "lucide-react";
import Link from "next/link";
import { BusinessLogo } from "@/components/BusinessLogo";
import { proxyLogoUrl } from "@/lib/logo";
import { BusinessDirectoryFilters } from "@/components/BusinessDirectoryFilters";
import { Suspense } from "react";
import { BackToDashboard } from "@/components/BackToDashboard";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

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
    } catch {}
    return null;
}

async function getBusinesses(
    category?: string, suburb?: string, search?: string,
    state?: string, city?: string, page = 1
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

        const baseWhere = sql`
            WHERE b.status = 'active'
              AND (b.listing_visibility = 'public' OR b.listing_visibility IS NULL)
              ${catFilter} ${stateFilter} ${searchFilter}
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
                        ORDER BY distance_km ASC, b.listing_rank DESC, b.avg_rating DESC
                        LIMIT ${PAGE_SIZE} OFFSET ${offset}
                    `;
                } else {
                    businesses = await sql`
                        SELECT b.*,
                            (SELECT COUNT(*) FROM deals d WHERE d.business_id = b.id AND d.is_active = true AND (d.expires_at IS NULL OR d.expires_at > now())) as deal_count,
                            (SELECT COUNT(*) FROM campaigns c WHERE c.business_id = b.id AND c.is_active = true AND c.starts_at <= now() AND c.ends_at > now()) as campaign_count
                        FROM businesses b
                        ${suburbWhere}
                        ORDER BY b.listing_rank DESC, b.avg_rating DESC, b.created_at DESC
                        LIMIT ${PAGE_SIZE} OFFSET ${offset}
                    `;
                }
                return { businesses, total: suburbTotal, totalPages: Math.ceil(suburbTotal / PAGE_SIZE), nearbyFallback: null };
            }

            // No results in suburb — fall back to city, sorted by distance
            const cityFilter = sCity
                ? sql`AND (suburb ILIKE ${'%' + sCity + '%'} OR city ILIKE ${'%' + sCity + '%'})`
                : sql`AND state ILIKE ${sState || 'NSW'}`;
            const cityWhere = sql`${baseWhere} ${cityFilter}`;
            const cityCount = await sql`SELECT COUNT(*) as total FROM businesses b ${cityWhere}`;
            const cityTotal = Number(cityCount[0]?.total ?? 0);

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
                    ${cityWhere}
                    ORDER BY distance_km ASC, b.listing_rank DESC, b.avg_rating DESC
                    LIMIT ${PAGE_SIZE} OFFSET ${offset}
                `;
            } else {
                businesses = await sql`
                    SELECT b.*,
                        (SELECT COUNT(*) FROM deals d WHERE d.business_id = b.id AND d.is_active = true AND (d.expires_at IS NULL OR d.expires_at > now())) as deal_count,
                        (SELECT COUNT(*) FROM campaigns c WHERE c.business_id = b.id AND c.is_active = true AND c.starts_at <= now() AND c.ends_at > now()) as campaign_count
                    FROM businesses b
                    ${cityWhere}
                    ORDER BY b.listing_rank DESC, b.avg_rating DESC
                    LIMIT ${PAGE_SIZE} OFFSET ${offset}
                `;
            }
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
                ORDER BY b.listing_rank DESC, b.avg_rating DESC, b.created_at DESC
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
    searchParams: Promise<{ category?: string; suburb?: string; q?: string; state?: string; city?: string; page?: string }>
}) {
    const params = await searchParams;
    const { category, suburb, q, state, city } = params;
    const page = Math.max(1, parseInt(params.page || "1", 10));
    const { businesses, total, totalPages, nearbyFallback } = await getBusinesses(category, suburb, q, state, city, page);

    const hasFilters = category || suburb || q || state || city;

    return (
        <main className="flex-1 pt-24 pb-12 bg-zinc-50 min-h-screen">
            <div className="container mx-auto px-4">
                <Suspense fallback={null}><BackToDashboard /></Suspense>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 mb-2 font-display">Business Directory</h1>
                        <p className="text-zinc-600">Find the best local trades recommended by people you trust.</p>
                        <p className="text-sm font-medium text-orange-600 mt-2">
                            {total > 0
                                ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total} ${total === 1 ? 'business' : 'businesses'}${hasFilters ? ' for your search' : ''}`
                                : `No businesses found${hasFilters ? ' for your search' : ''}`
                            }
                        </p>
                    </div>
                    <Button asChild variant="outline" className="rounded-lg border-zinc-200 hover:bg-zinc-50 font-bold whitespace-nowrap">
                        <Link href="/register?type=business">List Your Business</Link>
                    </Button>
                </div>

                <div className="mb-8">
                    <Suspense fallback={null}>
                        <BusinessDirectoryFilters />
                    </Suspense>
                </div>

                {nearbyFallback && suburb && (
                    <div className="mb-6 flex items-center gap-3 bg-orange-50 border border-orange-100 rounded-2xl px-5 py-3.5">
                        <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                        <p className="text-sm font-medium text-orange-700">
                            No businesses found in <span className="font-bold">{suburb}</span> — showing nearest results from <span className="font-bold">{nearbyFallback}</span>, sorted by distance.
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {businesses.map((biz: any) => (
                        <div key={biz.id} className="bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="w-16 h-16 bg-zinc-100 rounded-xl flex items-center justify-center overflow-hidden border border-zinc-200 shadow-inner">
                                            <BusinessLogo logoUrl={proxyLogoUrl(biz.logo_url)} name={biz.business_name} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <Link href={`/b/${biz.slug}`} className="hover:underline">
                                                <h3 className="font-bold text-lg text-zinc-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                                                    {biz.business_name}
                                                </h3>
                                            </Link>
                                            <div className="flex items-center gap-1.5 text-sm text-zinc-500 font-medium">
                                                <span className="text-orange-600">{biz.trade_category}</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {biz.suburb}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {biz.is_verified && (
                                        <div className="bg-orange-100 text-orange-600 p-1.5 rounded-full" title="Verified Business">
                                            <ShieldCheck className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-0.5 text-orange-500">
                                            <Star className="w-4 h-4 fill-current" />
                                        </div>
                                        <span className="text-sm font-bold text-zinc-900">{biz.connection_rate}% connection rate</span>
                                        <span className="text-sm text-zinc-400">• {biz.total_confirmed} verified leads</span>
                                    </div>
                                    <p className="text-sm text-zinc-600 line-clamp-2 leading-relaxed h-10">
                                        {biz.description || `Expert ${biz.trade_category} serving the ${biz.suburb} area. High quality workmanship and reliable service.`}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-zinc-50">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-bold border border-green-100">
                                            <DollarSign className="w-3 h-3" />
                                            ${((biz.referral_fee_cents || 1000) / 100).toFixed(0)} per lead
                                        </div>
                                        {Number(biz.deal_count) > 0 && (
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full text-sm font-bold border border-orange-100">
                                                <Gift className="w-3 h-3" />
                                                {biz.deal_count} {Number(biz.deal_count) === 1 ? 'deal' : 'deals'}
                                            </div>
                                        )}
                                        {biz.avg_response_minutes != null && biz.avg_response_minutes <= 120 && (
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-bold border border-blue-100">
                                                <Zap className="w-3 h-3" />
                                                {biz.avg_response_minutes < 60 ? `< ${biz.avg_response_minutes}m` : `< ${Math.ceil(biz.avg_response_minutes / 60)}h`} response
                                            </div>
                                        )}
                                        {Number(biz.campaign_count) > 0 && (
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-sm font-bold border border-red-100 animate-pulse">
                                                <Flame className="w-3 h-3" />
                                                Bonus active
                                            </div>
                                        )}
                                    </div>
                                    <Button asChild className="bg-zinc-900 hover:bg-black text-white rounded-full px-5 group/btn h-10">
                                        <Link href={`/b/${biz.slug}/refer`}>
                                            Start Referring <ChevronRight className="ml-1 w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {businesses.length === 0 && (
                    <div className="bg-white rounded-3xl border border-zinc-200 p-16 text-center max-w-2xl mx-auto shadow-sm">
                        <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="w-10 h-10 text-zinc-200" />
                        </div>
                        <h2 className="text-2xl font-bold text-zinc-900 mb-2">No businesses found</h2>
                        <p className="text-zinc-600 mb-8">
                            Try adjusting your filters or check back soon as we onboard more trades.
                        </p>
                        <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-8">
                            <Link href="/businesses">Clear filters</Link>
                        </Button>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-12 flex items-center justify-center gap-2">
                        {/* Prev */}
                        {page > 1 ? (
                            <Link href={buildPageUrl(params, page - 1)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm font-bold text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-all">
                                <ChevronLeft className="w-4 h-4" /> Prev
                            </Link>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl text-sm font-bold text-zinc-300 cursor-not-allowed">
                                <ChevronLeft className="w-4 h-4" /> Prev
                            </span>
                        )}

                        {/* Page numbers */}
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                                .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                                    acc.push(p);
                                    return acc;
                                }, [])
                                .map((p, idx) =>
                                    p === "..." ? (
                                        <span key={`ellipsis-${idx}`} className="px-2 text-zinc-400 text-sm font-bold">…</span>
                                    ) : (
                                        <Link key={p} href={buildPageUrl(params, p as number)}
                                            className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${
                                                p === page
                                                    ? "bg-orange-500 text-white shadow-sm"
                                                    : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300"
                                            }`}>
                                            {p}
                                        </Link>
                                    )
                                )
                            }
                        </div>

                        {/* Next */}
                        {page < totalPages ? (
                            <Link href={buildPageUrl(params, page + 1)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm font-bold text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-all">
                                Next <ChevronRight className="w-4 h-4" />
                            </Link>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl text-sm font-bold text-zinc-300 cursor-not-allowed">
                                Next <ChevronRight className="w-4 h-4" />
                            </span>
                        )}
                    </div>
                )}

            </div>
        </main>
    );
}
