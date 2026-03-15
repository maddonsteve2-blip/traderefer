"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Share2, Target, DollarSign, Users, Star, Zap, AlertTriangle, Wallet, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { InviteReferrersDialog } from "@/components/dashboard/InviteReferrersDialog";

interface MobileBusinessDashboardProps {
    business: any;
    stats: any[];
    recentLeads?: any[];
}

const ICON_MAP: Record<string, React.ElementType> = { Target, Zap, Star, Users, DollarSign };

export function MobileBusinessDashboard({ business, stats, recentLeads }: MobileBusinessDashboardProps) {
    const { user } = useUser();
    const [showInviteModal, setShowInviteModal] = useState(false);
    const displayName = user?.firstName || (business?.name ? business.name.split(' ')[0] : "there");

    return (
        <div className="lg:hidden flex flex-col gap-6 pb-12">
            {/* Header / Welcome */}
            <div className="flex flex-col gap-1">
                <h1 className="text-[24px] font-[900] text-zinc-900 leading-tight">
                    Welcome back, {displayName}
                </h1>
                <p className="text-[14px] font-bold text-zinc-500 uppercase tracking-widest">
                    Business Dashboard
                </p>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 gap-3">
                {stats.slice(0, 4).map((stat) => {
                    const Icon = ICON_MAP[stat.icon] || Target;
                    return (
                        <div key={stat.label} className="bg-white border border-zinc-100 rounded-[20px] p-4 flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center">
                                    <Icon className="w-4 h-4" />
                                </div>
                                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none">
                                    {stat.label}
                                </span>
                            </div>
                            <div className="text-[20px] font-black text-zinc-900 leading-none">
                                {stat.value}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Wallet Warning */}
            {(business?.wallet_balance_cents ?? 0) < 2500 && (
                <div className="bg-red-50 border border-red-200 rounded-[20px] p-4 flex items-start gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-black text-red-800 leading-tight">Low wallet balance</p>
                        <p className="text-[13px] font-bold text-red-600 mt-0.5">Top up to unlock incoming leads. Min $25 required.</p>
                    </div>
                    <Link href="/dashboard/business/wallet" className="shrink-0 px-4 py-2 bg-red-600 text-white rounded-xl text-[13px] font-black">
                        Top Up
                    </Link>
                </div>
            )}

            {/* Action Queue — recent leads */}
            {Array.isArray(recentLeads) && recentLeads.length > 0 && (
                <div className="bg-white border border-zinc-100 rounded-[20px] p-4">
                    <h3 className="text-[13px] font-black text-zinc-400 uppercase tracking-widest mb-3">Action Queue</h3>
                    <div className="space-y-2">
                        {recentLeads.slice(0, 3).map((lead: any) => (
                            <Link
                                key={lead.id}
                                href={`/dashboard/business/sales?tab=leads`}
                                className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 hover:bg-orange-50 transition-all"
                            >
                                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                                    <Target className="w-4 h-4 text-orange-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[14px] font-black text-zinc-900 truncate">{lead.consumer_name || "New Lead"}</p>
                                    <p className="text-[12px] font-bold text-zinc-400 truncate">{lead.suburb || lead.trade_category || ""}</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-zinc-300 shrink-0" />
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Referral Card (The "Simplified Mobile" Look) */}
            <div className="bg-zinc-900 rounded-[24px] p-6 flex flex-col gap-4 text-white shadow-xl shadow-zinc-900/10">
                <div className="flex flex-col gap-1">
                    <h2 className="text-[18px] font-black tracking-tight">Your Referral Network</h2>
                    <p className="text-[14px] text-zinc-400 font-medium leading-relaxed">
                        Share your unique portal link with trusted partners to grow your business.
                    </p>
                </div>
                
                <button 
                    onClick={() => setShowInviteModal(true)}
                    className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white rounded-[20px] flex items-center justify-center gap-3 font-black text-[16px] shadow-lg shadow-orange-600/20 transition-all active:scale-[0.98]"
                >
                    <Share2 className="w-5 h-5" />
                    Share Invite Link
                </button>
            </div>

            {/* Invite Modal */}
            <InviteReferrersDialog 
                open={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                businessName={business?.name || "Business"}
                slug={business?.slug || ""}
            />
        </div>
    );
}
