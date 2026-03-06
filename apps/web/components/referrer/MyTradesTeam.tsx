"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { Users, Plus, Shield, Share2 } from "lucide-react";
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
            <div className="bg-white rounded-2xl border border-zinc-200 p-4 animate-pulse">
                <div className="h-4 bg-zinc-100 rounded w-32 mb-3" />
                <div className="flex gap-3">
                    {[1,2,3,4,5,6].map(i => <div key={i} className="w-[60px] h-[80px] bg-zinc-50 rounded-2xl shrink-0" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-zinc-200 p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-zinc-900 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-orange-500" /> My Trades Team
                    </h3>
                    {businesses.length > 0 && (
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">${totalEarned.toFixed(0)} earned</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {referrerId && businesses.length > 0 && (
                        <button
                            onClick={() => {
                                const url = `${window.location.origin}/team/${referrerId}`;
                                navigator.clipboard.writeText(url);
                                toast.success("Team link copied!");
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-bold hover:bg-orange-100 transition-colors"
                        >
                            <Share2 className="w-3 h-3" /> Share
                        </button>
                    )}
                </div>
            </div>

            {/* Tag-cloud: 32px avatar + 16px name side-by-side */}
            <div className="flex flex-wrap gap-2">
                {/* Filled slots */}
                {filledCategories.map(cat => {
                    const biz = teamMap.get(cat)!;
                    return (
                        <Link
                            key={cat}
                            href={`/dashboard/referrer/refer/${biz.slug}`}
                            className="inline-flex items-center gap-2 bg-zinc-50 hover:bg-orange-50 border border-zinc-200 hover:border-orange-300 rounded-full pl-1 pr-3 py-1 group transition-all"
                        >
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-200 flex items-center justify-center shrink-0">
                                {biz.logo_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={biz.logo_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-base font-black text-zinc-500 group-hover:text-orange-500">{biz.name.charAt(0)}</span>
                                )}
                            </div>
                            <span className="text-base font-semibold text-zinc-700 group-hover:text-orange-600 transition-colors">{cat}</span>
                            {biz.earned > 0 && (
                                <span className="text-base font-black text-green-600">${biz.earned.toFixed(0)}</span>
                            )}
                        </Link>
                    );
                })}

                {/* Empty slots */}
                {emptySlots.map(trade => (
                    <Link
                        key={trade}
                        href={`/businesses?category=${encodeURIComponent(trade)}`}
                        className="inline-flex items-center gap-2 border-2 border-dashed border-zinc-200 hover:border-orange-300 hover:bg-orange-50/50 rounded-full pl-1 pr-3 py-1 group transition-all"
                    >
                        <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                            <Plus className="w-4 h-4 text-zinc-300 group-hover:text-orange-400" />
                        </div>
                        <span className="text-base font-semibold text-zinc-400 group-hover:text-orange-500">+ {trade}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
