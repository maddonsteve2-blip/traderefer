import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import {
    Quote
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
    title: "Join TradeRefer as a Referrer",
    description: "Get invited to TradeRefer, refer trusted tradies, and earn commissions on verified trade leads.",
    openGraph: {
        title: "Join TradeRefer as a Referrer",
        description: "Get invited to TradeRefer, refer trusted tradies, and earn commissions on verified trade leads.",
        type: "website",
        images: [
            {
                url: "/invite-preview/opengraph-image",
                width: 1200,
                height: 630,
                alt: "Join TradeRefer as a Referrer",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Join TradeRefer as a Referrer",
        description: "Get invited to TradeRefer, refer trusted tradies, and earn commissions on verified trade leads.",
        images: ["/invite-preview/opengraph-image"],
    },
};

export default function RegisterPage() {
    return (
        <main className="min-h-screen bg-zinc-50 flex flex-col lg:flex-row">
            {/* Left Side: Branding & Testimonial - Hidden on Mobile */}
            <div className="hidden lg:flex lg:w-5/12 bg-zinc-900 p-12 md:p-20 lg:p-24 flex flex-col justify-between relative overflow-hidden">
                <div className="relative z-10">
                    <Link href="/" className="flex items-center gap-2 mb-16 group">
                        <Logo size="md" variant="white" />
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
            <div className="flex-1 p-8 md:p-12 flex flex-col items-center justify-center bg-white lg:bg-zinc-50">
                <div className="lg:hidden flex flex-col items-center mb-10 text-center">
                    <Link href="/" className="mb-6">
                        <Logo size="md" />
                    </Link>
                    <h2 className="text-2xl md:text-3xl font-black text-zinc-900 mb-2">Create Account</h2>
                    <p className="text-sm font-bold text-zinc-500 max-w-[240px]">Join Australia's leading trade referral network</p>
                </div>
                
                <div className="w-full max-w-sm shadow-2xl lg:shadow-none rounded-[28px] overflow-hidden">
                    <Suspense fallback={<div className="p-12 text-center text-zinc-400 font-black animate-pulse">Initializing...</div>}>
                        <SignUp 
                            fallbackRedirectUrl="/dashboard" 
                            signInUrl="/login" 
                            appearance={{
                                elements: {
                                    card: "shadow-none border-none",
                                    footerAction: "font-black text-orange-600 hover:text-orange-700",
                                    formButtonPrimary: "bg-zinc-900 border-none shadow-xl hover:bg-zinc-800 text-base py-6 rounded-2xl transition-all active:scale-95",
                                    headerTitle: "font-black tracking-tight",
                                    headerSubtitle: "font-bold text-zinc-500",
                                    socialButtonsBlockButton: "rounded-2xl border-2 border-zinc-100 hover:bg-zinc-50 font-bold",
                                    formFieldLabel: "font-black text-xs uppercase tracking-widest text-zinc-400",
                                    formFieldInput: "rounded-2xl h-12 border-2 border-zinc-100 focus:border-zinc-900 transition-all font-bold"
                                }
                            }}
                        />
                    </Suspense>
                </div>
            </div>
        </main>
    );
}
