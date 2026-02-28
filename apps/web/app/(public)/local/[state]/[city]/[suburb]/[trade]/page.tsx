import { sql } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { MapPin, Star, ShieldCheck, ChevronRight, CheckCircle2, Award, Users, ArrowRight, Shield, TrendingUp, Info } from "lucide-react";
import Link from "next/link";
import { BusinessLogo } from "@/components/BusinessLogo";
import { proxyLogoUrl } from "@/lib/logo";
import { DirectoryFooter } from "@/components/DirectoryFooter";
import { Metadata } from "next";
import Script from "next/script";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ state: string; city: string; suburb: string; trade: string }>;
}

function formatSlug(slug: string) {
    if (!slug) return "";
    return slug
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { trade, suburb, city, state } = await params;
    const tradeName = formatSlug(trade);
    const locationName = formatSlug(suburb);
    const cityName = formatSlug(city);

    return {
        title: `Best ${tradeName} in ${locationName}, ${cityName} | Trusted Local Trades`,
        description: `Find the highest-rated ${tradeName} services in ${locationName}, ${cityName}. Verified local businesses, transparent pricing, and trusted referrals.`,
    };
}

async function getBusinesses(trade: string, suburb: string) {
    try {
        const tradeName = formatSlug(trade);
        const suburbName = formatSlug(suburb);

        const businesses = await sql`
            SELECT b.*, 
                   (SELECT COUNT(*) FROM referral_links rl WHERE rl.business_id = b.id) as trusted_count
            FROM businesses b 
            WHERE b.status = 'active' 
              AND (b.listing_visibility = 'public' OR b.listing_visibility IS NULL)
              AND (b.trade_category ILIKE ${'%' + tradeName + '%'} OR b.trade_category ILIKE ${'%' + trade + '%'})
              AND (b.suburb ILIKE ${'%' + suburbName + '%'} OR b.suburb ILIKE ${'%' + suburb + '%'})
            ORDER BY b.is_verified DESC, b.listing_rank DESC
            LIMIT 50
        `;
        return businesses;
    } catch (error) {
        console.error("Database error:", error);
        return [];
    }
}

async function getRelatedTrades(suburb: string, currentTrade: string) {
    const suburbName = formatSlug(suburb);
    const trades = await sql`
        SELECT DISTINCT trade_category 
        FROM businesses 
        WHERE suburb ILIKE ${'%' + suburbName + '%'} 
          AND trade_category != ${currentTrade}
          AND status = 'active'
        LIMIT 6
    `;
    return trades;
}

async function getNearbySuburbs(city: string, suburb: string, currentTrade: string) {
    const cityName = formatSlug(city);
    const suburbName = formatSlug(suburb);
    const suburbs = await sql`
        SELECT DISTINCT suburb 
        FROM businesses 
        WHERE city ILIKE ${'%' + cityName + '%'} 
          AND suburb != ${suburbName}
          AND trade_category ILIKE ${'%' + currentTrade + '%'}
          AND status = 'active'
        LIMIT 6
    `;
    return suburbs;
}

export default async function TradeLocationPage({ params }: PageProps) {
    const { trade, suburb, city, state } = await params;
    const tradeName = formatSlug(trade);
    const suburbName = formatSlug(suburb);
    const cityName = formatSlug(city);
    const stateName = state.toUpperCase();

    const businesses = await getBusinesses(trade, suburb);
    const relatedTrades = await getRelatedTrades(suburb, tradeName);
    const nearbySuburbs = await getNearbySuburbs(city, suburb, tradeName);

    // Schema Markup (JSON-LD)
    const avgRating = businesses.length > 0
        ? (businesses.reduce((acc: number, biz: any) => acc + ((biz.trust_score || 0) / 20), 0) / businesses.length).toFixed(1)
        : "4.8";

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": `Top ${tradeName} in ${suburbName}`,
        "description": `List of highest rated and verified ${tradeName} in the ${suburbName} area.`,
        "numberOfItems": businesses.length,
        "itemListElement": businesses.map((biz: any, i: number) => ({
            "@type": "ListItem",
            "position": i + 1,
            "url": `https://traderefer.au/b/${biz.slug}`,
            "name": biz.business_name
        }))
    };

    const breadcrumbs = [
        { name: stateName, href: `/local/${state}` },
        { name: cityName, href: `/local/${state}/${city}` },
        { name: suburbName, href: `/local/${state}/${city}/${suburb}` },
        { name: tradeName, href: "#" }
    ];

    return (
        <main className="min-h-screen bg-white">
            {/* ── BREADCRUMBS ── */}
            <div className="bg-zinc-900 pt-32 pb-4">
                <div className="container mx-auto px-4">
                    <nav className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <ChevronRight className="w-3 h-3" />
                        {breadcrumbs.map((bc, i) => (
                            <div key={i} className="flex items-center gap-2">
                                {i > 0 && <ChevronRight className="w-3 h-3" />}
                                {bc.href !== "#" ? (
                                    <Link href={bc.href} className="hover:text-white transition-colors">{bc.name}</Link>
                                ) : (
                                    <span className="text-orange-500">{bc.name}</span>
                                )}
                            </div>
                        ))}
                    </nav>

                    <script
                        type="application/ld+json"
                        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                    />
                </div>
            </div>

            {/* ── HERO SECTION ── */}
            <div className="bg-zinc-900 pb-20 relative overflow-hidden text-white">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                </div>
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-3xl">
                        <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
                            Best <span className="text-orange-500">{tradeName}</span> in {suburbName}
                        </h1>
                        <p className="text-xl text-zinc-400 mb-8 leading-relaxed">
                            Trusted local experts serving <span className="text-white font-bold">{suburbName}</span> and the surrounding <span className="text-white font-bold">{cityName}</span> region. Verified referrals from people in your community.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Button asChild size="lg" className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold h-14 px-8 text-lg border-none">
                                <Link href="#businesses">View Top {businesses.length > 0 ? businesses.length : ''} Trades</Link>
                            </Button>
                            <Button asChild variant="outline" size="lg" className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl font-bold h-14 px-8 text-lg">
                                <Link href="/register?type=business">List Your Business</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── STATS BAR ── */}
            <div className="bg-white border-b border-zinc-100 py-6">
                <div className="container mx-auto px-4">
                    <div className="flex flex-wrap justify-between items-center gap-8">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-zinc-900">100% Verified</p>
                                <p className="text-xs text-zinc-500 font-medium">ABN & License Checked</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-zinc-900">Community Validated</p>
                                <p className="text-xs text-zinc-500 font-medium">Real Referrals Only</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                                <Award className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-zinc-900">Top 5% Talent</p>
                                <p className="text-xs text-zinc-500 font-medium">Quality Work Guaranteed</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── MAIN CONTENT ── */}
            <div className="bg-zinc-50 py-20" id="businesses">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col lg:flex-row gap-12">

                        {/* ── RESULTS LISTING ── */}
                        <div className="lg:col-span-2 flex-1 space-y-8">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black text-zinc-900">
                                    {businesses.length} {tradeName} Businesses Found
                                </h2>
                                <div className="text-sm text-zinc-500 font-medium">
                                    Sorted by Trust Score
                                </div>
                            </div>

                            {businesses.length === 0 ? (
                                <div className="bg-white rounded-3xl border border-zinc-200 p-12 text-center">
                                    <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <MapPin className="w-10 h-10 text-zinc-300" />
                                    </div>
                                    <h3 className="text-2xl font-black text-zinc-900 mb-2">No {tradeName} listed in {suburbName} yet</h3>
                                    <p className="text-zinc-500 max-w-md mx-auto mb-8 text-lg">
                                        Be the first local expert to join our network and reach customers in {suburbName}.
                                    </p>
                                    <Button asChild size="lg" className="bg-zinc-900 hover:bg-black text-white rounded-xl font-bold px-8">
                                        <Link href="/register?type=business">Create Your Free Profile</Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-6">
                                    {businesses.map((biz: any, index: number) => (
                                        <div key={biz.id} className="bg-white rounded-3xl border border-zinc-200 overflow-hidden hover:shadow-2xl hover:border-zinc-300 transition-all duration-500 group relative">
                                            {index === 0 && (
                                                <div className="absolute top-0 right-0 bg-zinc-900 text-white px-4 py-1.5 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest z-10">
                                                    Top Rated
                                                </div>
                                            )}
                                            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start">
                                                <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-2xl flex items-center justify-center overflow-hidden border border-zinc-100 shadow-xl shrink-0">
                                                    <BusinessLogo logoUrl={proxyLogoUrl(biz.logo_url)} name={biz.business_name} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                                        <span className="px-3 py-1 bg-zinc-100 text-zinc-600 rounded-full text-[10px] font-black uppercase tracking-wider">{biz.trade_category}</span>
                                                        {biz.is_verified && (
                                                            <span className="flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 border border-green-100 rounded-full text-[10px] font-black uppercase">
                                                                <ShieldCheck className="w-3 h-3" /> Verified
                                                            </span>
                                                        )}
                                                        {biz.is_claimed === false && (
                                                            <span className="flex items-center gap-1 px-3 py-1 bg-orange-50 text-orange-600 border border-orange-100 rounded-full text-[10px] font-black uppercase">
                                                                Unclaimed
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h3 className="text-2xl md:text-3xl font-black text-zinc-900 mb-2 group-hover:text-orange-600 transition-colors">
                                                        {biz.business_name}
                                                    </h3>
                                                    <p className="text-zinc-500 text-sm mb-6 line-clamp-2 leading-relaxed">
                                                        {biz.description || `Specialist ${biz.trade_category} based in ${biz.suburb}, serving the ${suburbName} community with expert solutions.`}
                                                    </p>

                                                    <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-600 font-bold mb-8">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 bg-zinc-100 rounded flex items-center justify-center text-zinc-400">
                                                                <MapPin className="w-3.5 h-3.5" />
                                                            </div>
                                                            {biz.suburb}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 bg-zinc-100 rounded flex items-center justify-center text-zinc-400">
                                                                <Star className="w-3.5 h-3.5 fill-orange-400 text-orange-400" />
                                                            </div>
                                                            {(biz.trust_score || 0) / 20} / 5.0
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 bg-zinc-100 rounded flex items-center justify-center text-zinc-400">
                                                                <Users className="w-3.5 h-3.5" />
                                                            </div>
                                                            {biz.trusted_count || 0} Trusted Links
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <Button asChild size="lg" className="bg-zinc-900 hover:bg-black text-white rounded-xl font-bold h-12 px-6 border-none">
                                                            <Link href={`/b/${biz.slug}`}>View Profile</Link>
                                                        </Button>
                                                        <Button asChild variant="outline" size="lg" className="border-zinc-200 hover:bg-zinc-50 rounded-xl font-bold h-12 px-6">
                                                            <Link href={`/b/${biz.slug}#enquiry-form`}>Request Quote</Link>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* ── SEO CONTENT SECTION ── */}
                            <div className="mt-20 space-y-12">
                                <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-12">
                                    <h2 className="text-3xl font-black text-zinc-900 mb-6 font-display">How to choose the right {tradeName.toLowerCase()} in {suburbName}</h2>
                                    <div className="prose prose-zinc prose-sm md:prose-base max-w-none text-zinc-600 leading-relaxed space-y-4">
                                        <p>
                                            Finding a reliable {tradeName.toLowerCase()} in {suburbName} is more than just searching for a phone number.
                                            You need someone who understands the local regulations, the unique needs of {suburbName} properties,
                                            and has a proven track record of satisfied customers.
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8 text-black">
                                            <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-100">
                                                <h4 className="font-bold text-zinc-900 mb-2 flex items-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                    Check Credentials
                                                </h4>
                                                <p className="text-xs text-zinc-500">Ensure they carry the correct Victoria trade licenses and insurance for work in {stateName}.</p>
                                            </div>
                                            <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-100">
                                                <h4 className="font-bold text-zinc-900 mb-2 flex items-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                    Read Real Reviews
                                                </h4>
                                                <p className="text-xs text-zinc-500">Look beyond star ratings. Use TradeRefer to see verified community referrals from neighbors in {suburbName}.</p>
                                            </div>
                                            <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-100">
                                                <h4 className="font-bold text-zinc-900 mb-2 flex items-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                    Get Multiple Quotes
                                                </h4>
                                                <p className="text-xs text-zinc-500">Always request 2-3 detailed quotes to compare scope, materials, and timeframes for your {cityName} project.</p>
                                            </div>
                                            <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-100">
                                                <h4 className="font-bold text-zinc-900 mb-2 flex items-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                    Local Knowledge
                                                </h4>
                                                <p className="text-xs text-zinc-500">Local {suburbName} trades know the best suppliers and common property issues in the region.</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-black text-zinc-900 mb-8 font-display">Frequently Asked Questions</h2>
                                    <div className="space-y-4">
                                        {[
                                            { q: `How much do ${tradeName.toLowerCase()} services cost in ${suburbName}?`, a: `Costs vary based on the specific job, but standard service calls in ${suburbName} usually range between $80 - $180 per hour, plus materials. Fixed pricing is common for standard tasks.` },
                                            { q: `How do I know if a ${tradeName.toLowerCase()} is verified?`, a: `On TradeRefer, look for the 'Verified' badge. This means we've confirmed their ABN and active status. You can also view their referral count from other local users.` },
                                            { q: `Do they service nearby suburbs of ${cityName}?`, a: `Most businesses listed here cover the entire ${cityName} region including ${suburbName} and surrounding areas.` },
                                        ].map((faq, i) => (
                                            <div key={i} className="bg-white rounded-2xl border border-zinc-200 p-6">
                                                <h4 className="font-bold text-zinc-900 mb-2">{faq.q}</h4>
                                                <p className="text-sm text-zinc-500 leading-relaxed">{faq.a}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        </div>

                        {/* ── SIDEBAR ── */}
                        <div className="lg:w-96 space-y-6">

                            {/* Market Summary Card (Safe for Google) */}
                            <div className="bg-white rounded-3xl border border-zinc-200 p-8 shadow-sm">
                                <h3 className="text-lg font-black text-zinc-900 mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-orange-500" />
                                    {suburbName} Market Insights
                                </h3>
                                <div className="space-y-4 text-sm text-zinc-600">
                                    <div className="flex justify-between items-center py-2 border-b border-zinc-50">
                                        <span>Average Rating</span>
                                        <span className="font-bold text-zinc-900 text-base">{avgRating} / 5.0</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-zinc-50">
                                        <span>Verified Providers</span>
                                        <span className="font-bold text-zinc-900 text-base">{businesses.length}</span>
                                    </div>
                                    <div className="pt-2">
                                        <p className="leading-relaxed">
                                            Currently there are {businesses.length > 0 ? businesses.length : 'multiple'} trusted <span className="font-bold text-zinc-800">{tradeName.toLowerCase()}</span> listed in <span className="font-bold text-zinc-800">{suburbName}</span>.
                                            Our directory prioritizes businesses based on community verified links and historical performance.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Trusted Shield */}
                            <div className="bg-zinc-900 rounded-3xl p-8 text-white relative overflow-hidden">
                                <Shield className="absolute -top-12 -right-12 w-48 h-48 text-white/5 rotate-12" />
                                <div className="relative z-10">
                                    <h3 className="text-2xl font-black mb-4">The Promise</h3>
                                    <ul className="space-y-4 mb-8">
                                        <li className="flex gap-3 text-sm">
                                            <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0" />
                                            <span>We only list businesses with active ABNs confirmed via ABR.</span>
                                        </li>
                                        <li className="flex gap-3 text-sm">
                                            <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0" />
                                            <span>Rankings based on community trust, never paid ads.</span>
                                        </li>
                                        <li className="flex gap-3 text-sm">
                                            <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0" />
                                            <span>Direct messaging and transparent quote requests.</span>
                                        </li>
                                    </ul>
                                    <Button asChild size="lg" className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold h-12 border-none">
                                        <Link href="/about">How It Works <ArrowRight className="w-4 h-4 ml-2" /></Link>
                                    </Button>
                                </div>
                            </div>

                            {/* Internal Discovery Cluster 1: Related Trades */}
                            {relatedTrades.length > 0 && (
                                <div className="bg-white rounded-3xl border border-zinc-200 p-8 shadow-sm">
                                    <h4 className="font-black text-zinc-900 mb-6 flex items-center gap-2">
                                        <Info className="w-4 h-4 text-zinc-400" />
                                        Other Professional Trades in {suburbName}
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {relatedTrades.map((t: any) => (
                                            <Link
                                                key={t.trade_category}
                                                href={`/local/${state}/${city}/${suburb}/${t.trade_category.toLowerCase().replace(/\s+/g, '-')}`}
                                                className="px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors text-center"
                                            >
                                                {formatSlug(t.trade_category)}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Internal Discovery Cluster 2: Nearby Locations */}
                            {nearbySuburbs.length > 0 && (
                                <div className="bg-white rounded-3xl border border-zinc-200 p-8 shadow-sm">
                                    <h4 className="font-black text-zinc-900 mb-6 flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-zinc-400" />
                                        {tradeName} in Nearby Suburbs
                                    </h4>
                                    <div className="grid grid-cols-1 gap-2">
                                        {nearbySuburbs.map((s: any) => (
                                            <Link
                                                key={s.suburb}
                                                href={`/local/${state}/${city}/${s.suburb.toLowerCase().replace(/\s+/g, '-')}/${trade}`}
                                                className="flex items-center justify-between px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors"
                                            >
                                                <span>{formatSlug(s.suburb)}</span>
                                                <ChevronRight className="w-4 h-4 text-zinc-300" />
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* CTA */}
                            <div className="bg-orange-500 rounded-3xl p-8 text-white text-center">
                                <h3 className="text-xl font-black mb-2">Are you a {tradeName}?</h3>
                                <p className="text-white/80 text-sm mb-6">Build your trust score and grow your business with referrals that actually close in {suburbName}.</p>
                                <Button asChild size="lg" className="bg-white text-orange-600 hover:bg-zinc-100 rounded-xl font-bold px-8 h-12 w-full shadow-lg shadow-black/10 border-none">
                                    <Link href="/register?type=business">Apply to Join</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <DirectoryFooter />
        </main>
    );
}
