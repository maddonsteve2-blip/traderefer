"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState, useCallback } from "react";
import { Plus, Loader2, Zap, DollarSign, TrendingUp, Gift, Megaphone, Clock, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface Campaign {
    id: string;
    title: string;
    description: string | null;
    campaign_type: string;
    is_active: boolean;
    bonus_amount_cents: number;
    multiplier: number;
    volume_threshold: number | null;
    promo_text: string | null;
    ends_at: string;
}

function campaignLabel(c: Campaign) {
    switch (c.campaign_type) {
        case "flat_bonus": return `+$${(c.bonus_amount_cents / 100).toFixed(0)}`;
        case "multiplier": return `${c.multiplier}×`;
        case "volume_bonus": return `$${(c.bonus_amount_cents / 100).toFixed(0)}`;
        case "first_referral": return `$${(c.bonus_amount_cents / 100).toFixed(0)}`;
        default: return "";
    }
}

export function MobileBusinessCampaigns() {
    const { getToken } = useAuth();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);

    const apiUrl = "/api/backend";

    const fetchCampaigns = useCallback(async () => {
        const token = await getToken();
        const res = await fetch(`${apiUrl}/business/campaigns`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setCampaigns(await res.json());
        setLoading(false);
    }, [getToken]);

    useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

    if (loading) {
        return (
             <div className="lg:hidden h-40 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-orange-500 animate-spin" />
            </div>
        );
    }

    const active = campaigns.filter(c => c.is_active && new Date(c.ends_at) > new Date());

    return (
        <div className="lg:hidden flex flex-col min-h-screen bg-zinc-50 pb-32 pt-2 px-5">
            <div className="flex flex-col gap-1.5 mb-8">
                <h1 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight leading-none font-display">Growth Plans</h1>
                <p className="text-base font-medium text-zinc-500 leading-relaxed">Boost referral activity with special incentives.</p>
            </div>

            <div className="flex flex-col gap-6">
                 {/* Tips Card */}
                 <div className="bg-orange-50 border border-orange-200 rounded-[32px] p-6 flex flex-col gap-3 shadow-sm">
                    <div className="flex items-center gap-2">
                         <Zap className="w-5 h-5 text-orange-600 fill-orange-600" />
                         <p className="text-xs font-black text-orange-950 uppercase tracking-[0.2em]">Incentive Strategy</p>
                    </div>
                    <p className="text-sm font-medium text-orange-900/80 leading-relaxed">
                        Campaigns are time-limited bonuses that appear on the Referrer dashboard to drive urgency and volume.
                    </p>
                </div>

                {/* Campaigns List */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                         <h3 className="text-lg font-bold text-[#18181B] tracking-tight">Active Campaigns</h3>
                         <button className="flex items-center gap-1.5 text-orange-600 font-bold text-sm">
                            <Plus className="w-4 h-4" /> New Plan
                        </button>
                    </div>

                    {active.length === 0 ? (
                        <div className="py-20 text-center bg-zinc-100/50 rounded-[40px] border border-dashed border-zinc-200 flex flex-col gap-4">
                            <Megaphone className="w-10 h-10 text-zinc-300 mx-auto opacity-40" />
                            <div className="px-8">
                                <p className="text-lg font-black text-zinc-400">No active plans</p>
                                <p className="text-sm font-medium text-zinc-400 leading-relaxed mt-1">Motivate your partners with temporary payout bonuses during peak periods.</p>
                            </div>
                        </div>
                    ) : (
                        active.map(c => (
                            <div key={c.id} className="bg-white border border-zinc-200 rounded-[32px] p-6 flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-5 min-w-0">
                                     <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex flex-col items-center justify-center text-white shrink-0 shadow-lg shadow-zinc-200">
                                         <span className="text-lg font-black leading-none font-display">{campaignLabel(c)}</span>
                                         <span className="text-[9px] font-black opacity-40 uppercase tracking-widest mt-1">BONUS</span>
                                     </div>
                                     <div className="flex-1 min-w-0">
                                         <p className="text-lg font-black text-zinc-900 truncate tracking-tight font-display">{c.title}</p>
                                         <p className="text-[11px] font-black text-orange-500 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                                             <Clock className="w-3 h-3" /> Ends {new Date(c.ends_at).toLocaleDateString()}
                                         </p>
                                     </div>
                                </div>
                                <ChevronRight className="w-6 h-6 text-zinc-300" />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
