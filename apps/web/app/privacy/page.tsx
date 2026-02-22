import { Shield, Lock, Eye, FileText, ChevronRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-zinc-50 pt-32 pb-20">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="mb-12 space-y-4">
                    <BackButton />
                    <div className="inline-flex px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 text-base font-black uppercase tracking-widest">
                        Last Updated: 19 Feb 2026
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-zinc-900 font-display tracking-tight">Privacy Policy</h1>
                    <p className="text-lg text-zinc-500 font-medium mt-4 leading-relaxed max-w-2xl">
                        We take your privacy seriously. This policy explains how we collect, use, and protect your data across the TradeRefer platform.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                    {/* Sidebar TOC */}
                    <div className="hidden lg:block space-y-4 sticky top-32 h-fit">
                        <div className="text-base font-black text-zinc-400 uppercase tracking-widest mb-6">Contents</div>
                        {[
                            { label: "Introduction", active: true },
                            { label: "Data Collection" },
                            { label: "How We Use Data" },
                            { label: "Third-Party Services" },
                            { label: "User Rights (APP)" },
                            { label: "Data Security" }
                        ].map((item) => (
                            <div key={item.label} className={`text-sm font-bold flex items-center gap-2 group cursor-pointer ${item.active ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}>
                                {item.active && <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />}
                                {item.label}
                            </div>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="lg:col-span-3 bg-white rounded-[40px] border border-zinc-200 p-8 md:p-14 shadow-sm space-y-16">
                        <section>
                            <h2 className="text-2xl font-black text-zinc-900 mb-6 font-display flex items-center gap-3">
                                <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center font-bold text-sm">1</div>
                                Introduction
                            </h2>
                            <p className="text-zinc-600 leading-relaxed font-medium">
                                TradeRefer operates a referral-powered lead marketplace. This Privacy Policy applies to all services provided by TradeRefer and outlines our commitment to protecting your personal information under the <span className="text-zinc-900 font-bold underline decoration-zinc-200">Privacy Act 1988 (Cth)</span>.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black text-zinc-900 mb-6 font-display flex items-center gap-3">
                                <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center font-bold text-sm">2</div>
                                Data Collection
                            </h2>
                            <p className="text-zinc-600 leading-relaxed font-medium mb-8">
                                We collect information that you provide directly to us when you create an account, list a lead, or complete a transaction.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                                    <Shield className="w-6 h-6 text-orange-500 mb-4" />
                                    <div className="font-bold text-zinc-900 text-sm mb-2">Account Info</div>
                                    <p className="text-sm text-zinc-500 font-medium">Name, email, and credentials via Neon Auth.</p>
                                </div>
                                <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                                    <Eye className="w-6 h-6 text-blue-500 mb-4" />
                                    <div className="font-bold text-zinc-900 text-sm mb-2">Lead Data</div>
                                    <p className="text-sm text-zinc-500 font-medium">Referral info, industry, and location.</p>
                                </div>
                                <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                                    <Lock className="w-6 h-6 text-green-500 mb-4" />
                                    <div className="font-bold text-zinc-900 text-sm mb-2">Payments</div>
                                    <p className="text-sm text-zinc-500 font-medium">Securely via Stripe. No local card storage.</p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black text-zinc-900 mb-6 font-display flex items-center gap-3">
                                <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center font-bold text-sm">3</div>
                                How We Use Data
                            </h2>
                            <div className="space-y-4">
                                <div className="flex gap-4 items-start pb-6 border-b border-zinc-50">
                                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2" />
                                    <div>
                                        <div className="font-bold text-zinc-900">Service Delivery</div>
                                        <p className="text-sm text-zinc-500 font-medium">To facilitate matching lead providers and purchasers effectively.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2" />
                                    <div>
                                        <div className="font-bold text-zinc-900">Security</div>
                                        <p className="text-sm text-zinc-500 font-medium">To detect and prevent fraudulent transactions or unauthorized access.</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black text-zinc-900 mb-6 font-display flex items-center gap-3">
                                <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center font-bold text-sm">4</div>
                                Third-Party Services
                            </h2>
                            <p className="text-zinc-600 leading-relaxed font-medium mb-8">
                                TradeRefer integrates with best-in-class providers to ensure your data is handled professionally:
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="bg-zinc-900 text-white px-8 py-6 rounded-3xl flex-1 flex items-center justify-between">
                                    <div>
                                        <div className="text-base font-black text-zinc-500 uppercase tracking-widest mb-1">Auth Engine</div>
                                        <div className="font-black text-lg">Neon Auth</div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-orange-500" />
                                </div>
                                <div className="bg-blue-600 text-white px-8 py-6 rounded-3xl flex-1 flex items-center justify-between">
                                    <div>
                                        <div className="text-base font-black text-white/50 uppercase tracking-widest mb-1">Payments</div>
                                        <div className="font-black text-lg">Stripe</div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-white/50" />
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black text-zinc-900 mb-6 font-display flex items-center gap-3">
                                <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center font-bold text-sm">5</div>
                                User Rights (APP)
                            </h2>
                            <div className="bg-orange-50 rounded-3xl p-8 border border-orange-100">
                                <p className="text-orange-900 font-medium leading-relaxed italic border-l-4 border-orange-500 pl-6">
                                    "You have the right to request access to the personal information we hold about you and to ask for it to be corrected if it is inaccurate, out-of-date, or incomplete."
                                </p>
                            </div>
                        </section>

                        <div className="pt-12 border-t border-zinc-100 text-center">
                            <p className="text-sm font-bold text-zinc-400">Questions about your privacy?</p>
                            <a href="mailto:privacy@traderefer.com.au" className="text-orange-600 font-black hover:underline mt-2 inline-block">
                                privacy@traderefer.com.au
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
