"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import {
    DollarSign, TrendingUp, TrendingDown, Award, Target,
    ChevronRight, Loader2, Zap, Crown, Star, Flame, ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Stats {
    tier: string;
    tier_split: number;
    next_tier: string | null;
    referrals_to_next: number;
    total_referrals: number;
    earnings: {
        this_week: number;
        this_month: number;
        last_month: number;
        lifetime: number;
        pending: number;
        month_trend: number;
    };
    monthly_goal_cents: number | null;
    goal_progress: number | null;
    per_business: {
        business_name: string;
        slug: string;
        trade_category: string;
        lead_count: number;
        earned_cents: number;
    }[];
}

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: any; gradient: string }> = {
    starter: { label: "Starter", color: "text-zinc-600", bg: "bg-zinc-100", border: "border-zinc-200", icon: Star, gradient: "from-zinc-100 to-zinc-50" },
    pro: { label: "Pro", color: "text-blue-600", bg: "bg-blue-100", border: "border-blue-200", icon: Zap, gradient: "from-blue-100 to-blue-50" },
    elite: { label: "Elite", color: "text-purple-600", bg: "bg-purple-100", border: "border-purple-200", icon: Award, gradient: "from-purple-100 to-purple-50" },
    ambassador: { label: "Ambassador", color: "text-amber-600", bg: "bg-amber-100", border: "border-amber-200", icon: Crown, gradient: "from-amber-100 to-amber-50" },
};

const TIER_ORDER = ["starter", "pro", "elite", "ambassador"];
const TIER_MINS: Record<string, number> = { starter: 0, pro: 6, elite: 21, ambassador: 51 };

function cents(v: number) {
    return `$${(v / 100).toFixed(2)}`;
}

export function EarningsDashboard() {
    const { getToken } = useAuth();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [editingGoal, setEditingGoal] = useState(false);
    const [goalInput, setGoalInput] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const token = await getToken();
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
                const res = await fetch(`${apiUrl}/referrer/stats`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                    if (data.monthly_goal_cents) {
                        setGoalInput(String(data.monthly_goal_cents / 100));
                    }
                }
            } catch {
                // silent
            } finally {
                setLoading(false);
            }
        })();
    }, [getToken]);

    const saveGoal = async () => {
        const val = parseFloat(goalInput);
        if (isNaN(val) || val < 0) { toast.error("Enter a valid amount"); return; }
        try {
            const token = await getToken();
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            await fetch(`${apiUrl}/referrer/goal`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ monthly_goal_cents: Math.round(val * 100) }),
            });
            toast.success("Goal updated!");
            setEditingGoal(false);
            // Refresh stats
            const res = await fetch(`${apiUrl}/referrer/stats`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) setStats(await res.json());
        } catch {
            toast.error("Failed to save goal");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            </div>
        );
    }

    if (!stats) return null;

    const tierCfg = TIER_CONFIG[stats.tier] || TIER_CONFIG.starter;
    const TierIcon = tierCfg.icon;
    const currentIdx = TIER_ORDER.indexOf(stats.tier);

    // Progress within current tier
    const currentMin = TIER_MINS[stats.tier];
    const nextMin = stats.next_tier ? TIER_MINS[stats.next_tier] : currentMin + 50;
    const tierRange = nextMin - currentMin;
    const tierProgress = tierRange > 0 ? Math.min(100, Math.round(((stats.total_referrals - currentMin) / tierRange) * 100)) : 100;

    return (
        <div className="space-y-4 mb-0">
            {/* Tier Badge + Progress */}
            <div className={`bg-gradient-to-r ${tierCfg.gradient} border ${tierCfg.border} rounded-2xl p-4 md:p-5`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 ${tierCfg.bg} rounded-2xl flex items-center justify-center`}>
                            <TierIcon className={`w-6 h-6 ${tierCfg.color}`} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className={`text-2xl font-black ${tierCfg.color}`}>{tierCfg.label}</h2>
                                <span className="text-base font-bold text-zinc-400">Tier</span>
                            </div>
                            <p className="text-base text-zinc-500 font-medium">
                                {stats.tier_split}% commission split · {stats.total_referrals} confirmed referrals
                            </p>
                        </div>
                    </div>
                    {stats.next_tier && (
                        <div className="text-right">
                            <div className="text-lg font-black text-zinc-700 leading-snug">
                                <span className="text-zinc-500 font-semibold">{stats.referrals_to_next} more to unlock </span>
                                <span className={TIER_CONFIG[stats.next_tier]?.color}>{TIER_CONFIG[stats.next_tier]?.label}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Tier Progress Bar */}
                <div className="flex items-center gap-2 mb-2">
                    {TIER_ORDER.map((t, i) => {
                        const cfg = TIER_CONFIG[t];
                        const isActive = i <= currentIdx;
                        const isCurrent = t === stats.tier;
                        return (
                            <div key={t} className="flex-1">
                                <div className={`h-3.5 rounded-full transition-all ${
                                    isCurrent
                                        ? `${cfg.bg} overflow-hidden`
                                        : isActive
                                            ? cfg.bg
                                            : "bg-zinc-200"
                                }`}>
                                    {isCurrent && (
                                        <div
                                            className="h-full rounded-full transition-all duration-500 bg-green-500"
                                            style={{ width: `${tierProgress}%` }}
                                        />
                                    )}
                                </div>
                                <div className={`text-base font-bold mt-1.5 text-center ${isActive ? cfg.color : "text-zinc-300"}`}>
                                    {cfg.label}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Earnings Cards + Monthly Goal — side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
                {/* Left 3/5: 2×2 earnings cards */}
                <div className="lg:col-span-3 grid grid-cols-2 gap-2">
                    <div className="bg-white rounded-2xl border border-zinc-200 px-4 py-3 flex items-center justify-between">
                        <span className="text-base font-bold text-zinc-500">This Week</span>
                        <span className={`text-2xl font-black ${stats.earnings.this_week > 0 ? 'text-green-600' : 'text-zinc-900'}`}>{cents(stats.earnings.this_week)}</span>
                    </div>
                    <div className="bg-white rounded-2xl border border-zinc-200 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <span className="text-base font-bold text-zinc-500">This Month</span>
                            {stats.earnings.month_trend !== 0 && (
                                <span className={`text-base font-bold flex items-center gap-0.5 ${stats.earnings.month_trend > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    {stats.earnings.month_trend > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                    {Math.abs(stats.earnings.month_trend)}%
                                </span>
                            )}
                        </div>
                        <span className={`text-2xl font-black ${stats.earnings.this_month > 0 ? 'text-green-600' : 'text-zinc-900'}`}>{cents(stats.earnings.this_month)}</span>
                    </div>
                    <div className="bg-white rounded-2xl border border-zinc-200 px-4 py-3 flex items-center justify-between">
                        <div>
                            <span className="text-base font-bold text-zinc-500">Pending</span>
                            {stats.earnings.pending > 0 && <span className="text-base text-zinc-400 ml-1.5">· awaiting</span>}
                        </div>
                        <span className="text-2xl font-black text-orange-500">{cents(stats.earnings.pending)}</span>
                    </div>
                    <div className="bg-white rounded-2xl border border-zinc-200 px-4 py-3 flex items-center justify-between">
                        <div>
                            <span className="text-base font-bold text-zinc-500">Lifetime</span>
                            {stats.earnings.lifetime === 0 && <span className="text-base text-zinc-400 ml-1.5">· soon!</span>}
                        </div>
                        <span className="text-2xl font-black text-green-600">{cents(stats.earnings.lifetime)}</span>
                    </div>
                </div>

                {/* Right 2/5: Monthly Goal */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200 p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-orange-500" />
                            <span className="text-base font-bold text-zinc-700">Monthly Goal</span>
                        </div>
                        <button
                            onClick={() => setEditingGoal(!editingGoal)}
                            className="text-base font-bold text-orange-500 hover:text-orange-600 underline underline-offset-2"
                        >
                            {editingGoal ? "Cancel" : stats.monthly_goal_cents ? "Edit" : "Set Goal →"}
                        </button>
                    </div>

                    {editingGoal ? (
                        <div className="flex items-center gap-2 flex-1">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">$</span>
                                <input
                                    type="number"
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-7 pr-3 py-2.5 text-zinc-900 font-bold text-lg focus:ring-2 focus:ring-orange-500/20 focus:outline-none"
                                    placeholder="500"
                                    value={goalInput}
                                    onChange={e => setGoalInput(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <button onClick={saveGoal} className="bg-orange-500 text-white px-4 py-2.5 rounded-xl font-bold text-base hover:bg-orange-600 transition-colors">Save</button>
                        </div>
                    ) : (() => {
                        const goalCents = stats.monthly_goal_cents ?? 50000;
                        const earned = stats.earnings.this_month;
                        const pct = Math.min(100, goalCents > 0 ? Math.round((earned / goalCents) * 100) : 0);
                        const barColor = pct >= 100 ? "bg-green-500" : pct >= 50 ? "bg-green-400" : "bg-green-300";
                        return (
                            <div className="flex flex-col flex-1 justify-between gap-2">
                                <div className="flex items-end justify-between">
                                    <span className="text-3xl font-black text-zinc-900">{cents(earned)}</span>
                                    <span className="text-base font-bold text-zinc-400">/ {cents(goalCents)}</span>
                                </div>
                                <div className="w-full bg-zinc-100 rounded-full h-3 overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-base font-bold text-zinc-500">{pct}% of goal</span>
                                    {!stats.monthly_goal_cents ? (
                                        <span className="text-base text-zinc-400">suggested $500</span>
                                    ) : pct >= 100 ? (
                                        <span className="text-base font-bold text-green-600 flex items-center gap-1"><Flame className="w-4 h-4" /> Reached!</span>
                                    ) : null}
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* Per-Business Breakdown */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-5">
                <h3 className="font-bold text-zinc-900 flex items-center gap-2 mb-3">
                    <DollarSign className="w-5 h-5 text-green-500" /> Earnings by Business
                </h3>
                {stats.per_business.length > 0 ? (
                    <div className="space-y-2">
                        {stats.per_business.map(biz => (
                            <Link
                                key={biz.slug}
                                href={`/dashboard/referrer/refer/${biz.slug}`}
                                className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl hover:bg-orange-50 transition-colors group"
                            >
                                <div>
                                    <div className="font-bold text-zinc-900 text-base group-hover:text-orange-600 transition-colors">{biz.business_name}</div>
                                    <div className="text-base text-zinc-400">{biz.trade_category} · {biz.lead_count} referrals</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-black text-green-600 text-lg">{cents(biz.earned_cents)}</span>
                                    <ArrowUpRight className="w-4 h-4 text-zinc-300 group-hover:text-orange-500 transition-colors" />
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="py-3 text-center">
                        <p className="text-base font-bold text-zinc-500 mb-1">No earnings yet</p>
                        <p className="text-base text-zinc-400">Your first referral will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
