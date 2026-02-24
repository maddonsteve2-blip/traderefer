"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import {
    Users, TrendingUp, DollarSign, Megaphone, Loader2, Award,
    Send, Crown, Zap, Star, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
    const [broadcastMsg, setBroadcastMsg] = useState("");
    const [sending, setSending] = useState(false);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

    const handleBroadcast = async () => {
        if (!broadcastMsg.trim()) { toast.error("Enter a message"); return; }
        setSending(true);
        try {
            const token = await getToken();
            const res = await fetch(`${apiUrl}/business/broadcast`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ message: broadcastMsg }),
            });
            if (res.ok) {
                toast.success("Broadcast sent to all connected referrers!");
                setBroadcastMsg("");
            } else {
                toast.error("Failed to send broadcast");
            }
        } catch {
            toast.error("Error sending broadcast");
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="min-h-screen bg-zinc-50 pt-16">
            <div className="max-w-[1024px] mx-auto px-6 lg:px-0 py-12">
                <div className="mb-10">
                    <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight">Referrer Analytics</h1>
                    <p className="text-zinc-500 text-lg mt-1">Track referrer performance, campaign ROI, and cost per customer</p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    <div className="bg-white rounded-2xl border border-zinc-200 p-5">
                        <div className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-1">Total Leads</div>
                        <div className="text-3xl font-black text-zinc-900">{data.summary.total_leads}</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-zinc-200 p-5">
                        <div className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-1">Confirmed</div>
                        <div className="text-3xl font-black text-green-600">{data.summary.confirmed_leads}</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-zinc-200 p-5">
                        <div className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-1">Total Spent</div>
                        <div className="text-3xl font-black text-zinc-900">{cents(data.summary.total_spent_cents)}</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-zinc-200 p-5">
                        <div className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-1">Cost / Customer</div>
                        <div className="text-3xl font-black text-orange-600">{cents(data.summary.cost_per_customer_cents)}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                    {/* Top Referrers */}
                    <div className="bg-white rounded-2xl border border-zinc-200 p-6">
                        <h2 className="font-bold text-zinc-900 text-lg flex items-center gap-2 mb-5">
                            <Users className="w-5 h-5 text-orange-500" /> Top Referrers
                        </h2>
                        {data.top_referrers.length > 0 ? (
                            <div className="space-y-3">
                                {data.top_referrers.map((r, i) => {
                                    const TIcon = TIER_ICONS[r.tier] || Star;
                                    const tColor = TIER_COLORS[r.tier] || "text-zinc-400";
                                    return (
                                        <div key={i} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center text-sm font-black text-zinc-400">
                                                    {i + 1}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-zinc-900 text-sm flex items-center gap-1.5">
                                                        {r.name}
                                                        <TIcon className={`w-3.5 h-3.5 ${tColor}`} />
                                                    </div>
                                                    <div className="text-xs text-zinc-400">
                                                        {r.lead_count} leads · {r.confirmed_count} confirmed
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="font-black text-green-600 text-sm">{cents(r.total_paid_cents)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-zinc-400 text-center py-8">No referrer data yet</p>
                        )}
                    </div>

                    {/* Campaign Performance */}
                    <div className="bg-white rounded-2xl border border-zinc-200 p-6">
                        <h2 className="font-bold text-zinc-900 text-lg flex items-center gap-2 mb-5">
                            <BarChart3 className="w-5 h-5 text-purple-500" /> Campaign Performance
                        </h2>
                        {data.campaign_performance.length > 0 ? (
                            <div className="space-y-3">
                                {data.campaign_performance.map(c => (
                                    <div key={c.id} className="p-4 bg-zinc-50 rounded-xl">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="font-bold text-zinc-900 text-sm">{c.title}</h3>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                                c.is_active ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"
                                            }`}>
                                                {c.is_active ? "Active" : "Ended"}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-zinc-400">
                                                {new Date(c.starts_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })} – {new Date(c.ends_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                                            </span>
                                            <span className="font-bold text-zinc-700">{c.leads_during} leads</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-zinc-400 text-center py-8">No campaigns yet</p>
                        )}
                    </div>
                </div>

                {/* Broadcast to Referrers */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-6">
                    <h2 className="font-bold text-zinc-900 text-lg flex items-center gap-2 mb-4">
                        <Megaphone className="w-5 h-5 text-blue-500" /> Broadcast to All Referrers
                    </h2>
                    <p className="text-sm text-zinc-500 mb-4">
                        Send an update to everyone referring your business. Great for holiday hours, new certifications, or special announcements.
                    </p>
                    <textarea
                        rows={3}
                        className="w-full bg-zinc-50 border-none rounded-xl px-4 py-3 text-zinc-900 font-medium focus:ring-2 focus:ring-blue-500/20 resize-none mb-3"
                        placeholder="e.g. We just got certified for gas fitting — let your network know!"
                        value={broadcastMsg}
                        onChange={e => setBroadcastMsg(e.target.value)}
                    />
                    <Button
                        onClick={handleBroadcast}
                        disabled={sending || !broadcastMsg.trim()}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
                    >
                        {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                        Send Broadcast
                    </Button>
                </div>
            </div>
        </div>
    );
}
