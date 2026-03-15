"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, ExternalLink, Check } from "lucide-react";
import { BusinessReferralProgress } from "@/components/business/BusinessReferralProgress";
import { PrezzeeRewardsCard } from "@/components/shared/PrezzeeRewardsCard";

const APP_BASE = "https://traderefer.au";

interface BusinessSidebarProps {
    slug: string;
    businessName: string;
    hasReferrer: boolean;
}

export function BusinessSidebar({ slug, businessName, hasReferrer }: BusinessSidebarProps) {
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const copy = (key: string, url: string) => {
        navigator.clipboard.writeText(url);
        setCopiedKey(key);
        toast.success("Link copied!");
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const storefrontUrl = `${APP_BASE}/b/${slug}`;

    return (
        <div className="space-y-4">

            {/* ── Card 0: Prezzee Rewards — shared component ── */}
            <PrezzeeRewardsCard rewardsHref="/rewards" />

            {/* ── Card 1: Public Storefront — dark charcoal ── */}
            <div className="bg-[#111827] rounded-2xl p-5 border border-[#1f2937]">
                <p className="text-zinc-400 font-bold uppercase tracking-wider mb-1 text-base">
                    PUBLIC PROFILE
                </p>
                <p className="text-white font-black leading-tight mb-4 text-2xl">
                    {businessName}
                </p>
                <div className="bg-white/10 rounded-xl px-3 py-2 mb-3">
                    <p className="text-zinc-400 font-mono font-bold truncate text-sm">
                        traderefer.au/b/{slug}
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <button
                        onClick={() => copy("storefront", storefrontUrl)}
                        className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-xl py-3 font-bold transition-all border border-white/10 text-lg"
                    >
                        {copiedKey === "storefront"
                            ? <Check className="w-5 h-5 text-green-400" />
                            : <Copy className="w-5 h-5" />}
                        {copiedKey === "storefront" ? "Copied!" : "Copy Link"}
                    </button>
                    <a
                        href={storefrontUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-xl px-4 py-3 font-bold transition-all border border-white/10 min-h-[48px] text-lg"
                    >
                        <ExternalLink className="w-5 h-5" />
                        View Live
                    </a>
                </div>
            </div>

            {/* ── Card 2: Friend Rewards — Prezzee progress mirror ── */}
            <BusinessReferralProgress />

        </div>
    );
}
