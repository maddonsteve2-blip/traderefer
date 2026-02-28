import { sql } from "@/lib/db";
import { ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DirectoryFooter } from "@/components/DirectoryFooter";

interface PageProps {
    params: Promise<{ state: string; city: string }>;
}

function formatSlug(slug: string) {
    return slug
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

async function getSuburbsInCity(city: string) {
    try {
        const cityName = formatSlug(city);
        // We look for any business that has been tagged with this city or has a suburb we know belongs to this city
        // For now, we'll query for unique suburbs that have active businesses
        const results = await sql`
            SELECT DISTINCT suburb 
            FROM businesses 
            WHERE status = 'active'
            ORDER BY suburb ASC
        `;
        return results.map(r => r.suburb);
    } catch (error) {
        console.error("Error fetching suburbs:", error);
        return [];
    }
}

// Fallback list to ensure we always have links for SEO crawlability even before data is fully imported
const DEFAULT_SUBURBS: Record<string, string[]> = {
    "geelong": [
        "Geelong", "Belmont", "Highton", "Grovedale", "Lara", "Corio", "Torquay",
        "Ocean Grove", "Barwon Heads", "Leopold", "Newcomb", "Whittington",
        "Thomson", "East Geelong", "South Geelong", "West Geelong", "North Geelong",
        "Hamlyn Heights", "Herne Hill", "Manifold Heights", "Newtown", "Geelong West",
        "Bell Park", "Bell Post Hill", "Norlane", "Marshall", "Armstrong Creek"
    ]
};

export default async function CityDirectoryPage({ params }: PageProps) {
    const { state, city } = await params;
    const cityName = formatSlug(city);

    const dbSuburbs = await getSuburbsInCity(city);
    const fallbackSuburbs = DEFAULT_SUBURBS[city.toLowerCase()] || [];

    // Merge and deduplicate
    const suburbs = Array.from(new Set([...dbSuburbs, ...fallbackSuburbs])).sort();

    return (
        <main className="min-h-screen bg-zinc-50 pt-32 pb-20">
            <div className="container mx-auto px-4">
                <div className="max-w-5xl mx-auto">
                    <nav className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest mb-8">
                        <Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href="/local" className="hover:text-zinc-900 transition-colors">Directory</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href={`/local/${state}`} className="hover:text-zinc-900 transition-colors">{state.toUpperCase()}</Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-orange-600">{cityName}</span>
                    </nav>

                    <h1 className="text-4xl md:text-5xl font-black text-zinc-900 mb-6 font-display">
                        Verified Trades in {cityName}
                    </h1>
                    <p className="text-xl text-zinc-600 mb-12 leading-relaxed max-w-3xl">
                        Find highly-rated trades across {cityName}. We've mapped every suburb to help you find the most reliable local experts near you.
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {suburbs.map((suburb) => (
                            <Link key={suburb} href={`/local/${state}/${city}/${suburb.toLowerCase().replace(/ /g, '-')}`} className="group">
                                <div className="bg-white p-4 rounded-xl border border-zinc-200 hover:border-orange-500 hover:shadow-md transition-all duration-300 flex items-center justify-between">
                                    <span className="text-sm font-bold text-zinc-700 group-hover:text-orange-600 transition-colors">
                                        {suburb}
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-orange-600 transition-all text-black" />
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
