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
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        fetch(`${apiUrl}/campaigns/hot`)
            .then(r => r.ok ? r.json() : [])
            .then(setCampaigns)
            .catch(() => {});
    }, []);

    if (campaigns.length === 0) return null;

    return (
        <div className="mb-10">
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" /> Hot Campaigns
                </h2>
                <Link href="/businesses" className="text-sm font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1">
                    Browse All <ChevronRight className="w-4 h-4" />
                </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {campaigns.slice(0, 6).map(c => {
                    const Icon = typeIcon(c.campaign_type);
                    return (
                        <Link
                            key={c.id}
                            href={`/b/${c.slug}/refer`}
                            className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-5 hover:shadow-lg hover:shadow-orange-100/50 transition-all group"
                        >
                            <div className="flex items-start gap-3 mb-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                                    {c.logo_url ? (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img src={c.logo_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <Icon className="w-5 h-5 text-orange-600" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-bold text-zinc-900 leading-tight group-hover:text-orange-600 transition-colors">{c.title}</h3>
                                    <p className="text-sm text-zinc-500">{c.business_name} · {c.suburb}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-bold">
                                    <Icon className="w-3.5 h-3.5" />
                                    {badgeText(c)}
                                </span>
                                <span className="text-xs font-bold text-orange-400">{daysLeft(c.ends_at)}</span>
                            </div>
                            {c.promo_text && (
                                <p className="text-sm text-zinc-500 mt-2 italic line-clamp-1">&ldquo;{c.promo_text}&rdquo;</p>
                            )}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
