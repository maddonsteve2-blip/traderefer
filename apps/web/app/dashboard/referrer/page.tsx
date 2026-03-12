import { Search, TrendingUp } from "lucide-react";
import Link from "next/link";
import { HotCampaigns } from "@/components/referrer/HotCampaigns";
import { EarningsDashboard } from "@/components/referrer/EarningsDashboard";
import { MyTradesTeam } from "@/components/referrer/MyTradesTeam";
import { WelcomeDialog } from "@/components/dashboard/WelcomeDialog";
import { ReferralProgress } from "@/components/referrer/ReferralProgress";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardError } from "@/components/dashboard/DashboardError";
import { PrezzeeRewardsCard } from "@/components/shared/PrezzeeRewardsCard";

async function getDashboardData() {
    const { userId, getToken } = await auth();
    if (!userId) {
        redirect("/login");
    }

    const token = await getToken();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/referrer/dashboard`, {
        cache: 'no-store',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (res.status === 404) {
        return { error: true, noProfile: true };
    }

    if (!res.ok) {
        return { error: true, noProfile: false };
    }

    return res.json();
}

export default async function ReferrerDashboardPage() {
    let data;
    try {
        data = await getDashboardData();
    } catch (err) {
        // Re-throw Next.js redirect/not-found errors — do NOT swallow them
        if (err && typeof err === 'object' && 'digest' in err) throw err;
        data = { error: true, noProfile: false };
    }

    if (!data || data.error) {
        return <DashboardError fetchError={null} noProfile={data?.noProfile} profileType="referrer" />;
    }

    return (
        <div className="min-h-screen bg-zinc-50 pb-8">
            <WelcomeDialog />

            {/* ── 2-COLUMN GRID: 75% main / 25% right ── */}
            <div className="w-full px-3 lg:px-5 py-4 md:py-5">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

                    {/* ══ MAIN (9/12 = 75%) — Tier · Earnings · Opportunities ══ */}
                    <div className="lg:col-span-9 space-y-4">

                        {/* Page header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                            <div>
                                <h1 className="font-black text-zinc-900 leading-tight" style={{ fontSize: '36px' }}>Your Earnings</h1>
                                <p className="font-bold text-zinc-500 mt-1" style={{ fontSize: '19px' }}>Track referrals · collect Prezzee rewards</p>
                            </div>
                            <Link href="/dashboard/referrer/businesses"
                                className="hidden sm:flex items-center gap-2.5 px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black transition-all shadow-lg shadow-orange-200 active:scale-95"
                                style={{ fontSize: '20px' }}>
                                <Search className="w-6 h-6" /> Find Businesses
                            </Link>
                        </div>

                        {/* Tier + Earnings cards + Monthly Goal inline */}
                        <EarningsDashboard />

                        {/* My Trades Team */}
                        <MyTradesTeam />
                    </div>

                    {/* ══ RIGHT SIDEBAR (3/12 = 25%) — Rewards · Goal · Invite · Tips ══ */}
                    <aside className="lg:col-span-3 space-y-4 lg:sticky lg:top-28">

                        {/* Prezzee Rewards — shared card */}
                        <PrezzeeRewardsCard rewardsHref="/dashboard/referrer/withdraw" />

                        {/* Friend Rewards / Invite */}
                        <div id="invite">
                            <ReferralProgress />
                        </div>

                        {/* Hot Campaigns */}
                        <HotCampaigns />

                    </aside>
                </div>
            </div>
        </div>
    );
}
