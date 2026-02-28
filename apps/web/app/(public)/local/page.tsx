import { sql } from "@/lib/db";
import { ChevronRight, MapPin, Users, Building2 } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";
import { DirectoryFooter } from "@/components/DirectoryFooter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Local Trade Directory | Find Trusted Trades in Australia | TradeRefer",
    description: "Browse verified local tradies across all Australian states and cities. Find electricians, plumbers, painters and more in your suburb. ABN-verified, community-ranked."
};

const STATE_NAMES: Record<string, string> = {
    NSW: "New South Wales", VIC: "Victoria", QLD: "Queensland",
    WA: "Western Australia", SA: "South Australia", TAS: "Tasmania",
    ACT: "Australian Capital Territory", NT: "Northern Territory",
};
const STATE_ORDER = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

async function getStatesWithCities() {
    try {
        const results = await sql`
            SELECT state, city, COUNT(*) as businesses
            FROM businesses
            WHERE status = 'active' AND state IS NOT NULL AND city IS NOT NULL AND city != ''
            GROUP BY state, city
            ORDER BY state ASC, businesses DESC
        `;
        const map: Record<string, { cities: Array<{ name: string; count: number }>; total: number }> = {};
        for (const row of results) {
            const s = row.state as string;
            if (!map[s]) map[s] = { cities: [], total: 0 };
            const count = parseInt(row.businesses, 10);
            map[s].cities.push({ name: row.city as string, count });
            map[s].total += count;
        }
        return STATE_ORDER.filter(s => map[s]).map(s => ({
            state: s,
            name: STATE_NAMES[s] || s,
            slug: s.toLowerCase(),
            cities: map[s].cities.slice(0, 6),
            total: map[s].total,
            cityCount: map[s].cities.length,
        }));
    } catch {
        return [];
    }
}

export default async function LocalDirectoryPage() {
    const states = await getStatesWithCities();
    const totalBusinesses = states.reduce((sum, s) => sum + s.total, 0);

    return (
        <main className="min-h-screen bg-white pt-40 pb-32">
            <div className="container mx-auto px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center gap-3 text-orange-600 font-black text-base uppercase tracking-[0.2em] mb-6">
                        <MapPin className="w-6 h-6" />
                        Directory
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-zinc-900 mb-6 font-display tracking-tight leading-[1.1]">
                        Local Service Directory
                    </h1>
                    <p className="text-xl md:text-2xl text-zinc-600 mb-6 leading-relaxed font-medium max-w-3xl">
                        Find verified, community-recommended trades across Australia. {totalBusinesses.toLocaleString()} ABN-verified businesses across {states.length} states.
                    </p>
                    <div className="flex flex-wrap gap-4 mb-12 text-sm font-medium text-zinc-500">
                        <Link href="/categories" className="flex items-center gap-1.5 hover:text-orange-600 transition-colors">
                            <ChevronRight className="w-3 h-3" /> Browse by Trade Category
                        </Link>
                        <Link href="/locations" className="flex items-center gap-1.5 hover:text-orange-600 transition-colors">
                            <ChevronRight className="w-3 h-3" /> Browse All Cities &amp; Suburbs
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {states.map((state) => (
                            <Link key={state.slug} href={`/local/${state.slug}`} className="group">
                                <div className="bg-white p-8 rounded-[32px] border-2 border-zinc-100 hover:border-orange-500 hover:shadow-2xl hover:shadow-orange-500/5 transition-all duration-500 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-orange-500/10 transition-colors" />
                                    <div className="flex items-center justify-between mb-4 relative z-10">
                                        <h2 className="text-2xl font-black text-zinc-900 group-hover:text-orange-600 transition-colors tracking-tight">
                                            {state.name}
                                        </h2>
                                        <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-300 group-hover:text-orange-600 group-hover:bg-orange-50 group-hover:scale-110 transition-all">
                                            <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs font-bold text-zinc-500 mb-5 relative z-10">
                                        <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-orange-500" />{state.total.toLocaleString()} businesses</span>
                                        <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-orange-500" />{state.cityCount} cities</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 relative z-10">
                                        {state.cities.map(city => (
                                            <span key={city.name} className="px-4 py-2 bg-zinc-50 border border-zinc-100 text-zinc-700 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm group-hover:bg-white transition-colors">
                                                {city.name}
                                            </span>
                                        ))}
                                        {state.cityCount > 6 && (
                                            <span className="px-4 py-2 bg-zinc-100 text-zinc-500 rounded-xl text-xs font-black uppercase tracking-widest">
                                                +{state.cityCount - 6} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
            <DirectoryFooter />
        </main>
    );
}
