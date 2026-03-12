"use client";

import { useState } from "react";
import { Rocket, DollarSign, Gift, Users, ArrowRight, X } from "lucide-react";
import Link from "next/link";

const BENEFITS = [
    { icon: DollarSign, title: "Earn per lead", desc: "Get paid every time a business you referred converts a job." },
    { icon: Gift, title: "Prezzee rewards", desc: "Earn $25 Prezzee Smart Cards for every 5 active businesses you invite." },
    { icon: Users, title: "Build passive income", desc: "Your network works for you — refer once, earn on every future job." },
    { icon: Rocket, title: "Zero upfront cost", desc: "Free to join. No subscription. No risk." },
];

export function BecomeReferrerDialog({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <div onClick={() => setOpen(true)} className="cursor-pointer">{children}</div>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-br from-orange-500 to-amber-400 px-8 pt-8 pb-10 relative">
                            <button
                                onClick={() => setOpen(false)}
                                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                                <Rocket className="w-7 h-7 text-white" />
                            </div>
                            <h2 className="text-4xl font-black text-white mb-1">Become a Referrer</h2>
                            <p className="text-orange-100 font-medium text-xl">Turn your network into income — no extra work required.</p>
                        </div>

                        {/* Benefits */}
                        <div className="px-8 py-6 space-y-4">
                            {BENEFITS.map(({ icon: Icon, title, desc }) => (
                                <div key={title} className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                                        <Icon className="w-5 h-5 text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-zinc-900" style={{ fontSize: '20px' }}>{title}</p>
                                        <p className="text-zinc-500 font-medium" style={{ fontSize: '18px' }}>{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* CTA */}
                        <div className="px-8 pb-8">
                            <Link
                                href="/onboarding/referrer"
                                className="flex items-center justify-center gap-2 w-full h-16 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black transition-all shadow-lg shadow-orange-200"
                                style={{ fontSize: '22px' }}
                                onClick={() => setOpen(false)}
                            >
                                Join as Referrer <ArrowRight className="w-6 h-6" />
                            </Link>
                            <button
                                onClick={() => setOpen(false)}
                                className="w-full mt-4 text-zinc-400 hover:text-zinc-600 font-medium transition-colors"
                                style={{ fontSize: '18px' }}
                            >
                                Maybe later
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
