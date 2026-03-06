import { Button } from "@/components/ui/button";
import {
    Rocket,
    Wallet,
    History,
    Users,
    TrendingUp,
    ChevronRight,
    ExternalLink,
    Plus
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HotCampaigns } from "@/components/referrer/HotCampaigns";
import { EarningsDashboard } from "@/components/referrer/EarningsDashboard";
import { DiscoverSection } from "@/components/referrer/DiscoverSection";
import { MyTradesTeam } from "@/components/referrer/MyTradesTeam";
import { WelcomeDialog } from "@/components/dashboard/WelcomeDialog";
import { ReferralProgress } from "@/components/referrer/ReferralProgress";

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
        <div className="min-h-screen bg-zinc-50 pt-16">
            {/* First-time welcome dialog (client component) */}
            <WelcomeDialog />

            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-black text-zinc-900 font-display">Your Earnings</h1>
                        <p className="text-zinc-500 font-medium">Track your referrals and collect Prezzee gift card rewards.</p>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        <Button asChild variant="outline" className="rounded-full px-6 h-12 font-bold border-zinc-200">
                            <Link href="/dashboard/referrer/messages">Messages</Link>
                        </Button>
                        <Button asChild variant="outline" className="rounded-full px-6 h-12 font-bold border-orange-200 text-orange-600 hover:bg-orange-50">
                            <Link href="#invite"><Users className="w-4 h-4 mr-2" />Invite Friends</Link>
                        </Button>
                        <Button asChild className="bg-zinc-900 hover:bg-black text-white rounded-full px-8 h-12 font-bold shadow-lg shadow-zinc-200">
                            <Link href="/dashboard/referrer/withdraw">Gift Card Rewards</Link>
                        </Button>
                    </div>
                </div>

                <EarningsDashboard />

                {/* Referral progress widget */}
                <div id="invite" className="mb-10">
                    <ReferralProgress />
                </div>

                <DiscoverSection />

                <MyTradesTeam />

                <HotCampaigns />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card className="bg-zinc-900 p-8 text-white relative overflow-hidden shadow-2xl">
                        {/* Prezzee Smart Card image — top right corner */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="https://files.poweredbyprezzee.com/products/7af951a6-2a13-004b-f0eb-a87382a5b2e7/8eff8e56-2718-4514-8e1a-15ca1eb22793/Prezzee_3D_-_AU_%281%29_452_280.gif"
                            alt="Prezzee Smart Card"
                            className="absolute -right-4 -top-4 w-36 opacity-20 rounded-xl pointer-events-none"
                        />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-zinc-500 text-xs font-bold">Rewards by</span>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src="https://cdn.prod.website-files.com/67e0cab92cc4f35b3b006055/6808567053b358df8bfa79c3_Logo%20Consumer_Web.svg"
                                    alt="Prezzee"
                                    className="h-4 w-auto brightness-0 invert opacity-70"
                                />
                            </div>
                            <h3 className="text-xl font-bold mb-1">Earn $25 Gift Cards</h3>
                            <p className="text-zinc-400 text-sm mb-3 leading-relaxed">
                                Invite 5 people who join TradeRefer → <span className="text-white font-bold">$25 Prezzee Smart Card</span>, automatically issued.
                            </p>
                            <div className="flex flex-wrap gap-1.5 mb-5">
                                {["Woolworths", "Bunnings", "Uber", "Netflix", "+400 more"].map((b) => (
                                    <span key={b} className="text-xs font-bold bg-white/10 text-zinc-300 px-2.5 py-1 rounded-full">{b}</span>
                                ))}
                            </div>
                            <div className="flex flex-col gap-2">
                                <Button asChild className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full font-bold h-11">
                                    <Link href="/dashboard/referrer/withdraw">View My Rewards</Link>
                                </Button>
                                <Button asChild variant="ghost" className="w-full text-zinc-400 hover:text-white hover:bg-white/10 rounded-full h-9 text-sm">
                                    <Link href="/rewards">See all 335 brands →</Link>
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-orange-500 p-8 text-white shadow-2xl hover:shadow-orange-200/50 transition-all">
                        <h3 className="text-xl font-bold mb-4">Find Businesses</h3>
                        <p className="text-orange-100 text-sm mb-6 leading-relaxed">
                            Browse verified tradies in your area and grab your unique referral links to start earning.
                        </p>
                        <Button asChild className="w-full bg-white hover:bg-zinc-50 text-orange-600 rounded-full font-bold h-12">
                            <Link href="/businesses">Explore Catalog</Link>
                        </Button>
                    </Card>

                    <Card className="p-8 group">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform">
                            <TrendingUp className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900 mb-2">Referrer Tips</h3>
                        <p className="text-sm text-zinc-500 leading-relaxed mb-6">
                            Sharing your link in local Facebook groups can increase your lead volume by 3x.
                        </p>
                        <Button asChild variant="outline" className="w-full rounded-xl border-zinc-200 h-12">
                            <Link href="/contact">Learn More</Link>
                        </Button>
                    </Card>
                </div>
            </div>
        </div>
    );
}
