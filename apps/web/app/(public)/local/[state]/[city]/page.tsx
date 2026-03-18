import { sql } from "@/lib/db";
import { ChevronRight, MapPin, Users, Clock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AUSTRALIA_LOCATIONS } from "@/lib/constants";
import { Metadata } from "next";

interface PageProps {
    params: Promise<{ state: string; city: string }>;
    searchParams: Promise<{ category?: string }>;
}

function formatSlug(slug: string) {
    if (!slug) return "";
    try { slug = decodeURIComponent(slug); } catch { /* already decoded */ }
    return slug.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { state, city } = await params;
    const cityName = formatSlug(city);
    const stateUpper = state.toUpperCase();
    const year = new Date().getFullYear();
    return {
        title: `Trusted Tradies in ${cityName} ${stateUpper} (${year}) | TradeRefer`,
        description: `Find ABN-verified trade businesses across ${cityName}, ${stateUpper}. Browse by suburb to discover top-rated plumbers, electricians, painters & more. Free quotes.`,
        alternates: { canonical: `https://traderefer.au/local/${state}/${city}` },
        openGraph: {
            title: `Trusted Tradies in ${cityName} ${stateUpper} (${year}) | TradeRefer`,
            description: `Find ABN-verified trade businesses across ${cityName}, ${stateUpper}. Browse by suburb. Free quotes.`,
        },
        twitter: {
            card: 'summary_large_image',
            title: `Trusted Tradies in ${cityName} ${stateUpper} (${year}) | TradeRefer`,
            description: `Find ABN-verified trade businesses across ${cityName}, ${stateUpper}. Browse by suburb. Free quotes.`,
        },
    };
}

async function getSuburbsInCity(state: string, city: string): Promise<string[]> {
    const stateKey = state.toUpperCase() as keyof typeof AUSTRALIA_LOCATIONS;
    const stateData = AUSTRALIA_LOCATIONS[stateKey];
    if (stateData) {
        const cityName = formatSlug(city);
        const cityEntry = Object.keys(stateData).find(k => k.toLowerCase() === cityName.toLowerCase());
        if (cityEntry) return stateData[cityEntry];
    }
    try {
        const cityName = formatSlug(city);
        const results = await sql`
            SELECT DISTINCT suburb
            FROM businesses
            WHERE status = 'active' AND city ILIKE ${'%' + cityName + '%'}
            ORDER BY suburb ASC
        `;
        return results.map((r: any) => r.suburb).filter(Boolean);
    } catch { return []; }
}

async function getBusinessCountsBySuburb(suburbs: string[]): Promise<Record<string, number>> {
    if (suburbs.length === 0) return {};
    try {
        const results = await sql`
            SELECT suburb, COUNT(*) as count
            FROM businesses
            WHERE status = 'active' AND suburb = ANY(${suburbs})
            GROUP BY suburb
        `;
        const map: Record<string, number> = {};
        results.forEach((r: any) => { map[r.suburb] = parseInt(r.count, 10); });
        return map;
    } catch { return {}; }
}

async function getCityReferralCount(city: string): Promise<number> {
    try {
        const cityName = formatSlug(city);
        const result = await sql`
            SELECT COUNT(*) as count FROM referral_links rl
            JOIN businesses b ON rl.business_id = b.id
            WHERE b.city ILIKE ${'%' + cityName + '%'}
              AND rl.created_at > NOW() - INTERVAL '30 days'
        `;
        return parseInt(result[0]?.count ?? '0', 10);
    } catch { return 0; }
}

export default async function CityDirectoryPage({ params, searchParams }: PageProps) {
    const { state, city } = await params;
    const { category } = await searchParams;
    const catParam = category ? `?category=${encodeURIComponent(category)}` : '';
    const cityName = formatSlug(city);
    const stateUpper = state.toUpperCase();

    const suburbs = await getSuburbsInCity(state, city);
    if (suburbs.length === 0) notFound();

    const [businessCounts, referralCount] = await Promise.all([
        getBusinessCountsBySuburb(suburbs),
        getCityReferralCount(city),
    ]);
    const totalBusinesses = Object.values(businessCounts).reduce((a, b) => a + b, 0);

    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://traderefer.au" },
            { "@type": "ListItem", "position": 2, "name": "Directory", "item": "https://traderefer.au/local" },
            { "@type": "ListItem", "position": 3, "name": stateUpper, "item": `https://traderefer.au/local/${state}` },
            { "@type": "ListItem", "position": 4, "name": `Top ${cityName} Tradies` },
        ]
    };

    const localBusinessJsonLd = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": `Trade Services in ${cityName}`,
        "description": `Verified local tradies across ${cityName}, ${stateUpper}. ABN-checked, community-ranked.`,
        "url": `https://traderefer.au/local/${state}/${city}`,
        "areaServed": {
            "@type": "City",
            "name": cityName,
            "containedInPlace": { "@type": "AdministrativeArea", "name": stateUpper }
        }
    };

    return (
        <>
        <main className="min-h-screen bg-[#FCFCFC]">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }} />

            {/* ── BREADCRUMBS ── */}
            <div className="bg-gray-100 border-b border-gray-200" style={{ paddingTop: '108px', paddingBottom: '12px' }}>
                <div className="container mx-auto px-4">
                    <nav className="flex items-center gap-2 font-bold text-gray-500 uppercase tracking-widest" style={{ fontSize: '16px' }}>
                        <Link href="/" className="hover:text-[#FF6600] transition-colors">Home</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href="/local" className="hover:text-[#FF6600] transition-colors">Directory</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href={`/local/${state}`} className="hover:text-[#FF6600] transition-colors">{stateUpper}</Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-[#FF6600]">{cityName}</span>
                    </nav>
                </div>
            </div>

            {/* ── HERO ── */}
            <div className="bg-[#FCFCFC] pb-20 pt-12 relative overflow-hidden border-b border-gray-200">
                <div className="absolute inset-0 z-0 bg-cover bg-center opacity-8" style={{ backgroundImage: 'url(\'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=2670&auto=format&fit=crop\')' }} />
                <div className="absolute inset-0 z-0 bg-[#FCFCFC]/85" />
                <div className="container mx-auto px-4 relative z-10">
                    {/* BLUF snippet */}
                    <div className="bg-white border-l-4 border-[#FF6600] rounded-xl px-6 py-4 max-w-3xl mb-8">
                        <p className="text-[#1A1A1A]" style={{ fontSize: '18px', lineHeight: 1.7 }}>
                            {totalBusinesses > 0
                                ? `${cityName} has ${totalBusinesses.toLocaleString()} ABN-verified trade businesses across ${suburbs.length} suburbs. TradeRefer eliminates the $21 upfront lead risk — ${cityName} pros only pay when they win the job.`
                                : `${cityName} verified trade directory across ${suburbs.length > 0 ? suburbs.length : 'all'} suburbs. Find ABN-checked local experts. TradeRefer eliminates upfront lead risk for all ${cityName} tradies.`
                            }
                        </p>
                    </div>
                    <div className="max-w-4xl">
                        <h1 className="text-[42px] md:text-7xl lg:text-[80px] font-black mb-6 leading-[1.1] text-[#1A1A1A] font-display">
                            Trades in <span className="text-[#FF6600]">{cityName}</span>, {stateUpper}
                        </h1>
                        <p className="text-gray-600 mb-4 max-w-2xl" style={{ fontSize: '20px', lineHeight: 1.7 }}>
                            {totalBusinesses > 0
                                ? `${totalBusinesses.toLocaleString()} verified tradespeople across ${suburbs.length} suburbs in ${cityName}. Find the right expert for your job.`
                                : `Find verified local trade businesses across ${cityName}, ${stateUpper}. Browse by suburb to connect with experts near you.`
                            }
                        </p>
                        {suburbs.length > 0 && (
                            <p className="text-gray-400 font-medium" style={{ fontSize: '16px' }}>
                                Servicing {cityName} including {suburbs.slice(0, 3).join(', ')}{suburbs.length > 3 ? ` and ${suburbs.length - 3} more suburbs` : ''}.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* ── MAIN CONTENT ── */}
            <div className="py-20">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto space-y-12">

                        {/* Stats + urgency bar */}
                        <div className="flex flex-wrap gap-4 items-center">
                            {totalBusinesses > 0 && (
                                <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-full px-5 py-2.5">
                                    <Users className="w-4 h-4 text-orange-500" />
                                    <span className="font-bold text-zinc-700" style={{ fontSize: '16px' }}>{totalBusinesses.toLocaleString()} verified businesses</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-full px-5 py-2.5">
                                <MapPin className="w-4 h-4 text-orange-500" />
                                <span className="font-bold text-zinc-700" style={{ fontSize: '16px' }}>{suburbs.length} suburbs covered</span>
                            </div>
                            {referralCount > 0 && (
                                <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-full px-5 py-2.5">
                                    <Clock className="w-4 h-4 text-green-600" />
                                    <span className="font-bold text-green-700" style={{ fontSize: '16px' }}>{referralCount.toLocaleString()} referrals matched in {cityName} (last 30 days)</span>
                                </div>
                            )}
                        </div>

                        {/* Suburb grid */}
                        <section>
                            <h2 className="font-black text-[#1A1A1A] mb-2 font-display" style={{ fontSize: '32px' }}>Browse by Suburb</h2>
                            <p className="text-gray-500 mb-8" style={{ fontSize: '20px', lineHeight: 1.7 }}>Select your suburb to find verified local trade experts near you.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {suburbs.map((suburb) => {
                                    const count = businessCounts[suburb] || 0;
                                    const suburbSlug = suburb.toLowerCase().replace(/ /g, '-');
                                    return (
                                        <Link key={suburb} href={`/local/${state}/${city}/${suburbSlug}${catParam}`} className="group">
                                            <div className="bg-white rounded-2xl border-2 border-zinc-200 hover:border-[#FF6600] hover:shadow-lg transition-all duration-300 p-5">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-black text-[#1A1A1A] group-hover:text-[#FF6600] transition-colors" style={{ fontSize: '22px' }}>
                                                        {suburb}
                                                    </span>
                                                    <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-[#FF6600] shrink-0 group-hover:translate-x-0.5 transition-all" />
                                                </div>
                                                {count > 0 ? (
                                                    <div>
                                                        <span className="text-2xl font-black text-[#FF6600]">{count}</span>
                                                        <span className="text-zinc-400 font-bold uppercase tracking-wider ml-2" style={{ fontSize: '16px' }}>Verified Pros</span>
                                                    </div>
                                                ) : (
                                                    <p className="text-zinc-400 font-medium" style={{ fontSize: '16px' }}>Browse trades</p>
                                                )}
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Trust signal */}
                        <div className="flex flex-wrap items-center gap-6 bg-white rounded-2xl border border-zinc-200 p-6">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-green-500" />
                                <span className="font-bold text-zinc-700" style={{ fontSize: '16px' }}>100% ABN verified</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-orange-500" />
                                <span className="font-bold text-zinc-700" style={{ fontSize: '16px' }}>Community-ranked, not paid ads</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-blue-500" />
                                <span className="font-bold text-zinc-700" style={{ fontSize: '16px' }}>Local experts only</span>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </main>
        </>
    );
}
