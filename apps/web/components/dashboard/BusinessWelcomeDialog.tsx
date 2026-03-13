"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, Users, Zap, ChevronRight, Star } from "lucide-react";
import { InviteReferrersButton } from "@/components/dashboard/InviteReferrersButton";

const STORAGE_KEY = "tr_business_welcome_shown";

export function BusinessWelcomeDialog() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        try {
            const seen = localStorage.getItem(STORAGE_KEY);
            if (!seen) {
                const timer = setTimeout(() => setOpen(true), 800);
                return () => clearTimeout(timer);
            }
        } catch {}
    }, []);

    const dismiss = () => {
        try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) dismiss(); }}>
            <DialogContent className="max-w-lg p-0 overflow-hidden rounded-[32px] border-0 shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 px-6 md:px-8 pt-8 md:pt-10 pb-6 md:pb-8 text-white relative">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-orange-500 rounded-2xl flex items-center justify-center mb-4 md:mb-5 shadow-lg shadow-orange-500/30">
                        <Zap className="w-6 h-6 md:w-7 md:h-7 text-white" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black mb-2 font-display leading-tight">Welcome to TradeRefer!</h2>
                    <p className="text-zinc-400 font-bold leading-relaxed text-base md:text-xl">
                        Your business profile is live. Here&apos;s how to get the most out of it.
                    </p>
                </div>

                <div className="px-8 py-6 space-y-4 bg-white">
                    {/* How it works */}
                    <div className="space-y-3">
                        <div className="flex items-start gap-4 p-5 bg-zinc-50 rounded-2xl">
                            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                                <Users className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="font-bold text-zinc-900 text-lg">Referrers send you leads</p>
                                <p className="text-base text-zinc-500 mt-0.5 leading-relaxed font-medium">Local people recommend your services to customers who need them. You only pay when you choose to unlock a customer&apos;s details.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-5 bg-zinc-50 rounded-2xl">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                                <Star className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-bold text-zinc-900 text-lg">Invite businesses &amp; referrers, earn rewards</p>
                                <p className="text-base text-zinc-500 mt-0.5 leading-relaxed font-medium">For every 5 people you invite who become active on TradeRefer, you&apos;ll receive a <strong className="text-zinc-700">$25 Prezzee gift card</strong>.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-5 bg-orange-50 rounded-2xl border border-orange-100">
                            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shrink-0">
                                <Gift className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="font-bold text-zinc-900 text-lg">$25 Prezzee for every 5 active invitees</p>
                                <p className="text-base text-zinc-500 mt-0.5 leading-relaxed font-medium">Invite tradies, referrers, or businesses you know. The more you grow the network, the more you earn.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                        <Button
                            onClick={dismiss}
                            className="w-full bg-zinc-900 hover:bg-black text-white rounded-full h-16 font-black shadow-lg shadow-zinc-200 flex items-center justify-center gap-2 text-2xl active:scale-95 transition-all"
                        >
                            Go to Dashboard <ChevronRight className="w-5 h-5" />
                        </Button>
                        <button
                            onClick={dismiss}
                            className="text-base text-zinc-400 hover:text-zinc-600 font-bold transition-colors"
                        >
                            I&apos;ll explore on my own
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
