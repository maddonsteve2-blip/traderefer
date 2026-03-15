"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import {
    Users, TrendingUp, DollarSign, Loader2, Award,
    Crown, Zap, Star, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileBusinessAnalytics } from "@/components/business/MobileBusinessAnalytics";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageTransition } from "@/components/ui/PageTransition";
import { toast } from "sonner";

interface Analytics {
    top_referrers: {
        name: string;
        tier: string;
        lead_count: number;
        confirmed_count: number;
        total_paid_cents: number;
    }[];
    campaign_performance: {
        id: string;
        title: string;
        campaign_type: string;
        bonus_amount_cents: number;
        starts_at: string;
        ends_at: string;
        is_active: boolean;
        leads_during: number;
    }[];
    summary: {
        total_leads: number;
        confirmed_leads: number;
        total_spent_cents: number;
        cost_per_customer_cents: number;
    };
}

const TIER_ICONS: Record<string, any> = {
    starter: Star,
    pro: Zap,
    elite: Award,
    ambassador: Crown,
};

const TIER_COLORS: Record<string, string> = {
    starter: "text-zinc-500",
    pro: "text-blue-500",
    elite: "text-purple-500",
    ambassador: "text-amber-500",
};

function cents(v: number) {
    return `$${(v / 100).toFixed(2)}`;
}

export default function AnalyticsPage() {
    const { getToken } = useAuth();
    const [data, setData] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const apiUrl = "/api/backend";

    const fetchData = useCallback(async () => {
        try {
            const token = await getToken();
            const res = await fetch(`${apiUrl}/business/analytics/referrers`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) setData(await res.json());
        } catch {
            toast.error("Failed to load analytics");
        } finally {
            setLoading(false);
        }
    }, [getToken, apiUrl]);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) {
        return (
            <PageTransition className="min-h-[100dvh] bg-zinc-50 p-6">
                <div className="space-y-5 max-w-5xl mx-auto pt-6">
                    <div className="h-7 w-36 bg-zinc-200 rounded-xl animate-pulse" />
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white rounded-2xl border border-zinc-200 animate-pulse" />)}
                    </div>
                    <div className="h-64 bg-white rounded-2xl border border-zinc-200 animate-pulse" />
                </div>
            </PageTransition>
        );
    }

    if (!data) return null;

    return (
        <PageTransition className="min-h-[100dvh] bg-zinc-50 lg:h-screen lg:overflow-hidden lg:flex lg:flex-col">
            <MobileBusinessAnalytics />
            
            <div className="hidden lg:flex flex-col flex-1 overflow-hidden">
                <div className="flex items-center justify-between px-6 pt-5 pb-0 shrink-0">
                    <div>
                        <h1 className="text-2xl font-black text-zinc-900">Analytics</h1>
                        <p className="text-sm font-medium text-zinc-500 mt-0.5">Track referrer performance, campaign ROI, and cost per customer.</p>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-4">

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: "Total Leads", value: data.summary.total_leads, color: "text-zinc-900" },
                        { label: "Confirmed", value: data.summary.confirmed_leads, color: "text-green-600" },
                        { label: "Total Spent", value: cents(data.summary.total_spent_cents), color: "text-zinc-900" },
                        { label: "Cost / Customer", value: data.summary.confirmed_leads === 0 ? "—" : cents(data.summary.cost_per_customer_cents), color: "text-orange-600" },
                    ].map(s => (
                        <div key={s.label} className="bg-white rounded-2xl border border-zinc-200 p-5">
                            <div className="text-xs font-bold text-zinc-400 mb-1">{s.label}</div>
                            <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                    {/* Top Referrers */}
                    <div className="bg-white rounded-2xl border border-zinc-200 p-8">
                        <h2 className="font-bold text-zinc-900 text-2xl flex items-center gap-2 mb-6">
                            <Users className="w-6 h-6 text-orange-500" /> Top Referrers
                        </h2>
                        {data.top_referrers.length > 0 ? (
                            <div className="space-y-4">
                                {data.top_referrers.map((r, i) => {
                                    const TIcon = TIER_ICONS[r.tier] || Star;
                                    const tColor = TIER_COLORS[r.tier] || "text-zinc-400";
                                    return (
                                        <div key={i} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-lg font-black text-zinc-400">
                                                    {i + 1}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-zinc-900 text-lg flex items-center gap-1.5">
                                                        {r.name}
                                                        <TIcon className={`w-4 h-4 ${tColor}`} />
                                                    </div>
                                                    <div className="text-base text-zinc-400">
                                                        {r.lead_count} leads · {r.confirmed_count} confirmed
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="font-black text-green-600 text-lg">{cents(r.total_paid_cents)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <EmptyState
                                icon={Users}
                                iconColor="text-orange-400"
                                iconBg="bg-orange-50"
                                title="No referrer data yet"
                                description="Approve referrers and they'll appear here ranked by leads sent, conversion rate, and total earned."
                                primaryCTA={{ label: 'Invite a referrer', href: '/dashboard/business/force?tab=partners' }}
                                ghostRows={[
                                    { widths: ['w-28', 'w-16', 'w-12'] },
                                    { widths: ['w-36', 'w-20', 'w-10'] },
                                    { widths: ['w-24', 'w-14', 'w-16'] },
                                    { widths: ['w-32', 'w-18', 'w-14'] },
                                    { widths: ['w-20', 'w-24', 'w-12'] },
                                ]}
                            />
                        )}
                    </div>

                    {/* Campaign Performance */}
                    <div className="bg-white rounded-2xl border border-zinc-200 p-8">
                        <h2 className="font-bold text-zinc-900 text-2xl flex items-center gap-2 mb-6">
                            <BarChart3 className="w-6 h-6 text-orange-500" /> Campaign Performance
                        </h2>
                        {data.campaign_performance.length > 0 ? (
                            <div className="space-y-4">
                                {data.campaign_performance.map(c => (
                                    <div key={c.id} className="p-5 bg-zinc-50 rounded-2xl">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-bold text-zinc-900 text-lg">{c.title}</h3>
                                            <span className={`text-base font-bold px-3 py-1 rounded-full ${
                                                c.is_active ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"
                                            }`}>
                                                {c.is_active ? "Active" : "Ended"}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-lg">
                                            <span className="text-zinc-400">
                                                {new Date(c.starts_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })} – {new Date(c.ends_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                                            </span>
                                            <span className="font-bold text-zinc-700">{c.leads_during} leads</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={BarChart3}
                                iconColor="text-orange-400"
                                iconBg="bg-orange-50"
                                title="No campaign data yet"
                                description="Launch a time-limited bonus to motivate your referrers — results, ROI, and click-through rates will appear here."
                                primaryCTA={{ label: 'Create a campaign', href: '/dashboard/business/sales?tab=promotions' }}
                                ghostRows={[
                                    { widths: ['w-40', 'w-20'] },
                                    { widths: ['w-32', 'w-16'] },
                                    { widths: ['w-28', 'w-24'] },
                                ]}
                            />
                        )}
                    </div>
                </div>

                </div>
            </div>
        </PageTransition>
    );
}
