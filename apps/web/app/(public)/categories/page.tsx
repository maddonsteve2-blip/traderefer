import { sql } from "@/lib/db";
import { Metadata } from "next";
import Link from "next/link";
import { DirectoryFooter } from "@/components/DirectoryFooter";
import { JOB_TYPES, jobToSlug } from "@/lib/constants";
import { ChevronRight, Wrench, Users, ArrowRight, Search } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "All Trade Categories | Find Local Tradies in Australia | TradeRefer",
    description: "Browse all trade categories on TradeRefer. Find verified local electricians, plumbers, painters, builders and 50+ more trades across Australia. Free quotes from ABN-verified tradies.",
    openGraph: {
        title: "All Trade Categories | TradeRefer Australia",
        description: "50+ trade categories. Find verified local tradies across all Australian states and cities.",
    },
};

async function getTradeStats(): Promise<Array<{ trade: string; count: number; suburbs: number }>> {
    try {
        const results = await sql`
            SELECT trade_category, COUNT(*) as count, COUNT(DISTINCT suburb) as suburbs
            FROM businesses
            WHERE status = 'active' AND trade_category IS NOT NULL
            GROUP BY trade_category
            ORDER BY count DESC
        `;
        return results.map((r: any) => ({
            trade: r.trade_category as string,
            count: parseInt(r.count, 10),
            suburbs: parseInt(r.suburbs, 10),
        }));
    } catch {
        return [];
    }
}

function tradeToSlug(trade: string) {
    return trade.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://traderefer.au" },
        { "@type": "ListItem", "position": 2, "name": "All Trade Categories" },
    ]
};

export default async function CategoriesPage() {
    const tradeStats = await getTradeStats();
    const totalBusinesses = tradeStats.reduce((sum, t) => sum + t.count, 0);
    const totalTrades = tradeStats.length;

    return (
        <main className="min-h-screen bg-zinc-50">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />

            {/* Hero */}
            <div className="bg-zinc-900 pt-32 pb-16 text-white">
                <div className="container mx-auto px-4">
                    <nav className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest mb-8">
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-orange-400">All Categories</span>
                    </nav>
                    <div className="flex items-center gap-3 text-orange-500 font-black text-sm uppercase tracking-widest mb-4">
                        <Wrench className="w-5 h-5" />
                        Trade Directory
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
                        All Trade <span className="text-orange-500">Categories</span>
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl mb-8">
                        Browse {totalTrades} trade categories across Australia. Find verified, ABN-checked local tradies with real community ratings.
                    </p>
                    <div className="flex flex-wrap gap-6 text-sm text-zinc-400 font-medium">
                        <span className="flex items-center gap-2"><Users className="w-4 h-4 text-orange-500" />{totalBusinesses.toLocaleString()} verified businesses</span>
                        <span className="flex items-center gap-2"><Wrench className="w-4 h-4 text-orange-500" />{totalTrades} trade categories</span>
                        <span className="flex items-center gap-2"><Search className="w-4 h-4 text-orange-500" />Free quotes, no obligation</span>
                    </div>
                </div>
            </div>

            {/* Categories Grid */}
            <div className="container mx-auto px-4 py-16">
                <div className="max-w-7xl mx-auto">

                    {/* Trades with job types (JOB_TYPES mapped trades) */}
                    {tradeStats.length > 0 && (
                        <section className="mb-16">
                            <h2 className="text-2xl font-black text-zinc-900 mb-2">Browse by Trade</h2>
                            <p className="text-zinc-500 text-sm mb-8">Click any trade to find verified local specialists in your area.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {tradeStats.map(({ trade, count, suburbs }) => {
                                    const slug = tradeToSlug(trade);
                                    const jobs = JOB_TYPES[trade] || [];
                                    return (
                                        <div
                                            key={trade}
                                            id={slug}
                                            className="bg-white rounded-2xl border border-zinc-200 hover:border-orange-400 hover:shadow-lg transition-all duration-300 overflow-hidden group"
                                        >
                                            <Link href={`/local?category=${encodeURIComponent(trade)}`} className="block p-5">
                                                <div className="flex items-start justify-between mb-3">
                                                    <h3 className="text-base font-black text-zinc-900 group-hover:text-orange-600 transition-colors leading-tight">
                                                        {trade}
                                                    </h3>
                                                    <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-orange-500 shrink-0 mt-0.5 transition-colors" />
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-zinc-500 font-medium mb-3">
                                                    <span className="flex items-center gap-1">
                                                        <Users className="w-3 h-3 text-orange-400" />
                                                        {count} businesses
                                                    </span>
                                                    <span className="text-zinc-300">·</span>
                                                    <span>{suburbs} suburbs</span>
                                                </div>
                                            </Link>
                                            {jobs.length > 0 && (
                                                <div className="border-t border-zinc-100 px-5 py-3">
                                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-2">Common Services</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {jobs.slice(0, 3).map(job => (
                                                            <Link
                                                                key={job}
                                                                href={`/trades/${jobToSlug(job)}`}
                                                                className="px-2 py-1 bg-zinc-50 border border-zinc-100 rounded-lg text-[10px] font-bold text-zinc-600 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 transition-colors capitalize"
                                                            >
                                                                {job}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* Quick Links to Top 10 pages */}
                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10 mb-16">
                        <h2 className="text-xl font-black text-zinc-900 mb-2">Top Rated Tradies by City</h2>
                        <p className="text-zinc-500 text-sm mb-6">Find the highest-rated tradies in Australia's major cities, ranked by verified customer reviews.</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {[
                                { label: "Top Electricians Melbourne", href: "/top/electrician/vic/melbourne" },
                                { label: "Top Plumbers Sydney", href: "/top/plumber/nsw/sydney" },
                                { label: "Top Electricians Brisbane", href: "/top/electrician/qld/brisbane" },
                                { label: "Top Painters Melbourne", href: "/top/painter/vic/melbourne" },
                                { label: "Top Electricians Perth", href: "/top/electrician/wa/perth" },
                                { label: "Top Plumbers Melbourne", href: "/top/plumber/vic/melbourne" },
                                { label: "Top Electricians Sydney", href: "/top/electrician/nsw/sydney" },
                                { label: "Top Electricians Geelong", href: "/top/electrician/vic/geelong" },
                            ].map(link => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="flex items-center justify-between px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl text-xs font-bold text-zinc-600 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700 transition-colors"
                                >
                                    <span>{link.label}</span>
                                    <ChevronRight className="w-3 h-3 shrink-0 text-zinc-300" />
                                </Link>
                            ))}
                        </div>
                    </section>

                    {/* Browse by Location CTA */}
                    <section className="bg-zinc-900 rounded-3xl p-8 md:p-10 text-white text-center">
                        <h2 className="text-2xl font-black mb-2">Browse by Location</h2>
                        <p className="text-zinc-400 mb-6 max-w-lg mx-auto">Find trades specifically in your suburb, city or state. All businesses are ABN-verified and ranked by real community referrals.</p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            <Link href="/locations" className="bg-orange-500 hover:bg-orange-600 text-white font-black px-8 py-3 rounded-xl transition-colors">
                                Browse All Locations
                            </Link>
                            <Link href="/local" className="bg-white/10 hover:bg-white/20 text-white font-black px-8 py-3 rounded-xl transition-colors border border-white/10">
                                State Directory
                            </Link>
                        </div>
                    </section>
                </div>
            </div>

            <DirectoryFooter />
        </main>
    );
}
