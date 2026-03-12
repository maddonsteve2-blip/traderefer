"use client";

import { Rocket, Building2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";

export function DashboardRolePicker() {
    const router = useRouter();

    return (
        <main className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-4xl">
                <div className="flex justify-center mb-12">
                    <Logo size="md" />
                </div>

                <div className="text-center mb-12">
                    <h1 className="font-black text-zinc-900 mb-6 tracking-tight" style={{ fontSize: 'clamp(40px, 8vw, 72px)' }}>
                        Welcome back — which dashboard?
                    </h1>
                    <p className="text-zinc-500 font-bold" style={{ fontSize: '28px' }}>
                        You have both a Business and Referrer account. Choose where to go.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-10">
                    {/* Referrer */}
                    <button
                        onClick={() => router.push("/dashboard/referrer")}
                        className="group text-left h-full p-10 md:p-14 bg-white rounded-[48px] border-2 border-zinc-200 shadow-2xl shadow-zinc-200/50 hover:border-orange-500/50 hover:shadow-orange-500/20 transition-all duration-500 flex flex-col items-center text-center active:scale-[0.98]"
                    >
                        <div className="w-24 h-24 bg-orange-500/10 rounded-[32px] flex items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-500">
                            <Rocket className="w-12 h-12 text-orange-500" />
                        </div>
                        <h2 className="font-black text-zinc-900 mb-5" style={{ fontSize: '36px' }}>Referrer Dashboard</h2>
                        <p className="text-zinc-500 font-bold leading-relaxed mb-10" style={{ fontSize: '22px' }}>
                            Manage your referral network, track earnings, and grow your passive income.
                        </p>
                        <div className="mt-auto flex items-center gap-3 text-orange-600 font-black" style={{ fontSize: '22px' }}>
                            Go to Referrer <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                        </div>
                    </button>

                    {/* Business */}
                    <button
                        onClick={() => router.push("/dashboard/business")}
                        className="group text-left h-full p-10 md:p-14 bg-zinc-900 rounded-[48px] border-2 border-zinc-800 shadow-2xl shadow-zinc-900/40 hover:border-zinc-700 transition-all duration-500 flex flex-col items-center text-center active:scale-[0.98]"
                    >
                        <div className="w-24 h-24 bg-white/10 rounded-[32px] flex items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-500">
                            <Building2 className="w-12 h-12 text-white" />
                        </div>
                        <h2 className="font-black text-white mb-5" style={{ fontSize: '36px' }}>Business Dashboard</h2>
                        <p className="text-zinc-400 font-bold leading-relaxed mb-10" style={{ fontSize: '22px' }}>
                            Review leads, manage your referrer network, and grow your trade business.
                        </p>
                        <div className="mt-auto flex items-center gap-3 text-white font-black" style={{ fontSize: '22px' }}>
                            Go to Business <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                        </div>
                    </button>
                </div>
            </div>
        </main>
    );
}
