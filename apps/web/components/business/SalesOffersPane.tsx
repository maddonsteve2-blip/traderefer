"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import {
    Sparkles, Plus, Trash2, Tag, Clock, ToggleLeft, ToggleRight,
    Loader2, Check, Wand2, RefreshCw, Gift, Edit3, X
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { Button } from "@/components/ui/button";

const PREZZEE_CARD = "/images/prezzee/prezzee-smart-card.webp";
const PREZZEE_LOGO = "/images/prezzee/prezzee-logo.svg";

interface Deal {
    id: string;
    title: string;
    description: string | null;
    discount_text: string | null;
    terms: string | null;
    is_active: boolean;
    expires_at: string | null;
    created_at: string;
}

interface AISuggestion {
    title: string;
    description: string;
    discount_text: string;
    terms: string;
}

export function SalesOffersPane() {
    const { getToken } = useAuth();
    const [deals, setDeals] = useState<Deal[]>([]);
    const [loading, setLoading] = useState(true);
    const [businessInfo, setBusinessInfo] = useState<{ business_name: string; trade_category: string; description: string } | null>(null);
    const [walletBalance, setWalletBalance] = useState<number | null>(null);

    const [showAI, setShowAI] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [aiHint, setAiHint] = useState("");
    const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiSource, setAiSource] = useState<"ai" | "template" | null>(null);

    const [newDeal, setNewDeal] = useState({ title: "", description: "", discount_text: "", terms: "" });
    const [saving, setSaving] = useState(false);
    
    // Deletion state
    const [dealToDelete, setDealToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const apiUrl = "/api/backend";

    const fetchAll = async () => {
        const token = await getToken();
        const [dealsRes, bizRes] = await Promise.all([
            fetch(`${apiUrl}/business/deals`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${apiUrl}/business/me`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (dealsRes.ok) setDeals(await dealsRes.json());
        if (bizRes.ok) {
            const d = await bizRes.json();
            setBusinessInfo({ business_name: d.business_name, trade_category: d.trade_category, description: d.description || "" });
            setWalletBalance(d.wallet_balance_cents ?? null);
        }
        setLoading(false);
    };

    useEffect(() => { fetchAll(); }, []);

    const generateAI = async () => {
        if (!businessInfo) { toast.error("Business info not loaded yet."); return; }
        setAiLoading(true);
        setAiSuggestions([]);
        const token = await getToken();
        const res = await fetch(`${apiUrl}/business/deals/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ business_name: businessInfo.business_name, trade_category: businessInfo.trade_category, description: businessInfo.description, prompt_hint: aiHint || undefined }),
        });
        if (res.ok) { const d = await res.json(); setAiSuggestions(d.suggestions); setAiSource(d.source || "template"); }
        else toast.error("Failed to generate suggestions.");
        setAiLoading(false);
    };

    const useSuggestion = (s: AISuggestion) => {
        setNewDeal({ title: s.title, description: s.description, discount_text: s.discount_text, terms: s.terms });
        setShowAI(false);
        setShowCreate(true);
    };

    const saveDeal = async () => {
        if (!newDeal.title.trim()) { toast.error("Title is required."); return; }
        setSaving(true);
        const token = await getToken();
        const res = await fetch(`${apiUrl}/business/deals`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(newDeal),
        });
        if (res.ok) { toast.success("Deal created!"); setShowCreate(false); setNewDeal({ title: "", description: "", discount_text: "", terms: "" }); fetchAll(); }
        else toast.error("Failed to create deal.");
        setSaving(false);
    };

    const toggleDeal = async (deal: Deal) => {
        const token = await getToken();
        await fetch(`${apiUrl}/business/deals/${deal.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ is_active: !deal.is_active }),
        });
        setDeals(prev => prev.map(d => d.id === deal.id ? { ...d, is_active: !d.is_active } : d));
        toast.success(deal.is_active ? "Deal paused" : "Deal activated");
    };

    const deleteDeal = async (dealId: string) => {
        setIsDeleting(true);
        const token = await getToken();
        await fetch(`${apiUrl}/business/deals/${dealId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
        setDeals(prev => prev.filter(d => d.id !== dealId));
        toast.success("Deal deleted");
        setIsDeleting(false);
        setDealToDelete(null);
    };

    if (loading) {
        return <div className="flex items-center justify-center flex-1"><Loader2 className="w-8 h-8 text-orange-500 animate-spin" /></div>;
    }

    return (
        <div className="flex-1 overflow-y-auto bg-zinc-50 pb-8">
            <ConfirmationDialog
                open={!!dealToDelete}
                onOpenChange={(open) => !open && setDealToDelete(null)}
                onConfirm={() => dealToDelete && deleteDeal(dealToDelete)}
                title="Delete Deal?"
                description="This will permanently remove this offer from your public profile and discovery results."
                confirmText="Delete Deal"
                variant="destructive"
                isLoading={isDeleting}
            />
            <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">

                {/* Prezzee Rewards Balance widget */}
                <div className="bg-[#0F172A] rounded-3xl p-6 flex items-center gap-5 overflow-hidden relative">
                    <div className="absolute right-0 top-0 bottom-0 w-48 opacity-20 pointer-events-none flex items-center justify-end pr-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={PREZZEE_CARD} alt="" className="h-24 w-auto object-contain" />
                    </div>
                    <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 bg-white/10 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={PREZZEE_CARD} alt="Prezzee" className="h-14 w-auto object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={PREZZEE_LOGO} alt="Prezzee" className="h-4 w-auto brightness-0 invert" />
                            <span className="font-bold text-zinc-400 text-lg">Rewards Wallet</span>
                        </div>
                        <p className="font-black text-white text-4xl">
                            {walletBalance != null ? `$${(walletBalance / 100).toFixed(2)}` : "—"}
                        </p>
                        <p className="font-medium text-zinc-400 mt-0.5 text-xl">
                            Distributes automatically to referrers on milestones
                        </p>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 flex-wrap">
                    <Button
                        onClick={() => { setShowAI(true); setShowCreate(false); }}
                        className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-8 h-14 font-bold shadow-lg shadow-orange-500/20 text-xl"
                    >
                        <Sparkles className="w-5 h-5 mr-2" /> AI Create Deal
                    </Button>
                    <Button
                        onClick={() => { setShowCreate(true); setShowAI(false); setNewDeal({ title: "", description: "", discount_text: "", terms: "" }); }}
                        variant="outline"
                        className="rounded-full px-8 h-14 font-bold border-zinc-200 text-xl"
                    >
                        <Plus className="w-5 h-5 mr-2" /> Create Manually
                    </Button>
                </div>

                {/* AI Generator Panel */}
                {showAI && (
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-3xl p-8">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                    <Wand2 className="w-6 h-6 text-orange-600" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-zinc-900 text-2xl">AI Deal Generator</h2>
                                    <p className="text-zinc-500 font-medium text-xl">Describe what kind of deal you want, or leave blank.</p>
                                </div>
                            </div>
                            <button onClick={() => setShowAI(false)} className="p-2 hover:bg-white/50 rounded-xl transition-colors">
                                <X className="w-5 h-5 text-zinc-400" />
                            </button>
                        </div>
                        <div className="flex gap-3 mb-4">
                            <input
                                type="text"
                                value={aiHint}
                                onChange={e => setAiHint(e.target.value)}
                                placeholder='e.g. "seasonal summer deal", "first-time discount"'
                                className="flex-1 px-5 py-4 bg-white border border-orange-200 rounded-xl font-medium placeholder:text-zinc-300 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 text-xl"
                                onKeyDown={e => { if (e.key === "Enter") generateAI(); }}
                            />
                            <Button onClick={generateAI} disabled={aiLoading} className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-6 h-14 font-bold text-xl">
                                {aiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5 mr-2" />Generate</>}
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {["First-time discount", "Seasonal special", "Free quote", "Bundle deal"].map(p => (
                                <button key={p} onClick={() => setAiHint(p)} className="px-3 py-1.5 bg-white border border-orange-100 rounded-full font-bold text-orange-600 hover:bg-orange-50 transition-all text-base">
                                    {p}
                                </button>
                            ))}
                        </div>
                        {aiLoading && <div className="flex items-center justify-center py-8 gap-3"><Loader2 className="w-5 h-5 text-purple-500 animate-spin" /><span className="font-bold text-purple-500 text-lg">Generating…</span></div>}
                        {aiSuggestions.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="font-bold text-orange-600 uppercase tracking-wider text-lg">Pick a suggestion</p>
                                    {aiSource === "ai" && <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-bold text-lg"><Sparkles className="w-4 h-4" />AI</span>}
                                    <button onClick={generateAI} className="flex items-center gap-1 font-bold text-orange-500 hover:text-orange-700 transition-colors text-lg"><RefreshCw className="w-4 h-4" />Regenerate</button>
                                </div>
                                {aiSuggestions.map((s, i) => (
                                    <button key={i} onClick={() => useSuggestion(s)} className="w-full text-left bg-white border border-purple-100 rounded-2xl p-6 hover:border-purple-300 hover:shadow-md transition-all group">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <h3 className="font-bold text-zinc-900 mb-1 group-hover:text-purple-700 text-xl">{s.title}</h3>
                                                <p className="text-zinc-500 font-medium mb-2 text-xl">{s.description}</p>
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full font-bold border border-green-100 text-lg">
                                                    <Tag className="w-4 h-4" />{s.discount_text}
                                                </span>
                                            </div>
                                            <div className="p-2 bg-orange-50 rounded-xl text-orange-500 group-hover:bg-orange-100 transition-colors shrink-0">
                                                <Edit3 className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Create form */}
                {showCreate && (
                    <div className="bg-white border-2 border-orange-200 rounded-3xl p-8">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="font-bold text-zinc-900 flex items-center gap-2 text-2xl">
                                <Plus className="w-6 h-6 text-orange-500" />{newDeal.title ? "Customise Deal" : "Create New Deal"}
                            </h2>
                            <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-zinc-100 rounded-xl">
                                <X className="w-6 h-6 text-zinc-400" />
                            </button>
                        </div>
                        <div className="space-y-5">
                            {[
                                { label: "Deal Title *", key: "title", placeholder: "e.g. 15% Off Your First Plumbing Job" },
                                { label: "Discount Badge", key: "discount_text", placeholder: "e.g. 15% off first job" },
                                { label: "Terms", key: "terms", placeholder: "e.g. TradeRefer referrals only" },
                            ].map(f => (
                                <div key={f.key}>
                                    <label className="block font-bold text-zinc-400 uppercase tracking-wider mb-1.5 text-lg">{f.label}</label>
                                    <input
                                        type="text"
                                        value={newDeal[f.key as keyof typeof newDeal]}
                                        onChange={e => setNewDeal({ ...newDeal, [f.key]: e.target.value })}
                                        placeholder={f.placeholder}
                                        className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-xl font-medium placeholder:text-zinc-300 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 text-xl"
                                    />
                                </div>
                            ))}
                            <div>
                                <label className="block font-bold text-zinc-400 uppercase tracking-wider mb-1.5 text-lg">Description</label>
                                <textarea
                                    value={newDeal.description}
                                    onChange={e => setNewDeal({ ...newDeal, description: e.target.value })}
                                    placeholder="Describe your offer…"
                                    rows={3}
                                    className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-xl font-medium placeholder:text-zinc-300 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 resize-none text-xl"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-3 mt-8">
                            <Button onClick={saveDeal} disabled={saving || !newDeal.title.trim()} className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-8 h-14 font-bold text-xl">
                                {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Check className="w-5 h-5 mr-2" />}
                                {saving ? "Saving…" : "Publish Deal"}
                            </Button>
                            <Button onClick={() => setShowCreate(false)} variant="ghost" className="rounded-full h-14 font-bold text-zinc-500 text-xl">Cancel</Button>
                        </div>
                    </div>
                )}

                {/* Deals list */}
                {deals.length === 0 && !showCreate && !showAI ? (
                    <div className="bg-white rounded-3xl border border-zinc-200 p-12 text-center">
                        <Gift className="w-16 h-16 text-orange-300 mx-auto mb-4" />
                        <h2 className="font-bold text-zinc-900 mb-2 text-3xl">No deals yet</h2>
                        <p className="text-zinc-500 font-medium mb-6 text-2xl">Create your first deal to give referrers something to share.</p>
                        <Button onClick={() => setShowAI(true)} className="bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-full px-8 h-14 font-bold text-xl">
                            <Sparkles className="w-5 h-5 mr-2" />Create with AI
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {deals.length > 0 && <p className="font-bold text-zinc-400 uppercase tracking-wider text-lg">Your Deals ({deals.length})</p>}
                        {deals.map(deal => (
                            <div key={deal.id} className={`bg-white rounded-2xl border p-6 transition-all ${deal.is_active ? "border-zinc-200 shadow-sm" : "border-zinc-100 opacity-60"}`}>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                            <h3 className="font-bold text-zinc-900 text-2xl">{deal.title}</h3>
                                            <span className={`px-3 py-1 rounded-full font-bold border ${deal.is_active ? "bg-green-50 text-green-700 border-green-100" : "bg-zinc-100 text-zinc-500 border-zinc-200"} text-lg`} >
                                                {deal.is_active ? "Active" : "Paused"}
                                            </span>
                                        </div>
                                        {deal.description && <p className="text-zinc-500 font-medium line-clamp-2 mb-2 text-xl">{deal.description}</p>}
                                        <div className="flex flex-wrap items-center gap-3">
                                            {deal.discount_text && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full font-bold border border-green-100 text-lg">
                                                    <Tag className="w-4 h-4" />{deal.discount_text}
                                                </span>
                                            )}
                                            {deal.expires_at && (
                                                <span className="flex items-center gap-1.5 text-zinc-400 font-medium text-lg">
                                                    <Clock className="w-4 h-4" />Expires {new Date(deal.expires_at).toLocaleDateString("en-AU")}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button onClick={() => toggleDeal(deal)} className={`p-3 rounded-xl transition-colors ${deal.is_active ? "hover:bg-zinc-100 text-green-600" : "hover:bg-green-50 text-zinc-400"}`}>
                                            {deal.is_active ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                                        </button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setDealToDelete(deal.id)}
                                            className="text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl"
                                        >
                                            <Trash2 className="w-6 h-6" />
                                        </Button>
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
