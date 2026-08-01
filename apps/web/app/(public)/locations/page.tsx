import { sql } from "@/lib/db";
import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, MapPin, Users, Building2, ArrowRight } from "lucide-react";
import { buildOgImageUrl } from "@/lib/og-image";

export const dynamic = "force-dynamic";

const locationsOgImage = buildOgImageUrl({
    template: "home",
    title: "Find tradies by location",
    subtitle: "Every Australian state, city and suburb — local trade profiles with ABN and review signals.",
    eyebrow: "TradeRefer locations",
    badge: "All states",
    stat1: "8 states",
    stat2: "80+ cities",
    stat3: "1,000+ suburbs",
});

export const metadata: Metadata = {
    title: "Find Tradies by Location — Every State & City | TradeRefer",
    description: "Browse Australian trade profiles by location. Find electricians, plumbers, painters and more by state, city, and suburb with ABN and public review signals where available.",
    alternates: { canonical: "https://traderefer.au/locations" },
    openGraph: {
        title: "Find Local Tradies by Location | TradeRefer Australia",
        description: "All Australian states, cities and suburbs. Find local trade profiles near you.",
        url: "https://traderefer.au/locations",
        siteName: "TradeRefer",
        type: "website",
        images: [{ url: locationsOgImage, width: 1200, height: 630, alt: "Find tradies by location on TradeRefer" }],
    },
    twitter: {
        card: "summary_large_image",
        title: "Find Local Tradies by Location | TradeRefer Australia",
        description: "All Australian states, cities and suburbs. Find local trade profiles near you.",
        images: [locationsOgImage],
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
        <main className="min-h-screen bg-[#FCFCFC]">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />

            {/* Hero */}
            <div className="bg-[#1A1A1A] pt-32 pb-16 text-white">
                <div className="container mx-auto px-4">
                    <nav className="flex items-center gap-2 font-bold text-zinc-500 uppercase tracking-widest mb-8" style={{ fontSize: '16px' }}>
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-[#FF6600]">All Locations</span>
                    </nav>
                    <div className="flex items-center gap-3 text-[#FF6600] font-black uppercase tracking-widest mb-4" style={{ fontSize: '16px' }}>
                        <MapPin className="w-5 h-5" />
                        Location Directory
                    </div>
                    <h1 className="font-black mb-6 leading-[1.1] font-display text-white" style={{ fontSize: 'clamp(48px, 8vw, 80px)' }}>
                        Find Local Tradies <span className="text-[#FF6600]">by Location</span>
                    </h1>
                    <p className="text-zinc-400 max-w-2xl mb-8" style={{ fontSize: '20px', lineHeight: 1.7 }}>
                        Browse Australian trade profiles by state and city. TradeRefer uses ABN, location, category, public review, and referral signals where available.
                    </p>
                    <div className="flex flex-wrap gap-6 text-white font-bold" style={{ fontSize: '16px' }}>
                        <span className="flex items-center gap-2"><Users className="w-4 h-4 text-[#FF6600]" />{totalBusinesses.toLocaleString()} trade profiles</span>
                        <span className="flex items-center gap-2"><Building2 className="w-4 h-4 text-[#FF6600]" />{totalCities} cities</span>
                        <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#FF6600]" />{totalSuburbs} suburbs</span>
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
                                            <h2 className="font-black text-zinc-900 group-hover:text-[#FF6600] transition-colors flex items-center gap-2" style={{ fontSize: '32px' }}>
                                                {stateName}
                                                <ArrowRight className="w-6 h-6 text-zinc-300 group-hover:text-[#FF6600] transition-colors" />
                                            </h2>
                                        </Link>
                                        <p className="text-zinc-600 mt-1" style={{ fontSize: '16px' }}>
                                            {cities.length} {cities.length === 1 ? 'city' : 'cities'} · {stateSubs} suburbs · {stateBiz.toLocaleString()} businesses
                                        </p>
                                    </div>
                                    <Link
                                        href={`/local/${stateSlug}`}
                                        className="hidden md:flex items-center gap-2 font-black text-zinc-600 hover:text-[#FF6600] uppercase tracking-widest transition-colors" style={{ fontSize: '16px' }}
                                    >
                                        View All in {state}
                                        <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>

                                {/* Cities grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {cities.map(({ city, count, suburbs }) => {
                                        const citySlug = city.toLowerCase().replace(/\s+/g, '-');
                                        return (
                                            <Link
                                                key={city}
                                                href={`/local/${stateSlug}/${citySlug}`}
                                                className="group bg-white rounded-2xl border-2 border-zinc-200 p-5 hover:border-[#FF6600] hover:shadow-lg transition-all duration-300"
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <span className="font-black text-zinc-900 group-hover:text-[#FF6600] transition-colors leading-tight" style={{ fontSize: '20px' }}>{city}</span>
                                                    <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-[#FF6600] shrink-0 transition-colors mt-0.5" />
                                                </div>
                                                <div className="space-y-1" style={{ fontSize: '16px' }}>
                                                    <div className="flex items-center gap-1.5 text-zinc-600 font-bold">
                                                        <Users className="w-4 h-4 text-[#FF6600]" />
                                                        {count} businesses
                                                    </div>
                                                    <div className="text-zinc-600 font-medium">{suburbs} suburbs</div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </section>
                        );
                    })}

                    {/* CTA */}
                    <section className="bg-[#1A1A1A] rounded-3xl p-8 md:p-10 text-white text-center mt-16">
                        <h2 className="font-black mb-4 text-white" style={{ fontSize: '32px' }}>Can&apos;t find your suburb?</h2>
                        <p className="text-zinc-400 mb-8 max-w-lg mx-auto" style={{ fontSize: '20px', lineHeight: 1.7 }}>We&apos;re growing every week. List your business or browse all trade categories to find what you need.</p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            <Link href="/register?type=business" className="bg-[#FF6600] hover:bg-[#E65C00] text-white font-black px-8 rounded-xl transition-colors inline-flex items-center justify-center" style={{ minHeight: '64px', fontSize: '18px' }}>
                                List Your Business Free
                            </Link>
                            <Link href="/categories" className="bg-white/10 hover:bg-white/20 text-white font-black px-8 rounded-xl transition-colors border border-white/10 inline-flex items-center justify-center" style={{ minHeight: '64px', fontSize: '18px' }}>
                                Browse All Trades
                            </Link>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
