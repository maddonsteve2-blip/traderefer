"use client";

import { useEffect, useState } from "react";
import { Flame, Gift, TrendingUp, Users, Zap, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Campaign {
    id: string;
    title: string;
    description: string | null;
    campaign_type: string;
    bonus_amount_cents: number;
    multiplier: number;
    volume_threshold: number | null;
    promo_text: string | null;
    ends_at: string;
    business_name: string;
    slug: string;
    trade_category: string;
    suburb: string;
    logo_url: string | null;
}

function badgeText(c: Campaign) {
    switch (c.campaign_type) {
        case "flat_bonus": return `+$${(c.bonus_amount_cents / 100).toFixed(0)} per lead`;
        case "multiplier": return `${c.multiplier}x commission`;
        case "volume_bonus": return `$${(c.bonus_amount_cents / 100).toFixed(0)} for ${c.volume_threshold}+ leads`;
        case "first_referral": return `$${(c.bonus_amount_cents / 100).toFixed(0)} first referral`;
        default: return c.title;
    }
}

function typeIcon(type: string) {
    switch (type) {
        case "flat_bonus": return Gift;
        case "multiplier": return TrendingUp;
        case "volume_bonus": return Users;
        case "first_referral": return Zap;
        default: return Gift;
    }
}

function daysLeft(endsAt: string) {
    const diff = Math.ceil((new Date(endsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return "Ending today";
    if (diff === 1) return "1 day left";
    return `${diff} days left`;
}

export function HotCampaigns() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);

    useEffect(() => {
        const apiUrl = "/api/backend";
        fetch(`${apiUrl}/campaigns/hot`)
            .then(r => r.ok ? r.json() : [])
            .then(setCampaigns)
            .catch(() => {});
    }, []);

    if (campaigns.length === 0) return null;

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500" /> Hot Campaigns
                </h2>
                <Link href="/dashboard/referrer/businesses" className="text-lg font-bold text-orange-500 hover:text-orange-600 flex items-center gap-0.5 underline underline-offset-2">
                    All <ChevronRight className="w-4 h-4" />
                </Link>
            </div>
            <div className="space-y-2">
                {campaigns.slice(0, 4).map(c => {
                    const Icon = typeIcon(c.campaign_type);
                    return (
                        <Link
                            key={c.id}
                            href={`/dashboard/referrer/refer/${c.slug}`}
                            className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-100 rounded-xl hover:border-orange-300 hover:bg-orange-100/60 transition-all group"
                        >
                            <div className="w-9 h-9 bg-white border border-orange-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                                {c.logo_url ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img src={c.logo_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <Icon className="w-4 h-4 text-orange-500" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-base font-black text-zinc-900 truncate group-hover:text-orange-600 transition-colors leading-tight">{c.business_name}</div>
                                <div className="text-base text-zinc-400 truncate">{c.trade_category} · {daysLeft(c.ends_at)}</div>
                            </div>
                            <div className="text-right shrink-0">
                                <div className="text-lg font-black text-orange-600 leading-tight">{badgeText(c)}</div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
