export const dynamic = "force-dynamic";

import { Wrench, MapPin, Play } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { WebsiteScraper } from "@/components/admin/WebsiteScraper";
import { PhotoFiller } from "@/components/admin/PhotoFiller";
import { BlobConverter } from "@/components/admin/BlobConverter";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchStats(token: string, path: string) {
    try {
        const res = await fetch(`${API}/admin/${path}`, {
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

    const [scrapeStats, photoStats, blobStats] = token
        ? await Promise.all([
            fetchStats(token, "scrape/stats"),
            fetchStats(token, "photos/stats"),
            fetchStats(token, "blob/stats"),
        ])
        : [null, null, null];

    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-black text-zinc-900 flex items-center gap-2">
                        <Wrench className="w-6 h-6 text-orange-600" /> Fill & Scrape Tools
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">
                        Run data enrichment tools on the Railway backend. All tools execute server-side.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <WebsiteScraper initialStats={scrapeStats} />
                    <PhotoFiller initialStats={photoStats} />
                    <BlobConverter initialStats={blobStats} />

                    {/* Google Places Fill — not yet wired (complex: creates new businesses) */}
                    <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm opacity-60">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                <MapPin className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-zinc-900">Google Places Fill</h3>
                                <p className="text-sm text-zinc-500 mt-0.5">Search Google Places API to add new businesses by state and trade</p>
                            </div>
                        </div>
                        <button disabled className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-200 text-zinc-400 rounded-xl font-bold text-sm cursor-not-allowed">
                            <Play className="w-4 h-4" /> Coming Soon
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
