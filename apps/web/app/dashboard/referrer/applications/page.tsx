"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import {
    Clock, CheckCircle, XCircle, AlertCircle,
    ArrowLeft, ChevronRight, Search
} from "lucide-react";
import Link from "next/link";

interface Application {
    id: string;
    status: "pending" | "approved" | "rejected" | "expired";
    message: string | null;
    applied_at: string;
    reviewed_at: string | null;
    business_name: string;
    business_slug: string;
    business_logo: string | null;
    trade_category: string;
    suburb: string;
}

const STATUS_CONFIG = {
    pending: { label: "Awaiting Review", icon: Clock, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-400" },
    approved: { label: "Approved", icon: CheckCircle, bg: "bg-green-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-500" },
    rejected: { label: "Not Approved", icon: XCircle, bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-400" },
    expired: { label: "Expired", icon: AlertCircle, bg: "bg-zinc-50", text: "text-zinc-500", border: "border-zinc-200", dot: "bg-zinc-400" },
};

function fmtDate(d: string) {
    return new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

export default function ReferrerApplicationsPage() {
    const { getToken, isLoaded } = useAuth();
    const [apps, setApps] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    useEffect(() => {
        if (!isLoaded) return;
        (async () => {
            const token = await getToken();
            const res = await fetch(`${apiUrl}/applications/my-applications`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setApps(data.applications);
            }
            setLoading(false);
        })();
    }, [isLoaded, getToken, apiUrl]);

    const pending = apps.filter(a => a.status === "pending");
    const rest = apps.filter(a => a.status !== "pending");

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-[3px] border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="w-full px-6 py-6 max-w-3xl mx-auto">

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <Link href="/dashboard/referrer" className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-700 transition-colors font-bold" style={{ fontSize: '16px' }}>
                        <ArrowLeft className="w-4 h-4" /> Dashboard
                    </Link>
                    <span className="text-zinc-300">/</span>
                    <span className="text-zinc-700 font-bold" style={{ fontSize: '16px' }}>My Applications</span>
                </div>

                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="font-black text-zinc-900" style={{ fontSize: '28px' }}>Referrer Applications</h1>
                        <p className="text-zinc-500 font-medium mt-1" style={{ fontSize: '16px' }}>
                            Track which businesses have approved you as a referrer.
                        </p>
                    </div>
                    {pending.length > 0 && (
                        <span className="bg-amber-500 text-white font-black rounded-full px-3 py-1" style={{ fontSize: '14px' }}>
                            {pending.length} pending
                        </span>
                    )}
                </div>

                {apps.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center shadow-sm">
                        <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-orange-300" />
                        </div>
                        <h3 className="font-black text-zinc-900 mb-2" style={{ fontSize: '20px' }}>No applications yet</h3>
                        <p className="text-zinc-500 font-medium mb-6" style={{ fontSize: '17px' }}>
                            Browse businesses and apply to join their referral network.
                        </p>
                        <Link
                            href="/dashboard/referrer/businesses"
                            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-3 rounded-xl transition-all"
                            style={{ fontSize: '17px' }}
                        >
                            Find Businesses <ChevronRight className="w-5 h-5" />
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {[...pending, ...rest].map(app => {
                            const cfg = STATUS_CONFIG[app.status];
                            const StatusIcon = cfg.icon;
                            return (
                                <div
                                    key={app.id}
                                    className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm hover:shadow-md transition-all"
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Logo */}
                                        <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0 font-black text-zinc-400 overflow-hidden" style={{ fontSize: '18px' }}>
                                            {app.business_logo ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={app.business_logo} alt="" className="w-full h-full object-cover" />
                                            ) : app.business_name.charAt(0)}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-3 flex-wrap">
                                                <div>
                                                    <h3 className="font-black text-zinc-900" style={{ fontSize: '18px' }}>{app.business_name}</h3>
                                                    <p className="text-zinc-400 font-medium" style={{ fontSize: '16px' }}>{app.trade_category} · {app.suburb}</p>
                                                </div>
                                                <span className={`flex items-center gap-1.5 px-3 py-1.5 ${cfg.bg} ${cfg.text} ${cfg.border} border rounded-xl font-bold shrink-0`} style={{ fontSize: '14px' }}>
                                                    <StatusIcon className="w-4 h-4" />
                                                    {cfg.label}
                                                </span>
                                            </div>

                                            {app.message && (
                                                <p className="mt-2 text-zinc-500 font-medium italic" style={{ fontSize: '15px' }}>
                                                    &ldquo;{app.message}&rdquo;
                                                </p>
                                            )}

                                            <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                                                <p className="text-zinc-400 font-medium" style={{ fontSize: '14px' }}>
                                                    Applied {fmtDate(app.applied_at)}
                                                    {app.reviewed_at && ` · Reviewed ${fmtDate(app.reviewed_at)}`}
                                                </p>
                                                {app.status === "approved" && (
                                                    <Link
                                                        href={`/dashboard/referrer/manage?business=${app.business_slug}`}
                                                        className="flex items-center gap-1.5 text-orange-600 hover:text-orange-700 font-bold transition-colors"
                                                        style={{ fontSize: '15px' }}
                                                    >
                                                        Open Command Centre <ChevronRight className="w-4 h-4" />
                                                    </Link>
                                                )}
                                                {(app.status === "rejected" || app.status === "expired") && (
                                                    <Link
                                                        href="/dashboard/referrer/businesses"
                                                        className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-700 font-bold transition-colors"
                                                        style={{ fontSize: '15px' }}
                                                    >
                                                        Find other businesses <ChevronRight className="w-4 h-4" />
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
