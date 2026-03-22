import { ChevronRight, DollarSign, MapPin, FileText, Wrench, ArrowRight, Users, Star } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { JOB_TYPES, TRADE_COST_GUIDE, TRADE_FAQ_BANK, STATE_LICENSING, jobToSlug } from "@/lib/constants";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ job: string }>;
}

function formatSlug(slug: string) {
    if (!slug) return "";
    return slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function findTradeForJob(jobSlug: string): string | null {
    for (const [trade, jobs] of Object.entries(JOB_TYPES)) {
        if (jobs.some(j => jobToSlug(j) === jobSlug)) return trade;
    }
    return null;
}

function findJobNameForSlug(jobSlug: string): string | null {
    for (const jobs of Object.values(JOB_TYPES)) {
        const match = jobs.find(j => jobToSlug(j) === jobSlug);
        if (match) return match;
    }
    return null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { job } = await params;
    const jobName = findJobNameForSlug(job) || formatSlug(job);
    const tradeName = findTradeForJob(job);
    const cost = tradeName ? TRADE_COST_GUIDE[tradeName] : null;
    const year = new Date().getFullYear();
    const priceStr = cost ? ` | $${cost.low}–$${cost.high}${cost.unit}` : "";

    return {
        title: `${jobName} Cost Guide Australia ${year}${priceStr} | TradeRefer`,
        description: `How much does ${jobName.toLowerCase()} cost in Australia? Compare prices by state, understand licensing requirements, and find verified local specialists across Australia.`,
        alternates: { canonical: `https://traderefer.au/trades/${job}` },
        openGraph: {
            title: `${jobName} Cost Guide Australia ${year} | TradeRefer`,
            description: `National pricing guide for ${jobName.toLowerCase()} in Australia. State-by-state costs, licensing requirements, and how to find the right tradie.`,
        },
    };
}

async function getBusinessCountByState(tradeName: string): Promise<Record<string, number>> {
    try {
        const results = await sql`
            SELECT state, COUNT(*) as count
            FROM businesses
            WHERE status = 'active'
              AND trade_category ILIKE ${'%' + tradeName + '%'}
              AND state IS NOT NULL
            GROUP BY state
            ORDER BY count DESC
        `;
        const map: Record<string, number> = {};
        results.forEach((r: any) => { map[r.state] = parseInt(r.count, 10); });
        return map;
    } catch {
        return {};
    }
}

async function getTopCitiesForTrade(tradeName: string): Promise<Array<{ city: string; state: string; count: number }>> {
    try {
        const results = await sql`
            SELECT city, state, COUNT(*) as count
            FROM businesses
            WHERE status = 'active'
              AND trade_category ILIKE ${'%' + tradeName + '%'}
              AND city IS NOT NULL AND city != ''
            GROUP BY city, state
            ORDER BY count DESC
            LIMIT 8
        `;
        return results.map((r: any) => ({
            city: r.city,
            state: r.state,
            count: parseInt(r.count, 10),
        }));
    } catch {
        return [];
    }
}

const STATE_NAMES: Record<string, string> = {
    VIC: "Victoria", NSW: "New South Wales", QLD: "Queensland",
    WA: "Western Australia", SA: "South Australia", TAS: "Tasmania",
    ACT: "Australian Capital Territory", NT: "Northern Territory",
};

const STATE_SLUGS: Record<string, string> = {
    VIC: "vic", NSW: "nsw", QLD: "qld", WA: "wa",
    SA: "sa", TAS: "tas", ACT: "act", NT: "nt",
};

export default async function TradeHubPage({ params }: PageProps) {
    const { job } = await params;
    const jobName = findJobNameForSlug(job) || formatSlug(job);
    const tradeName = findTradeForJob(job);

    // Unknown job types: show generic page rather than 404

    const year = new Date().getFullYear();
    const tradeKey = tradeName ?? jobName;
    const cost = TRADE_COST_GUIDE[tradeKey] ?? null;
    const faqs = TRADE_FAQ_BANK[tradeKey] || [];
    const relatedJobs = tradeName ? (JOB_TYPES[tradeName] || []).filter(j => jobToSlug(j) !== job).slice(0, 8) : [];

    const [countsByState, topCities] = await Promise.all([
        getBusinessCountByState(tradeName ?? jobName),
        getTopCitiesForTrade(tradeName ?? jobName),
    ]);

    const totalBusinesses = Object.values(countsByState).reduce((a, b) => a + b, 0);

    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://traderefer.au" },
            { "@type": "ListItem", "position": 2, "name": "Trade Guides", "item": "https://traderefer.au/trades" },
            { "@type": "ListItem", "position": 3, "name": `${jobName} Cost Guide Australia` },
        ]
    };

    const serviceJsonLd = {
        "@context": "https://schema.org",
        "@type": "Service",
        "name": jobName,
        "serviceType": jobName,
        "areaServed": {
            "@type": "Country",
            "name": "Australia"
        },
        ...(cost ? {
            "offers": {
                "@type": "AggregateOffer",
                "lowPrice": cost.low.toString(),
                "highPrice": cost.high.toString(),
                "priceCurrency": "AUD",
                "priceSpecification": {
                    "@type": "UnitPriceSpecification",
                    "price": `${cost.low}–${cost.high}`,
                    "priceCurrency": "AUD",
                    "unitText": cost.unit
                }
            }
        } : {})
    };

    const faqEntries = faqs.slice(0, 6);
    const faqJsonLd = faqEntries.length > 0 ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqEntries.map(faq => ({
            "@type": "Question",
            "name": faq.q,
            "acceptedAnswer": { "@type": "Answer", "text": faq.a }
        }))
    } : null;

    return (
        <main className="min-h-screen bg-white">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
            {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}

            {/* Hero */}
            <div className="bg-[#1A1A1A] pt-32 pb-20 text-white">
                <div className="container mx-auto px-4">
                    <nav className="flex flex-wrap items-center gap-2 font-bold text-zinc-400 uppercase tracking-widest mb-8" style={{ fontSize: '16px' }}>
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <ChevronRight className="w-4 h-4" />
                        <Link href="/local" className="hover:text-white transition-colors">Directory</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-[#FF6600]">{jobName} Cost Guide</span>
                    </nav>

                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-2 font-black text-orange-400 uppercase tracking-widest mb-6" style={{ fontSize: '16px' }}>
                            <Wrench className="w-4 h-4" />
                            Australia-Wide Cost Guide · {year}
                        </div>
                        <h1 className="font-black mb-6 leading-[1.1] font-display text-white" style={{ fontSize: 'clamp(48px, 8vw, 80px)' }}>
                            How Much Does <span className="text-[#FF6600]">{jobName}</span> Cost in Australia?
                        </h1>
                        <p className="text-zinc-400 mb-6" style={{ fontSize: '20px', lineHeight: 1.7 }}>
                            {jobName} costs vary significantly across Australia depending on your state, the complexity of the work, and local market conditions.
                            {cost && ` Typical ${tradeName!.toLowerCase()} rates range from $${cost.low}–$${cost.high}${cost.unit} nationally.`}
                            {" "}Use this guide to understand what to expect, how to compare quotes, and find verified local specialists near you.
                        </p>
                        {totalBusinesses > 0 && (
                            <div className="flex flex-wrap gap-6 text-white font-bold" style={{ fontSize: '16px' }}>
                                <span className="flex items-center gap-1.5">
                                    <Users className="w-4 h-4 text-[#FF6600]" />
                                    {totalBusinesses.toLocaleString()} verified {tradeName!.toLowerCase()} across Australia
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4 text-[#FF6600]" />
                                    Available in {Object.keys(countsByState).length} states &amp; territories
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16">
                <div className="max-w-5xl mx-auto space-y-16">

                    {/* National Pricing Overview */}
                    {cost && (
                        <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                            <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: '32px' }}>
                                <DollarSign className="w-6 h-6 text-[#FF6600]" />
                                {jobName} Cost Guide Australia {year}
                            </h2>
                            <p className="text-zinc-500 mb-8" style={{ fontSize: '16px', lineHeight: 1.6 }}>
                                The following pricing is based on national industry averages. Costs may be 10–20% higher in capital cities (Sydney, Melbourne) and lower in regional areas. Always get 2–3 written quotes before committing to any {tradeName!.toLowerCase()} work.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                                    <p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: '16px' }}>National Average</p>
                                    <p className="text-3xl font-black text-zinc-900">${cost.low}–${cost.high}</p>
                                    <p className="text-zinc-500" style={{ fontSize: '16px' }}>{cost.unit}</p>
                                </div>
                                <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                                    <p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: '16px' }}>Emergency / After-Hours</p>
                                    <p className="text-3xl font-black text-zinc-900">${Math.round(cost.high * 1.5)}</p>
                                    <p className="text-zinc-500" style={{ fontSize: '16px' }}>Estimated peak rate</p>
                                </div>
                                <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                                    <p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: '16px' }}>Quotes Recommended</p>
                                    <p className="text-3xl font-black text-zinc-900">2–3</p>
                                    <p className="text-zinc-500" style={{ fontSize: '16px' }}>Before any work begins</p>
                                </div>
                            </div>

                            {/* State-by-state breakdown */}
                            {Object.keys(countsByState).length > 0 && (
                                <div>
                                    <h3 className="font-black text-zinc-900 mb-4" style={{ fontSize: '20px' }}>{jobName} Availability by State</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {Object.entries(countsByState).map(([stateCode, count]) => (
                                            <div key={stateCode} className="bg-zinc-50 rounded-xl p-4 border border-zinc-100 text-center">
                                                <p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: '16px' }}>{stateCode}</p>
                                                <p className="text-xl font-black text-zinc-900">{count}</p>
                                                <p className="text-zinc-400" style={{ fontSize: '16px' }}>listed</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <p className="text-zinc-400 mt-6" style={{ fontSize: '16px' }}>Prices are estimates only and may change without notice. Verify current pricing directly with your chosen contractor.</p>
                        </section>
                    )}

                    {/* Top Cities */}
                    {topCities.length > 0 && (
                        <section className="bg-white rounded-3xl border border-zinc-200 p-8">
                            <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: '32px' }}>
                                <MapPin className="w-6 h-6 text-[#FF6600]" />
                                Find {jobName} Specialists Near You
                            </h2>
                            <p className="text-zinc-500 mb-6" style={{ fontSize: '16px' }}>Browse verified {tradeName!.toLowerCase()} by city across Australia:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {topCities.map(({ city, state, count }) => {
                                    const stateSlug = STATE_SLUGS[state?.toUpperCase()] || state?.toLowerCase();
                                    const citySlug = city.toLowerCase().replace(/\s+/g, '-');
                                    return (
                                        <Link
                                            key={`${city}-${state}`}
                                            href={`/local/${stateSlug}/${citySlug}`}
                                            className="flex items-center justify-between px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl hover:bg-orange-50 hover:border-[#FF6600] transition-colors group"
                                        >
                                            <div>
                                                <span className="font-black text-zinc-900 group-hover:text-[#FF6600]" style={{ fontSize: '16px' }}>{city}</span>
                                                <p className="text-zinc-400" style={{ fontSize: '16px' }}>{STATE_NAMES[state?.toUpperCase()] || state} · {count} listed</p>
                                            </div>
                                            <ArrowRight className="w-5 h-5 text-zinc-300 group-hover:text-[#FF6600]" />
                                        </Link>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* State Licensing */}
                    {STATE_LICENSING[tradeName!] && (
                        <section className="bg-white rounded-3xl border border-zinc-200 p-8">
                            <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: '32px' }}>
                                <FileText className="w-6 h-6 text-blue-500" />
                                {tradeName} Licensing Requirements in Australia
                            </h2>
                            <p className="text-zinc-500 mb-6" style={{ fontSize: '16px' }}>Licensing requirements vary by state. Always verify your contractor holds the correct licence for your location.</p>
                            <div className="space-y-3">
                                {Object.entries(STATE_LICENSING[tradeName!]).map(([stateCode, text]) => (
                                    <div key={stateCode} className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                                        <p className="font-black text-blue-600 uppercase tracking-wider mb-2" style={{ fontSize: '16px' }}>
                                            {STATE_NAMES[stateCode] || stateCode}
                                        </p>
                                        <p className="text-zinc-700" style={{ fontSize: '16px', lineHeight: 1.6 }}>{text}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Related Services */}
                    {relatedJobs.length > 0 && (
                        <section className="bg-white rounded-3xl border border-zinc-200 p-8">
                            <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: '28px' }}>
                                <Wrench className="w-5 h-5 text-[#FF6600]" />
                                Related {tradeName} Services
                            </h2>
                            <p className="text-zinc-500 mb-6" style={{ fontSize: '16px' }}>Also looking for other {tradeName!.toLowerCase()} services in Australia?</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {relatedJobs.map((j) => (
                                    <Link
                                        key={j}
                                        href={`/trades/${jobToSlug(j)}`}
                                        className="flex items-center justify-between px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-xl font-bold text-zinc-700 hover:bg-orange-50 hover:border-[#FF6600] hover:text-[#FF6600] transition-colors" style={{ fontSize: '16px' }}
                                    >
                                        <span className="capitalize">{j}</span>
                                        <ArrowRight className="w-4 h-4 text-zinc-300" />
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* FAQ */}
                    {faqEntries.length > 0 && (
                        <section>
                            <h2 className="font-black text-[#1A1A1A] mb-8 font-display" style={{ fontSize: '32px' }}>
                                {jobName}: Frequently Asked Questions
                            </h2>
                            <div className="space-y-4">
                                {faqEntries.map((faq, i) => (
                                    <div key={i} className="bg-white rounded-2xl border border-zinc-200 p-6">
                                        <h3 className="font-black text-zinc-900 mb-2" style={{ fontSize: '18px' }}>{faq.q}</h3>
                                        <p className="text-zinc-600" style={{ fontSize: '16px', lineHeight: 1.6 }}>{faq.a}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* CTA */}
                    <section className="bg-[#1A1A1A] rounded-3xl p-8 md:p-12 text-center text-white">
                        <h2 className="font-black mb-4 text-white" style={{ fontSize: '40px' }}>Find a {tradeName} Near You</h2>
                        <p className="text-zinc-400 mb-8 max-w-xl mx-auto" style={{ fontSize: '20px', lineHeight: 1.7 }}>
                            TradeRefer lists verified, ABN-checked {tradeName!.toLowerCase()} across Australia, ranked by real community referrals — not paid placement.
                        </p>
                        <Link
                            href="/local"
                            className="inline-flex items-center gap-2 bg-[#FF6600] hover:bg-[#E65C00] text-white font-black rounded-xl px-8 transition-colors" style={{ minHeight: '64px', fontSize: '18px' }}
                        >
                            Browse Your Area <ArrowRight className="w-5 h-5" />
                        </Link>
                    </section>

                </div>
            </div>
        </main>
    );
}
