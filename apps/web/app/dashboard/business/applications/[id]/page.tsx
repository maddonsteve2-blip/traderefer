"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft, Star, MapPin, Briefcase, TrendingUp,
    CheckCircle, XCircle, MessageSquare, Clock, AlertTriangle, User
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Referrer {
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
}

interface ApplicationDetail {
    id: string;
    status: "pending" | "approved" | "rejected" | "expired";
    message: string | null;
    applied_at: string;
    reminder_count: number;
    referrer: Referrer;
}

function fmtDate(d: string) {
    return new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

export default function BusinessApplicationDetailPage() {
    const { getToken, isLoaded } = useAuth();
    const params = useParams();
    const router = useRouter();
    const applicationId = params.id as string;

    const [app, setApp] = useState<ApplicationDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState<"approving" | "rejecting" | null>(null);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    const fetchApp = useCallback(async () => {
        const token = await getToken();
        const res = await fetch(`${apiUrl}/applications/business/${applicationId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) { router.push("/dashboard/business/applications"); return; }
        setApp(await res.json());
        setLoading(false);
    }, [getToken, applicationId, apiUrl, router]);

    useEffect(() => { if (isLoaded) fetchApp(); }, [isLoaded, fetchApp]);

    const handleApprove = async () => {
        setActing("approving");
        const token = await getToken();
        const res = await fetch(`${apiUrl}/applications/business/${applicationId}/approve`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });
        setActing(null);
        if (res.ok) {
            toast.success(`${app?.referrer.full_name} has been approved!`);
            router.push("/dashboard/business/applications");
        } else {
            const err = await res.json().catch(() => ({}));
            toast.error(err.detail || "Something went wrong.");
        }
    };

    const handleReject = async () => {
        setActing("rejecting");
        const token = await getToken();
        const res = await fetch(`${apiUrl}/applications/business/${applicationId}/reject`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });
        setActing(null);
        if (res.ok) {
            toast.success("Application rejected. The referrer has been notified.");
            router.push("/dashboard/business/applications");
        } else {
            toast.error("Something went wrong.");
        }
    };

    const handleMessage = async () => {
        if (!app) return;
        const token = await getToken();
        const res = await fetch(`${apiUrl}/messages/conversations/start/${app.referrer.id}`, {
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

    if (loading || !app) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-[3px] border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const ref = app.referrer;
    const initials = ref.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
    const isPending = app.status === "pending";
    const memberYear = ref.member_since ? new Date(ref.member_since).getFullYear() : null;

    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="w-full px-6 py-6 max-w-4xl mx-auto">

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <Link href="/dashboard/business/applications" className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-700 transition-colors font-bold" style={{ fontSize: '16px' }}>
                        <ArrowLeft className="w-4 h-4" /> Applications
                    </Link>
                    <span className="text-zinc-300">/</span>
                    <span className="text-zinc-700 font-bold truncate max-w-[200px]" style={{ fontSize: '16px' }}>{ref.full_name}</span>
                </div>

                {/* Reminder banner */}
                {isPending && app.reminder_count > 0 && (
                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-black text-amber-800" style={{ fontSize: '16px' }}>
                                Reminder {app.reminder_count}/3 — please action this application
                            </p>
                            <p className="font-medium text-amber-600" style={{ fontSize: '15px' }}>
                                If no action is taken, this application will auto-expire after 72 hours from submission.
                            </p>
                        </div>
                    </div>
                )}

                {/* Status badge (for non-pending) */}
                {!isPending && (
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold mb-5 ${
                        app.status === "approved" ? "bg-green-50 text-green-700 border border-green-200" :
                        app.status === "rejected" ? "bg-red-50 text-red-700 border border-red-200" :
                        "bg-zinc-50 text-zinc-500 border border-zinc-200"
                    }`} style={{ fontSize: '16px' }}>
                        {app.status === "approved" ? <CheckCircle className="w-4 h-4" /> :
                         app.status === "rejected" ? <XCircle className="w-4 h-4" /> :
                         <AlertTriangle className="w-4 h-4" />}
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                    {/* ── REFERRER PROFILE CARD (sales page) ── */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* Hero card */}
                        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                            <div className="flex items-start gap-4 mb-5">
                                <div className="w-20 h-20 rounded-2xl bg-orange-100 flex items-center justify-center font-black text-orange-600 shrink-0 overflow-hidden" style={{ fontSize: '26px' }}>
                                    {ref.profile_photo_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={ref.profile_photo_url} alt="" className="w-full h-full object-cover" />
                                    ) : initials}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h1 className="font-black text-zinc-900 leading-tight" style={{ fontSize: '26px' }}>{ref.full_name}</h1>
                                    {ref.tagline && (
                                        <p className="font-medium text-zinc-500 mt-1 leading-snug" style={{ fontSize: '17px' }}>
                                            {ref.tagline}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                                        {(ref.suburb || ref.state) && (
                                            <span className="flex items-center gap-1 text-zinc-400 font-medium" style={{ fontSize: '15px' }}>
                                                <MapPin className="w-4 h-4" />{ref.suburb}{ref.state ? `, ${ref.state}` : ""}
                                            </span>
                                        )}
                                        {memberYear && (
                                            <span className="flex items-center gap-1 text-zinc-400 font-medium" style={{ fontSize: '15px' }}>
                                                <Briefcase className="w-4 h-4" />Member since {memberYear}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Stats strip */}
                            <div className="grid grid-cols-3 gap-3 mb-5">
                                {[
                                    { label: "Quality Score", value: ref.quality_score, icon: Star, bg: "bg-amber-50", text: "text-amber-500" },
                                    { label: "Confirmed Leads", value: ref.confirmed_referrals, icon: TrendingUp, bg: "bg-emerald-50", text: "text-emerald-600" },
                                    { label: "Businesses", value: ref.businesses_linked, icon: Briefcase, bg: "bg-blue-50", text: "text-blue-600" },
                                ].map(s => (
                                    <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
                                        <s.icon className={`w-5 h-5 ${s.text} mx-auto mb-1`} />
                                        <p className="font-black text-zinc-900" style={{ fontSize: '24px' }}>{s.value}</p>
                                        <p className="font-bold text-zinc-500 leading-tight" style={{ fontSize: '13px' }}>{s.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Bio */}
                            {ref.profile_bio ? (
                                <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <User className="w-4 h-4 text-orange-500" />
                                        <span className="font-black text-zinc-700" style={{ fontSize: '16px' }}>About this referrer</span>
                                    </div>
                                    <p className="font-medium text-zinc-700 leading-relaxed" style={{ fontSize: '17px', lineHeight: 1.65 }}>
                                        {ref.profile_bio}
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-zinc-50 rounded-xl p-4 border border-dashed border-zinc-200 text-center">
                                    <p className="font-medium text-zinc-400" style={{ fontSize: '16px' }}>This referrer hasn&apos;t added a bio yet.</p>
                                </div>
                            )}
                        </div>

                        {/* Intro message */}
                        {app.message && (
                            <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
                                <p className="font-black text-zinc-700 mb-2" style={{ fontSize: '16px' }}>Their intro message</p>
                                <p className="font-medium text-zinc-600 leading-relaxed italic" style={{ fontSize: '17px', lineHeight: 1.65 }}>
                                    &ldquo;{app.message}&rdquo;
                                </p>
                            </div>
                        )}
                    </div>

                    {/* ── STICKY ACTION PANEL ── */}
                    <div className="lg:sticky lg:top-24 self-start space-y-4">
                        <div className="bg-white rounded-2xl border-2 border-zinc-200 overflow-hidden shadow-xl">
                            <div className="bg-zinc-900 px-5 py-4">
                                <p className="font-black text-zinc-400 uppercase tracking-widest" style={{ fontSize: '13px' }}>Application</p>
                                <p className="font-bold text-white mt-0.5" style={{ fontSize: '16px' }}>Applied {fmtDate(app.applied_at)}</p>
                                {isPending && (
                                    <div className="flex items-center gap-1.5 mt-2">
                                        <Clock className="w-4 h-4 text-amber-400" />
                                        <span className="font-bold text-amber-400" style={{ fontSize: '14px' }}>Awaiting your decision</span>
                                    </div>
                                )}
                            </div>

                            <div className="p-5 space-y-3">
                                {isPending ? (
                                    <>
                                        <button
                                            onClick={handleApprove}
                                            disabled={acting !== null}
                                            className="w-full flex items-center justify-center gap-2 h-12 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white rounded-xl font-black transition-all"
                                            style={{ fontSize: '17px' }}
                                        >
                                            {acting === "approving" ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <><CheckCircle className="w-5 h-5" /> Approve</>
                                            )}
                                        </button>

                                        <button
                                            onClick={handleMessage}
                                            className="w-full flex items-center justify-center gap-2 h-11 bg-zinc-50 hover:bg-blue-50 border border-zinc-200 hover:border-blue-200 text-zinc-700 hover:text-blue-700 rounded-xl font-bold transition-all"
                                            style={{ fontSize: '16px' }}
                                        >
                                            <MessageSquare className="w-4 h-4" /> Open Discussion
                                        </button>

                                        <button
                                            onClick={handleReject}
                                            disabled={acting !== null}
                                            className="w-full flex items-center justify-center gap-2 h-11 bg-zinc-50 hover:bg-red-50 border border-zinc-200 hover:border-red-200 text-zinc-500 hover:text-red-600 rounded-xl font-bold transition-all disabled:opacity-60"
                                            style={{ fontSize: '16px' }}
                                        >
                                            {acting === "rejecting" ? (
                                                <div className="w-4 h-4 border-2 border-zinc-300 border-t-red-500 rounded-full animate-spin" />
                                            ) : (
                                                <><XCircle className="w-4 h-4" /> Decline</>
                                            )}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        {app.status === "approved" && (
                                            <button
                                                onClick={handleMessage}
                                                className="w-full flex items-center justify-center gap-2 h-11 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold transition-all"
                                                style={{ fontSize: '16px' }}
                                            >
                                                <MessageSquare className="w-4 h-4" /> Message {ref.full_name.split(" ")[0]}
                                            </button>
                                        )}
                                        <Link
                                            href="/dashboard/business/applications"
                                            className="flex items-center justify-center gap-2 w-full py-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl font-bold text-zinc-600 transition-all"
                                            style={{ fontSize: '16px' }}
                                        >
                                            ← Back to Applications
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>

                        <p className="text-center text-zinc-400 font-medium" style={{ fontSize: '13px' }}>
                            Only you can see this referrer&apos;s application.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
