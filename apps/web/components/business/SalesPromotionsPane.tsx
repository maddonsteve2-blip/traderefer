"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState, useCallback } from "react";
import {
    Plus, Loader2, Zap, DollarSign, TrendingUp, Gift, X,
    CheckCircle, Megaphone, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import posthog from "posthog-js";

interface Campaign {
    id: string;
    title: string;
    description: string | null;
    campaign_type: "flat_bonus" | "multiplier" | "volume_bonus" | "first_referral";
    is_active: boolean;
    bonus_amount_cents: number;
    multiplier: number;
    volume_threshold: number | null;
    promo_text: string | null;
    starts_at: string;
    ends_at: string;
}

const TYPE_OPTIONS = [
    { value: "flat_bonus", label: "Flat Bonus", desc: "Fixed $ per lead", icon: DollarSign },
    { value: "multiplier", label: "Multiplier", desc: "e.g. 2× commission", icon: TrendingUp },
    { value: "volume_bonus", label: "Volume Bonus", desc: "Bonus for X+ leads", icon: Zap },
    { value: "first_referral", label: "First Referral", desc: "Bonus for first lead", icon: Gift },
] as const;

function campaignLabel(c: Campaign) {
    switch (c.campaign_type) {
        case "flat_bonus": return `+$${(c.bonus_amount_cents / 100).toFixed(0)} per lead`;
        case "multiplier": return `${c.multiplier}× commission`;
        case "volume_bonus": return `$${(c.bonus_amount_cents / 100).toFixed(0)} bonus for ${c.volume_threshold}+ leads`;
        case "first_referral": return `$${(c.bonus_amount_cents / 100).toFixed(0)} first referral bonus`;
        default: return c.title;
    }
}

function isExpired(c: Campaign) {
    return new Date(c.ends_at) < new Date();
}

function fmtDate(d: string) {
    return new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

export function SalesPromotionsPane() {
    const { getToken } = useAuth();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        title: "",
        description: "",
        campaign_type: "flat_bonus",
        bonus_amount_cents: 1000,
        multiplier: 2.0,
        volume_threshold: 5,
        promo_text: "",
        ends_at: "",
    });

    // Deletion state
    const [promoToDelete, setPromoToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const apiUrl = "/api/backend";

    const fetchCampaigns = useCallback(async () => {
        const token = await getToken();
        const res = await fetch(`${apiUrl}/business/campaigns`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setCampaigns(await res.json());
        else toast.error("Failed to load campaigns");
        setLoading(false);
    }, [getToken, apiUrl]);

    useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

    const handleCreate = async () => {
        if (!form.title.trim()) { toast.error("Title is required"); return; }
        if (!form.ends_at) { toast.error("End date is required"); return; }
        setSaving(true);
        const token = await getToken();
        const body: Record<string, unknown> = {
            title: form.title,
            description: form.description || null,
            campaign_type: form.campaign_type,
            promo_text: form.promo_text || null,
            ends_at: new Date(form.ends_at).toISOString(),
        };
        if (form.campaign_type === "flat_bonus" || form.campaign_type === "first_referral") body.bonus_amount_cents = form.bonus_amount_cents;
        else if (form.campaign_type === "multiplier") body.multiplier = form.multiplier;
        else if (form.campaign_type === "volume_bonus") { body.bonus_amount_cents = form.bonus_amount_cents; body.volume_threshold = form.volume_threshold; }

        const res = await fetch(`${apiUrl}/business/campaigns`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(body),
        });
        if (res.ok) {
            posthog.capture("campaign_created", { campaign_type: form.campaign_type });
            toast.success("Campaign created!");
            setShowCreate(false);
            setForm({ title: "", description: "", campaign_type: "flat_bonus", bonus_amount_cents: 1000, multiplier: 2.0, volume_threshold: 5, promo_text: "", ends_at: "" });
            fetchCampaigns();
        } else {
            const err = await res.json().catch(() => ({}));
            toast.error(err.detail || "Failed to create campaign");
        }
        setSaving(false);
    };

    const handleToggle = async (id: string, active: boolean) => {
        const token = await getToken();
        await fetch(`${apiUrl}/business/campaigns/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ is_active: !active }),
        });
        fetchCampaigns();
    };

    const handleDelete = async (id: string) => {
        setIsDeleting(true);
        const token = await getToken();
        await fetch(`${apiUrl}/business/campaigns/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
        toast.success("Campaign deleted");
        fetchCampaigns();
        setIsDeleting(false);
        setPromoToDelete(null);
    };

    const activeCampaigns = campaigns.filter(c => c.is_active && !isExpired(c));
    const pastCampaigns = campaigns.filter(c => !c.is_active || isExpired(c));

    if (loading) {
        return <div className="flex items-center justify-center flex-1"><Loader2 className="w-8 h-8 text-orange-500 animate-spin" /></div>;
    }

    return (
        <div className="flex-1 overflow-y-auto bg-zinc-50 pb-8">
            <ConfirmationDialog
                open={!!promoToDelete}
                onOpenChange={(open) => !open && setPromoToDelete(null)}
                onConfirm={() => promoToDelete && handleDelete(promoToDelete)}
                title="Delete Campaign?"
                description="The bonus will be immediately removed. Referrers will no longer see this incentive in their dashboard."
                confirmText="Delete Campaign"
                variant="destructive"
                isLoading={isDeleting}
            />
            <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">

                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="font-black text-zinc-900 text-3xl">Campaigns</h2>
                        <p className="text-zinc-500 font-medium text-xl">Time-limited bonuses to motivate your referral force</p>
                    </div>
                    <Button onClick={() => setShowCreate(true)} className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-6 h-14 font-bold text-xl">
                        <Plus className="w-5 h-5 mr-2" />New Campaign
                    </Button>
                </div>

                {/* Create modal */}
                {showCreate && (
                    <div className="bg-white border-2 border-orange-200 rounded-3xl p-7 space-y-5">
                        <div className="flex items-center justify-between">
                            <h3 className="font-black text-zinc-900 flex items-center gap-2 text-2xl">
                                <Megaphone className="w-6 h-6 text-orange-500" />Create Campaign
                            </h3>
                            <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-zinc-100 rounded-xl"><X className="w-6 h-6 text-zinc-400" /></button>
                        </div>

                        {/* Type picker */}
                        <div>
                            <label className="block font-bold text-zinc-400 uppercase tracking-wider mb-2 text-base">Campaign Type</label>
                            <div className="grid grid-cols-2 gap-2">
                                {TYPE_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setForm({ ...form, campaign_type: opt.value })}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${form.campaign_type === opt.value ? "border-orange-500 bg-orange-50" : "border-zinc-100 hover:border-zinc-200"}`}
                                    >
                                        <opt.icon className={`w-5 h-5 mb-1 ${form.campaign_type === opt.value ? "text-orange-500" : "text-zinc-400"}`} />
                                        <div className="font-bold text-zinc-900 text-xl">{opt.label}</div>
                                        <div className="text-zinc-400 font-medium text-base">{opt.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Title */}
                        <div>
                            <label className="block font-bold text-zinc-400 uppercase tracking-wider mb-1.5 text-base">Campaign Title *</label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                placeholder="e.g. Double Commission Weekend"
                                className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-xl font-medium placeholder:text-zinc-300 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 text-xl"
                            />
                        </div>

                        {/* Type-specific fields */}
                        {(form.campaign_type === "flat_bonus" || form.campaign_type === "first_referral") && (
                            <div>
                                <label className="block font-bold text-zinc-400 uppercase tracking-wider mb-1.5 text-base">Bonus Amount ($)</label>
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={form.bonus_amount_cents / 100}
                                    onChange={e => setForm({ ...form, bonus_amount_cents: Math.round(parseFloat(e.target.value || "0") * 100) })}
                                    className="w-48 px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 text-2xl"
                                />
                            </div>
                        )}
                        {form.campaign_type === "multiplier" && (
                            <div>
                                <label className="block font-bold text-zinc-400 uppercase tracking-wider mb-1.5 text-base">Multiplier (×)</label>
                                <input
                                    type="number"
                                    min="1.5"
                                    step="0.5"
                                    value={form.multiplier}
                                    onChange={e => setForm({ ...form, multiplier: parseFloat(e.target.value || "1") })}
                                    className="w-40 px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 text-2xl"
                                />
                            </div>
                        )}
                        {form.campaign_type === "volume_bonus" && (
                            <div className="flex gap-4">
                                <div>
                                    <label className="block font-bold text-zinc-400 uppercase tracking-wider mb-1.5 text-base">Bonus Amount ($)</label>
                                    <input
                                        type="number" min="1" step="1"
                                        value={form.bonus_amount_cents / 100}
                                        onChange={e => setForm({ ...form, bonus_amount_cents: Math.round(parseFloat(e.target.value || "0") * 100) })}
                                        className="w-40 px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 text-2xl"
                                    />
                                </div>
                                <div>
                                     <label className="block font-bold text-zinc-400 uppercase tracking-wider mb-1.5 text-lg">Lead Threshold</label>
                                    <input
                                        type="number" min="1"
                                        value={form.volume_threshold}
                                        onChange={e => setForm({ ...form, volume_threshold: parseInt(e.target.value || "1") })}
                                        className="w-32 px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 text-2xl"
                                    />
                                </div>
                            </div>
                        )}

                        {/* End date */}
                        <div>
                            <label className="block font-bold text-zinc-400 uppercase tracking-wider mb-1.5 text-base">End Date *</label>
                            <input
                                type="datetime-local"
                                value={form.ends_at}
                                onChange={e => setForm({ ...form, ends_at: e.target.value })}
                                className="w-full max-w-[280px] px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-xl font-medium text-zinc-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 text-xl"
                            />
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <Button onClick={handleCreate} disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-8 h-14 font-bold text-xl">
                                {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                                {saving ? "Creating…" : "Launch Campaign"}
                            </Button>
                            <Button onClick={() => setShowCreate(false)} variant="ghost" className="h-14 rounded-full font-bold text-zinc-500 text-xl">Cancel</Button>
                        </div>
                    </div>
                )}

                {/* Active campaigns */}
                {activeCampaigns.length > 0 && (
                    <div className="space-y-3">
                        <p className="font-bold text-zinc-400 uppercase tracking-wider text-base">Active ({activeCampaigns.length})</p>
                        {activeCampaigns.map(c => (
                            <div key={c.id} className="bg-white rounded-2xl border border-orange-200 p-6 shadow-sm">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                                            <h3 className="font-black text-zinc-900 text-xl">{c.title}</h3>
                                            <span className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full font-bold text-base">{campaignLabel(c)}</span>
                                        </div>
                                        {c.description && <p className="text-zinc-500 font-medium text-xl">{c.description}</p>}
                                        <p className="flex items-center gap-1 text-zinc-400 font-medium mt-1.5 text-lg">
                                            <Clock className="w-4 h-4" />Ends {fmtDate(c.ends_at)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button onClick={() => handleToggle(c.id, c.is_active)} className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-xl font-bold text-zinc-600 transition-all text-xl">
                                            Pause
                                        </button>
                                        <button onClick={() => setPromoToDelete(c.id)} className="p-2.5 hover:bg-red-50 text-zinc-400 hover:text-red-500 rounded-xl transition-colors">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty state */}
                {campaigns.length === 0 && !showCreate && (
                    <div className="bg-white rounded-3xl border border-zinc-200 p-12 text-center">
                        <Megaphone className="w-16 h-16 text-orange-200 mx-auto mb-4" />
                        <h2 className="font-bold text-zinc-900 mb-2 text-3xl">No campaigns yet</h2>
                        <p className="text-zinc-500 font-medium mb-6 text-2xl">Launch a time-limited bonus to drive urgency in your force.</p>
                        <Button onClick={() => setShowCreate(true)} className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-8 h-14 font-bold text-xl">
                            <Plus className="w-5 h-5 mr-2" />Create First Campaign
                        </Button>
                    </div>
                )}

                {/* Past campaigns */}
                {pastCampaigns.length > 0 && (
                    <div className="space-y-3">
                        <p className="font-bold text-zinc-400 uppercase tracking-wider text-xl">Past / Paused</p>
                        {pastCampaigns.map(c => (
                            <div key={c.id} className="bg-white rounded-2xl border border-zinc-100 p-6 opacity-60">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <h3 className="font-bold text-zinc-700 text-2xl">{c.title}</h3>
                                        <p className="text-zinc-400 font-medium text-xl">{campaignLabel(c)} · Ended {fmtDate(c.ends_at)}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isExpired(c) ? null : (
                                            <button onClick={() => handleToggle(c.id, c.is_active)} className="px-4 py-2 bg-zinc-100 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl font-bold text-zinc-600 transition-all text-xl">
                                                Re-activate
                                            </button>
                                        )}
                                        <button onClick={() => setPromoToDelete(c.id)} className="p-2.5 hover:bg-red-50 text-zinc-300 hover:text-red-400 rounded-xl transition-colors">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
