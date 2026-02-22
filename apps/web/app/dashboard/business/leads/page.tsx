import { Button } from "@/components/ui/button";
import {
    Users,
    MapPin,
    Clock,
    ChevronRight,
    Lock,
    Unlock,
    AlertCircle,
    Phone,
    MessageSquare
} from "lucide-react";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { LeadsList } from "@/components/dashboard/LeadsList";

async function getBusinessId(token: string): Promise<string | null> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/business/me`, {
        cache: 'no-store',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.id;
}

async function getLeads(businessId: string, token: string) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/business/${businessId}/leads`, {
        cache: 'no-store',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return [];
    return res.json();
}

export default async function BusinessLeadsPage() {
    const { userId, getToken } = await auth();
    if (!userId) redirect("/login");
    const token = await getToken();
    if (!token) redirect("/login");

    const bizId = await getBusinessId(token);
    if (!bizId) redirect("/onboarding");
    const leads = await getLeads(bizId, token);

    const pendingCount = leads.filter((l: any) => l.status === 'VERIFIED' || l.status === 'PENDING').length;

    return (
        <div className="min-h-screen bg-zinc-50 pt-16">
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 font-display">New Leads</h1>
                        <p className="text-zinc-500">Respond quickly to leads to increase your connection rate.</p>
                    </div>

                    <div className="flex items-center gap-3 bg-orange-50 px-4 py-2 rounded-2xl border border-orange-100">
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                        <span className="text-sm font-bold text-orange-700">{pendingCount} Pending Leads</span>
                    </div>
                </div>

                {leads.length > 0 ? (
                    <LeadsList initialLeads={leads} />
                ) : (
                    <div className="py-20 text-center bg-white rounded-[40px] border border-zinc-200">
                        <AlertCircle className="w-16 h-16 text-zinc-200 mx-auto mb-6" />
                        <h3 className="text-2xl font-bold text-zinc-900 mb-2">No leads yet</h3>
                        <p className="text-zinc-500 mb-8 max-w-md mx-auto">
                            Encourage your customers to share your unique referral link to drive more high-quality, verified leads.
                        </p>
                        <Button asChild variant="outline" className="rounded-full border-zinc-200 px-8">
                            <Link href="/dashboard/business/settings">View My Referral Link</Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
