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
                <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 px-8 pt-10 pb-8 text-white">
                    <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-orange-500/30">
                        <Zap className="w-7 h-7 text-white" />
                    </div>
                    <h2 className="text-2xl font-black mb-2 font-display">Welcome to TradeRefer!</h2>
                    <p className="text-zinc-400 font-medium leading-relaxed">
                        Your business profile is live. Here&apos;s how to get the most out of it.
                    </p>
                </div>

                <div className="px-8 py-6 space-y-4 bg-white">
                    {/* How it works */}
                    <div className="space-y-3">
                        <div className="flex items-start gap-4 p-4 bg-zinc-50 rounded-2xl">
                            <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                                <Users className="w-4 h-4 text-orange-600" />
                            </div>
                            <div>
                                <p className="font-bold text-zinc-900 text-sm">Referrers send you leads</p>
                                <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">Local people recommend your services to customers who need them. You only pay when you choose to unlock a customer&apos;s details.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-4 bg-zinc-50 rounded-2xl">
                            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                                <Star className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-bold text-zinc-900 text-sm">Invite businesses &amp; referrers, earn rewards</p>
                                <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">For every 5 people you invite who become active on TradeRefer, you&apos;ll receive a <strong className="text-zinc-700">$25 Prezzee gift card</strong>.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                            <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center shrink-0">
                                <Gift className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <p className="font-bold text-zinc-900 text-sm">$25 Prezzee for every 5 active invitees</p>
                                <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">Invite tradies, referrers, or businesses you know. The more you grow the network, the more you earn.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                        <Button
                            onClick={dismiss}
                            className="w-full bg-zinc-900 hover:bg-black text-white rounded-full h-12 font-bold shadow-lg shadow-zinc-200 flex items-center justify-center gap-2"
                        >
                            Go to Dashboard <ChevronRight className="w-4 h-4" />
                        </Button>
                        <button
                            onClick={dismiss}
                            className="text-xs text-zinc-400 hover:text-zinc-600 font-medium transition-colors"
                        >
                            I&apos;ll explore on my own
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
