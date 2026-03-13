"use client";

import { Gift, ChevronRight, History, ShieldCheck, Mail, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { WithdrawalForm } from "@/components/dashboard/WithdrawalForm";

interface Payout {
    id: string;
    amount_cents: number;
    created_at: string;
    destination_email?: string;
    method?: string;
}

interface MobileReferrerRewardsProps {
    referrer: any;
    payouts: Payout[];
}

export function MobileReferrerRewards({ referrer, payouts }: MobileReferrerRewardsProps) {
    const pendingBalance = (referrer.wallet_balance_cents || 0) / 100;
    const totalEarned = (referrer.total_earned_cents || 0) / 100;
    const prezzeePayouts = payouts.filter(p => p.method === 'PREZZEE_SWAP');
    const isReady = pendingBalance >= 25;

    return (
        <div className="lg:hidden flex flex-col min-h-screen bg-white pb-32">
            <div className="pt-4 px-5 flex flex-col gap-6">
                {/* ── Header ── */}
                <h1 className="text-[28px] font-extrabold text-[#18181B] leading-tight">Gift Card Rewards</h1>

                {/* ── Balance Card ── */}
                <div className="bg-zinc-900 rounded-[24px] p-6 text-white relative overflow-hidden">
                    <div className="relative z-10 flex flex-col gap-1">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">Reward Balance</p>
                        <p className="text-[44px] font-black text-white tracking-tighter text-center leading-none">
                            ${pendingBalance.toFixed(2)}
                        </p>
                        <p className={`text-[12px] font-bold text-center mt-2 ${isReady ? 'text-green-400' : 'text-zinc-500'}`}>
                            {isReady ? "Ready to claim" : `Collect $${(25 - pendingBalance).toFixed(2)} more to claim`}
                        </p>
                    </div>
                </div>

                {/* ── Claim Section ── */}
                <div className="flex flex-col gap-2">
                    <WithdrawalForm 
                        totalPendingCents={referrer.wallet_balance_cents || 0} 
                        maxClaimCents={30000} 
                    />
                </div>

                {/* ── Stats Row ── */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#F4F4F5] rounded-2xl p-4 flex flex-col gap-1">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total Earned</p>
                        <p className="text-xl font-black text-[#18181B]">${totalEarned.toFixed(2)}</p>
                    </div>
                    <div className="bg-[#F4F4F5] rounded-2xl p-4 flex flex-col gap-1">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total Claims</p>
                        <p className="text-xl font-black text-[#18181B]">{prezzeePayouts.length}</p>
                    </div>
                </div>

                {/* ── Recent History ── */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-[#18181B] tracking-tight">Recent Gift Cards</h3>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                        {prezzeePayouts.length === 0 ? (
                            <div className="p-8 text-center bg-zinc-50 rounded-[20px] border border-zinc-100">
                                <p className="text-sm font-medium text-zinc-400">No cards issued yet.</p>
                            </div>
                        ) : (
                            prezzeePayouts.slice(0, 3).map(p => (
                                <div key={p.id} className="bg-white border border-[#E4E4E7] rounded-[20px] p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                                            <Gift className="w-5 h-5 text-orange-500" />
                                        </div>
                                        <div>
                                            <p className="text-[15px] font-bold text-zinc-900">${(p.amount_cents / 100).toFixed(2)}</p>
                                            <p className="text-[11px] font-medium text-zinc-400">{new Date(p.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black bg-green-50 text-green-600 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                        ISSUED
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* ── How it Works ── */}
                <div className="bg-orange-50 rounded-[24px] p-6 flex flex-col gap-4 border border-orange-100/50">
                    <h3 className="text-base font-black text-orange-950">How it works</h3>
                    <div className="flex flex-col gap-4">
                        {[
                            { icon: CheckCircle2, title: "Job Confirmed", desc: "Business confirms the job was completed." },
                            { icon: ShieldCheck, title: "Reward Applied", desc: "Your balance increases by 80% of the unlock fee." },
                            { icon: Mail, title: "Email Delivery", desc: "Gift cards are sent to your email instantly." }
                        ].map((item, i) => (
                            <div key={i} className="flex gap-3">
                                <item.icon className="w-5 h-5 text-orange-500 shrink-0" />
                                <div>
                                    <p className="text-[13px] font-bold text-orange-900 leading-none mb-1">{item.title}</p>
                                    <p className="text-[11px] font-medium text-orange-700/70">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
