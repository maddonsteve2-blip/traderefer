import { ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DirectoryFooter } from "@/components/DirectoryFooter";

interface PageProps {
    params: Promise<{ state: string }>;
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

    return (
        <main className="min-h-screen bg-zinc-50 pt-32 pb-20">
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                    <nav className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest mb-8">
                        <Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href="/local" className="hover:text-zinc-900 transition-colors">Directory</Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-orange-600">{stateData.name}</span>
                    </nav>

                    <h1 className="text-4xl md:text-5xl font-black text-zinc-900 mb-6 font-display">
                        Trades in {stateData.name}
                    </h1>
                    <p className="text-xl text-zinc-600 mb-12 leading-relaxed">
                        Explore verified local trade services across {stateData.name}. Select a major city or region to see neighborhood experts.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {stateData.regions.map((region) => (
                            <Link key={region} href={`/local/${state}/${region.toLowerCase().replace(/ /g, '-')}`} className="group">
                                <div className="bg-white p-6 rounded-2xl border border-zinc-200 hover:border-orange-500 hover:shadow-lg transition-all duration-300 flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-zinc-900 group-hover:text-orange-600 transition-colors">
                                        {region}
                                    </h2>
                                    <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
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
