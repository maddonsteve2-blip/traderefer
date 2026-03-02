import { ChevronRight, Users, ShieldCheck, ExternalLink, TrendingUp } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DirectoryFooter } from "@/components/DirectoryFooter";
import { Metadata } from "next";
import { sql } from "@/lib/db";
import { STATE_LICENSING, STATE_AUTHORITY_LINKS } from "@/lib/constants";

interface PageProps {
    params: Promise<{ state: string }>;
}

function formatSlug(slug: string) {
    if (!slug) return "";
    try { slug = decodeURIComponent(slug); } catch { /* already decoded */ }
    return slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

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
        const results = await sql`
            SELECT city, COUNT(*) as count
            FROM businesses
            WHERE status = 'active'
              AND state ILIKE ${state}
              AND city IS NOT NULL AND city != ''
            GROUP BY city
            ORDER BY count DESC, city ASC
        `;
        return results.map((r: any) => ({ city: r.city, count: parseInt(r.count, 10) }));
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
        const results = await sql`
            SELECT trade_category as trade, COUNT(*) as count
            FROM businesses
            WHERE status = 'active' AND state ILIKE ${state}
              AND trade_category IS NOT NULL
            GROUP BY trade_category
            ORDER BY count DESC
            LIMIT 6
        `;
        return results.map((r: any) => ({ trade: r.trade, count: parseInt(r.count, 10) }));
    } catch { return []; }
}

export default async function StateDirectoryPage({ params }: PageProps) {
    const { state } = await params;
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
        <main className="min-h-screen bg-[#FCFCFC]">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

            {/* ── BREADCRUMBS ── */}
            <div className="bg-zinc-900 pt-32 pb-4">
                <div className="container mx-auto px-4">
                    <nav className="flex items-center gap-2 text-sm font-bold text-zinc-500 uppercase tracking-widest">
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href="/local" className="hover:text-white transition-colors">Directory</Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-orange-500">{stateName}</span>
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
                            Trade Services in <span className="text-orange-500">{stateName}</span>
                        </h1>
                        <p className="text-xl text-zinc-400 mb-6 leading-[1.6] max-w-2xl">
                            {businessCount > 0
                                ? `${businessCount.toLocaleString()} verified businesses across ${cities.length} cities in ${stateName}. ABN-checked, community-ranked — not paid placement.`
                                : `Find verified local trade businesses across ${stateName}. ABN-checked, community-ranked experts in your city.`
                            }
                        </p>
                        {authorityLink && (
                            <a href={authorityLink.url} target="_blank" rel="noopener noreferrer"
                               className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-sm font-bold text-zinc-300 hover:bg-white/20 transition-colors">
                                <ShieldCheck className="w-4 h-4 text-orange-400" />
                                Licensed under {authorityLink.name}
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* ── MAIN CONTENT ── */}
            <div className="py-20">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto space-y-16">

                        {/* City grid */}
                        <section>
                            <h2 className="text-2xl font-black text-zinc-900 mb-2">Browse by City</h2>
                            <p className="text-lg text-zinc-500 mb-8 leading-[1.6]">Select your city or region to browse suburb-level experts across {stateName}.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {cities.map(({ city, count }) => (
                                    <Link key={city} href={`/local/${state}/${city.toLowerCase().replace(/ /g, '-')}`} className="group">
                                        <div className="bg-white rounded-2xl border border-zinc-200 hover:border-orange-500 hover:shadow-xl transition-all duration-300 p-6 flex items-center justify-between">
                                            <div>
                                                <h3 className="text-xl font-black text-zinc-900 group-hover:text-orange-600 transition-colors mb-1">
                                                    {city}
                                                </h3>
                                                <p className="text-2xl font-black text-orange-500">{count.toLocaleString()}</p>
                                                <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Verified Pros</p>
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
                                <h2 className="text-2xl font-black text-zinc-900 mb-2 flex items-center gap-2">
                                    <TrendingUp className="w-6 h-6 text-orange-500" />
                                    Most In-Demand Trades in {stateName}
                                </h2>
                                <p className="text-lg text-zinc-500 mb-8 leading-[1.6]">Based on verified businesses currently listed across {stateName}.</p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {topTrades.map(({ trade, count }) => (
                                        <div key={trade} className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
                                            <p className="text-sm font-black text-zinc-900 mb-1">{trade}</p>
                                            <p className="text-2xl font-black text-orange-500">{count.toLocaleString()}</p>
                                            <p className="text-xs text-zinc-400 uppercase tracking-wider">businesses</p>
                                        </div>
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
                                        <h2 className="text-xl font-black text-zinc-900 mb-1">{stateName} Licensing Requirements</h2>
                                        <p className="text-lg text-zinc-600 mb-6 leading-[1.6]">
                                            Certain trades in {stateName} require a valid state licence. TradeRefer verifies licence status for all listed businesses.
                                        </p>
                                        <div className="space-y-3 mb-6">
                                            {stateLicensedTrades.map(({ trade, text }) => (
                                                <div key={trade} className="bg-white rounded-2xl border border-blue-100 p-4">
                                                    <p className="font-black text-zinc-900 text-sm mb-1">{trade}</p>
                                                    <p className="text-base text-zinc-600 leading-[1.6] line-clamp-2">{text}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <a href={authorityLink.url} target="_blank" rel="noopener noreferrer"
                                           className="inline-flex items-center gap-2 text-blue-600 font-bold text-sm hover:underline">
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
                                    <span className="text-sm">verified businesses in {stateName}</span>
                                </div>
                                <div className="flex items-center gap-2 text-zinc-600">
                                    <ShieldCheck className="w-5 h-5 text-green-500" />
                                    <span className="text-sm font-bold">100% ABN verified</span>
                                </div>
                                <div className="flex items-center gap-2 text-zinc-600">
                                    <TrendingUp className="w-5 h-5 text-blue-500" />
                                    <span className="text-sm font-bold">Community-ranked, not paid</span>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
            <DirectoryFooter />
        </main>
    );
}
