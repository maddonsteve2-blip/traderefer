import { sql } from "@/lib/db";
import { Metadata } from "next";
import Link from "next/link";
import { JOB_TYPES, jobToSlug } from "@/lib/constants";
import { PublicMultiQuoteForm } from "@/components/PublicMultiQuoteForm";
import { ChevronRight, Wrench, Users, ArrowRight, Search } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "50+ Trade Categories | Find Verified Tradies in Australia | TradeRefer",
    description: "Browse 50+ trade categories on TradeRefer. Find verified electricians, plumbers, painters, builders & more across Australia. ABN-verified, community-ranked. Free quotes.",
    alternates: { canonical: "https://traderefer.au/categories" },
    openGraph: {
        title: "All Trade Categories | TradeRefer Australia",
        description: "50+ trade categories. Find verified local tradies across all Australian states and cities.",
    },
};

type TradeStatsRow = {
    trade_category: string;
    count: string | number;
    suburbs: string | number;
};

async function getTradeStats(): Promise<Array<{ trade: string; count: number; suburbs: number }>> {
    try {
        const results = await sql<TradeStatsRow[]>`
            SELECT trade_category, COUNT(*) as count, COUNT(DISTINCT suburb) as suburbs
            FROM businesses
            WHERE status = 'active' AND trade_category IS NOT NULL
            GROUP BY trade_category
            ORDER BY count DESC
        `;
        return results.map((r) => ({
            trade: r.trade_category,
            count: parseInt(String(r.count), 10),
            suburbs: parseInt(String(r.suburbs), 10),
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
            <div className="bg-[#1A1A1A] pt-32 pb-16 text-white">
                <div className="container mx-auto px-4">
                    <nav className="flex items-center gap-2 font-bold text-zinc-400 uppercase tracking-widest mb-8" style={{ fontSize: '16px' }}>
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-[#FF6600]">All Categories</span>
                    </nav>
                    <div className="flex items-center gap-3 text-[#FF6600] font-black uppercase tracking-widest mb-4" style={{ fontSize: '16px' }}>
                        <Wrench className="w-5 h-5" />
                        Trade Directory
                    </div>
                    <h1 className="font-black mb-6 leading-[1.1] font-display text-white" style={{ fontSize: 'clamp(48px, 8vw, 80px)' }}>
                        All Trade <span className="text-[#FF6600]">Categories</span>
                    </h1>
                    <p className="text-zinc-400 max-w-2xl mb-8" style={{ fontSize: '20px', lineHeight: 1.7 }}>
                        Browse {totalTrades} trade categories across Australia. Find verified, ABN-checked local tradies with real community ratings.
                    </p>
                    <div className="flex flex-wrap gap-4 mb-8">
                        <Link href="/quotes?source=%2Fcategories" className="bg-[#FF6600] hover:bg-[#E65C00] text-white font-black px-8 rounded-xl transition-colors inline-flex items-center justify-center gap-2" style={{ minHeight: '64px', fontSize: '18px' }}>
                            Get 3 Free Quotes
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link href="/local" className="bg-white/10 hover:bg-white/20 text-white font-black px-8 rounded-xl transition-colors border border-white/10 inline-flex items-center justify-center" style={{ minHeight: '64px', fontSize: '18px' }}>
                            Browse by Location
                        </Link>
                    </div>
                    <div className="flex flex-wrap gap-6 text-white font-bold" style={{ fontSize: '16px' }}>
                        <span className="flex items-center gap-2"><Users className="w-4 h-4 text-[#FF6600]" />{totalBusinesses.toLocaleString()} verified businesses</span>
                        <span className="flex items-center gap-2"><Wrench className="w-4 h-4 text-[#FF6600]" />{totalTrades} trade categories</span>
                        <span className="flex items-center gap-2"><Search className="w-4 h-4 text-[#FF6600]" />Free quotes, no obligation</span>
                    </div>
                </div>
            </div>

            {/* Categories Grid */}
            <div className="container mx-auto px-4 py-16">
                <div className="max-w-7xl mx-auto">

                    {/* Trades with job types (JOB_TYPES mapped trades) */}
                    {tradeStats.length > 0 && (
                        <section className="mb-16">
                            <h2 className="font-black text-[#1A1A1A] mb-2 font-display" style={{ fontSize: '40px' }}>Browse by Trade</h2>
                            <p className="text-zinc-500 mb-8" style={{ fontSize: '20px', lineHeight: 1.7 }}>Click any trade to find verified local specialists in your area.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {tradeStats.map(({ trade, count, suburbs }) => {
                                    const slug = tradeToSlug(trade);
                                    const jobs = JOB_TYPES[trade] || [];
                                    const primaryHref = trade === "Plumbing"
                                        ? "/trades/plumbing"
                                        : trade === "Electrical"
                                        ? "/trades/electrical"
                                        : `/businesses?category=${encodeURIComponent(trade)}`;
                                    return (
                                        <div
                                            key={trade}
                                            id={slug}
                                            className="bg-white rounded-2xl border-2 border-zinc-200 hover:border-[#FF6600] hover:shadow-lg transition-all duration-300 overflow-hidden group"
                                        >
                                            <Link href={primaryHref} className="block p-6">
                                                <div className="flex items-start justify-between mb-3">
                                                    <h3 className="font-black text-[#1A1A1A] group-hover:text-[#FF6600] transition-colors leading-tight" style={{ fontSize: '20px' }}>
                                                        {trade}
                                                    </h3>
                                                    <ArrowRight className="w-5 h-5 text-zinc-300 group-hover:text-[#FF6600] shrink-0 mt-0.5 transition-colors" />
                                                </div>
                                                <div className="flex items-center gap-3 text-zinc-500 font-bold" style={{ fontSize: '16px' }}>
                                                    <span className="flex items-center gap-1.5">
                                                        <Users className="w-4 h-4 text-[#FF6600]" />
                                                        {count} businesses
                                                    </span>
                                                    <span className="text-zinc-300">·</span>
                                                    <span>{suburbs} suburbs</span>
                                                </div>
                                            </Link>
                                            {jobs.length > 0 && (
                                                <div className="border-t border-zinc-100 px-6 py-4">
                                                    <p className="font-black text-zinc-400 uppercase tracking-wider mb-3" style={{ fontSize: '16px' }}>Common Services</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {jobs.slice(0, 3).map(job => (
                                                            <Link
                                                                key={job}
                                                                href={`/trades/${jobToSlug(job)}`}
                                                                className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg font-bold text-zinc-600 hover:bg-orange-50 hover:text-[#FF6600] hover:border-orange-200 transition-colors capitalize" style={{ fontSize: '16px' }}
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
                        <h2 className="font-black text-[#1A1A1A] mb-2 font-display" style={{ fontSize: '32px' }}>Top Rated Tradies by City</h2>
                        <p className="text-zinc-500 mb-6" style={{ fontSize: '20px', lineHeight: 1.7 }}>Find the highest-rated tradies in Australia&apos;s major cities, ranked by verified customer reviews.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
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
                                    className="flex items-center justify-between px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-xl font-bold text-zinc-700 hover:bg-orange-50 hover:border-[#FF6600] hover:text-[#FF6600] transition-colors" style={{ fontSize: '16px' }}
                                >
                                    <span>{link.label}</span>
                                    <ChevronRight className="w-4 h-4 shrink-0 text-zinc-300" />
                                </Link>
                            ))}
                        </div>
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10 mb-16">
                        <div className="max-w-3xl mb-8">
                            <h2 className="font-black text-[#1A1A1A] mb-3 font-display" style={{ fontSize: '32px' }}>Get 3 Free Quotes</h2>
                            <p className="text-zinc-500" style={{ fontSize: '20px', lineHeight: 1.7 }}>
                                Tell us what trade you need and where the job is located. We&apos;ll match your request with up to 3 verified local businesses.
                            </p>
                        </div>
                        <PublicMultiQuoteForm initialSourcePage="/categories" />
                    </section>

                    {/* Browse by Location CTA */}
                    <section className="bg-[#1A1A1A] rounded-3xl p-8 md:p-10 text-white text-center">
                        <h2 className="font-black mb-4 text-white" style={{ fontSize: '32px' }}>Need quotes instead of browsing?</h2>
                        <p className="text-zinc-400 mb-8 max-w-lg mx-auto" style={{ fontSize: '20px', lineHeight: 1.7 }}>Request up to 3 free quotes from verified local businesses, or keep browsing by suburb, city, or state.</p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            <Link href="/quotes?source=%2Fcategories" className="bg-[#FF6600] hover:bg-[#E65C00] text-white font-black px-8 rounded-xl transition-colors inline-flex items-center justify-center gap-2" style={{ minHeight: '64px', fontSize: '18px' }}>
                                Get 3 Free Quotes
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link href="/local" className="bg-white/10 hover:bg-white/20 text-white font-black px-8 rounded-xl transition-colors border border-white/10 inline-flex items-center justify-center" style={{ minHeight: '64px', fontSize: '18px' }}>
                                Browse by Location
                            </Link>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
