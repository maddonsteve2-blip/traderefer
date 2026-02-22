"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Users, Search, ArrowUpDown, DollarSign, Target,
    TrendingUp, ChevronRight, Star, ArrowLeft, MessageSquare
} from "lucide-react";
import Link from "next/link";

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

export default function ReferrersPage() {
    const { getToken, isLoaded } = useAuth();
    const router = useRouter();
    const [referrers, setReferrers] = useState<Referrer[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("leads_created");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

    const fetchReferrers = useCallback(async () => {
        try {
            const token = await getToken();
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
            const params = new URLSearchParams({ sort_by: sortBy, sort_dir: sortDir });
            if (search) params.set("search", search);
            const res = await fetch(`${apiUrl}/business/me/referrers?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setReferrers(data.referrers);
                setSummary(data.summary);
            }
        } catch (err) {
            console.error("Failed to fetch referrers:", err);
        } finally {
            setLoading(false);
        }
    }, [getToken, sortBy, sortDir, search]);

    useEffect(() => {
        if (isLoaded) fetchReferrers();
    }, [isLoaded, fetchReferrers]);

    const toggleSort = (col: string) => {
        if (sortBy === col) {
            setSortDir(sortDir === "asc" ? "desc" : "asc");
        } else {
            setSortBy(col);
            setSortDir("desc");
        }
    };

    const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;
    const fmtDate = (d: string | null) => {
        if (!d) return "—";
        const date = new Date(d);
        return date.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-50 pt-16 flex items-center justify-center">
                <div className="animate-pulse text-zinc-400 font-medium">Loading referrers…</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 pt-16">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard/business" className="p-2 text-zinc-400 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-all">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                            <Users className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-zinc-900 font-display">Your Referrers</h1>
                            <p className="text-zinc-500 font-medium tracking-tight mt-0.5">
                                {summary ? `${summary.total_referrers} referrer${summary.total_referrers !== 1 ? "s" : ""} connected` : ""}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Summary Stats */}
                {summary && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        {[
                            { label: "Total Referrers", value: summary.total_referrers, icon: Users, bg: "bg-blue-50", color: "text-blue-600" },
                            { label: "Total Leads", value: summary.total_leads, icon: Target, bg: "bg-orange-50", color: "text-orange-600" },
                            { label: "Confirmed Jobs", value: summary.total_confirmed, icon: TrendingUp, bg: "bg-emerald-50", color: "text-emerald-600" },
                            { label: "Total Paid", value: fmt(summary.total_paid_cents), icon: DollarSign, bg: "bg-violet-50", color: "text-violet-600" },
                        ].map((s) => (
                            <Card key={s.label} className="p-5 hover:shadow-md transition-all">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={`w-9 h-9 ${s.bg} ${s.color} rounded-xl flex items-center justify-center`}>
                                        <s.icon className="w-4.5 h-4.5" />
                                    </div>
                                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{s.label}</span>
                                </div>
                                <div className="text-2xl font-black text-zinc-900 font-display">{s.value}</div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Search */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <Input
                            placeholder="Search referrers…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 rounded-full border-zinc-200 h-10"
                        />
                    </div>
                </div>

                {/* Referrer Table */}
                {referrers.length === 0 ? (
                    <Card className="py-20 text-center">
                        <Users className="w-16 h-16 text-zinc-200 mx-auto mb-6" />
                        <h3 className="text-2xl font-bold text-zinc-900 mb-2">No referrers yet</h3>
                        <p className="text-zinc-500 mb-8 max-w-md mx-auto">
                            When referrers sign up and connect to your business, they&apos;ll appear here.
                        </p>
                    </Card>
                ) : (
                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-zinc-50 border-b border-zinc-100">
                                        {[
                                            { key: "full_name", label: "Name" },
                                            { key: "quality_score", label: "Score" },
                                            { key: "leads_created", label: "Leads" },
                                            { key: "confirmed_jobs", label: "Confirmed" },
                                            { key: "total_earned_cents", label: "Earned" },
                                            { key: "effective_fee", label: "Fee" },
                                            { key: "last_lead_at", label: "Last Active" },
                                        ].map((col) => (
                                            <th
                                                key={col.key}
                                                className="px-5 py-3.5 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-orange-600 transition-colors select-none"
                                                onClick={() => col.key !== "effective_fee" && toggleSort(col.key)}
                                            >
                                                <span className="flex items-center gap-1">
                                                    {col.label}
                                                    {sortBy === col.key && <ArrowUpDown className="w-3 h-3" />}
                                                </span>
                                            </th>
                                        ))}
                                        <th className="px-5 py-3.5 w-20"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {referrers.map((ref) => (
                                        <tr
                                            key={ref.referrer_id}
                                            className="border-b border-zinc-50 hover:bg-orange-50/40 transition-colors cursor-pointer group"
                                            onClick={() => router.push(`/dashboard/business/referrers/${ref.referrer_id}`)}
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-500 font-bold text-xs group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                                                        {ref.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-zinc-900 group-hover:text-orange-600 transition-colors">{ref.full_name}</div>
                                                        <div className="text-xs text-zinc-400">{ref.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1">
                                                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                                    <span className="font-bold text-zinc-700">{ref.quality_score}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 font-bold text-zinc-700">{ref.leads_created}</td>
                                            <td className="px-5 py-4 font-bold text-emerald-600">{ref.confirmed_jobs}</td>
                                            <td className="px-5 py-4 font-bold text-zinc-700">{fmt(ref.total_earned_cents)}</td>
                                            <td className="px-5 py-4">
                                                <span className="font-bold text-zinc-700">{fmt(ref.effective_fee_cents)}</span>
                                                {ref.custom_fee_cents !== null && (
                                                    <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">Custom</Badge>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-zinc-400">{fmtDate(ref.last_lead_at)}</td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            try {
                                                                const token = await getToken();
                                                                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
                                                                const res = await fetch(`${apiUrl}/messages/conversations/start/${ref.referrer_id}`, {
                                                                    method: 'POST',
                                                                    headers: { Authorization: `Bearer ${token}` },
                                                                });
                                                                if (res.ok) {
                                                                    const data = await res.json();
                                                                    router.push(`/dashboard/business/messages?conv=${data.conversation_id}`);
                                                                }
                                                            } catch {}
                                                        }}
                                                        className="p-1.5 text-zinc-300 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                                                        title="Message this referrer"
                                                    >
                                                        <MessageSquare className="w-4 h-4" />
                                                    </button>
                                                    <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-orange-500 transition-colors" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}

