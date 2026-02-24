"use client";

import { useEffect, useState } from "react";
import { Flame, Sparkles, Trophy, DollarSign, Star, Zap, Award, Crown, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Business {
    id: string;
    business_name: string;
    slug: string;
    trade_category: string;
    suburb: string;
    state: string;
    referral_fee_cents: number;
    logo_url: string | null;
    trust_score: number;
    is_verified: boolean;
}

interface Earner {
    rank: number;
    tier: string;
    month_earnings_cents: number;
    leads_this_month: number;
}

const TIER_ICONS: Record<string, any> = { starter: Star, pro: Zap, elite: Award, ambassador: Crown };
const TIER_COLORS: Record<string, string> = { starter: "text-zinc-400", pro: "text-blue-500", elite: "text-purple-500", ambassador: "text-amber-500" };

function BusinessCard({ biz }: { biz: Business }) {
    return (
        <Link href={`/b/${biz.slug}/refer`} className="block">
            <div className="bg-white rounded-2xl border border-zinc-200 p-4 hover:shadow-lg hover:border-orange-200 transition-all group">
                <div className="flex items-center gap-3 mb-3">
                    {biz.logo_url ? (
                        <img src={biz.logo_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
                    ) : (
                        <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 font-black text-sm">
                            {biz.business_name.charAt(0)}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-zinc-900 text-sm truncate group-hover:text-orange-600 transition-colors">
                            {biz.business_name}
                        </div>
                        <div className="text-xs text-zinc-400">{biz.trade_category} · {biz.suburb}</div>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-green-600">${(biz.referral_fee_cents / 100).toFixed(0)}/lead</span>
                    {biz.is_verified && (
                        <span className="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">Verified</span>
                    )}
                </div>
            </div>
        </Link>
    );
}

export function DiscoverSection() {
    const [hot, setHot] = useState<Business[]>([]);
    const [newBiz, setNewBiz] = useState<Business[]>([]);
    const [topEarners, setTopEarners] = useState<Earner[]>([]);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    useEffect(() => {
        Promise.all([
            fetch(`${apiUrl}/discover/hot`).then(r => r.ok ? r.json() : []),
            fetch(`${apiUrl}/discover/new`).then(r => r.ok ? r.json() : []),
            fetch(`${apiUrl}/discover/top-earners`).then(r => r.ok ? r.json() : []),
        ]).then(([h, n, t]) => {
            setHot(h);
            setNewBiz(n);
            setTopEarners(t);
        }).catch(() => {});
    }, [apiUrl]);

    if (hot.length === 0 && newBiz.length === 0 && topEarners.length === 0) return null;

    return (
        <div className="space-y-8 mb-10">
            {/* Hot Right Now */}
            {hot.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                            <Flame className="w-5 h-5 text-orange-500" /> Hot Right Now
                        </h3>
                        <Link href="/businesses" className="text-sm font-bold text-orange-500 hover:underline flex items-center gap-1">
                            View All <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {hot.slice(0, 4).map(biz => (
                            <BusinessCard key={biz.id} biz={biz} />
                        ))}
                    </div>
                </div>
            )}

            {/* New on TradeRefer */}
            {newBiz.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-500" /> New on TradeRefer
                        </h3>
                        <Link href="/businesses" className="text-sm font-bold text-purple-500 hover:underline flex items-center gap-1">
                            View All <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {newBiz.slice(0, 4).map(biz => (
                            <BusinessCard key={biz.id} biz={biz} />
                        ))}
                    </div>
                </div>
            )}

            {/* Top Earners Leaderboard */}
            {topEarners.length > 0 && (
                <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                        <Trophy className="w-5 h-5 text-amber-400" /> Top Earners This Month
                    </h3>
                    <div className="space-y-2">
                        {topEarners.map(e => {
                            const TIcon = TIER_ICONS[e.tier] || Star;
                            const tColor = TIER_COLORS[e.tier] || "text-zinc-400";
                            return (
                                <div key={e.rank} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                                            e.rank === 1 ? "bg-amber-400/20 text-amber-400" :
                                            e.rank === 2 ? "bg-zinc-400/20 text-zinc-400" :
                                            e.rank === 3 ? "bg-orange-400/20 text-orange-400" :
                                            "bg-white/10 text-zinc-500"
                                        }`}>
                                            #{e.rank}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white flex items-center gap-1.5">
                                                Anonymous Referrer
                                                <TIcon className={`w-3.5 h-3.5 ${tColor}`} />
                                            </div>
                                            <div className="text-xs text-zinc-500">{e.leads_this_month} leads this month</div>
                                        </div>
                                    </div>
                                    <span className="font-black text-green-400 text-sm">${(e.month_earnings_cents / 100).toFixed(0)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
