"use client";

import { useEffect, useState } from "react";
import { Flame, Gift, TrendingUp, Users, Zap, ChevronRight } from "lucide-react";
import Link from "next/link";
import { BusinessLogo } from "@/components/BusinessLogo";

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
    logo_bg_color?: string | null;
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
            .then(data => setCampaigns(Array.isArray(data) ? data : []))
            .catch(() => {});
    }, []);

    if (campaigns.length === 0) return null;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-black text-zinc-900 flex items-center gap-2.5">
                    <Flame className="w-5 h-5 text-orange-500" /> Hot Campaigns
                </h2>
                <Link href="/dashboard/referrer/businesses" className="text-lg font-black text-orange-500 hover:text-orange-600 flex items-center gap-0.5 underline underline-offset-4">
                    All <ChevronRight className="w-5 h-5" />
                </Link>
            </div>
            <div className="space-y-2.5">
                {campaigns.slice(0, 4).map(c => {
                    const Icon = typeIcon(c.campaign_type);
                    return (
                        <Link
                            key={c.id}
                            href={`/dashboard/referrer/refer/${c.slug}`}
                            className="flex items-center gap-4 p-4 bg-orange-50 border border-orange-100 rounded-2xl hover:border-orange-300 hover:bg-orange-100/60 transition-all group shadow-sm"
                        >
                            <BusinessLogo logoUrl={c.logo_url} name={c.business_name} size="sm" bgColor={c.logo_bg_color} />
                            <div className="flex-1 min-w-0">
                                <div className="text-lg font-black text-zinc-900 truncate group-hover:text-orange-600 transition-colors leading-tight">{c.business_name}</div>
                                <div className="text-base text-zinc-500 font-bold truncate mt-0.5">{c.trade_category} · {daysLeft(c.ends_at)}</div>
                            </div>
                            <div className="text-right shrink-0">
                                <div className="text-xl font-black text-orange-600 leading-tight">{badgeText(c)}</div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
