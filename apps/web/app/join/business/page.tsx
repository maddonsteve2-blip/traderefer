import { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Gift, Users, ArrowRight, Zap, DollarSign, ShieldCheck, CheckCircle, TrendingUp, Building2, BadgeCheck, Star, Settings } from "lucide-react";

export const metadata: Metadata = {
    title: "You're Invited to TradeRefer | Get Qualified Leads for Your Trade Business",
    description: "Join TradeRefer free. Set your own referral fee ($3–$75), get AI-screened leads from trusted local referrers, and only pay when you unlock a lead.",
    robots: { index: false, follow: false },
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function resolveInvite(code: string) {
    try {
        const res = await fetch(`${API}/invitations/resolve?code=${encodeURIComponent(code)}`, {
            cache: "no-store",
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export default async function JoinBusinessPage({
    searchParams,
}: {
    searchParams: Promise<{ invite?: string }>;
}) {
    const params = await searchParams;
    const inviteCode = params.invite || "";
    const inviteData = inviteCode ? await resolveInvite(inviteCode) : null;
    const inviterName = inviteData?.found ? inviteData.inviter_name : null;
    const inviteeName = inviteData?.found ? inviteData.invitee_name : null;

    const signUpUrl = `/register?redirect_url=${encodeURIComponent(`/onboarding/business${inviteCode ? `?invite=${inviteCode}` : ""}`)}`;

    return (
        <main className="min-h-screen bg-white">
            {/* Sticky nav */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-zinc-100">
                <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-3 flex items-center justify-between">
                    <Link href="/"><Logo size="sm" /></Link>
                    <Link
                        href={signUpUrl}
                        className="bg-zinc-900 hover:bg-zinc-800 text-white font-black text-sm px-6 py-2.5 rounded-full transition-all active:scale-95 shadow-lg"
                    >
                        Claim Free Profile
                    </Link>
                </div>
            </header>

            {/* ═══ HERO — Split layout ═══ */}
            <section className="w-full bg-gradient-to-br from-zinc-50 via-white to-orange-50">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12 md:py-20 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                    {/* Left: Copy */}
                    <div>
                        {inviterName && (
                            <div className="inline-flex items-center gap-2 bg-zinc-100 text-zinc-700 font-bold text-sm px-4 py-2 rounded-full mb-5">
                                <Users className="w-4 h-4" />
                                {inviterName} invited you
                            </div>
                        )}

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-zinc-900 tracking-tight leading-[1.1] mb-5">
                            {inviteeName ? (
                                <>Hi {inviteeName}!<br />Get <span className="text-orange-500">qualified leads</span> from local referrers</>
                            ) : (
                                <>Get <span className="text-orange-500">qualified leads</span> sent straight to your business</>
                            )}
                        </h1>

                        <p className="text-lg text-zinc-500 font-medium leading-relaxed mb-6 max-w-lg">
                            TradeRefer connects your business with trusted local referrers who recommend you to people looking for work done. <strong className="text-zinc-800">You set your own referral fee</strong> — and only pay when you choose to unlock a lead.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 mb-5">
                            <Link
                                href={signUpUrl}
                                className="inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white font-black text-lg px-8 py-4 rounded-full transition-all active:scale-95 shadow-xl"
                            >
                                Claim Your Free Profile <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>

                        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-500 font-bold">
                            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> Free to list</span>
                            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> No monthly fees</span>
                            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> First lead is free</span>
                        </div>
                    </div>

                    {/* Right: Pricing/value card */}
                    <div className="bg-zinc-900 rounded-3xl p-6 md:p-8 text-white shadow-2xl">
                        <p className="text-zinc-400 font-bold text-xs uppercase tracking-widest mb-4">You&apos;re in control</p>

                        <div className="bg-white/5 rounded-2xl p-5 border border-white/10 mb-5">
                            <div className="flex items-center justify-between mb-3">
                                <p className="font-black text-white text-lg">Your referral fee</p>
                                <Settings className="w-5 h-5 text-zinc-500" />
                            </div>
                            <div className="flex items-end gap-2 mb-2">
                                <span className="text-5xl font-black text-orange-400">$3–$75</span>
                                <span className="text-zinc-500 font-bold text-sm mb-2">you decide</span>
                            </div>
                            <p className="text-zinc-400 text-sm font-medium">Set any amount from $3 to $75+. Higher fees attract more referrers to promote your business.</p>
                        </div>

                        <div className="space-y-3 mb-5">
                            <div className="flex justify-between items-center bg-white/5 rounded-xl p-3 border border-white/10">
                                <span className="text-zinc-400 font-medium text-sm">Your fee (you set this)</span>
                                <span className="font-black text-white">$10.00</span>
                            </div>
                            <div className="flex justify-between items-center bg-white/5 rounded-xl p-3 border border-white/10">
                                <span className="text-zinc-400 font-medium text-sm">Platform fee (20%)</span>
                                <span className="font-black text-white">$2.00</span>
                            </div>
                            <div className="flex justify-between items-center bg-orange-500/10 rounded-xl p-3 border border-orange-500/20">
                                <span className="text-orange-300 font-bold text-sm">Total to unlock a lead</span>
                                <span className="font-black text-orange-400 text-xl">$12.00</span>
                            </div>
                        </div>

                        <div className="border-t border-white/10 pt-4">
                            <p className="text-zinc-400 text-sm font-medium">Example based on $10 referral fee. All leads are AI-screened for quality before you see them.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ HOW IT WORKS — 4-step wide row ═══ */}
            <section className="w-full bg-white border-y border-zinc-100">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 py-14 md:py-16">
                    <h2 className="text-2xl md:text-3xl font-black text-zinc-900 text-center mb-10 tracking-tight">
                        How it works for your business
                    </h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {[
                            { step: "1", icon: Building2, title: "Create your profile", desc: "Free listing in 3 minutes. Add your trade, area, photos & reviews." },
                            { step: "2", icon: DollarSign, title: "Set your fee", desc: "Choose what you'll pay per lead ($3–$75+). Change it anytime." },
                            { step: "3", icon: TrendingUp, title: "Referrers promote you", desc: "Trusted locals recommend your business to people who need work done." },
                            { step: "4", icon: BadgeCheck, title: "Unlock & win jobs", desc: "See AI-screened leads, unlock the ones you want, contact them directly." },
                        ].map(({ step, icon: Icon, title, desc }) => (
                            <div key={step} className="bg-zinc-50 rounded-2xl p-5 md:p-6 border border-zinc-100 text-center">
                                <div className="w-12 h-12 bg-zinc-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                                    <Icon className="w-6 h-6 text-zinc-900" />
                                </div>
                                <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-1">Step {step}</p>
                                <h3 className="text-base md:text-lg font-black text-zinc-900 mb-1">{title}</h3>
                                <p className="text-zinc-500 font-medium text-sm leading-snug">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ SPLIT: Why TradeRefer + Bonus ═══ */}
            <section className="w-full">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 py-14 md:py-16 grid lg:grid-cols-2 gap-8 items-stretch">

                    {/* Left: Why it works */}
                    <div className="rounded-3xl bg-zinc-900 p-6 md:p-8 text-white flex flex-col">
                        <h3 className="text-2xl font-black mb-6">Why businesses choose TradeRefer</h3>
                        <div className="space-y-4 flex-1">
                            {[
                                { icon: ShieldCheck, title: "No monthly fees or contracts", desc: "Your listing is 100% free. Only pay when you choose to unlock a lead." },
                                { icon: Zap, title: "AI-screened leads", desc: "Every lead goes through AI screening before reaching you. No spam, no tyre kickers." },
                                { icon: DollarSign, title: "You control the cost", desc: "Set your referral fee from $3 to $75+. Higher fees attract more referrers to promote you." },
                                { icon: Star, title: "First lead is free", desc: "Try it risk-free. Your first lead costs nothing — we want you to see the quality." },
                            ].map(({ icon: Icon, title, desc }) => (
                                <div key={title} className="flex gap-4 items-start">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                                        <Icon className="w-5 h-5 text-orange-400" />
                                    </div>
                                    <div>
                                        <p className="font-black text-white mb-0.5">{title}</p>
                                        <p className="text-zinc-400 text-sm font-medium">{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-white/10">
                            {[
                                { value: "5,000+", label: "Businesses" },
                                { value: "50+", label: "Trade Types" },
                            ].map(s => (
                                <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                                    <p className="text-xl font-black">{s.value}</p>
                                    <p className="text-zinc-500 font-bold text-[11px] uppercase tracking-widest">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Invite bonus */}
                    <div className="flex flex-col gap-6">
                        {/* Trade types */}
                        <div className="rounded-3xl bg-zinc-50 border border-zinc-100 p-6 md:p-8">
                            <h3 className="text-lg font-black text-zinc-900 mb-4">Works for every trade</h3>
                            <div className="flex flex-wrap gap-2">
                                {["Plumbing", "Electrical", "Building", "Roofing", "Painting", "Carpentry", "Landscaping", "Tiling", "Fencing", "Concreting", "HVAC", "Pest Control", "Cleaning", "Solar", "+50 more"].map(trade => (
                                    <span key={trade} className="bg-white text-zinc-600 font-bold text-sm px-3 py-1.5 rounded-full border border-zinc-200">
                                        {trade}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Prezzee invite bonus */}
                        <div className="rounded-3xl bg-[#EAF4FF] border border-blue-100 p-6 md:p-8 flex-1 flex flex-col">
                            <div className="flex items-center gap-2 mb-3">
                                <Gift className="w-5 h-5 text-orange-500" />
                                <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">Bonus</span>
                            </div>
                            <h3 className="text-xl font-black text-zinc-900 mb-2">
                                Invite 5 people → earn a <span className="text-[#FF6600]">$25 Prezzee Smart Card</span>
                            </h3>
                            <p className="text-zinc-500 font-medium text-sm mb-4 leading-relaxed">
                                Know other tradies or people who&apos;d benefit? Invite them to TradeRefer. Once 5 sign up and become active, you get a $25 gift card — spend at Woolworths, Bunnings, Uber & 400+ brands.
                            </p>
                            <div className="flex items-center gap-4 mt-auto">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src="https://files.poweredbyprezzee.com/products/7af951a6-2a13-004b-f0eb-a87382a5b2e7/8eff8e56-2718-4514-8e1a-15ca1eb22793/Prezzee_3D_-_AU_%281%29_452_280.gif"
                                    alt="Prezzee Smart Card"
                                    className="w-24 rounded-xl shadow-md shrink-0"
                                />
                                <div className="flex flex-wrap gap-1.5">
                                    {["Woolworths", "Bunnings", "Uber", "Netflix", "+400"].map(b => (
                                        <span key={b} className="bg-white/80 text-zinc-600 font-bold text-[11px] px-2.5 py-1 rounded-full border border-zinc-200">{b}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ FINAL CTA ═══ */}
            <section className="w-full bg-gradient-to-b from-white to-zinc-50 border-t border-zinc-100">
                <div className="max-w-3xl mx-auto px-4 py-14 md:py-20 text-center">
                    <h2 className="text-3xl md:text-4xl font-black text-zinc-900 mb-4 tracking-tight">
                        {inviterName
                            ? `${inviterName} thinks you'd be a great fit`
                            : "Ready to get more leads?"
                        }
                    </h2>
                    <p className="text-lg text-zinc-500 font-medium mb-8 max-w-lg mx-auto">
                        Create your free profile in 3 minutes. Set your own referral fee, get AI-screened leads from trusted local referrers, and your first lead is on us.
                    </p>
                    <Link
                        href={signUpUrl}
                        className="inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white font-black text-lg px-10 py-4 rounded-full transition-all active:scale-95 shadow-xl"
                    >
                        Claim Your Free Profile <ArrowRight className="w-5 h-5" />
                    </Link>
                    <p className="mt-4 text-sm text-zinc-400 font-medium">Free forever. No credit card. No lock-in.</p>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-6 border-t border-zinc-100">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-zinc-300 text-xs font-bold">© 2026 TradeRefer Pty Ltd</p>
                    <div className="flex gap-4">
                        <Link href="/privacy" className="text-zinc-400 text-xs font-bold hover:text-zinc-900 transition-colors">Privacy</Link>
                        <Link href="/terms" className="text-zinc-400 text-xs font-bold hover:text-zinc-900 transition-colors">Terms</Link>
                        <Link href="/support" className="text-zinc-400 text-xs font-bold hover:text-zinc-900 transition-colors">Support</Link>
                    </div>
                </div>
            </footer>
        </main>
    );
}
