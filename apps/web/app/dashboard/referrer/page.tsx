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

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { StripeConnectButton } from "@/components/dashboard/StripeConnectButton";

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
        redirect("/onboarding/referrer");
    }

    if (!res.ok) {
        return { error: true };
    }

    return res.json();
}

export default async function ReferrerDashboardPage() {
    const data = await getDashboardData();

    if (!data || data.error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50">
                <div className="text-center p-8 bg-white rounded-3xl border shadow-sm max-w-md">
                    <h2 className="text-xl font-bold mb-4 text-zinc-900">Portal Limited</h2>
                    <p className="text-zinc-500 mb-6 text-sm">We couldn&apos;t connect to your referrer profile. Please try refreshing.</p>
                    <Button asChild className="bg-orange-500 hover:bg-orange-600 rounded-full px-8">
                        <Link href="/dashboard/referrer">Refresh Dashboard</Link>
                    </Button>
                </div>
            </div>
        );
    }

    const { stats, links, referrer } = data;

    return (
        <div className="min-h-screen bg-zinc-50 pt-16">
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-black text-zinc-900 font-display">Your Earnings</h1>
                        <p className="text-zinc-500 font-medium">Track your referrals and withdraw your cash.</p>
                    </div>
                    <div className="flex gap-3">
                        <Button asChild variant="outline" className="rounded-full px-8 h-12 font-bold border-zinc-200">
                            <Link href="/dashboard/referrer/messages">Messages</Link>
                        </Button>
                        <Button asChild className="bg-zinc-900 hover:bg-black text-white rounded-full px-8 h-12 font-bold shadow-lg shadow-zinc-200">
                            <Link href="/dashboard/referrer/withdraw">Withdraw Funds</Link>
                        </Button>
                    </div>
                </div>

                <EarningsDashboard />

                <Card className="p-8 md:p-10 mb-10 shadow-xl shadow-zinc-200/50">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                            <Users className="w-5 h-5 text-orange-500" /> Your Businesses
                        </h3>
                        <Link href="/businesses" className="text-base font-black text-orange-600 uppercase tracking-widest hover:underline flex items-center gap-1">
                            Find New Businesses <Plus className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {links.map((link: any) => (
                            <div key={link.name} className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100 flex items-center justify-between gap-4 hover:border-orange-200 hover:bg-white transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-zinc-100 group-hover:border-orange-100 transition-colors">
                                        <Users className="w-5 h-5 text-zinc-400 group-hover:text-orange-500 transition-colors" />
                                    </div>
                                    <div>
                                        <div className="text-base font-bold text-zinc-900 group-hover:text-orange-600 transition-colors">{link.name}</div>
                                        <div className="text-base text-zinc-400 font-bold uppercase tracking-widest">{link.sub}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 md:gap-6">
                                    <div className="text-right">
                                        <div className="font-black text-zinc-900 leading-none">{link.leads}</div>
                                        <div className="text-base font-bold text-zinc-300 uppercase">Referrals</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-black text-orange-600 leading-none">${link.earned.toFixed(2)}</div>
                                        <div className="text-base font-bold text-orange-300 uppercase">Earned</div>
                                    </div>
                                    <Button asChild variant="ghost" size="icon" className="rounded-full hover:bg-white text-zinc-400 hover:text-orange-600">
                                        <Link href={`/b/${link.slug}/refer`}>
                                            <ExternalLink className="w-4 h-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <HotCampaigns />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card className="bg-zinc-900 p-8 text-white relative overflow-hidden shadow-2xl group">
                        <Rocket className="absolute -right-8 -bottom-8 w-40 h-40 text-orange-500/10 rotate-12 group-hover:scale-125 transition-transform duration-500" />
                        <h3 className="text-xl font-bold mb-4 relative z-10">Stripe Payouts</h3>
                        <p className="text-zinc-400 text-sm mb-6 relative z-10 leading-relaxed">
                            {referrer.stripe_connected
                                ? "Your Stripe account is connected. Commissions are sent automatically."
                                : "Connect Stripe to receive your commissions directly."}
                        </p>

                        {!referrer.stripe_connected ? (
                            <div className="relative z-10">
                                <StripeConnectButton type="referrer" />
                            </div>
                        ) : (
                            <div className="p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20 relative z-10 flex items-center gap-3">
                                <TrendingUp className="w-4 h-4 text-orange-400" />
                                <span className="text-base font-bold text-orange-400 uppercase tracking-widest">Payouts Enabled</span>
                            </div>
                        )}
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
