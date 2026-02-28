import { sql } from "@/lib/db";
import { ChevronRight, MapPin, Users, Briefcase } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DirectoryFooter } from "@/components/DirectoryFooter";
import { AUSTRALIA_LOCATIONS } from "@/lib/constants";
import { Metadata } from "next";

interface PageProps {
    params: Promise<{ state: string; city: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { state, city } = await params;
    const cityName = formatSlug(city);
    const stateUpper = state.toUpperCase();
    return {
        title: `Trades in ${cityName}, ${stateUpper} | Find Local Experts | TradeRefer`,
        description: `Find verified local trade businesses across ${cityName}, ${stateUpper}. Browse by suburb to discover top-rated plumbers, electricians, painters and more in your area.`,
    };
}

function formatSlug(slug: string) {
    return slug
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

async function getSuburbsInCity(state: string, city: string): Promise<string[]> {
    const stateKey = state.toUpperCase() as keyof typeof AUSTRALIA_LOCATIONS;
    const stateData = AUSTRALIA_LOCATIONS[stateKey];
    if (!stateData) return [];

    const cityName = formatSlug(city);
    const cityEntry = Object.keys(stateData).find(
        k => k.toLowerCase() === cityName.toLowerCase()
    );
    if (cityEntry) return stateData[cityEntry];

    // Fallback: query DB for suburbs that match this city
    try {
        const results = await sql`
            SELECT DISTINCT suburb
            FROM businesses
            WHERE status = 'active'
              AND city ILIKE ${'%' + cityName + '%'}
            ORDER BY suburb ASC
        `;
        return results.map((r: any) => r.suburb).filter(Boolean);
    } catch (error) {
        console.error("Error fetching suburbs:", error);
        return [];
    }
}

async function getBusinessCountsBySuburb(suburbs: string[]): Promise<Record<string, number>> {
    if (suburbs.length === 0) return {};
    try {
        const results = await sql`
            SELECT suburb, COUNT(*) as count
            FROM businesses
            WHERE status = 'active'
              AND suburb = ANY(${suburbs})
            GROUP BY suburb
        `;
        const map: Record<string, number> = {};
        results.forEach((r: any) => { map[r.suburb] = parseInt(r.count, 10); });
        return map;
    } catch {
        return {};
    }
}


export default async function CityDirectoryPage({ params }: PageProps) {
    const { state, city } = await params;
    const cityName = formatSlug(city);
    const stateUpper = state.toUpperCase();

    const suburbs = await getSuburbsInCity(state, city);
    if (suburbs.length === 0) notFound();

    const businessCounts = await getBusinessCountsBySuburb(suburbs);
    const totalBusinesses = Object.values(businessCounts).reduce((a, b) => a + b, 0);

    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://traderefer.au" },
            { "@type": "ListItem", "position": 2, "name": "Directory", "item": "https://traderefer.au/local" },
            { "@type": "ListItem", "position": 3, "name": stateUpper, "item": `https://traderefer.au/local/${state}` },
            { "@type": "ListItem", "position": 4, "name": `Trades in ${cityName}` },
        ]
    };

    return (
        <main className="min-h-screen bg-zinc-50 pt-32 pb-20">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />
            <div className="container mx-auto px-4">
                <div className="max-w-5xl mx-auto">
                    <nav className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest mb-8">
                        <Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href="/local" className="hover:text-zinc-900 transition-colors">Directory</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href={`/local/${state}`} className="hover:text-zinc-900 transition-colors">{stateUpper}</Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-orange-600">{cityName}</span>
                    </nav>

                    <h1 className="text-4xl md:text-5xl font-black text-zinc-900 mb-4 font-display">
                        Trades in {cityName}, {stateUpper}
                    </h1>
                    <p className="text-xl text-zinc-600 mb-4 leading-relaxed max-w-3xl">
                        Find highly-rated trades across {cityName}. Browse by suburb below to find verified local experts near you.
                    </p>
                    {totalBusinesses > 0 && (
                        <div className="flex items-center gap-6 mb-12 text-sm text-zinc-500 font-medium">
                            <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-orange-500" />{totalBusinesses} verified businesses</span>
                            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-orange-500" />{suburbs.length} suburbs covered</span>
                        </div>
                    )}
                    {!totalBusinesses && <div className="mb-12" />}

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {suburbs.map((suburb) => {
                            const count = businessCounts[suburb] || 0;
                            const suburbSlug = suburb.toLowerCase().replace(/ /g, '-');
                            return (
                                <Link key={suburb} href={`/local/${state}/${city}/${suburbSlug}`} className="group">
                                    <div className="bg-white p-4 rounded-xl border border-zinc-200 hover:border-orange-500 hover:shadow-md transition-all duration-300">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-bold text-zinc-700 group-hover:text-orange-600 transition-colors">
                                                {suburb}
                                            </span>
                                            <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-orange-500 transition-all shrink-0" />
                                        </div>
                                        {count > 0 && (
                                            <p className="text-xs text-zinc-400 font-medium">{count} business{count !== 1 ? 'es' : ''}</p>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
            <DirectoryFooter />
        </main>
    );
}
