"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { DollarSign, Gift, Save, Loader2, CheckCircle2, Copy, Sparkles } from "lucide-react";
import { toast } from "sonner";

export function MobileBusinessConfig() {
    const { getToken, isLoaded } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [defaultFeeDollars, setDefaultFeeDollars] = useState("");
    const [slug, setSlug] = useState("");
    const apiUrl = "/api/backend";

    useEffect(() => {
        if (!isLoaded) return;
        (async () => {
            const token = await getToken();
            const res = await fetch(`${apiUrl}/business/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setDefaultFeeDollars(data.referral_fee_cents ? String(data.referral_fee_cents / 100) : "");
                setSlug(data.slug || "");
            }
            setLoading(false);
        })();
    }, [isLoaded, getToken, apiUrl]);

    const save = async () => {
        const cents = Math.round(parseFloat(defaultFeeDollars || "0") * 100);
        if (cents < 300) {
            toast.error("Minimum referral fee is $3.00");
            return;
        }
        setSaving(true);
        const token = await getToken();
        const res = await fetch(`${apiUrl}/business/me`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ referral_fee_cents: cents }),
        });
        setSaving(false);
        if (res.ok) {
            toast.success("Reward structure updated!");
        } else {
            toast.error("Failed to save.");
        }
    };

    if (loading) {
        return (
            <div className="lg:hidden h-40 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-orange-500 animate-spin" />
            </div>
        );
    }

    const inviteLink = `traderefer.au/register?ref=${slug}&type=referrer`;

    return (
        <div className="lg:hidden flex flex-col min-h-screen bg-white pb-32 pt-2 px-5">
            <div className="flex flex-col gap-1 mb-6">
                <h1 className="text-[28px] font-extrabold text-[#18181B] leading-tight">Reward Structure</h1>
                <p className="text-[13px] font-medium text-zinc-500">How you reward your partners.</p>
            </div>

            <div className="flex flex-col gap-6">
                {/* Lead Fee Card */}
                <div className="bg-zinc-900 rounded-[24px] p-6 text-white flex flex-col gap-5">
                    <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                            <DollarSign className="w-5 h-5 text-orange-400" />
                        </div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Base Payout</h3>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Referral Fee (Min $3)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-orange-500 text-xl font-mono">$</span>
                            <input 
                                type="number"
                                value={defaultFeeDollars}
                                onChange={(e) => setDefaultFeeDollars(e.target.value)}
                                className="w-full h-14 bg-white/5 rounded-2xl pl-10 pr-4 text-xl font-black text-white border-none outline-none focus:bg-white/10 transition-all font-mono"
                            />
                        </div>
                    </div>

                    <p className="text-[12px] font-medium text-zinc-400 leading-relaxed">
                        This is the default amount referrers earn per confirmed lead.
                    </p>
                </div>

                {/* Invite Link Card */}
                <div className="bg-[#F4F4F5] rounded-[24px] p-6 flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Partner Invite Link</h3>
                        <p className="text-[12px] font-medium text-zinc-500">Send this to tradespeople you trust.</p>
                    </div>

                    <div className="bg-white border border-zinc-200 rounded-xl p-3 text-[13px] font-mono text-zinc-500 break-all leading-relaxed">
                        {inviteLink}
                    </div>

                    <button 
                         onClick={() => {
                            navigator.clipboard.writeText(inviteLink);
                            toast.success("Link copied!");
                        }}
                        className="w-full h-12 bg-white border border-zinc-200 rounded-xl flex items-center justify-center gap-2 text-[13px] font-bold text-zinc-900 active:scale-[0.98] transition-all"
                    >
                        <Copy className="w-4 h-4" />
                        Copy Invite Link
                    </button>
                </div>

                {/* Automation Card */}
                <div className="bg-orange-50 border border-orange-100 rounded-[24px] p-6 flex flex-col gap-4">
                     <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                            <Sparkles className="w-5 h-5 text-orange-600" />
                        </div>
                        <h3 className="text-sm font-black text-orange-950 uppercase tracking-widest">Autofill Rewards</h3>
                    </div>
                    <p className="text-[13px] font-bold text-orange-900 leading-relaxed">
                        TradeRefer handles all tax and gift card delivery via Prezzee.
                    </p>
                    <div className="flex items-center gap-2">
                         <CheckCircle2 className="w-4 h-4 text-orange-500" />
                         <span className="text-[12px] font-bold text-orange-800">No manual payout needed</span>
                    </div>
                </div>

                <button 
                    onClick={save}
                    disabled={saving}
                    className="w-full h-14 bg-orange-500 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                    {saving ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Save className="w-5 h-5 text-white" />}
                    <span className="text-[15px] font-extrabold text-white">Update Reward Program</span>
                </button>
            </div>
        </div>
    );
}
