import {
    MessageSquare,
    Gift,
    Users,
    TrendingUp,
    LayoutDashboard,
    Search,
    Flame,
} from "lucide-react";
import Link from "next/link";
import { HotCampaigns } from "@/components/referrer/HotCampaigns";
import { EarningsDashboard } from "@/components/referrer/EarningsDashboard";
import { DiscoverSection } from "@/components/referrer/DiscoverSection";
import { MyTradesTeam } from "@/components/referrer/MyTradesTeam";
import { WelcomeDialog } from "@/components/dashboard/WelcomeDialog";
import { ReferralProgress } from "@/components/referrer/ReferralProgress";
import { InviteButtonTrigger } from "@/components/referrer/InviteButtonTrigger";

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

            {/* ── 3-COLUMN GRID ── edge-to-edge */}
            <div className="w-full px-3 lg:px-5 py-5">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

                    {/* ══ LEFT (3/12 = 25%) — The Hook ══ */}
                    <aside className="lg:col-span-3 space-y-4 lg:sticky lg:top-28">

                        {/* Quick Nav */}
                        <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-sm">
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Quick Access</p>
                            <nav className="space-y-1">
                                {[
                                    { href: "/dashboard/referrer", icon: LayoutDashboard, label: "Overview", active: true },
                                    { href: "/businesses", icon: Search, label: "Find Businesses" },
                                    { href: "/dashboard/referrer/messages", icon: MessageSquare, label: "Messages" },
                                    { href: "/dashboard/referrer/withdraw", icon: Gift, label: "Gift Card Rewards" },
                                ].map(({ href, icon: Icon, label, active }) => (
                                    <Link key={href} href={href}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${active ? "bg-orange-50 text-orange-600" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"}`}>
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${active ? "bg-orange-100" : "bg-zinc-100"}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        {label}
                                    </Link>
                                ))}
                            </nav>
                            <div className="mt-3 pt-3 border-t border-zinc-100">
                                <InviteButtonTrigger />
                            </div>
                        </div>

                        {/* Referral Progress — friend invite rewards */}
                        <div id="invite">
                            <ReferralProgress />
                        </div>

                        {/* Tips */}
                        <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                                    <Flame className="w-4 h-4 text-orange-500" />
                                </div>
                                <p className="text-sm font-black text-zinc-900">Pro Tip</p>
                            </div>
                            <p className="text-xs text-zinc-500 leading-relaxed">
                                Sharing your referral link in local Facebook groups can increase your lead volume by <span className="font-bold text-zinc-700">3×</span>. Try suburb-specific groups for best results.
                            </p>
                            <Link href="/contact" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors">
                                Get support →
                            </Link>
                        </div>
                    </aside>

                    {/* ══ CENTER (6/12 = 50%) — The Value + Action ══ */}
                    <div className="lg:col-span-6 space-y-5">

                        {/* Compact page header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-black text-zinc-900 leading-tight">Your Earnings</h1>
                                <p className="text-sm text-zinc-500 font-medium">Track referrals · collect Prezzee rewards</p>
                            </div>
                            <Link href="/businesses"
                                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm transition-colors shadow-sm shadow-orange-200">
                                <Search className="w-4 h-4" /> Find Businesses
                            </Link>
                        </div>

                        {/* Earnings + Tier — core data */}
                        <EarningsDashboard />

                        {/* Workflow loop: "What I've made" → "How to make more" */}
                        <DiscoverSection />

                        {/* My Trades Team — horizontal grid */}
                        <MyTradesTeam />
                    </div>

                    {/* ══ RIGHT (3/12 = 25%) — The Reward ══ */}
                    <aside className="lg:col-span-3 space-y-4 lg:sticky lg:top-28">

                        {/* Prezzee Rewards card */}
                        <div className="bg-zinc-900 rounded-2xl p-5 text-white relative overflow-hidden shadow-xl">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="https://files.poweredbyprezzee.com/products/7af951a6-2a13-004b-f0eb-a87382a5b2e7/8eff8e56-2718-4514-8e1a-15ca1eb22793/Prezzee_3D_-_AU_%281%29_452_280.gif"
                                alt="Prezzee Smart Card"
                                className="absolute -right-3 -top-3 w-28 opacity-20 rounded-xl pointer-events-none"
                            />
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Rewards by</span>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src="https://cdn.prod.website-files.com/67e0cab92cc4f35b3b006055/6808567053b358df8bfa79c3_Logo%20Consumer_Web.svg"
                                            alt="Prezzee" className="h-3.5 w-auto brightness-0 invert opacity-70" />
                                    </div>
                                </div>
                                <h3 className="text-base font-black mb-1">Earn $25 Gift Cards</h3>
                                <p className="text-zinc-400 text-xs mb-3 leading-relaxed">
                                    Invite 5 friends who join → <span className="text-white font-bold">$25 Prezzee Smart Card</span>, auto-issued.
                                </p>
                                <div className="flex flex-wrap gap-1 mb-4">
                                    {["Woolworths", "Bunnings", "Uber", "+400"].map((b) => (
                                        <span key={b} className="text-[10px] font-bold bg-white/10 text-zinc-300 px-2 py-0.5 rounded-full">{b}</span>
                                    ))}
                                </div>
                                <Link href="/dashboard/referrer/withdraw"
                                    className="block w-full text-center bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm py-2.5 transition-colors mb-1.5">
                                    View My Rewards
                                </Link>
                                <Link href="/rewards"
                                    className="block w-full text-center text-zinc-400 hover:text-white text-xs font-medium py-1 transition-colors">
                                    See all 335 brands →
                                </Link>
                            </div>
                        </div>

                        {/* Hot Campaigns */}
                        <HotCampaigns />

                        {/* Find Businesses CTA */}
                        <div className="bg-orange-500 rounded-2xl p-5 text-white shadow-lg shadow-orange-200">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="w-5 h-5" />
                                <h3 className="text-base font-black">Find Businesses</h3>
                            </div>
                            <p className="text-orange-100 text-xs mb-4 leading-relaxed">
                                Browse verified tradies and grab your unique referral links to start earning.
                            </p>
                            <Link href="/businesses"
                                className="block w-full text-center bg-white hover:bg-zinc-50 text-orange-600 rounded-xl font-bold text-sm py-2.5 transition-colors">
                                Explore Catalog
                            </Link>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
