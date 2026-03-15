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

function fmtDate(d: string | null) {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

export function ForceApplicationsPane() {
    const { getToken, isLoaded } = useAuth();
    const router = useRouter();
    const [apps, setApps] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [filter, setFilter] = useState<"pending" | "declined" | "all">("pending");
    const [pendingCount, setPendingCount] = useState(0);
    const [rejectedCount, setRejectedCount] = useState(0);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [detail, setDetail] = useState<ApplicationDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [acting, setActing] = useState<"approving" | "rejecting" | null>(null);
    const apiUrl = "/api/backend";

    const fetchApps = useCallback(async () => {
        const token = await getToken();
        const res = await fetch(`${apiUrl}/applications/business/pending`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            const data = await res.json();
            setApps(data.applications ?? []);
            setPendingCount(data.pending_count ?? 0);
            setRejectedCount(data.rejected_count ?? 0);
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

    const PENDING_STATUSES = ["pending", "applied", "new", "submitted", "under_review"];
    const displayed = filter === "pending" ? apps.filter(a => PENDING_STATUSES.includes((a.status ?? "").toLowerCase()))
        : filter === "declined" ? apps.filter(a => a.status === "rejected")
        : apps;

    const handleReconsider = async () => {
        if (!selectedId || !detail) return;
        setActing("approving");
        const token = await getToken();
        const res = await fetch(`${apiUrl}/applications/business/${selectedId}/approve`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });
        setActing(null);
        if (res.ok) {
            toast.success(`${detail.referrer.full_name} has been approved!`);
            setSelectedId(null);
            fetchApps();
        } else {
            const err = await res.json().catch(() => ({}));
            toast.error(err.detail || "Something went wrong.");
        }
    };

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
            <div className="w-full md:w-[400px] shrink-0 border-r border-zinc-200 overflow-y-auto bg-white flex flex-col">
                {/* Filter bar */}
                <div className="sticky top-0 bg-white border-b border-zinc-100 px-4 py-3 flex gap-2 z-10">
                    {(["pending", "declined", "all"] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-full border font-semibold transition-all text-sm ${filter === f ? "bg-orange-500 text-white border-orange-500 shadow-sm" : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"}`}
                        >
                            {f === "pending" ? `pending (${pendingCount})` : f === "declined" ? `declined (${rejectedCount})` : f}
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
                        <p className="font-bold text-zinc-500 text-base">
                            {filter === "pending" ? "No pending applications" : "No applications yet"}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-100 flex-1">
                        {displayed.map(app => {
                            const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
                            const initials = app.referrer_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
                            const isSelected = selectedId === app.id;
                            return (
                                <button
                                    key={app.id}
                                    onClick={() => handleSelect(app.id)}
                                    className={`w-full text-left px-4 py-4 transition-colors ${isSelected ? "bg-orange-50 border-l-4 border-orange-500" : "hover:bg-zinc-50 border-l-4 border-transparent"}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center font-black text-orange-600 shrink-0 overflow-hidden text-sm">
                                            {app.profile_photo_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={app.profile_photo_url} alt="" className="w-full h-full object-cover" />
                                            ) : initials}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-zinc-900 truncate text-sm leading-snug">{app.referrer_name}</p>
                                            <p className="font-medium text-zinc-400 mt-0.5 text-xs">
                                                {app.referrer_suburb}{app.referrer_state ? `, ${app.referrer_state}` : ""} · ⭐ {app.quality_score}
                                            </p>
                                        </div>
                                        <span className={`shrink-0 px-2.5 py-1 rounded-full font-semibold ${cfg.bg} ${cfg.text} text-xs`}>
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
                        <div className="w-16 h-16 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center mb-5">
                            <User className="w-8 h-8 text-amber-400" />
                        </div>
                        <p className="font-black text-zinc-900 text-2xl mb-2">Review Applications</p>
                        <p className="text-zinc-400 font-medium text-base max-w-xs leading-relaxed">
                            When someone applies to join your referral network, they appear here. Approve them to give them access to your referral links and fees.
                        </p>
                    </div>
                ) : detailLoading || !detail ? (
                    <div className="flex items-center justify-center h-64 w-full">
                        <div className="w-10 h-10 border-[3px] border-orange-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (() => {
                    const ref = detail.referrer;
                    const initials = ref.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
                    const isPending = detail.status === "pending";
                    const memberYear = ref.member_since ? new Date(ref.member_since).getFullYear() : null;

                    return (
                        <div className="w-full px-6 py-6">
                            {/* Sticky action bar */}
                            {isPending && (
                                <div className="sticky top-0 z-10 bg-orange-600 rounded-2xl px-5 py-3 mb-5 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-amber-400" />
                                        <span className="font-bold text-white text-sm">Applied {fmtDate(detail.applied_at)}</span>
                                        {detail.reminder_count > 0 && (
                                            <span className="text-amber-300 font-medium text-sm">· Reminder {detail.reminder_count}/3</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleMessage}
                                            className="flex items-center gap-1.5 h-9 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all text-sm"
                                        >
                                            <MessageSquare className="w-4 h-4" /> Message
                                        </button>
                                        <button
                                            onClick={handleReject}
                                            disabled={acting !== null}
                                            className="flex items-center gap-1.5 h-9 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl font-bold transition-all disabled:opacity-50 text-sm"
                                        >
                                            {acting === "rejecting" ? <div className="w-4 h-4 border-2 border-red-300/30 border-t-red-300 rounded-full animate-spin" /> : <><XCircle className="w-4 h-4" /> Decline</>}
                                        </button>
                                        <button
                                            onClick={handleApprove}
                                            disabled={acting !== null}
                                            className="flex items-center gap-1.5 h-9 px-5 bg-white text-orange-600 rounded-xl font-black transition-all disabled:opacity-50 text-sm"
                                        >
                                            {acting === "approving" ? <div className="w-4 h-4 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Approve</>}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {!isPending && detail.status === "rejected" && (
                                <div className="bg-zinc-700 rounded-2xl px-5 py-3 mb-5 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <XCircle className="w-4 h-4 text-red-400" />
                                        <span className="font-bold text-white text-sm">Declined · Archived</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleMessage}
                                            className="flex items-center gap-1.5 h-9 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all text-sm"
                                        >
                                            <MessageSquare className="w-4 h-4" /> Message
                                        </button>
                                        <button
                                            onClick={handleReconsider}
                                            disabled={acting !== null}
                                            className="flex items-center gap-1.5 h-9 px-5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-black transition-all disabled:opacity-50 text-sm"
                                        >
                                            {acting === "approving" ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Reconsider &amp; Approve</>}
                                        </button>
                                    </div>
                                </div>
                            )}
                            {!isPending && detail.status === "approved" && (
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold mb-5 bg-green-50 text-green-700 border border-green-200 text-sm">
                                    <CheckCircle className="w-5 h-5" /> Approved
                                </div>
                            )}

                            {/* Hero card */}
                            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm mb-4">
                                <div className="flex items-start gap-4 mb-5">
                                    <div className="w-20 h-20 rounded-2xl bg-orange-100 flex items-center justify-center font-bold text-orange-600 shrink-0 overflow-hidden text-3xl">
                                        {ref.profile_photo_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={ref.profile_photo_url} alt="" className="w-full h-full object-cover" />
                                        ) : initials}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="font-bold text-zinc-900 leading-tight text-xl">{ref.full_name}</h2>
                                        {ref.tagline && <p className="font-medium text-zinc-500 mt-0.5 text-sm">{ref.tagline}</p>}
                                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                                            {(ref.suburb || ref.state) && (
                                                <span className="flex items-center gap-1.5 text-zinc-400 font-medium text-sm">
                                                    <MapPin className="w-3.5 h-3.5" />{ref.suburb}{ref.state ? `, ${ref.state}` : ""}
                                                </span>
                                            )}
                                            {memberYear && (
                                                <span className="flex items-center gap-1.5 text-zinc-400 font-medium text-sm">
                                                    <Briefcase className="w-3.5 h-3.5" />Member since {memberYear}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3 mb-5">
                                    {[
                                        { label: "Quality Score", value: `${ref.quality_score}/100`, icon: Star, bg: "bg-amber-50", text: "text-amber-500" },
                                        { label: "Confirmed Leads", value: ref.confirmed_referrals, icon: TrendingUp, bg: "bg-emerald-50", text: "text-emerald-600" },
                                        { label: "Businesses", value: ref.businesses_linked, icon: Briefcase, bg: "bg-blue-50", text: "text-blue-600" },
                                    ].map(s => (
                                        <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center border border-black/5 shadow-sm`}>
                                            <s.icon className={`w-5 h-5 ${s.text} mx-auto mb-1.5`} />
                                            <p className="font-bold text-zinc-900 text-sm">{s.value}</p>
                                            <p className="font-bold text-zinc-400 text-xs mt-0.5">{s.label}</p>
                                        </div>
                                    ))}
                                </div>

                                {ref.profile_bio ? (
                                    <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <User className="w-5 h-5 text-orange-500" />
                                            <span className="font-bold text-zinc-700 text-sm">About</span>
                                        </div>
                                        <p className="font-medium text-zinc-600 leading-relaxed text-sm">{ref.profile_bio}</p>
                                    </div>
                                ) : (
                                    <div className="bg-zinc-50 rounded-xl p-4 border border-dashed border-zinc-200 text-center">
                                        <p className="font-medium text-zinc-400 text-sm">No bio added yet.</p>
                                    </div>
                                )}
                            </div>

                            {detail.message && (
                                <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                                        <span className="font-bold text-zinc-700 text-sm">Their intro message</span>
                                    </div>
                                    <p className="font-medium text-zinc-600 leading-relaxed italic text-sm">
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
