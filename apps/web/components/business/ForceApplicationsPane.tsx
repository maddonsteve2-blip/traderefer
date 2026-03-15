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
    const [filter, setFilter] = useState<"pending" | "all">("pending");
    const [pendingCount, setPendingCount] = useState(0);
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
    const displayed = filter === "pending" ? apps.filter(a => PENDING_STATUSES.includes((a.status ?? "").toLowerCase())) : apps;

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
                    {(["pending", "all"] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl font-black uppercase tracking-widest transition-all text-[19px] ${filter === f ? "bg-orange-500 text-white shadow-lg" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"}`}
                        >
                            {f === "pending" ? `${f} (${pendingCount})` : f}
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
                        <p className="font-bold text-zinc-500 text-2xl">
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
                                        <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center font-black text-orange-600 shrink-0 overflow-hidden text-2xl">
                                            {app.profile_photo_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={app.profile_photo_url} alt="" className="w-full h-full object-cover" />
                                            ) : initials}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-zinc-900 line-clamp-2 uppercase tracking-tight text-[18px] leading-snug">{app.referrer_name}</p>
                                            <p className="font-black text-zinc-400 uppercase tracking-widest mt-1 text-[15px]">
                                                {app.referrer_suburb}{app.referrer_state ? `, ${app.referrer_state}` : ""} · ⭐ {app.quality_score}
                                            </p>
                                        </div>
                                        <span className={`shrink-0 px-2 py-1 rounded-xl font-black uppercase tracking-widest ${cfg.bg} ${cfg.text} text-[19px]`}>
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
                        <p className="font-black text-zinc-400 text-3xl">Select an application</p>
                        <p className="text-zinc-400 font-medium mt-1 text-2xl">Click a name on the left to review their profile</p>
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
                                        <span className="font-black text-white uppercase tracking-widest text-[22px]">Applied {fmtDate(detail.applied_at)}</span>
                                        {detail.reminder_count > 0 && (
                                            <span className="text-amber-400 font-black uppercase text-[19px]">· Reminder {detail.reminder_count}/3</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleMessage}
                                            className="flex items-center gap-1.5 h-12 px-5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all text-xl"
                                        >
                                            <MessageSquare className="w-5 h-5" /> Message
                                        </button>
                                        <button
                                            onClick={handleReject}
                                            disabled={acting !== null}
                                            className="flex items-center gap-1.5 h-12 px-5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl font-bold transition-all disabled:opacity-50 text-xl"
                                        >
                                            {acting === "rejecting" ? <div className="w-5 h-5 border-2 border-red-300/30 border-t-red-300 rounded-full animate-spin" /> : <><XCircle className="w-5 h-5" /> Decline</>}
                                        </button>
                                        <button
                                            onClick={handleApprove}
                                            disabled={acting !== null}
                                            className="flex items-center gap-1.5 h-12 px-6 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black transition-all disabled:opacity-50 text-2xl"
                                        >
                                            {acting === "approving" ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckCircle className="w-5 h-5" /> Approve</>}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {!isPending && (
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold mb-5 ${
                                    detail.status === "approved" ? "bg-green-50 text-green-700 border border-green-200" :
                                    detail.status === "rejected" ? "bg-red-50 text-red-700 border border-red-200" :
                                    "bg-zinc-50 text-zinc-500 border border-zinc-200"
                                } text-[22px]`}>
                                    {detail.status === "approved" ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                    {detail.status.charAt(0).toUpperCase() + detail.status.slice(1)}
                                </div>
                            )}

                            {/* Hero card */}
                            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm mb-4">
                                <div className="flex items-start gap-4 mb-5">
                                    <div className="w-20 h-20 rounded-2xl bg-orange-100 flex items-center justify-center font-black text-orange-600 shrink-0 overflow-hidden text-3xl">
                                        {ref.profile_photo_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={ref.profile_photo_url} alt="" className="w-full h-full object-cover" />
                                        ) : initials}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="font-black text-zinc-900 leading-tight uppercase tracking-tighter text-[38px]">{ref.full_name}</h2>
                                        {ref.tagline && <p className="font-bold text-zinc-500 mt-1 tracking-tight text-2xl">{ref.tagline}</p>}
                                        <div className="flex items-center gap-4 mt-3 flex-wrap">
                                            {(ref.suburb || ref.state) && (
                                                <span className="flex items-center gap-1.5 text-zinc-400 font-black uppercase tracking-widest text-[19px]">
                                                    <MapPin className="w-4 h-4" />{ref.suburb}{ref.state ? `, ${ref.state}` : ""}
                                                </span>
                                            )}
                                            {memberYear && (
                                                <span className="flex items-center gap-1.5 text-zinc-400 font-black uppercase tracking-widest text-[19px]">
                                                    <Briefcase className="w-4 h-4" />Member since {memberYear}
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
                                            <p className="font-black text-zinc-900 tracking-tighter text-[42px]">{s.value}</p>
                                            <p className="font-black text-zinc-400 uppercase tracking-widest text-[21px]">{s.label}</p>
                                        </div>
                                    ))}
                                </div>

                                {ref.profile_bio ? (
                                    <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <User className="w-5 h-5 text-orange-500" />
                                            <span className="font-black text-zinc-700 text-2xl">About</span>
                                        </div>
                                        <p className="font-medium text-zinc-700 leading-relaxed text-2xl">{ref.profile_bio}</p>
                                    </div>
                                ) : (
                                    <div className="bg-zinc-50 rounded-xl p-4 border border-dashed border-zinc-200 text-center">
                                        <p className="font-medium text-zinc-400 text-2xl">No bio added yet.</p>
                                    </div>
                                )}
                            </div>

                            {detail.message && (
                                <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                                        <span className="font-black text-zinc-700 text-2xl">Their intro message</span>
                                    </div>
                                    <p className="font-medium text-zinc-600 leading-relaxed italic text-2xl">
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
