"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, TrendingUp, DollarSign, ShieldCheck, Zap, ArrowRight } from "lucide-react";
import { Metadata } from "next";

export default function ComparePage() {
    const [monthlySpend, setMonthlySpend] = useState(500);
    const [winRate, setWinRate] = useState(30);

    const wasted = Math.round(monthlySpend * (1 - winRate / 100));
    const kept = monthlySpend - wasted;
    const tradeReferCost = 0;
    const annualWaste = wasted * 12;

    return (
        <main className="min-h-screen bg-[#F2F2F2]">

            {/* Hero */}
            <section className="bg-[#1A1A1A] pt-28 pb-20 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(#FF6600 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <p className="text-orange-500 font-black text-sm uppercase tracking-widest mb-4">TradeRefer vs The Rest</p>
                    <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">Stop Paying<br />to Lose Jobs.</h1>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                        Traditional lead sites charge you upfront — win or lose. TradeRefer's revenue-first model means you only pay when you win the work.
                    </p>
                </div>
            </section>

            {/* Calculator */}
            <section className="py-16 bg-white">
                <div className="max-w-3xl mx-auto px-4">
                    <h2 className="text-3xl font-black text-zinc-900 mb-2 text-center">Marketing Waste Calculator</h2>
                    <p className="text-zinc-500 text-center mb-10">See exactly how much you&apos;re burning on traditional lead sites.</p>

                    <div className="bg-zinc-950 rounded-2xl p-8 text-white space-y-8">
                        {/* Slider 1 */}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <label className="font-bold text-zinc-300">Monthly spend on lead sites</label>
                                <span className="text-2xl font-black text-orange-500">${monthlySpend}</span>
                            </div>
                            <input
                                type="range" min={100} max={5000} step={50}
                                value={monthlySpend}
                                onChange={e => setMonthlySpend(Number(e.target.value))}
                                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                                style={{ accentColor: "#FF6600" }}
                            />
                            <div className="flex justify-between text-xs text-zinc-600 mt-1">
                                <span>$100</span><span>$5,000</span>
                            </div>
                        </div>

                        {/* Slider 2 */}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <label className="font-bold text-zinc-300">Your average win rate</label>
                                <span className="text-2xl font-black text-orange-500">{winRate}%</span>
                            </div>
                            <input
                                type="range" min={5} max={90} step={5}
                                value={winRate}
                                onChange={e => setWinRate(Number(e.target.value))}
                                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                                style={{ accentColor: "#FF6600" }}
                            />
                            <div className="flex justify-between text-xs text-zinc-600 mt-1">
                                <span>5%</span><span>90%</span>
                            </div>
                        </div>

                        {/* Result */}
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                            <div className="bg-red-950/50 border border-red-800/40 rounded-xl p-5 text-center">
                                <p className="text-xs text-red-400 uppercase tracking-widest font-bold mb-2">Wasted Monthly</p>
                                <p className="text-4xl font-black text-red-400">${wasted}</p>
                                <p className="text-xs text-red-600 mt-1">${annualWaste.toLocaleString()} per year</p>
                            </div>
                            <div className="bg-green-950/50 border border-green-800/40 rounded-xl p-5 text-center">
                                <p className="text-xs text-green-400 uppercase tracking-widest font-bold mb-2">With TradeRefer</p>
                                <p className="text-4xl font-black text-green-400">$0</p>
                                <p className="text-xs text-green-600 mt-1">Upfront cost. Zero.</p>
                            </div>
                        </div>

                        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-5 text-center">
                            <p className="text-sm text-orange-300 font-bold">Your Protected Cash Flow</p>
                            <p className="text-5xl font-black text-orange-400 mt-1">${wasted}<span className="text-xl">/mo</span></p>
                            <p className="text-sm text-zinc-400 mt-2">saved by switching to a revenue-first model</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Comparison Table */}
            <section className="py-16 bg-[#F2F2F2]">
                <div className="max-w-4xl mx-auto px-4">
                    <h2 className="text-3xl font-black text-zinc-900 mb-2 text-center">Side-by-Side Comparison</h2>
                    <p className="text-zinc-500 text-center mb-10">Traditional platforms vs TradeRefer</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Column A — Traditional */}
                        <div className="bg-white rounded-2xl p-8 border-t-4 border-red-500 shadow-sm">
                            <div className="text-center mb-6">
                                <span className="bg-red-100 text-red-600 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest">Traditional Lead Sites</span>
                                <p className="text-sm text-zinc-400 mt-3">HiPages, Hipages, ServiceSeeking</p>
                            </div>
                            <ul className="space-y-5">
                                {[
                                    { label: "$21+ per lead just to quote", sub: "Pay before you even know if you'll win" },
                                    { label: "Shared with 3–5 competitors", sub: "You're racing to quote cheapest, not best" },
                                    { label: "Pay even if you lose", sub: "Sunk cost — money gone forever" },
                                    { label: "No quality filter", sub: "Any tradie can buy the same lead" },
                                    { label: "Monthly subscription fees", sub: "Fixed costs before a single job" },
                                ].map(item => (
                                    <li key={item.label} className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                                            <XCircle className="w-4 h-4 text-red-500" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-zinc-900">{item.label}</p>
                                            <p className="text-sm text-zinc-500">{item.sub}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Column B — TradeRefer */}
                        <div className="bg-[#1A1A1A] rounded-2xl p-8 border-t-4 border-orange-500 shadow-xl text-white">
                            <div className="text-center mb-6">
                                <span className="bg-orange-500 text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest">TradeRefer</span>
                                <p className="text-sm text-zinc-500 mt-3">Revenue-first. ABN verified.</p>
                            </div>
                            <ul className="space-y-5">
                                {[
                                    { label: "$0 per lead — ever", sub: "Zero upfront. Browse, quote, win first" },
                                    { label: "Exclusive referrals to you", sub: "Community-matched, not mass-distributed" },
                                    { label: "Pay only when you win", sub: "20% success fee on completed jobs only" },
                                    { label: "ABN + license verified only", sub: "Every business on the platform is checked" },
                                    { label: "No subscriptions", sub: "No monthly fees, no lock-in contracts" },
                                ].map(item => (
                                    <li key={item.label} className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                            <CheckCircle2 className="w-4 h-4 text-orange-400" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">{item.label}</p>
                                            <p className="text-sm text-zinc-400">{item.sub}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="mt-10 text-center">
                        <Link
                            href="/register?type=business"
                            className="inline-flex items-center gap-3 bg-orange-500 hover:bg-orange-600 text-white font-black text-xl px-10 py-5 rounded-xl shadow-xl transition-all hover:scale-105 active:scale-95"
                        >
                            Switch to Revenue-First <ArrowRight className="w-5 h-5" />
                        </Link>
                        <p className="text-sm text-zinc-500 mt-4">No credit card. No subscription. ABN required.</p>
                    </div>
                </div>
            </section>

            {/* Schema — Comparison structured data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebPage",
                        "name": "TradeRefer vs Traditional Lead Sites",
                        "description": "Compare TradeRefer's revenue-first model against traditional lead sites like HiPages. Zero upfront cost, pay only when you win.",
                        "url": "https://traderefer.au/compare",
                        "publisher": { "@type": "Organization", "name": "TradeRefer", "url": "https://traderefer.au" }
                    })
                }}
            />
        </main>
    );
}
