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
        <div className="space-y-6 mb-10">
            {/* Tier Badge + Progress */}
            <div className={`bg-gradient-to-r ${tierCfg.gradient} border ${tierCfg.border} rounded-3xl p-6 md:p-8`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 ${tierCfg.bg} rounded-2xl flex items-center justify-center`}>
                            <TierIcon className={`w-6 h-6 ${tierCfg.color}`} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className={`text-2xl font-black ${tierCfg.color}`}>{tierCfg.label}</h2>
                                <span className="text-sm font-bold text-zinc-400">Tier</span>
                            </div>
                            <p className="text-sm text-zinc-500">
                                {stats.tier_split}% commission split · {stats.total_referrals} confirmed referrals
                            </p>
                        </div>
                    </div>
                    {stats.next_tier && (
                        <div className="text-right">
                            <div className="text-sm font-bold text-zinc-500">
                                {stats.referrals_to_next} more to <span className={TIER_CONFIG[stats.next_tier]?.color}>{TIER_CONFIG[stats.next_tier]?.label}</span>
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
                                <div className={`h-2.5 rounded-full transition-all ${
                                    isCurrent
                                        ? `${cfg.bg} overflow-hidden`
                                        : isActive
                                            ? cfg.bg
                                            : "bg-zinc-200"
                                }`}>
                                    {isCurrent && (
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${
                                                t === "starter" ? "bg-zinc-500" :
                                                t === "pro" ? "bg-blue-500" :
                                                t === "elite" ? "bg-purple-500" : "bg-amber-500"
                                            }`}
                                            style={{ width: `${tierProgress}%` }}
                                        />
                                    )}
                                </div>
                                <div className={`text-xs font-bold mt-1 text-center ${isActive ? cfg.color : "text-zinc-300"}`}>
                                    {cfg.label}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Earnings Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-zinc-200 p-5">
                    <div className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-1">This Week</div>
                    <div className="text-2xl font-black text-zinc-900">{cents(stats.earnings.this_week)}</div>
                </div>
                <div className="bg-white rounded-2xl border border-zinc-200 p-5">
                    <div className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-1">This Month</div>
                    <div className="text-2xl font-black text-zinc-900">{cents(stats.earnings.this_month)}</div>
                    {stats.earnings.month_trend !== 0 && (
                        <div className={`text-sm font-bold flex items-center gap-1 mt-1 ${stats.earnings.month_trend > 0 ? "text-green-600" : "text-red-500"}`}>
                            {stats.earnings.month_trend > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                            {Math.abs(stats.earnings.month_trend)}% vs last month
                        </div>
                    )}
                </div>
                <div className="bg-white rounded-2xl border border-zinc-200 p-5">
                    <div className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-1">Pending</div>
                    <div className="text-2xl font-black text-orange-600">{cents(stats.earnings.pending)}</div>
                </div>
                <div className="bg-white rounded-2xl border border-zinc-200 p-5">
                    <div className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-1">Lifetime</div>
                    <div className="text-2xl font-black text-green-600">{cents(stats.earnings.lifetime)}</div>
                </div>
            </div>

            {/* Goal Tracker + Per-Business Breakdown side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Goal Tracker */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                            <Target className="w-5 h-5 text-orange-500" /> Monthly Goal
                        </h3>
                        <button
                            onClick={() => setEditingGoal(!editingGoal)}
                            className="text-sm font-bold text-orange-500 hover:text-orange-600"
                        >
                            {editingGoal ? "Cancel" : "Set Goal"}
                        </button>
                    </div>

                    {editingGoal ? (
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">$</span>
                                <input
                                    type="number"
                                    className="w-full bg-zinc-50 border-none rounded-xl pl-8 pr-4 py-3 text-zinc-900 font-bold focus:ring-2 focus:ring-orange-500/20"
                                    placeholder="500"
                                    value={goalInput}
                                    onChange={e => setGoalInput(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={saveGoal}
                                className="bg-orange-500 text-white px-5 py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors"
                            >
                                Save
                            </button>
                        </div>
                    ) : stats.monthly_goal_cents ? (
                        <div>
                            <div className="flex items-end justify-between mb-2">
                                <span className="text-3xl font-black text-zinc-900">
                                    {Math.min(stats.goal_progress || 0, 100)}%
                                </span>
                                <span className="text-sm text-zinc-400">
                                    {cents(stats.earnings.this_month)} / {cents(stats.monthly_goal_cents)}
                                </span>
                            </div>
                            <div className="w-full bg-zinc-100 rounded-full h-4 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                        (stats.goal_progress || 0) >= 100
                                            ? "bg-green-500"
                                            : (stats.goal_progress || 0) >= 50
                                                ? "bg-orange-500"
                                                : "bg-orange-300"
                                    }`}
                                    style={{ width: `${Math.min(stats.goal_progress || 0, 100)}%` }}
                                />
                            </div>
                            {(stats.goal_progress || 0) >= 100 && (
                                <p className="text-sm font-bold text-green-600 mt-2 flex items-center gap-1">
                                    <Flame className="w-4 h-4" /> Goal reached! Keep going!
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-zinc-400">Set a monthly earnings goal to track your progress.</p>
                    )}
                </div>

                {/* Per-Business Breakdown */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-6">
                    <h3 className="font-bold text-zinc-900 flex items-center gap-2 mb-4">
                        <DollarSign className="w-5 h-5 text-green-500" /> Earnings by Business
                    </h3>
                    {stats.per_business.length > 0 ? (
                        <div className="space-y-3">
                            {stats.per_business.map(biz => (
                                <Link
                                    key={biz.slug}
                                    href={`/b/${biz.slug}/refer`}
                                    className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl hover:bg-orange-50 transition-colors group"
                                >
                                    <div>
                                        <div className="font-bold text-zinc-900 text-sm group-hover:text-orange-600 transition-colors">{biz.business_name}</div>
                                        <div className="text-xs text-zinc-400">{biz.trade_category} · {biz.lead_count} referrals</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-green-600">{cents(biz.earned_cents)}</span>
                                        <ArrowUpRight className="w-4 h-4 text-zinc-300 group-hover:text-orange-500 transition-colors" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-zinc-400">No earnings yet. Start referring to see your breakdown!</p>
                    )}
                </div>
            </div>
        </div>
    );
}
