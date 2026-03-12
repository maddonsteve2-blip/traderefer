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

    const apiUrl = "/api/backend";

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

    const teamMap = new Map<string, TeamBusiness>();
    businesses.forEach(b => {
        const cat = b.trade_category || "Other";
        if (!teamMap.has(cat)) {
            teamMap.set(cat, b);
        }
    });

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
            <div className="bg-white rounded-2xl border border-zinc-200 px-3 py-2.5 flex items-center gap-3 animate-pulse">
                <div className="h-4 bg-zinc-100 rounded w-24 shrink-0" />
                <div className="flex gap-2 overflow-hidden">
                    {[1,2,3,4,5].map(i => <div key={i} className="w-32 h-10 bg-zinc-50 rounded-full shrink-0" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-zinc-200 px-4 py-3 flex items-center gap-4 min-h-0" style={{ maxHeight: 100 }}>
            {/* Dock label + share — shrink-0 so it never wraps */}
            <div className="flex items-center gap-2.5 shrink-0">
                <Users className="w-5 h-5 text-orange-500" />
                <span className="text-lg font-black text-zinc-900 whitespace-nowrap">My Team</span>
                {businesses.length > 0 && (
                    <span className="text-base font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full whitespace-nowrap">${totalEarned.toFixed(0)}</span>
                )}
                {referrerId && businesses.length > 0 && (
                    <button
                        onClick={() => {
                            const url = `${window.location.origin}/team/${referrerId}`;
                            navigator.clipboard.writeText(url);
                            toast.success("Team link copied!");
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 text-orange-600 rounded-full text-base font-bold hover:bg-orange-100 transition-colors"
                    >
                        <Share2 className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Horizontal scroll dock — single row, 48px avatars */}
            <div className="overflow-x-auto flex-1 scrollbar-hide">
                <div className="flex gap-3 flex-nowrap w-max">
                    {/* Filled slots */}
                    {filledCategories.map(cat => {
                        const biz = teamMap.get(cat)!;
                        return (
                            <Link
                                key={cat}
                                href={`/dashboard/referrer/refer/${biz.slug}`}
                                className="inline-flex items-center gap-3 bg-zinc-50 hover:bg-orange-50 border border-zinc-200 hover:border-orange-300 rounded-full pl-1.5 pr-4 py-1.5 group transition-all shrink-0"
                            >
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-200 flex items-center justify-center shrink-0">
                                    {biz.logo_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={biz.logo_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-lg font-black text-zinc-500 group-hover:text-orange-500">{biz.name.charAt(0)}</span>
                                    )}
                                </div>
                                <div className="flex flex-col leading-tight">
                                    <span className="text-lg font-bold text-zinc-700 group-hover:text-orange-600 transition-colors whitespace-nowrap">{cat}</span>
                                    {biz.earned > 0 && (
                                        <span className="text-base font-black text-green-600">${biz.earned.toFixed(0)}</span>
                                    )}
                                </div>
                            </Link>
                        );
                    })}

                    {/* Empty slots */}
                    {emptySlots.map(trade => (
                        <Link
                            key={trade}
                            href={`/dashboard/referrer/businesses?trade=${encodeURIComponent(trade)}`}
                            className="inline-flex items-center gap-3 border-2 border-dashed border-zinc-200 hover:border-orange-300 hover:bg-orange-50/50 rounded-full pl-1.5 pr-4 py-1.5 group transition-all shrink-0"
                        >
                            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                                <Plus className="w-5 h-5 text-zinc-300 group-hover:text-orange-400" />
                            </div>
                            <span className="text-lg font-bold text-zinc-400 group-hover:text-orange-500 whitespace-nowrap">+ {trade}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
