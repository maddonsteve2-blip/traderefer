export const dynamic = "force-dynamic";

import { Wrench } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { WebsiteScraper } from "@/components/admin/WebsiteScraper";
import { PhotoFiller } from "@/components/admin/PhotoFiller";
import { BlobConverter } from "@/components/admin/BlobConverter";
import { GooglePlacesFill } from "@/components/admin/GooglePlacesFill";

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

    const [scrapeStats, photoStats, blobStats, placesStats] = token
        ? await Promise.all([
            fetchStats(token, "scrape/stats"),
            fetchStats(token, "photos/stats"),
            fetchStats(token, "blob/stats"),
            fetchStats(token, "places/stats"),
        ])
        : [null, null, null, null];

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
                    <GooglePlacesFill initialStats={placesStats} />
                </div>
            </div>
        </div>
    );
}
