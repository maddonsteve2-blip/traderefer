"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { Users, TrendingUp, DollarSign, Megaphone, Loader2, Award, Send, Crown, Zap, Star, BarChart3, ChevronRight } from "lucide-react";
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
    starter: "text-zinc-400",
    pro: "text-blue-500",
    elite: "text-purple-500",
    ambassador: "text-amber-500",
};

export function MobileBusinessAnalytics() {
    const { getToken, isLoaded } = useAuth();
    const [data, setData] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [broadcastMsg, setBroadcastMsg] = useState("");
    const [sending, setSending] = useState(false);

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
                toast.success("Broadcast sent!");
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
            <div className="lg:hidden h-40 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-orange-500 animate-spin" />
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="lg:hidden flex flex-col min-h-screen bg-white pb-32 pt-2 px-5">
            <h1 className="text-[28px] font-extrabold text-[#18181B] leading-tight mb-6">Performance</h1>

            {/* Summary Grid */}
            <div className="grid grid-cols-2 gap-3 mb-8">
                <div className="bg-[#F4F4F5] rounded-[24px] p-5">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total Leads</p>
                    <p className="text-[28px] font-black text-zinc-900 mt-1">{data.summary.total_leads}</p>
                </div>
                <div className="bg-[#F4F4F5] rounded-[24px] p-5">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Confirmed</p>
                    <p className="text-[28px] font-black text-green-600 mt-1">{data.summary.confirmed_leads}</p>
                </div>
                <div className="bg-zinc-900 rounded-[24px] p-5 col-span-2 flex justify-between items-center text-white">
                    <div>
                         <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Spent</p>
                         <p className="text-[24px] font-black text-white mt-1">${(data.summary.total_spent_cents / 100).toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                         <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Cost / Lead</p>
                         <p className="text-[24px] font-black text-orange-500 mt-1">${(data.summary.cost_per_customer_cents / 100).toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {/* Top Referrers */}
            <div className="flex flex-col gap-4 mb-8">
                <h3 className="text-lg font-bold text-[#18181B] tracking-tight">Top Performing Partners</h3>
                <div className="flex flex-col gap-3">
                    {data.top_referrers.slice(0, 3).map((r, i) => {
                         const TIcon = TIER_ICONS[r.tier] || Star;
                         const tColor = TIER_COLORS[r.tier] || "text-zinc-400";
                         return (
                            <div key={i} className="bg-white border border-[#E4E4E7] rounded-[24px] p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center font-black text-zinc-900 border border-zinc-100 italic">
                                         #{i+1}
                                     </div>
                                     <div>
                                         <p className="text-[15px] font-bold text-zinc-900 flex items-center gap-1.5">
                                             {r.name}
                                             <TIcon className={`w-3.5 h-3.5 ${tColor}`} />
                                         </p>
                                         <p className="text-[11px] font-medium text-zinc-400">{r.confirmed_count} jobs · {r.lead_count} leads</p>
                                     </div>
                                </div>
                                <p className="text-[15px] font-black text-green-600">${(r.total_paid_cents / 100).toFixed(0)}</p>
                            </div>
                         );
                    })}
                </div>
            </div>

            {/* Broadcast */}
            <div className="bg-zinc-900 rounded-[24px] p-6 text-white flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <Megaphone className="w-5 h-5 text-blue-400" />
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Broadcast</h3>
                </div>
                <p className="text-[12px] font-medium text-zinc-400 leading-relaxed">
                    Instantly update all your connected partners.
                </p>
                <textarea 
                    value={broadcastMsg}
                    onChange={e => setBroadcastMsg(e.target.value)}
                    placeholder="Type a message to all referrers..."
                    rows={2}
                    className="w-full bg-white/10 rounded-xl p-4 text-[14px] font-medium text-white border-none outline-none focus:bg-white/20"
                />
                <button 
                    onClick={handleBroadcast}
                    disabled={sending || !broadcastMsg.trim()}
                    className="w-full h-12 bg-blue-600 rounded-xl flex items-center justify-center gap-2 text-[13px] font-black text-white disabled:opacity-50"
                >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send Update
                </button>
            </div>
        </div>
    );
}
