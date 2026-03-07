"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import {
    Clock, CheckCircle, XCircle, AlertCircle,
    ArrowLeft, ChevronRight, Users, Star
} from "lucide-react";
import Link from "next/link";

interface Application {
    id: string;
    status: "pending" | "approved" | "rejected" | "expired";
    message: string | null;
    applied_at: string;
    reminder_count: number;
    referrer_id: string;
    referrer_name: string;
    referrer_suburb: string;
    referrer_state: string;
    quality_score: number;
    profile_photo_url: string | null;
    tagline: string | null;
}

const STATUS_CONFIG = {
    pending: { label: "Awaiting Review", icon: Clock, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    approved: { label: "Approved", icon: CheckCircle, bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
    rejected: { label: "Rejected", icon: XCircle, bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
    expired: { label: "Expired", icon: AlertCircle, bg: "bg-zinc-50", text: "text-zinc-500", border: "border-zinc-200" },
};

function fmtDate(d: string) {
    return new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

export default function BusinessApplicationsPage() {
    const { getToken, isLoaded } = useAuth();
    const [apps, setApps] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "pending">("pending");
    const [pendingCount, setPendingCount] = useState(0);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    useEffect(() => {
        if (!isLoaded) return;
        (async () => {
            const token = await getToken();
            const res = await fetch(`${apiUrl}/applications/business/pending`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setApps(data.applications);
                setPendingCount(data.pending_count);
            }
            setLoading(false);
        })();
    }, [isLoaded, getToken, apiUrl]);

    const displayed = filter === "pending" ? apps.filter(a => a.status === "pending") : apps;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-[3px] border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="w-full px-6 py-6 max-w-4xl mx-auto">

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <Link href="/dashboard/business" className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-700 transition-colors font-bold" style={{ fontSize: '16px' }}>
                        <ArrowLeft className="w-4 h-4" /> Dashboard
                    </Link>
                    <span className="text-zinc-300">/</span>
                    <span className="text-zinc-700 font-bold" style={{ fontSize: '16px' }}>Referrer Applications</span>
                </div>

                <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
                    <div>
                        <h1 className="font-black text-zinc-900 flex items-center gap-3" style={{ fontSize: '28px' }}>
                            <Users className="w-7 h-7 text-orange-500" />
                            Referrer Applications
                        </h1>
                        <p className="text-zinc-500 font-medium mt-1" style={{ fontSize: '17px' }}>
                            {pendingCount > 0
                                ? `You have ${pendingCount} application${pendingCount !== 1 ? 's' : ''} waiting for your review.`
                                : "No pending applications right now."}
                        </p>
                    </div>
                    {/* Filter tabs */}
                    <div className="flex gap-2">
                        {(["pending", "all"] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-xl font-bold transition-all ${filter === f ? "bg-orange-600 text-white" : "bg-white border border-zinc-200 text-zinc-600 hover:border-orange-300"}`}
                                style={{ fontSize: '15px' }}
                            >
                                {f === "pending" ? `Pending (${pendingCount})` : "All"}
                            </button>
                        ))}
                    </div>
                </div>

                {displayed.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center shadow-sm">
                        <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Users className="w-8 h-8 text-orange-300" />
                        </div>
                        <h3 className="font-black text-zinc-900 mb-2" style={{ fontSize: '20px' }}>
                            {filter === "pending" ? "No pending applications" : "No applications yet"}
                        </h3>
                        <p className="text-zinc-500 font-medium" style={{ fontSize: '17px' }}>
                            {filter === "pending"
                                ? "You're all caught up! Switch to 'All' to see your history."
                                : "When referrers apply to join your network, they'll appear here."}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {displayed.map(app => {
                            const cfg = STATUS_CONFIG[app.status];
                            const StatusIcon = cfg.icon;
                            const initials = app.referrer_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
                            return (
                                <Link
                                    key={app.id}
                                    href={`/dashboard/business/applications/${app.id}`}
                                    className="block bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm hover:shadow-md hover:border-orange-200 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Avatar */}
                                        <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center font-black text-orange-600 shrink-0 overflow-hidden" style={{ fontSize: '18px' }}>
                                            {app.profile_photo_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={app.profile_photo_url} alt="" className="w-full h-full object-cover" />
                                            ) : initials}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-3 flex-wrap">
                                                <div>
                                                    <h3 className="font-black text-zinc-900 group-hover:text-orange-600 transition-colors" style={{ fontSize: '18px' }}>
                                                        {app.referrer_name}
                                                    </h3>
                                                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                                        <span className="text-zinc-400 font-medium" style={{ fontSize: '15px' }}>
                                                            {app.referrer_suburb}{app.referrer_state ? `, ${app.referrer_state}` : ""}
                                                        </span>
                                                        <span className="flex items-center gap-1 text-amber-500 font-bold" style={{ fontSize: '15px' }}>
                                                            <Star className="w-3.5 h-3.5 fill-amber-400" />{app.quality_score}
                                                        </span>
                                                    </div>
                                                    {app.tagline && (
                                                        <p className="text-zinc-500 font-medium mt-1 italic" style={{ fontSize: '15px' }}>
                                                            &ldquo;{app.tagline}&rdquo;
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex flex-col items-end gap-2 shrink-0">
                                                    <span className={`flex items-center gap-1.5 px-3 py-1.5 ${cfg.bg} ${cfg.text} ${cfg.border} border rounded-xl font-bold`} style={{ fontSize: '14px' }}>
                                                        <StatusIcon className="w-4 h-4" />{cfg.label}
                                                    </span>
                                                    {app.status === "pending" && app.reminder_count > 0 && (
                                                        <span className="text-amber-600 font-bold" style={{ fontSize: '13px' }}>
                                                            ⚠️ Reminder {app.reminder_count}/3 sent
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                                                <p className="text-zinc-400 font-medium" style={{ fontSize: '14px' }}>Applied {fmtDate(app.applied_at)}</p>
                                                <span className="flex items-center gap-1 text-orange-500 font-bold group-hover:text-orange-600" style={{ fontSize: '15px' }}>
                                                    {app.status === "pending" ? "Review now" : "View details"} <ChevronRight className="w-4 h-4" />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
