import { ChevronRight, MapPin, Users } from "lucide-react";
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { state } = await params;
    const stateData = DATA[state.toLowerCase()];
    if (!stateData) return {};
    return {
        title: `Trades in ${stateData.name} | Find Verified Local Tradies | TradeRefer`,
        description: `Browse verified local trade businesses across ${stateData.name}. Find top-rated plumbers, electricians, builders and more in your city or suburb.`,
    };
}

async function getBusinessCountForState(state: string): Promise<number> {
    try {
        const result = await sql`
            SELECT COUNT(*) as count FROM businesses
            WHERE status = 'active' AND state ILIKE ${'%' + state + '%'}
        `;
        return parseInt(result[0]?.count || '0', 10);
    } catch { return 0; }
}

const DATA: Record<string, { name: string, regions: string[] }> = {
    "vic": { name: "Victoria", regions: ["Geelong", "Melbourne", "Ballarat", "Bendigo", "Shepparton", "Mildura"] },
    "nsw": { name: "New South Wales", regions: ["Sydney", "Newcastle", "Wollongong", "Central Coast"] },
    "qld": { name: "Queensland", regions: ["Brisbane", "Gold Coast", "Sunshine Coast", "Townsville"] },
    "wa": { name: "Western Australia", regions: ["Perth", "Fremantle", "Mandurah"] },
    "sa": { name: "South Australia", regions: ["Adelaide", "Mount Gambier"] },
    "tas": { name: "Tasmania", regions: ["Hobart", "Launceston"] }
};

export default async function StateDirectoryPage({ params }: PageProps) {
    const { state } = await params;
    const stateData = DATA[state.toLowerCase()];

    if (!stateData) notFound();

    const businessCount = await getBusinessCountForState(stateData.name);

    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://traderefer.au" },
            { "@type": "ListItem", "position": 2, "name": "Directory", "item": "https://traderefer.au/local" },
            { "@type": "ListItem", "position": 3, "name": `Trades in ${stateData.name}` },
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
                        <span className="text-orange-600">{stateData.name}</span>
                    </nav>

                    <h1 className="text-4xl md:text-5xl font-black text-zinc-900 mb-4 font-display">
                        Trades in {stateData.name}
                    </h1>
                    <p className="text-xl text-zinc-600 mb-4 leading-relaxed">
                        Find verified local trade businesses across {stateData.name}. Select your city or region below to browse suburb-level experts.
                    </p>
                    {businessCount > 0 && (
                        <div className="flex items-center gap-2 mb-10 text-sm text-zinc-500 font-medium">
                            <Users className="w-4 h-4 text-orange-500" />
                            <span>{businessCount} verified businesses across {stateData.name}</span>
                        </div>
                    )}
                    {!businessCount && <div className="mb-10" />}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {stateData.regions.map((region) => (
                            <Link key={region} href={`/local/${state}/${region.toLowerCase().replace(/ /g, '-')}`} className="group">
                                <div className="bg-white p-6 rounded-2xl border border-zinc-200 hover:border-orange-500 hover:shadow-lg transition-all duration-300 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-zinc-900 group-hover:text-orange-600 transition-colors">
                                            {region}
                                        </h2>
                                        <p className="text-xs text-zinc-400 mt-1 font-medium">{stateData.name}</p>
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
