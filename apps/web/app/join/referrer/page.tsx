import { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Gift, Users, ArrowRight, DollarSign, ShieldCheck, CheckCircle, Briefcase, Quote } from "lucide-react";
import { buildOgImageUrl } from "@/lib/og-image";

const referrerJoinOgImage = buildOgImageUrl({
    template: "home",
    title: "Refer tradies you trust",
    subtitle: "Join TradeRefer as a referrer and receive Prezzee rewards when eligible referrals are accepted.",
    eyebrow: "For referrers",
    badge: "Free to join",
    stat1: "Trusted referrals",
    stat2: "Business-set fees",
    stat3: "Prezzee rewards",
});

export const metadata: Metadata = {
    title: "Refer Trusted Tradies | TradeRefer Referrer Rewards",
    description: "Join TradeRefer free as a referrer. Recommend trade businesses you trust and receive Prezzee rewards when eligible referrals are accepted.",
    openGraph: {
        title: "Refer Trusted Tradies | TradeRefer",
        description: "Recommend trade businesses you trust and receive Prezzee rewards when eligible referrals are accepted.",
        url: "https://traderefer.au/join/referrer",
        siteName: "TradeRefer",
        type: "website",
        images: [{ url: referrerJoinOgImage, width: 1200, height: 630, alt: "TradeRefer referrer rewards signup" }],
    },
    twitter: {
        card: "summary_large_image",
        title: "Refer Trusted Tradies | TradeRefer",
        description: "Recommend trade businesses you trust and receive Prezzee rewards when eligible referrals are accepted.",
        images: [referrerJoinOgImage],
    },
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

export default async function JoinReferrerPage({
    searchParams,
}: {
    searchParams: Promise<{ invite?: string }>;
}) {
    const params = await searchParams;
    const inviteCode = params.invite || "";
    const inviteData = inviteCode ? await resolveInvite(inviteCode) : null;
    const inviterName = inviteData?.found ? inviteData.inviter_name : null;
    const inviteeName = inviteData?.found ? inviteData.invitee_name : null;

    const signUpUrl = `/register?redirect_url=${encodeURIComponent(`/onboarding/referrer${inviteCode ? `?invite=${inviteCode}` : ""}`)}`;

    return (
        <main className="min-h-screen bg-white">
            {/* Sticky nav */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-zinc-100">
                <nav className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-3 flex items-center justify-between" aria-label="Referrer signup">
                    <Link href="/"><Logo size="sm" /></Link>
                    <Link
                        href={signUpUrl}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-black text-base px-6 py-2.5 rounded-full transition-all active:scale-95 shadow-lg shadow-orange-600/25 ring-2 ring-orange-600/20"
                    >
                        Join Free
                    </Link>
                </nav>
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
                                <>Hi {inviteeName}!<br />Refer <span className="text-emerald-600">trusted tradies</span> and receive rewards when leads are accepted</>
                            ) : (
                                <>Refer <span className="text-emerald-600">trusted tradies</span> and receive rewards when leads are accepted</>
                            )}
                        </h1>

                        <p className="text-xl text-zinc-500 font-medium leading-relaxed mb-5 max-w-lg">
                            Know someone who needs a plumber, sparky or builder? Recommend a trade business you trust. <strong className="text-zinc-800">Each business sets its own referral fee</strong>, and eligible accepted leads are paid as Prezzee gift cards.
                        </p>

                        <p className="text-base text-emerald-600 font-bold mb-5 flex items-center gap-1.5">
                            <Users className="w-4 h-4" /> Australia-wide referral programme for trusted local introductions
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 mb-4">
                            <Link
                                href={signUpUrl}
                                className="inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-black text-lg px-8 py-4 rounded-full transition-all active:scale-95 shadow-xl shadow-orange-600/25 ring-2 ring-orange-600/20"
                            >
                                Join Free — Takes 2 Min <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>

                        <div className="flex flex-wrap gap-x-5 gap-y-2 text-base text-zinc-500 font-bold">
                            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> Free to join</span>
                            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> No experience needed</span>
                            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> Paid via Prezzee gift cards</span>
                        </div>
                    </div>

                    {/* Right: Earnings example card */}
                    <div className="bg-zinc-800 rounded-3xl p-6 md:p-8 text-white shadow-2xl border border-zinc-700/50">
                        <p className="text-zinc-400 font-bold text-xs uppercase tracking-widest mb-4">How you earn</p>
                        <div className="space-y-3 mb-5">
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-black text-white text-lg">Plumber referral</p>
                                        <p className="text-zinc-400 text-base font-medium">Business fee: $15</p>
                                    </div>
                                    <p className="text-2xl font-black text-emerald-400">+$12</p>
                                </div>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-black text-white text-lg">Electrician referral</p>
                                        <p className="text-zinc-400 text-base font-medium">Business fee: $25</p>
                                    </div>
                                    <p className="text-2xl font-black text-emerald-400">+$20</p>
                                </div>
                            </div>
                            <div className="bg-emerald-500/10 rounded-2xl p-4 border border-emerald-500/20">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-black text-white text-lg">Builder referral</p>
                                        <p className="text-zinc-400 text-base font-medium">Business fee: $75</p>
                                    </div>
                                    <p className="text-3xl font-black text-emerald-400">+$60</p>
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-white/10 pt-4">
                            <p className="text-zinc-300 text-[15px] font-medium mb-1">You earn <strong className="text-emerald-400">80%</strong> of whatever the business sets as their referral fee.</p>
                            <p className="text-zinc-500 text-sm font-medium">Paid automatically as Prezzee gift cards — Woolworths, Bunnings, Uber, Netflix & 400+ brands.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ HOW IT WORKS — 4-step wide row ═══ */}
            <section className="w-full bg-zinc-50 border-y border-zinc-200/60">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 py-14 md:py-20">
                    <p className="text-emerald-600 font-black text-base uppercase tracking-widest text-center mb-3">Simple Process</p>
                    <h2 className="text-3xl md:text-[2.75rem] font-black text-zinc-900 text-center mb-10 tracking-tight leading-tight">
                        How it works — 4 simple steps
                    </h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {[
                            { step: "1", icon: ShieldCheck, title: "Sign up free", desc: "Create your account and choose how you want to refer." },
                            { step: "2", icon: Briefcase, title: "Pick businesses", desc: "Browse public trade profiles and apply to refer the ones you trust." },
                            { step: "3", icon: Users, title: "Send leads", desc: "Know someone who needs work done? Share your unique link or submit a lead." },
                            { step: "4", icon: DollarSign, title: "Receive rewards", desc: "When an eligible referral is accepted, your reward is issued as a Prezzee gift card." },
                        ].map(({ step, icon: Icon, title, desc }) => (
                            <div key={step} className="bg-white rounded-2xl p-6 md:p-8 border border-zinc-200/80 text-center shadow-sm hover:shadow-lg transition-shadow">
                                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                                    <Icon className="w-8 h-8 text-emerald-600" />
                                </div>
                                <p className="text-xs font-black text-emerald-600/60 uppercase tracking-widest mb-2">Step {step}</p>
                                <h3 className="text-xl md:text-[1.35rem] font-black text-zinc-900 mb-2">{title}</h3>
                                <p className="text-zinc-500 font-medium text-base leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ REFERRAL PRINCIPLE ═══ */}
            <section className="w-full bg-white">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 py-14 md:py-20">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                            <Quote className="w-8 h-8 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xl md:text-2xl text-zinc-800 font-bold leading-relaxed mb-3">
                                A good referral is not a cold lead. It is a trusted introduction between someone who needs work done and a trade business you would actually recommend.
                            </p>
                            <p className="text-lg text-zinc-500 font-bold">Use TradeRefer when you know the tradie is worth backing.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ SPLIT: Social proof + Prezzee bonus ═══ */}
            <section className="w-full bg-zinc-50 border-y border-zinc-200/60">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 py-14 md:py-20 grid lg:grid-cols-5 gap-6 items-stretch">

                    {/* Left: Stats + trust (3 cols) */}
                    <div className="lg:col-span-3 rounded-3xl bg-zinc-800 p-7 md:p-10 text-white flex flex-col border border-zinc-700/50">
                        <p className="text-emerald-400 font-black text-xs uppercase tracking-widest mb-2">How rewards stay clear</p>
                        <h3 className="text-2xl md:text-3xl font-black mb-6">Know the terms before you refer</h3>
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {[
                                { value: "Free", label: "To join" },
                                { value: "80%", label: "Referral share" },
                                { value: "400+", label: "Prezzee brands" },
                                { value: "AU", label: "Local trade focus" },
                            ].map(s => (
                                <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                                    <p className="text-3xl md:text-4xl font-black text-emerald-400">{s.value}</p>
                                    <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest mt-1">{s.label}</p>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-3 mt-auto">
                            {[
                                "Businesses set their own referral fee before you promote them",
                                "Structured referral details help businesses assess each lead",
                                "Eligible rewards are paid as Prezzee cards for flexible spending",
                                "Referral status is tracked so you can see what happened next",
                            ].map(txt => (
                                <div key={txt} className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                                    <p className="text-base md:text-lg text-zinc-300 font-medium">{txt}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Prezzee invite bonus (2 cols) — premium dark card */}
                    <div className="lg:col-span-2 rounded-3xl bg-[#0F172A] p-6 md:p-7 flex flex-col relative overflow-hidden border border-white/5 shadow-2xl">
                        {/* Subtle glow effect */}
                        <div className="absolute -top-20 -right-20 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                        <div className="relative z-10 flex flex-col h-full">
                            {/* Prezzee branding */}
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-white/60 font-black uppercase tracking-[0.2em] text-xs">Bonus Reward by</span>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/images/prezzee/prezzee-logo.svg" alt="Prezzee" className="h-4 w-auto brightness-0 invert opacity-70" />
                            </div>

                            {/* Large animated Smart Card */}
                            <div className="flex justify-center mb-4">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src="https://files.poweredbyprezzee.com/products/7af951a6-2a13-004b-f0eb-a87382a5b2e7/8eff8e56-2718-4514-8e1a-15ca1eb22793/Prezzee_3D_-_AU_%281%29_452_280.gif"
                                    alt="Prezzee Smart Card"
                                    className="w-48 rounded-2xl shadow-2xl shadow-black/40"
                                />
                            </div>

                            {/* Headline */}
                            <h3 className="text-white font-black text-xl mb-1 text-center">
                                Invite 5 friends, earn a
                            </h3>
                            <p className="text-center mb-3">
                                <span className="text-emerald-400 font-black text-4xl">$25</span>
                                <span className="text-white font-black text-xl ml-2">Gift Card</span>
                            </p>

                            <p className="text-zinc-400 font-medium text-base text-center mb-5 leading-relaxed">
                                Invite rewards are issued when eligibility is confirmed for active invitees.
                            </p>

                            {/* Brand chips */}
                            <div className="flex flex-wrap justify-center gap-2 mt-auto">
                                {["Woolworths", "Bunnings", "Uber Eats", "Netflix", "JB Hi-Fi", "+400 more"].map(b => (
                                    <span key={b} className="bg-white/10 text-white/80 font-bold text-xs px-3 py-1.5 rounded-lg border border-white/5">{b}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ FINAL CTA ═══ */}
            <section className="w-full bg-gradient-to-b from-white to-zinc-50">
                <div className="max-w-3xl mx-auto px-4 py-16 md:py-24 text-center">
                    <h2 className="text-4xl md:text-5xl font-black text-zinc-900 mb-4 tracking-tight leading-tight">
                        {inviterName
                            ? `${inviterName} is already earning. Join them.`
                            : "Start referring trusted businesses"
                        }
                    </h2>
                    <p className="text-xl md:text-2xl text-zinc-500 font-medium mb-8 max-w-lg mx-auto leading-relaxed">
                        Sign up, pick the trade businesses you trust, and receive Prezzee rewards when eligible referrals are accepted.
                    </p>
                    <Link
                        href={signUpUrl}
                        className="inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-black text-xl px-12 py-5 rounded-full transition-all active:scale-95 shadow-xl shadow-orange-600/25 ring-2 ring-orange-600/20"
                    >
                        Join Free as a Referrer <ArrowRight className="w-6 h-6" />
                    </Link>
                    <p className="mt-4 text-lg text-zinc-400 font-medium">No credit card to join. Recommend only businesses you trust.</p>
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
