"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import {
    TrendingUp, TrendingDown, Award, Target,
    Loader2, Zap, Crown, Star, Flame
} from "lucide-react";
import { toast } from "sonner";
import { useLiveEvent } from "@/hooks/useLiveEvents";

interface Stats {
    tier: string;
    tier_split: number;
    next_tier: string | null;
    referrals_to_next: number;
    total_referrals: number;
    monthly_referrals: number;
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

const TIER_CONFIG: Record<string, {
    label: string; icon: any; split: number; rangeLabel: string;
}> = {
    bronze:   { label: "Partner",    icon: Star,  split: 80,   rangeLabel: "0–4 refs/mo" },
    silver:   { label: "Premium",    icon: Zap,   split: 82.5, rangeLabel: "5–9 refs/mo" },
    gold:     { label: "Elite",      icon: Award, split: 85,   rangeLabel: "10–19 refs/mo" },
    platinum: { label: "Ambassador", icon: Crown, split: 90,   rangeLabel: "20+ refs/mo" },
};

const TIER_ORDER = ["bronze", "silver", "gold", "platinum"];
const TIER_MINS: Record<string, number> = { bronze: 0, silver: 5, gold: 10, platinum: 20 };

function centsLabel(v: number) {
    return `$${(v / 100).toFixed(2)}`;
}

export function EarningsDashboard() {
    const { getToken } = useAuth();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [editingGoal, setEditingGoal] = useState(false);
    const [goalInput, setGoalInput] = useState("");
    const apiUrl = "/api/backend";

    const fetchStats = useCallback(async () => {
        try {
            const token = await getToken();
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
    }, [getToken, apiUrl]);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    // SSE: refresh stats when earnings change or badge earned
    useLiveEvent("earning_update", () => { fetchStats(); });
    useLiveEvent("badge_earned", () => { fetchStats(); });

    const saveGoal = async () => {
        const val = parseFloat(goalInput);
        if (isNaN(val) || val < 0) { toast.error("Enter a valid amount"); return; }
        try {
            const token = await getToken();
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

    const tierCfg = TIER_CONFIG[stats.tier] || TIER_CONFIG.bronze;
    const TierIcon = tierCfg.icon;
    const currentIdx = TIER_ORDER.indexOf(stats.tier);

    // Progress within current tier — based on rolling 30-day monthly_referrals
    const currentMin = TIER_MINS[stats.tier] ?? 0;
    const nextMin = stats.next_tier ? (TIER_MINS[stats.next_tier] ?? 5) : currentMin + 20;
    const tierRange = nextMin - currentMin;
    const tierProgress = (tierRange > 0 && stats?.monthly_referrals !== undefined)
        ? Math.min(100, Math.max(0, Math.round(((stats.monthly_referrals - currentMin) / tierRange) * 100)))
        : 0;

    return (
        <div className="space-y-3 mb-0">
            {/* Tier Card — white card matching rest of dashboard */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-3">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-center">
                        <TierIcon className="w-6 h-6 text-[#FF7A00]" />
                    </div>
                    <div>
                        <h2 className="text-[30px] font-black text-zinc-900 leading-none">{tierCfg.label} Tier</h2>
                        <p className="text-[19px] text-zinc-500 font-medium mt-1">
                            You keep <span className="font-black text-zinc-800">{tierCfg.split}%</span> · {stats.total_referrals} total referrals
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[48px] font-black text-zinc-900">{tierCfg.split}%</div>
                    <div className="text-[21px] font-bold text-zinc-400">your cut</div>
                </div>
                </div>

                {/* 4-tier breakdown — condensed, authority style */}
                <div className="grid grid-cols-4 gap-2 mb-1">
                    {TIER_ORDER.map((t) => {
                        const cfg = TIER_CONFIG[t];
                        const tIdx = TIER_ORDER.indexOf(t);
                        const isActive = t === stats.tier;
                        const isPast = tIdx < currentIdx;
                        const Icon = cfg.icon;
                        return (
                            <div key={t} className={`py-1 px-1.5 rounded-xl text-center transition-all ${
                                isActive
                                    ? "bg-white border-[3px] border-[#FF7A00] shadow-sm"
                                    : isPast
                                    ? "bg-zinc-50 border border-zinc-300"
                                    : "bg-zinc-50 border border-zinc-200 opacity-50"
                            }`}>
                                <Icon className={`w-3.5 h-3.5 mx-auto mb-0 ${
                                    isActive ? "text-[#FF7A00]" : isPast ? "text-zinc-500" : "text-zinc-300"
                                }`} />
                                <div className={`text-base font-bold leading-tight ${
                                    isActive ? "text-[#FF7A00]" : isPast ? "text-zinc-600" : "text-zinc-400"
                                }`}>{cfg.label}</div>
                                <div className={`text-base font-black leading-tight ${
                                    isActive ? "text-zinc-900" : "text-zinc-500"
                                }`}>{cfg.split}%</div>
                                <div className="text-xs font-medium text-zinc-400 mt-0.5">{cfg.rangeLabel}</div>
                            </div>
                        );
                    })}
                </div>
                <p className="text-sm font-medium text-zinc-500 mb-2">Status based on your last 30 days of activity.</p>

                {/* Progress toward next tier */}
                {stats.next_tier ? (
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[19px] font-bold text-zinc-700">
                                {stats.monthly_referrals} referral{stats.monthly_referrals !== 1 ? "s" : ""} this month
                            </span>
                            <span className="text-[19px] font-semibold text-zinc-500">
                                {stats.referrals_to_next} more → {TIER_CONFIG[stats.next_tier]?.label} ({TIER_CONFIG[stats.next_tier]?.split}%)
                            </span>
                        </div>
                        <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                            {tierProgress > 0 && (
                                <div
                                    className="h-full rounded-full bg-orange-500 transition-all duration-500"
                                    style={{ width: `${tierProgress}%` }}
                                />
                            )}
                        </div>
                        <div className="text-sm font-medium text-zinc-400 mt-1">Upgrades automatically</div>
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <span className="text-[19px] font-bold text-zinc-700">{stats.monthly_referrals} referrals this month</span>
                        <span className="text-[19px] font-black text-[#FF7A00] flex items-center gap-1"><Crown className="w-4 h-4" /> Ambassador · 90% split</span>
                    </div>
                )}
            </div>

            {/* Earnings Cards + Monthly Goal — side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-2">
                {/* Left 3/5: 2×2 earnings cards */}
                <div className="lg:col-span-3 grid grid-cols-2 gap-2">
                    <div className="bg-white rounded-2xl border border-zinc-200 px-4 py-3 flex items-center justify-between">
                        <span className="text-[19px] font-bold text-zinc-500">This Week</span>
                        <span className={`text-[36px] font-black ${stats.earnings.this_week > 0 ? 'text-green-600' : 'text-zinc-900'}`}>{centsLabel(stats.earnings.this_week)}</span>
                    </div>
                    <div className="bg-white rounded-2xl border border-zinc-200 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[19px] font-bold text-zinc-500">This Month</span>
                            {stats.earnings.month_trend !== 0 && (
                                <span className={`text-[19px] font-bold flex items-center gap-0.5 ${stats.earnings.month_trend > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    {stats.earnings.month_trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                    {Math.abs(stats.earnings.month_trend)}%
                                </span>
                            )}
                        </div>
                        <span className={`text-[36px] font-black ${stats.earnings.this_month > 0 ? 'text-green-600' : 'text-zinc-900'}`}>{centsLabel(stats.earnings.this_month)}</span>
                    </div>
                    <div className="bg-white rounded-2xl border border-zinc-200 px-4 py-3 flex items-center justify-between">
                        <div>
                            <span className="text-[19px] font-bold text-zinc-500">Pending</span>
                            {stats.earnings.pending > 0 && <span className="text-[19px] text-zinc-400 ml-1.5">· awaiting</span>}
                        </div>
                        <span className="text-[36px] font-black text-orange-500">{centsLabel(stats.earnings.pending)}</span>
                    </div>
                    <div className="bg-white rounded-2xl border border-zinc-200 px-4 py-3 flex items-center justify-between">
                        <div>
                            <span className="text-[19px] font-bold text-zinc-500">Lifetime</span>
                            {stats.earnings.lifetime === 0 && <span className="text-[19px] text-zinc-400 ml-1.5">· since joining</span>}
                        </div>
                        <span className="text-[36px] font-black text-green-600">{centsLabel(stats.earnings.lifetime)}</span>
                    </div>
                </div>

                {/* Right 2/5: Monthly Goal */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200 px-4 py-3 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-orange-500" />
                            <span className="text-[19px] font-bold text-zinc-700">Monthly Goal</span>
                        </div>
                        <button
                            onClick={() => setEditingGoal(!editingGoal)}
                            className="text-[19px] font-bold text-orange-500 hover:text-orange-600 underline underline-offset-2"
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
                                    <span className="text-[48px] font-black text-zinc-900">{centsLabel(earned)}</span>
                                    <span className="text-[19px] font-bold text-zinc-400">/ {centsLabel(goalCents)}</span>
                                </div>
                                <div className="w-full bg-zinc-100 rounded-full h-4 overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[19px] font-bold text-zinc-500">{pct}% of goal</span>
                                    {!stats.monthly_goal_cents ? (
                                        <span className="text-[19px] text-zinc-400">suggested $500</span>
                                    ) : pct >= 100 ? (
                                        <span className="text-[19px] font-bold text-green-600 flex items-center gap-1"><Flame className="w-5 h-5" /> Reached!</span>
                                    ) : null}
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
}
