import { sql } from "@/lib/db";
import { Metadata } from "next";
import Link from "next/link";
import { DirectoryFooter } from "@/components/DirectoryFooter";
import { ChevronRight, MapPin, Users, Building2, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Find Local Tradies by Location | All Australian States & Cities | TradeRefer",
    description: "Browse verified local tradies by location across all Australian states and cities. Find electricians, plumbers, painters and more in your suburb. ABN-verified, community-ranked.",
    openGraph: {
        title: "Find Local Tradies by Location | TradeRefer Australia",
        description: "All 8 Australian states, 89 cities, 997 suburbs. Find verified local tradies near you.",
    },
};

const STATE_NAMES: Record<string, string> = {
    NSW: "New South Wales",
    VIC: "Victoria",
    QLD: "Queensland",
    WA: "Western Australia",
    SA: "South Australia",
    TAS: "Tasmania",
    ACT: "Australian Capital Territory",
    NT: "Northern Territory",
};

const STATE_ORDER = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

async function getLocationStats(): Promise<Array<{
    state: string;
    cities: Array<{ city: string; count: number; suburbs: number }>;
    totalBusinesses: number;
    totalSuburbs: number;
}>> {
    try {
        const results = await sql`
            SELECT
                state,
                city,
                COUNT(*) as businesses,
                COUNT(DISTINCT suburb) as suburbs
            FROM businesses
            WHERE status = 'active'
              AND state IS NOT NULL
              AND city IS NOT NULL AND city != ''
            GROUP BY state, city
            ORDER BY state ASC, businesses DESC
        `;

        const stateMap: Record<string, { cities: Array<{ city: string; count: number; suburbs: number }>; totalBusinesses: number; totalSuburbs: number }> = {};

        for (const row of results) {
            const s = row.state as string;
            if (!stateMap[s]) {
                stateMap[s] = { cities: [], totalBusinesses: 0, totalSuburbs: 0 };
            }
            const count = parseInt(row.businesses, 10);
            const suburbs = parseInt(row.suburbs, 10);
            stateMap[s].cities.push({ city: row.city as string, count, suburbs });
            stateMap[s].totalBusinesses += count;
            stateMap[s].totalSuburbs += suburbs;
        }

        return STATE_ORDER
            .filter(s => stateMap[s])
            .map(s => ({
                state: s,
                ...stateMap[s],
            }));
    } catch {
        return [];
    }
}

const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://traderefer.au" },
        { "@type": "ListItem", "position": 2, "name": "All Locations" },
    ]
};

export default async function LocationsPage() {
    const states = await getLocationStats();
    const totalBusinesses = states.reduce((sum, s) => sum + s.totalBusinesses, 0);
    const totalCities = states.reduce((sum, s) => sum + s.cities.length, 0);
    const totalSuburbs = states.reduce((sum, s) => sum + s.totalSuburbs, 0);

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
                        <span className="text-orange-400">All Locations</span>
                    </nav>
                    <div className="flex items-center gap-3 text-orange-500 font-black text-sm uppercase tracking-widest mb-4">
                        <MapPin className="w-5 h-5" />
                        Location Directory
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
                        Find Local Tradies <span className="text-orange-500">by Location</span>
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl mb-8">
                        Browse verified tradies across all Australian states and cities. Every business is ABN-verified and ranked by real community referrals.
                    </p>
                    <div className="flex flex-wrap gap-6 text-sm text-zinc-400 font-medium">
                        <span className="flex items-center gap-2"><Users className="w-4 h-4 text-orange-500" />{totalBusinesses.toLocaleString()} verified businesses</span>
                        <span className="flex items-center gap-2"><Building2 className="w-4 h-4 text-orange-500" />{totalCities} cities</span>
                        <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-orange-500" />{totalSuburbs} suburbs</span>
                    </div>
                </div>
            </div>

            {/* States + Cities */}
            <div className="container mx-auto px-4 py-16">
                <div className="max-w-7xl mx-auto space-y-12">
                    {states.map(({ state, cities, totalBusinesses: stateBiz, totalSuburbs: stateSubs }) => {
                        const stateSlug = state.toLowerCase();
                        const stateName = STATE_NAMES[state] || state;
                        return (
                            <section key={state} id={stateSlug}>
                                {/* State header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <Link href={`/local/${stateSlug}`} className="group">
                                            <h2 className="text-2xl font-black text-zinc-900 group-hover:text-orange-600 transition-colors flex items-center gap-2">
                                                {stateName}
                                                <ArrowRight className="w-5 h-5 text-zinc-300 group-hover:text-orange-500 transition-colors" />
                                            </h2>
                                        </Link>
                                        <p className="text-sm text-zinc-500 mt-1">
                                            {cities.length} {cities.length === 1 ? 'city' : 'cities'} · {stateSubs} suburbs · {stateBiz.toLocaleString()} businesses
                                        </p>
                                    </div>
                                    <Link
                                        href={`/local/${stateSlug}`}
                                        className="hidden md:flex items-center gap-2 text-xs font-black text-zinc-500 hover:text-orange-600 uppercase tracking-widest transition-colors"
                                    >
                                        View All in {state}
                                        <ChevronRight className="w-3 h-3" />
                                    </Link>
                                </div>

                                {/* Cities grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                    {cities.map(({ city, count, suburbs }) => {
                                        const citySlug = city.toLowerCase().replace(/\s+/g, '-');
                                        return (
                                            <Link
                                                key={city}
                                                href={`/local/${stateSlug}/${citySlug}`}
                                                className="group bg-white rounded-2xl border border-zinc-200 p-4 hover:border-orange-400 hover:shadow-md transition-all duration-300"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <span className="font-black text-sm text-zinc-900 group-hover:text-orange-600 transition-colors leading-tight">{city}</span>
                                                    <ChevronRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-orange-500 shrink-0 transition-colors" />
                                                </div>
                                                <div className="text-[11px] text-zinc-500 font-medium space-y-0.5">
                                                    <div className="flex items-center gap-1">
                                                        <Users className="w-3 h-3 text-orange-400" />
                                                        {count} businesses
                                                    </div>
                                                    <div>{suburbs} suburbs</div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </section>
                        );
                    })}

                    {/* CTA */}
                    <section className="bg-zinc-900 rounded-3xl p-8 md:p-10 text-white text-center mt-16">
                        <h2 className="text-2xl font-black mb-2">Can't find your suburb?</h2>
                        <p className="text-zinc-400 mb-6 max-w-lg mx-auto">We're growing every week. List your business or browse all trade categories to find what you need.</p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            <Link href="/register?type=business" className="bg-orange-500 hover:bg-orange-600 text-white font-black px-8 py-3 rounded-xl transition-colors">
                                List Your Business Free
                            </Link>
                            <Link href="/categories" className="bg-white/10 hover:bg-white/20 text-white font-black px-8 py-3 rounded-xl transition-colors border border-white/10">
                                Browse All Trades
                            </Link>
                        </div>
                    </section>
                </div>
            </div>

            <DirectoryFooter />
        </main>
    );
}
