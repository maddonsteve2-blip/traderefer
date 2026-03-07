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
                    <h1 className="text-4xl md:text-5xl font-black text-zinc-900 mb-4 tracking-tight">
                        Welcome back — which dashboard?
                    </h1>
                    <p className="text-xl text-zinc-500 font-medium">
                        You have both a Business and Referrer account. Choose where to go.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Referrer */}
                    <button
                        onClick={() => router.push("/dashboard/referrer")}
                        className="group text-left h-full p-8 md:p-12 bg-white rounded-[40px] border border-zinc-200 shadow-xl shadow-zinc-200/50 hover:border-orange-500/50 hover:shadow-orange-500/10 transition-all duration-500 flex flex-col items-center text-center"
                    >
                        <div className="w-20 h-20 bg-orange-500/10 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                            <Rocket className="w-10 h-10 text-orange-500" />
                        </div>
                        <h2 className="text-2xl font-black text-zinc-900 mb-4">Referrer Dashboard</h2>
                        <p className="text-zinc-500 font-medium leading-relaxed mb-8">
                            Manage your referral network, track earnings, and grow your passive income.
                        </p>
                        <div className="mt-auto flex items-center gap-2 text-orange-600 font-black">
                            Go to Referrer <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </button>

                    {/* Business */}
                    <button
                        onClick={() => router.push("/dashboard/business")}
                        className="group text-left h-full p-8 md:p-12 bg-zinc-900 rounded-[40px] border border-zinc-800 shadow-2xl shadow-zinc-900/20 hover:border-zinc-700 transition-all duration-500 flex flex-col items-center text-center"
                    >
                        <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                            <Building2 className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-4">Business Dashboard</h2>
                        <p className="text-zinc-400 font-medium leading-relaxed mb-8">
                            Review leads, manage your referrer network, and grow your trade business.
                        </p>
                        <div className="mt-auto flex items-center gap-2 text-white font-black">
                            Go to Business <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </button>
                </div>
            </div>
        </main>
    );
}
