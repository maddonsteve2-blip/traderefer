import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import {
    ArrowRight,
    MapPin,
    Star,
    ShieldCheck,
    DollarSign,
    Search,
    Users,
    CheckCircle2,
    ChevronRight,
    Zap,
    BadgeCheck,
    FileText,
    Wrench,
    Clock,
} from "lucide-react";
import { sql } from "@/lib/db";
import { BusinessLogo } from "@/components/BusinessLogo";
import { generateFallbackDescription } from "@/lib/business-utils";
import {
    NEAR_ME_SLUGS,
    TRADE_NOUNS,
    TRADE_COST_GUIDE,
    TRADE_FAQ_BANK,
    JOB_TYPES,
    jobToSlug,
    normalizeTradeName,
} from "@/lib/constants";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

interface PageProps {
    params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
    return Object.keys(NEAR_ME_SLUGS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const tradeName = NEAR_ME_SLUGS[slug];
    if (!tradeName) return {};

    const noun = TRADE_NOUNS[tradeName] || tradeName;
    const cost = TRADE_COST_GUIDE[tradeName];
    const year = new Date().getFullYear();
    const priceStr = cost ? ` | $${cost.low}–$${cost.high}${cost.unit}` : "";

    const count = await getBusinessCount(tradeName);

    return {
        title: `Best ${noun} Near Me (${year})${priceStr} | Compare & Hire | TradeRefer`,
        description: `Find trusted ${noun.toLowerCase()} near you. Compare ${count > 0 ? count.toLocaleString() + "+" : ""} verified ${noun.toLowerCase()} across Australia.${cost ? ` Costs from $${cost.low}–$${cost.high}${cost.unit}.` : ""} Free quotes, real reviews.`,
        alternates: { canonical: `https://traderefer.au/${slug}` },
        openGraph: {
            title: `Best ${noun} Near Me (${year}) | TradeRefer`,
            description: `Compare verified ${noun.toLowerCase()} near you. Real reviews, transparent pricing, free quotes.`,
            url: `https://traderefer.au/${slug}`,
            type: "website",
        },
    };
}

async function getBusinessCount(tradeName: string): Promise<number> {
    try {
        const result = await sql`
            SELECT COUNT(*) as count
            FROM businesses
            WHERE status = 'active'
              AND trade_category ILIKE ${"%" + tradeName + "%"}
        `;
        return parseInt(String(result[0]?.count || 0), 10);
    } catch {
        return 0;
    }
}

async function getTopBusinesses(tradeName: string, limit = 8) {
    try {
        const results = await sql`
            SELECT id, slug, business_name, trade_category, suburb, city, state,
                   avg_rating, total_reviews, is_claimed, logo_url, description,
                   referral_fee_cents
            FROM businesses
            WHERE status = 'active'
              AND trade_category ILIKE ${"%" + tradeName + "%"}
              AND slug IS NOT NULL AND slug != ''
            ORDER BY
                is_claimed DESC,
                total_reviews DESC NULLS LAST,
                avg_rating DESC NULLS LAST,
                created_at DESC
            LIMIT ${limit}
        `;
        return results;
    } catch {
        return [];
    }
}

async function getStateCounts(tradeName: string) {
    try {
        const results = await sql`
            SELECT state, COUNT(*) as count
            FROM businesses
            WHERE status = 'active'
              AND trade_category ILIKE ${"%" + tradeName + "%"}
              AND state IS NOT NULL AND state != ''
            GROUP BY state
            ORDER BY count DESC
        `;
        return results.map((r: any) => ({ state: r.state, count: parseInt(String(r.count), 10) }));
    } catch {
        return [];
    }
}

async function getTopCities(tradeName: string, limit = 12) {
    try {
        const results = await sql`
            SELECT city, state, COUNT(*) as count
            FROM businesses
            WHERE status = 'active'
              AND trade_category ILIKE ${"%" + tradeName + "%"}
              AND city IS NOT NULL AND city != ''
              AND state IS NOT NULL AND state != ''
            GROUP BY city, state
            ORDER BY count DESC
            LIMIT ${limit}
        `;
        return results.map((r: any) => ({
            city: r.city,
            state: r.state,
            count: parseInt(String(r.count), 10),
        }));
    } catch {
        return [];
    }
}

const STATE_SLUGS: Record<string, string> = {
    VIC: "vic", NSW: "nsw", QLD: "qld", WA: "wa",
    SA: "sa", TAS: "tas", ACT: "act", NT: "nt",
};

export default async function NearMePage({ params }: PageProps) {
    const { slug } = await params;
    const tradeName = NEAR_ME_SLUGS[slug];
    if (!tradeName) notFound();

    const noun = TRADE_NOUNS[tradeName] || tradeName;
    const cost = TRADE_COST_GUIDE[tradeName];
    const tradeKey = normalizeTradeName(tradeName);
    const faqs = (TRADE_FAQ_BANK[tradeKey] || TRADE_FAQ_BANK[tradeName] || []).slice(0, 6);
    const services = (JOB_TYPES[tradeKey] || JOB_TYPES[tradeName] || []).slice(0, 12);
    const year = new Date().getFullYear();

    const [businesses, stateCounts, topCities, totalCount] = await Promise.all([
        getTopBusinesses(tradeName),
        getStateCounts(tradeName),
        getTopCities(tradeName),
        getBusinessCount(tradeName),
    ]);

    const totalStates = stateCounts.length;

    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://traderefer.au" },
            { "@type": "ListItem", position: 2, name: `${noun} Near Me`, item: `https://traderefer.au/${slug}` },
        ],
    };

    const faqJsonLd = faqs.length > 0 ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq: any) => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: { "@type": "Answer", text: faq.a },
        })),
    } : null;

    const serviceJsonLd = {
        "@context": "https://schema.org",
        "@type": "Service",
        name: `${tradeName} Services Australia`,
        serviceType: tradeName,
        areaServed: { "@type": "Country", name: "Australia" },
        provider: { "@type": "Organization", name: "TradeRefer", url: "https://traderefer.au" },
        ...(cost ? {
            offers: {
                "@type": "AggregateOffer",
                lowPrice: cost.low.toString(),
                highPrice: cost.high.toString(),
                priceCurrency: "AUD",
            },
        } : {}),
    };

    const tradeSlug = tradeName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    return (
        <main className="min-h-screen bg-zinc-50">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
            {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}

            {/* ═══ HERO ═══ */}
            <div className="bg-[#1A1A1A] pt-32 pb-20 text-white">
                <div className="container mx-auto px-4">
                    <nav className="flex flex-wrap items-center gap-2 font-bold text-zinc-400 uppercase tracking-widest mb-8" style={{ fontSize: "16px" }}>
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-[#FF6600]">{noun} Near Me</span>
                    </nav>

                    <div className="max-w-4xl">
                        <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-2 font-black text-orange-400 uppercase tracking-widest mb-6" style={{ fontSize: "16px" }}>
                            <Search className="w-4 h-4" />
                            Find &amp; Compare
                        </div>
                        <h1 className="font-black mb-6 leading-[1.05] font-display text-white" style={{ fontSize: "clamp(48px, 8vw, 80px)" }}>
                            Best <span className="text-[#FF6600]">{noun}</span> Near Me
                        </h1>
                        <p className="text-zinc-400 max-w-3xl mb-8" style={{ fontSize: "20px", lineHeight: 1.7 }}>
                            Compare {totalCount > 0 ? `${totalCount.toLocaleString()}+` : "verified"} {noun.toLowerCase()} across Australia. 
                            Check real reviews, compare pricing{cost ? ` (from $${cost.low}–$${cost.high}${cost.unit})` : ""}, 
                            and get free quotes from trusted local professionals.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link
                                href={`/quotes?trade=${encodeURIComponent(tradeName)}&source=${encodeURIComponent("/" + slug)}`}
                                className="bg-[#FF6600] hover:bg-[#E65C00] text-white font-black px-8 rounded-xl transition-colors inline-flex items-center justify-center gap-2"
                                style={{ minHeight: "64px", fontSize: "18px" }}
                            >
                                Get 3 Free Quotes <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                href={`/businesses?category=${encodeURIComponent(tradeName)}`}
                                className="bg-white/10 hover:bg-white/20 text-white font-black px-8 rounded-xl transition-colors border border-white/10 inline-flex items-center justify-center"
                                style={{ minHeight: "64px", fontSize: "18px" }}
                            >
                                Browse All {noun}
                            </Link>
                        </div>

                        <div className="flex flex-wrap gap-6 text-white font-bold mt-8" style={{ fontSize: "16px" }}>
                            {cost && (
                                <span className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-[#FF6600]" />Typical rates ${cost.low}–${cost.high}{cost.unit}</span>
                            )}
                            {totalCount > 0 && (
                                <span className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-[#FF6600]" />{totalCount.toLocaleString()} {noun.toLowerCase()} listed</span>
                            )}
                            {totalStates > 0 && (
                                <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#FF6600]" />Available in {totalStates} states</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16">
                <div className="max-w-6xl mx-auto space-y-16">

                    {/* ═══ TOP BUSINESSES ═══ */}
                    {businesses.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-2">
                                <p className="text-[#FF6600] font-black text-sm uppercase tracking-widest">Top Rated</p>
                            </div>
                            <h2 className="font-black text-[#1A1A1A] mb-8 font-display" style={{ fontSize: "32px" }}>
                                Top {noun} in Australia
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {businesses.map((biz: any) => {
                                    const rating = parseFloat(biz.avg_rating) || 0;
                                    const reviews = parseInt(biz.total_reviews) || 0;
                                    const desc = biz.description || generateFallbackDescription(biz);
                                    return (
                                        <Link
                                            key={String(biz.id)}
                                            href={`/b/${biz.slug}`}
                                            className="bg-white rounded-2xl border border-zinc-200 p-5 hover:border-[#FF6600] hover:shadow-lg transition-all group flex gap-4"
                                        >
                                            <div className="w-14 h-14 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0 overflow-hidden">
                                                <BusinessLogo
                                                    logoUrl={biz.logo_url}
                                                    name={biz.business_name}
                                                    size="xs"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-black text-zinc-900 group-hover:text-[#FF6600] truncate" style={{ fontSize: "16px" }}>
                                                        {biz.business_name}
                                                    </h3>
                                                    {biz.is_claimed && (
                                                        <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    {rating > 0 && (
                                                        <span className="flex items-center gap-1 text-sm font-bold text-zinc-700">
                                                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                                            {rating.toFixed(1)}
                                                            {reviews > 0 && <span className="text-zinc-400">({reviews})</span>}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1 text-sm text-zinc-500">
                                                        <MapPin className="w-3.5 h-3.5" />
                                                        {biz.suburb || biz.city}{biz.state ? `, ${biz.state}` : ""}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-zinc-500 line-clamp-2">{desc}</p>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                            <div className="mt-6 text-center">
                                <Link
                                    href={`/businesses?category=${encodeURIComponent(tradeName)}`}
                                    className="inline-flex items-center gap-2 text-[#FF6600] font-black hover:underline"
                                    style={{ fontSize: "16px" }}
                                >
                                    View all {totalCount.toLocaleString()} {noun.toLowerCase()} <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </section>
                    )}

                    {/* ═══ HOW IT WORKS ═══ */}
                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-8 font-display" style={{ fontSize: "32px" }}>
                            How to Find {noun} Near You
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { step: "1", icon: Search, title: "Search & compare", desc: `Browse verified ${noun.toLowerCase()} in your area. Check ratings, reviews, and pricing to shortlist the best match.` },
                                { step: "2", icon: FileText, title: "Get free quotes", desc: `Request up to 3 free quotes from local ${noun.toLowerCase()}. No obligation, no hidden fees.` },
                                { step: "3", icon: CheckCircle2, title: "Hire with confidence", desc: `Choose the ${noun.toLowerCase().replace(/s$/, "")} that fits your budget and schedule. All businesses are ABN-verified.` },
                            ].map(({ step, icon: Icon, title, desc }) => (
                                <div key={step} className="text-center">
                                    <div className="w-16 h-16 bg-orange-50 border-2 border-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Icon className="w-7 h-7 text-[#FF6600]" />
                                    </div>
                                    <div className="text-xs font-black text-[#FF6600] uppercase tracking-widest mb-2">Step {step}</div>
                                    <h3 className="font-black text-zinc-900 mb-2" style={{ fontSize: "20px" }}>{title}</h3>
                                    <p className="text-zinc-500" style={{ fontSize: "16px", lineHeight: 1.7 }}>{desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ═══ COST GUIDE ═══ */}
                    {cost && (
                        <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                            <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}>
                                <DollarSign className="w-6 h-6 text-[#FF6600]" />
                                {tradeName} Cost Guide {year}
                            </h2>
                            <p className="text-zinc-500 mb-8" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                                Typical pricing for {tradeName.toLowerCase()} services across Australia. Actual costs vary by location, complexity, and urgency.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                                    <p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Typical Rate</p>
                                    <p className="text-3xl font-black text-zinc-900">${cost.low}–${cost.high}</p>
                                    <p className="text-zinc-500" style={{ fontSize: "16px" }}>{cost.unit}</p>
                                </div>
                                <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                                    <p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Best Practice</p>
                                    <p className="text-3xl font-black text-zinc-900">2–3</p>
                                    <p className="text-zinc-500" style={{ fontSize: "16px" }}>written quotes per job</p>
                                </div>
                                <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                                    <p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Businesses Listed</p>
                                    <p className="text-3xl font-black text-zinc-900">{totalCount.toLocaleString()}</p>
                                    <p className="text-zinc-500" style={{ fontSize: "16px" }}>across Australia</p>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* ═══ SERVICES ═══ */}
                    {services.length > 0 && (
                        <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                            <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}>
                                <Wrench className="w-6 h-6 text-[#FF6600]" />
                                {tradeName} Services We Cover
                            </h2>
                            <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                                Find {noun.toLowerCase()} for any of these common {tradeName.toLowerCase()} jobs.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {services.map((service: string) => (
                                    <Link
                                        key={service}
                                        href={`/trades/${jobToSlug(service)}`}
                                        className="flex items-center justify-between px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl font-bold text-zinc-700 hover:bg-orange-50 hover:border-[#FF6600] hover:text-[#FF6600] transition-colors capitalize"
                                        style={{ fontSize: "16px" }}
                                    >
                                        <span>{service}</span>
                                        <ArrowRight className="w-4 h-4 text-zinc-300" />
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* ═══ FIND BY CITY ═══ */}
                    {topCities.length > 0 && (
                        <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                            <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}>
                                <MapPin className="w-6 h-6 text-[#FF6600]" />
                                Find {noun} by City
                            </h2>
                            <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                                Browse {noun.toLowerCase()} in major Australian cities. Click through to find suburb-level listings near you.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {topCities.map(({ city, state, count }: any) => {
                                    const stateSlug = STATE_SLUGS[state] || state.toLowerCase();
                                    const citySlug = city.toLowerCase().replace(/\s+/g, "-");
                                    return (
                                        <Link
                                            key={`${city}-${state}`}
                                            href={`/local/${stateSlug}/${citySlug}?category=${encodeURIComponent(tradeName)}`}
                                            className="flex items-center justify-between px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl hover:bg-orange-50 hover:border-[#FF6600] transition-colors group"
                                        >
                                            <div>
                                                <span className="font-black text-zinc-900 group-hover:text-[#FF6600]" style={{ fontSize: "16px" }}>{city}</span>
                                                <p className="text-zinc-400" style={{ fontSize: "14px" }}>{state} · {count} listed</p>
                                            </div>
                                            <ArrowRight className="w-5 h-5 text-zinc-300 group-hover:text-[#FF6600]" />
                                        </Link>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* ═══ BY STATE ═══ */}
                    {stateCounts.length > 0 && (
                        <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                            <h2 className="font-black text-[#1A1A1A] mb-6 font-display" style={{ fontSize: "28px" }}>
                                {noun} by State
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {stateCounts.map(({ state, count }: any) => {
                                    const stateSlug = STATE_SLUGS[state] || state.toLowerCase();
                                    return (
                                        <Link
                                            key={state}
                                            href={`/local/${stateSlug}?category=${encodeURIComponent(tradeName)}`}
                                            className="bg-zinc-50 border-2 border-zinc-200 rounded-2xl p-4 text-center hover:bg-orange-50 hover:border-[#FF6600] transition-colors group"
                                        >
                                            <p className="font-black text-zinc-900 group-hover:text-[#FF6600]" style={{ fontSize: "18px" }}>{state}</p>
                                            <p className="text-zinc-400 text-sm font-bold">{count.toLocaleString()} {noun.toLowerCase()}</p>
                                        </Link>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* ═══ WHY TRADEREFER ═══ */}
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { icon: ShieldCheck, title: "Verified businesses", desc: `Every ${noun.toLowerCase().replace(/s$/, "")} on TradeRefer is ABN-checked and community-referred.` },
                            { icon: Star, title: "Real reviews", desc: "Read verified reviews from real customers. No fake ratings, no paid placements." },
                            { icon: Zap, title: "Free quotes", desc: `Request up to 3 free quotes and compare pricing, availability, and scope of work.` },
                        ].map(({ icon: Icon, title, desc }) => (
                            <div key={title} className="bg-white rounded-3xl border border-zinc-200 p-8">
                                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mb-4">
                                    <Icon className="w-6 h-6 text-[#FF6600]" />
                                </div>
                                <h3 className="font-black text-zinc-900 mb-2" style={{ fontSize: "20px" }}>{title}</h3>
                                <p className="text-zinc-600" style={{ fontSize: "16px", lineHeight: 1.7 }}>{desc}</p>
                            </div>
                        ))}
                    </section>

                    {/* ═══ FAQS ═══ */}
                    {faqs.length > 0 && (
                        <section>
                            <h2 className="font-black text-[#1A1A1A] mb-8 font-display" style={{ fontSize: "32px" }}>
                                {tradeName}: Frequently Asked Questions
                            </h2>
                            <div className="space-y-4">
                                {faqs.map((faq: any) => (
                                    <div key={faq.q} className="bg-white rounded-2xl border border-zinc-200 p-6">
                                        <h3 className="font-black text-zinc-900 mb-2" style={{ fontSize: "18px" }}>{faq.q}</h3>
                                        <p className="text-zinc-600" style={{ fontSize: "16px", lineHeight: 1.7 }}>{faq.a}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* ═══ RELATED NEAR-ME PAGES ═══ */}
                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-6 font-display" style={{ fontSize: "28px" }}>
                            Related Trades Near You
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {Object.entries(NEAR_ME_SLUGS)
                                .filter(([s]) => s !== slug)
                                .slice(0, 9)
                                .map(([nearSlug, nearTrade]) => (
                                    <Link
                                        key={nearSlug}
                                        href={`/${nearSlug}`}
                                        className="flex items-center justify-between px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl font-bold text-zinc-700 hover:bg-orange-50 hover:border-[#FF6600] hover:text-[#FF6600] transition-colors"
                                        style={{ fontSize: "16px" }}
                                    >
                                        <span>{TRADE_NOUNS[nearTrade] || nearTrade} Near Me</span>
                                        <ArrowRight className="w-4 h-4 text-zinc-300" />
                                    </Link>
                                ))}
                        </div>
                    </section>

                    {/* ═══ FINAL CTA ═══ */}
                    <section className="bg-[#1A1A1A] rounded-3xl p-8 md:p-12 text-center text-white">
                        <h2 className="font-black mb-4 text-white" style={{ fontSize: "40px" }}>
                            Need {noun === "Handymen" ? "a Handyman" : `a ${noun.replace(/s$/, "").replace(/ers$/, "er").replace(/ors$/, "or")}`} Near You?
                        </h2>
                        <p className="text-zinc-400 mb-8 max-w-2xl mx-auto" style={{ fontSize: "20px", lineHeight: 1.7 }}>
                            Compare verified {noun.toLowerCase()}, check real reviews, and get free quotes from trusted local professionals across Australia.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link
                                href={`/quotes?trade=${encodeURIComponent(tradeName)}&source=${encodeURIComponent("/" + slug)}`}
                                className="inline-flex items-center gap-2 bg-[#FF6600] hover:bg-[#E65C00] text-white font-black rounded-xl px-8 transition-colors"
                                style={{ minHeight: "64px", fontSize: "18px" }}
                            >
                                Get 3 Free Quotes <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                href={`/businesses?category=${encodeURIComponent(tradeName)}`}
                                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-black rounded-xl px-8 transition-colors border border-white/10"
                                style={{ minHeight: "64px", fontSize: "18px" }}
                            >
                                Browse All {noun}
                            </Link>
                        </div>
                    </section>

                </div>
            </div>
        </main>
    );
}
