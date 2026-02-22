import { SignUp } from "@clerk/nextjs";
import {
    Rocket,
    Quote
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

export default function RegisterPage() {
    return (
        <main className="min-h-screen bg-zinc-50 flex flex-col lg:flex-row">
            {/* Left Side: Branding & Testimonial */}
            <div className="lg:w-5/12 bg-zinc-900 p-12 md:p-20 lg:p-24 flex flex-col justify-between relative overflow-hidden">
                <div className="relative z-10">
                    <Link href="/" className="flex items-center gap-2 mb-16 group">
                        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg shadow-orange-500/20">
                            <Rocket className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-black text-2xl text-white tracking-tighter">TradeRefer</span>
                    </Link>

                    <div className="space-y-8">
                        <h1 className="text-4xl md:text-5xl font-black text-white leading-tight font-display tracking-tight">
                            Join Australia's Leading <span className="text-orange-500">Referral Marketplace</span>
                        </h1>

                        <div className="relative p-8 bg-white/5 border border-white/10 rounded-[40px] backdrop-blur-sm">
                            <Quote className="absolute top-6 left-6 w-12 h-12 text-orange-500/20" />
                            <p className="text-zinc-300 text-lg italic leading-relaxed mb-6 relative z-10">
                                "TradeRefer transformed how I monetize my network. I earned $2k in my first month just by connecting quality tradies to local jobs. It's a game changer for my business."
                            </p>
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-12 h-12 bg-zinc-800 rounded-full border-2 border-orange-500/30 overflow-hidden">
                                    <div className="w-full h-full flex items-center justify-center text-orange-500 font-bold">SJ</div>
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white">Sarah J.</div>
                                    <div className="text-sm text-zinc-500">Top Referrer • Sydney, NSW</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 mt-12 grid grid-cols-2 gap-4">
                    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                        <div className="text-2xl font-black text-white mb-1">5,000+</div>
                        <div className="text-base font-black text-zinc-500 uppercase tracking-widest">Active Tradies</div>
                    </div>
                    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                        <div className="text-2xl font-black text-white mb-1">$1.2M+</div>
                        <div className="text-base font-black text-zinc-500 uppercase tracking-widest">Paid Referrals</div>
                    </div>
                </div>

                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl" />
                <div className="absolute -left-20 top-40 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl rotate-45" />
            </div>

            {/* Right Side: Registration Form */}
            <div className="lg:w-7/12 p-8 flex items-center justify-center bg-zinc-50">
                <Suspense fallback={<div className="text-zinc-500 font-bold">Loading...</div>}>
                    <SignUp fallbackRedirectUrl="/onboarding" signInUrl="/login" />
                </Suspense>
            </div>
        </main>
    );
}
