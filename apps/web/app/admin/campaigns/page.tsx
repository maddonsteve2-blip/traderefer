export const dynamic = "force-dynamic";

import { Megaphone, Tag, Eye, Calendar } from "lucide-react";

export default async function CampaignsPage() {
    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-black text-zinc-900 flex items-center gap-2">
                        <Megaphone className="w-6 h-6 text-violet-600" /> Campaigns & Deals
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">Manage active campaigns, deals, and featured content</p>
                </div>

                <div className="bg-white rounded-2xl border border-zinc-200 p-8 shadow-sm text-center">
                    <Megaphone className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                    <h3 className="font-bold text-zinc-700 mb-1">Campaign Management</h3>
                    <p className="text-sm text-zinc-400">Campaign and deal management will be connected to the admin API endpoints.</p>
                </div>
            </div>
        </div>
    );
}
