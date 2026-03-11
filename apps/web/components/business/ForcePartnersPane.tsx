"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Users, Search, TrendingUp, DollarSign, Target,
    Star, MessageSquare, Calendar, UserCheck
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

export function ForcePartnersPane() {
    const { getToken, isLoaded } = useAuth();
    const router = useRouter();
    const [referrers, setReferrers] = useState<Referrer[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [customFee, setCustomFee] = useState<string>("");
    const [savingFee, setSavingFee] = useState(false);
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
            setReferrers(data.referrers);
            setSummary(data.summary);
        }
        setLoading(false);
    }, [getToken, search, apiUrl]);

    useEffect(() => { if (isLoaded) fetchReferrers(); }, [isLoaded, fetchReferrers]);

    useEffect(() => {
        const update = () => setIsMobile(window.innerWidth < 768);
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    const selected = referrers.find(r => r.referrer_id === selectedId) ?? null;

    useEffect(() => {
        if (selected) {
            setCustomFee(selected.custom_fee_cents != null ? String(selected.custom_fee_cents / 100) : "");
        }
    }, [selected]);

    const handleMessage = async (referrerId: string) => {
        const token = await getToken();
        const res = await fetch(`${apiUrl}/messages/conversations/start/${referrerId}`, {
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

    const saveCustomFee = async () => {
        if (!selected) return;
        setSavingFee(true);
        const cents = customFee ? Math.round(parseFloat(customFee) * 100) : null;
        const token = await getToken();
        const res = await fetch(`${apiUrl}/business/me/referrers/${selected.referrer_id}/fee`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ custom_fee_cents: cents }),
        });
        setSavingFee(false);
        if (res.ok) {
            toast.success("Custom fee saved.");
            fetchReferrers();
        } else {
            toast.error("Failed to save fee.");
        }
    };

    const handleSelect = (referrerId: string) => {
        if (isMobile) {
            router.push(`/dashboard/business/referrers/${referrerId}`);
            return;
        }

        setSelectedId(referrerId);
    };

    return (
        <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* LEFT PANE */}
            <div className="w-full md:w-[320px] shrink-0 border-r border-zinc-200 overflow-y-auto bg-white flex flex-col">
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

                {/* Summary strip */}
                {summary && (
                    <div className="px-4 py-3 border-b border-zinc-100 grid grid-cols-3 gap-2">
                        {[
                            { label: "Partners", value: summary.total_referrers, color: "text-orange-600" },
                            { label: "Leads", value: summary.total_leads, color: "text-blue-600" },
                            { label: "Confirmed", value: summary.total_confirmed, color: "text-emerald-600" },
                        ].map(s => (
                            <div key={s.label} className="text-center">
                                <p className={`font-black ${s.color}`} style={{ fontSize: 20 }}>{s.value}</p>
                                <p className="font-bold text-zinc-400" style={{ fontSize: 11 }}>{s.label}</p>
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
                                    className={`w-full text-left px-4 py-4 transition-colors ${isSelected ? "bg-orange-50 border-l-4 border-orange-500" : "hover:bg-zinc-50 border-l-4 border-transparent"}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center font-black text-orange-600 shrink-0" style={{ fontSize: 14 }}>
                                            {initials}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-zinc-900 truncate" style={{ fontSize: 16 }}>{r.full_name}</p>
                                            <p className="text-zinc-400 font-medium" style={{ fontSize: 13 }}>
                                                {r.leads_created} leads · ⭐ {r.quality_score}
                                            </p>
                                        </div>
                                        <span className={`w-2 h-2 rounded-full shrink-0 ${r.is_active ? "bg-emerald-500" : "bg-zinc-300"}`} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* RIGHT PANE — detail */}
            <div className="hidden md:flex flex-1 overflow-y-auto bg-zinc-50">
                {!selected ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-8">
                        <UserCheck className="w-16 h-16 text-zinc-200 mb-4" />
                        <p className="font-black text-zinc-400" style={{ fontSize: 20 }}>Select a partner</p>
                        <p className="text-zinc-400 font-medium mt-1" style={{ fontSize: 16 }}>Click a partner on the left to view their performance</p>
                    </div>
                ) : (
                    <div className="max-w-2xl mx-auto px-6 py-6 space-y-4">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="font-black text-zinc-900" style={{ fontSize: 24 }}>{selected.full_name}</h2>
                                <p className="text-zinc-400 font-medium" style={{ fontSize: 15 }}>
                                    Partner since {fmtDate(selected.linked_since)}
                                </p>
                            </div>
                            <button
                                onClick={() => handleMessage(selected.referrer_id)}
                                className="flex items-center gap-2 h-10 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-all"
                                style={{ fontSize: 15 }}
                            >
                                <MessageSquare className="w-4 h-4" /> Message
                            </button>
                        </div>

                        {/* Stats grid */}
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: "Total Leads", value: selected.leads_created, icon: Target, bg: "bg-orange-50", text: "text-orange-600" },
                                { label: "Confirmed Jobs", value: selected.confirmed_jobs, icon: TrendingUp, bg: "bg-emerald-50", text: "text-emerald-600" },
                                { label: "Total Earned", value: fmt(selected.total_earned_cents), icon: DollarSign, bg: "bg-violet-50", text: "text-violet-600" },
                                { label: "Quality Score", value: `${selected.quality_score} / 100`, icon: Star, bg: "bg-amber-50", text: "text-amber-500" },
                            ].map(s => (
                                <div key={s.label} className={`${s.bg} rounded-2xl p-5`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <s.icon className={`w-5 h-5 ${s.text}`} />
                                        <span className="font-bold text-zinc-500 uppercase tracking-wider" style={{ fontSize: 12 }}>{s.label}</span>
                                    </div>
                                    <p className="font-black text-zinc-900" style={{ fontSize: 28 }}>{s.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Last activity */}
                        <div className="bg-white rounded-2xl border border-zinc-100 p-5">
                            <div className="flex items-center gap-2 mb-1">
                                <Calendar className="w-4 h-4 text-zinc-400" />
                                <span className="font-bold text-zinc-700" style={{ fontSize: 16 }}>Last Lead Sent</span>
                            </div>
                            <p className="font-black text-zinc-900" style={{ fontSize: 18 }}>{fmtDate(selected.last_lead_at)}</p>
                        </div>

                        {/* Custom fee override */}
                        <div className="bg-white rounded-2xl border border-zinc-100 p-5">
                            <h3 className="font-black text-zinc-900 mb-1" style={{ fontSize: 18 }}>Custom Lead Fee</h3>
                            <p className="text-zinc-400 font-medium mb-4" style={{ fontSize: 15 }}>
                                Override the default fee for this partner. Default: {fmt(summary?.default_fee_cents ?? 0)}/lead.
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="relative flex-1 max-w-[180px]">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-zinc-400" style={{ fontSize: 16 }}>$</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={customFee}
                                        onChange={e => setCustomFee(e.target.value)}
                                        placeholder={fmt(summary?.default_fee_cents ?? 0).replace("$", "")}
                                        className="w-full pl-7 pr-3 h-11 border border-zinc-200 rounded-xl font-bold text-zinc-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                        style={{ fontSize: 16 }}
                                    />
                                </div>
                                <button
                                    onClick={saveCustomFee}
                                    disabled={savingFee}
                                    className="h-11 px-5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black transition-all disabled:opacity-60"
                                    style={{ fontSize: 16 }}
                                >
                                    {savingFee ? "Saving…" : "Save"}
                                </button>
                                {customFee && (
                                    <button
                                        onClick={() => { setCustomFee(""); saveCustomFee(); }}
                                        className="h-11 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl font-bold transition-all"
                                        style={{ fontSize: 15 }}
                                    >
                                        Reset
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
