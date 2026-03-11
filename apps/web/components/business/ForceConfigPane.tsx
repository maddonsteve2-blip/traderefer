"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { DollarSign, Gift, Save, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const PREZZEE_LOGO = "https://cdn.prod.website-files.com/67e0cab92cc4f35b3b006055/6808567053b358df8bfa79c3_Logo%20Consumer_Web.svg";

export function ForceConfigPane() {
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
            toast.success("Config saved!");
        } else {
            toast.error("Failed to save. Please try again.");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center flex-1">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto bg-zinc-50 py-8 px-6">
            <div className="max-w-lg mx-auto space-y-6">

                <div>
                    <h2 className="font-black text-zinc-900 mb-1" style={{ fontSize: 24 }}>Referral Program Settings</h2>
                    <p className="text-zinc-500 font-medium" style={{ fontSize: 16 }}>
                        Set the default lead fee, rewards, and invite link for your referrer program.
                    </p>
                </div>

                {/* Default fee */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <h3 className="font-black text-zinc-900" style={{ fontSize: 18 }}>Default Lead Fee</h3>
                            <p className="text-zinc-400 font-medium" style={{ fontSize: 14 }}>Paid to referrers per unlocked lead. Minimum $3.00.</p>
                        </div>
                    </div>
                    <div className="relative max-w-[200px]">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-zinc-400" style={{ fontSize: 18 }}>$</span>
                        <input
                            type="number"
                            min="3"
                            step="0.50"
                            value={defaultFeeDollars}
                            onChange={e => setDefaultFeeDollars(e.target.value)}
                            placeholder="8.00"
                            className="w-full pl-8 pr-4 h-12 border border-zinc-200 rounded-xl font-black text-zinc-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                            style={{ fontSize: 18 }}
                        />
                    </div>
                    <p className="text-zinc-400 font-medium mt-3" style={{ fontSize: 14 }}>
                        Each approved referrer can have a custom fee set in the Active Referrers tab.
                    </p>
                </div>

                {/* Prezzee rewards */}
                <div className="bg-[#0F172A] rounded-2xl p-6 text-white">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                            <Gift className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                            <h3 className="font-black text-white" style={{ fontSize: 18 }}>Prezzee Reward Triggers</h3>
                            <p className="text-zinc-400 font-medium mt-0.5" style={{ fontSize: 14 }}>
                                Referrers automatically earn a Prezzee Smart Card after every 5 confirmed leads.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 mb-3">
                        <div>
                            <p className="font-black text-white" style={{ fontSize: 16 }}>Milestone</p>
                            <p className="text-zinc-400 font-medium" style={{ fontSize: 14 }}>Every 5 confirmed leads</p>
                        </div>
                        <div className="text-right">
                            <p className="font-black text-orange-400" style={{ fontSize: 20 }}>$25</p>
                            <p className="text-zinc-400 font-medium" style={{ fontSize: 13 }}>Smart Card</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <p className="text-zinc-300 font-medium" style={{ fontSize: 14 }}>
                            Rewards are automatically fulfilled — no manual action required.
                        </p>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                        <span className="text-zinc-400 font-medium" style={{ fontSize: 13 }}>Powered by</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={PREZZEE_LOGO} alt="Prezzee" className="h-3 w-auto brightness-0 invert" />
                    </div>
                </div>

                {/* Storefront link */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-6">
                    <h3 className="font-black text-zinc-900 mb-1" style={{ fontSize: 18 }}>Your Referrer Invite Link</h3>
                    <p className="text-zinc-400 font-medium mb-3" style={{ fontSize: 14 }}>
                        Share this with anyone you want to invite to apply as a referrer.
                    </p>
                    <div className="bg-zinc-50 rounded-xl px-4 py-3 font-mono text-zinc-600 break-all" style={{ fontSize: 14 }}>
                        traderefer.au/register?ref={slug}&amp;type=referrer
                    </div>
                </div>

                <button
                    onClick={save}
                    disabled={saving}
                    className="w-full h-13 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                    style={{ fontSize: 18, height: 52 }}
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {saving ? "Saving…" : "Save Config"}
                </button>
            </div>
        </div>
    );
}
