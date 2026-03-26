"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import {
    Mail, Upload, Play, Pause, RefreshCw, CheckCircle2, XCircle,
    AlertTriangle, ChevronDown, ChevronUp, Loader2, Send, Eye,
    MessageSquare, BarChart2, Users, Inbox, Plus, Trash2, ExternalLink,
    ShieldCheck, FileText
} from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type CampaignStatus = "draft" | "verifying" | "ready" | "active" | "paused" | "completed";

interface Campaign {
    id: string;
    name: string;
    instantly_campaign_id: string | null;
    template_version: string;
    status: CampaignStatus;
    total_leads: number;
    sent_count: number;
    opened_count: number;
    clicked_count: number;
    replied_count: number;
    claimed_count: number;
    created_at: string;
    started_at: string | null;
}

interface VerificationResult {
    total: number;
    valid: number;
    invalid: number;
    catchall: number;
    unknown: number;
    estimated_bounce_rate_valid_only: string;
    estimated_bounce_rate_with_catchall: string;
}

interface Reply {
    email: string;
    business_name: string | null;
    reply_text: string;
    timestamp: string;
    status: string;
}

const STATUS_CONFIG: Record<CampaignStatus, { label: string; color: string; bg: string }> = {
    draft: { label: "Draft", color: "text-zinc-600", bg: "bg-zinc-100" },
    verifying: { label: "Verifying emails", color: "text-amber-700", bg: "bg-amber-100" },
    ready: { label: "Ready to launch", color: "text-blue-700", bg: "bg-blue-100" },
    active: { label: "Active", color: "text-green-700", bg: "bg-green-100" },
    paused: { label: "Paused", color: "text-orange-700", bg: "bg-orange-100" },
    completed: { label: "Completed", color: "text-purple-700", bg: "bg-purple-100" },
};

function StatBadge({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
    return (
        <div className="text-center">
            <div className="text-xl font-black text-zinc-900">{value}</div>
            <div className="text-xs font-bold text-zinc-500 mt-0.5">{label}</div>
            {sub && <div className="text-xs text-zinc-400">{sub}</div>}
        </div>
    );
}

function CampaignRow({ campaign, onRefresh }: { campaign: Campaign; onRefresh: () => void }) {
    const { getToken } = useAuth();
    const [expanded, setExpanded] = useState(false);
    const [replies, setReplies] = useState<Reply[]>([]);
    const [loadingReplies, setLoadingReplies] = useState(false);
    const [acting, setActing] = useState(false);

    const cfg = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.draft;
    const openRate = campaign.sent_count > 0 ? Math.round((campaign.opened_count / campaign.sent_count) * 100) : 0;
    const clickRate = campaign.opened_count > 0 ? Math.round((campaign.clicked_count / campaign.opened_count) * 100) : 0;
    const claimRate = campaign.clicked_count > 0 ? Math.round((campaign.claimed_count / campaign.clicked_count) * 100) : 0;

    const fetchReplies = useCallback(async () => {
        setLoadingReplies(true);
        try {
            const token = await getToken();
            const res = await fetch(`${API}/admin/outreach/campaigns/${campaign.id}/replies`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) setReplies(await res.json());
        } catch { /* silent */ }
        finally { setLoadingReplies(false); }
    }, [campaign.id, getToken]);

    useEffect(() => {
        if (expanded) fetchReplies();
    }, [expanded, fetchReplies]);

    const doAction = async (action: "pause" | "resume" | "sync") => {
        setActing(true);
        try {
            const token = await getToken();
            const res = await fetch(`${API}/admin/outreach/campaigns/${campaign.id}/${action}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Action failed");
            toast.success(action === "sync" ? "Stats synced" : `Campaign ${action}d`);
            onRefresh();
        } catch {
            toast.error("Action failed");
        } finally {
            setActing(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
            <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-zinc-50 transition-colors"
                onClick={() => setExpanded(e => !e)}
            >
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-zinc-900 text-sm">{campaign.name}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                            {cfg.label}
                        </span>
                        {campaign.template_version && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                                Template {campaign.template_version}
                            </span>
                        )}
                    </div>
                    <div className="text-xs text-zinc-400 mt-0.5">
                        Created {new Date(campaign.created_at).toLocaleDateString("en-AU")}
                        {campaign.started_at && ` · Started ${new Date(campaign.started_at).toLocaleDateString("en-AU")}`}
                    </div>
                </div>

                {/* Mini stats */}
                <div className="hidden md:flex items-center gap-6 shrink-0">
                    <StatBadge label="Leads" value={campaign.total_leads} />
                    <StatBadge label="Sent" value={campaign.sent_count} />
                    <StatBadge label="Open" value={`${openRate}%`} />
                    <StatBadge label="Clicked" value={`${clickRate}%`} />
                    <StatBadge label="Claimed" value={campaign.claimed_count} sub={claimRate > 0 ? `${claimRate}%` : undefined} />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                    {campaign.status === "active" && (
                        <button
                            onClick={() => doAction("pause")}
                            disabled={acting}
                            className="p-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 transition-colors"
                            title="Pause campaign"
                        >
                            <Pause className="w-4 h-4" />
                        </button>
                    )}
                    {campaign.status === "paused" && (
                        <button
                            onClick={() => doAction("resume")}
                            disabled={acting}
                            className="p-2 rounded-xl bg-green-50 hover:bg-green-100 text-green-600 transition-colors"
                            title="Resume campaign"
                        >
                            <Play className="w-4 h-4" />
                        </button>
                    )}
                    {["active", "paused"].includes(campaign.status) && (
                        <button
                            onClick={() => doAction("sync")}
                            disabled={acting}
                            className="p-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-600 transition-colors"
                            title="Sync stats from Instantly"
                        >
                            {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        </button>
                    )}
                    <button className="p-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-500 transition-colors">
                        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="border-t border-zinc-100 p-4 space-y-4">
                    {/* Mobile stats */}
                    <div className="flex md:hidden justify-around bg-zinc-50 rounded-xl p-3">
                        <StatBadge label="Leads" value={campaign.total_leads} />
                        <StatBadge label="Sent" value={campaign.sent_count} />
                        <StatBadge label="Open" value={`${openRate}%`} />
                        <StatBadge label="Claimed" value={campaign.claimed_count} />
                    </div>

                    {/* Replies */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-black text-zinc-900 flex items-center gap-2">
                                <Inbox className="w-4 h-4 text-zinc-500" /> Replies ({replies.length})
                            </h4>
                            <button
                                onClick={fetchReplies}
                                className="text-xs font-bold text-zinc-400 hover:text-zinc-700 flex items-center gap-1"
                            >
                                <RefreshCw className="w-3 h-3" /> Refresh
                            </button>
                        </div>
                        {loadingReplies ? (
                            <div className="py-4 flex justify-center">
                                <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                            </div>
                        ) : replies.length === 0 ? (
                            <p className="text-sm text-zinc-400 text-center py-4">No replies yet</p>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {replies.map((reply, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                                        <MessageSquare className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-xs font-bold text-zinc-900">{reply.email}</span>
                                                {reply.business_name && (
                                                    <span className="text-xs text-zinc-500">{reply.business_name}</span>
                                                )}
                                                <span className="text-xs text-zinc-400 ml-auto">
                                                    {new Date(reply.timestamp).toLocaleDateString("en-AU")}
                                                </span>
                                            </div>
                                            <p className="text-xs text-zinc-600 mt-1 leading-relaxed">{reply.reply_text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function CreateCampaignModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const { getToken } = useAuth();
    const fileRef = useRef<HTMLInputElement>(null);
    const [name, setName] = useState("");
    const [template, setTemplate] = useState<"A" | "B">("A");
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [csvPreview, setCsvPreview] = useState<string[][]>([]);
    const [step, setStep] = useState<"form" | "verifying" | "verified" | "launching">("form");
    const [verification, setVerification] = useState<VerificationResult | null>(null);
    const [campaignId, setCampaignId] = useState<string | null>(null);
    const [includeValid, setIncludeValid] = useState(true);
    const [includeCatchall, setIncludeCatchall] = useState(false);
    const [instantlyCampaignId, setInstantlyCampaignId] = useState("");
    const [loading, setLoading] = useState(false);

    const handleFile = (file: File) => {
        setCsvFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const rows = text.split("\n").filter(r => r.trim()).slice(0, 6).map(r => r.split(",").map(c => c.trim().replace(/^"|"$/g, "")));
            setCsvPreview(rows);
        };
        reader.readAsText(file);
    };

    const handleUploadAndVerify = async () => {
        if (!name.trim() || !csvFile) {
            toast.error("Campaign name and CSV are required");
            return;
        }
        setLoading(true);
        setStep("verifying");
        try {
            const token = await getToken();
            const formData = new FormData();
            formData.append("name", name);
            formData.append("template_version", template);
            formData.append("csv_file", csvFile);

            const createRes = await fetch(`${API}/admin/outreach/campaigns`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            if (!createRes.ok) {
                const err = await createRes.json().catch(() => null);
                throw new Error(err?.detail || "Failed to create campaign");
            }
            const campaign = await createRes.json();
            setCampaignId(campaign.id);

            // Trigger verification
            const verifyRes = await fetch(`${API}/admin/outreach/campaigns/${campaign.id}/verify`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!verifyRes.ok) {
                const err = await verifyRes.json().catch(() => null);
                throw new Error(err?.detail || "Email verification failed");
            }
            const verifyData = await verifyRes.json();
            setVerification(verifyData);
            setStep("verified");
        } catch (err) {
            toast.error((err as Error).message || "Failed");
            setStep("form");
        } finally {
            setLoading(false);
        }
    };

    const handleLaunch = async () => {
        if (!campaignId) return;
        setLoading(true);
        setStep("launching");
        try {
            const token = await getToken();
            const res = await fetch(`${API}/admin/outreach/campaigns/${campaignId}/launch`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    include_catchall: includeCatchall,
                    instantly_campaign_id: instantlyCampaignId.trim() || null,
                }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => null);
                throw new Error(err?.detail || "Launch failed");
            }
            toast.success("Campaign launched!");
            onCreated();
            onClose();
        } catch (err) {
            toast.error((err as Error).message || "Launch failed");
            setStep("verified");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-zinc-100">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-zinc-900 flex items-center gap-2">
                            <Mail className="w-5 h-5 text-orange-500" /> New Outreach Campaign
                        </h2>
                        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 font-bold text-sm">
                            Cancel
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-5">

                    {/* Step: form */}
                    {(step === "form" || step === "verifying") && (
                        <>
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-1.5">Campaign Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. Scraped NSW Plumbers Wave 1"
                                    className="w-full h-12 px-4 rounded-2xl border border-zinc-200 bg-zinc-50 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-1.5">Email Template</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(["A", "B"] as const).map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setTemplate(t)}
                                            className={`p-3 rounded-xl border-2 text-left transition-all ${template === t ? "border-orange-500 bg-orange-50" : "border-zinc-200 bg-white hover:border-zinc-300"}`}
                                        >
                                            <p className={`text-sm font-black ${template === t ? "text-orange-600" : "text-zinc-900"}`}>
                                                Template {t}
                                            </p>
                                            <p className="text-xs text-zinc-500 mt-0.5">
                                                {t === "A" ? "Direct value — sets own referral price" : "Social proof — 247 tradies using TradeRefer"}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-1.5">Upload CSV</label>
                                <div
                                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${csvFile ? "border-green-400 bg-green-50" : "border-zinc-200 hover:border-orange-400 hover:bg-orange-50/30"}`}
                                    onClick={() => fileRef.current?.click()}
                                    onDragOver={e => e.preventDefault()}
                                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                                >
                                    <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                                    {csvFile ? (
                                        <>
                                            <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                                            <p className="text-sm font-bold text-green-700">{csvFile.name}</p>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                                            <p className="text-sm font-bold text-zinc-600">Drop CSV here or click to browse</p>
                                            <p className="text-xs text-zinc-400 mt-1">Required columns: business_name, email, first_name, trade_category, suburb</p>
                                        </>
                                    )}
                                </div>

                                {csvPreview.length > 0 && (
                                    <div className="mt-3 overflow-x-auto rounded-xl border border-zinc-100">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="bg-zinc-50">
                                                    {csvPreview[0].map((h, i) => (
                                                        <th key={i} className="px-3 py-2 text-left font-black text-zinc-600 uppercase tracking-wide">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {csvPreview.slice(1, 4).map((row, i) => (
                                                    <tr key={i} className="border-t border-zinc-100">
                                                        {row.map((cell, j) => (
                                                            <td key={j} className="px-3 py-2 text-zinc-600 truncate max-w-[120px]">{cell}</td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleUploadAndVerify}
                                disabled={loading || !name.trim() || !csvFile}
                                className="w-full h-12 rounded-2xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-black flex items-center justify-center gap-2 transition-colors"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                {loading ? "Uploading & verifying emails…" : "Upload & Verify Emails"}
                            </button>
                        </>
                    )}

                    {/* Step: verified — show results + launch */}
                    {step === "verified" && verification && (
                        <>
                            <div className="rounded-2xl bg-zinc-50 border border-zinc-200 p-5">
                                <h3 className="text-sm font-black text-zinc-900 mb-4 flex items-center gap-2">
                                    <BarChart2 className="w-4 h-4 text-zinc-500" /> Email Verification Results
                                </h3>
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                                        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                                        <div>
                                            <p className="text-lg font-black text-green-900">{verification.valid.toLocaleString()}</p>
                                            <p className="text-xs font-bold text-green-700">Valid — safe to send</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                                        <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                                        <div>
                                            <p className="text-lg font-black text-red-900">{verification.invalid.toLocaleString()}</p>
                                            <p className="text-xs font-bold text-red-700">Invalid — removed</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                                        <div>
                                            <p className="text-lg font-black text-amber-900">{verification.catchall.toLocaleString()}</p>
                                            <p className="text-xs font-bold text-amber-700">Catchall — risky</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-zinc-100 border border-zinc-200 rounded-xl">
                                        <AlertTriangle className="w-5 h-5 text-zinc-500 shrink-0" />
                                        <div>
                                            <p className="text-lg font-black text-zinc-900">{verification.unknown.toLocaleString()}</p>
                                            <p className="text-xs font-bold text-zinc-600">Unknown — risky</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500">Send to</h4>
                                    <label className="flex items-center gap-3 p-3 bg-white border border-green-300 rounded-xl cursor-pointer">
                                        <input type="checkbox" checked={includeValid} disabled className="rounded" />
                                        <div>
                                            <p className="text-sm font-bold text-zinc-900">Valid ({verification.valid.toLocaleString()})</p>
                                            <p className="text-xs text-zinc-500">Bounce rate: ~{verification.estimated_bounce_rate_valid_only}</p>
                                        </div>
                                        <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
                                    </label>
                                    <label className="flex items-center gap-3 p-3 bg-white border border-zinc-200 rounded-xl cursor-pointer hover:border-amber-300">
                                        <input
                                            type="checkbox"
                                            checked={includeCatchall}
                                            onChange={e => setIncludeCatchall(e.target.checked)}
                                            className="rounded"
                                        />
                                        <div>
                                            <p className="text-sm font-bold text-zinc-900">
                                                + Catchall ({verification.catchall.toLocaleString()})
                                            </p>
                                            <p className="text-xs text-zinc-500">
                                                Bounce rate rises to ~{verification.estimated_bounce_rate_with_catchall} — risky
                                            </p>
                                        </div>
                                        <AlertTriangle className="w-4 h-4 text-amber-500 ml-auto" />
                                    </label>
                                </div>

                                <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                                    <p className="text-xs font-bold text-blue-800">
                                        Ready to send: <strong>{(includeValid ? verification.valid : 0) + (includeCatchall ? verification.catchall : 0)} emails</strong>
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-1.5">
                                    Instantly Campaign ID <span className="text-zinc-400 normal-case font-medium">(from Instantly dashboard)</span>
                                </label>
                                <input
                                    type="text"
                                    value={instantlyCampaignId}
                                    onChange={e => setInstantlyCampaignId(e.target.value)}
                                    placeholder="e.g. abc123def456 — leave blank to dry-run without Instantly"
                                    className="w-full h-12 px-4 rounded-2xl border border-zinc-200 bg-zinc-50 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500"
                                />
                                <p className="text-xs text-zinc-400 mt-1.5">
                                    Create the campaign in Instantly first, set the sending template and mailboxes, then paste the ID here to push leads into it.
                                </p>
                            </div>

                            <button
                                onClick={handleLaunch}
                                disabled={loading}
                                className="w-full h-12 rounded-2xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-black flex items-center justify-center gap-2 transition-colors"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                {loading ? "Launching campaign…" : instantlyCampaignId.trim() ? "Push to Instantly & Launch" : "Dry Run (no Instantly key)"}
                            </button>
                        </>
                    )}

                    {step === "launching" && (
                        <div className="py-12 text-center">
                            <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto mb-4" />
                            <p className="font-black text-zinc-900">Pushing leads to Instantly…</p>
                            <p className="text-sm text-zinc-500 mt-1">This may take a moment for large lists</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AdminOutreachPage() {
    const { getToken } = useAuth();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [overallStats, setOverallStats] = useState({
        total_campaigns: 0,
        total_leads: 0,
        total_sent: 0,
        total_claimed: 0,
        total_replies: 0,
    });

    const fetchCampaigns = useCallback(async () => {
        try {
            const token = await getToken();
            const res = await fetch(`${API}/admin/outreach/campaigns`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store",
            });
            if (!res.ok) return;
            const data = await res.json();
            const list: Campaign[] = data.campaigns || [];
            setCampaigns(list);
            setOverallStats({
                total_campaigns: list.length,
                total_leads: list.reduce((s, c) => s + c.total_leads, 0),
                total_sent: list.reduce((s, c) => s + c.sent_count, 0),
                total_claimed: list.reduce((s, c) => s + c.claimed_count, 0),
                total_replies: list.reduce((s, c) => s + c.replied_count, 0),
            });
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, [getToken]);

    useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-5xl mx-auto">

                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-zinc-900 flex items-center gap-2">
                            <Mail className="w-6 h-6 text-orange-500" /> Cold Email Outreach
                        </h1>
                        <p className="text-zinc-500 text-sm mt-1">
                            Send cold emails to scraped businesses. All emails sent via Instantly on separate domains.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="shrink-0 flex items-center gap-2 h-10 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-sm transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> New Campaign
                    </button>
                </div>

                {/* Overview stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                    {[
                        { label: "Campaigns", value: overallStats.total_campaigns, icon: FileText, color: "text-violet-600", bg: "bg-violet-50" },
                        { label: "Total Leads", value: overallStats.total_leads.toLocaleString(), icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                        { label: "Emails Sent", value: overallStats.total_sent.toLocaleString(), icon: Send, color: "text-zinc-600", bg: "bg-zinc-100" },
                        { label: "Replies", value: overallStats.total_replies, icon: MessageSquare, color: "text-amber-600", bg: "bg-amber-50" },
                        { label: "Claimed Profiles", value: overallStats.total_claimed, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
                    ].map(stat => (
                        <div key={stat.label} className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-sm flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${stat.bg}`}>
                                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-lg font-black text-zinc-900 leading-none">{stat.value}</p>
                                <p className="text-xs font-bold text-zinc-500 mt-0.5">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Infrastructure reminder */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p className="font-bold text-amber-900">External setup required before launching campaigns</p>
                        <div className="mt-1 text-amber-800 flex flex-wrap gap-x-4 gap-y-1">
                            <span>· Register new sending domains (not traderefer.au)</span>
                            <span>· Connect Google Workspace mailboxes to Instantly</span>
                            <span>· Run 14-day warmup before first send</span>
                            <span>· Set <code className="bg-amber-100 px-1 rounded text-xs">INSTANTLY_API_KEY</code> and <code className="bg-amber-100 px-1 rounded text-xs">NEVERBOUNCE_API_KEY</code> in Railway env</span>
                        </div>
                    </div>
                </div>

                {/* Campaign list */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-sm font-black text-zinc-900">Campaigns ({campaigns.length})</h2>
                        <button
                            onClick={fetchCampaigns}
                            className="text-xs font-bold text-zinc-400 hover:text-zinc-700 flex items-center gap-1"
                        >
                            <RefreshCw className="w-3 h-3" /> Refresh
                        </button>
                    </div>

                    {loading ? (
                        <div className="py-12 flex justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                        </div>
                    ) : campaigns.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-dashed border-zinc-300 p-12 text-center">
                            <Mail className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                            <p className="font-black text-zinc-500">No campaigns yet</p>
                            <p className="text-sm text-zinc-400 mt-1 mb-4">Upload a CSV of scraped businesses to get started</p>
                            <button
                                onClick={() => setShowCreate(true)}
                                className="inline-flex items-center gap-2 h-10 px-5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-sm transition-colors"
                            >
                                <Plus className="w-4 h-4" /> Create First Campaign
                            </button>
                        </div>
                    ) : (
                        campaigns.map(c => (
                            <CampaignRow key={c.id} campaign={c} onRefresh={fetchCampaigns} />
                        ))
                    )}
                </div>

                {/* Deliverability guide */}
                <div className="mt-8 bg-white rounded-2xl border border-zinc-200 p-5">
                    <h3 className="text-sm font-black text-zinc-900 mb-3 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-green-500" /> Deliverability Rules
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {[
                            { good: true, text: "Max 20 emails/day per mailbox" },
                            { good: true, text: "Plain text only — no HTML, no images" },
                            { good: true, text: "No tracking pixels or click tracking" },
                            { good: true, text: "NeverBounce verify before every send" },
                            { good: false, text: "Never use traderefer.au as sending domain" },
                            { good: false, text: "Never send to invalid or disposable emails" },
                            { good: false, text: "Pause if bounce rate exceeds 5%" },
                            { good: false, text: "Pause if spam complaints exceed 0.1%" },
                        ].map((r, i) => (
                            <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-xl ${r.good ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                                {r.good ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
                                <span className="font-medium">{r.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {showCreate && (
                <CreateCampaignModal
                    onClose={() => setShowCreate(false)}
                    onCreated={() => { setShowCreate(false); fetchCampaigns(); }}
                />
            )}
        </div>
    );
}
