import { sql } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { MapPin, Star, ShieldCheck, ChevronRight, CheckCircle2, Users, ArrowRight, DollarSign, FileText, Wrench } from "lucide-react";
import Link from "next/link";
import { BusinessLogo } from "@/components/BusinessLogo";
import { DirectoryFooter } from "@/components/DirectoryFooter";
import { Metadata } from "next";
import { TRADE_COST_GUIDE, TRADE_FAQ_BANK, STATE_LICENSING, JOB_TYPES, jobToSlug } from "@/lib/constants";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ state: string; city: string; suburb: string; trade: string; job: string }>;
}

function formatSlug(slug: string) {
    if (!slug) return "";
    return slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { trade, suburb, city, state, job } = await params;
    const tradeName = formatSlug(trade);
    const suburbName = formatSlug(suburb);
    const cityName = formatSlug(city);
    const stateUpper = state.toUpperCase();
    const jobName = formatSlug(job);
    const cost = TRADE_COST_GUIDE[tradeName];
    const priceStr = cost ? ` | Est. $${cost.low}–$${cost.high}${cost.unit}` : "";

    return {
        title: `${jobName} in ${suburbName}, ${cityName} ${stateUpper}${priceStr} | TradeRefer`,
        description: `Find verified ${jobName.toLowerCase()} specialists in ${suburbName}, ${cityName}. ABN-checked local ${tradeName.toLowerCase()} with real community referrals. Get free quotes today.`,
        openGraph: {
            title: `${jobName} in ${suburbName}, ${cityName} | TradeRefer`,
            description: `Local ${jobName.toLowerCase()} specialists in ${suburbName}. Compare verified ${tradeName.toLowerCase()} with pricing and community referrals.`,
        },
    };
}

async function getBusinesses(trade: string, suburb: string) {
    try {
        const tradeName = formatSlug(trade);
        const suburbName = formatSlug(suburb);
        const results = await sql`
            SELECT b.*,
                COUNT(r.id) as referral_count,
                COALESCE(b.trust_score, 0) as trust_score
            FROM businesses b
            LEFT JOIN referrals r ON r.business_id = b.id
            WHERE b.status = 'active'
              AND b.trade_category ILIKE ${'%' + tradeName + '%'}
              AND b.suburb ILIKE ${'%' + suburbName + '%'}
            GROUP BY b.id
            ORDER BY b.trust_score DESC, referral_count DESC
            LIMIT 8
        `;
        return results;
    } catch {
        return [];
    }
}

async function getNearbySuburbs(city: string, currentSuburb: string, trade: string) {
    try {
        const tradeName = formatSlug(trade);
        const cityName = formatSlug(city);
        const results = await sql`
            SELECT DISTINCT suburb FROM businesses
            WHERE status = 'active'
              AND city ILIKE ${'%' + cityName + '%'}
              AND trade_category ILIKE ${'%' + tradeName + '%'}
              AND suburb NOT ILIKE ${'%' + formatSlug(currentSuburb) + '%'}
            ORDER BY suburb ASC
            LIMIT 6
        `;
        return results.map((r: any) => r.suburb).filter(Boolean);
    } catch {
        return [];
    }
}

export default async function JobTypePage({ params }: PageProps) {
    const { trade, suburb, city, state, job } = await params;
    const tradeName = formatSlug(trade);
    const suburbName = formatSlug(suburb);
    const cityName = formatSlug(city);
    const jobName = formatSlug(job);
    const stateName = state.toUpperCase();

    const [businesses, nearbySuburbs] = await Promise.all([
        getBusinesses(trade, suburb),
        getNearbySuburbs(city, suburb, trade),
    ]);

    const avgRating = businesses.length > 0
        ? (businesses.reduce((acc: number, biz: any) => acc + ((biz.trust_score || 0) / 20), 0) / businesses.length).toFixed(1)
        : "4.8";

    const cost = TRADE_COST_GUIDE[tradeName];
    const faqs = TRADE_FAQ_BANK[tradeName] || TRADE_FAQ_BANK["Plumbing"];
    const licenceText = STATE_LICENSING[tradeName]?.[stateName] || null;
    const relatedJobs = (JOB_TYPES[tradeName] || [])
        .filter(j => jobToSlug(j) !== job)
        .slice(0, 6);

    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://traderefer.au" },
            { "@type": "ListItem", "position": 2, "name": "Directory", "item": "https://traderefer.au/local" },
            { "@type": "ListItem", "position": 3, "name": stateName, "item": `https://traderefer.au/local/${state}` },
            { "@type": "ListItem", "position": 4, "name": cityName, "item": `https://traderefer.au/local/${state}/${city}` },
            { "@type": "ListItem", "position": 5, "name": suburbName, "item": `https://traderefer.au/local/${state}/${city}/${suburb}` },
            { "@type": "ListItem", "position": 6, "name": tradeName, "item": `https://traderefer.au/local/${state}/${city}/${suburb}/${trade}` },
            { "@type": "ListItem", "position": 7, "name": `${jobName} in ${suburbName}` },
        ]
    };

    const serviceJsonLd = {
        "@context": "https://schema.org",
        "@type": "Service",
        "name": `${jobName} in ${suburbName}`,
        "serviceType": jobName,
        "provider": { "@type": "Organization", "name": "TradeRefer", "url": "https://traderefer.au" },
        "areaServed": {
            "@type": "City",
            "name": suburbName,
            "containedInPlace": { "@type": "AdministrativeArea", "name": stateName }
        },
        ...(businesses.length > 0 ? {
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": avgRating,
                "reviewCount": businesses.length.toString(),
                "bestRating": "5",
                "worstRating": "1"
            }
        } : {}),
        ...(cost ? {
            "offers": {
                "@type": "AggregateOffer",
                "lowPrice": cost.low.toString(),
                "highPrice": cost.high.toString(),
                "priceCurrency": "AUD"
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
            {/* Schema */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Hero */}
            <div className="bg-zinc-900 pt-32 pb-20 relative overflow-hidden text-white">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                </div>
                <div className="container mx-auto px-4 relative z-10">
                    {/* Breadcrumb */}
                    <nav className="flex flex-wrap items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest mb-8">
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href={`/local/${state}`} className="hover:text-white transition-colors">{stateName}</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href={`/local/${state}/${city}`} className="hover:text-white transition-colors">{cityName}</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href={`/local/${state}/${city}/${suburb}`} className="hover:text-white transition-colors">{suburbName}</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href={`/local/${state}/${city}/${suburb}/${trade}`} className="hover:text-white transition-colors">{tradeName}</Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-orange-400">{jobName}</span>
                    </nav>

                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-1.5 text-xs font-black text-orange-400 uppercase tracking-widest mb-6">
                            <Wrench className="w-3 h-3" />
                            {tradeName} Specialist Service
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
                            <span className="text-orange-500">{jobName}</span> in {suburbName}, {cityName}
                        </h1>
                        <p className="text-xl text-zinc-400 mb-6 leading-relaxed">
                            Find verified {jobName.toLowerCase()} specialists in {suburbName}. All businesses listed on TradeRefer are ABN-verified and ranked by real community referrals from your neighbours — not paid placement.
                            {cost && ` Typical ${tradeName.toLowerCase()} rates in ${stateName} range from $${cost.low}–$${cost.high}${cost.unit}.`}
                        </p>
                        {cost && (
                            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-xl px-4 py-2 mb-6 text-sm font-bold text-white">
                                <DollarSign className="w-4 h-4 text-orange-400" />
                                Est. cost: ${cost.low}–${cost.high}{cost.unit}
                            </div>
                        )}
                        <div className="flex flex-wrap gap-4">
                            <Button asChild size="lg" className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold h-14 px-8 text-lg border-none">
                                <Link href="#businesses">See {businesses.length > 0 ? businesses.length : ''} Local Specialists</Link>
                            </Button>
                            <Button asChild variant="outline" size="lg" className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl font-bold h-14 px-8 text-lg">
                                <Link href="/register?type=business">List Your Business Free</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-16">
                <div className="max-w-5xl mx-auto space-y-16">

                    {/* Business Listings */}
                    <section id="businesses">
                        <h2 className="text-2xl font-black text-zinc-900 mb-6">
                            {businesses.length > 0
                                ? `${businesses.length} Verified ${jobName} Specialists in ${suburbName}`
                                : `${jobName} Specialists Serving ${suburbName}`}
                        </h2>

                        {businesses.length > 0 ? (
                            <div className="space-y-4">
                                {businesses.map((biz: any, i: number) => {
                                    const rating = ((biz.trust_score || 0) / 20).toFixed(1);
                                    return (
                                        <Link key={biz.id} href={`/b/${biz.slug}`} className="group block">
                                            <div className="bg-white rounded-2xl border border-zinc-200 hover:border-orange-500 hover:shadow-lg transition-all duration-300 p-6">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-14 h-14 shrink-0">
                                                        <BusinessLogo logoUrl={biz.logo_url || null} name={biz.business_name || "?"} size="sm" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div>
                                                                <h3 className="font-black text-zinc-900 group-hover:text-orange-600 transition-colors text-lg leading-tight">
                                                                    {biz.business_name}
                                                                </h3>
                                                                <p className="text-sm text-zinc-500 mt-0.5 flex items-center gap-1.5">
                                                                    <MapPin className="w-3 h-3" />
                                                                    {biz.suburb}, {biz.city}
                                                                </p>
                                                            </div>
                                                            {i === 0 && (
                                                                <span className="shrink-0 bg-orange-100 text-orange-700 text-xs font-black px-2.5 py-1 rounded-full">
                                                                    #1 Ranked
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-zinc-500 font-medium">
                                                            {parseFloat(rating) > 0 && (
                                                                <span className="flex items-center gap-1">
                                                                    <Star className="w-3 h-3 fill-orange-400 text-orange-400" />
                                                                    {rating}
                                                                </span>
                                                            )}
                                                            {biz.referral_count > 0 && (
                                                                <span className="flex items-center gap-1">
                                                                    <Users className="w-3 h-3 text-blue-400" />
                                                                    {biz.referral_count} referral{biz.referral_count !== 1 ? 's' : ''}
                                                                </span>
                                                            )}
                                                            <span className="flex items-center gap-1">
                                                                <ShieldCheck className="w-3 h-3 text-green-400" />
                                                                ABN Verified
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <ArrowRight className="w-5 h-5 text-zinc-300 group-hover:text-orange-500 shrink-0 mt-1 transition-colors" />
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-zinc-50 rounded-3xl border border-dashed border-zinc-200 p-12 text-center">
                                <Wrench className="w-10 h-10 text-zinc-300 mx-auto mb-4" />
                                <h3 className="text-lg font-black text-zinc-600 mb-2">No listings yet in {suburbName}</h3>
                                <p className="text-zinc-400 text-sm mb-6">Be the first {jobName.toLowerCase()} specialist to list your business and connect with local customers.</p>
                                <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold border-none">
                                    <Link href="/register?type=business">List Your Business Free</Link>
                                </Button>
                            </div>
                        )}
                    </section>

                    {/* Pricing */}
                    {cost && (
                        <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                            <h2 className="text-2xl font-black text-zinc-900 mb-2 flex items-center gap-2">
                                <DollarSign className="w-6 h-6 text-orange-500" />
                                How Much Does {jobName} Cost in {suburbName}?
                            </h2>
                            <p className="text-zinc-500 mb-6 text-sm">
                                The following cost estimates are based on industry averages for {tradeName.toLowerCase()} work in {stateName}. Actual prices will vary based on the scope of work, materials required, and access. Always get 2–3 written quotes before proceeding.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                                    <p className="text-xs font-black text-zinc-400 uppercase tracking-wider mb-1">Typical Range</p>
                                    <p className="text-2xl font-black text-zinc-900">${cost.low}–${cost.high}</p>
                                    <p className="text-sm text-zinc-500">{cost.unit}</p>
                                </div>
                                <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                                    <p className="text-xs font-black text-zinc-400 uppercase tracking-wider mb-1">Emergency Rate</p>
                                    <p className="text-2xl font-black text-zinc-900">${Math.round(cost.high * 1.5)}</p>
                                    <p className="text-sm text-zinc-500">After-hours / urgent</p>
                                </div>
                                <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                                    <p className="text-xs font-black text-zinc-400 uppercase tracking-wider mb-1">Free Quotes</p>
                                    <p className="text-2xl font-black text-zinc-900">2–3</p>
                                    <p className="text-sm text-zinc-500">Always get multiple</p>
                                </div>
                            </div>
                            <p className="text-xs text-zinc-400">Price estimates only. Not a guarantee of cost. Verify with your chosen tradie before work begins.</p>
                        </section>
                    )}

                    {/* Licensing */}
                    {licenceText && (
                        <section className="bg-blue-50 border border-blue-100 rounded-3xl p-6 flex gap-4">
                            <FileText className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-black text-zinc-900 mb-1">{tradeName} Licensing Requirements in {stateName}</h3>
                                <p className="text-sm text-zinc-600 leading-relaxed">{licenceText}</p>
                            </div>
                        </section>
                    )}

                    {/* Related Jobs */}
                    {relatedJobs.length > 0 && (
                        <section className="bg-white rounded-3xl border border-zinc-200 p-8">
                            <h2 className="text-xl font-black text-zinc-900 mb-2">Other {tradeName} Services in {suburbName}</h2>
                            <p className="text-sm text-zinc-500 mb-6">Also looking for related {tradeName.toLowerCase()} work in {suburbName}?</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {relatedJobs.map((j) => (
                                    <Link
                                        key={j}
                                        href={`/local/${state}/${city}/${suburb}/${trade}/${jobToSlug(j)}`}
                                        className="flex items-center justify-between px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl text-sm font-bold text-zinc-600 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700 transition-colors"
                                    >
                                        <span className="capitalize">{j}</span>
                                        <ArrowRight className="w-4 h-4 text-zinc-300" />
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* FAQ */}
                    <section>
                        <h2 className="text-2xl font-black text-zinc-900 mb-8">
                            Frequently Asked Questions About {jobName} in {suburbName}
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

                    {/* Nearby Suburbs */}
                    {nearbySuburbs.length > 0 && (
                        <section className="bg-white rounded-3xl border border-zinc-200 p-8">
                            <h2 className="text-xl font-black text-zinc-900 mb-6 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-orange-500" />
                                {jobName} in Nearby Suburbs
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {nearbySuburbs.map((s: string) => (
                                    <Link
                                        key={s}
                                        href={`/local/${state}/${city}/${s.toLowerCase().replace(/\s+/g, '-')}/${trade}/${job}`}
                                        className="flex items-center justify-between px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl text-sm font-bold text-zinc-600 hover:bg-zinc-100 hover:text-orange-600 transition-colors"
                                    >
                                        <span>{s}</span>
                                        <ArrowRight className="w-3 h-3 text-zinc-300" />
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Back to Trade */}
                    <div className="pt-4 flex flex-wrap gap-3">
                        <Link
                            href={`/local/${state}/${city}/${suburb}/${trade}`}
                            className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-orange-600 transition-colors"
                        >
                            <ChevronRight className="w-4 h-4 rotate-180" />
                            All {tradeName} in {suburbName}
                        </Link>
                        <span className="text-zinc-300">·</span>
                        <Link
                            href={`/local/${state}/${city}/${suburb}`}
                            className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-orange-600 transition-colors"
                        >
                            All Trades in {suburbName}
                        </Link>
                    </div>
                </div>
            </div>

            <DirectoryFooter />
        </main>
    );
}
