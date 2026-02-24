"use client";

import { SignUp } from "@clerk/nextjs";
import { Rocket } from "lucide-react";
import { Suspense } from "react";

export default function JoinPage() {
    return (
        <main className="min-h-screen bg-zinc-50 flex flex-col">
            {/* Minimal navbar — logo goes nowhere */}
            <header className="p-6 border-b border-zinc-100 bg-white">
                <div className="container mx-auto flex items-center justify-center">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <Rocket className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-black text-2xl tracking-tighter text-zinc-900">TradeRefer</span>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <div className="flex-1 flex flex-col items-center justify-center py-12 px-4">
                <div className="text-center mb-8 max-w-md">
                    <h1 className="text-3xl md:text-4xl font-black text-zinc-900 mb-3 font-display tracking-tight">
                        You've been invited to <span className="text-orange-500">TradeRefer</span>
                    </h1>
                    <p className="text-zinc-500 font-medium leading-relaxed">
                        Create your free account to start referring quality tradies and earning commissions on every lead.
                    </p>
                </div>

                <Suspense fallback={<div className="text-zinc-500 font-bold">Loading...</div>}>
                    <SignUp
                        fallbackRedirectUrl="/onboarding/referrer"
                        signInUrl="/login"
                        appearance={{
                            elements: {
                                socialButtonsRoot: 'hidden',
                                dividerRow: 'hidden',
                                footerAction: 'hidden',
                                headerSubtitle: 'hidden',
                            }
                        }}
                    />
                </Suspense>
            </div>

            {/* Minimal footer */}
            <footer className="p-8 border-t border-zinc-100 bg-white">
                <div className="container mx-auto text-center">
                    <p className="text-zinc-300 text-xs font-bold uppercase tracking-[0.2em]">
                        © 2026 TradeRefer Pty Ltd
                    </p>
                </div>
            </footer>
        </main>
    );
}
