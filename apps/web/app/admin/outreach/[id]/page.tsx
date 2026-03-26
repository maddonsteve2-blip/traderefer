"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ChevronLeft, CheckCircle2, XCircle, AlertTriangle, Clock,
    Mail, MousePointerClick, MessageSquare, ArrowUpRight, Loader2,
    Copy, Check, RefreshCw, Send, ExternalLink, Search, Filter,
} from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type LeadStatus = "pending" | "sent" | "clicked" | "replied" | "claimed";

interface Lead {
    id: string;
    email: string;
    first_name: string;
    business_name: string;
    trade_category: string;
    suburb: string;
    verification_status: string;
    claim_slug: string;
    claim_url: string | null;
    status: LeadStatus;
    sent_at: string | null;
    clicked_at: string | null;
    replied_at: string | null;
    claimed_at: string | null;
    reply_text: string;
    business_id: string | null;
}

interface Campaign {
    id: string;
    name: string;
    status: string;
    template_version: string;
    total_leads: number;
    sent_count: number;
    opened_count: number;
    clicked_count: number;
    replied_count: number;
    claimed_count: number;
    created_at: string;
}

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    pending: { label: "Pending", color: "text-zinc-500", bg: "bg-zinc-100", icon: Clock },
    sent: { label: "Sent", color: "text-blue-600", bg: "bg-blue-50", icon: Send },
    clicked: { label: "Clicked", color: "text-amber-600", bg: "bg-amber-50", icon: MousePointerClick },
    replied: { label: "Replied", color: "text-violet-600", bg: "bg-violet-50", icon: MessageSquare },
    claimed: { label: "Claimed ✓", color: "text-green-700", bg: "bg-green-50", icon: CheckCircle2 },
};

function StatusBadge({ status }: { status: LeadStatus }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${cfg.bg} ${cfg.color}`}>
            <Icon className="w-3 h-3" /> {cfg.label}
        </span>
    );
}

function VerifBadge({ status }: { status: string }) {
    if (status === "valid") return <span className="text-xs font-bold text-green-600">✓ valid</span>;
    if (status === "catchall") return <span className="text-xs font-bold text-amber-500">⚠ catchall</span>;
    if (status === "invalid") return <span className="text-xs font-bold text-red-500">✗ invalid</span>;
    return <span className="text-xs font-bold text-zinc-400">{status || "unverified"}</span>;
}

export default function CampaignDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { getToken } = useAuth();

    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [leadsLoading, setLeadsLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>("");
    const [search, setSearch] = useState("");
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const PER_PAGE = 100;

    const copyUrl = (leadId: string, url: string) => {
        navigator.clipboard.writeText(url);
        setCopiedId(leadId);
        toast.success("Claim URL copied");
        setTimeout(() => setCopiedId(null), 2000);
    };

    const fetchCampaign = useCallback(async () => {
        try {
            const token = await getToken();
            const res = await fetch(`${API}/admin/outreach/campaigns`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return;
            const data = await res.json();
            const found = (data.campaigns || []).find((c: Campaign) => c.id === id);
            if (found) setCampaign(found);
        } catch { /* silent */ }
    }, [getToken, id]);

    const fetchLeads = useCallback(async (reset = false) => {
        setLeadsLoading(true);
        try {
            const token = await getToken();
            const offset = reset ? 0 : page * PER_PAGE;
            const params = new URLSearchParams({
                limit: String(PER_PAGE),
                offset: String(offset),
            });
            if (filterStatus) params.set("status", filterStatus);
            const res = await fetch(`${API}/admin/outreach/campaigns/${id}/leads?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return;
            const data = await res.json();
            setLeads(data.leads || []);
            setTotal(data.total || 0);
            if (reset) setPage(0);
        } catch { /* silent */ }
        finally { setLeadsLoading(false); }
    }, [getToken, id, filterStatus, page]);

    useEffect(() => {
        Promise.all([fetchCampaign(), fetchLeads(true)]).finally(() => setLoading(false));
    }, [fetchCampaign, fetchLeads]);

    useEffect(() => {
        fetchLeads(true);
    }, [filterStatus]);

    const filtered = search.trim()
        ? leads.filter(l =>
            l.business_name.toLowerCase().includes(search.toLowerCase()) ||
            l.email.toLowerCase().includes(search.toLowerCase()) ||
            l.suburb.toLowerCase().includes(search.toLowerCase())
        )
        : leads;

    const replies = leads.filter(l => l.reply_text);

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <Link href="/admin/outreach" className="p-2 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-black text-zinc-900 truncate">
                            {campaign?.name || "Campaign"}
                        </h1>
                        <p className="text-sm text-zinc-500">
                            Template {campaign?.template_version} · {campaign?.total_leads?.toLocaleString()} leads · {campaign?.status}
                        </p>
                    </div>
                    <button
                        onClick={() => { fetchCampaign(); fetchLeads(true); }}
                        className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-zinc-700 transition-colors"
                    >
                        <RefreshCw className="w-3.5 h-3.5" /> Refresh
                    </button>
                </div>

                {/* Stats row */}
                {campaign && (
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
                        {[
                            { label: "Total", value: campaign.total_leads, color: "text-zinc-700" },
                            { label: "Sent", value: campaign.sent_count, color: "text-blue-600" },
                            { label: "Opened", value: campaign.opened_count, color: "text-indigo-600" },
                            { label: "Clicked", value: campaign.clicked_count, color: "text-amber-600" },
                            { label: "Replied", value: campaign.replied_count, color: "text-violet-600" },
                            { label: "Claimed", value: campaign.claimed_count, color: "text-green-600" },
                        ].map(s => (
                            <div key={s.label} className="bg-white rounded-2xl border border-zinc-200 p-3 text-center shadow-sm">
                                <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                                <p className="text-xs font-bold text-zinc-500 mt-0.5">{s.label}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Reply inbox */}
                {replies.length > 0 && (
                    <div className="bg-white rounded-2xl border border-violet-200 p-5 mb-6">
                        <h2 className="text-sm font-black text-zinc-900 flex items-center gap-2 mb-3">
                            <MessageSquare className="w-4 h-4 text-violet-500" /> Reply Inbox ({replies.length})
                        </h2>
                        <div className="space-y-3 max-h-72 overflow-y-auto">
                            {replies.map(l => (
                                <div key={l.id} className="flex gap-3 p-3 bg-violet-50 rounded-xl border border-violet-100">
                                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                                        <Mail className="w-4 h-4 text-violet-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-black text-zinc-900">{l.business_name || l.email}</span>
                                            <span className="text-xs text-zinc-500">{l.email}</span>
                                            {l.replied_at && (
                                                <span className="text-xs text-zinc-400 ml-auto">
                                                    {new Date(l.replied_at).toLocaleDateString("en-AU")}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-zinc-700 mt-1 leading-relaxed">{l.reply_text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Leads table */}
                <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-zinc-100 flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search business name, email, suburb…"
                                className="w-full h-9 pl-9 pr-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-zinc-400 shrink-0" />
                            <select
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value)}
                                className="h-9 px-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                            >
                                <option value="">All statuses</option>
                                <option value="claimed">Claimed</option>
                                <option value="replied">Replied</option>
                                <option value="clicked">Clicked</option>
                                <option value="sent">Sent</option>
                                <option value="pending">Pending</option>
                            </select>
                            <span className="text-xs font-bold text-zinc-400 shrink-0">
                                {leadsLoading ? "…" : `${filtered.length} shown / ${total} total`}
                            </span>
                        </div>
                    </div>

                    {leadsLoading ? (
                        <div className="py-12 flex justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-16 text-center text-zinc-400 font-bold">No leads match your filter</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-zinc-100 bg-zinc-50/50">
                                        <th className="text-left px-4 py-2.5 text-xs font-black uppercase tracking-widest text-zinc-400">Business</th>
                                        <th className="text-left px-4 py-2.5 text-xs font-black uppercase tracking-widest text-zinc-400">Email</th>
                                        <th className="text-left px-4 py-2.5 text-xs font-black uppercase tracking-widest text-zinc-400">Status</th>
                                        <th className="text-left px-4 py-2.5 text-xs font-black uppercase tracking-widest text-zinc-400">Verif</th>
                                        <th className="text-left px-4 py-2.5 text-xs font-black uppercase tracking-widest text-zinc-400">Claim URL</th>
                                        <th className="text-left px-4 py-2.5 text-xs font-black uppercase tracking-widest text-zinc-400">Timeline</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {filtered.map(lead => (
                                        <tr key={lead.id} className={`hover:bg-zinc-50/50 transition-colors ${lead.status === "claimed" ? "bg-green-50/30" : ""}`}>
                                            <td className="px-4 py-3">
                                                <p className="font-bold text-zinc-900 leading-tight">{lead.business_name || "—"}</p>
                                                <p className="text-xs text-zinc-400 mt-0.5">
                                                    {[lead.trade_category, lead.suburb].filter(Boolean).join(" · ")}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 text-zinc-600 font-mono text-xs">{lead.email}</td>
                                            <td className="px-4 py-3">
                                                <StatusBadge status={lead.status as LeadStatus} />
                                                {lead.reply_text && (
                                                    <p className="text-xs text-violet-700 mt-1 max-w-[200px] truncate" title={lead.reply_text}>
                                                        "{lead.reply_text}"
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <VerifBadge status={lead.verification_status} />
                                            </td>
                                            <td className="px-4 py-3">
                                                {lead.claim_url ? (
                                                    <div className="flex items-center gap-1">
                                                        <a
                                                            href={lead.claim_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-orange-600 hover:text-orange-700 font-mono truncate max-w-[160px]"
                                                            title={lead.claim_url}
                                                        >
                                                            /claim/{lead.claim_slug.slice(0, 20)}{lead.claim_slug.length > 20 ? "…" : ""}
                                                        </a>
                                                        <button
                                                            onClick={() => copyUrl(lead.id, lead.claim_url!)}
                                                            className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 shrink-0"
                                                        >
                                                            {copiedId === lead.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                                        </button>
                                                        {lead.business_id && (
                                                            <a
                                                                href={`/admin/businesses/${lead.business_id}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 shrink-0"
                                                            >
                                                                <ExternalLink className="w-3 h-3" />
                                                            </a>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-zinc-300">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-zinc-400 space-y-0.5">
                                                {lead.sent_at && <p>Sent {new Date(lead.sent_at).toLocaleDateString("en-AU")}</p>}
                                                {lead.clicked_at && <p className="text-amber-600">Clicked {new Date(lead.clicked_at).toLocaleDateString("en-AU")}</p>}
                                                {lead.replied_at && <p className="text-violet-600">Replied {new Date(lead.replied_at).toLocaleDateString("en-AU")}</p>}
                                                {lead.claimed_at && <p className="text-green-600 font-bold">Claimed {new Date(lead.claimed_at).toLocaleDateString("en-AU")}</p>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            {total > PER_PAGE && (
                                <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-100 bg-zinc-50/50">
                                    <p className="text-xs text-zinc-500 font-bold">
                                        Page {page + 1} of {Math.ceil(total / PER_PAGE)}
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { setPage(p => Math.max(0, p - 1)); fetchLeads(); }}
                                            disabled={page === 0}
                                            className="h-8 px-3 rounded-xl text-xs font-bold bg-white border border-zinc-200 disabled:opacity-40 hover:border-zinc-300 transition-colors"
                                        >
                                            ← Prev
                                        </button>
                                        <button
                                            onClick={() => { setPage(p => p + 1); fetchLeads(); }}
                                            disabled={(page + 1) * PER_PAGE >= total}
                                            className="h-8 px-3 rounded-xl text-xs font-bold bg-white border border-zinc-200 disabled:opacity-40 hover:border-zinc-300 transition-colors"
                                        >
                                            Next →
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
