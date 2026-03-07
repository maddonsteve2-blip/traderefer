import { Search, TrendingUp } from "lucide-react";
import Link from "next/link";
import { HotCampaigns } from "@/components/referrer/HotCampaigns";
import { EarningsDashboard } from "@/components/referrer/EarningsDashboard";
import { DiscoverSection } from "@/components/referrer/DiscoverSection";
import { MyTradesTeam } from "@/components/referrer/MyTradesTeam";
import { WelcomeDialog } from "@/components/dashboard/WelcomeDialog";
import { ReferralProgress } from "@/components/referrer/ReferralProgress";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardError } from "@/components/dashboard/DashboardError";
import { SidebarRoleSwitcher } from "@/components/dashboard/SidebarRoleSwitcher";

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
    const { sessionClaims } = await auth();
    const meta = sessionClaims?.metadata as { role?: string; roles?: string[] } | undefined;
    const roles = meta?.roles ?? (meta?.role ? [meta.role] : []);
    const hasBusiness = roles.includes("business");

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
                            <Link href="/dashboard/referrer/businesses"
                                className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-lg transition-colors shadow-sm shadow-orange-200">
                                <Search className="w-4 h-4" /> Find Businesses
                            </Link>
                        </div>

                        {/* Tier + Earnings cards + Monthly Goal inline */}
                        <EarningsDashboard />

                        {/* Tabbed Opportunities: Hot Right Now / New */}
                        <DiscoverSection />

                        {/* My Trades Team */}
                        <MyTradesTeam />
                    </div>

                    {/* ══ RIGHT SIDEBAR (3/12 = 25%) — Rewards · Goal · Invite · Tips ══ */}
                    <aside className="lg:col-span-3 space-y-4 lg:sticky lg:top-28">

                        {/* Prezzee Rewards — dark authority card */}
                        <div className="bg-[#0F172A] rounded-2xl p-5 text-white relative overflow-hidden shadow-xl">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="https://files.poweredbyprezzee.com/products/7af951a6-2a13-004b-f0eb-a87382a5b2e7/8eff8e56-2718-4514-8e1a-15ca1eb22793/Prezzee_3D_-_AU_%281%29_452_280.gif"
                                alt="Prezzee Smart Card"
                                className="absolute -right-3 -top-3 w-28 rounded-xl pointer-events-none"
                            />
                            <div className="relative z-10">
                                <div className="flex items-center gap-1.5 mb-2">
                                    <span className="text-white font-semibold uppercase tracking-wider text-base">Rewards by</span>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src="https://cdn.prod.website-files.com/67e0cab92cc4f35b3b006055/6808567053b358df8bfa79c3_Logo%20Consumer_Web.svg"
                                        alt="Prezzee" className="h-3.5 w-auto brightness-0 invert opacity-60" />
                                </div>
                                <h3 className="text-xl font-black text-white mb-1">Earn $25 Gift Cards</h3>
                                <p className="text-white font-semibold text-base mb-1 leading-snug">
                                    Invite 5 friends who join TradeRefer
                                </p>
                                <p className="text-zinc-300 font-semibold text-base mb-3 leading-relaxed">
                                    → <span className="text-white font-bold">$25 Prezzee Smart Card</span>, automatically issued.
                                </p>
                                <div className="flex flex-wrap gap-1 mb-4">
                                    {["Woolworths", "Bunnings", "Uber", "+400"].map((b) => (
                                        <span key={b} className="text-base font-semibold bg-white/10 text-white px-2 py-0.5 rounded-full">{b}</span>
                                    ))}
                                </div>
                                <Link href="/dashboard/referrer/withdraw"
                                    className="block w-full text-center bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-lg py-3 transition-colors mb-2 shadow-lg shadow-orange-500/30">
                                    View My Rewards
                                </Link>
                                <Link href="/rewards"
                                    className="block w-full text-center text-zinc-300 hover:text-white text-base font-semibold py-1 transition-colors underline underline-offset-2">
                                    See all 335 brands →
                                </Link>
                            </div>
                        </div>

                        {/* Friend Rewards / Invite */}
                        <div id="invite">
                            <ReferralProgress />
                        </div>

                        {/* Hot Campaigns */}
                        <HotCampaigns />

                            {/* Role Switcher */}
                        <SidebarRoleSwitcher currentRole="referrer" />

                        {/* Find Businesses CTA */}
                        <div className="bg-orange-500 rounded-2xl p-4 text-white">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="w-4 h-4" />
                                <h3 className="text-base font-black text-white">Find Businesses</h3>
                            </div>
                            <p className="text-white font-semibold text-base mb-3 leading-relaxed opacity-90">
                                Browse verified tradies and grab referral links to start earning.
                            </p>
                            <Link href="/dashboard/referrer/businesses"
                                className="block w-full text-center bg-white hover:bg-zinc-50 text-orange-600 rounded-xl font-bold text-lg py-2.5 transition-colors">
                                Explore Catalog
                            </Link>
                        </div>

                    </aside>
                </div>
            </div>
        </div>
    );
}
