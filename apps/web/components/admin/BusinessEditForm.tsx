"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Save, Loader2, CheckCircle2, ShieldAlert, ShieldCheck, Ban, Play } from "lucide-react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];
const TRADES = [
    "Plumber", "Electrician", "Carpenter", "Painter", "Tiler", "Roofer",
    "Landscaper", "Concreter", "Builder", "Fencer", "Cleaner", "HVAC",
    "Locksmith", "Plasterer", "Glazier", "Demolition", "Flooring",
    "Handyman", "Tree Lopping", "Pest Control", "Pool Builder",
    "Bricklayer", "Cabinet Maker", "Garage Door", "Insulation",
    "Irrigation", "Paving", "Rendering", "Security", "Solar",
    "Stonemason", "Waterproofing", "Welder", "Window Cleaner",
];

interface Props {
    business: any;
}

export function BusinessEditForm({ business }: Props) {
    const { getToken } = useAuth();
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        business_name: business.business_name || "",
        trade_category: business.trade_category || "",
        suburb: business.suburb || "",
        city: business.city || "",
        state: business.state || "",
        status: business.status || "active",
        business_phone: business.business_phone || "",
        business_email: business.business_email || "",
        website: business.website || "",
        description: business.description || "",
        abn: business.abn || "",
        listing_visibility: business.listing_visibility || "public",
    });

    function update(field: string, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
        setSaved(false);
    }

    async function handleSave() {
        setSaving(true);
        setError(null);
        try {
            const token = await getToken();
            const changed: Record<string, string> = {};
            for (const [k, v] of Object.entries(form)) {
                if (v !== (business[k] || "")) changed[k] = v;
            }
            if (Object.keys(changed).length === 0) {
                setSaved(true);
                setSaving(false);
                return;
            }
            const res = await fetch(`${API}/admin/businesses/${business.id}`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify(changed),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Update failed");
            }
            setSaved(true);
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleAction(action: string) {
        setActionLoading(action);
        setError(null);
        try {
            const token = await getToken();
            const res = await fetch(`${API}/admin/businesses/${business.id}/action`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Action failed");
            }
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    }

    return (
        <div className="space-y-6">
            {/* Edit form */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-zinc-900">Edit Business</h3>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-zinc-300 text-white rounded-xl font-bold text-sm transition-colors"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                        {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700 font-bold">{error}</div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Business Name</label>
                        <input type="text" value={form.business_name} onChange={(e) => update("business_name", e.target.value)}
                            className="w-full mt-1 px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400" />
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Trade Category</label>
                        <select value={form.trade_category} onChange={(e) => update("trade_category", e.target.value)}
                            className="w-full mt-1 px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                            <option value="">Select...</option>
                            {TRADES.map((t) => <option key={t} value={t}>{t}</option>)}
                            {!TRADES.includes(form.trade_category) && form.trade_category && (
                                <option value={form.trade_category}>{form.trade_category}</option>
                            )}
                        </select>
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Suburb</label>
                        <input type="text" value={form.suburb} onChange={(e) => update("suburb", e.target.value)}
                            className="w-full mt-1 px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400" />
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">City</label>
                        <input type="text" value={form.city} onChange={(e) => update("city", e.target.value)}
                            className="w-full mt-1 px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400" />
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">State</label>
                        <select value={form.state} onChange={(e) => update("state", e.target.value)}
                            className="w-full mt-1 px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                            {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Status</label>
                        <select value={form.status} onChange={(e) => update("status", e.target.value)}
                            className="w-full mt-1 px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Phone</label>
                        <input type="tel" value={form.business_phone} onChange={(e) => update("business_phone", e.target.value)}
                            className="w-full mt-1 px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400" />
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Email</label>
                        <input type="email" value={form.business_email} onChange={(e) => update("business_email", e.target.value)}
                            className="w-full mt-1 px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400" />
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Website</label>
                        <input type="url" value={form.website} onChange={(e) => update("website", e.target.value)}
                            className="w-full mt-1 px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400" />
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">ABN</label>
                        <input type="text" value={form.abn} onChange={(e) => update("abn", e.target.value)}
                            className="w-full mt-1 px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400" />
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Listing Visibility</label>
                        <select value={form.listing_visibility} onChange={(e) => update("listing_visibility", e.target.value)}
                            className="w-full mt-1 px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                            <option value="public">Public</option>
                            <option value="hidden">Hidden</option>
                            <option value="private">Private</option>
                        </select>
                    </div>
                </div>

                <div className="mt-4">
                    <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Description</label>
                    <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={3}
                        className="w-full mt-1 px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 resize-none" />
                </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                <h3 className="font-bold text-zinc-900 mb-3">Admin Actions</h3>
                <div className="flex flex-wrap gap-2">
                    {business.status === "active" ? (
                        <button onClick={() => handleAction("suspend")} disabled={!!actionLoading}
                            className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl font-bold text-sm transition-colors">
                            {actionLoading === "suspend" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                            Suspend Business
                        </button>
                    ) : (
                        <button onClick={() => handleAction("activate")} disabled={!!actionLoading}
                            className="flex items-center gap-1.5 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl font-bold text-sm transition-colors">
                            {actionLoading === "activate" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                            Activate Business
                        </button>
                    )}
                    {business.is_verified ? (
                        <button onClick={() => handleAction("unverify")} disabled={!!actionLoading}
                            className="flex items-center gap-1.5 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-bold text-sm transition-colors">
                            {actionLoading === "unverify" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                            Remove Verification
                        </button>
                    ) : (
                        <button onClick={() => handleAction("verify")} disabled={!!actionLoading}
                            className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold text-sm transition-colors">
                            {actionLoading === "verify" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                            Verify Business
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
