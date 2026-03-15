"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    UserPlus, Target, ArrowRight, Star, Trophy,
    Loader2, Clock, CheckCircle, TrendingUp, Inbox
} from "lucide-react";
import { useLiveEvent } from "@/hooks/useLiveEvents";

interface PendingApp {
    id: string;
    referrer_name: string;
    referrer_suburb: string;
    referrer_state: string;
    quality_score: number;
    applied_at: string;
}

interface RecentLead {
    id: string;
    customer_name: string;
    suburb: string;
    status: string;
    unlock_fee: number;
}

interface TopReferrer {
    referrer_id: string;
    full_name: string;
    quality_score: number;
    leads_created: number;
    confirmed_jobs: number;
    total_earned_cents: number;
    is_active: boolean;
}

const PENDING_STATUSES = ["PENDING", "VERIFIED", "READY_FOR_BUSINESS", "SCREENING"];

const STATUS_LABELS: Record<string, string> = {
    NEW: "New Lead", PENDING: "New Lead", VERIFIED: "Ready to Unlock",
    SCREENING: "Under Review", READY_FOR_BUSINESS: "Ready to Unlock",
    SCREENING_FAILED: "Not a Match", UNLOCKED: "Unlocked",
    ON_THE_WAY: "On the Way", CONFIRMED: "Confirmed",
    CONFIRMED_SUCCESS: "Job Confirmed", MEETING_VERIFIED: "Meeting Verified",
    VALID_LEAD: "Valid Lead", PAYMENT_PENDING_CONFIRMATION: "Awaiting Confirmation",
    EXPIRED: "Expired", DISPUTED: "Under Review",
};

function formatStatus(status: string): string {
    return STATUS_LABELS[status.toUpperCase()] || status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function timeAgo(dateStr: string) {
    if (!dateStr) return "";
    try {
        const d = new Date(dateStr.endsWith("Z") || dateStr.includes("+") || dateStr.includes("T") ? dateStr : dateStr + "Z");
        if (isNaN(d.getTime())) return "";
        const diff = Date.now() - d.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    } catch {
        return "";
    }
}

/* 
   LEFT PANE  Action Queue (60%)
 */
export function CommandActionQueue({ recentLeads }: { recentLeads: RecentLead[] }) {
    const { getToken, isLoaded } = useAuth();
    const router = useRouter();
    const [apps, setApps] = useState<PendingApp[]>([]);
    const [loading, setLoading] = useState(true);
    const apiUrl = "/api/backend";

    const fetchApps = useCallback(async () => {
        try {
            const token = await getToken();
            const res = await fetch(`${apiUrl}/applications/business/pending`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const d = await res.json();
                setApps((d.applications ?? []).slice(0, 3));
            } else {
                setApps([]);
            }
        } catch {
            setApps([]);
        } finally {
            setLoading(false);
        }
    }, [getToken, apiUrl]);

    useEffect(() => { if (isLoaded) fetchApps(); }, [isLoaded, fetchApps]);

    // SSE: refresh when new applications or leads arrive
    useLiveEvent("application_new", () => { fetchApps(); });
    useLiveEvent("lead_new", () => { router.refresh(); });

    const safeRecentLeads = Array.isArray(recentLeads) ? recentLeads : [];
    const newLeads = safeRecentLeads.filter(l => PENDING_STATUSES.includes(l.status));

    const queueItems: { key: string; node: React.ReactNode }[] = [];
    apps.forEach(app => {
        queueItems.push({
            key: `app-${app.id}`,
            node: (
                <div className="flex items-center gap-4 bg-white rounded-2xl border border-amber-200 p-5 hover:shadow-md transition-all">
                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0">
                        <UserPlus className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-black text-zinc-900 line-clamp-2 leading-snug" style={{ fontSize: 20 }}>
                            <span className="text-amber-700">{app.referrer_name}</span> applied to your network
                        </p>
                        <p className="text-zinc-500 font-medium" style={{ fontSize: 19 }}>
                            {app.referrer_suburb}, {app.referrer_state}   {app.quality_score}  {timeAgo(app.applied_at)}
                        </p>
                    </div>
                    <button
                        onClick={() => router.push("/dashboard/business/force?tab=applications")}
                        className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full px-6 font-bold shrink-0 transition-all h-14 shadow-sm shadow-amber-200"
                        style={{ fontSize: 20 }}
                    >
                        Review <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            ),
        });
    });

    if (newLeads.length > 0) {
        const plural = newLeads.length > 1;
        const suburbs = [...new Set(newLeads.map(l => l.suburb).filter(Boolean))].slice(0, 2).join(" and ");
        queueItems.push({
            key: "leads",
            node: (
                <div className="flex items-center gap-4 bg-white rounded-2xl border border-orange-200 p-5 hover:shadow-md transition-all">
                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center shrink-0">
                        <Target className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-black text-zinc-900" style={{ fontSize: 22 }}>
                            You have <span className="text-orange-600">{newLeads.length} new {plural ? "leads" : "lead"}</span>{suburbs ? ` from ${suburbs}` : ""}
                        </p>
                        <p className="text-zinc-500 font-medium" style={{ fontSize: 19 }}>
                            Respond quickly to increase your connection rate
                        </p>
                    </div>
                    <button
                        onClick={() => router.push("/dashboard/business/sales?tab=leads")}
                        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full px-6 font-bold shrink-0 transition-all h-14 shadow-sm shadow-orange-200"
                        style={{ fontSize: 20 }}
                    >
                        Contact Now <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            ),
        });
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-600 rounded-xl flex items-center justify-center">
                    <Inbox className="w-4 h-4 text-white" />
                </div>
                <h2 className="font-black text-zinc-900" style={{ fontSize: 28 }}>Action Queue</h2>
                {queueItems.length > 0 && (
                    <span className="w-7 h-7 bg-orange-500 text-white text-sm font-black rounded-full flex items-center justify-center">
                        {queueItems.length}
                    </span>
                )}
            </div>

            {loading ? (
                <div className="bg-white rounded-2xl border border-zinc-100 p-12 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
                </div>
            ) : queueItems.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-zinc-200 p-10 text-center">
                    <CheckCircle className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
                    <p className="font-bold text-zinc-900 mb-1" style={{ fontSize: 22 }}>All clear</p>
                    <p className="text-zinc-400 font-medium" style={{ fontSize: 19 }}>No pending actions right now.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {queueItems.map(item => <div key={item.key}>{item.node}</div>)}
                </div>
            )}

            {!loading && safeRecentLeads.length > 0 && (
                <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-50">
                        <h3 className="font-bold text-zinc-700 flex items-center gap-2" style={{ fontSize: 22 }}>
                            <Clock className="w-5 h-5 text-zinc-400" />Recent Leads
                        </h3>
                        <button onClick={() => router.push("/dashboard/business/sales?tab=leads")}
                            className="font-bold text-orange-600 hover:text-orange-700 transition-colors flex items-center gap-1" style={{ fontSize: 19 }}>
                            View all <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="divide-y divide-zinc-50">
                        {safeRecentLeads.slice(0, 5).map(lead => (
                            <div key={lead.id} className="flex items-center justify-between px-5 py-4 hover:bg-zinc-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full shrink-0 ${PENDING_STATUSES.includes(lead.status) ? "bg-orange-400 animate-pulse" : "bg-zinc-300"}`} />
                                    <div>
                                        <p className="font-bold text-zinc-800" style={{ fontSize: 19 }}>{lead.customer_name}</p>
                                        <p className="text-zinc-400 font-medium" style={{ fontSize: 18 }}>{lead.suburb}</p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full font-bold border ${PENDING_STATUSES.includes(lead.status) ? "bg-orange-50 text-orange-700 border-orange-100" : "bg-zinc-50 text-zinc-500 border-zinc-100"}`} style={{ fontSize: 17 }}>
                                    {formatStatus(lead.status)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* 
   RIGHT PANE  Partner Leaderboard (40%)
 */
export function PartnerLeaderboard() {
    const { getToken, isLoaded } = useAuth();
    const router = useRouter();
    const [referrers, setReferrers] = useState<TopReferrer[]>([]);
    const [loading, setLoading] = useState(true);
    const [pendingCount, setPendingCount] = useState(0);
    const apiUrl = "/api/backend";

    const fetchReferrers = useCallback(async () => {
        try {
            const token = await getToken();
            const [refRes, appRes] = await Promise.all([
                fetch(`${apiUrl}/business/me/referrers?sort_by=leads_created&sort_dir=desc`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`${apiUrl}/applications/business/pending`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);
            if (refRes.ok) {
                const d = await refRes.json();
                setReferrers((d.referrers ?? []).slice(0, 5));
            } else {
                setReferrers([]);
            }
            if (appRes.ok) {
                const d = await appRes.json();
                setPendingCount(d.pending_count ?? 0);
            }
        } catch {
            setReferrers([]);
        } finally {
            setLoading(false);
        }
    }, [getToken, apiUrl]);

    useEffect(() => { if (isLoaded) fetchReferrers(); }, [isLoaded, fetchReferrers]);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-400 rounded-xl flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-amber-900" />
                </div>
                <h2 className="font-black text-zinc-900" style={{ fontSize: 28 }}>Partner Leaderboard</h2>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
                    </div>
                ) : referrers.length === 0 || referrers.every(r => r.leads_created === 0 && r.total_earned_cents === 0) ? (
                    <div className="p-8 flex flex-col items-center text-center">
                        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-4">
                            <Trophy className="w-7 h-7 text-amber-400" />
                        </div>
                        <p className="font-black text-zinc-800 mb-1" style={{ fontSize: 20 }}>Your Partner Leaderboard</p>
                        <p className="text-zinc-400 font-medium max-w-[300px] mb-4" style={{ fontSize: 16 }}>
                            Once your referrers start sending leads, they&apos;ll rank here by performance.
                            {referrers.length === 0 ? " Approve your pending applications to get started." : ""}
                        </p>
                        {pendingCount > 0 ? (
                            <button
                                onClick={() => router.push("/dashboard/business/force?tab=applications")}
                                className="bg-amber-500 hover:bg-amber-600 text-white rounded-full font-bold px-5 h-10 transition-colors"
                                style={{ fontSize: 16 }}
                            >
                                Review {pendingCount} Application{pendingCount > 1 ? "s" : ""} →
                            </button>
                        ) : (
                            <button
                                onClick={() => router.push("/dashboard/business/force?tab=partners")}
                                className="bg-orange-500 hover:bg-orange-600 text-white rounded-full font-bold px-5 h-10 transition-colors"
                                style={{ fontSize: 16 }}
                            >
                                View Partner Network
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-50">
                        {referrers.map((ref, idx) => {
                            const medal = idx === 0 ? "" : idx === 1 ? "" : idx === 2 ? "" : null;
                            return (
                                <div key={ref.referrer_id} className="flex items-center gap-4 px-5 py-4 hover:bg-zinc-50 transition-colors">
                                    <div className="w-10 h-10 flex items-center justify-center shrink-0">
                                        {medal
                                            ? <span style={{ fontSize: 26 }}>{medal}</span>
                                            : <span className="font-black text-zinc-400" style={{ fontSize: 22 }}>#{idx + 1}</span>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-zinc-900 truncate" style={{ fontSize: 22 }}>{ref.full_name}</p>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <span className="flex items-center gap-1 text-amber-600 font-bold" style={{ fontSize: 18 }}>
                                                <Star className="w-4 h-4 fill-amber-400 stroke-amber-400" />{ref.quality_score}
                                            </span>
                                            <span className="text-zinc-400 font-medium" style={{ fontSize: 18 }}>
                                                {ref.leads_created} leads
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-black text-zinc-900" style={{ fontSize: 20 }}>${(ref.total_earned_cents / 100).toFixed(0)}</p>
                                        <p className="text-zinc-400 font-medium" style={{ fontSize: 17 }}>earned</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                {referrers.length > 0 && (
                    <div className="px-5 py-4 border-t border-zinc-50">
                        <button onClick={() => router.push("/dashboard/business/force?tab=partners")}
                            className="w-full font-bold text-orange-600 hover:text-orange-700 transition-colors flex items-center justify-center gap-1"
                            style={{ fontSize: 19 }}>
                            View full leaderboard <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}