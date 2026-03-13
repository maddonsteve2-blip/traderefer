"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, Check, Users, Building2 } from "lucide-react";

interface CommandStripProps {
    slug: string;
}

const APP_BASE = "https://traderefer.au";

export function CommandStrip({ slug }: CommandStripProps) {
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const copy = async (key: string, url: string) => {
        await navigator.clipboard.writeText(url);
        setCopiedKey(key);
        toast.success("Link copied!");
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const recruitUrl = `${APP_BASE}/onboarding/referrer?invite=${slug}`;
    const businessUrl = `${APP_BASE}/onboarding/business?invite=${slug}`;

    return (
        <div className="flex gap-3 mb-6">
            <button
                onClick={() => copy("recruit", recruitUrl)}
                className="flex-1 h-14 flex items-center justify-center gap-2.5 border-2 border-[#ff6b00] text-[#ff6b00] bg-white rounded-xl font-bold uppercase tracking-wider hover:bg-orange-50 transition-all text-lg"
            >
                {copiedKey === "recruit"
                    ? <Check className="w-6 h-6 shrink-0" />
                    : <Users className="w-6 h-6 shrink-0" />}
                {copiedKey === "recruit" ? "Link Copied!" : "Recruit a Partner (Earn $25)"}
            </button>
            <button
                onClick={() => copy("business", businessUrl)}
                className="flex-1 h-14 flex items-center justify-center gap-2.5 border-2 border-slate-800 text-slate-800 bg-white rounded-xl font-bold uppercase tracking-wider hover:bg-slate-50 transition-all text-lg"
            >
                {copiedKey === "business"
                    ? <Check className="w-6 h-6 shrink-0" />
                    : <Building2 className="w-6 h-6 shrink-0" />}
                {copiedKey === "business" ? "Link Copied!" : "Invite a Business"}
            </button>
        </div>
    );
}
