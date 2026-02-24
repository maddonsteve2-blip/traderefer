"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { Users, Plus, DollarSign, MousePointer, Send, ChevronRight, Shield, Share2, Copy } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const TRADE_SLOTS = [
    "Plumber", "Electrician", "Carpenter", "Painter",
    "Tiler", "Roofer", "Landscaper", "Concreter",
    "Builder", "Fencer", "Cleaner", "HVAC"
];

interface TeamBusiness {
    name: string;
    trade_category: string;
    slug: string;
    logo_url: string | null;
    earned: number;
    leads: number;
    clicks: number;
    referral_fee_cents: number;
    is_verified: boolean;
    code: string;
}

export function MyTradesTeam() {
    const { getToken } = useAuth();
    const [businesses, setBusinesses] = useState<TeamBusiness[]>([]);
    const [loading, setLoading] = useState(true);
    const [referrerId, setReferrerId] = useState<string | null>(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    const fetchTeam = useCallback(async () => {
        try {
            const token = await getToken();
            const res = await fetch(`${apiUrl}/referrer/dashboard`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setBusinesses(data.links || []);
                if (data.referrer?.id) setReferrerId(data.referrer.id);
            }
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, [apiUrl, getToken]);

    useEffect(() => { fetchTeam(); }, [fetchTeam]);

    // Group businesses by trade category
    const teamMap = new Map<string, TeamBusiness>();
    businesses.forEach(b => {
        const cat = b.trade_category || "Other";
        // Keep the best earner per category
        if (!teamMap.has(cat) || (teamMap.get(cat)!.earned < b.earned)) {
            teamMap.set(cat, b);
        }
    });

    // Also track extra businesses per category
    const extraByCategory = new Map<string, TeamBusiness[]>();
    businesses.forEach(b => {
        const cat = b.trade_category || "Other";
        if (!extraByCategory.has(cat)) extraByCategory.set(cat, []);
        extraByCategory.get(cat)!.push(b);
    });

    // Determine which slots to show: filled ones + up to 4 empty ones
    const filledCategories = Array.from(teamMap.keys());
    const emptySlots = TRADE_SLOTS.filter(s => !filledCategories.includes(s)).slice(0, Math.max(2, 4 - filledCategories.length));

    const totalEarned = businesses.reduce((s, b) => s + b.earned, 0);
    const totalLeads = businesses.reduce((s, b) => s + b.leads, 0);

    if (loading) {
        return (
            <div className="bg-white rounded-[32px] border border-zinc-200 p-8 mb-8 animate-pulse">
                <div className="h-6 bg-zinc-100 rounded w-48 mb-4" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[1,2,3,4].map(i => <div key={i} className="h-28 bg-zinc-50 rounded-2xl" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[32px] border border-zinc-200 p-8 md:p-10 shadow-sm mb-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                        <Users className="w-5 h-5 text-orange-500" /> My Trades Team
                    </h3>
                    <p className="text-sm text-zinc-400 mt-1">Your go-to tradies across every category</p>
                </div>
                <div className="flex items-center gap-3">
                    {businesses.length > 0 && (
                        <div className="flex items-center gap-4 text-sm">
                            <span className="font-bold text-green-600">${totalEarned.toFixed(0)} earned</span>
                            <span className="text-zinc-300">·</span>
                            <span className="font-bold text-zinc-500">{totalLeads} leads</span>
                        </div>
                    )}
                    {referrerId && businesses.length > 0 && (
                        <button
                            onClick={() => {
                                const url = `${window.location.origin}/team/${referrerId}`;
                                navigator.clipboard.writeText(url);
                                toast.success("Team page link copied!");
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full text-xs font-bold hover:bg-orange-100 transition-colors"
                        >
                            <Share2 className="w-3 h-3" /> Share Team
                        </button>
                    )}
                </div>
            </div>

            {/* Complete Your Team nudge */}
            {emptySlots.length > 0 && businesses.length > 0 && businesses.length < 4 && (
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Plus className="w-4 h-4 text-orange-600" />
                    </div>
                    <p className="text-sm text-orange-800 font-medium">
                        <span className="font-bold">Complete your team!</span> You're earning from {filledCategories.length} trade{filledCategories.length !== 1 ? 's' : ''}. 
                        Add a {emptySlots[0]} to unlock more earning potential.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {/* Filled slots */}
                {filledCategories.map(cat => {
                    const biz = teamMap.get(cat)!;
                    const extras = (extraByCategory.get(cat) || []).length;
                    return (
                        <Link key={cat} href={`/b/${biz.slug}/refer`} className="block group">
                            <div className="bg-zinc-50 rounded-2xl border border-zinc-100 p-4 hover:border-orange-200 hover:bg-white hover:shadow-md transition-all h-full">
                                <div className="flex items-center gap-2.5 mb-3">
                                    {biz.logo_url ? (
                                        <img src={biz.logo_url} alt="" className="w-9 h-9 rounded-xl object-cover" />
                                    ) : (
                                        <div className="w-9 h-9 rounded-xl bg-zinc-200 flex items-center justify-center text-zinc-500 font-black text-xs">
                                            {biz.name.charAt(0)}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-zinc-900 truncate group-hover:text-orange-600 transition-colors">
                                            {biz.name}
                                        </div>
                                        <div className="text-xs text-zinc-400 flex items-center gap-1">
                                            {cat}
                                            {biz.is_verified && <Shield className="w-3 h-3 text-blue-500" />}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-green-600">${biz.earned.toFixed(0)}</span>
                                    <span className="text-zinc-400">{biz.leads} leads</span>
                                </div>
                                {extras > 1 && (
                                    <div className="text-[10px] text-zinc-300 font-bold mt-1.5">+{extras - 1} more {cat}</div>
                                )}
                            </div>
                        </Link>
                    );
                })}

                {/* Empty slots */}
                {emptySlots.map(trade => (
                    <Link key={trade} href={`/businesses?category=${encodeURIComponent(trade)}`} className="block">
                        <div className="border-2 border-dashed border-zinc-200 rounded-2xl p-4 hover:border-orange-300 hover:bg-orange-50/50 transition-all h-full flex flex-col items-center justify-center text-center gap-2 min-h-[100px]">
                            <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center">
                                <Plus className="w-4 h-4 text-zinc-400" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-zinc-400">{trade}</div>
                                <div className="text-[10px] text-zinc-300 font-medium">Find one</div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
