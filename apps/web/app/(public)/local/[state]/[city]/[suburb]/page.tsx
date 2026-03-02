import { sql } from "@/lib/db";
import { ChevronRight, Hammer, Lightbulb, Pipette as Pipe, Paintbrush, Wrench, Home, Truck, Trash2, Shovel, Scissors, Lock, Wind, Bug, PenTool, HardHat, Construction, LayoutGrid, Fence, MapPin, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";
import { DirectoryFooter } from "@/components/DirectoryFooter";
import { SUBURB_CONTEXT } from "@/lib/constants";

interface PageProps {
    params: Promise<{ state: string; city: string; suburb: string }>;
}

const TRADE_ICONS: Record<string, any> = {
    "Plumbing": Pipe, "Plumber": Pipe,
    "Electrician": Lightbulb, "Electrical": Lightbulb,
    "Carpenter": Hammer, "Carpentry": Hammer,
    "Painter": Paintbrush, "Painting": Paintbrush,
    "Handyman": Wrench,
    "Removalist": Truck,
    "Cleaning": Trash2, "Cleaner": Trash2,
    "Gardening & Lawn Care": Scissors, "Gardener": Scissors,
    "Landscaping": Shovel, "Landscaper": Shovel,
    "Tiling": LayoutGrid, "Tiler": LayoutGrid,
    "Plastering": PenTool, "Plasterer": PenTool,
    "Roofing": Home,
    "Bricklaying": Construction, "Bricklayer": Construction,
    "Concreting": HardHat, "Concreter": HardHat,
    "Fencing": Fence,
    "Air Conditioning & Heating": Wind, "Air Conditioning": Wind,
    "Locksmith": Lock,
    "Pest Control": Bug,
    "Builder": Home,
};

function formatSlug(slug: string) {
    return slug.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { state, city, suburb } = await params;
    const suburbName = formatSlug(suburb);
    const cityName = formatSlug(city);
    const stateUpper = state.toUpperCase();
    return {
        title: `Best Trades in ${suburbName}, ${cityName} | TradeRefer`,
        description: `Find verified local trade businesses in ${suburbName}, ${cityName} ${stateUpper}. Browse by trade category to connect with ABN-checked experts near you.`,
    };
}

async function getSuburbStats(suburb: string): Promise<{ total: number; categories: number }> {
    try {
        const suburbName = formatSlug(suburb);
        const result = await sql`
            SELECT COUNT(*) as total, COUNT(DISTINCT trade_category) as categories
            FROM businesses
            WHERE status = 'active' AND suburb ILIKE ${'%' + suburbName + '%'}
        `;
        return {
            total: parseInt(result[0]?.total ?? '0', 10),
            categories: parseInt(result[0]?.categories ?? '0', 10),
        };
    } catch { return { total: 0, categories: 0 }; }
}

async function getTradesWithCounts(suburb: string): Promise<{ trade: string; count: number }[]> {
    try {
        const suburbName = formatSlug(suburb);
        const results = await sql`
            SELECT trade_category as trade, COUNT(*) as count
            FROM businesses
            WHERE status = 'active' AND suburb ILIKE ${'%' + suburbName + '%'}
            GROUP BY trade_category
            ORDER BY count DESC
        `;
        return results.map((r: any) => ({ trade: r.trade, count: parseInt(r.count, 10) }));
    } catch { return []; }
}

async function getNearbySuburbs(city: string, currentSuburb: string): Promise<string[]> {
    try {
        const cityName = formatSlug(city);
        const suburbName = formatSlug(currentSuburb);
        const results = await sql`
            SELECT DISTINCT suburb FROM businesses
            WHERE status = 'active'
              AND city ILIKE ${'%' + cityName + '%'}
              AND suburb NOT ILIKE ${'%' + suburbName + '%'}
              AND suburb IS NOT NULL
            ORDER BY suburb ASC
            LIMIT 8
        `;
        return results.map((r: any) => r.suburb).filter(Boolean);
    } catch { return []; }
}

export default async function SuburbDirectoryPage({ params }: PageProps) {
    const { state, city, suburb } = await params;
    const cityName = formatSlug(city);
    const suburbName = formatSlug(suburb);
    const stateUpper = state.toUpperCase();

    const [suburbStats, tradesWithCounts, nearbySuburbs] = await Promise.all([
        getSuburbStats(suburb),
        getTradesWithCounts(suburb),
        getNearbySuburbs(city, suburb),
    ]);

    const displayTrades = tradesWithCounts.length > 0 ? tradesWithCounts : [
        { trade: "Plumber", count: 0 },
        { trade: "Electrician", count: 0 },
        { trade: "Carpenter", count: 0 },
        { trade: "Handyman", count: 0 },
        { trade: "Painter", count: 0 },
    ];

    const suburbCtxKey = suburbName.toLowerCase().replace(/\s+/g, "-");
    const suburbCtx = SUBURB_CONTEXT[suburbCtxKey];

    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://traderefer.au" },
            { "@type": "ListItem", "position": 2, "name": "Directory", "item": "https://traderefer.au/local" },
            { "@type": "ListItem", "position": 3, "name": stateUpper, "item": `https://traderefer.au/local/${state}` },
            { "@type": "ListItem", "position": 4, "name": cityName, "item": `https://traderefer.au/local/${state}/${city}` },
            { "@type": "ListItem", "position": 5, "name": `Best Trades in ${suburbName}` },
        ]
    };

    return (
        <main className="min-h-screen bg-[#FCFCFC]">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

            {/* ── BREADCRUMBS ── */}
            <div className="bg-zinc-900 pt-32 pb-4">
                <div className="container mx-auto px-4">
                    <nav className="flex items-center flex-wrap gap-2 text-sm font-bold text-zinc-500 uppercase tracking-widest">
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href="/local" className="hover:text-white transition-colors">Directory</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href={`/local/${state}`} className="hover:text-white transition-colors">{stateUpper}</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href={`/local/${state}/${city}`} className="hover:text-white transition-colors">{cityName}</Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-orange-500">{suburbName}</span>
                    </nav>
                </div>
            </div>

            {/* ── HERO ── */}
            <div className="bg-zinc-900 pb-20 relative overflow-hidden text-white">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                </div>
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-3xl">
                        <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
                            Best Trades in <span className="text-orange-500">{suburbName}</span>
                        </h1>
                        {/* BLUF — first 100 words, structured for AI overview extraction */}
                        <p className="text-xl text-zinc-300 mb-2 font-bold leading-[1.6] max-w-2xl">
                            {suburbStats.total > 0
                                ? `${suburbName} currently has ${suburbStats.total} verified trade businesses across ${suburbStats.categories} categories.`
                                : `Find trusted local trade professionals in ${suburbName}, ${cityName}.`
                            }
                        </p>
                        <p className="text-lg text-zinc-400 leading-[1.6] max-w-2xl">
                            All businesses ABN-verified and ranked by real community referrals — not paid placement.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── MAIN CONTENT ── */}
            <div className="py-20">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto space-y-16">

                        {/* Trade category grid — oversized 120px icons */}
                        <section>
                            <h2 className="text-2xl font-black text-zinc-900 mb-2">Select a Trade Category</h2>
                            <p className="text-lg text-zinc-500 mb-8 leading-[1.6]">Find verified local specialists in {suburbName} for your project.</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                                {displayTrades.map(({ trade, count }) => {
                                    const Icon = TRADE_ICONS[trade] || Wrench;
                                    const tradeSlug = trade.toLowerCase().replace(/ /g, '-');
                                    return (
                                        <Link key={trade} href={`/local/${state}/${city}/${suburb}/${tradeSlug}`} className="group">
                                            <div className="bg-white rounded-2xl border border-zinc-200 hover:border-orange-500 hover:shadow-xl transition-all duration-300 p-5 flex flex-col items-center text-center gap-4">
                                                <div className="w-[120px] h-[120px] bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors">
                                                    <Icon className="w-12 h-12" />
                                                </div>
                                                <div>
                                                    <p className="text-base font-black text-zinc-900 group-hover:text-orange-600 transition-colors leading-tight mb-1">
                                                        {trade}
                                                    </p>
                                                    {count > 0 && (
                                                        <p className="text-sm font-bold text-orange-500">{count} verified</p>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Local knowledge from SUBURB_CONTEXT */}
                        {suburbCtx && (
                            <section className="bg-amber-50 border border-amber-100 rounded-3xl p-8 flex gap-4">
                                <MapPin className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <h2 className="text-xl font-black text-zinc-900 mb-2">Local Knowledge: {suburbName}</h2>
                                    <p className="text-lg text-zinc-700 leading-[1.6]">
                                        {suburbName} features {suburbCtx.housing} under {suburbCtx.climate}. Local tradies understand the specific requirements of properties in the {suburbCtx.region} area under {suburbCtx.council}.
                                    </p>
                                </div>
                            </section>
                        )}

                        {/* Verification trust block */}
                        <section className="bg-white rounded-3xl border border-zinc-200 p-8 flex gap-4">
                            <ShieldCheck className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
                            <div>
                                <h2 className="text-xl font-black text-zinc-900 mb-2">How TradeRefer Verifies {suburbName} Businesses</h2>
                                <p className="text-lg text-zinc-600 leading-[1.6]">
                                    Every business listed in {suburbName} is checked against the Australian Business Register for an active ABN, has their state trade licence confirmed, and is ranked by real peer referrals from {cityName} residents — never paid ads.
                                </p>
                            </div>
                        </section>

                        {/* Nearby suburbs cluster */}
                        {nearbySuburbs.length > 0 && (
                            <section>
                                <h2 className="text-xl font-black text-zinc-900 mb-2 flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-orange-500" />
                                    Nearby Suburbs in {cityName}
                                </h2>
                                <p className="text-lg text-zinc-500 mb-6 leading-[1.6]">Find trade professionals in suburbs adjacent to {suburbName}:</p>
                                <div className="flex flex-wrap gap-2">
                                    {nearbySuburbs.map((s) => (
                                        <Link
                                            key={s}
                                            href={`/local/${state}/${city}/${s.toLowerCase().replace(/ /g, '-')}`}
                                            className="px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-bold text-zinc-600 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700 transition-colors"
                                        >
                                            {s}
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                    </div>
                </div>
            </div>
            <DirectoryFooter />
        </main>
    );
}

