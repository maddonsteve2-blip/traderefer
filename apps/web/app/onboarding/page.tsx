"use client";

import { Building2, Rocket, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function OnboardingChoicePage() {
    return (
        <main className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-black text-zinc-900 mb-4 font-display tracking-tight">
                        How will you use <span className="text-orange-500">TradeRefer</span>?
                    </h1>
                    <p className="text-xl text-zinc-500 font-medium">
                        Select your path to get started with Australia's leading referral marketplace.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Referrer Option */}
                    <Link href="/onboarding/referrer" className="group">
                        <div className="h-full p-8 md:p-12 bg-white rounded-[40px] border border-zinc-200 shadow-xl shadow-zinc-200/50 hover:border-orange-500/50 hover:shadow-orange-500/10 transition-all duration-500 flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-orange-500/10 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                                <Rocket className="w-10 h-10 text-orange-500" />
                            </div>
                            <h2 className="text-2xl font-black text-zinc-900 mb-4 font-display">I am a Referrer</h2>
                            <p className="text-zinc-500 font-medium leading-relaxed mb-8">
                                I want to connect quality tradies to my network and earn referral fees for every successful job.
                            </p>
                            <div className="mt-auto flex items-center gap-2 text-orange-600 font-black">
                                Get Started <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </Link>

                    {/* Business Option */}
                    <Link href="/onboarding/business" className="group">
                        <div className="h-full p-8 md:p-12 bg-zinc-900 rounded-[40px] border border-zinc-800 shadow-2xl shadow-zinc-900/20 hover:border-zinc-700 transition-all duration-500 flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                                <Building2 className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-2xl font-black text-white mb-4 font-display">I am a Business</h2>
                            <p className="text-zinc-400 font-medium leading-relaxed mb-8">
                                I want to receive high-quality, pre-vetted leads from trusted referrers and grow my trade business.
                            </p>
                            <div className="mt-auto flex items-center gap-2 text-white font-black">
                                Register Business <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </Link>
                </div>

                <p className="mt-12 text-center text-zinc-400 text-sm font-medium">
                    Not sure which one to choose? <Link href="/support" className="text-zinc-900 font-black hover:underline underline-offset-4">Contact Support</Link>
                </p>
            </div>
        </main>
    );
}
