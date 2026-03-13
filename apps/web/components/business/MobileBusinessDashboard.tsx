"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { User, Bell, ChevronRight, Share2, Target, DollarSign, Users, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileBusinessDashboardProps {
    business: any;
    stats: any[];
    recentLeads: any[];
}

const ICON_MAP: Record<string, React.ElementType> = { Target, Zap, Star, Users, DollarSign };

export function MobileBusinessDashboard({ business, stats, recentLeads }: MobileBusinessDashboardProps) {
    const { user } = useUser();
    const displayName = user?.firstName || business.name.split(' ')[0];

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
            <div className="bg-zinc-900 rounded-[24px] p-6 flex flex-col gap-4 text-white">
                <div className="flex flex-col gap-1">
                    <h2 className="text-[16px] font-black tracking-tight">Your Referral Network</h2>
                    <p className="text-[13px] text-zinc-400 font-medium leading-relaxed">
                        Share your professional link to start earning commissions instantly.
                    </p>
                </div>
                
                <button 
                    onClick={() => {
                        const url = `https://traderefer.au/onboarding/referrer?invite=${business.slug}`;
                        navigator.clipboard.writeText(url);
                        alert("Link copied!");
                    }}
                    className="w-full h-[52px] bg-[#f97316] hover:bg-[#ea580c] text-white rounded-[16px] flex items-center justify-center gap-2 font-black text-[15px] transition-all active:scale-[0.98]"
                >
                    <Share2 className="w-4 h-4" />
                    Share My Link
                </button>
            </div>

            {/* Recent Activity */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-[18px] font-black text-zinc-900">Recent Activity</h2>
                    <Link href="/dashboard/business/sales?tab=leads" className="text-[13px] font-bold text-orange-600">
                        View All
                    </Link>
                </div>

                <div className="flex flex-col gap-3">
                    {recentLeads.slice(0, 3).map((lead) => (
                        <div key={lead.id} className="bg-white border border-zinc-100 rounded-[20px] p-4 flex items-center gap-4">
                            <div className="w-10 h-10 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-400 font-black text-sm uppercase">
                                {lead.contact_name?.[0] || 'L'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[15px] font-bold text-zinc-900 truncate">{lead.contact_name}</p>
                                <p className="text-[12px] font-medium text-zinc-500 truncate">{lead.service_type || 'General Lead'}</p>
                            </div>
                            <div className="text-right flex flex-col items-end gap-1">
                                <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full uppercase">
                                    {lead.status || 'NEW'}
                                </span>
                                <ChevronRight className="w-4 h-4 text-zinc-300" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
