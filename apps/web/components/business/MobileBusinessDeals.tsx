"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Sparkles, Plus, Trash2, Tag, Loader2, RefreshCw, Gift, ChevronRight, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";

interface Deal {
    id: string;
    title: string;
    description: string | null;
    discount_text: string | null;
    terms: string | null;
    is_active: boolean;
    expires_at: string | null;
}

export function MobileBusinessDeals() {
    const { getToken } = useAuth();
    const [deals, setDeals] = useState<Deal[]>([]);
    const [loading, setLoading] = useState(true);
    const [walletBalance, setWalletBalance] = useState<number | null>(null);

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
            setWalletBalance(d.wallet_balance_cents ?? null);
        }
        setLoading(false);
    };

    useEffect(() => { fetchAll(); }, []);

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

    if (loading) {
        return (
            <div className="lg:hidden h-40 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-orange-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="lg:hidden flex flex-col min-h-screen bg-zinc-50 pb-32 pt-2 px-5">
            <div className="flex flex-col gap-1.5 mb-8">
                <h1 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight leading-none font-display">Special Offers</h1>
                <p className="text-base font-medium text-zinc-500 leading-relaxed">Unique deals that referrers can pitch.</p>
            </div>

            {/* Wallet Card */}
            <div className="bg-zinc-900 rounded-[32px] p-6 text-white flex items-center gap-5 mb-10 shadow-xl shadow-zinc-200">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                    <Gift className="w-7 h-7 text-orange-400" />
                </div>
                <div className="flex-1">
                    <p className="text-[11px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Rewards Fund</p>
                    <p className="text-3xl font-black text-white leading-none">
                        {walletBalance != null ? `$${(walletBalance / 100).toFixed(2)}` : "$0.00"}
                    </p>
                </div>
            </div>

            {/* Deals List */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-[#18181B] tracking-tight">Active Offers</h3>
                </div>

                {deals.length === 0 ? (
                    <div className="py-20 text-center bg-zinc-100/50 rounded-[40px] border border-dashed border-zinc-200 flex flex-col gap-4">
                        <Sparkles className="w-10 h-10 text-zinc-300 mx-auto opacity-40" />
                        <div className="px-8">
                            <p className="text-lg font-black text-zinc-400">No active deals</p>
                            <p className="text-sm font-medium text-zinc-400 leading-relaxed mt-1">Create limited-time offers for referrers to pitch to their network.</p>
                        </div>
                    </div>
                ) : (
                    deals.map(deal => (
                        <div key={deal.id} className="bg-white border border-zinc-200 rounded-[32px] p-6 flex flex-col gap-4 shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xl font-black text-zinc-900 leading-tight mb-1 font-display">{deal.title}</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-green-600 bg-green-50 px-2.5 py-1 rounded-full uppercase tracking-widest border border-green-100">
                                            {deal.discount_text || "LIMITED OFFER"}
                                        </span>
                                    </div>
                                </div>
                                <button onClick={() => toggleDeal(deal)} className="shrink-0">
                                    {deal.is_active ? <ToggleRight className="w-10 h-10 text-orange-500" /> : <ToggleLeft className="w-10 h-10 text-zinc-300" />}
                                </button>
                            </div>
                            <p className="text-base text-zinc-500 line-clamp-2 leading-relaxed font-medium">
                                {deal.description}
                            </p>
                        </div>
                    ))
                )}
            </div>
            
            <p className="mt-10 text-xs font-medium text-zinc-400 text-center px-8">
                Deals appear on your business profile and are visible to all approved partners.
            </p>
        </div>
    );
}
