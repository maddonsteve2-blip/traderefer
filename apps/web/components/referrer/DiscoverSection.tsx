"use client";

import { useEffect, useState } from "react";
import { Flame, Trophy, Sparkles, Star, Zap, Award, Crown, ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { BusinessLogo } from "@/components/BusinessLogo";

interface Business {
    id: string;
    business_name: string;
    slug: string;
    trade_category: string;
    suburb: string;
    state: string;
    referral_fee_cents: number;
    logo_url: string | null;
    logo_bg_color?: string | null;
    trust_score: number;
    is_verified: boolean;
}

interface Earner {
    rank: number;
    tier: string;
    month_earnings_cents: number;
    leads_this_month: number;
}

const TIER_ICONS: Record<string, any> = { bronze: Star, silver: Zap, gold: Award, platinum: Crown };
const TIER_COLORS: Record<string, string> = { bronze: "text-amber-600", silver: "text-zinc-400", gold: "text-yellow-500", platinum: "text-blue-500" };

function BusinessCard({ biz }: { biz: Business }) {
    return (
        <Link href={`/dashboard/referrer/refer/${biz.slug}`} className="block">
            <div className="bg-white rounded-2xl border border-zinc-200 p-5 hover:shadow-lg hover:border-orange-200 transition-all group">
                <div className="flex items-center gap-3 mb-3">
                    <BusinessLogo logoUrl={biz.logo_url} name={biz.business_name} size="sm" className="shrink-0" bgColor={biz.logo_bg_color} />
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-zinc-900 text-[19px] truncate group-hover:text-orange-600 transition-colors leading-tight">
                            {biz.business_name}
                        </div>
                        <div className="text-[19px] text-zinc-400 truncate">{biz.trade_category} · {biz.suburb}</div>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-[24px] font-black text-green-600">${(biz.referral_fee_cents / 100).toFixed(0)}<span className="text-[19px] font-bold text-zinc-400">/lead</span></span>
                    {biz.is_verified && (
                        <span className="text-base font-black text-blue-500 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">Verified</span>
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
    const [activeTab, setActiveTab] = useState<"hot" | "new">("hot");
    const [suburb, setSuburb] = useState<string | null>(null);
    const [state, setRefState] = useState<string | null>(null);

    const { getToken, isSignedIn } = useAuth();
    const apiUrl = "/api/backend";

    useEffect(() => {
        if (!isSignedIn) return;
        getToken().then(token =>
            fetch(`${apiUrl}/referrer/me`, { headers: { Authorization: `Bearer ${token}` } })
                .then(r => r.ok ? r.json() : null)
                .then(d => {
                    if (d?.suburb) setSuburb(d.suburb);
                    if (d?.state) setRefState(d.state);
                })
                .catch(() => {})
        );
    }, [isSignedIn]);

    // Phase 1: always fetch immediately with no params — proxy through /api/discover to avoid CORS
    useEffect(() => {
        Promise.all([
            fetch(`/api/discover/hot`).then(r => r.ok ? r.json() : []),
            fetch(`/api/discover/new`).then(r => r.ok ? r.json() : []),
            fetch(`/api/discover/top-earners`).then(r => r.ok ? r.json() : []),
        ]).then(([h, n, t]) => {
            setHot(h);
            setNewBiz(n);
            setTopEarners(t);
        }).catch(() => {});
    }, []);

    // Phase 2: when suburb/state is known, re-fetch locale-first (only replace if results non-empty)
    useEffect(() => {
        if (!suburb && !state) return;
        const params = new URLSearchParams();
        if (suburb) params.set('suburb', suburb);
        if (state) params.set('state', state);
        const q = `?${params.toString()}`;
        Promise.all([
            fetch(`/api/discover/hot${q}`).then(r => r.ok ? r.json() : []),
            fetch(`/api/discover/new${q}`).then(r => r.ok ? r.json() : []),
        ]).then(([h, n]) => {
            if (h.length > 0) setHot(h);
            if (n.length > 0) setNewBiz(n);
        }).catch(() => {});
    }, [suburb, state]);

    if (hot.length === 0 && newBiz.length === 0 && topEarners.length === 0) return null;

    const hasHot = hot.length > 0;
    const hasNew = newBiz.length > 0;

    return (
        <div className="space-y-4">
            {/* Tabbed Opportunities */}
            {(hasHot || hasNew) && (
                <div>
                    <div className="flex items-center justify-between mb-2">
                        {/* Tabs + suburb label */}
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-zinc-100 rounded-xl p-1">
                                {hasHot && (
                                    <button
                                        onClick={() => setActiveTab("hot")}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[19px] font-black transition-all ${
                                            activeTab === "hot" ? "bg-white text-orange-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                                        }`}
                                    >
                                        <Flame className="w-5 h-5" /> Hot Right Now
                                    </button>
                                )}
                                {hasNew && (
                                    <button
                                        onClick={() => setActiveTab("new")}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[19px] font-black transition-all ${
                                            activeTab === "new" ? "bg-white text-purple-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                                        }`}
                                    >
                                        <Sparkles className="w-5 h-5" /> New
                                    </button>
                                )}
                            </div>
                            {suburb && (
                                <span className="hidden sm:flex items-center gap-1.5 text-[19px] font-bold text-zinc-500">
                                    <MapPin className="w-4 h-4 text-orange-400" /> Near {suburb}
                                </span>
                            )}
                        </div>
                        <Link href="/dashboard/referrer/businesses" className="text-[21px] font-black text-orange-500 hover:text-orange-600 flex items-center gap-0.5 underline underline-offset-4">
                            View All <ChevronRight className="w-5 h-5" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {(activeTab === "hot" ? hot : newBiz).slice(0, 4).map(biz => (
                            <BusinessCard key={biz.id} biz={biz} />
                        ))}
                    </div>
                </div>
            )}

            {/* Top Earners Leaderboard */}
            {topEarners.length > 0 && (
                <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-[32px] p-8 shadow-xl">
                    <h3 className="text-[24px] font-black text-white flex items-center gap-3 mb-6 uppercase tracking-tighter">
                        <Trophy className="w-6 h-6 text-amber-400" /> Top Earners This Month
                    </h3>
                    <div className="space-y-3">
                        {topEarners.map(e => {
                            const TIcon = TIER_ICONS[e.tier] || Star;
                            const tColor = TIER_COLORS[e.tier] || "text-zinc-400";
                            return (
                                <div key={e.rank} className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-all rounded-2xl border border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-[19px] ${
                                            e.rank === 1 ? "bg-amber-400/20 text-amber-400" :
                                            e.rank === 2 ? "bg-zinc-400/20 text-zinc-400" :
                                            e.rank === 3 ? "bg-orange-400/20 text-orange-400" :
                                            "bg-white/10 text-zinc-500"
                                        }`}>
                                            #{e.rank}
                                        </div>
                                        <div>
                                            <div className="text-[19px] font-black text-white flex items-center gap-2">
                                                Anonymous Referrer
                                                <TIcon className={`w-4 h-4 ${tColor}`} />
                                            </div>
                                            <div className="text-base text-zinc-400 font-medium">{e.leads_this_month} leads this month</div>
                                        </div>
                                    </div>
                                    <span className="font-black text-green-400 text-[21px]">${(e.month_earnings_cents / 100).toFixed(0)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
