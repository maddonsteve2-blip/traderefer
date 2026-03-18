"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import {
    Clock, CheckCircle, XCircle, AlertCircle,
    ChevronRight, ClipboardList
} from "lucide-react";
import Link from "next/link";
import { PageTransition } from "@/components/ui/PageTransition";
import { BusinessLogo } from "@/components/BusinessLogo";

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
    pending: { label: "Awaiting Review", icon: Clock, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    approved: { label: "Approved", icon: CheckCircle, bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
    rejected: { label: "Not Approved", icon: XCircle, bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
    expired: { label: "Expired", icon: AlertCircle, bg: "bg-zinc-50", text: "text-zinc-500", border: "border-zinc-200" },
};

function fmtDate(d: string) {
    return new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

function AppCard({ app, mobile }: { app: Application; mobile?: boolean }) {
    const cfg = STATUS_CONFIG[app.status];
    const StatusIcon = cfg.icon;
    return (
        <div className={`bg-white rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-all ${mobile ? "p-4" : "p-5"}`}>
            <div className={`flex items-start ${mobile ? "gap-3" : "gap-4"}`}>
                <BusinessLogo logoUrl={app.business_logo} name={app.business_name} size={mobile ? "sm" : "md"} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                            <p className={`font-black text-zinc-900 truncate ${mobile ? "text-[16px]" : "text-lg"}`}>{app.business_name}</p>
                            <p className={`font-medium text-zinc-400 mt-0.5 truncate ${mobile ? "text-[13px]" : "text-sm"}`}>{app.trade_category} · {app.suburb}</p>
                        </div>
                        <span className={`flex items-center gap-1.5 px-3 py-1.5 ${cfg.bg} ${cfg.text} ${cfg.border} border rounded-xl font-black shrink-0 text-xs`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {cfg.label}
                        </span>
                    </div>

                    {app.message && (
                        <p className="mt-3 text-zinc-500 font-medium italic leading-relaxed text-sm">
                            &ldquo;{app.message}&rdquo;
                        </p>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100 flex-wrap gap-2">
                        <p className="text-zinc-400 font-bold text-sm">
                            Applied {fmtDate(app.applied_at)}
                            {app.reviewed_at && ` · Reviewed ${fmtDate(app.reviewed_at)}`}
                        </p>
                        {app.status === "approved" && (
                            <Link
                                href={`/dashboard/referrer/manage?business=${app.business_slug}`}
                                className="flex items-center gap-1.5 text-orange-600 hover:text-orange-700 font-black transition-colors text-sm"
                            >
                                Open My Partnerships <ChevronRight className="w-4 h-4" />
                            </Link>
                        )}
                        {(app.status === "rejected" || app.status === "expired") && (
                            <Link
                                href="/dashboard/referrer/businesses"
                                className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-700 font-black transition-colors text-sm"
                            >
                                Find other businesses <ChevronRight className="w-4 h-4" />
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ReferrerApplicationsPage() {
    const { getToken, isLoaded } = useAuth();
    const [apps, setApps] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const apiUrl = "/api/backend";

    useEffect(() => {
        if (!isLoaded) return;
        (async () => {
            const token = await getToken();
            const res = await fetch(`${apiUrl}/applications/my-applications`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setApps(Array.isArray(data.applications) ? data.applications : []);
            }
            setLoading(false);
        })();
    }, [isLoaded, getToken, apiUrl]);

    const pending = Array.isArray(apps) ? apps.filter(a => a.status === "pending") : [];
    const rest = Array.isArray(apps) ? apps.filter(a => a.status !== "pending") : [];
    const sorted = [...pending, ...rest];

    return (
        <PageTransition className="min-h-[100dvh] flex flex-col bg-zinc-50 md:h-screen md:overflow-hidden">

            {/* ── DESKTOP HEADER ── */}
            <div className="hidden lg:flex items-center justify-between px-6 pt-5 pb-0 shrink-0">
                <div>
                    <h1 className="text-2xl font-black text-zinc-900">Applications</h1>
                    <p className="text-sm font-medium text-zinc-500 mt-0.5">Track which businesses have approved you as a referrer.</p>
                </div>
                {pending.length > 0 && (
                    <span className="bg-amber-500 text-white font-black rounded-full px-4 py-1.5 text-sm">
                        {pending.length} pending
                    </span>
                )}
            </div>

            {/* ── MOBILE HEADER ── */}
            <div className="lg:hidden px-4 pt-4 pb-2 shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-[22px] font-black text-zinc-900">Applications</h1>
                        <p className="text-[13px] font-medium text-zinc-500 mt-0.5">Track approvals from businesses you&apos;ve applied to.</p>
                    </div>
                    {pending.length > 0 && (
                        <span className="bg-amber-500 text-white font-black rounded-full px-3 py-1 text-[12px]">
                            {pending.length} pending
                        </span>
                    )}
                </div>
            </div>

            {/* ── CONTENT ── */}
            <div id="tour-applications-list" className="flex-1 overflow-y-auto px-4 lg:px-6 py-4">
                {loading ? (
                    <div className="space-y-3 max-w-3xl">
                        {[1,2,3].map(i => (
                            <div key={i} className="bg-white rounded-2xl border border-zinc-200 p-5 flex items-start gap-4">
                                <div className="w-14 h-14 bg-zinc-100 rounded-2xl animate-pulse shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-5 w-44 bg-zinc-100 rounded-lg animate-pulse" />
                                    <div className="h-3 w-32 bg-zinc-50 rounded animate-pulse" />
                                    <div className="h-8 w-28 bg-zinc-50 rounded-xl animate-pulse mt-3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : apps.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-8 py-16">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm border border-zinc-100 mb-6">
                            <ClipboardList className="w-12 h-12 text-zinc-200" />
                        </div>
                        <p className="text-2xl font-black text-zinc-900 tracking-tight">No applications yet</p>
                        <p className="text-zinc-400 font-medium text-lg mt-3 max-w-sm">Browse businesses and apply to join their referral network.</p>
                        <Link
                            href="/dashboard/referrer/businesses"
                            className="mt-8 inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-black px-6 py-3 rounded-xl transition-all shadow-lg shadow-orange-200 active:scale-95"
                        >
                            Find Businesses <ChevronRight className="w-5 h-5" />
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3 max-w-3xl">
                        {sorted.map(app => (
                            <AppCard key={app.id} app={app} mobile={false} />
                        ))}
                    </div>
                )}
            </div>
        </PageTransition>
    );
}
