export const dynamic = "force-dynamic";

import { Wrench, Play, Clock, MapPin, ImagePlus, Database } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { WebsiteScraper } from "@/components/admin/WebsiteScraper";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getScrapeStats(token: string) {
    try {
        const res = await fetch(`${API}/admin/scrape/stats`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
        });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

export default async function ToolsPage() {
    const { getToken } = await auth();
    const token = await getToken();
    const scrapeStats = token ? await getScrapeStats(token) : null;

    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-black text-zinc-900 flex items-center gap-2">
                        <Wrench className="w-6 h-6 text-orange-600" /> Fill & Scrape Tools
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">
                        Run data enrichment tools. Scraper executes on Railway backend.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Website Scraper — fully wired */}
                    <WebsiteScraper initialStats={scrapeStats} />

                    {/* Other tool cards (static for now) */}
                    <ToolCard
                        name="Google Places Fill"
                        description="Search Google Places API to add new businesses by state and trade"
                        icon={<MapPin className="w-5 h-5 text-blue-600" />}
                        bg="bg-blue-50"
                    />
                    <ToolCard
                        name="Business Photo Filler"
                        description="Fetch up to 10 photos per business from Google Places API"
                        icon={<ImagePlus className="w-5 h-5 text-cyan-600" />}
                        bg="bg-cyan-50"
                    />
                    <ToolCard
                        name="Photo URL → Blob Converter"
                        description="Convert Google Places photo URLs to permanent Vercel Blob storage"
                        icon={<Database className="w-5 h-5 text-violet-600" />}
                        bg="bg-violet-50"
                    />
                </div>
            </div>
        </div>
    );
}

function ToolCard({ name, description, icon, bg }: { name: string; description: string; icon: React.ReactNode; bg: string }) {
    return (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm opacity-60">
            <div className="flex items-start gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                    {icon}
                </div>
                <div>
                    <h3 className="font-bold text-zinc-900">{name}</h3>
                    <p className="text-sm text-zinc-500 mt-0.5">{description}</p>
                </div>
            </div>
            <button
                disabled
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-200 text-zinc-400 rounded-xl font-bold text-sm cursor-not-allowed"
            >
                <Play className="w-4 h-4" /> Coming Soon
            </button>
        </div>
    );
}
