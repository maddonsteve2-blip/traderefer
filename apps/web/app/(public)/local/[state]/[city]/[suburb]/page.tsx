import { sql } from "@/lib/db";
import { ChevronRight, Wrench, Users, MapPin, Star, ArrowRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DirectoryFooter } from "@/components/DirectoryFooter";
import { TRADE_CATEGORIES } from "@/lib/constants";
import { Metadata } from "next";

interface PageProps {
    params: Promise<{ state: string; city: string; suburb: string }>;
}

function formatSlug(slug: string) {
    return slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function tradeToSlug(trade: string) {
    return trade.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { state, city, suburb } = await params;
    const suburbName = formatSlug(suburb);
    const cityName = formatSlug(city);
    const stateUpper = state.toUpperCase();
    return {
        title: `Trades in ${suburbName}, ${cityName} ${stateUpper} | Find Local Experts | TradeRefer`,
        description: `Find verified local tradies in ${suburbName}, ${cityName}. Browse plumbers, electricians, builders, painters and more — all ABN-verified with real community referrals.`,
    };
}

async function getTradesWithCounts(suburb: string): Promise<Array<{ trade: string; count: number; avgRating: string }>> {
    try {
        const suburbName = formatSlug(suburb);
        const results = await sql`
            SELECT 
                trade_category,
                COUNT(*) as count,
                ROUND(AVG(COALESCE(trust_score, 0) / 20.0), 1) as avg_rating
            FROM businesses
            WHERE status = 'active'
              AND suburb ILIKE ${'%' + suburbName + '%'}
            GROUP BY trade_category
            ORDER BY count DESC
        `;
        return results.map((r: any) => ({
            trade: r.trade_category,
            count: parseInt(r.count, 10),
            avgRating: parseFloat(r.avg_rating || '0').toFixed(1),
        }));
    } catch {
        return [];
    }
}

async function getNearbySuburbs(state: string, city: string, currentSuburb: string): Promise<string[]> {
    try {
        const cityName = formatSlug(city);
        const suburbName = formatSlug(currentSuburb);
        const results = await sql`
            SELECT DISTINCT suburb
            FROM businesses
            WHERE city ILIKE ${'%' + cityName + '%'}
              AND suburb NOT ILIKE ${'%' + suburbName + '%'}
              AND status = 'active'
            ORDER BY suburb ASC
            LIMIT 8
        `;
        return results.map((r: any) => r.suburb as string);
    } catch {
        return [];
    }
}

export default async function SuburbDirectoryPage({ params }: PageProps) {
    const { state, city, suburb } = await params;
    const suburbName = formatSlug(suburb);
    const cityName = formatSlug(city);
    const stateUpper = state.toUpperCase();

    const [tradesWithCounts, nearbySuburbs] = await Promise.all([
        getTradesWithCounts(suburb),
        getNearbySuburbs(state, city, suburb),
    ]);

    const totalBusinesses = tradesWithCounts.reduce((sum, t) => sum + t.count, 0);
    const topTrades = tradesWithCounts.slice(0, 3).map(t => t.trade);

    // Show top trades from DB, fall back to showing all TRADE_CATEGORIES if empty
    const displayTrades = tradesWithCounts.length > 0
        ? tradesWithCounts
        : TRADE_CATEGORIES.slice(0, 12).map(t => ({ trade: t, count: 0, avgRating: "0.0" }));

    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://traderefer.au" },
            { "@type": "ListItem", "position": 2, "name": "Directory", "item": "https://traderefer.au/local" },
            { "@type": "ListItem", "position": 3, "name": stateUpper, "item": `https://traderefer.au/local/${state}` },
            { "@type": "ListItem", "position": 4, "name": cityName, "item": `https://traderefer.au/local/${state}/${city}` },
            { "@type": "ListItem", "position": 5, "name": `Trades in ${suburbName}` },
        ]
    };

    return (
        <main className="min-h-screen bg-zinc-50">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />

            {/* Hero */}
            <div className="bg-zinc-900 pt-32 pb-16 text-white">
                <div className="container mx-auto px-4">
                    <nav className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest mb-8">
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href="/local" className="hover:text-white transition-colors">Directory</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href={`/local/${state}`} className="hover:text-white transition-colors">{stateUpper}</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href={`/local/${state}/${city}`} className="hover:text-white transition-colors">{cityName}</Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-orange-400">{suburbName}</span>
                    </nav>

                    <h1 className="text-4xl md:text-5xl font-black mb-4">
                        Trades in <span className="text-orange-500">{suburbName}</span>, {cityName}
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl mb-6">
                        Verified local tradies in {suburbName}. Browse by trade category to find ABN-checked businesses recommended by your neighbours.
                    </p>
                    {totalBusinesses > 0 && (
                        <div className="flex flex-wrap gap-6 text-sm text-zinc-400 font-medium">
                            <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-orange-500" />{totalBusinesses} verified businesses</span>
                            <span className="flex items-center gap-1.5"><Wrench className="w-4 h-4 text-orange-500" />{tradesWithCounts.length} trades available</span>
                            {topTrades.length > 0 && (
                                <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-orange-500" />Top trades: {topTrades.join(", ")}</span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Trade Grid */}
            <div className="container mx-auto px-4 py-16">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-2xl font-black text-zinc-900 mb-8">Browse by Trade in {suburbName}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
                        {displayTrades.map(({ trade, count, avgRating }) => (
                            <Link
                                key={trade}
                                href={`/local/${state}/${city}/${suburb}/${tradeToSlug(trade)}`}
                                className="group"
                            >
                                <div className="bg-white p-5 rounded-2xl border border-zinc-200 hover:border-orange-500 hover:shadow-lg transition-all duration-300">
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="text-base font-bold text-zinc-900 group-hover:text-orange-600 transition-colors leading-tight">
                                            {trade}
                                        </h3>
                                        <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-orange-500 shrink-0 mt-0.5 transition-colors" />
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-zinc-500 font-medium">
                                        {count > 0 ? (
                                            <>
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-3 h-3" />{count} listed
                                                </span>
                                                {parseFloat(avgRating) > 0 && (
                                                    <span className="flex items-center gap-1">
                                                        <Star className="w-3 h-3 fill-orange-400 text-orange-400" />{avgRating}
                                                    </span>
                                                )}
                                            </>
                                        ) : (
                                            <span className="text-zinc-400">Be the first to list</span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Nearby Suburbs */}
                    {nearbySuburbs.length > 0 && (
                        <section className="bg-white rounded-3xl border border-zinc-200 p-8">
                            <h2 className="text-xl font-black text-zinc-900 mb-6 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-orange-500" />
                                Nearby Suburbs in {cityName}
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {nearbySuburbs.map(s => (
                                    <Link
                                        key={s}
                                        href={`/local/${state}/${city}/${s.toLowerCase().replace(/\s+/g, '-')}`}
                                        className="flex items-center justify-between px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl text-sm font-bold text-zinc-600 hover:bg-zinc-100 hover:text-orange-600 transition-colors"
                                    >
                                        <span>{s}</span>
                                        <ArrowRight className="w-3 h-3 text-zinc-300" />
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
            <DirectoryFooter />
        </main>
    );
}
