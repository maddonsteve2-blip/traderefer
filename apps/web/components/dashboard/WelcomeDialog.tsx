"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, Link2, Users, ChevronRight, X, Zap } from "lucide-react";
import { InviteFriendsDialog } from "@/components/referrer/InviteFriendsDialog";

const STORAGE_KEY = "tr_referrer_welcome_shown";

const HOW_IT_WORKS = [
    {
        icon: <Link2 className="w-6 h-6 text-orange-500" />,
        title: "1. Grab a referral link",
        desc: "Browse the business directory and generate your unique link for any tradie you like."
    },
    {
        icon: <Users className="w-6 h-6 text-orange-500" />,
        title: "2. Share it with customers",
        desc: "Send it to anyone who needs a tradie — text, email, Facebook, anywhere."
    },
    {
        icon: <Gift className="w-6 h-6 text-orange-500" />,
        title: "3. Get paid with gift cards",
        desc: "When your lead is confirmed, you automatically receive a Prezzee gift card. Spend it anywhere."
    },
];

export function WelcomeDialog() {
    const [open, setOpen] = useState(false);
    const [showInvite, setShowInvite] = useState(false);

    useEffect(() => {
        const alreadyShown = localStorage.getItem(STORAGE_KEY);
        if (!alreadyShown) {
            setOpen(true);
        }
    }, []);

    const handleClose = () => {
        localStorage.setItem(STORAGE_KEY, "true");
        setOpen(false);
    };

    const handleInvite = () => {
        handleClose();
        setShowInvite(true);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
                <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden rounded-3xl border-0 shadow-2xl">
                    {/* Header */}
                    <div className="bg-zinc-900 px-8 pt-8 pb-6 relative">
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                                <Zap className="w-6 h-6 text-white fill-white" />
                            </div>
                            <div>
                                <p className="text-orange-400 text-base font-black uppercase tracking-widest">Welcome to</p>
                                <p className="text-white text-3xl font-black">TradeRefer</p>
                            </div>
                        </div>
                        <h2 className="text-4xl font-black text-white leading-tight">
                            Here's how you'll earn<br />
                            <span className="text-orange-400">Prezzee gift cards</span>
                        </h2>
                    </div>

                    {/* How it works */}
                    <div className="px-8 py-6 space-y-5">
                        {HOW_IT_WORKS.map((item, i) => (
                            <div key={i} className="flex gap-5">
                                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                                    {item.icon}
                                </div>
                                <div>
                                    <p className="font-black text-zinc-900 text-lg">{item.title}</p>
                                    <p className="text-zinc-500 text-lg leading-relaxed font-medium">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Referral incentive banner */}
                    <div className="mx-6 mb-5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl px-6 py-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white font-black text-lg">🎁 Invite friends — earn $25</p>
                                <p className="text-orange-100 text-base font-medium">Get a $25 Prezzee card when 5 friends join</p>
                            </div>
                            <Gift className="w-10 h-10 text-orange-200 shrink-0" />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="px-6 pb-8 flex flex-col gap-3">
                        <Button
                            onClick={handleInvite}
                            className="w-full bg-zinc-900 hover:bg-black text-white rounded-full h-16 font-black text-xl shadow-xl shadow-zinc-200 active:scale-95 transition-all"
                        >
                            <Users className="w-5 h-5 mr-2" />
                            Invite Friends Now
                        </Button>
                        <Button
                            onClick={handleClose}
                            variant="ghost"
                            className="w-full rounded-full h-14 font-black text-zinc-400 hover:text-zinc-900 text-lg"
                        >
                            Explore Dashboard <ChevronRight className="w-5 h-5 ml-1" />
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <InviteFriendsDialog open={showInvite} onOpenChange={setShowInvite} />
        </>
    );
}
