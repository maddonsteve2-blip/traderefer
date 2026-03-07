"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Users, Star, CheckCircle2, Clock, XCircle, MessageSquare,
    TrendingUp, Target, Award, Calendar, MapPin, ChevronRight,
    UserCheck, UserX, Briefcase, Shield, Zap
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
    referrer_suburb: string | null;
    referrer_state: string | null;
    quality_score: number;
    profile_photo_url: string | null;
    tagline: string | null;
}

interface ApplicationDetail extends Application {
    referrer: {
        id: string;
        full_name: string;
        suburb: string | null;
        state: string | null;
        quality_score: number;
        profile_bio: string | null;
        tagline: string | null;
        profile_photo_url: string | null;
        member_since: string | null;
        businesses_linked: number;
        confirmed_referrals: number;
    };
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const statusConfig = {
    pending: { label: "Awaiting Approval", color: "bg-amber-100 text-amber-700", icon: Clock },
    approved: { label: "Active Partner", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
    rejected: { label: "Declined", color: "bg-zinc-100 text-zinc-500", icon: XCircle },
    expired: { label: "Expired", color: "bg-red-50 text-red-400", icon: XCircle },
};

export default function ReferralForceHub() {
    const { getToken } = useAuth();
    const router = useRouter();
    const [applications, setApplications] = useState<Application[]>([]);
    const [selected, setSelected] = useState<ApplicationDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<"approve" | "reject" | null>(null);
    const [fadeOut, setFadeOut] = useState(false);

    const fetchApplications = useCallback(async () => {
        const token = await getToken();
        const res = await fetch(`${API}/applications/business/pending`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            const data = await res.json();
            setApplications(data.applications);
            // Auto-select first if none selected
            if (data.applications.length > 0 && !selected) {
                loadDetail(data.applications[0].id);
            }
        }
        setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getToken]);

    const loadDetail = async (appId: string) => {
        setDetailLoading(true);
        const token = await getToken();
        const res = await fetch(`${API}/applications/business/${appId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            const data = await res.json();
            setSelected({ ...data, id: appId });
        }
        setDetailLoading(false);
    };

    useEffect(() => { fetchApplications(); }, [fetchApplications]);

    const handleAction = async (action: "approve" | "reject") => {
        if (!selected) return;
        setActionLoading(action);
        const token = await getToken();
        const res = await fetch(`${API}/applications/business/${selected.id}/${action}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            setFadeOut(true);
            setTimeout(async () => {
                setFadeOut(false);
                setSelected(null);
                await fetchApplications();
            }, 320);
        }
        setActionLoading(null);
    };

    const pending = applications.filter((a) => a.status === "pending");
    const active = applications.filter((a) => a.status === "approved");
    const others = applications.filter((a) => a.status !== "pending" && a.status !== "approved");

    const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });

    if (loading) {
        return (
            <div className="h-[calc(100vh-72px)] md:h-[calc(100vh-100px)] flex items-center justify-center bg-zinc-50">
                <div className="text-zinc-400 font-medium animate-pulse">Loading Referral Force…</div>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-72px)] md:h-[calc(100vh-100px)] bg-zinc-50 overflow-hidden">

            {/* ── LEFT SIDEBAR ── */}
            <aside className="w-72 shrink-0 bg-white border-r border-zinc-100 flex flex-col overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-zinc-100">
                    <h1 className="text-lg font-black text-zinc-900">Referral Force</h1>
                    <p className="text-xs text-zinc-400 font-medium mt-0.5">
                        {pending.length} pending · {active.length} active
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto py-2">
                    {/* Pending */}
                    {pending.length > 0 && (
                        <div>
                            <p className="px-5 pt-3 pb-1 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                Awaiting Approval
                            </p>
                            {pending.map((app) => (
                                <ReferrerCard
                                    key={app.id}
                                    app={app}
                                    isSelected={selected?.id === app.id}
                                    onClick={() => loadDetail(app.id)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Active */}
                    {active.length > 0 && (
                        <div>
                            <p className="px-5 pt-4 pb-1 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                Active Partners
                            </p>
                            {active.map((app) => (
                                <ReferrerCard
                                    key={app.id}
                                    app={app}
                                    isSelected={selected?.id === app.id}
                                    onClick={() => loadDetail(app.id)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Others */}
                    {others.length > 0 && (
                        <div>
                            <p className="px-5 pt-4 pb-1 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                Past Applications
                            </p>
                            {others.map((app) => (
                                <ReferrerCard
                                    key={app.id}
                                    app={app}
                                    isSelected={selected?.id === app.id}
                                    onClick={() => loadDetail(app.id)}
                                />
                            ))}
                        </div>
                    )}

                    {applications.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-48 text-center px-5">
                            <Users className="w-10 h-10 text-zinc-200 mb-3" />
                            <p className="text-sm font-bold text-zinc-400">No applications yet</p>
                            <p className="text-xs text-zinc-300 mt-1">Referrers who apply to your business will appear here</p>
                        </div>
                    )}
                </div>
            </aside>

            {/* ── MAIN STAGE ── */}
            <main className="flex-1 overflow-y-auto">
                {!selected && !detailLoading && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                        <div className="w-20 h-20 bg-zinc-100 rounded-3xl flex items-center justify-center mb-6">
                            <Users className="w-10 h-10 text-zinc-300" />
                        </div>
                        <h2 className="text-2xl font-black text-zinc-900 mb-2">Select a Referrer</h2>
                        <p className="text-zinc-400 font-medium max-w-sm">
                            Click a name in the sidebar to review their profile and take action.
                        </p>
                    </div>
                )}

                {detailLoading && (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-zinc-400 font-medium animate-pulse">Loading profile…</div>
                    </div>
                )}

                {selected && !detailLoading && (
                    <div
                        className="transition-opacity duration-300"
                        style={{ opacity: fadeOut ? 0 : 1 }}
                    >
                        {/* Action bar — always sticky at top */}
                        {selected.status === "pending" && (
                            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-zinc-100 px-8 py-4 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs font-black text-amber-600 uppercase tracking-widest mb-0.5">Pending Application</p>
                                    <p className="text-sm text-zinc-500 font-medium">
                                        Applied {fmtDate(selected.applied_at)} · {selected.reminder_count} reminder{selected.reminder_count !== 1 ? "s" : ""} sent
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleAction("reject")}
                                        disabled={!!actionLoading}
                                        className="px-5 py-2.5 rounded-xl border-2 border-zinc-200 text-zinc-600 font-bold hover:border-red-200 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
                                    >
                                        {actionLoading === "reject" ? "Declining…" : "Decline"}
                                    </button>
                                    <button
                                        onClick={() => handleAction("approve")}
                                        disabled={!!actionLoading}
                                        className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black transition-all shadow-lg shadow-orange-200 disabled:opacity-50 text-base"
                                    >
                                        <UserCheck className="w-5 h-5" />
                                        {actionLoading === "approve" ? "Approving…" : "Approve Partner"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {selected.status === "approved" && (
                            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-zinc-100 px-8 py-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                    <span className="font-black text-emerald-700 text-sm">Active Partner</span>
                                </div>
                                <button
                                    onClick={async () => {
                                        const token = await getToken();
                                        const res = await fetch(`${API}/messages/conversations/start/${selected.referrer.id}`, {
                                            method: "POST",
                                            headers: { Authorization: `Bearer ${token}` },
                                        });
                                        if (res.ok) {
                                            const data = await res.json();
                                            router.push(`/dashboard/business/messages?conv=${data.conversation_id}`);
                                        }
                                    }}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-zinc-900 hover:bg-black text-white font-black transition-all text-sm"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    Message Partner
                                </button>
                            </div>
                        )}

                        {/* Referrer Profile — Executive Resume */}
                        <div className="p-8 max-w-3xl">

                            {/* Header */}
                            <div className="flex items-start gap-6 mb-8">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center text-white text-2xl font-black shrink-0 overflow-hidden shadow-lg">
                                    {selected.referrer.profile_photo_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={selected.referrer.profile_photo_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        selected.referrer.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-3xl font-black text-zinc-900 mb-1">{selected.referrer.full_name}</h2>
                                    {selected.referrer.tagline && (
                                        <p className="text-base font-bold text-orange-600 mb-2">{selected.referrer.tagline}</p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-3">
                                        {(selected.referrer.suburb || selected.referrer.state) && (
                                            <span className="flex items-center gap-1 text-sm text-zinc-500 font-medium">
                                                <MapPin className="w-3.5 h-3.5" />
                                                {[selected.referrer.suburb, selected.referrer.state].filter(Boolean).join(", ")}
                                            </span>
                                        )}
                                        {selected.referrer.member_since && (
                                            <span className="flex items-center gap-1 text-sm text-zinc-400 font-medium">
                                                <Calendar className="w-3.5 h-3.5" />
                                                Member since {selected.referrer.member_since}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 shrink-0">
                                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                                    <span className="text-xl font-black text-amber-700">{selected.referrer.quality_score}</span>
                                    <span className="text-xs text-amber-500 font-bold">/100</span>
                                </div>
                            </div>

                            {/* Stats row */}
                            <div className="grid grid-cols-3 gap-4 mb-8">
                                {[
                                    { icon: Briefcase, label: "Businesses Linked", value: selected.referrer.businesses_linked, color: "text-blue-600", bg: "bg-blue-50" },
                                    { icon: Target, label: "Confirmed Referrals", value: selected.referrer.confirmed_referrals, color: "text-emerald-600", bg: "bg-emerald-50" },
                                    { icon: Shield, label: "Quality Score", value: `${selected.referrer.quality_score}/100`, color: "text-amber-600", bg: "bg-amber-50" },
                                ].map(({ icon: Icon, label, value, color, bg }) => (
                                    <div key={label} className={`${bg} rounded-2xl p-5 border border-white`}>
                                        <div className={`w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-3 shadow-sm`}>
                                            <Icon className={`w-5 h-5 ${color}`} />
                                        </div>
                                        <p className="text-2xl font-black text-zinc-900">{value}</p>
                                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mt-1">{label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Intro message */}
                            {selected.message && (
                                <div className="mb-8">
                                    <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-3">Application Message</h3>
                                    <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-6">
                                        <p className="text-zinc-700 font-medium leading-relaxed italic">
                                            &ldquo;{selected.message}&rdquo;
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Bio */}
                            {selected.referrer.profile_bio && (
                                <div className="mb-8">
                                    <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-3">About</h3>
                                    <div className="bg-white border border-zinc-100 rounded-2xl p-6">
                                        <p className="text-zinc-700 font-medium leading-relaxed">{selected.referrer.profile_bio}</p>
                                    </div>
                                </div>
                            )}

                            {/* Why approve panel */}
                            {selected.status === "pending" && (
                                <div className="bg-zinc-900 rounded-2xl p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Zap className="w-5 h-5 text-orange-400" />
                                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Why Approve?</h3>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        {[
                                            "Approved referrers get your unique link and can start sending leads immediately",
                                            "You only pay when a lead converts — zero risk, zero upfront cost",
                                            "Prezzee Smart Cards handle all reward payouts automatically",
                                        ].map((point) => (
                                            <div key={point} className="flex items-start gap-3">
                                                <ChevronRight className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                                                <p className="text-sm text-zinc-300 font-medium">{point}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Active partner extra — full referrer link */}
                            {selected.status === "approved" && (
                                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                                        <h3 className="text-sm font-black text-emerald-800 uppercase tracking-widest">Active Partner</h3>
                                    </div>
                                    <p className="text-sm text-emerald-700 font-medium mb-4">
                                        This partner has access to your referral link and can send you verified leads.
                                    </p>
                                    <Link
                                        href={`/dashboard/business/referrers/${selected.referrer.id}`}
                                        className="inline-flex items-center gap-2 text-sm font-black text-emerald-700 hover:text-emerald-900 transition-colors"
                                    >
                                        View Full Performance Stats <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

function ReferrerCard({ app, isSelected, onClick }: { app: Application; isSelected: boolean; onClick: () => void }) {
    const cfg = statusConfig[app.status] ?? statusConfig.expired;
    const StatusIcon = cfg.icon;
    const initials = app.referrer_name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() ?? "?";

    return (
        <button
            onClick={onClick}
            className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-all hover:bg-zinc-50 ${isSelected ? "bg-orange-50 border-r-2 border-orange-500" : ""}`}
        >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black shrink-0 overflow-hidden ${isSelected ? "bg-orange-500 text-white" : "bg-zinc-100 text-zinc-500"}`}>
                {app.profile_photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={app.profile_photo_url} alt="" className="w-full h-full object-cover" />
                ) : initials}
            </div>
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold truncate ${isSelected ? "text-orange-700" : "text-zinc-800"}`}>{app.referrer_name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <StatusIcon className="w-3 h-3 shrink-0" style={{ color: app.status === "pending" ? "#d97706" : app.status === "approved" ? "#059669" : "#9ca3af" }} />
                    <span className="text-[11px] text-zinc-400 font-medium truncate">{cfg.label}</span>
                </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="text-xs font-bold text-zinc-500">{app.quality_score}</span>
            </div>
        </button>
    );
}
