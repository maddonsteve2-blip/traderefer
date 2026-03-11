"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Clock, CheckCircle, XCircle, AlertCircle, Star, MapPin,
    Briefcase, TrendingUp, User, MessageSquare, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

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

interface ApplicationDetail {
    id: string;
    status: "pending" | "approved" | "rejected" | "expired";
    message: string | null;
    applied_at: string;
    reminder_count: number;
    referrer: {
        id: string;
        full_name: string;
        suburb: string;
        state: string;
        quality_score: number;
        profile_bio: string | null;
        tagline: string | null;
        profile_photo_url: string | null;
        member_since: string | null;
        businesses_linked: number;
        confirmed_referrals: number;
    };
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

export function ForceApplicationsPane() {
    const { getToken, isLoaded } = useAuth();
    const router = useRouter();
    const [apps, setApps] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [filter, setFilter] = useState<"pending" | "all">("pending");
    const [pendingCount, setPendingCount] = useState(0);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [detail, setDetail] = useState<ApplicationDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [acting, setActing] = useState<"approving" | "rejecting" | null>(null);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    const fetchApps = useCallback(async () => {
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
    }, [getToken, apiUrl]);

    useEffect(() => { if (isLoaded) fetchApps(); }, [isLoaded, fetchApps]);

    useEffect(() => {
        const update = () => setIsMobile(window.innerWidth < 768);
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    const fetchDetail = useCallback(async (id: string) => {
        setDetailLoading(true);
        setDetail(null);
        const token = await getToken();
        const res = await fetch(`${apiUrl}/applications/business/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setDetail(await res.json());
        setDetailLoading(false);
    }, [getToken, apiUrl]);

    useEffect(() => {
        if (selectedId) fetchDetail(selectedId);
    }, [selectedId, fetchDetail]);

    const handleApprove = async () => {
        if (!selectedId || !detail) return;
        setActing("approving");
        const token = await getToken();
        const res = await fetch(`${apiUrl}/applications/business/${selectedId}/approve`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });
        setActing(null);
        if (res.ok) {
            toast.success(`${detail.referrer.full_name} approved!`);
            setSelectedId(null);
            fetchApps();
        } else {
            const err = await res.json().catch(() => ({}));
            toast.error(err.detail || "Something went wrong.");
        }
    };

    const handleReject = async () => {
        if (!selectedId || !detail) return;
        setActing("rejecting");
        const token = await getToken();
        const res = await fetch(`${apiUrl}/applications/business/${selectedId}/reject`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });
        setActing(null);
        if (res.ok) {
            toast.success("Application declined.");
            setSelectedId(null);
            fetchApps();
        } else {
            toast.error("Something went wrong.");
        }
    };

    const handleMessage = async () => {
        if (!detail) return;
        const token = await getToken();
        const res = await fetch(`${apiUrl}/messages/conversations/start/${detail.referrer.id}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            const data = await res.json();
            router.push(`/dashboard/business/messages?conv=${data.conversation_id}`);
        } else {
            toast.error("Could not start conversation.");
        }
    };

    const displayed = filter === "pending" ? apps.filter(a => a.status === "pending") : apps;

    const handleSelect = (applicationId: string) => {
        if (isMobile) {
            router.push(`/dashboard/business/applications/${applicationId}`);
            return;
        }

        setSelectedId(applicationId);
    };

    return (
        <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* LEFT PANE — list */}
            <div className="w-full md:w-[320px] shrink-0 border-r border-zinc-200 overflow-y-auto bg-white">
                {/* Filter bar */}
                <div className="sticky top-0 bg-white border-b border-zinc-100 px-4 py-3 flex gap-2 z-10">
                    {(["pending", "all"] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${filter === f ? "bg-orange-500 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}
                            style={{ fontSize: 14 }}
                        >
                            {f === "pending" ? `Pending (${pendingCount})` : "All"}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-8 h-8 border-[3px] border-orange-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : displayed.length === 0 ? (
                    <div className="px-4 py-12 text-center">
                        <CheckCircle className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
                        <p className="font-bold text-zinc-500" style={{ fontSize: 16 }}>
                            {filter === "pending" ? "No pending applications" : "No applications yet"}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-100">
                        {displayed.map(app => {
                            const cfg = STATUS_CONFIG[app.status];
                            const initials = app.referrer_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
                            const isSelected = selectedId === app.id;
                            return (
                                <button
                                    key={app.id}
                                    onClick={() => handleSelect(app.id)}
                                    className={`w-full text-left px-4 py-4 transition-colors ${isSelected ? "bg-orange-50 border-l-4 border-orange-500" : "hover:bg-zinc-50 border-l-4 border-transparent"}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center font-black text-orange-600 shrink-0 overflow-hidden" style={{ fontSize: 15 }}>
                                            {app.profile_photo_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={app.profile_photo_url} alt="" className="w-full h-full object-cover" />
                                            ) : initials}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-zinc-900 truncate" style={{ fontSize: 16 }}>{app.referrer_name}</p>
                                            <p className="text-zinc-400 font-medium truncate" style={{ fontSize: 13 }}>
                                                {app.referrer_suburb}{app.referrer_state ? `, ${app.referrer_state}` : ""} · ⭐ {app.quality_score}
                                            </p>
                                        </div>
                                        <span className={`shrink-0 px-2 py-1 rounded-lg font-bold ${cfg.bg} ${cfg.text}`} style={{ fontSize: 12 }}>
                                            {cfg.label}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* RIGHT PANE — detail / resume */}
            <div className="hidden md:flex flex-1 overflow-y-auto bg-zinc-50">
                {!selectedId ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-8">
                        <User className="w-16 h-16 text-zinc-200 mb-4" />
                        <p className="font-black text-zinc-400" style={{ fontSize: 20 }}>Select an application</p>
                        <p className="text-zinc-400 font-medium mt-1" style={{ fontSize: 16 }}>Click a name on the left to review their profile</p>
                    </div>
                ) : detailLoading || !detail ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-10 h-10 border-[3px] border-orange-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (() => {
                    const ref = detail.referrer;
                    const initials = ref.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
                    const isPending = detail.status === "pending";
                    const memberYear = ref.member_since ? new Date(ref.member_since).getFullYear() : null;

                    return (
                        <div className="max-w-2xl mx-auto px-6 py-6">
                            {/* Sticky action bar */}
                            {isPending && (
                                <div className="sticky top-0 z-10 bg-zinc-900 rounded-2xl px-5 py-3 mb-5 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-amber-400" />
                                        <span className="font-bold text-white" style={{ fontSize: 16 }}>Applied {fmtDate(detail.applied_at)}</span>
                                        {detail.reminder_count > 0 && (
                                            <span className="text-amber-400 font-bold" style={{ fontSize: 13 }}>· Reminder {detail.reminder_count}/3</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleMessage}
                                            className="flex items-center gap-1.5 h-9 px-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all"
                                            style={{ fontSize: 14 }}
                                        >
                                            <MessageSquare className="w-4 h-4" /> Message
                                        </button>
                                        <button
                                            onClick={handleReject}
                                            disabled={acting !== null}
                                            className="flex items-center gap-1.5 h-9 px-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl font-bold transition-all disabled:opacity-50"
                                            style={{ fontSize: 14 }}
                                        >
                                            {acting === "rejecting" ? <div className="w-4 h-4 border-2 border-red-300/30 border-t-red-300 rounded-full animate-spin" /> : <><XCircle className="w-4 h-4" /> Decline</>}
                                        </button>
                                        <button
                                            onClick={handleApprove}
                                            disabled={acting !== null}
                                            className="flex items-center gap-1.5 h-9 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black transition-all disabled:opacity-50"
                                            style={{ fontSize: 15 }}
                                        >
                                            {acting === "approving" ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Approve</>}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {!isPending && (
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold mb-5 ${
                                    detail.status === "approved" ? "bg-green-50 text-green-700 border border-green-200" :
                                    detail.status === "rejected" ? "bg-red-50 text-red-700 border border-red-200" :
                                    "bg-zinc-50 text-zinc-500 border border-zinc-200"
                                }`} style={{ fontSize: 16 }}>
                                    {detail.status === "approved" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                    {detail.status.charAt(0).toUpperCase() + detail.status.slice(1)}
                                </div>
                            )}

                            {/* Hero card */}
                            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm mb-4">
                                <div className="flex items-start gap-4 mb-5">
                                    <div className="w-20 h-20 rounded-2xl bg-orange-100 flex items-center justify-center font-black text-orange-600 shrink-0 overflow-hidden" style={{ fontSize: 26 }}>
                                        {ref.profile_photo_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={ref.profile_photo_url} alt="" className="w-full h-full object-cover" />
                                        ) : initials}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="font-black text-zinc-900 leading-tight" style={{ fontSize: 24 }}>{ref.full_name}</h2>
                                        {ref.tagline && <p className="font-medium text-zinc-500 mt-1" style={{ fontSize: 16 }}>{ref.tagline}</p>}
                                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                                            {(ref.suburb || ref.state) && (
                                                <span className="flex items-center gap-1 text-zinc-400 font-medium" style={{ fontSize: 14 }}>
                                                    <MapPin className="w-4 h-4" />{ref.suburb}{ref.state ? `, ${ref.state}` : ""}
                                                </span>
                                            )}
                                            {memberYear && (
                                                <span className="flex items-center gap-1 text-zinc-400 font-medium" style={{ fontSize: 14 }}>
                                                    <Briefcase className="w-4 h-4" />Member since {memberYear}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3 mb-5">
                                    {[
                                        { label: "Quality Score", value: ref.quality_score, icon: Star, bg: "bg-amber-50", text: "text-amber-500" },
                                        { label: "Confirmed Leads", value: ref.confirmed_referrals, icon: TrendingUp, bg: "bg-emerald-50", text: "text-emerald-600" },
                                        { label: "Businesses", value: ref.businesses_linked, icon: Briefcase, bg: "bg-blue-50", text: "text-blue-600" },
                                    ].map(s => (
                                        <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
                                            <s.icon className={`w-5 h-5 ${s.text} mx-auto mb-1`} />
                                            <p className="font-black text-zinc-900" style={{ fontSize: 22 }}>{s.value}</p>
                                            <p className="font-bold text-zinc-500" style={{ fontSize: 12 }}>{s.label}</p>
                                        </div>
                                    ))}
                                </div>

                                {ref.profile_bio ? (
                                    <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <User className="w-4 h-4 text-orange-500" />
                                            <span className="font-black text-zinc-700" style={{ fontSize: 16 }}>About</span>
                                        </div>
                                        <p className="font-medium text-zinc-700 leading-relaxed" style={{ fontSize: 16 }}>{ref.profile_bio}</p>
                                    </div>
                                ) : (
                                    <div className="bg-zinc-50 rounded-xl p-4 border border-dashed border-zinc-200 text-center">
                                        <p className="font-medium text-zinc-400" style={{ fontSize: 16 }}>No bio added yet.</p>
                                    </div>
                                )}
                            </div>

                            {detail.message && (
                                <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                                        <span className="font-black text-zinc-700" style={{ fontSize: 16 }}>Their intro message</span>
                                    </div>
                                    <p className="font-medium text-zinc-600 leading-relaxed italic" style={{ fontSize: 16 }}>
                                        &ldquo;{detail.message}&rdquo;
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}
