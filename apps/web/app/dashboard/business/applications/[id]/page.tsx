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
import { PageTransition } from "@/components/ui/PageTransition";

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
    const apiUrl = "/api/backend";

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
            <PageTransition className="min-h-[100dvh] bg-zinc-50">
                <div className="p-6 space-y-5 max-w-3xl mx-auto pt-10">
                    <div className="h-5 w-24 bg-zinc-200 rounded-lg animate-pulse" />
                    <div className="bg-white rounded-2xl border border-zinc-200 p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 bg-zinc-100 rounded-2xl animate-pulse" />
                            <div className="space-y-2 flex-1">
                                <div className="h-5 w-44 bg-zinc-100 rounded-lg animate-pulse" />
                                <div className="h-3 w-28 bg-zinc-50 rounded animate-pulse" />
                            </div>
                        </div>
                        <div className="space-y-3">
                            {[1,2,3].map(i => <div key={i} className="h-12 bg-zinc-50 rounded-xl animate-pulse" />)}
                        </div>
                    </div>
                </div>
            </PageTransition>
        );
    }

    const ref = app.referrer;
    const initials = ref.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
    const isPending = app.status === "pending";
    const memberYear = ref.member_since ? new Date(ref.member_since).getFullYear() : null;

    return (
        <div className="min-h-[100dvh] bg-zinc-50">
            <div className="w-full px-4 md:px-6 py-4 md:py-6 max-w-4xl mx-auto">

                {/* Header */}
                <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-6">
                    <Link href="/dashboard/business/applications" className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-700 transition-colors font-bold text-base md:text-xl">
                        <ArrowLeft className="w-5 h-5" /> Applications
                    </Link>
                    <span className="text-zinc-300">/</span>
                    <span className="text-zinc-700 font-bold truncate max-w-full sm:max-w-[200px] text-base md:text-xl">{ref.full_name}</span>
                </div>

                {/* Reminder banner */}
                {isPending && app.reminder_count > 0 && (
                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-6">
                        <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-black text-amber-800 text-base md:text-xl">
                                Reminder {app.reminder_count}/3 — please action this application
                            </p>
                            <p className="font-medium text-amber-600 text-sm md:text-lg">
                                If no action is taken, this application will auto-expire after 72 hours from submission.
                            </p>
                        </div>
                    </div>
                )}

                {/* Status bar (for non-pending) */}
                {!isPending && app.status === "rejected" && (
                    <div className="bg-zinc-700 rounded-2xl px-5 py-3 mb-6 flex flex-wrap items-center justify-between gap-3">
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
                                onClick={handleApprove}
                                disabled={acting !== null}
                                className="flex items-center gap-1.5 h-9 px-5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-black transition-all disabled:opacity-50 text-sm"
                            >
                                {acting === "approving" ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Reconsider</>}
                            </button>
                        </div>
                    </div>
                )}
                {!isPending && app.status === "approved" && (
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold mb-6 bg-green-50 text-green-700 border border-green-200">
                        <CheckCircle className="w-5 h-5" /> Approved
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                    {/* ── REFERRER PROFILE CARD (sales page) ── */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* Hero card */}
                        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                            <div className="flex flex-col sm:flex-row items-start gap-4 mb-5">
                                <div className="w-20 h-20 rounded-2xl bg-orange-100 flex items-center justify-center font-black text-orange-600 shrink-0 overflow-hidden" style={{ fontSize: '30px' }}>
                                    {ref.profile_photo_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={ref.profile_photo_url} alt="" className="w-full h-full object-cover" />
                                    ) : initials}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h1 className="font-black text-zinc-900 leading-tight text-2xl md:text-4xl">{ref.full_name}</h1>
                                    {ref.tagline && (
                                        <p className="font-medium text-zinc-500 mt-1 leading-snug text-base md:text-xl">
                                            {ref.tagline}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                                        {(ref.suburb || ref.state) && (
                                            <span className="flex items-center gap-1.5 text-zinc-400 font-medium text-sm md:text-lg">
                                                <MapPin className="w-4 h-4" />{ref.suburb}{ref.state ? `, ${ref.state}` : ""}
                                            </span>
                                        )}
                                        {memberYear && (
                                            <span className="flex items-center gap-1.5 text-zinc-400 font-medium text-sm md:text-lg">
                                                <Briefcase className="w-4 h-4" />Member since {memberYear}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Stats strip */}
                            <div className="grid grid-cols-3 gap-3 mb-5">
                                {[
                                    { label: "Quality Score", value: `${ref.quality_score}/100`, icon: Star, bg: "bg-amber-50", text: "text-amber-500" },
                                    { label: "Confirmed Leads", value: ref.confirmed_referrals, icon: TrendingUp, bg: "bg-emerald-50", text: "text-emerald-600" },
                                    { label: "Businesses", value: ref.businesses_linked, icon: Briefcase, bg: "bg-orange-50", text: "text-orange-500" },
                                ].map(s => (
                                    <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
                                        <s.icon className={`w-6 h-6 ${s.text} mx-auto mb-1`} />
                                        <p className="font-black text-zinc-900 text-3xl md:text-4xl">{s.value}</p>
                                        <p className="font-bold text-zinc-500 leading-tight text-xs md:text-base">{s.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Bio */}
                            {ref.profile_bio ? (
                                <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <User className="w-5 h-5 text-orange-500" />
                                        <span className="font-black text-zinc-700 text-base md:text-xl">About this referrer</span>
                                    </div>
                                    <p className="font-medium text-zinc-700 leading-relaxed text-sm md:text-xl">
                                        {ref.profile_bio}
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-zinc-50 rounded-xl p-4 border border-dashed border-zinc-200 text-center">
                                    <p className="font-medium text-zinc-400 text-sm md:text-xl">This referrer hasn&apos;t added a bio yet.</p>
                                </div>
                            )}
                        </div>

                        {/* Intro message */}
                        {app.message && (
                            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                                <p className="font-black text-zinc-700 mb-2 text-base md:text-xl">Their intro message</p>
                                <p className="font-medium text-zinc-600 leading-relaxed italic text-sm md:text-xl">
                                    &ldquo;{app.message}&rdquo;
                                </p>
                            </div>
                        )}
                    </div>

                    {/* ── STICKY ACTION PANEL ── */}
                    <div className="lg:sticky lg:top-24 self-start space-y-4">
                        <div className="bg-white rounded-2xl border-2 border-zinc-200 overflow-hidden shadow-xl">
                            <div className="bg-orange-600 px-6 py-5">
                                <p className="font-black text-orange-200 uppercase tracking-widest text-xs md:text-base">Application</p>
                                <p className="font-bold text-white mt-0.5 text-sm md:text-xl">Applied {fmtDate(app.applied_at)}</p>
                                {isPending && (
                                    <div className="flex items-center gap-1.5 mt-2">
                                        <Clock className="w-5 h-5 text-white/70" />
                                        <span className="font-bold text-white/90 text-sm md:text-lg">Awaiting your decision</span>
                                    </div>
                                )}
                            </div>

                            <div className="p-5 space-y-3">
                                {isPending ? (
                                    <>
                                        <button
                                            onClick={handleApprove}
                                            disabled={acting !== null}
                                            className="w-full flex items-center justify-center gap-2 h-12 md:h-14 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white rounded-xl font-black transition-all text-base md:text-xl"
                                        >
                                            {acting === "approving" ? (
                                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <><CheckCircle className="w-6 h-6" /> Approve</>
                                            )}
                                        </button>

                                        <button
                                            onClick={handleMessage}
                                            className="w-full flex items-center justify-center gap-2 h-11 md:h-12 bg-zinc-50 hover:bg-blue-50 border border-zinc-200 hover:border-blue-200 text-zinc-700 hover:text-blue-700 rounded-xl font-bold transition-all text-sm md:text-xl"
                                        >
                                            <MessageSquare className="w-5 h-5" /> Open Discussion
                                        </button>

                                        <button
                                            onClick={handleReject}
                                            disabled={acting !== null}
                                            className="w-full flex items-center justify-center gap-2 h-11 md:h-12 bg-zinc-50 hover:bg-red-50 border border-zinc-200 hover:border-red-200 text-zinc-500 hover:text-red-600 rounded-xl font-bold transition-all disabled:opacity-60 text-sm md:text-xl"
                                        >
                                            {acting === "rejecting" ? (
                                                <div className="w-5 h-5 border-2 border-zinc-300 border-t-red-500 rounded-full animate-spin" />
                                            ) : (
                                                <><XCircle className="w-5 h-5" /> Decline</>
                                            )}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        {app.status === "approved" && (
                                            <button
                                                onClick={handleMessage}
                                                className="w-full flex items-center justify-center gap-2 h-11 md:h-12 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold transition-all text-sm md:text-xl"
                                            >
                                                <MessageSquare className="w-5 h-5" /> Message {ref.full_name.split(" ")[0]}
                                            </button>
                                        )}
                                        <Link
                                            href="/dashboard/business/applications"
                                            className="flex items-center justify-center gap-2 w-full py-3 md:py-4 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl font-bold text-zinc-600 transition-all text-sm md:text-xl"
                                        >
                                            ← Back to Applications
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>

                        <p className="text-center text-zinc-400 font-medium text-xs md:text-base">
                            Only you can see this referrer&apos;s application.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
