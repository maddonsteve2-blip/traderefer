"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

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

export default function AddBusinessPage() {
    const { getToken } = useAuth();
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [created, setCreated] = useState<{ id: string; slug: string } | null>(null);

    const [form, setForm] = useState({
        business_name: "",
        trade_category: "",
        suburb: "",
        city: "",
        state: "VIC",
        business_phone: "",
        business_email: "",
        website: "",
        description: "",
        abn: "",
    });

    function update(field: string, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.business_name || !form.trade_category || !form.suburb || !form.state) {
            setError("Business name, trade category, suburb, and state are required.");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const token = await getToken();
            const res = await fetch(`${API}/admin/businesses/create`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    city: form.city || form.suburb,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Create failed");
            setCreated(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    if (created) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
                <div className="bg-white rounded-2xl border border-zinc-200 p-8 shadow-sm max-w-md w-full text-center">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h2 className="text-xl font-black text-zinc-900 mb-2">Business Created!</h2>
                    <p className="text-zinc-500 text-sm mb-6">
                        <span className="font-bold">{form.business_name}</span> has been added to the directory.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <Link href={`/admin/directory/${created.id}`}
                            className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-sm transition-colors">
                            Edit Business
                        </Link>
                        <Link href="/admin/directory"
                            className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-bold text-sm transition-colors">
                            Back to Directory
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-3xl mx-auto">
                <Link href="/admin/directory" className="inline-flex items-center gap-1.5 text-sm font-bold text-zinc-500 hover:text-zinc-800 mb-4 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Directory
                </Link>

                <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                    <h1 className="text-xl font-black text-zinc-900 mb-1 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-orange-600" /> Add Business Manually
                    </h1>
                    <p className="text-zinc-500 text-sm mb-6">Create a new business listing in the directory.</p>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700 font-bold">{error}</div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Business Name *</label>
                                <input type="text" value={form.business_name} onChange={(e) => update("business_name", e.target.value)} required
                                    className="w-full mt-1 px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400" />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Trade Category *</label>
                                <select value={form.trade_category} onChange={(e) => update("trade_category", e.target.value)} required
                                    className="w-full mt-1 px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                                    <option value="">Select trade...</option>
                                    {TRADES.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Suburb *</label>
                                <input type="text" value={form.suburb} onChange={(e) => update("suburb", e.target.value)} required
                                    className="w-full mt-1 px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400" />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">City</label>
                                <input type="text" value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Same as suburb if blank"
                                    className="w-full mt-1 px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400" />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">State *</label>
                                <select value={form.state} onChange={(e) => update("state", e.target.value)} required
                                    className="w-full mt-1 px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                                    {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">ABN</label>
                                <input type="text" value={form.abn} onChange={(e) => update("abn", e.target.value)}
                                    className="w-full mt-1 px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400" />
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
                            <div className="md:col-span-2">
                                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Website</label>
                                <input type="url" value={form.website} onChange={(e) => update("website", e.target.value)}
                                    className="w-full mt-1 px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Description</label>
                                <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={3}
                                    className="w-full mt-1 px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 resize-none" />
                            </div>
                        </div>

                        <button type="submit" disabled={saving}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-zinc-300 text-white rounded-xl font-bold text-sm transition-colors">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            {saving ? "Creating..." : "Create Business"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
