import { sql } from "@/lib/db";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DirectoryFooter } from "@/components/DirectoryFooter";
import { BusinessLogo } from "@/components/BusinessLogo";
import { Button } from "@/components/ui/button";
import { TRADE_COST_GUIDE, TRADE_FAQ_BANK, STATE_LICENSING, HOW_TO_CHOOSE } from "@/lib/constants";
import {
    Star, ShieldCheck, MapPin, ChevronRight, Users, Award,
    DollarSign, FileText, ArrowRight, Trophy
} from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ trade: string; state: string; city: string; suburb: string }>;
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

async function getTopBusinesses(trade: string, state: string, suburb: string) {
    try {
        const tradeName = formatSlug(trade);
        const suburbName = formatSlug(suburb);
        const stateUpper = state.toUpperCase();
        const results = await sql`
            SELECT b.*,
                   (SELECT COUNT(*) FROM referral_links rl WHERE rl.business_id = b.id) as trusted_count
            FROM businesses b
            WHERE b.status = 'active'
              AND (b.listing_visibility = 'public' OR b.listing_visibility IS NULL)
              AND b.trade_category ILIKE ${'%' + tradeName + '%'}
              AND b.suburb ILIKE ${'%' + suburbName + '%'}
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

async function getNearbySuburbsWithTrade(trade: string, state: string, city: string, currentSuburb: string) {
    try {
        const tradeName = formatSlug(trade);
        const stateUpper = state.toUpperCase();
        const cityName = formatSlug(city);
        const suburbName = formatSlug(currentSuburb);
        const results = await sql`
            SELECT DISTINCT suburb, state, city, COUNT(*) as cnt
            FROM businesses
            WHERE status = 'active'
              AND trade_category ILIKE ${'%' + tradeName + '%'}
              AND city ILIKE ${'%' + cityName + '%'}
              AND state = ${stateUpper}
              AND suburb NOT ILIKE ${'%' + suburbName + '%'}
              AND suburb IS NOT NULL AND suburb != ''
            GROUP BY suburb, state, city
            HAVING COUNT(*) >= 3
            ORDER BY cnt DESC
            LIMIT 8
        `;
        return results.map((r: any) => ({
            suburb: r.suburb as string,
            city: r.city as string,
            state: r.state as string,
        }));
    } catch {
        return [];
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { trade, state, city, suburb } = await params;
    const tradeName = formatSlug(trade);
    const cityName = formatSlug(city);
    const suburbName = formatSlug(suburb);
    const stateName = STATE_NAMES[state] || state.toUpperCase();
    const cost = TRADE_COST_GUIDE[tradeName];
    const priceStr = cost ? ` | $${cost.low}–$${cost.high}${cost.unit}` : "";
    const year = new Date().getFullYear();

    const businesses = await getTopBusinesses(trade, state, suburb);
    const totalReviews = businesses.reduce((acc: number, biz: any) => acc + (parseInt(biz.total_reviews) || 0), 0);
    const topBiz = businesses[0] as any;
    const topBizStr = topBiz ? ` #1: ${topBiz.business_name} (${parseFloat(topBiz.avg_rating).toFixed(1)}★).` : "";

    return {
        title: `Top 10 ${tradeName} in ${suburbName}, ${cityName} (${year})${priceStr} | TradeRefer`,
        description: `The ${businesses.length} highest-rated ${tradeName.toLowerCase()} in ${suburbName}, ${cityName} ${stateName} ranked by ${totalReviews.toLocaleString()} verified reviews.${topBizStr} Get free quotes today.`,
        openGraph: {
            title: `Top 10 ${tradeName} in ${suburbName}, ${cityName} ${year} | TradeRefer`,
            description: `Ranked by verified Google reviews. Best ${tradeName.toLowerCase()} in ${suburbName}.`,
        },
    };
}

export default async function Top10SuburbPage({ params }: PageProps) {
    const { trade, state, city, suburb } = await params;
    const tradeName = formatSlug(trade);
    const cityName = formatSlug(city);
    const suburbName = formatSlug(suburb);
    const stateName = STATE_NAMES[state] || state.toUpperCase();
    const stateUpper = state.toUpperCase();
    const year = new Date().getFullYear();
    const tradeSlug = tradeToSlug(tradeName);
    const citySlug = city.toLowerCase().replace(/\s+/g, '-');

    const [businesses, nearbySuburbs] = await Promise.all([
        getTopBusinesses(trade, state, suburb),
        getNearbySuburbsWithTrade(trade, state, city, suburb),
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

    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://traderefer.au" },
            { "@type": "ListItem", "position": 2, "name": "Categories", "item": "https://traderefer.au/categories" },
            { "@type": "ListItem", "position": 3, "name": cityName, "item": `https://traderefer.au/local/${state}/${citySlug}` },
            { "@type": "ListItem", "position": 4, "name": suburbName, "item": `https://traderefer.au/local/${state}/${citySlug}/${suburb}` },
            { "@type": "ListItem", "position": 5, "name": `Top 10 ${tradeName} in ${suburbName}` },
        ]
    };

    const itemListJsonLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": `Top 10 ${tradeName} in ${suburbName}, ${cityName} (${year})`,
        "description": `The highest-rated ${tradeName.toLowerCase()} in ${suburbName} ranked by verified Google reviews.`,
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
        "name": `${tradeName} in ${suburbName}`,
        "serviceType": tradeName,
        "areaServed": {
            "@type": "Place",
            "name": suburbName,
            "containedInPlace": { "@type": "City", "name": cityName }
        },
        ...(businesses.length > 0 ? {
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": avgRating,
                "reviewCount": totalReviews.toString(),
                "bestRating": "5",
                "worstRating": "1"
            }
        } : {}),
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
        <main className="min-h-screen bg-white">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Breadcrumbs */}
            <div className="bg-zinc-900 pt-32 pb-4">
                <div className="container mx-auto px-4">
                    <nav className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest flex-wrap">
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href={`/local/${state}/${citySlug}/${suburb}`} className="hover:text-white transition-colors">{suburbName}</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href={`/local/${state}/${citySlug}/${suburb}/${tradeSlug}`} className="hover:text-white transition-colors">{tradeName}</Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-orange-400">Top 10</span>
                    </nav>
                </div>
            </div>

            {/* Hero */}
            <div className="bg-zinc-900 pb-20 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                </div>
                <div className="container mx-auto px-4 relative z-10 pt-8">
                    <div className="max-w-3xl">
                        <div className="flex items-center gap-2 mb-4">
                            <Trophy className="w-5 h-5 text-orange-500" />
                            <span className="text-orange-500 font-black text-sm uppercase tracking-widest">Ranked by Google Reviews</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
                            Top 10 <span className="text-orange-500">{tradeName}</span><br />in {suburbName}, {cityName}
                        </h1>
                        <p className="text-lg text-zinc-400 mb-4 leading-relaxed max-w-2xl">
                            TradeRefer lists <strong className="text-white">{businesses.length} verified {tradeName.toLowerCase()} businesses</strong> in {suburbName} with an average Google rating of <strong className="text-white">{avgRating}★</strong> across <strong className="text-white">{totalReviews.toLocaleString()} reviews</strong>. The businesses below are ranked from highest to lowest rating — all ABN-verified and community-recommended.
                        </p>
                        {cost && (
                            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-xl px-4 py-2 mb-6 text-sm font-bold text-white">
                                <DollarSign className="w-4 h-4 text-orange-400" />
                                Typical cost in {suburbName}: ${cost.low}–${cost.high}{cost.unit}
                            </div>
                        )}
                        <div className="flex flex-wrap gap-4">
                            <Button asChild size="lg" className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold h-14 px-8 text-lg border-none">
                                <Link href="#ranked-list">See the Ranked List</Link>
                            </Button>
                            <Button asChild variant="outline" size="lg" className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl font-bold h-14 px-8 text-lg">
                                <Link href={`/top/${tradeSlug}/${state}/${citySlug}`}>Top 10 in {cityName}</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="bg-white border-b border-zinc-100 py-5">
                <div className="container mx-auto px-4">
                    <div className="flex flex-wrap gap-8 items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600"><Trophy className="w-5 h-5" /></div>
                            <div><p className="text-sm font-black text-zinc-900">Ranked #{year}</p><p className="text-xs text-zinc-500">By Google Rating</p></div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center text-yellow-600"><Star className="w-5 h-5 fill-yellow-400" /></div>
                            <div><p className="text-sm font-black text-zinc-900">{avgRating}★ Avg Rating</p><p className="text-xs text-zinc-500">{totalReviews.toLocaleString()} reviews</p></div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600"><ShieldCheck className="w-5 h-5" /></div>
                            <div><p className="text-sm font-black text-zinc-900">100% Verified</p><p className="text-xs text-zinc-500">ABN-checked</p></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-zinc-50 py-16" id="ranked-list">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto space-y-12">

                        {/* Ranked Business Cards */}
                        <section>
                            <h2 className="text-2xl font-black text-zinc-900 mb-2">
                                Top {businesses.length} {tradeName} in {suburbName} — Ranked by Rating
                            </h2>
                            <p className="text-zinc-500 text-sm mb-8">
                                Sorted by verified Google rating, highest first. All ABN-verified.
                            </p>
                            <div className="space-y-5">
                                {businesses.map((biz: any, index: number) => (
                                    <div key={biz.id} className="bg-white rounded-3xl border border-zinc-200 overflow-hidden hover:shadow-xl hover:border-zinc-300 transition-all duration-300 group relative">
                                        <div className={`absolute top-4 left-4 z-10 w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${index === 0 ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : index === 1 ? 'bg-zinc-700 text-white' : index === 2 ? 'bg-amber-600 text-white' : 'bg-zinc-100 text-zinc-600'}`}>
                                            #{index + 1}
                                        </div>
                                        {index === 0 && (
                                            <div className="absolute top-0 right-0 bg-orange-500 text-white px-4 py-1.5 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest z-10 flex items-center gap-1.5">
                                                <Trophy className="w-3 h-3" /> Top Rated {year}
                                            </div>
                                        )}
                                        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start pl-16">
                                            <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-2xl flex items-center justify-center overflow-hidden border border-zinc-100 shadow-lg shrink-0">
                                                <BusinessLogo logoUrl={biz.logo_url} name={biz.business_name} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                    <span className="px-2.5 py-1 bg-zinc-100 text-zinc-600 rounded-full text-[10px] font-black uppercase tracking-wider">{biz.trade_category}</span>
                                                    {biz.is_verified && (
                                                        <span className="flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 border border-green-100 rounded-full text-[10px] font-black uppercase">
                                                            <ShieldCheck className="w-3 h-3" /> Verified
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="text-xl md:text-2xl font-black text-zinc-900 mb-1 group-hover:text-orange-600 transition-colors">
                                                    {biz.business_name}
                                                </h3>
                                                <p className="text-zinc-500 text-sm mb-4 line-clamp-2 leading-relaxed">
                                                    {biz.description || `${biz.trade_category} specialist based in ${biz.suburb}, serving ${suburbName} and surrounding ${cityName} suburbs.`}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-5 text-sm font-bold mb-4">
                                                    <div className="flex items-center gap-1.5 text-orange-600">
                                                        <Star className="w-4 h-4 fill-orange-400 text-orange-400" />
                                                        <span className="text-zinc-900">{parseFloat(biz.avg_rating).toFixed(1)}</span>
                                                        {biz.total_reviews > 0 && <span className="text-zinc-400 font-normal text-xs">({biz.total_reviews} reviews)</span>}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-zinc-500">
                                                        <MapPin className="w-4 h-4 text-zinc-400" />
                                                        {biz.suburb}
                                                    </div>
                                                    {biz.trusted_count > 0 && (
                                                        <div className="flex items-center gap-1.5 text-zinc-500">
                                                            <Users className="w-4 h-4 text-zinc-400" />
                                                            {biz.trusted_count} referrals
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-3">
                                                    <Button asChild size="sm" className="bg-zinc-900 hover:bg-black text-white rounded-xl font-bold px-5 border-none">
                                                        <Link href={`/b/${biz.slug}`}>View Profile</Link>
                                                    </Button>
                                                    <Button asChild variant="outline" size="sm" className="border-zinc-200 hover:bg-zinc-50 rounded-xl font-bold px-5">
                                                        <Link href={`/b/${biz.slug}#enquiry-form`}>Get Quote</Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Pricing */}
                        {cost && (
                            <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                                <h2 className="text-2xl font-black text-zinc-900 mb-2 flex items-center gap-2">
                                    <DollarSign className="w-6 h-6 text-orange-500" />
                                    How Much Do {tradeName} Cost in {suburbName}?
                                </h2>
                                <p className="text-zinc-500 text-sm mb-6">Based on {stateName} industry rates. Always get 2–3 written quotes.</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                                        <p className="text-xs font-black text-zinc-400 uppercase tracking-wider mb-1">Typical Range</p>
                                        <p className="text-2xl font-black text-zinc-900">${cost.low}–${cost.high}</p>
                                        <p className="text-sm text-zinc-500">{cost.unit}</p>
                                    </div>
                                    <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                                        <p className="text-xs font-black text-zinc-400 uppercase tracking-wider mb-1">After-Hours</p>
                                        <p className="text-2xl font-black text-zinc-900">${Math.round(cost.high * 1.5)}</p>
                                        <p className="text-sm text-zinc-500">Emergency callout</p>
                                    </div>
                                    <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                                        <p className="text-xs font-black text-zinc-400 uppercase tracking-wider mb-1">Avg Hourly</p>
                                        <p className="text-2xl font-black text-zinc-900">${Math.round((cost.low + cost.high) / 2)}</p>
                                        <p className="text-sm text-zinc-500">{suburbName} market</p>
                                    </div>
                                </div>
                                <p className="text-xs text-zinc-400">Estimates only. Always request a written quote before authorising work.</p>
                            </section>
                        )}

                        {/* Licensing */}
                        {licenceText && (
                            <section className="bg-blue-50 border border-blue-100 rounded-3xl p-6 flex gap-4">
                                <FileText className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-black text-zinc-900 mb-1">{tradeName} Licensing in {stateName}</h3>
                                    <p className="text-sm text-zinc-600 leading-relaxed">{licenceText}</p>
                                </div>
                            </section>
                        )}

                        {/* How to Choose */}
                        {howToChoose && (
                            <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                                <h2 className="text-2xl font-black text-zinc-900 mb-2">How to Choose the Best {tradeName} in {suburbName}</h2>
                                <p className="text-zinc-500 text-sm mb-6">A checklist before hiring any {tradeName.toLowerCase()} in {suburbName}, {cityName}.</p>
                                <ol className="space-y-4">
                                    {howToChoose.map((tip, i) => (
                                        <li key={i} className="flex gap-4 items-start">
                                            <div className="w-7 h-7 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black text-sm shrink-0 mt-0.5">
                                                {i + 1}
                                            </div>
                                            <p className="text-sm text-zinc-700 leading-relaxed">{tip}</p>
                                        </li>
                                    ))}
                                </ol>
                            </section>
                        )}

                        {/* FAQ */}
                        <section>
                            <h2 className="text-2xl font-black text-zinc-900 mb-6">
                                FAQs — {tradeName} in {suburbName}, {cityName}
                            </h2>
                            <div className="space-y-4">
                                {faqs.slice(0, 5).map((faq, i) => (
                                    <div key={i} className="bg-white rounded-2xl border border-zinc-200 p-6">
                                        <h3 className="font-bold text-zinc-900 mb-2">{faq.q}</h3>
                                        <p className="text-sm text-zinc-500 leading-relaxed">{faq.a}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Nearby suburbs */}
                        {nearbySuburbs.length > 0 && (
                            <section className="bg-white rounded-3xl border border-zinc-200 p-8">
                                <h2 className="text-xl font-black text-zinc-900 mb-2 flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-orange-500" />
                                    Top {tradeName} in Nearby Suburbs
                                </h2>
                                <p className="text-zinc-500 text-sm mb-6">Find ranked {tradeName.toLowerCase()} in suburbs close to {suburbName}.</p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {nearbySuburbs.map(({ suburb: nearSub, city: nearCity, state: nearState }) => {
                                        const nearSubSlug = nearSub.toLowerCase().replace(/\s+/g, '-');
                                        const nearCitySlug = nearCity.toLowerCase().replace(/\s+/g, '-');
                                        const nearStateSlug = nearState.toLowerCase();
                                        return (
                                            <Link
                                                key={nearSub}
                                                href={`/top/${tradeSlug}/${nearStateSlug}/${nearCitySlug}/${nearSubSlug}`}
                                                className="flex items-center justify-between px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl text-xs font-bold text-zinc-600 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700 transition-colors"
                                            >
                                                <span>{nearSub}</span>
                                                <ArrowRight className="w-3 h-3 shrink-0 text-zinc-300" />
                                            </Link>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {/* CTA */}
                        <section className="bg-zinc-900 rounded-3xl p-8 text-white text-center">
                            <Award className="w-10 h-10 text-orange-500 mx-auto mb-4" />
                            <h3 className="text-2xl font-black mb-2">Are You a {tradeName} in {suburbName}?</h3>
                            <p className="text-zinc-400 text-sm mb-6 max-w-md mx-auto">
                                Get listed on TradeRefer and rank in the top {tradeName.toLowerCase()} for {suburbName}. Free to join.
                            </p>
                            <Button asChild size="lg" className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold px-8 h-12 border-none">
                                <Link href="/register?type=business">List Your Business Free</Link>
                            </Button>
                        </section>
                    </div>
                </div>
            </div>

            <DirectoryFooter />
        </main>
    );
}
