"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
    Plus, Trash2, Loader2, Zap, TrendingUp, Users, Gift,
    Calendar, Megaphone, X, Flame, Clock
} from "lucide-react";
import { toast } from "sonner";
import posthog from "posthog-js";

interface Campaign {
    id: string;
    title: string;
    description: string | null;
    campaign_type: string;
    bonus_amount_cents: number;
    multiplier: number;
    volume_threshold: number | null;
    promo_text: string | null;
    starts_at: string;
    ends_at: string;
    is_active: boolean;
}

const TYPE_OPTIONS = [
    { value: "flat_bonus", label: "Flat Bonus", desc: "Extra $ per lead during campaign", icon: Gift },
    { value: "multiplier", label: "Commission Multiplier", desc: "2x, 3x commission weekend", icon: TrendingUp },
    { value: "volume_bonus", label: "Volume Bonus", desc: "Bonus for hitting lead targets", icon: Users },
    { value: "first_referral", label: "First Referral Bonus", desc: "Bonus for new referrers' first lead", icon: Zap },
];

function formatType(type: string) {
    return TYPE_OPTIONS.find(t => t.value === type)?.label || type;
}

function formatBadge(c: Campaign) {
    switch (c.campaign_type) {
        case "flat_bonus": return `+$${(c.bonus_amount_cents / 100).toFixed(0)} per lead`;
        case "multiplier": return `${c.multiplier}x commission`;
        case "volume_bonus": return `$${(c.bonus_amount_cents / 100).toFixed(0)} bonus for ${c.volume_threshold}+ leads`;
        case "first_referral": return `$${(c.bonus_amount_cents / 100).toFixed(0)} first referral bonus`;
        default: return c.title;
    }
}

function isExpired(c: Campaign) {
    return new Date(c.ends_at) < new Date();
}

export default function CampaignsPage() {
    const { getToken } = useAuth();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
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

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    const fetchCampaigns = useCallback(async () => {
        try {
            const token = await getToken();
            const res = await fetch(`${apiUrl}/business/campaigns`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) setCampaigns(await res.json());
        } catch {
            toast.error("Failed to load campaigns");
        } finally {
            setLoading(false);
        }
    }, [getToken, apiUrl]);

    useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

    const handleCreate = async () => {
        if (!form.title.trim()) { toast.error("Title is required"); return; }
        if (!form.ends_at) { toast.error("End date is required"); return; }

        setSaving(true);
        try {
            const token = await getToken();
            const body: any = {
                title: form.title,
                description: form.description || null,
                campaign_type: form.campaign_type,
                promo_text: form.promo_text || null,
                ends_at: new Date(form.ends_at).toISOString(),
            };

            if (form.campaign_type === "flat_bonus" || form.campaign_type === "first_referral") {
                body.bonus_amount_cents = form.bonus_amount_cents;
            } else if (form.campaign_type === "multiplier") {
                body.multiplier = form.multiplier;
            } else if (form.campaign_type === "volume_bonus") {
                body.bonus_amount_cents = form.bonus_amount_cents;
                body.volume_threshold = form.volume_threshold;
            }

            const res = await fetch(`${apiUrl}/business/campaigns`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                posthog.capture('campaign_created', {
                    campaign_type: form.campaign_type,
                    bonus_amount_cents: form.campaign_type !== 'multiplier' ? form.bonus_amount_cents : undefined,
                    multiplier: form.campaign_type === 'multiplier' ? form.multiplier : undefined,
                    volume_threshold: form.campaign_type === 'volume_bonus' ? form.volume_threshold : undefined,
                });
                toast.success("Campaign created!");
                setShowCreate(false);
                setForm({ title: "", description: "", campaign_type: "flat_bonus", bonus_amount_cents: 1000, multiplier: 2.0, volume_threshold: 5, promo_text: "", ends_at: "" });
                fetchCampaigns();
            } else {
                const err = await res.json();
                toast.error(err.detail || "Failed to create campaign");
            }
        } catch {
            toast.error("Error creating campaign");
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (id: string, active: boolean) => {
        posthog.capture('campaign_toggled', {
            campaign_id: id,
            new_state: active ? 'paused' : 'active',
        });
        const token = await getToken();
        await fetch(`${apiUrl}/business/campaigns/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ is_active: !active }),
        });
        fetchCampaigns();
    };

    const handleDelete = async (id: string) => {
        posthog.capture('campaign_deleted', {
            campaign_id: id,
        });
        const token = await getToken();
        await fetch(`${apiUrl}/business/campaigns/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Campaign deleted");
        fetchCampaigns();
    };

    const activeCampaigns = campaigns.filter(c => c.is_active && !isExpired(c));
    const pastCampaigns = campaigns.filter(c => !c.is_active || isExpired(c));
    const selectedType = TYPE_OPTIONS.find(t => t.value === form.campaign_type);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 pt-16">
            <div className="max-w-[1024px] mx-auto px-6 lg:px-0 py-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight">Campaigns</h1>
                        <p className="text-zinc-500 text-lg mt-1">Create time-limited promotions to drive referrer urgency</p>
                    </div>
                    <Button
                        onClick={() => setShowCreate(true)}
                        className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-6 font-bold shadow-lg shadow-orange-500/20"
                    >
                        <Plus className="w-4 h-4 mr-2" /> New Campaign
                    </Button>
                </div>

                {/* Create Campaign Modal */}
                {showCreate && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
                        <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-zinc-900">Create Campaign</h2>
                                <button onClick={() => setShowCreate(false)} className="text-zinc-400 hover:text-zinc-600"><X className="w-5 h-5" /></button>
                            </div>

                            <div className="space-y-5">
                                {/* Campaign Type */}
                                <div>
                                    <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Campaign Type</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {TYPE_OPTIONS.map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setForm({ ...form, campaign_type: opt.value })}
                                                className={`p-3 rounded-xl border-2 text-left transition-all ${
                                                    form.campaign_type === opt.value
                                                        ? "border-orange-500 bg-orange-50"
                                                        : "border-zinc-100 hover:border-zinc-200"
                                                }`}
                                            >
                                                <opt.icon className={`w-4 h-4 mb-1 ${form.campaign_type === opt.value ? "text-orange-500" : "text-zinc-400"}`} />
                                                <div className="text-sm font-bold text-zinc-900">{opt.label}</div>
                                                <div className="text-xs text-zinc-400">{opt.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Title */}
                                <div>
                                    <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Campaign Title</label>
                                    <input
                                        type="text"
                                        className="w-full bg-zinc-50 border-none rounded-xl px-4 py-3 text-zinc-900 font-medium focus:ring-2 focus:ring-orange-500/20"
                                        placeholder="e.g. Double Commission Weekend"
                                        value={form.title}
                                        onChange={e => setForm({ ...form, title: e.target.value })}
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Description</label>
                                    <textarea
                                        rows={2}
                                        className="w-full bg-zinc-50 border-none rounded-xl px-4 py-3 text-zinc-900 font-medium focus:ring-2 focus:ring-orange-500/20 resize-none"
                                        placeholder="Describe the campaign..."
                                        value={form.description}
                                        onChange={e => setForm({ ...form, description: e.target.value })}
                                    />
                                </div>

                                {/* Type-specific fields */}
                                {(form.campaign_type === "flat_bonus" || form.campaign_type === "first_referral") && (
                                    <div>
                                        <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Bonus Amount ($)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-full bg-zinc-50 border-none rounded-xl px-4 py-3 text-zinc-900 font-medium focus:ring-2 focus:ring-orange-500/20"
                                            value={form.bonus_amount_cents / 100}
                                            onChange={e => setForm({ ...form, bonus_amount_cents: Math.round(parseFloat(e.target.value || "0") * 100) })}
                                        />
                                    </div>
                                )}

                                {form.campaign_type === "multiplier" && (
                                    <div>
                                        <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Commission Multiplier</label>
                                        <div className="flex items-center gap-3">
                                            {[1.5, 2, 2.5, 3].map(m => (
                                                <button
                                                    key={m}
                                                    onClick={() => setForm({ ...form, multiplier: m })}
                                                    className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                                                        form.multiplier === m
                                                            ? "bg-orange-500 text-white"
                                                            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                                                    }`}
                                                >
                                                    {m}x
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {form.campaign_type === "volume_bonus" && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Bonus ($)</label>
                                            <input
                                                type="number"
                                                min="1"
                                                className="w-full bg-zinc-50 border-none rounded-xl px-4 py-3 text-zinc-900 font-medium focus:ring-2 focus:ring-orange-500/20"
                                                value={form.bonus_amount_cents / 100}
                                                onChange={e => setForm({ ...form, bonus_amount_cents: Math.round(parseFloat(e.target.value || "0") * 100) })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Lead Target</label>
                                            <input
                                                type="number"
                                                min="1"
                                                className="w-full bg-zinc-50 border-none rounded-xl px-4 py-3 text-zinc-900 font-medium focus:ring-2 focus:ring-orange-500/20"
                                                value={form.volume_threshold}
                                                onChange={e => setForm({ ...form, volume_threshold: parseInt(e.target.value || "5") })}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* End Date */}
                                <div>
                                    <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Campaign End Date</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full bg-zinc-50 border-none rounded-xl px-4 py-3 text-zinc-900 font-medium focus:ring-2 focus:ring-orange-500/20"
                                        value={form.ends_at}
                                        onChange={e => setForm({ ...form, ends_at: e.target.value })}
                                    />
                                </div>

                                {/* Promo Text */}
                                <div>
                                    <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Promo Text for Referrers</label>
                                    <textarea
                                        rows={2}
                                        className="w-full bg-zinc-50 border-none rounded-xl px-4 py-3 text-zinc-900 font-medium focus:ring-2 focus:ring-orange-500/20 resize-none"
                                        placeholder="e.g. Refer 5 people this month and earn a $50 bonus on top!"
                                        value={form.promo_text}
                                        onChange={e => setForm({ ...form, promo_text: e.target.value })}
                                    />
                                </div>

                                <Button
                                    onClick={handleCreate}
                                    disabled={saving}
                                    className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-12 font-bold"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Megaphone className="w-4 h-4 mr-2" />}
                                    Launch Campaign
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Active Campaigns */}
                <div className="mb-10">
                    <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
                        <Flame className="w-5 h-5 text-orange-500" /> Active Campaigns ({activeCampaigns.length})
                    </h2>
                    {activeCampaigns.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-zinc-200 p-10 text-center">
                            <Megaphone className="w-12 h-12 text-zinc-200 mx-auto mb-3" />
                            <p className="text-zinc-400 font-medium">No active campaigns. Create one to boost referrals!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {activeCampaigns.map(c => (
                                <div key={c.id} className="bg-white rounded-2xl border border-zinc-200 p-6 hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-bold text-zinc-900">{c.title}</h3>
                                                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-bold">
                                                    {formatBadge(c)}
                                                </span>
                                            </div>
                                            {c.description && <p className="text-sm text-zinc-500 mb-2">{c.description}</p>}
                                            <div className="flex items-center gap-4 text-sm text-zinc-400">
                                                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Ends {new Date(c.ends_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</span>
                                                <span className="font-medium text-zinc-500">{formatType(c.campaign_type)}</span>
                                            </div>
                                            {c.promo_text && (
                                                <div className="mt-3 p-3 bg-zinc-50 rounded-xl text-sm text-zinc-600 italic">&ldquo;{c.promo_text}&rdquo;</div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 ml-4">
                                            <Button variant="outline" size="sm" className="rounded-full text-sm" onClick={() => handleToggle(c.id, c.is_active)}>
                                                Pause
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-red-500" onClick={() => handleDelete(c.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Past/Paused Campaigns */}
                {pastCampaigns.length > 0 && (
                    <div>
                        <h2 className="text-lg font-bold text-zinc-500 mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-zinc-400" /> Past & Paused ({pastCampaigns.length})
                        </h2>
                        <div className="space-y-3">
                            {pastCampaigns.map(c => (
                                <div key={c.id} className="bg-white rounded-2xl border border-zinc-100 p-5 opacity-60">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-bold text-zinc-700">{c.title}</h3>
                                                <span className="px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded-full text-xs font-bold">
                                                    {isExpired(c) ? "Expired" : "Paused"}
                                                </span>
                                            </div>
                                            <div className="text-sm text-zinc-400 mt-1">{formatType(c.campaign_type)} · {formatBadge(c)}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {!isExpired(c) && (
                                                <Button variant="outline" size="sm" className="rounded-full text-sm" onClick={() => handleToggle(c.id, c.is_active)}>
                                                    Reactivate
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-red-500" onClick={() => handleDelete(c.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
