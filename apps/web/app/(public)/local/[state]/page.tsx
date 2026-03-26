import { ChevronRight, Users, ShieldCheck, ExternalLink, TrendingUp } from "lucide-react";

import Link from "next/link";

import { notFound } from "next/navigation";

import { Metadata } from "next";

import { sql } from "@/lib/db";

import { PublicMultiQuoteForm } from "@/components/PublicMultiQuoteForm";

import { STATE_LICENSING, STATE_AUTHORITY_LINKS } from "@/lib/constants";



interface PageProps {

    params: Promise<{ state: string }>;

    searchParams: Promise<{ category?: string }>;

}



type CityCountRow = {

    city: string;

    count: string | number;

};



type TradeCountRow = {

    trade: string;

    count: string | number;

};



const STATE_NAMES: Record<string, string> = {

    "vic": "Victoria", "nsw": "New South Wales", "qld": "Queensland",

    "wa": "Western Australia", "sa": "South Australia", "tas": "Tasmania",

    "act": "Australian Capital Territory", "nt": "Northern Territory",

};



export async function generateMetadata({ params }: PageProps): Promise<Metadata> {

    const { state } = await params;

    const stateName = STATE_NAMES[state.toLowerCase()];

    if (!stateName) return {};

    return {

        title: `Verified Trade Services in ${stateName} | TradeRefer`,

        description: `Browse ${stateName}'s top ABN-verified local trade businesses. Find plumbers, electricians, builders and more in your city or suburb.`,

    };

}



async function getCitiesInState(state: string): Promise<{ city: string; count: number }[]> {

    try {

        const results = await sql<CityCountRow[]>`

            SELECT lr.parent_city_name AS city, COUNT(*) as count

            FROM locations_reference lr

            WHERE lr.is_active = true

              AND lr.type = 'suburb'

              AND UPPER(lr.state_code) = UPPER(${state})

              AND lr.parent_city_name IS NOT NULL

              AND lr.parent_city_name != ''

            GROUP BY lr.parent_city_name

            ORDER BY lr.parent_city_name ASC

        `;

        return results.map((r) => ({ city: r.city, count: parseInt(String(r.count), 10) }));

    } catch { return []; }

}



async function getBusinessCountForState(state: string): Promise<number> {

    try {

        const result = await sql`

            SELECT COUNT(*) as count FROM businesses

            WHERE status = 'active' AND state ILIKE ${state}

        `;

        return parseInt(result[0]?.count || '0', 10);

    } catch { return 0; }

}



async function getTopTradesForState(state: string): Promise<{ trade: string; count: number }[]> {

    try {

        const results = await sql<TradeCountRow[]>`

            SELECT trade_category as trade, COUNT(*) as count

            FROM businesses

            WHERE status = 'active' AND state ILIKE ${state}

              AND trade_category IS NOT NULL

            GROUP BY trade_category

            ORDER BY count DESC

            LIMIT 6

        `;

        return results.map((r) => ({ trade: r.trade, count: parseInt(String(r.count), 10) }));

    } catch { return []; }

}



export default async function StateDirectoryPage({ params, searchParams }: PageProps) {

    const { state } = await params;

    const { category } = await searchParams;

    const catParam = category ? `?category=${encodeURIComponent(category)}` : '';

    const stateName = STATE_NAMES[state.toLowerCase()];

    if (!stateName) notFound();



    const stateUpper = state.toUpperCase();



    const [cities, businessCount, topTrades] = await Promise.all([

        getCitiesInState(state),

        getBusinessCountForState(state),

        getTopTradesForState(state),

    ]);



    if (cities.length === 0) notFound();



    const stateLicensedTrades = Object.entries(STATE_LICENSING)

        .filter(([, stateMap]) => stateMap[stateUpper])

        .slice(0, 3)

        .map(([trade, stateMap]) => ({ trade, text: stateMap[stateUpper] }));



    const authorityLink = STATE_AUTHORITY_LINKS[stateUpper];



    const breadcrumbJsonLd = {

        "@context": "https://schema.org",

        "@type": "BreadcrumbList",

        "itemListElement": [

            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://traderefer.au" },

            { "@type": "ListItem", "position": 2, "name": "Directory", "item": "https://traderefer.au/local" },

            { "@type": "ListItem", "position": 3, "name": `Verified Trade Services in ${stateName}` },

        ]

    };



    return (

        <>

        <main className="min-h-screen bg-[#FCFCFC]">

            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />



            {/* ── BREADCRUMBS ── */}

            <div className="bg-gray-100 border-b border-gray-200" style={{ paddingTop: '108px', paddingBottom: '12px' }}>

                <div className="container mx-auto px-4">

                    <nav className="flex items-center gap-2 font-bold text-gray-500 uppercase tracking-widest" style={{ fontSize: '16px' }}>

                        <Link href="/" className="hover:text-[#FF6600] transition-colors">Home</Link>

                        <ChevronRight className="w-3 h-3" />

                        <Link href="/local" className="hover:text-[#FF6600] transition-colors">Directory</Link>

                        <ChevronRight className="w-3 h-3" />

                        <span className="text-[#FF6600]">{stateName}</span>

                    </nav>

                </div>

            </div>



            {/* ── HERO ── */}

            <div className="bg-[#FCFCFC] pb-20 pt-12 relative overflow-hidden border-b border-gray-200">

                <div className="absolute inset-0 z-0 bg-cover bg-center opacity-8" style={{ backgroundImage: 'url(\'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=2670&auto=format&fit=crop\')' }} />

                <div className="absolute inset-0 z-0 bg-[#FCFCFC]/85" />

                <div className="container mx-auto px-4 relative z-10">

                    {/* BLUF snippet — 40-word AI-crawlable expert summary */}

                    <div className="bg-white border-l-4 border-[#FF6600] rounded-xl px-6 py-4 max-w-3xl mb-8">

                        <p className="text-[#1A1A1A]" style={{ fontSize: '18px', lineHeight: 1.7 }}>

                            {businessCount > 0

                                ? `${stateName} has ${businessCount.toLocaleString()} ABN-verified trade businesses across ${cities.length} cities. TradeRefer eliminates the $21 lead-risk for ${stateName} pros — pay only when you win the work.`

                                : `${stateName} verified trade directory. Find ABN-checked plumbers, electricians, builders and more. TradeRefer eliminates upfront lead risk across every city in ${stateName}.`

                            }

                        </p>

                    </div>

                    <div className="max-w-4xl">

                        <h1 className="text-[42px] md:text-7xl lg:text-[80px] font-black mb-6 leading-[1.1] text-[#1A1A1A] font-display">

                            Trade Services in <span className="text-[#FF6600]">{stateName}</span>

                        </h1>

                        <p className="text-gray-600 mb-6 max-w-2xl" style={{ fontSize: '20px', lineHeight: 1.7 }}>

                            {businessCount > 0

                                ? `${businessCount.toLocaleString()} verified businesses across ${cities.length} cities in ${stateName}. ABN-checked, community-ranked — not paid placement.`

                                : `Find verified local trade businesses across ${stateName}. ABN-checked, community-ranked experts in your city.`

                            }

                        </p>

                        <div className="flex flex-wrap gap-4 mb-6">

                            <Link href={`/quotes?state=${stateUpper}&source=${encodeURIComponent(`/local/${state}`)}`} className="inline-flex items-center justify-center gap-2 bg-[#FF6600] hover:bg-[#E65C00] text-white font-black px-8 rounded-xl transition-colors" style={{ minHeight: '64px', fontSize: '18px' }}>

                                Get 3 Free Quotes

                                <ChevronRight className="w-4 h-4" />

                            </Link>

                            <Link href="/categories" className="inline-flex items-center justify-center bg-white border-2 border-gray-200 hover:border-[#FF6600] rounded-xl px-5 py-3 font-bold text-[#1A1A1A] hover:text-[#FF6600] transition-colors" style={{ minHeight: '64px', fontSize: '18px' }}>

                                Browse by Trade

                            </Link>

                        </div>

                        {authorityLink && (

                            <a href={authorityLink.url} target="_blank" rel="noopener noreferrer"

                               className="inline-flex items-center gap-2 bg-white border-2 border-gray-200 hover:border-[#FF6600] rounded-xl px-5 py-3 font-bold text-[#1A1A1A] hover:text-[#FF6600] transition-colors" style={{ fontSize: '16px' }}>

                                <ShieldCheck className="w-5 h-5 text-[#FF6600]" />

                                Licensed under {authorityLink.name}

                                <ExternalLink className="w-4 h-4" />

                            </a>

                        )}

                    </div>

                </div>

            </div>



            {/* ── MAIN CONTENT ── */}

            <div className="py-20">

                <div className="container mx-auto px-4">

                    <div className="max-w-5xl mx-auto space-y-16">



                        <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">

                            <div className="max-w-3xl mb-8">

                                <h2 className="font-black text-[#1A1A1A] mb-3 font-display" style={{ fontSize: '32px' }}>Get 3 Free Quotes in {stateName}</h2>

                                <p className="text-gray-500" style={{ fontSize: '20px', lineHeight: 1.7 }}>

                                    Request quotes once and we&apos;ll match your job with up to 3 verified local businesses across {stateName}.

                                </p>

                            </div>

                            <PublicMultiQuoteForm initialState={stateUpper} initialSourcePage={`/local/${state}`} />

                        </section>



                        {/* City grid */}

                        <section>

                            <h2 className="font-black text-[#1A1A1A] mb-2 font-display" style={{ fontSize: '32px' }}>Browse by City</h2>

                            <p className="text-gray-500 mb-8" style={{ fontSize: '20px', lineHeight: 1.7 }}>Select your city or region to browse suburb-level experts across {stateName}.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                {cities.map(({ city, count }) => (

                                    <Link key={city} href={`/local/${state}/${city.toLowerCase().replace(/ /g, '-')}${catParam}`} className="group">

                                        <div className="bg-white rounded-2xl border-2 border-zinc-200 hover:border-[#FF6600] hover:shadow-xl transition-all duration-300 p-6 flex items-center justify-between">

                                            <div>

                                                <h3 className="font-black text-[#1A1A1A] group-hover:text-[#FF6600] transition-colors mb-1" style={{ fontSize: '28px' }}>

                                                    {city}

                                                </h3>

                                                <p className="text-3xl font-black text-[#FF6600]">{count.toLocaleString()}</p>

                                                <p className="text-gray-400 font-bold uppercase tracking-wider" style={{ fontSize: '16px' }}>Suburbs</p>

                                            </div>

                                            <div className="w-14 h-14 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-300 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors shrink-0">

                                                <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />

                                            </div>

                                        </div>

                                    </Link>

                                ))}

                            </div>

                        </section>



                        {/* Top trades in state */}

                        {topTrades.length > 0 && (

                            <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">

                                <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-3 font-display" style={{ fontSize: '32px' }}>

                                    <TrendingUp className="w-8 h-8 text-[#FF6600]" />

                                    Most In-Demand Trades in {stateName}

                                </h2>

                                <p className="text-gray-500 mb-8" style={{ fontSize: '20px', lineHeight: 1.7 }}>Based on verified businesses currently listed across {stateName}.</p>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

                                    {topTrades.map(({ trade, count }) => (

                                        <Link key={trade} href={`/businesses?category=${encodeURIComponent(trade)}&state=${stateUpper}`} className="group bg-zinc-50 rounded-2xl p-4 border border-zinc-100 hover:border-orange-500 hover:shadow-md hover:bg-orange-50 transition-all duration-200 block">

                                            <p className="font-black text-[#1A1A1A] group-hover:text-[#FF6600] mb-1 transition-colors" style={{ fontSize: '20px' }}>{trade}</p>

                                            <p className="text-3xl font-black text-[#FF6600]">{count.toLocaleString()}</p>

                                            <p className="text-gray-400 uppercase tracking-wider font-bold" style={{ fontSize: '16px' }}>businesses →</p>

                                        </Link>

                                    ))}

                                </div>

                            </section>

                        )}



                        {/* State Licensing Panel */}

                        {stateLicensedTrades.length > 0 && authorityLink && (

                            <section className="bg-blue-50 border border-blue-100 rounded-3xl p-8">

                                <div className="flex items-start gap-4">

                                    <ShieldCheck className="w-7 h-7 text-blue-500 shrink-0 mt-0.5" />

                                    <div className="flex-1">

                                        <h2 className="font-black text-[#1A1A1A] mb-1 font-display" style={{ fontSize: '28px' }}>{stateName} Licensing Requirements</h2>

                                        <p className="text-gray-600 mb-6" style={{ fontSize: '20px', lineHeight: 1.7 }}>

                                            Certain trades in {stateName} require a valid state licence. TradeRefer verifies licence status for all listed businesses.

                                        </p>

                                        <div className="space-y-3 mb-6">

                                            {stateLicensedTrades.map(({ trade, text }) => (

                                                <div key={trade} className="bg-white rounded-2xl border border-blue-100 p-4">

                                                    <p className="font-black text-zinc-900 mb-1" style={{ fontSize: '16px' }}>{trade}</p>

                                                    <p className="text-base text-zinc-600 leading-[1.6] line-clamp-2">{text}</p>

                                                </div>

                                            ))}

                                        </div>

                                        <a href={authorityLink.url} target="_blank" rel="noopener noreferrer"

                                           className="inline-flex items-center gap-2 text-blue-600 font-bold hover:underline" style={{ fontSize: '16px' }}>

                                            <ExternalLink className="w-4 h-4" />

                                            View full requirements on {authorityLink.name}

                                        </a>

                                    </div>

                                </div>

                            </section>

                        )}



                        {/* Stats bar */}

                        {businessCount > 0 && (

                            <div className="flex flex-wrap items-center gap-6 bg-white rounded-2xl border border-zinc-200 p-6">

                                <div className="flex items-center gap-2 text-zinc-600">

                                    <Users className="w-5 h-5 text-orange-500" />

                                    <span className="text-lg font-black text-zinc-900">{businessCount.toLocaleString()}</span>

                                    <span style={{ fontSize: '16px' }}>verified businesses in {stateName}</span>

                                </div>

                                <div className="flex items-center gap-2 text-zinc-600">

                                    <ShieldCheck className="w-5 h-5 text-green-500" />

                                    <span className="font-bold" style={{ fontSize: '16px' }}>100% ABN verified</span>

                                </div>

                                <div className="flex items-center gap-2 text-zinc-600">

                                    <TrendingUp className="w-5 h-5 text-blue-500" />

                                    <span className="font-bold" style={{ fontSize: '16px' }}>Community-ranked, not paid</span>

                                </div>

                            </div>

                        )}



                    </div>

                </div>

            </div>

        </main>

        </>

    );

}

