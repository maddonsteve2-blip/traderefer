"use client";

import Link from "next/link";
import { Users, UserPlus, ChevronRight, Shield, ArrowRight, Share2, Search } from "lucide-react";

interface MobileNetworkDashboardProps {
    given: any[];
    received: any[];
    invitesCount: number;
}

export function MobileNetworkDashboard({ given, received, invitesCount }: MobileNetworkDashboardProps) {
    return (
        <div className="lg:hidden flex flex-col gap-6 pb-12">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-[28px] font-[800] text-zinc-900 leading-tight tracking-tight">
                    Network
                </h1>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#F4F4F5] rounded-[16px] p-4 flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Total Partners</span>
                    <span className="text-[24px] font-[800] text-zinc-900 leading-none">{given.length + received.length}</span>
                </div>
                <div className="bg-[#F4F4F5] rounded-[16px] p-4 flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Sent Invites</span>
                    <span className="text-[24px] font-[800] text-zinc-900 leading-none">{invitesCount}</span>
                </div>
            </div>

            {/* Main Action */}
            <Link 
                href="/dashboard/business/network?tab=invite" 
                className="w-full h-[56px] bg-zinc-900 rounded-[16px] flex items-center justify-center gap-2 text-white font-[700] text-[15px] active:scale-[0.98] transition-all"
            >
                <UserPlus className="w-5 h-5 text-zinc-400" />
                Invite New Partner
            </Link>

            {/* Performance List */}
            <div className="flex flex-col gap-4">
                <h2 className="text-[18px] font-black text-zinc-900">Partner Performance</h2>
                
                <div className="flex flex-col gap-3">
                    {given.length > 0 ? given.slice(0, 5).map((r) => (
                        <Link key={r.slug} href={`/b/${r.slug}`} className="bg-white border border-zinc-100 rounded-[24px] p-4 flex items-center gap-4">
                            <div className="w-11 h-11 bg-zinc-100 rounded-full flex items-center justify-center font-black text-zinc-400 uppercase">
                                {r.business_name?.[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[15px] font-bold text-zinc-900 truncate">{r.business_name}</p>
                                <p className="text-[12px] font-medium text-zinc-500 truncate">{r.trade_category} · {r.suburb}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-zinc-300" />
                        </Link>
                    )) : (
                        <div className="py-12 text-center text-zinc-400">
                            <p className="font-bold">No partners yet</p>
                            <p className="text-sm">Start by inviting your trusted trades.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
