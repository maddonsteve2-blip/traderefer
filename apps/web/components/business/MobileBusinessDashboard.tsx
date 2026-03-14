"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Share2, Target, DollarSign, Users, Star, Zap } from "lucide-react";
import { InviteReferrersDialog } from "@/components/dashboard/InviteReferrersDialog";

interface MobileBusinessDashboardProps {
    business: any;
    stats: any[];
    recentLeads?: any[];
}

const ICON_MAP: Record<string, React.ElementType> = { Target, Zap, Star, Users, DollarSign };

export function MobileBusinessDashboard({ business, stats }: MobileBusinessDashboardProps) {
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
                                <div className={`w-8 h-8 ${stat.bg} ${stat.color} rounded-lg flex items-center justify-center`}>
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
