"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, TrendingUp, ArrowRight, ShieldCheck } from "lucide-react";

export default function ComparePage() {
    const [monthlySpend, setMonthlySpend] = useState(500);
    const [winRate, setWinRate] = useState(30);

    const wasted = Math.round(monthlySpend * (1 - winRate / 100));
    const annualWaste = wasted * 12;

    const spendPct = `${((monthlySpend - 100) / (5000 - 100)) * 100}%`;
    const winPct = `${((winRate - 5) / (90 - 5)) * 100}%`;

    return (
        <main className="min-h-screen bg-[#FCFCFC] text-[#1A1A1A] antialiased">

            {/* ── HERO ── */}
            <section className="relative pt-36 pb-24 overflow-hidden bg-[#FCFCFC] border-b border-gray-200">
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center"
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=2670&auto=format&fit=crop')" }}
                />
                <div className="absolute inset-0 z-0 bg-[#FCFCFC]/80" />
                <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
                    <p className="text-[#FF6600] font-black text-lg uppercase tracking-widest mb-5">TradeRefer vs The Rest</p>
                    <h1 className="text-[42px] md:text-7xl lg:text-[80px] font-extrabold text-[#1A1A1A] mb-6 leading-[1.1] font-display">
                        Stop Paying<br />to Lose Jobs.
                    </h1>
                    <p className="text-[#1A1A1A] max-w-2xl mx-auto" style={{ fontSize: '20px', lineHeight: 1.7 }}>
                        Traditional lead sites charge you upfront — win or lose. TradeRefer&apos;s revenue-first model means you only pay when you win the work.
                    </p>
                </div>
            </section>

            {/* ── MARKETING WASTE CALCULATOR ── */}
            <section className="py-20 bg-[#FCFCFC] border-b border-gray-200">
                <div className="max-w-3xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <p className="text-[#FF6600] font-black text-lg uppercase tracking-widest mb-4">For Trade Businesses</p>
                        <h2 className="text-[32px] md:text-[52px] font-extrabold text-[#1A1A1A] font-display leading-tight">
                            Marketing Waste Calculator
                        </h2>
                        <p className="text-gray-600 mt-4" style={{ fontSize: '20px', lineHeight: 1.7 }}>
                            See exactly how much you&apos;re burning on traditional lead sites every month.
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl overflow-hidden">
                        {/* Card header */}
                        <div className="bg-[#1A1A1A] px-8 py-6">
                            <h3 className="text-3xl md:text-4xl font-extrabold text-white font-display">Protect Your Cash Flow.</h3>
                            <p className="text-zinc-400 text-lg mt-2">Move the sliders to see your real numbers.</p>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Slider 1 */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <label className="text-lg font-bold text-[#1A1A1A]">Monthly spend on lead sites</label>
                                    <span className="text-4xl font-black text-[#1A1A1A]">${monthlySpend}</span>
                                </div>
                                <input
                                    type="range" min={100} max={5000} step={50}
                                    value={monthlySpend}
                                    onChange={e => setMonthlySpend(Number(e.target.value))}
                                    className="slider-dark w-full"
                                    style={{ "--val": spendPct } as React.CSSProperties}
                                />
                                <div className="flex justify-between text-base text-gray-500 mt-3 font-medium">
                                    <span>$100/mo</span><span>$5,000/mo</span>
                                </div>
                            </div>

                            {/* Slider 2 */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <label className="text-lg font-bold text-[#1A1A1A]">Your average lead win rate</label>
                                    <span className="text-4xl font-black text-[#1A1A1A]">{winRate}%</span>
                                </div>
                                <input
                                    type="range" min={5} max={90} step={5}
                                    value={winRate}
                                    onChange={e => setWinRate(Number(e.target.value))}
                                    className="slider-dark w-full"
                                    style={{ "--val": winPct } as React.CSSProperties}
                                />
                                <div className="flex justify-between text-base text-gray-500 mt-3 font-medium">
                                    <span>5% win rate</span><span>90% win rate</span>
                                </div>
                            </div>

                            {/* Results row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center">
                                    <p className="text-base font-black text-red-600 uppercase tracking-widest mb-2">Wasted Monthly</p>
                                    <p className="text-5xl font-black text-red-500 leading-none">${wasted.toLocaleString()}</p>
                                    <p className="text-base text-red-400 mt-2 font-medium">${annualWaste.toLocaleString()} per year</p>
                                </div>
                                <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center">
                                    <p className="text-base font-black text-green-600 uppercase tracking-widest mb-2">With TradeRefer</p>
                                    <p className="text-5xl font-black text-green-600 leading-none">$0</p>
                                    <p className="text-base text-green-500 mt-2 font-medium">Upfront cost. Zero.</p>
                                </div>
                            </div>

                            {/* Protected Cash Flow result */}
                            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center">
                                <p className="text-base font-black text-green-700 uppercase tracking-widest mb-2">Your Protected Cash Flow</p>
                                <p className="text-6xl md:text-7xl font-black text-green-600 leading-none">
                                    ${wasted.toLocaleString()}<span className="text-3xl">/mo</span>
                                </p>
                                <p className="text-lg text-green-700 mt-3 font-medium">
                                    saved by switching to a revenue-first model
                                </p>
                            </div>

                            <p className="text-base text-gray-500" style={{ lineHeight: 1.7 }}>
                                TradeRefer charges $0 upfront. The 20% success fee on won jobs qualifies as a Marketing &amp; Promotion expense deductible under <strong>Section 8-1 of the ITAA 1997</strong>.
                            </p>

                            <Link
                                href="/register?type=business"
                                className="flex items-center justify-center gap-3 w-full bg-[#1A1A1A] hover:bg-zinc-800 text-white font-black rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 font-cta"
                                style={{ minHeight: "64px", fontSize: "22px" }}
                            >
                                Protect My Cash Flow <TrendingUp className="w-6 h-6" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── SIDE-BY-SIDE COMPARISON ── */}
            <section className="py-20 bg-[#F2F2F2] border-b border-gray-200">
                <div className="max-w-5xl mx-auto px-4">
                    <div className="text-center mb-14">
                        <p className="text-[#FF6600] font-black text-lg uppercase tracking-widest mb-4">The Math is Simple</p>
                        <h2 className="text-[32px] md:text-[52px] font-extrabold text-[#1A1A1A] font-display leading-tight">
                            Side-by-Side Comparison
                        </h2>
                        <p className="text-gray-600 mt-4" style={{ fontSize: '20px', lineHeight: 1.7 }}>
                            Traditional platforms vs TradeRefer — no spin, just the numbers.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                        {/* Column A — Traditional */}
                        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg overflow-hidden">
                            <div className="bg-gray-100 border-b-4 border-red-500 px-8 py-6 text-center">
                                <span className="bg-red-100 text-red-700 text-sm font-black px-5 py-2 rounded-full uppercase tracking-widest">Traditional Lead Sites</span>
                                <p className="text-gray-500 mt-3" style={{ fontSize: '17px' }}>HiPages, Hipages, ServiceSeeking</p>
                            </div>
                            <div className="p-8">
                                <ul className="space-y-6">
                                    {[
                                        { label: "$21+ per lead just to quote", sub: "Pay before you even know if you'll win" },
                                        { label: "Shared with 3–5 competitors", sub: "Racing to quote cheapest, not best" },
                                        { label: "Pay even if you lose", sub: "Sunk cost — money gone forever" },
                                        { label: "No quality filter", sub: "Any tradie can buy the same lead" },
                                        { label: "Monthly subscription fees", sub: "Fixed costs before a single job" },
                                    ].map(item => (
                                        <li key={item.label} className="flex items-start gap-4">
                                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                                                <XCircle className="w-5 h-5 text-red-600" />
                                            </div>
                                            <div>
                                                <p className="font-black text-[#1A1A1A] text-xl">{item.label}</p>
                                                <p className="text-gray-500 mt-1" style={{ fontSize: '17px', lineHeight: 1.7 }}>{item.sub}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                                    <span className="text-red-500 font-black text-xl">High Risk, Unknown Reward</span>
                                </div>
                            </div>
                        </div>

                        {/* Column B — TradeRefer */}
                        <div className="bg-white rounded-2xl border-2 border-[#FF6600] shadow-xl overflow-hidden">
                            <div className="bg-[#FF6600] px-8 py-6 text-center">
                                <span className="bg-white text-[#FF6600] text-sm font-black px-5 py-2 rounded-full uppercase tracking-widest">TradeRefer</span>
                                <p className="text-white/85 mt-3" style={{ fontSize: '17px' }}>Revenue-first. ABN &amp; Licence Verified.</p>
                            </div>
                            <div className="p-8">
                                <ul className="space-y-6">
                                    {[
                                        { label: "$0 per lead — ever", sub: "Zero upfront. Browse, quote, win first" },
                                        { label: "Exclusive referrals to you", sub: "Community-matched, not mass-distributed" },
                                        { label: "Pay only when you win", sub: "20% success fee on completed jobs only" },
                                        { label: "ABN + licence verified only", sub: "Every business on the platform is checked" },
                                        { label: "No subscriptions", sub: "No monthly fees, no lock-in contracts" },
                                    ].map(item => (
                                        <li key={item.label} className="flex items-start gap-4">
                                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="font-black text-[#1A1A1A] text-xl">{item.label}</p>
                                                <p className="text-gray-500 mt-1" style={{ fontSize: '17px', lineHeight: 1.7 }}>{item.sub}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                                    <span className="text-green-600 font-black text-xl">Zero Risk, Infinite Upside</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Final CTA */}
                    <div className="mt-14 text-center">
                        <Link
                            href="/register?type=business"
                            className="inline-flex items-center justify-center gap-3 bg-[#FF6600] hover:bg-[#E65C00] text-white font-black rounded-xl shadow-xl transition-all hover:scale-105 active:scale-95 font-cta px-12"
                            style={{ minHeight: "64px", fontSize: "22px" }}
                        >
                            Switch to Revenue-First <ArrowRight className="w-6 h-6" />
                        </Link>
                        <p className="text-gray-500 mt-5" style={{ fontSize: '18px' }}>
                            No credit card. No subscription. ABN required.
                        </p>
                        <p className="text-gray-400 mt-2" style={{ fontSize: '15px', lineHeight: 1.7 }}>
                            The 20% success fee is a fully deductible Marketing &amp; Promotion expense under Section 8-1 of the ITAA 1997.
                        </p>
                    </div>
                </div>
            </section>

            {/* Schema */}
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
