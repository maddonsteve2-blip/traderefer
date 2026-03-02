import { sql } from "@/lib/db";
import { ChevronRight, MapPin, Users, Clock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AUSTRALIA_LOCATIONS } from "@/lib/constants";
import { Metadata } from "next";

interface PageProps {
    params: Promise<{ state: string; city: string }>;
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
    return {
        title: `Top ${cityName} Tradies — 100% ABN Verified | TradeRefer`,
        description: `Find verified local trade businesses across ${cityName}, ${stateUpper}. Browse by suburb to discover top-rated plumbers, electricians, painters and more in your area.`,
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

export default async function CityDirectoryPage({ params }: PageProps) {
    const { state, city } = await params;
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
        <main className="min-h-screen bg-[#FCFCFC]">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }} />

            {/* ── BREADCRUMBS ── */}
            <div className="bg-zinc-900 pt-32 pb-4">
                <div className="container mx-auto px-4">
                    <nav className="flex items-center gap-2 text-sm font-bold text-zinc-500 uppercase tracking-widest">
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href="/local" className="hover:text-white transition-colors">Directory</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href={`/local/${state}`} className="hover:text-white transition-colors">{stateUpper}</Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-orange-500">{cityName}</span>
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
                            Trades in <span className="text-orange-500">{cityName}</span>, {stateUpper}
                        </h1>
                        <p className="text-xl text-zinc-400 mb-4 leading-[1.6] max-w-2xl">
                            {totalBusinesses > 0
                                ? `${totalBusinesses.toLocaleString()} verified tradespeople across ${suburbs.length} suburbs in ${cityName}. Find the right expert for your job.`
                                : `Find verified local trade businesses across ${cityName}, ${stateUpper}. Browse by suburb to connect with experts near you.`
                            }
                        </p>
                        {suburbs.length > 0 && (
                            <p className="text-zinc-500 text-sm font-medium">
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
                                    <span className="text-sm font-bold text-zinc-700">{totalBusinesses.toLocaleString()} verified businesses</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-full px-5 py-2.5">
                                <MapPin className="w-4 h-4 text-orange-500" />
                                <span className="text-sm font-bold text-zinc-700">{suburbs.length} suburbs covered</span>
                            </div>
                            {referralCount > 0 && (
                                <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-full px-5 py-2.5">
                                    <Clock className="w-4 h-4 text-green-600" />
                                    <span className="text-sm font-bold text-green-700">{referralCount.toLocaleString()} referrals matched in {cityName} (last 30 days)</span>
                                </div>
                            )}
                        </div>

                        {/* Suburb grid */}
                        <section>
                            <h2 className="text-2xl font-black text-zinc-900 mb-2">Browse by Suburb</h2>
                            <p className="text-lg text-zinc-500 mb-8 leading-[1.6]">Select your suburb to find verified local trade experts near you.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {suburbs.map((suburb) => {
                                    const count = businessCounts[suburb] || 0;
                                    const suburbSlug = suburb.toLowerCase().replace(/ /g, '-');
                                    return (
                                        <Link key={suburb} href={`/local/${state}/${city}/${suburbSlug}`} className="group">
                                            <div className="bg-white rounded-2xl border border-zinc-200 hover:border-orange-500 hover:shadow-lg transition-all duration-300 p-5">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-base font-black text-zinc-800 group-hover:text-orange-600 transition-colors">
                                                        {suburb}
                                                    </span>
                                                    <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-orange-500 shrink-0 group-hover:translate-x-0.5 transition-all" />
                                                </div>
                                                {count > 0 ? (
                                                    <div>
                                                        <span className="text-lg font-black text-orange-500">{count}</span>
                                                        <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider ml-1.5">Verified Pros</span>
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-zinc-400 font-medium">Browse trades</p>
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
                                <span className="text-sm font-bold text-zinc-700">100% ABN verified</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-orange-500" />
                                <span className="text-sm font-bold text-zinc-700">Community-ranked, not paid ads</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-blue-500" />
                                <span className="text-sm font-bold text-zinc-700">Local experts only</span>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </main>
    );
}
