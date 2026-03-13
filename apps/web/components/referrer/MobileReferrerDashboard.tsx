"use client";

import Link from "next/link";
import { Share2, ChevronRight, Copy, Check, Loader2, Bell } from "lucide-react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface DashboardData {
    total_earned?: number;
    active_leads?: number;
    pending_leads?: number;
    links?: Array<{ name: string; slug: string; code: string; leads: number; earned: number }>;
    recent_activity?: Array<{ id: string; type: string; description: string; amount?: number; created_at: string }>;
}

function fmt(n: number) {
    return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(n);
}

function fmtTime(iso: string) {
    try {
        const d = new Date(iso);
        const diffMs = Date.now() - d.getTime();
        const h = Math.floor(diffMs / 3600000);
        if (h < 1) return "Just now";
        if (h < 24) return `${h}h ago`;
        const days = Math.floor(h / 24);
        return `${days}d ago`;
    } catch { return ""; }
}

export function MobileReferrerDashboard() {
    const { getToken } = useAuth();
    const { user } = useUser();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    const load = useCallback(async () => {
        try {
            const token = await getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/referrer/dashboard`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) setData(await res.json());
        } catch {} finally { setLoading(false); }
    }, [getToken]);

    useEffect(() => { load(); }, [load]);

    const primaryLink = data?.links?.[0];
    const BASE = typeof window !== "undefined" ? window.location.origin : "https://traderefer.au";
    const referralLink = primaryLink ? `${BASE}/b/${primaryLink.slug}?ref=${primaryLink.code}` : "";

    const handleCopy = () => {
        if (!referralLink) return;
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        toast.success("Referral link copied!");
        setTimeout(() => setCopied(false), 2500);
    };

    const displayName = user?.firstName || "there";

    if (loading) {
        return (
            <div className="lg:hidden h-40 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-orange-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="lg:hidden flex flex-col min-h-screen bg-white pb-24">
            

            <div className="flex-1 px-5 pt-2 flex flex-col gap-6">
                {/* ── Welcome ── */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-black text-zinc-900 leading-tight">
                        Welcome back, {displayName}
                    </h1>
                    <p className="text-sm font-medium text-zinc-500">
                        Referrer Dashboard
                    </p>
                </div>

                {/* ── KPI Grid ── */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-3xl p-5 border border-zinc-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] h-28 flex flex-col justify-center">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Active Leads</p>
                        <p className="text-2xl font-black text-zinc-900">{data?.active_leads ?? 0}</p>
                    </div>
                    <div className="bg-white rounded-3xl p-5 border border-zinc-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] h-28 flex flex-col justify-center">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Revenue</p>
                        <p className="text-2xl font-black text-orange-500">{fmt(data?.total_earned ?? 0)}</p>
                    </div>
                </div>

                {/* ── Referral Card ── */}
                <div className="bg-zinc-900 rounded-[32px] p-6 shadow-xl flex flex-col gap-3">
                    <h2 className="text-base font-bold text-white">Your Referral Network</h2>
                    <p className="text-[13px] font-medium text-zinc-400 leading-relaxed mb-2">
                        Share your professional link to start earning commissions instantly.
                    </p>
                    {primaryLink ? (
                        <button 
                            onClick={handleCopy}
                            className={`w-full h-[52px] rounded-2xl font-bold text-white text-[15px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg ${copied ? "bg-green-600" : "bg-orange-500"}`}
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                            {copied ? "Copied!" : "Share Referral Link"}
                        </button>
                    ) : (
                        <Link 
                            href="/dashboard/referrer/businesses"
                            className="w-full h-[52px] rounded-2xl font-bold text-white text-[15px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg bg-orange-500"
                        >
                            <Share2 className="w-4 h-4" />
                            Find Businesses
                        </Link>
                    )}
                </div>

                {/* ── Activity Section ── */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-lg font-bold text-zinc-900 tracking-tight">Recent Activity</h3>
                    
                    <div className="flex flex-col gap-1">
                        {(!data?.recent_activity || data.recent_activity.length === 0) ? (
                            <div className="py-8 text-center bg-zinc-50 rounded-2xl">
                                <p className="text-sm font-medium text-zinc-400">No activity yet. Share your link to start earning.</p>
                            </div>
                        ) : (
                            data.recent_activity.slice(0, 5).map((a) => (
                                <div key={a.id} className="flex items-center gap-4 py-3 border-b border-zinc-50 last:border-0 px-1">
                                    <div className="w-11 h-11 bg-zinc-100 rounded-full flex items-center justify-center shrink-0">
                                        <Share2 className="w-5 h-5 text-zinc-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[15px] font-bold text-zinc-900 truncate tracking-tight">{a.description}</p>
                                        <p className="text-xs font-medium text-zinc-400">{fmtTime(a.created_at)}</p>
                                    </div>
                                    {a.amount && (
                                        <span className="text-sm font-black text-emerald-600">+{fmt(a.amount / 100)}</span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
