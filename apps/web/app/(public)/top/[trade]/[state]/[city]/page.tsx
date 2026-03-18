import { sql } from "@/lib/db";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BusinessLogo } from "@/components/BusinessLogo";
import { Button } from "@/components/ui/button";
import { TRADE_COST_GUIDE, TRADE_FAQ_BANK, STATE_LICENSING, HOW_TO_CHOOSE, jobToSlug, TRADE_NOUNS } from "@/lib/constants";
import {
    Star, ShieldCheck, MapPin, ChevronRight, Users, Award,
    DollarSign, FileText, CheckCircle2, ArrowRight, Trophy
} from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ trade: string; state: string; city: string }>;
}

function formatSlug(slug: string) {
    return slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function tradeToSlug(trade: string) {
    return trade.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const STATE_NAMES: Record<string, string> = {
    vic: "Victoria", nsw: "New South Wales", qld: "Queensland",
    wa: "Western Australia", sa: "South Australia", tas: "Tasmania",
    act: "Australian Capital Territory", nt: "Northern Territory",
};

async function getTopBusinesses(trade: string, state: string, city: string) {
    try {
        const tradeName = formatSlug(trade);
        const cityName = formatSlug(city);
        const stateUpper = state.toUpperCase();
        const results = await sql`
            SELECT b.*,
                   (SELECT COUNT(*) FROM referral_links rl WHERE rl.business_id = b.id) as trusted_count
            FROM businesses b
            WHERE b.status = 'active'
              AND (b.listing_visibility = 'public' OR b.listing_visibility IS NULL)
              AND b.trade_category ILIKE ${'%' + tradeName + '%'}
              AND b.city ILIKE ${'%' + cityName + '%'}
              AND b.state = ${stateUpper}
              AND b.avg_rating IS NOT NULL
            ORDER BY b.avg_rating DESC NULLS LAST, b.total_reviews DESC NULLS LAST
            LIMIT 10
        `;
        return results;
    } catch {
        return [];
    }
}

async function getNearbyTradeCities(trade: string, state: string, currentCity: string) {
    try {
        const tradeName = formatSlug(trade);
        const stateUpper = state.toUpperCase();
        const cityName = formatSlug(currentCity);
        const results = await sql`
            SELECT DISTINCT city, state, COUNT(*) as cnt
            FROM businesses
            WHERE status = 'active'
              AND trade_category ILIKE ${'%' + tradeName + '%'}
              AND state = ${stateUpper}
              AND city NOT ILIKE ${'%' + cityName + '%'}
              AND city IS NOT NULL AND city != ''
            GROUP BY city, state
            HAVING COUNT(*) >= 5
            ORDER BY cnt DESC
            LIMIT 8
        `;
        return results.map((r: any) => ({ city: r.city as string, state: r.state as string }));
    } catch {
        return [];
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { trade, state, city } = await params;
    const tradeName = formatSlug(trade);
    const tradeNoun = TRADE_NOUNS[tradeName] || tradeName;
    const cityName = formatSlug(city);
    const stateName = STATE_NAMES[state] || state.toUpperCase();
    const cost = TRADE_COST_GUIDE[tradeName];
    const priceStr = cost ? ` | $${cost.low}–$${cost.high}${cost.unit}` : "";
    const year = new Date().getFullYear();

    const businesses = await getTopBusinesses(trade, state, city);
    const count = businesses.length;
    const topBiz = businesses[0] as any;
    const totalReviews = businesses.reduce((acc: number, biz: any) => acc + (parseInt(biz.total_reviews) || 0), 0);
    const topBizStr = topBiz ? ` #1: ${topBiz.business_name} (${parseFloat(topBiz.avg_rating).toFixed(1)}★).` : "";

    return {
        title: `Top ${count > 0 ? count : 10} ${tradeNoun} in ${cityName}, ${stateName} (${year})${priceStr} | TradeRefer`,
        description: `The ${count > 0 ? count : ''} highest-rated ${tradeNoun.toLowerCase()} in ${cityName}, ${stateName} ranked by ${totalReviews > 0 ? totalReviews.toLocaleString() + ' ' : ''}Google reviews.${topBizStr} Free quotes from verified local tradies.`,
        robots: count === 0 ? { index: false, follow: true } : { index: true, follow: true },
        alternates: { canonical: `https://traderefer.au/top/${trade}/${state}/${city}` },
        openGraph: {
            title: `Top 10 ${tradeNoun} in ${cityName} ${year} | TradeRefer`,
            description: `Ranked by real Google reviews. Find the best ${tradeNoun.toLowerCase()} in ${cityName}, ${stateName}.`,
        },
        twitter: {
            card: 'summary_large_image',
            title: `Top 10 ${tradeNoun} in ${cityName} ${year} | TradeRefer`,
            description: `Ranked by real Google reviews. Find the best ${tradeNoun.toLowerCase()} in ${cityName}, ${stateName}.`,
        },
    };
}

export default async function Top10CityPage({ params }: PageProps) {
    const { trade, state, city } = await params;
    const tradeName = formatSlug(trade);
    const cityName = formatSlug(city);
    const stateName = STATE_NAMES[state] || state.toUpperCase();
    const stateUpper = state.toUpperCase();
    const year = new Date().getFullYear();

    const [businesses, nearbyCities] = await Promise.all([
        getTopBusinesses(trade, state, city),
        getNearbyTradeCities(trade, state, city),
    ]);

    if (businesses.length < 3) notFound();

    const avgRating = businesses.length > 0
        ? (businesses.reduce((acc: number, biz: any) => acc + (parseFloat(biz.avg_rating) || 0), 0) / businesses.length).toFixed(1)
        : "4.8";
    const totalReviews = businesses.reduce((acc: number, biz: any) => acc + (parseInt(biz.total_reviews) || 0), 0);

    const cost = TRADE_COST_GUIDE[tradeName];
    const faqs = TRADE_FAQ_BANK[tradeName] || TRADE_FAQ_BANK["Plumbing"];
    const licenceText = STATE_LICENSING[tradeName]?.[stateUpper] || null;
    const howToChoose = HOW_TO_CHOOSE[tradeName] || HOW_TO_CHOOSE["Electrician"];
    const tradeSlug = tradeToSlug(tradeName);

    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://traderefer.au" },
            { "@type": "ListItem", "position": 2, "name": "Categories", "item": "https://traderefer.au/categories" },
            { "@type": "ListItem", "position": 3, "name": tradeName, "item": `https://traderefer.au/local/${state}` },
            { "@type": "ListItem", "position": 4, "name": cityName, "item": `https://traderefer.au/local/${state}/${city}` },
            { "@type": "ListItem", "position": 5, "name": `Top 10 ${tradeName} in ${cityName}` },
        ]
    };

    const itemListJsonLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": `Top 10 ${tradeName} in ${cityName}, ${stateName} (${year})`,
        "description": `The highest-rated ${tradeName.toLowerCase()} in ${cityName} ranked by verified Google reviews.`,
        "numberOfItems": businesses.length,
        "itemListElement": businesses.map((biz: any, i: number) => ({
            "@type": "ListItem",
            "position": i + 1,
            "url": `https://traderefer.au/b/${biz.slug}`,
            "name": biz.business_name,
        }))
    };

    const serviceJsonLd = {
        "@context": "https://schema.org",
        "@type": "Service",
        "name": `${tradeName} in ${cityName}`,
        "serviceType": tradeName,
        "areaServed": { "@type": "City", "name": cityName, "containedInPlace": { "@type": "AdministrativeArea", "name": stateName } },
        ...(cost ? {
            "offers": {
                "@type": "AggregateOffer",
                "lowPrice": cost.low.toString(),
                "highPrice": cost.high.toString(),
                "priceCurrency": "AUD",
            }
        } : {})
    };

    const faqJsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.slice(0, 5).map(faq => ({
            "@type": "Question",
            "name": faq.q,
            "acceptedAnswer": { "@type": "Answer", "text": faq.a }
        }))
    };

    return (
        <main className="min-h-screen bg-[#FCFCFC]">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Breadcrumbs */}
            <div className="bg-[#1A1A1A] pt-32 pb-4">
                <div className="container mx-auto px-4">
                    <nav className="flex items-center gap-2 font-bold text-zinc-400 uppercase tracking-widest" style={{ fontSize: '16px' }}>
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <ChevronRight className="w-4 h-4" />
                        <Link href="/categories" className="hover:text-white transition-colors">Categories</Link>
                        <ChevronRight className="w-4 h-4" />
                        <Link href={`/local/${state}/${city}`} className="hover:text-white transition-colors">{cityName}</Link>
                        <ChevronRight className="w-4 h-4" />
                        <Link href={`/local/${state}/${city}/${tradeSlug}`} className="hover:text-white transition-colors">{tradeName}</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-[#FF6600]">Top 10</span>
                    </nav>
                </div>
            </div>

            {/* Hero */}
            <div className="bg-[#1A1A1A] pb-20 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                </div>
                <div className="container mx-auto px-4 relative z-10 pt-8">
                    <div className="max-w-3xl">
                        <div className="flex items-center gap-2 mb-4">
                            <Trophy className="w-6 h-6 text-[#FF6600]" />
                            <span className="text-[#FF6600] font-black uppercase tracking-widest" style={{ fontSize: '16px' }}>Ranked by Real Reviews</span>
                        </div>
                        <h1 className="font-black mb-6 leading-[1.1] font-display" style={{ fontSize: 'clamp(48px, 8vw, 80px)' }}>
                            Top 10 <span className="text-[#FF6600]">{TRADE_NOUNS[tradeName] || tradeName}</span><br />in {cityName}, {stateName}
                        </h1>
                        <p className="text-zinc-400 mb-4 max-w-2xl" style={{ fontSize: '20px', lineHeight: 1.7 }}>
                            There are currently <strong className="text-white">{businesses.length} highly-rated {tradeName.toLowerCase()} businesses</strong> in {cityName}, {stateName} listed on TradeRefer, with an average Google rating of <strong className="text-white">{avgRating}★</strong> across <strong className="text-white">{totalReviews.toLocaleString()} verified reviews</strong>. The {businesses.length} listed below are ranked from highest to lowest rating, all ABN-verified and community-recommended.
                        </p>
                        {cost && (
                            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 mb-6 font-bold text-white" style={{ fontSize: '16px' }}>
                                <DollarSign className="w-4 h-4 text-[#FF6600]" />
                                Typical cost in {cityName}: ${cost.low}–${cost.high}{cost.unit}
                            </div>
                        )}
                        <div className="flex flex-wrap gap-4">
                            <Link href="#ranked-list" className="bg-[#FF6600] hover:bg-[#E65C00] text-white font-black px-8 rounded-xl transition-colors inline-flex items-center justify-center" style={{ minHeight: '64px', fontSize: '18px' }}>See the Ranked List</Link>
                            <Link href={`/local/${state}/${city}/${tradeSlug}`} className="bg-white/10 hover:bg-white/20 text-white font-black px-8 rounded-xl border border-white/20 transition-colors inline-flex items-center justify-center" style={{ minHeight: '64px', fontSize: '18px' }}>All {tradeName} in {cityName}</Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="bg-white border-b border-zinc-100 py-5">
                <div className="container mx-auto px-4">
                    <div className="flex flex-wrap gap-8 items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600"><Trophy className="w-6 h-6" /></div>
                            <div><p className="font-black text-zinc-900" style={{ fontSize: '16px' }}>Ranked #{year}</p><p className="text-zinc-500" style={{ fontSize: '16px' }}>By Google Rating</p></div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-yellow-600"><Star className="w-6 h-6 fill-yellow-400" /></div>
                            <div><p className="font-black text-zinc-900" style={{ fontSize: '16px' }}>{avgRating}★ Avg Rating</p><p className="text-zinc-500" style={{ fontSize: '16px' }}>{totalReviews.toLocaleString()} Google reviews</p></div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600"><ShieldCheck className="w-6 h-6" /></div>
                            <div><p className="font-black text-zinc-900" style={{ fontSize: '16px' }}>100% Verified</p><p className="text-zinc-500" style={{ fontSize: '16px' }}>ABN &amp; Licence Checked</p></div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600"><Users className="w-6 h-6" /></div>
                            <div><p className="font-black text-zinc-900" style={{ fontSize: '16px' }}>{businesses.length} Businesses</p><p className="text-zinc-500" style={{ fontSize: '16px' }}>In {cityName}</p></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-[#FCFCFC] py-16" id="ranked-list">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto space-y-12">

                        {/* Ranked Business Cards */}
                        <section>
                            <h2 className="font-black text-[#1A1A1A] mb-2 font-display" style={{ fontSize: '40px' }}>
                                Top {businesses.length} {tradeName} in {cityName} — Ranked by Customer Rating
                            </h2>
                            <p className="text-zinc-500 mb-8" style={{ fontSize: '20px', lineHeight: 1.7 }}>
                                Ranked by verified Google rating, highest first. All businesses are ABN-verified and listed on TradeRefer.
                            </p>
                            <div className="space-y-5">
                                {businesses.map((biz: any, index: number) => (
                                    <div key={biz.id} className="bg-white rounded-3xl border border-zinc-200 overflow-hidden hover:shadow-xl hover:border-zinc-300 transition-all duration-300 group relative">
                                        {/* Rank badge */}
                                        <div className={`absolute top-4 left-4 z-10 w-10 h-10 rounded-xl flex items-center justify-center font-black ${index === 0 ? 'bg-[#FF6600] text-white shadow-lg shadow-orange-500/30' : index === 1 ? 'bg-zinc-700 text-white' : index === 2 ? 'bg-amber-600 text-white' : 'bg-zinc-100 text-zinc-600'}`} style={{ fontSize: '16px' }}>
                                            #{index + 1}
                                        </div>
                                        {index === 0 && (
                                            <div className="absolute top-0 right-0 bg-[#FF6600] text-white px-4 py-2 rounded-bl-2xl font-black uppercase tracking-widest z-10 flex items-center gap-1.5" style={{ fontSize: '16px' }}>
                                                <Trophy className="w-4 h-4" /> Top Rated {year}
                                            </div>
                                        )}
                                        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start pl-16">
                                            <BusinessLogo logoUrl={biz.logo_url} name={biz.business_name} photoUrls={biz.photo_urls} size="lg" bgColor={biz.logo_bg_color} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                    <span className="px-3 py-1.5 bg-zinc-100 text-zinc-600 rounded-full font-black uppercase tracking-wider" style={{ fontSize: '16px' }}>{biz.trade_category}</span>
                                                    {biz.is_verified && (
                                                        <span className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 border border-green-100 rounded-full font-black uppercase verified-pulse" style={{ fontSize: '16px' }}>
                                                            <ShieldCheck className="w-3.5 h-3.5" /> Verified
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="text-xl md:text-2xl font-black text-zinc-900 mb-1 group-hover:text-[#FF6600] transition-colors">
                                                    {biz.business_name}
                                                </h3>
                                                <p className="text-zinc-500 mb-4 line-clamp-2" style={{ fontSize: '16px', lineHeight: 1.6 }}>
                                                    {biz.description || `${biz.trade_category} specialist based in ${biz.suburb}, ${cityName}. Serving the local community with expert, ABN-verified trade services.`}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-5 font-bold mb-4" style={{ fontSize: '16px' }}>
                                                    <div className="flex items-center gap-1.5 text-orange-600">
                                                        <Star className="w-4 h-4 fill-orange-400 text-orange-400" />
                                                        <span className="text-zinc-900">{parseFloat(biz.avg_rating).toFixed(1)}</span>
                                                        {biz.total_reviews > 0 && <span className="text-zinc-400 font-normal">({biz.total_reviews} reviews)</span>}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-zinc-500">
                                                        <MapPin className="w-4 h-4 text-zinc-400" />
                                                        {biz.suburb}
                                                    </div>
                                                    {biz.trusted_count > 0 && (
                                                        <div className="flex items-center gap-1.5 text-zinc-500">
                                                            <Users className="w-4 h-4 text-zinc-400" />
                                                            {biz.trusted_count} trusted referrals
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-3">
                                                    <Link href={`/b/${biz.slug}`} className="bg-[#1A1A1A] hover:bg-black text-white font-black px-6 rounded-xl transition-colors inline-flex items-center justify-center" style={{ minHeight: '48px', fontSize: '16px' }}>View Profile</Link>
                                                    <Link href={`/b/${biz.slug}#enquiry-form`} className="border-2 border-zinc-200 hover:bg-zinc-50 font-black px-6 rounded-xl transition-colors inline-flex items-center justify-center" style={{ minHeight: '48px', fontSize: '16px' }}>Get Quote</Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Pricing Section */}
                        {cost && (
                            <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                                <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: '32px' }}>
                                    <DollarSign className="w-6 h-6 text-[#FF6600]" />
                                    How Much Do {tradeName} Cost in {cityName}?
                                </h2>
                                <p className="text-zinc-500 mb-6" style={{ fontSize: '16px' }}>Pricing data based on Australian industry averages for {stateName}. Always get 2–3 written quotes.</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                                        <p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: '16px' }}>Typical Range</p>
                                        <p className="text-2xl font-black text-zinc-900">${cost.low}–${cost.high}</p>
                                        <p className="text-zinc-500" style={{ fontSize: '16px' }}>{cost.unit}</p>
                                    </div>
                                    <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                                        <p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: '16px' }}>After-Hours Rate</p>
                                        <p className="text-2xl font-black text-zinc-900">${Math.round(cost.high * 1.5)}</p>
                                        <p className="text-zinc-500" style={{ fontSize: '16px' }}>Emergency callout</p>
                                    </div>
                                    <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                                        <p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: '16px' }}>Avg Hourly Rate</p>
                                        <p className="text-2xl font-black text-zinc-900">${Math.round((cost.low + cost.high) / 2)}</p>
                                        <p className="text-zinc-500" style={{ fontSize: '16px' }}>{cityName} market average</p>
                                    </div>
                                </div>
                                <p className="text-zinc-400" style={{ fontSize: '16px' }}>Prices are estimates only. Always request a written quote before authorising any work.</p>
                            </section>
                        )}

                        {/* Licensing Info */}
                        {licenceText && (
                            <section className="bg-blue-50 border border-blue-100 rounded-3xl p-6 flex gap-4">
                                <FileText className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-black text-zinc-900 mb-1" style={{ fontSize: '20px' }}>{tradeName} Licensing Requirements in {stateName}</h3>
                                    <p className="text-zinc-600" style={{ fontSize: '16px', lineHeight: 1.6 }}>{licenceText}</p>
                                </div>
                            </section>
                        )}

                        {/* How to Choose */}
                        {howToChoose && (
                            <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                                <h2 className="font-black text-[#1A1A1A] mb-2 font-display" style={{ fontSize: '32px' }}>How to Choose the Best {tradeName} in {cityName}</h2>
                                <p className="text-zinc-500 mb-6" style={{ fontSize: '16px' }}>Use this checklist before hiring any {tradeName.toLowerCase()} in {cityName}, {stateName}.</p>
                                <ol className="space-y-4">
                                    {howToChoose.map((tip, i) => (
                                        <li key={i} className="flex gap-4 items-start">
                                            <div className="w-8 h-8 rounded-xl bg-[#FF6600] text-white flex items-center justify-center font-black shrink-0 mt-0.5" style={{ fontSize: '16px' }}>
                                                {i + 1}
                                            </div>
                                            <p className="text-zinc-700" style={{ fontSize: '16px', lineHeight: 1.6 }}>{tip}</p>
                                        </li>
                                    ))}
                                </ol>
                            </section>
                        )}

                        {/* FAQ Section */}
                        <section>
                            <h2 className="font-black text-[#1A1A1A] mb-6 font-display" style={{ fontSize: '32px' }}>
                                Frequently Asked Questions — {tradeName} in {cityName}
                            </h2>
                            <div className="space-y-4">
                                {faqs.slice(0, 5).map((faq, i) => (
                                    <div key={i} className="bg-white rounded-2xl border border-zinc-200 p-6">
                                        <h3 className="font-black text-zinc-900 mb-2" style={{ fontSize: '18px' }}>{faq.q}</h3>
                                        <p className="text-zinc-600" style={{ fontSize: '16px', lineHeight: 1.6 }}>{faq.a}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Nearby Cities */}
                        {nearbyCities.length > 0 && (
                            <section className="bg-white rounded-3xl border border-zinc-200 p-8">
                                <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: '28px' }}>
                                    <MapPin className="w-5 h-5 text-[#FF6600]" />
                                    Top {tradeName} in Nearby Cities
                                </h2>
                                <p className="text-zinc-500 mb-6" style={{ fontSize: '16px' }}>Find the highest-rated {tradeName.toLowerCase()} in other cities across {stateName}.</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {nearbyCities.map(({ city: nearCity, state: nearState }) => {
                                        const nearCitySlug = nearCity.toLowerCase().replace(/\s+/g, '-');
                                        const nearStateSlug = nearState.toLowerCase();
                                        return (
                                            <Link
                                                key={nearCity}
                                                href={`/top/${tradeSlug}/${nearStateSlug}/${nearCitySlug}`}
                                                className="flex items-center justify-between px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-xl font-bold text-zinc-700 hover:bg-orange-50 hover:border-[#FF6600] hover:text-[#FF6600] transition-colors" style={{ fontSize: '16px' }}
                                            >
                                                <span>Top {tradeName} in {nearCity}</span>
                                                <ArrowRight className="w-4 h-4 shrink-0 text-zinc-300" />
                                            </Link>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {/* CTA */}
                        <section className="bg-[#1A1A1A] rounded-3xl p-8 text-white text-center">
                            <Award className="w-10 h-10 text-[#FF6600] mx-auto mb-4" />
                            <h3 className="font-black mb-2" style={{ fontSize: '32px' }}>Are You a {tradeName} in {cityName}?</h3>
                            <p className="text-zinc-400 mb-6 max-w-md mx-auto" style={{ fontSize: '20px', lineHeight: 1.7 }}>
                                Join {businesses.length}+ verified {tradeName.toLowerCase()} already listed on TradeRefer. Build your trust score and rank higher for free.
                            </p>
                            <Link href="/register?type=business" className="bg-[#FF6600] hover:bg-[#E65C00] text-white font-black px-8 rounded-xl transition-colors inline-flex items-center justify-center" style={{ minHeight: '64px', fontSize: '18px' }}>List Your Business Free</Link>
                        </section>

                    </div>
                </div>
            </div>
        </main>
    );
}
