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

    const { stats, links, referrer } = data;

    return (
        <div className="min-h-screen bg-zinc-50 pt-16">
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-black text-zinc-900 font-display">Your Earnings</h1>
                        <p className="text-zinc-500 font-medium">Track your referrals and collect Prezzee gift card rewards.</p>
                    </div>
                    <div className="flex gap-3">
                        <Button asChild variant="outline" className="rounded-full px-8 h-12 font-bold border-zinc-200">
                            <Link href="/dashboard/referrer/messages">Messages</Link>
                        </Button>
                        <Button asChild className="bg-zinc-900 hover:bg-black text-white rounded-full px-8 h-12 font-bold shadow-lg shadow-zinc-200">
                            <Link href="/dashboard/referrer/withdraw">Gift Card Rewards</Link>
                        </Button>
                    </div>
                </div>

                <EarningsDashboard />

                <DiscoverSection />

                <MyTradesTeam />

                <HotCampaigns />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card className="bg-zinc-900 p-8 text-white relative overflow-hidden shadow-2xl group">
                        <Rocket className="absolute -right-8 -bottom-8 w-40 h-40 text-orange-500/10 rotate-12 group-hover:scale-125 transition-transform duration-500" />
                        <h3 className="text-xl font-bold mb-4 relative z-10">Prezzee Gift Cards</h3>
                        <p className="text-zinc-400 text-sm mb-6 relative z-10 leading-relaxed">
                            Earn 80% of every unlock fee as a Prezzee Swap gift card — issued automatically after job confirmation. Spend it anywhere.
                        </p>
                        <div className="relative z-10">
                            <Button asChild className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full font-bold h-12">
                                <Link href="/dashboard/referrer/withdraw">View Rewards</Link>
                            </Button>
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
