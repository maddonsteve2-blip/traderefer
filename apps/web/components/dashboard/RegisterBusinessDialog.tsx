"use client";

import { useState } from "react";
import { Building2, Target, Users, BarChart3, ArrowRight, X } from "lucide-react";
import Link from "next/link";

const BENEFITS = [
    { icon: Target, title: "Receive vetted leads", desc: "Pre-screened leads from trusted referrers who personally vouch for each job." },
    { icon: Users, title: "Build a referrer network", desc: "Approve referrers to represent your business and grow your pipeline hands-free." },
    { icon: BarChart3, title: "Run targeted campaigns", desc: "Create campaigns that attract the exact type of customer you want." },
    { icon: Building2, title: "Professional storefront", desc: "A public business profile that builds trust before the first call." },
];

export function RegisterBusinessDialog({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <div onClick={() => setOpen(true)} className="cursor-pointer">{children}</div>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
                        {/* Header */}
                        <div className="bg-zinc-900 px-8 pt-8 pb-10 relative">
                            <button
                                onClick={() => setOpen(false)}
                                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
                                <Building2 className="w-7 h-7 text-white" />
                            </div>
                            <h2 className="text-2xl font-black text-white mb-1">Register Your Business</h2>
                            <p className="text-zinc-400 font-medium">Get pre-vetted leads delivered by referrers who know your target customers.</p>
                        </div>

                        {/* Benefits */}
                        <div className="px-8 py-6 space-y-4">
                            {BENEFITS.map(({ icon: Icon, title, desc }) => (
                                <div key={title} className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center shrink-0">
                                        <Icon className="w-5 h-5 text-zinc-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-zinc-900" style={{ fontSize: '15px' }}>{title}</p>
                                        <p className="text-zinc-500 font-medium" style={{ fontSize: '14px' }}>{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* CTA */}
                        <div className="px-8 pb-8">
                            <Link
                                href="/onboarding/business"
                                className="flex items-center justify-center gap-2 w-full h-14 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl font-black transition-all shadow-lg shadow-zinc-200"
                                style={{ fontSize: '17px' }}
                                onClick={() => setOpen(false)}
                            >
                                Register Business <ArrowRight className="w-5 h-5" />
                            </Link>
                            <button
                                onClick={() => setOpen(false)}
                                className="w-full mt-3 text-zinc-400 hover:text-zinc-600 font-medium transition-colors"
                                style={{ fontSize: '14px' }}
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
