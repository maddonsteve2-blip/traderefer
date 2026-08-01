import { sql } from "@/lib/db";
import { PublicMultiQuoteForm } from "@/components/PublicMultiQuoteForm";
import { ChevronRight, Hammer, Lightbulb, Pipette as Pipe, Paintbrush, Wrench, Home, Truck, Trash2, Shovel, Scissors, Lock, Wind, Bug, PenTool, HardHat, Construction, LayoutGrid, Fence, MapPin, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { SUBURB_CONTEXT } from "@/lib/constants";
import { parseSuburbSlug, getPostcode, getCanonicalSuburbSlug, getDisplayPostcode } from "@/lib/postcodes";
import { getCanonicalCitySlug } from "@/lib/suburb-cities";
import { buildOgImageUrl } from "@/lib/og-image";
import { directoryRobots } from "@/lib/seo/index-policy";

export const revalidate = 3600; // ISR — match the [state]/[city]/[trade] pages

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
    const canonicalSuburb = getCanonicalSuburbSlug(suburb, state);
    const suburbName = formatSlug(canonicalSuburb);
    const cityName = formatSlug(city);
    const stateUpper = state.toUpperCase();
    const pc = getDisplayPostcode(canonicalSuburb, state);
    const pcLabel = pc ? ` ${stateUpper} ${pc}` : ` ${stateUpper}`;
    const stats = await getSuburbStats(state, city, canonicalSuburb);
    // Unknown suburb slug + no real listings = crawl trap, not a page.
    if (getPostcode(parseSuburbSlug(suburb).suburb, state) === null && stats.total === 0) notFound();
    const canonicalUrl = `https://traderefer.au/local/${state}/${getCanonicalCitySlug(state, suburb) ?? city}/${canonicalSuburb}`;
    const ogImageUrl = buildOgImageUrl({
        template: "suburb",
        title: `Trusted tradies in ${suburbName}${pcLabel}`,
        subtitle: `Browse ${stats.categories > 0 ? `${stats.categories} trade categories` : "local trades"} in ${suburbName}, ${cityName}. ABN-checked businesses with community referral signals.`,
        eyebrow: "Suburb directory",
        badge: `${stateUpper} local hub`,
        stat1: stats.total > 0 ? `${stats.total} tradies` : "Available tradies",
        stat2: stats.categories > 0 ? `${stats.categories} categories` : "Trade categories",
        stat3: pc ? `Postcode ${pc}` : "Free quotes",
    });
    return {
        title: `${stats.total > 0 ? stats.total + ' ' : ''}Trusted Tradies in ${suburbName}${pcLabel} | TradeRefer`,
        description: `Compare ${stats.total > 0 ? stats.total : 'available'} local tradespeople in ${suburbName}, ${cityName}${pcLabel}. Browse ${stats.categories > 0 ? stats.categories + ' trade categories' : 'plumbers, electricians, builders & more'} — ABN and public review signals where available. Free quotes.`,
        robots: directoryRobots({ page: "suburb", categories: stats.categories }),
        alternates: { canonical: canonicalUrl },
        openGraph: {
            title: `${stats.total > 0 ? stats.total + ' ' : ''}Trusted Tradies in ${suburbName}${pcLabel} | TradeRefer`,
            description: `Compare ${stats.total > 0 ? stats.total : 'available'} local tradespeople in ${suburbName}${pcLabel}. ABN-checked, community-informed.`,
            url: canonicalUrl,
            siteName: 'TradeRefer',
            type: 'website',
            images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `Trusted tradies in ${suburbName}${pcLabel}` }],
        },
        twitter: {
            card: 'summary_large_image',
            title: `${stats.total > 0 ? stats.total + ' ' : ''}Trusted Tradies in ${suburbName}${pcLabel} | TradeRefer`,
            description: `Compare ${stats.total > 0 ? stats.total : 'available'} local tradespeople in ${suburbName}${pcLabel}. ABN-checked, community-informed.`,
            images: [ogImageUrl],
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

    const { postcode: urlPostcode, suburb: bareSuburb } = parseSuburbSlug(suburb);
    const normalizedSuburb = urlPostcode ? `${bareSuburb}-${urlPostcode}` : bareSuburb;
    const canonicalSuburb = getCanonicalSuburbSlug(suburb, state);
    // The city segment is otherwise unvalidated — any junk city renders a
    // duplicate subtree, so 308 to the suburb's canonical parent city
    // (audit 2026-06-12 §B; supersedes the dead LOCATION_REDIRECTS map).
    const canonicalCity = getCanonicalCitySlug(state, bareSuburb) ?? city;
    if (canonicalSuburb !== normalizedSuburb || canonicalCity !== city) {
        permanentRedirect(`/local/${state}/${canonicalCity}/${canonicalSuburb}`);
    }
    const postcode = getDisplayPostcode(canonicalSuburb, state);
    const quoteHref = `/quotes?suburb=${encodeURIComponent(suburbName)}&city=${encodeURIComponent(cityName)}&state=${stateUpper}&source=${encodeURIComponent(`/local/${state}/${city}/${canonicalSuburb}`)}`;

    // If user already selected a trade (via ?category param), skip trade selection and go directly
    if (category) {
        const tradeSlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        redirect(`/local/${state}/${city}/${canonicalSuburb}/${tradeSlug}`);
    }

    const [suburbStats, tradesWithCounts, nearbySuburbs] = await Promise.all([
        getSuburbStats(state, city, canonicalSuburb),
        getTradesWithCounts(state, city, canonicalSuburb),
        getNearbySuburbs(state, city, canonicalSuburb),
    ]);

    // A suburb the postcode dataset has never heard of, with zero active
    // businesses, is junk-slug territory: 404 instead of fabricating a hub.
    if (getPostcode(bareSuburb, state) === null && suburbStats.total === 0) notFound();

    const displayTrades = tradesWithCounts;

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
                                ? `${suburbName} has ${suburbStats.total} trade businesses across ${suburbStats.categories} categories. TradeRefer helps locals compare profiles, service areas and quote options.`
                                : `Find trusted local trade professionals in ${suburbName}, ${cityName}. Compare ABN-checked profiles, service areas and quote options.`
                            }
                        </p>
                    </div>
                    <div className="max-w-6xl">
                        <h1 className="text-[42px] md:text-7xl lg:text-[80px] font-black mb-6 leading-[1.1] text-[#1A1A1A] font-display">
                            Best Trades in <span className="text-[#FF6600]">{suburbName}{postcode ? ` ${postcode}` : ''}</span>
                        </h1>
                        <p className="text-gray-600 max-w-2xl" style={{ fontSize: '20px', lineHeight: 1.7 }}>
                            {suburbStats.total > 0
                                ? `${suburbStats.total.toLocaleString()} trade profiles across ${suburbStats.categories} trade categories in ${suburbName}, ${cityName}.`
                                : `Find local trades in ${suburbName}, ${cityName}. Browse by trade category to compare experts near you.`
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
                            <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#FF6600]" />Compare before you contact</span>
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
                                    Submit your job once and we&apos;ll match you with up to 3 local trade profiles in {suburbName}, {cityName}.
                                </p>
                            </div>
                            <PublicMultiQuoteForm initialState={stateUpper} initialCity={cityName} initialSuburb={suburbName} initialSourcePage={`/local/${state}/${city}/${canonicalSuburb}`} />
                        </section>

                        {/* Trade category grid — oversized 120px icons */}
                        <section>
                            <h2 className="font-black text-[#1A1A1A] mb-2 font-display" style={{ fontSize: '32px' }}>Select a Trade Category</h2>
                            <p className="text-gray-500 mb-8" style={{ fontSize: '20px', lineHeight: 1.7 }}>Find local specialists in {suburbName} for your project.</p>
                            {displayTrades.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                                    {displayTrades.map(({ trade, count }) => {
                                        const Icon = TRADE_ICONS[trade] || Wrench;
                                        const tradeSlug = trade.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                                        const tradeUrl = `/local/${state}/${city}/${canonicalSuburb}/${tradeSlug}`;
                                        return (
                                            <Link key={trade} href={tradeUrl} className="group">
                                                <div className="bg-white rounded-2xl border border-zinc-200 hover:border-orange-500 hover:shadow-xl transition-all duration-300 p-5 flex flex-col items-center text-center gap-4">
                                                    <div className="w-full max-w-[120px] aspect-square bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors">
                                                        <Icon className="w-10 h-10 sm:w-12 sm:h-12" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-[#1A1A1A] group-hover:text-[#FF6600] transition-colors leading-tight mb-1" style={{ fontSize: '22px' }}>
                                                            {trade}
                                                        </p>
                                                        <p className="font-bold text-[#FF6600]" style={{ fontSize: '16px' }}>{count} profiles</p>
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-gray-500" style={{ fontSize: '18px', lineHeight: 1.7 }}>
                                    Trade-specific listings for {suburbName} are being reviewed before they are added to the public index.
                                </p>
                            )}
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
                                    TradeRefer uses public business data such as ABN, location, category, review and referral signals where available, helping {cityName} residents build a more informed shortlist.
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

