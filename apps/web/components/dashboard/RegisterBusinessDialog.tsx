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
                        <div className="bg-zinc-900 px-6 pt-10 pb-10 relative">
                            <button
                                onClick={() => setOpen(false)}
                                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                                <Building2 className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight leading-none font-display">Register Your Business</h2>
                            <p className="text-zinc-400 font-medium text-lg leading-relaxed">Get pre-vetted leads delivered by partners who know your value.</p>
                        </div>

                        {/* Benefits */}
                        <div className="px-6 py-8 space-y-6">
                            {BENEFITS.map(({ icon: Icon, title, desc }) => (
                                <div key={title} className="flex items-start gap-4">
                                    <div className="w-11 h-11 bg-zinc-50 border border-zinc-100 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                                        <Icon className="w-5 h-5 text-zinc-900" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-extrabold text-zinc-900 leading-none mb-1 text-lg">{title}</p>
                                        <p className="text-zinc-500 font-medium text-sm leading-relaxed">{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* CTA */}
                        <div className="px-8 pb-8">
                            <Link
                                href="/onboarding/business"
                                className="flex items-center justify-center gap-2 w-full h-16 bg-zinc-900 hover:bg-black text-white rounded-2xl font-black transition-all shadow-lg shadow-zinc-200"
                                style={{ fontSize: '22px' }}
                                onClick={() => setOpen(false)}
                            >
                                Register Business <ArrowRight className="w-6 h-6" />
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
