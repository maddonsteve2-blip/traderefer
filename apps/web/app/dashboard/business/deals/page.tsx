"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Sparkles,
    Plus,
    Trash2,
    Tag,
    Clock,
    ToggleLeft,
    ToggleRight,
    Loader2,
    Check,
    ChevronLeft,
    Wand2,
    RefreshCw,
    Gift,
    Edit3,
    X
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";

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

export default function BusinessDealsPage() {
    const { getToken } = useAuth();
    const [deals, setDeals] = useState<Deal[]>([]);
    const [loading, setLoading] = useState(true);
    const [businessInfo, setBusinessInfo] = useState<{ business_name: string; trade_category: string; description: string } | null>(null);

    // AI Generation state
    const [showAI, setShowAI] = useState(false);
    const [aiHint, setAiHint] = useState("");
    const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiSource, setAiSource] = useState<"ai" | "template" | null>(null);

    // Manual create state
    const [showCreate, setShowCreate] = useState(false);
    const [newDeal, setNewDeal] = useState({ title: "", description: "", discount_text: "", terms: "" });
    const [saving, setSaving] = useState(false);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    const fetchDeals = async () => {
        try {
            const token = await getToken();
            const res = await fetch(`${apiUrl}/business/deals`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setDeals(data);
            }
        } catch (err) {
            console.error("Failed to fetch deals:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchBusinessInfo = async () => {
        try {
            const token = await getToken();
            const res = await fetch(`${apiUrl}/business/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setBusinessInfo({
                    business_name: data.business_name,
                    trade_category: data.trade_category,
                    description: data.description || ""
                });
            }
        } catch { }
    };

    useEffect(() => {
        fetchDeals();
        fetchBusinessInfo();
    }, []);

    const generateAI = async () => {
        if (!businessInfo) {
            toast.error("Business info not loaded yet.");
            return;
        }
        setAiLoading(true);
        setAiSuggestions([]);
        try {
            const token = await getToken();
            const res = await fetch(`${apiUrl}/business/deals/generate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    business_name: businessInfo.business_name,
                    trade_category: businessInfo.trade_category,
                    description: businessInfo.description,
                    prompt_hint: aiHint || undefined
                })
            });
            if (res.ok) {
                const data = await res.json();
                setAiSuggestions(data.suggestions);
                setAiSource(data.source || "template");
            } else {
                toast.error("Failed to generate suggestions.");
            }
        } catch {
            toast.error("Error generating deals.");
        } finally {
            setAiLoading(false);
        }
    };

    const useSuggestion = (suggestion: AISuggestion) => {
        setNewDeal({
            title: suggestion.title,
            description: suggestion.description,
            discount_text: suggestion.discount_text,
            terms: suggestion.terms
        });
        setShowAI(false);
        setShowCreate(true);
    };

    const saveDeal = async () => {
        if (!newDeal.title.trim()) {
            toast.error("Title is required.");
            return;
        }
        setSaving(true);
        try {
            const token = await getToken();
            const res = await fetch(`${apiUrl}/business/deals`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(newDeal)
            });
            if (res.ok) {
                toast.success("Deal created!");
                setShowCreate(false);
                setNewDeal({ title: "", description: "", discount_text: "", terms: "" });
                fetchDeals();
            } else {
                toast.error("Failed to create deal.");
            }
        } catch {
            toast.error("Error saving deal.");
        } finally {
            setSaving(false);
        }
    };

    const toggleDeal = async (deal: Deal) => {
        try {
            const token = await getToken();
            await fetch(`${apiUrl}/business/deals/${deal.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ is_active: !deal.is_active })
            });
            setDeals(prev => prev.map(d => d.id === deal.id ? { ...d, is_active: !d.is_active } : d));
            toast.success(deal.is_active ? "Deal paused" : "Deal activated");
        } catch {
            toast.error("Failed to update deal.");
        }
    };

    const deleteDeal = async (dealId: string) => {
        if (!confirm("Delete this deal? This can't be undone.")) return;
        try {
            const token = await getToken();
            await fetch(`${apiUrl}/business/deals/${dealId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            setDeals(prev => prev.filter(d => d.id !== dealId));
            toast.success("Deal deleted");
        } catch {
            toast.error("Failed to delete deal.");
        }
    };

    return (
        <main className="min-h-screen bg-zinc-50 pt-24 pb-16">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <Link href="/dashboard/business" className="inline-flex items-center gap-1.5 text-sm font-bold text-zinc-400 hover:text-orange-500 mb-3 transition-colors">
                            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
                        </Link>
                        <h1 className="text-3xl font-black text-zinc-900 tracking-tight">
                            <Gift className="w-7 h-7 inline-block mr-2 text-orange-500" />
                            Deal Cards
                        </h1>
                        <p className="text-sm text-zinc-500 font-medium mt-1">
                            Create offers that referrers can share with their network. More deals = more referrals.
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 mb-8">
                    <Button
                        onClick={() => { setShowAI(true); setShowCreate(false); }}
                        className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white rounded-full px-6 h-11 font-bold shadow-lg shadow-purple-500/20"
                    >
                        <Sparkles className="w-4 h-4 mr-2" /> AI Create Deal
                    </Button>
                    <Button
                        onClick={() => { setShowCreate(true); setShowAI(false); setNewDeal({ title: "", description: "", discount_text: "", terms: "" }); }}
                        variant="outline"
                        className="rounded-full px-6 h-11 font-bold border-zinc-200"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Create Manually
                    </Button>
                </div>

                {/* AI Generator Panel */}
                {showAI && (
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-3xl p-8 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <Wand2 className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-zinc-900">AI Deal Generator</h2>
                                    <p className="text-sm text-zinc-500">Describe what kind of deal you want, or leave blank for smart suggestions.</p>
                                </div>
                            </div>
                            <button onClick={() => setShowAI(false)} className="p-2 hover:bg-white/50 rounded-xl transition-colors">
                                <X className="w-5 h-5 text-zinc-400" />
                            </button>
                        </div>

                        <div className="flex gap-3 mb-6">
                            <input
                                type="text"
                                value={aiHint}
                                onChange={(e) => setAiHint(e.target.value)}
                                placeholder='e.g. "seasonal summer deal", "first-time discount", "bundle package"'
                                className="flex-1 px-5 py-3 bg-white border border-purple-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-400 text-sm font-medium placeholder:text-zinc-300"
                                onKeyDown={(e) => { if (e.key === "Enter") generateAI(); }}
                            />
                            <Button
                                onClick={generateAI}
                                disabled={aiLoading}
                                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6 h-12 font-bold"
                            >
                                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4 mr-2" /> Generate</>}
                            </Button>
                        </div>

                        {/* Quick Prompts */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            {["First-time discount", "Seasonal special", "Free quote", "Bundle deal", "Referral bonus"].map((prompt) => (
                                <button
                                    key={prompt}
                                    onClick={() => { setAiHint(prompt); }}
                                    className="px-4 py-2 bg-white border border-purple-100 rounded-full text-sm font-bold text-purple-600 hover:bg-purple-50 hover:border-purple-200 transition-all"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>

                        {/* AI Suggestions */}
                        {aiSuggestions.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-purple-600 uppercase tracking-wider">Pick a suggestion to customise</p>
                                        {aiSource === "ai" && (
                                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-sm font-bold flex items-center gap-1">
                                                <Sparkles className="w-3 h-3" /> AI-Powered
                                            </span>
                                        )}
                                    </div>
                                    <button onClick={generateAI} className="text-sm font-bold text-purple-500 hover:text-purple-700 flex items-center gap-1 transition-colors">
                                        <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                                    </button>
                                </div>
                                {aiSuggestions.map((suggestion, i) => (
                                    <button
                                        key={i}
                                        onClick={() => useSuggestion(suggestion)}
                                        className="w-full text-left bg-white border border-purple-100 rounded-2xl p-5 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-100/50 transition-all group"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <h3 className="font-bold text-zinc-900 mb-1 group-hover:text-purple-700 transition-colors">{suggestion.title}</h3>
                                                <p className="text-sm text-zinc-500 leading-relaxed mb-2">{suggestion.description}</p>
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-bold border border-green-100">
                                                    <Tag className="w-3.5 h-3.5" /> {suggestion.discount_text}
                                                </span>
                                            </div>
                                            <div className="p-2 bg-purple-50 rounded-xl text-purple-500 group-hover:bg-purple-100 transition-colors shrink-0">
                                                <Edit3 className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {aiLoading && (
                            <div className="flex items-center justify-center py-12 gap-3">
                                <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                                <span className="text-sm font-bold text-purple-500">Generating deal ideas...</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Create Deal Form */}
                {showCreate && (
                    <div className="bg-white border-2 border-orange-200 rounded-3xl p-8 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-orange-500" /> {newDeal.title ? "Customise Your Deal" : "Create New Deal"}
                            </h2>
                            <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-zinc-100 rounded-xl transition-colors">
                                <X className="w-5 h-5 text-zinc-400" />
                            </button>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Deal Title *</label>
                                <input
                                    type="text"
                                    value={newDeal.title}
                                    onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })}
                                    placeholder="e.g. 15% Off Your First Plumbing Job"
                                    className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 text-sm font-medium placeholder:text-zinc-300"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Description</label>
                                <textarea
                                    value={newDeal.description}
                                    onChange={(e) => setNewDeal({ ...newDeal, description: e.target.value })}
                                    placeholder="Describe your offer in detail..."
                                    rows={3}
                                    className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 text-sm font-medium placeholder:text-zinc-300 resize-none"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Discount Badge Text</label>
                                    <input
                                        type="text"
                                        value={newDeal.discount_text}
                                        onChange={(e) => setNewDeal({ ...newDeal, discount_text: e.target.value })}
                                        placeholder="e.g. 15% off first job"
                                        className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 text-sm font-medium placeholder:text-zinc-300"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Terms</label>
                                    <input
                                        type="text"
                                        value={newDeal.terms}
                                        onChange={(e) => setNewDeal({ ...newDeal, terms: e.target.value })}
                                        placeholder="e.g. TradeRefer referrals only"
                                        className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 text-sm font-medium placeholder:text-zinc-300"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mt-8">
                            <Button
                                onClick={saveDeal}
                                disabled={saving || !newDeal.title.trim()}
                                className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-8 h-11 font-bold shadow-lg shadow-orange-500/20"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                                {saving ? "Saving..." : "Publish Deal"}
                            </Button>
                            <Button
                                onClick={() => setShowCreate(false)}
                                variant="ghost"
                                className="rounded-full px-6 h-11 font-bold text-zinc-500"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}

                {/* Existing Deals */}
                {loading ? (
                    <div className="flex items-center justify-center py-20 gap-3">
                        <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                        <span className="text-sm font-bold text-zinc-400">Loading deals...</span>
                    </div>
                ) : deals.length === 0 && !showCreate && !showAI ? (
                    <div className="bg-white rounded-3xl border border-zinc-200 p-12 text-center">
                        <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Gift className="w-8 h-8 text-orange-500" />
                        </div>
                        <h2 className="text-xl font-bold text-zinc-900 mb-2">No deals yet</h2>
                        <p className="text-sm text-zinc-500 mb-6 max-w-md mx-auto">
                            Create your first deal to give referrers something compelling to share. Use AI to generate professional offers in seconds.
                        </p>
                        <Button
                            onClick={() => setShowAI(true)}
                            className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white rounded-full px-8 h-11 font-bold shadow-lg shadow-purple-500/20"
                        >
                            <Sparkles className="w-4 h-4 mr-2" /> Create Your First Deal with AI
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {deals.length > 0 && (
                            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Your Deals ({deals.length})</h2>
                        )}
                        {deals.map((deal) => (
                            <div
                                key={deal.id}
                                className={`bg-white rounded-2xl border p-6 transition-all ${deal.is_active ? 'border-zinc-200 shadow-sm' : 'border-zinc-100 opacity-60'}`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-bold text-zinc-900 text-lg truncate">{deal.title}</h3>
                                            {deal.is_active ? (
                                                <span className="px-2.5 py-0.5 bg-green-50 text-green-700 rounded-full text-sm font-bold border border-green-100 shrink-0">Active</span>
                                            ) : (
                                                <span className="px-2.5 py-0.5 bg-zinc-100 text-zinc-500 rounded-full text-sm font-bold border border-zinc-200 shrink-0">Paused</span>
                                            )}
                                        </div>
                                        {deal.description && (
                                            <p className="text-sm text-zinc-500 leading-relaxed mb-3 line-clamp-2">{deal.description}</p>
                                        )}
                                        <div className="flex flex-wrap items-center gap-3">
                                            {deal.discount_text && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-bold border border-green-100">
                                                    <Tag className="w-3.5 h-3.5" /> {deal.discount_text}
                                                </span>
                                            )}
                                            {deal.expires_at && (
                                                <span className="inline-flex items-center gap-1.5 text-sm text-zinc-400 font-medium">
                                                    <Clock className="w-3.5 h-3.5" /> Expires {new Date(deal.expires_at).toLocaleDateString('en-AU')}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => toggleDeal(deal)}
                                            className={`p-2.5 rounded-xl transition-colors ${deal.is_active ? 'hover:bg-zinc-100 text-green-600' : 'hover:bg-green-50 text-zinc-400'}`}
                                            title={deal.is_active ? "Pause deal" : "Activate deal"}
                                        >
                                            {deal.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                                        </button>
                                        <button
                                            onClick={() => deleteDeal(deal.id)}
                                            className="p-2.5 hover:bg-red-50 text-zinc-400 hover:text-red-500 rounded-xl transition-colors"
                                            title="Delete deal"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
