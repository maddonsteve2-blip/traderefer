import { ChevronRight, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DirectoryFooter } from "@/components/DirectoryFooter";
import { Metadata } from "next";
import { sql } from "@/lib/db";

interface PageProps {
    params: Promise<{ state: string }>;
}

function formatSlug(slug: string) {
    return slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

const STATE_NAMES: Record<string, string> = {
    "vic": "Victoria", "nsw": "New South Wales", "qld": "Queensland",
    "wa": "Western Australia", "sa": "South Australia", "tas": "Tasmania",
    "act": "Australian Capital Territory", "nt": "Northern Territory",
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { state } = await params;
    const stateName = STATE_NAMES[state.toLowerCase()];
    if (!stateName) return {};
    return {
        title: `Trades in ${stateName} | Find Verified Local Tradies | TradeRefer`,
        description: `Browse verified local trade businesses across ${stateName}. Find top-rated plumbers, electricians, builders and more in your city or suburb.`,
    };
}

async function getCitiesInState(state: string): Promise<{ city: string; count: number }[]> {
    try {
        const results = await sql`
            SELECT city, COUNT(*) as count
            FROM businesses
            WHERE status = 'active'
              AND state ILIKE ${state}
              AND city IS NOT NULL AND city != ''
            GROUP BY city
            ORDER BY count DESC, city ASC
        `;
        return results.map((r: any) => ({ city: r.city, count: parseInt(r.count, 10) }));
    } catch { return []; }
}

async function getBusinessCountForState(state: string): Promise<number> {
    try {
        const result = await sql`
            SELECT COUNT(*) as count FROM businesses
            WHERE status = 'active' AND state ILIKE ${state}
        `;
        return parseInt(result[0]?.count || '0', 10);
    } catch { return 0; }
}

export default async function StateDirectoryPage({ params }: PageProps) {
    const { state } = await params;
    const stateName = STATE_NAMES[state.toLowerCase()];

    if (!stateName) notFound();

    const [cities, businessCount] = await Promise.all([
        getCitiesInState(state),
        getBusinessCountForState(state),
    ]);

    if (cities.length === 0) notFound();

    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://traderefer.au" },
            { "@type": "ListItem", "position": 2, "name": "Directory", "item": "https://traderefer.au/local" },
            { "@type": "ListItem", "position": 3, "name": `Trades in ${stateName}` },
        ]
    };

    return (
        <main className="min-h-screen bg-zinc-50 pt-32 pb-20">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                    <nav className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest mb-8">
                        <Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href="/local" className="hover:text-zinc-900 transition-colors">Directory</Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-orange-600">{stateName}</span>
                    </nav>

                    <h1 className="text-4xl md:text-5xl font-black text-zinc-900 mb-4 font-display">
                        Trades in {stateName}
                    </h1>
                    <p className="text-xl text-zinc-600 mb-4 leading-relaxed">
                        Find verified local trade businesses across {stateName}. Select your city or region below to browse suburb-level experts.
                    </p>
                    {businessCount > 0 && (
                        <div className="flex items-center gap-2 mb-10 text-sm text-zinc-500 font-medium">
                            <Users className="w-4 h-4 text-orange-500" />
                            <span>{businessCount} verified businesses across {stateName}</span>
                        </div>
                    )}
                    {!businessCount && <div className="mb-10" />}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {cities.map(({ city, count }) => (
                            <Link key={city} href={`/local/${state}/${city.toLowerCase().replace(/ /g, '-')}`} className="group">
                                <div className="bg-white p-6 rounded-2xl border border-zinc-200 hover:border-orange-500 hover:shadow-lg transition-all duration-300 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-zinc-900 group-hover:text-orange-600 transition-colors">
                                            {city}
                                        </h2>
                                        <p className="text-xs text-zinc-400 mt-1 font-medium">{count} business{count !== 1 ? 'es' : ''}</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-orange-600 group-hover:translate-x-1 transition-all shrink-0" />
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
