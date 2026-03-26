import { sql } from "@/lib/db";
import { PublicMultiQuoteForm } from "@/components/PublicMultiQuoteForm";
import { ChevronRight, Hammer, Lightbulb, Pipette as Pipe, Paintbrush, Wrench, Home, Truck, Trash2, Shovel, Scissors, Lock, Wind, Bug, PenTool, HardHat, Construction, LayoutGrid, Fence, MapPin, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";
import { permanentRedirect, redirect } from "next/navigation";
import { SUBURB_CONTEXT } from "@/lib/constants";
import { parseSuburbSlug, getPostcode } from "@/lib/postcodes";

interface PageProps {
    params: Promise<{ state: string; city: string; suburb: string }>;
    searchParams: Promise<{ category?: string }>;
}

type TradeCountRow = {
    trade: string;
    count: string | number;
};

type SuburbRow = {
    suburb: string;
};

const TRADE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
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
    if (!slug) return "";
    try { slug = decodeURIComponent(slug); } catch { /* already decoded */ }
    // Strip postcode suffix if present (e.g. "parramatta-2150" → "Parramatta")
    const { suburb: cleanSlug } = parseSuburbSlug(slug);
    return cleanSlug.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { state, city, suburb } = await params;
    const suburbName = formatSlug(suburb);
    const cityName = formatSlug(city);
    const stateUpper = state.toUpperCase();
    const { postcode } = parseSuburbSlug(suburb);
    const pc = postcode || getPostcode(parseSuburbSlug(suburb).suburb, state);
    const pcLabel = pc ? ` ${stateUpper} ${pc}` : ` ${stateUpper}`;
    const year = new Date().getFullYear();
    const stats = await getSuburbStats(state, city, suburb);
    return {
        title: `${stats.total > 0 ? stats.total + ' ' : ''}Trusted Tradies in ${suburbName}${pcLabel} (${year}) | TradeRefer`,
        description: `Compare ${stats.total > 0 ? stats.total : 'verified'} local tradespeople in ${suburbName}, ${cityName}${pcLabel}. Browse ${stats.categories > 0 ? stats.categories + ' trade categories' : 'plumbers, electricians, builders & more'} — ABN-checked with real community referrals. Free quotes.`,
        robots: stats.total === 0 ? { index: false, follow: true } : { index: true, follow: true },
        alternates: { canonical: `https://traderefer.au/local/${state}/${city}/${suburb}` },
        openGraph: {
            title: `${stats.total > 0 ? stats.total + ' ' : ''}Trusted Tradies in ${suburbName}${pcLabel} (${year}) | TradeRefer`,
            description: `Compare ${stats.total > 0 ? stats.total : 'verified'} local tradespeople in ${suburbName}${pcLabel}. ABN-checked, community-ranked.`,
        },
        twitter: {
            card: 'summary_large_image',
            title: `${stats.total > 0 ? stats.total + ' ' : ''}Trusted Tradies in ${suburbName}${pcLabel} (${year}) | TradeRefer`,
            description: `Compare ${stats.total > 0 ? stats.total : 'verified'} local tradespeople in ${suburbName}${pcLabel}. ABN-checked, community-ranked.`,
        },
    };
}

async function getSuburbStats(state: string, city: string, suburb: string): Promise<{ total: number; categories: number }> {
    try {
        const stateCode = state.toUpperCase();
        const cityName = formatSlug(city);
        const suburbName = formatSlug(suburb);
        const result = await sql`
            SELECT COUNT(*) as total, COUNT(DISTINCT trade_category) as categories
            FROM businesses
            WHERE status = 'active'
              AND UPPER(state) = ${stateCode}
              AND LOWER(city) = LOWER(${cityName})
              AND LOWER(suburb) = LOWER(${suburbName})
        `;
        return {
            total: parseInt(result[0]?.total ?? '0', 10),
            categories: parseInt(result[0]?.categories ?? '0', 10),
        };
    } catch { return { total: 0, categories: 0 }; }
}

async function getTradesWithCounts(state: string, city: string, suburb: string): Promise<{ trade: string; count: number }[]> {
    try {
        const stateCode = state.toUpperCase();
        const cityName = formatSlug(city);
        const suburbName = formatSlug(suburb);
        const results = await sql<TradeCountRow[]>`
            SELECT trade_category as trade, COUNT(*) as count
            FROM businesses
            WHERE status = 'active'
              AND UPPER(state) = ${stateCode}
              AND LOWER(city) = LOWER(${cityName})
              AND LOWER(suburb) = LOWER(${suburbName})
            GROUP BY trade_category
            ORDER BY count DESC
        `;
        return results.map((r) => ({ trade: r.trade, count: parseInt(String(r.count), 10) }));
    } catch { return []; }
}

async function getNearbySuburbs(state: string, city: string, currentSuburb: string): Promise<string[]> {
    try {
        const stateCode = state.toUpperCase();
        const cityName = formatSlug(city);
        const suburbName = formatSlug(currentSuburb);
        const results = await sql<SuburbRow[]>`
            SELECT DISTINCT suburb FROM businesses
            WHERE status = 'active'
              AND UPPER(state) = ${stateCode}
              AND LOWER(city) = LOWER(${cityName})
              AND LOWER(suburb) != LOWER(${suburbName})
              AND suburb IS NOT NULL
            ORDER BY suburb ASC
            LIMIT 12
        `;
        return results.map((r) => r.suburb).filter(Boolean);
    } catch { return []; }
}

export default async function SuburbDirectoryPage({ params, searchParams }: PageProps) {
    const { state, city, suburb } = await params;
    const { category } = await searchParams;
    const cityName = formatSlug(city);
    const suburbName = formatSlug(suburb);
    const stateUpper = state.toUpperCase();
    const quoteHref = `/quotes?suburb=${encodeURIComponent(suburbName)}&city=${encodeURIComponent(cityName)}&state=${stateUpper}&source=${encodeURIComponent(`/local/${state}/${city}/${suburb}`)}`;

    // If URL has no postcode but we know it, 308 permanent redirect to postcode URL
    const { postcode: urlPostcode, suburb: bareSuburb } = parseSuburbSlug(suburb);
    if (!urlPostcode) {
        const knownPostcode = getPostcode(bareSuburb, state);
        if (knownPostcode) {
            permanentRedirect(`/local/${state}/${city}/${bareSuburb}-${knownPostcode}`);
        }
    }
    const postcode = urlPostcode || getPostcode(bareSuburb, state);

    // If user already selected a trade (via ?category param), skip trade selection and go directly
    if (category) {
        const tradeSlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        redirect(`/local/${state}/${city}/${suburb}/${tradeSlug}`);
    }

    const [suburbStats, tradesWithCounts, nearbySuburbs] = await Promise.all([
        getSuburbStats(state, city, suburb),
        getTradesWithCounts(state, city, suburb),
        getNearbySuburbs(state, city, suburb),
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
            { "@type": "ListItem", "position": 5, "name": `Best Trades in ${suburbName}${postcode ? ` ${postcode}` : ''}` },
        ]
    };

    return (
        <>
        <main className="min-h-screen bg-[#FCFCFC]">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

            {/* ── BREADCRUMBS ── */}
            <div className="bg-gray-100 border-b border-gray-200" style={{ paddingTop: '108px', paddingBottom: '12px' }}>
                <div className="container mx-auto px-4">
                    <nav className="flex items-center flex-wrap gap-2 font-bold text-gray-500 uppercase tracking-widest" style={{ fontSize: '16px' }}>
                        <Link href="/" className="hover:text-[#FF6600] transition-colors">Home</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href="/local" className="hover:text-[#FF6600] transition-colors">Directory</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href={`/local/${state}`} className="hover:text-[#FF6600] transition-colors">{stateUpper}</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href={`/local/${state}/${city}`} className="hover:text-[#FF6600] transition-colors">{cityName}</Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-[#FF6600]">{suburbName}{postcode ? ` ${postcode}` : ''}</span>
                    </nav>
                </div>
            </div>

            {/* ── HERO ── */}
            <div className="bg-[#FCFCFC] pb-20 pt-12 relative overflow-hidden border-b border-gray-200">
                <div className="absolute inset-0 z-0 bg-cover bg-center opacity-8" style={{ backgroundImage: 'url(\'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=2670&auto=format&fit=crop\')' }} />
                <div className="absolute inset-0 z-0 bg-[#FCFCFC]/85" />
                <div className="container mx-auto px-4 relative z-10">
                    {/* BLUF — 40-word AI-crawlable expert summary */}
                    <div className="bg-white border-l-4 border-[#FF6600] rounded-xl px-6 py-4 max-w-3xl mb-8">
                        <p className="text-[#1A1A1A]" style={{ fontSize: '18px', lineHeight: 1.7 }}>
                            {suburbStats.total > 0
                                ? `${suburbName} has ${suburbStats.total} verified trade businesses across ${suburbStats.categories} categories. TradeRefer eliminates the $21 lead-risk for ${suburbName} pros — pay only when you win the work.`
                                : `Find trusted local trade professionals in ${suburbName}, ${cityName}. All businesses are ABN-verified. TradeRefer eliminates upfront lead risk — pay only when you win.`
                            }
                        </p>
                    </div>
                    <div className="max-w-4xl">
                        <h1 className="text-[42px] md:text-7xl lg:text-[80px] font-black mb-6 leading-[1.1] text-[#1A1A1A] font-display">
                            Best Trades in <span className="text-[#FF6600]">{suburbName}{postcode ? ` ${postcode}` : ''}</span>
                        </h1>
                        <p className="text-gray-600 max-w-2xl" style={{ fontSize: '20px', lineHeight: 1.7 }}>
                            {suburbStats.total > 0
                                ? `${suburbStats.total.toLocaleString()} verified tradies across ${suburbStats.categories} trade categories in ${suburbName}, ${cityName}.`
                                : `Find verified local trades in ${suburbName}, ${cityName}. Browse by trade category to compare experts near you.`
                            }
                        </p>
                        <div className="flex flex-wrap gap-4 mb-6">
                            <Link href={quoteHref} className="inline-flex items-center justify-center gap-2 bg-[#FF6600] hover:bg-[#E65C00] text-white font-black px-8 rounded-xl transition-colors" style={{ minHeight: '64px', fontSize: '18px' }}>
                                Get 3 Free Quotes
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                            <Link href="/categories" className="inline-flex items-center justify-center bg-white border-2 border-gray-200 hover:border-[#FF6600] rounded-xl px-5 py-3 font-bold text-[#1A1A1A] hover:text-[#FF6600] transition-colors" style={{ minHeight: '64px', fontSize: '18px' }}>
                                Browse by Trade
                            </Link>
                        </div>
                        <div className="flex flex-wrap gap-4 text-[#1A1A1A] font-bold" style={{ fontSize: '16px' }}>
                            <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#FF6600]" />ABN-checked businesses</span>
                            <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#FF6600]" />{cityName}, {stateUpper}</span>
                            <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#FF6600]" />Pay only when you win the job</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── MAIN CONTENT ── */}
            <div className="py-20">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto space-y-16">

                        <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                            <div className="max-w-3xl mb-8">
                                <h2 className="font-black text-[#1A1A1A] mb-3 font-display" style={{ fontSize: '32px' }}>Get 3 Free Quotes in {suburbName}</h2>
                                <p className="text-gray-500" style={{ fontSize: '20px', lineHeight: 1.7 }}>
                                    Submit your job once and we&apos;ll match you with up to 3 verified local businesses in {suburbName}, {cityName}.
                                </p>
                            </div>
                            <PublicMultiQuoteForm initialState={stateUpper} initialCity={cityName} initialSuburb={suburbName} initialSourcePage={`/local/${state}/${city}/${suburb}`} />
                        </section>

                        {/* Trade category grid — oversized 120px icons */}
                        <section>
                            <h2 className="font-black text-[#1A1A1A] mb-2 font-display" style={{ fontSize: '32px' }}>Select a Trade Category</h2>
                            <p className="text-gray-500 mb-8" style={{ fontSize: '20px', lineHeight: 1.7 }}>Find verified local specialists in {suburbName} for your project.</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                                {displayTrades.map(({ trade, count }) => {
                                    const Icon = TRADE_ICONS[trade] || Wrench;
                                    const tradeSlug = trade.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                                    const tradeUrl = `/local/${state}/${city}/${suburb}/${tradeSlug}`;
                                    return (
                                        <Link key={trade} href={tradeUrl} className="group">
                                            <div className="bg-white rounded-2xl border border-zinc-200 hover:border-orange-500 hover:shadow-xl transition-all duration-300 p-5 flex flex-col items-center text-center gap-4">
                                                <div className="w-[120px] h-[120px] bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors">
                                                    <Icon className="w-12 h-12" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-[#1A1A1A] group-hover:text-[#FF6600] transition-colors leading-tight mb-1" style={{ fontSize: '22px' }}>
                                                        {trade}
                                                    </p>
                                                    {count > 0 && (
                                                        <p className="font-bold text-[#FF6600]" style={{ fontSize: '16px' }}>{count} verified</p>
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
                                    <h2 className="font-black text-[#1A1A1A] mb-2 font-display" style={{ fontSize: '24px' }}>Local Knowledge: {suburbName}</h2>
                                    <p className="text-gray-700" style={{ fontSize: '20px', lineHeight: 1.7 }}>
                                        {suburbName} features {suburbCtx.housing} under {suburbCtx.climate}. Local tradies understand the specific requirements of properties in the {suburbCtx.region} area under {suburbCtx.council}.
                                    </p>
                                </div>
                            </section>
                        )}

                        {/* Verification trust block */}
                        <section className="bg-white rounded-3xl border border-zinc-200 p-8 flex gap-4">
                            <ShieldCheck className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
                            <div>
                                <h2 className="font-black text-[#1A1A1A] mb-2 font-display" style={{ fontSize: '24px' }}>How TradeRefer Verifies {suburbName} Businesses</h2>
                                <p className="text-gray-600" style={{ fontSize: '20px', lineHeight: 1.7 }}>
                                    Every business listed in {suburbName} is checked against the Australian Business Register for an active ABN, has their state trade licence confirmed, and is ranked by real peer referrals from {cityName} residents — never paid ads.
                                </p>
                            </div>
                        </section>

                        {/* Nearby suburbs cluster */}
                        {nearbySuburbs.length > 0 && (
                            <section>
                                <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: '24px' }}>
                                    <MapPin className="w-6 h-6 text-[#FF6600]" />
                                    Nearby Suburbs in {cityName}
                                </h2>
                                <p className="text-gray-500 mb-6" style={{ fontSize: '20px', lineHeight: 1.7 }}>Find trade professionals in suburbs adjacent to {suburbName}:</p>
                                <div className="flex flex-wrap gap-3">
                                    {nearbySuburbs.map((s) => {
                                        const nSlug = s.toLowerCase().replace(/ /g, '-');
                                        const nPc = getPostcode(nSlug, state);
                                        return (
                                        <Link
                                            key={s}
                                            href={`/local/${state}/${city}/${nSlug}${nPc ? `-${nPc}` : ''}`}
                                            className="px-5 py-3 bg-white border-2 border-zinc-200 rounded-xl font-bold text-[#1A1A1A] hover:bg-orange-50 hover:border-[#FF6600] hover:text-[#FF6600] transition-colors" style={{ fontSize: '16px' }}
                                        >
                                            {s}{nPc ? ` ${nPc}` : ''}
                                        </Link>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                    </div>
                </div>
            </div>
        </main>
        </>
    );
}

