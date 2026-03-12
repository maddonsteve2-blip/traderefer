"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Users, Search, TrendingUp, DollarSign, Target,
    Star, MessageSquare, Calendar, UserCheck,
    Phone, Mail, ExternalLink, Loader2, CheckCircle, Clock, BarChart3,
} from "lucide-react";
import { toast } from "sonner";

interface Referrer {
    referrer_id: string;
    full_name: string;
    email: string;
    quality_score: number;
    leads_created: number;
    confirmed_jobs: number;
    total_earned_cents: number;
    effective_fee_cents: number;
    custom_fee_cents: number | null;
    is_active: boolean;
    last_lead_at: string | null;
    linked_since: string | null;
}

interface ReferrerFullDetail {
    referrer_id: string;
    full_name: string;
    email: string;
    phone: string | null;
    quality_score: number;
    referrer_since: string | null;
    linked_since: string | null;
    is_active: boolean;
    clicks: number;
    leads_created: number;
    leads_unlocked: number;
    confirmed_jobs: number;
    conversion_rate: number;
    total_earned_cents: number;
    total_bonus_cents: number;
    custom_fee_cents: number | null;
    effective_fee_cents: number;
    default_fee_cents: number;
    business_notes: string | null;
}

interface Summary {
    total_referrers: number;
    total_leads: number;
    total_confirmed: number;
    total_paid_cents: number;
    default_fee_cents: number;
}

function fmtDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}
function fmt(cents: number) { return `$${(cents / 100).toFixed(2)}`; }
function timeAgo(d: string | null) {
    if (!d) return "No leads yet";
    const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 30) return `${days}d ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
}

export function ForcePartnersPane() {
    const { getToken, isLoaded } = useAuth();
    const router = useRouter();
    const [referrers, setReferrers] = useState<Referrer[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [detail, setDetail] = useState<ReferrerFullDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [customFee, setCustomFee] = useState<string>("");
    const [savingFee, setSavingFee] = useState(false);
    const [messaging, setMessaging] = useState(false);
    const apiUrl = "/api/backend";

    const fetchReferrers = useCallback(async () => {
        const token = await getToken();
        const params = new URLSearchParams({ sort_by: "leads_created", sort_dir: "desc" });
        if (search) params.set("search", search);
        const res = await fetch(`${apiUrl}/business/me/referrers?${params}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            const data = await res.json();
            setReferrers(data.referrers ?? []);
            setSummary(data.summary);
        }
        setLoading(false);
    }, [getToken, search, apiUrl]);

    const fetchDetail = useCallback(async (id: string) => {
        setDetailLoading(true);
        setDetail(null);
        const token = await getToken();
        const res = await fetch(`${apiUrl}/business/me/referrers/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            const data = await res.json();
            setDetail(data.referrer);
            setCustomFee(data.referrer.custom_fee_cents != null ? String(data.referrer.custom_fee_cents / 100) : "");
        }
        setDetailLoading(false);
    }, [getToken, apiUrl]);

    useEffect(() => { if (isLoaded) fetchReferrers(); }, [isLoaded, fetchReferrers]);

    useEffect(() => {
        if (selectedId) fetchDetail(selectedId);
    }, [selectedId, fetchDetail]);

    useEffect(() => {
        const update = () => setIsMobile(window.innerWidth < 768);
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    const selectedListItem = referrers.find(r => r.referrer_id === selectedId) ?? null;

    const handleMessage = async (referrerId: string) => {
        setMessaging(true);
        const token = await getToken();
        const res = await fetch(`${apiUrl}/messages/conversations/start/${referrerId}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });
        setMessaging(false);
        if (res.ok) {
            const data = await res.json();
            router.push(`/dashboard/business/messages?conv=${data.conversation_id}`);
        } else {
            toast.error("Could not start conversation.");
        }
    };

    const saveCustomFee = async (overrideCents?: number | null) => {
        if (!detail) return;
        setSavingFee(true);
        const cents = overrideCents !== undefined ? overrideCents : (customFee ? Math.round(parseFloat(customFee) * 100) : null);
        const token = await getToken();
        const res = await fetch(`${apiUrl}/business/me/referrers/${detail.referrer_id}/fee`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ custom_fee_cents: cents }),
        });
        setSavingFee(false);
        if (res.ok) {
            toast.success(overrideCents === null ? "Fee reset to default." : "Custom fee saved.");
            fetchReferrers();
            fetchDetail(detail.referrer_id);
        } else {
            toast.error("Failed to save fee.");
        }
    };

    const handleSelect = (referrerId: string) => {
        if (isMobile) {
            router.push(`/dashboard/business/referrers/${referrerId}`);
            return;
        }
        setSelectedId(prev => prev === referrerId ? null : referrerId);
    };

    return (
        <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* ── LEFT PANE (wider: 400px) ── */}
            <div className="w-full md:w-[400px] shrink-0 border-r border-zinc-200 overflow-y-auto bg-white flex flex-col">
                {/* Search */}
                <div className="sticky top-0 bg-white border-b border-zinc-100 px-4 py-3 z-10">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search partners…"
                            className="w-full pl-9 pr-3 h-9 bg-zinc-100 rounded-xl text-zinc-900 placeholder:text-zinc-400 font-medium outline-none focus:ring-2 focus:ring-orange-400"
                            style={{ fontSize: 15 }}
                        />
                    </div>
                </div>

                {/* Summary strip — 4 stats */}
                {summary && (
                    <div className="px-4 py-3 border-b border-zinc-100 grid grid-cols-4 gap-1">
                        {[
                            { label: "Partners", value: summary.total_referrers, color: "text-orange-600" },
                            { label: "Leads", value: summary.total_leads, color: "text-blue-600" },
                            { label: "Confirmed", value: summary.total_confirmed, color: "text-emerald-600" },
                            { label: "Paid Out", value: fmt(summary.total_paid_cents), color: "text-violet-600" },
                        ].map(s => (
                            <div key={s.label} className="text-center">
                                <p className={`font-black ${s.color} leading-none`} style={{ fontSize: 15 }}>{s.value}</p>
                                <p className="font-bold text-zinc-400 mt-0.5" style={{ fontSize: 10 }}>{s.label}</p>
                            </div>
                        ))}
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-16 flex-1">
                        <div className="w-8 h-8 border-[3px] border-orange-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : referrers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center flex-1">
                        <Users className="w-10 h-10 text-zinc-200 mb-3" />
                        <p className="font-bold text-zinc-400" style={{ fontSize: 16 }}>No active partners yet</p>
                        <p className="text-zinc-300 font-medium mt-1" style={{ fontSize: 14 }}>Approved applications appear here</p>
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-100 flex-1">
                        {referrers.map(r => {
                            const initials = r.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
                            const isSelected = selectedId === r.referrer_id;
                            return (
                                <button
                                    key={r.referrer_id}
                                    onClick={() => handleSelect(r.referrer_id)}
                                    className={`w-full text-left px-4 py-3.5 transition-colors ${isSelected ? "bg-orange-50 border-l-4 border-orange-500" : "hover:bg-zinc-50 border-l-4 border-transparent"}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center font-black text-orange-600 shrink-0" style={{ fontSize: 14 }}>
                                            {initials}
                                            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${r.is_active ? "bg-emerald-500" : "bg-zinc-300"}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-1">
                                                <p className="font-black text-zinc-900 truncate" style={{ fontSize: 15 }}>{r.full_name}</p>
                                                <span className="text-zinc-400 shrink-0" style={{ fontSize: 11 }}>{timeAgo(r.last_lead_at)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                <span className="text-zinc-500 font-medium" style={{ fontSize: 12 }}>{r.leads_created} leads</span>
                                                <span className="text-zinc-300">·</span>
                                                <span className="text-zinc-500 font-medium" style={{ fontSize: 12 }}>{r.confirmed_jobs} confirmed</span>
                                                <span className="text-zinc-300">·</span>
                                                <span className="text-amber-500 font-bold" style={{ fontSize: 12 }}>⭐ {r.quality_score}</span>
                                                <span className="text-zinc-300">·</span>
                                                <span className="text-violet-600 font-bold" style={{ fontSize: 12 }}>{fmt(r.total_earned_cents)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── RIGHT PANE — full detail ── */}
            <div className="hidden md:flex flex-1 overflow-y-auto bg-zinc-50">
                {!selectedId ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-8">
                        <UserCheck className="w-16 h-16 text-zinc-200 mb-4" />
                        <p className="font-black text-zinc-400" style={{ fontSize: 20 }}>Select a partner</p>
                        <p className="text-zinc-400 font-medium mt-1" style={{ fontSize: 16 }}>Click a partner on the left to view their profile</p>
                    </div>
                ) : detailLoading || !detail ? (
                    <div className="flex items-center justify-center w-full h-full">
                        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
                    </div>
                ) : (
                    <div className="w-full max-w-3xl mx-auto px-6 py-6 space-y-4">

                        {/* ── Hero card ── */}
                        <div className="bg-white rounded-2xl border border-zinc-100 p-6">
                            <div className="flex items-start gap-4 mb-5">
                                <div className="relative w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center font-black text-orange-600 shrink-0" style={{ fontSize: 22 }}>
                                    {detail.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                                    <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${detail.is_active ? "bg-emerald-500" : "bg-zinc-300"}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="font-black text-zinc-900 leading-tight" style={{ fontSize: 22 }}>{detail.full_name}</h2>
                                    <p className="text-zinc-400 font-medium mt-0.5" style={{ fontSize: 14 }}>
                                        Partner since {fmtDate(detail.linked_since)}
                                        {detail.referrer_since ? ` · Member since ${new Date(detail.referrer_since).getFullYear()}` : ""}
                                    </p>
                                    <span className={`mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${detail.is_active ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
                                        {detail.is_active ? <><CheckCircle className="w-3 h-3" /> Active</> : <><Clock className="w-3 h-3" /> Inactive</>}
                                    </span>
                                </div>
                                <Link
                                    href={`/dashboard/business/referrers/${detail.referrer_id}`}
                                    className="flex items-center gap-1.5 h-9 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 rounded-xl font-bold transition-all shrink-0"
                                    style={{ fontSize: 14 }}
                                >
                                    <ExternalLink className="w-4 h-4" /> Full Profile
                                </Link>
                            </div>

                            {/* Contact actions */}
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => handleMessage(detail.referrer_id)}
                                    disabled={messaging}
                                    className="flex items-center gap-2 h-10 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-all disabled:opacity-60"
                                    style={{ fontSize: 14 }}
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    {messaging ? "Opening…" : "Message"}
                                </button>
                                {detail.email && (
                                    <a
                                        href={`mailto:${detail.email}`}
                                        className="flex items-center gap-2 h-10 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold transition-all border border-blue-100"
                                        style={{ fontSize: 14 }}
                                    >
                                        <Mail className="w-4 h-4" /> {detail.email}
                                    </a>
                                )}
                                {detail.phone && (
                                    <a
                                        href={`tel:${detail.phone}`}
                                        className="flex items-center gap-2 h-10 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold transition-all border border-emerald-100"
                                        style={{ fontSize: 14 }}
                                    >
                                        <Phone className="w-4 h-4" /> {detail.phone}
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* ── 6-stat grid ── */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: "Total Leads", value: detail.leads_created, icon: Target, bg: "bg-orange-50", text: "text-orange-600" },
                                { label: "Confirmed Jobs", value: detail.confirmed_jobs, icon: TrendingUp, bg: "bg-emerald-50", text: "text-emerald-600" },
                                { label: "Conversion Rate", value: `${(detail.conversion_rate ?? 0).toFixed(0)}%`, icon: BarChart3, bg: "bg-blue-50", text: "text-blue-600" },
                                { label: "Total Earned", value: fmt(detail.total_earned_cents), icon: DollarSign, bg: "bg-violet-50", text: "text-violet-600" },
                                { label: "Leads Unlocked", value: detail.leads_unlocked, icon: CheckCircle, bg: "bg-amber-50", text: "text-amber-600" },
                                { label: "Quality Score", value: `${detail.quality_score}/100`, icon: Star, bg: "bg-yellow-50", text: "text-yellow-500" },
                            ].map(s => (
                                <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <s.icon className={`w-4 h-4 ${s.text}`} />
                                        <span className="font-bold text-zinc-500 uppercase tracking-wider" style={{ fontSize: 10 }}>{s.label}</span>
                                    </div>
                                    <p className="font-black text-zinc-900" style={{ fontSize: 24 }}>{s.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* ── Activity + fee row ── */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white rounded-2xl border border-zinc-100 p-5">
                                <div className="flex items-center gap-2 mb-1">
                                    <Calendar className="w-4 h-4 text-zinc-400" />
                                    <span className="font-bold text-zinc-700" style={{ fontSize: 15 }}>Last Lead Sent</span>
                                </div>
                                <p className="font-black text-zinc-900 mt-1" style={{ fontSize: 20 }}>
                                    {fmtDate(selectedListItem?.last_lead_at ?? null)}
                                </p>
                                <p className="text-zinc-400 font-medium mt-0.5" style={{ fontSize: 12 }}>
                                    {timeAgo(selectedListItem?.last_lead_at ?? null)}
                                </p>
                            </div>
                            <div className="bg-white rounded-2xl border border-zinc-100 p-5">
                                <div className="flex items-center gap-2 mb-1">
                                    <DollarSign className="w-4 h-4 text-zinc-400" />
                                    <span className="font-bold text-zinc-700" style={{ fontSize: 15 }}>Current Lead Fee</span>
                                </div>
                                <p className="font-black text-zinc-900 mt-1" style={{ fontSize: 20 }}>{fmt(detail.effective_fee_cents)}</p>
                                <p className="text-zinc-400 font-medium mt-0.5" style={{ fontSize: 12 }}>
                                    {detail.custom_fee_cents != null ? "Custom rate" : `Default rate (${fmt(detail.default_fee_cents)})`}
                                </p>
                            </div>
                        </div>

                        {/* ── Custom fee editor ── */}
                        <div className="bg-white rounded-2xl border border-zinc-100 p-5">
                            <h3 className="font-black text-zinc-900 mb-1" style={{ fontSize: 17 }}>Override Lead Fee</h3>
                            <p className="text-zinc-400 font-medium mb-4" style={{ fontSize: 14 }}>
                                Set a custom per-lead fee for this partner. Leave blank to use the default ({fmt(detail.default_fee_cents)}/lead).
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="relative max-w-[160px]">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-zinc-400" style={{ fontSize: 16 }}>$</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={customFee}
                                        onChange={e => setCustomFee(e.target.value)}
                                        placeholder={(detail.default_fee_cents / 100).toFixed(2)}
                                        className="w-full pl-7 pr-3 h-11 border border-zinc-200 rounded-xl font-bold text-zinc-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                        style={{ fontSize: 16 }}
                                    />
                                </div>
                                <button
                                    onClick={() => saveCustomFee()}
                                    disabled={savingFee}
                                    className="h-11 px-5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black transition-all disabled:opacity-60"
                                    style={{ fontSize: 15 }}
                                >
                                    {savingFee ? "Saving…" : "Save"}
                                </button>
                                {detail.custom_fee_cents != null && (
                                    <button
                                        onClick={() => { setCustomFee(""); saveCustomFee(null); }}
                                        className="h-11 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl font-bold transition-all"
                                        style={{ fontSize: 14 }}
                                    >
                                        Reset to Default
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
