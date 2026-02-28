import { Button } from "@/components/ui/button";
import { ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";
import { DirectoryFooter } from "@/components/DirectoryFooter";

export const metadata: Metadata = {
    title: "Local Trade Directory | Find Trusted Trades in Australia",
    description: "Browse our directory of verified and community-recommended local trades across all Australian states and cities."
};

const STATES = [
    { name: "Victoria", slug: "vic", cities: ["Geelong", "Melbourne", "Ballarat", "Bendigo"] },
    { name: "New South Wales", slug: "nsw", cities: ["Sydney", "Newcastle", "Wollongong"] },
    { name: "Queensland", slug: "qld", cities: ["Brisbane", "Gold Coast", "Sunshine Coast"] },
    { name: "Western Australia", slug: "wa", cities: ["Perth", "Fremantle"] },
    { name: "South Australia", slug: "sa", cities: ["Adelaide"] },
    { name: "Tasmania", slug: "tas", cities: ["Hobart", "Launceston"] }
];

export default function LocalDirectoryPage() {
    return (
        <main className="min-h-screen bg-white pt-40 pb-32">
            <div className="container mx-auto px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center gap-3 text-orange-600 font-black text-base uppercase tracking-[0.2em] mb-6">
                        <MapPin className="w-6 h-6" />
                        Directory
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-zinc-900 mb-8 font-display tracking-tight leading-[1.1]">
                        Local Service Directory
                    </h1>
                    <p className="text-2xl md:text-3xl text-zinc-600 mb-16 leading-relaxed font-medium">
                        Find verified, community-recommended trades across Australia. Select your state to explore local experts.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {STATES.map((state) => (
                            <Link key={state.slug} href={`/local/${state.slug}`} className="group">
                                <div className="bg-white p-10 rounded-[40px] border-2 border-zinc-100 hover:border-orange-500 hover:shadow-2xl hover:shadow-orange-500/5 transition-all duration-500 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-orange-500/10 transition-colors" />
                                    <div className="flex items-center justify-between mb-6 relative z-10">
                                        <h2 className="text-3xl font-black text-zinc-900 group-hover:text-orange-600 transition-colors tracking-tight">
                                            {state.name}
                                        </h2>
                                        <div className="w-14 h-14 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-300 group-hover:text-orange-600 group-hover:bg-orange-50 group-hover:scale-110 transition-all">
                                            <ChevronRight className="w-8 h-8 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                    <p className="text-zinc-600 text-lg mb-8 leading-relaxed font-medium relative z-10">
                                        Trusted trades in <span className="text-zinc-900 font-bold">{state.cities.join(", ")}</span> and surrounding regions.
                                    </p>
                                    <div className="flex flex-wrap gap-3 relative z-10">
                                        {state.cities.slice(0, 4).map(city => (
                                            <span key={city} className="px-5 py-2.5 bg-zinc-50 border border-zinc-100 text-zinc-700 rounded-2xl text-sm font-black uppercase tracking-widest shadow-sm group-hover:bg-white transition-colors">
                                                {city}
                                            </span>
                                        ))}
                                        <span className="px-5 py-2.5 bg-zinc-100 text-zinc-500 rounded-2xl text-sm font-black uppercase tracking-widest">
                                            + More
                                        </span>
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
