export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { WebsiteQuotesQueueClient } from "@/components/admin/WebsiteQuotesQueueClient";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getQueue(token: string) {
    const res = await fetch(`${API}/website-quotes/admin-queue`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
    });

    if (!res.ok) {
        return { items: [], total: 0 };
    }

    return res.json();
}

export default async function AdminWebsiteQuotesPage() {
    const { getToken } = await auth();
    const token = await getToken();
    const data = token ? await getQueue(token) : { items: [], total: 0 };

    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
                <div className="flex items-center gap-3 mb-6">
                    <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-900">
                        <ArrowLeft className="w-4 h-4" /> Back to admin
                    </Link>
                </div>
                <WebsiteQuotesQueueClient initialItems={data.items || []} />
            </div>
        </div>
    );
}
