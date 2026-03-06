import { Search, TrendingUp } from "lucide-react";
import Link from "next/link";
import { HotCampaigns } from "@/components/referrer/HotCampaigns";
import { EarningsDashboard } from "@/components/referrer/EarningsDashboard";
import { DiscoverSection } from "@/components/referrer/DiscoverSection";
import { MyTradesTeam } from "@/components/referrer/MyTradesTeam";
import { WelcomeDialog } from "@/components/dashboard/WelcomeDialog";
import { ReferralProgress } from "@/components/referrer/ReferralProgress";
import { MonthlyGoalWidget } from "@/components/referrer/MonthlyGoalWidget";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardError } from "@/components/dashboard/DashboardError";

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
        <div className="min-h-screen bg-zinc-50 pt-[72px] md:pt-[100px] pb-8">
            <WelcomeDialog />

            {/* ── 2-COLUMN GRID: 75% main / 25% right ── */}
            <div className="w-full px-3 lg:px-5 py-5">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

                    {/* ══ MAIN (9/12 = 75%) — Tier · Earnings · Opportunities ══ */}
                    <div className="lg:col-span-9 space-y-4">

                        {/* Page header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-black text-zinc-900 leading-tight">Your Earnings</h1>
                                <p className="text-base text-zinc-500 font-medium">Track referrals · collect Prezzee rewards</p>
                            </div>
                            <Link href="/businesses"
                                className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm transition-colors shadow-sm shadow-orange-200">
                                <Search className="w-4 h-4" /> Find Businesses
                            </Link>
                        </div>

                        {/* Tier + Earnings cards (goal hidden — moved to sidebar) */}
                        <EarningsDashboard hideGoal />

                        {/* Tabbed Opportunities: Hot Right Now / New */}
                        <DiscoverSection />

                        {/* My Trades Team */}
                        <MyTradesTeam />
                    </div>

                    {/* ══ RIGHT SIDEBAR (3/12 = 25%) — Rewards · Goal · Invite · Tips ══ */}
                    <aside className="lg:col-span-3 space-y-4 lg:sticky lg:top-28">

                        {/* Prezzee Rewards — dark authority card */}
                        <div className="bg-[#0F172A] rounded-2xl p-5 text-white relative overflow-hidden shadow-xl">
                            <div className="relative z-10">
                                <div className="flex items-center gap-1.5 mb-2">
                                    <span className="text-zinc-400 text-base font-semibold uppercase tracking-wider">Rewards by</span>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src="https://cdn.prod.website-files.com/67e0cab92cc4f35b3b006055/6808567053b358df8bfa79c3_Logo%20Consumer_Web.svg"
                                        alt="Prezzee" className="h-3.5 w-auto brightness-0 invert opacity-60" />
                                </div>
                                <h3 className="text-xl font-black text-white mb-1">Earn $25 Gift Cards</h3>
                                <p className="text-zinc-300 text-base font-semibold mb-1 leading-snug">
                                    Invite 5 friends who join TradeRefer
                                </p>
                                <p className="text-zinc-400 text-base mb-3 leading-relaxed">
                                    → <span className="text-white font-bold">$25 Prezzee Smart Card</span>, automatically issued.
                                </p>
                                <div className="flex flex-wrap gap-1 mb-4">
                                    {["Woolworths", "Bunnings", "Uber", "+400"].map((b) => (
                                        <span key={b} className="text-base font-semibold bg-white/10 text-zinc-200 px-2 py-0.5 rounded-full">{b}</span>
                                    ))}
                                </div>
                                <Link href="/dashboard/referrer/withdraw"
                                    className="block w-full text-center bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-base py-2.5 transition-colors mb-2">
                                    View My Rewards
                                </Link>
                                <Link href="/rewards"
                                    className="block w-full text-center text-zinc-400 hover:text-white text-base font-semibold py-1 transition-colors underline underline-offset-2">
                                    See all 335 brands →
                                </Link>
                            </div>
                        </div>

                        {/* Monthly Goal Widget */}
                        <MonthlyGoalWidget />

                        {/* Friend Rewards / Invite */}
                        <div id="invite">
                            <ReferralProgress />
                        </div>

                        {/* Hot Campaigns */}
                        <HotCampaigns />

                        {/* Find Businesses CTA */}
                        <div className="bg-orange-500 rounded-2xl p-4 text-white">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="w-4 h-4" />
                                <h3 className="text-sm font-black">Find Businesses</h3>
                            </div>
                            <p className="text-orange-100 text-xs mb-3 leading-relaxed">
                                Browse verified tradies and grab referral links to start earning.
                            </p>
                            <Link href="/businesses"
                                className="block w-full text-center bg-white hover:bg-zinc-50 text-orange-600 rounded-xl font-bold text-sm py-2 transition-colors">
                                Explore Catalog
                            </Link>
                        </div>

                        {/* Pro Tip */}
                        <div className="bg-white rounded-2xl border border-zinc-200 p-4">
                            <p className="text-sm font-black text-zinc-900 mb-2">Pro Tip</p>
                            <p className="text-sm text-zinc-500 font-medium leading-relaxed">
                                Sharing your link in local Facebook groups increases lead volume by <span className="font-bold text-zinc-700">3×</span>. Try suburb-specific groups.
                            </p>
                            <Link href="/contact"
                                className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-orange-600 hover:text-orange-700 underline underline-offset-2 transition-colors">
                                Get support →
                            </Link>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
