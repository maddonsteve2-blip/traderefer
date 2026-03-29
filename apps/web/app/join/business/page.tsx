import { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Gift, Users, ArrowRight, Zap, DollarSign, ShieldCheck, CheckCircle, TrendingUp, Building2, BadgeCheck, Star, Settings, Quote } from "lucide-react";

export const metadata: Metadata = {
    title: "You're Invited to TradeRefer | Get Qualified Leads for Your Trade Business",
    description: "Join TradeRefer free. Set your own referral fee, get AI-screened leads from trusted local referrers, and only pay when you unlock a lead. First lead free.",
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
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-zinc-100">
                <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-3 flex items-center justify-between">
                    <Link href="/"><Logo size="sm" /></Link>
                    <Link
                        href={signUpUrl}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-black text-base px-6 py-2.5 rounded-full transition-all active:scale-95 shadow-lg shadow-orange-600/25 ring-2 ring-orange-600/20"
                    >
                        Claim Free Profile
                    </Link>
                </div>
            </header>

            {/* ═══ HERO — Split layout ═══ */}
            <section className="w-full bg-white">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 md:py-16 grid lg:grid-cols-2 gap-8 lg:gap-14 items-center">
                    {/* Left: Copy */}
                    <div>
                        {inviterName && (
                            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 font-bold text-base px-4 py-2 rounded-full mb-4 border border-emerald-100">
                                <Users className="w-4 h-4" />
                                {inviterName} invited you
                            </div>
                        )}

                        <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-black text-zinc-900 tracking-tight leading-[1.1] mb-4">
                            {inviteeName ? (
                                <>Hi {inviteeName}!<br />Get <span className="text-emerald-600">qualified leads</span> from local referrers</>
                            ) : (
                                <>Get <span className="text-emerald-600">qualified leads</span> sent straight to your business</>
                            )}
                        </h1>

                        <p className="text-xl text-zinc-500 font-medium leading-relaxed mb-5 max-w-lg">
                            TradeRefer connects your business with trusted local referrers who recommend you to people looking for work done. <strong className="text-zinc-800">You set your own referral fee</strong> — and only pay when you choose to unlock a lead.
                        </p>

                        <p className="text-base text-emerald-600 font-bold mb-5 flex items-center gap-1.5">
                            <Building2 className="w-4 h-4" /> 5,000+ businesses already listed across Australia
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 mb-4">
                            <Link
                                href={signUpUrl}
                                className="inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-black text-lg px-8 py-4 rounded-full transition-all active:scale-95 shadow-xl shadow-orange-600/25 ring-2 ring-orange-600/20"
                            >
                                Claim Your Free Profile <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>

                        <div className="flex flex-wrap gap-x-5 gap-y-2 text-base text-zinc-500 font-bold">
                            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> Free to list</span>
                            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> No monthly fees</span>
                            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> First lead is free</span>
                        </div>
                    </div>

                    {/* Right: Pricing/value card */}
                    <div className="bg-zinc-800 rounded-3xl p-6 md:p-8 text-white shadow-2xl border border-zinc-700/50">
                        <p className="text-zinc-400 font-bold text-xs uppercase tracking-widest mb-4">You&apos;re in control</p>

                        <div className="bg-white/5 rounded-2xl p-5 border border-white/10 mb-5">
                            <div className="flex items-center justify-between mb-3">
                                <p className="font-black text-white text-xl">Your referral fee</p>
                                <Settings className="w-5 h-5 text-zinc-500" />
                            </div>
                            <div className="flex items-end gap-2 mb-2">
                                <span className="text-5xl font-black text-emerald-400">$3–$75</span>
                                <span className="text-zinc-500 font-bold text-base mb-2">you decide</span>
                            </div>
                            <p className="text-zinc-400 text-base font-medium">Set any amount from $3 to $75+. Higher fees attract more referrers to promote your business.</p>
                        </div>

                        <div className="space-y-3 mb-5">
                            <div className="flex justify-between items-center bg-white/5 rounded-xl p-3 border border-white/10">
                                <span className="text-zinc-400 font-medium text-base">Your fee (you set this)</span>
                                <span className="font-black text-white">$10.00</span>
                            </div>
                            <div className="flex justify-between items-center bg-white/5 rounded-xl p-3 border border-white/10">
                                <span className="text-zinc-400 font-medium text-base">Platform fee (20%)</span>
                                <span className="font-black text-white">$2.00</span>
                            </div>
                            <div className="flex justify-between items-center bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20">
                                <span className="text-emerald-300 font-bold text-base">Total to unlock a lead</span>
                                <span className="font-black text-emerald-400 text-xl">$12.00</span>
                            </div>
                        </div>

                        <div className="border-t border-white/10 pt-4">
                            <p className="text-zinc-400 text-[15px] font-medium">Example based on $10 referral fee. All leads are AI-screened for quality before you see them.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ HOW IT WORKS — 4-step wide row ═══ */}
            <section className="w-full bg-zinc-50 border-y border-zinc-200/60">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 md:py-14">
                    <h2 className="text-3xl md:text-4xl font-black text-zinc-900 text-center mb-8 tracking-tight">
                        How it works for your business
                    </h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
                        {[
                            { step: "1", icon: Building2, title: "Create your profile", desc: "Free listing in 3 minutes. Add your trade, area, photos & reviews." },
                            { step: "2", icon: DollarSign, title: "Set your fee", desc: "Choose what you'll pay per lead ($3–$75+). Change it anytime." },
                            { step: "3", icon: TrendingUp, title: "Referrers promote you", desc: "Trusted locals recommend your business to people who need work done." },
                            { step: "4", icon: BadgeCheck, title: "Unlock & win jobs", desc: "See AI-screened leads, unlock the ones you want, contact them directly." },
                        ].map(({ step, icon: Icon, title, desc }) => (
                            <div key={step} className="bg-white rounded-2xl p-5 md:p-7 border border-zinc-200/80 text-center shadow-sm">
                                <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Icon className="w-7 h-7 text-zinc-700" />
                                </div>
                                <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-1.5">Step {step}</p>
                                <h3 className="text-lg md:text-xl font-black text-zinc-900 mb-1.5">{title}</h3>
                                <p className="text-zinc-500 font-medium text-base leading-snug">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ TESTIMONIAL ═══ */}
            <section className="w-full bg-white">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 md:py-14">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center">
                        <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                            <Quote className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xl text-zinc-800 font-bold leading-relaxed mb-2">
                                &ldquo;We got 3 solid jobs in our first week. The leads are genuine — real people who need work done, not spam. Best part is we set our own fee.&rdquo;
                            </p>
                            <p className="text-base text-zinc-500 font-bold">Mark T. — Plumber, Melbourne</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ SPLIT: Why TradeRefer + Bonus ═══ */}
            <section className="w-full bg-zinc-50 border-y border-zinc-200/60">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 md:py-14 grid lg:grid-cols-5 gap-6 items-stretch">

                    {/* Left: Why it works (3 cols) */}
                    <div className="lg:col-span-3 rounded-3xl bg-zinc-800 p-6 md:p-8 text-white flex flex-col border border-zinc-700/50">
                        <h3 className="text-2xl font-black mb-5">Why businesses choose TradeRefer</h3>
                        <div className="space-y-4 flex-1">
                            {[
                                { icon: ShieldCheck, title: "No monthly fees or contracts", desc: "Your listing is 100% free. Only pay when you choose to unlock a lead." },
                                { icon: Zap, title: "AI-screened leads", desc: "Every lead goes through AI screening before reaching you. No spam, no tyre kickers." },
                                { icon: DollarSign, title: "You control the cost", desc: "Set your referral fee from $3 to $75+. Higher fees attract more referrers to promote you." },
                                { icon: Star, title: "First lead is free", desc: "Try it risk-free. Your first lead costs nothing — we want you to see the quality." },
                            ].map(({ icon: Icon, title, desc }) => (
                                <div key={title} className="flex gap-4 items-start">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                                        <Icon className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="font-black text-white text-lg mb-0.5">{title}</p>
                                        <p className="text-zinc-400 text-base font-medium">{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-white/10">
                            {[
                                { value: "5,000+", label: "Businesses" },
                                { value: "50+", label: "Trade Types" },
                                { value: "1,200+", label: "Referrers" },
                            ].map(s => (
                                <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                                    <p className="text-2xl font-black text-emerald-400">{s.value}</p>
                                    <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Trade types + Bonus (2 cols) */}
                    <div className="lg:col-span-2 flex flex-col gap-5">
                        {/* Trade types */}
                        <div className="rounded-2xl bg-white border border-zinc-200 p-5 md:p-6">
                            <h3 className="text-lg font-black text-zinc-900 mb-3">Works for every trade</h3>
                            <div className="flex flex-wrap gap-1.5">
                                {["Plumbing", "Electrical", "Building", "Roofing", "Painting", "Carpentry", "Landscaping", "Tiling", "Fencing", "HVAC", "Solar", "+50 more"].map(trade => (
                                    <span key={trade} className="bg-zinc-50 text-zinc-600 font-bold text-sm px-3 py-1.5 rounded-full border border-zinc-200">
                                        {trade}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Prezzee invite bonus — premium dark card */}
                        <div className="rounded-2xl bg-[#0F172A] p-5 md:p-6 flex-1 flex flex-col relative overflow-hidden border border-white/5 shadow-xl">
                            {/* Subtle glow effects */}
                            <div className="absolute -top-16 -right-16 w-36 h-36 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
                            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                            <div className="relative z-10 flex flex-col h-full">
                                {/* Prezzee branding */}
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-white/60 font-black uppercase tracking-[0.2em] text-[10px]">Bonus by</span>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src="/images/prezzee/prezzee-logo.svg" alt="Prezzee" className="h-3.5 w-auto brightness-0 invert opacity-70" />
                                </div>

                                {/* Smart Card GIF + headline side by side */}
                                <div className="flex items-center gap-4 mb-3">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src="https://files.poweredbyprezzee.com/products/7af951a6-2a13-004b-f0eb-a87382a5b2e7/8eff8e56-2718-4514-8e1a-15ca1eb22793/Prezzee_3D_-_AU_%281%29_452_280.gif"
                                        alt="Prezzee Smart Card"
                                        className="w-28 rounded-xl shadow-2xl shadow-black/40 shrink-0"
                                    />
                                    <div>
                                        <p className="text-white font-black text-base mb-0.5">Invite 5 people</p>
                                        <p className="text-emerald-400 font-black text-3xl leading-none">$25</p>
                                        <p className="text-white/70 font-bold text-sm">Gift Card</p>
                                    </div>
                                </div>

                                <p className="text-zinc-400 font-medium text-sm mb-4 leading-relaxed">
                                    Know other tradies? Once 5 sign up and become active, you get a $25 Prezzee Smart Card automatically.
                                </p>

                                {/* Brand chips */}
                                <div className="flex flex-wrap gap-1.5 mt-auto">
                                    {["Woolworths", "Bunnings", "Uber", "Netflix", "+400"].map(b => (
                                        <span key={b} className="bg-white/10 text-white/80 font-bold text-[11px] px-2.5 py-1 rounded-lg border border-white/5">{b}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ FINAL CTA ═══ */}
            <section className="w-full bg-white">
                <div className="max-w-3xl mx-auto px-4 py-12 md:py-16 text-center">
                    <h2 className="text-3xl md:text-4xl font-black text-zinc-900 mb-3 tracking-tight">
                        {inviterName
                            ? `${inviterName} thinks you'd be a great fit`
                            : "Ready to get more leads?"
                        }
                    </h2>
                    <p className="text-xl text-zinc-500 font-medium mb-6 max-w-lg mx-auto">
                        Create your free profile in 3 minutes. Set your own referral fee, get AI-screened leads, and your first lead is on us.
                    </p>
                    <Link
                        href={signUpUrl}
                        className="inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-black text-lg px-10 py-4 rounded-full transition-all active:scale-95 shadow-xl shadow-orange-600/25 ring-2 ring-orange-600/20"
                    >
                        Claim Your Free Profile <ArrowRight className="w-5 h-5" />
                    </Link>
                    <p className="mt-3 text-base text-zinc-400 font-medium">Free forever. No credit card. No lock-in.</p>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-5 border-t border-zinc-100">
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
