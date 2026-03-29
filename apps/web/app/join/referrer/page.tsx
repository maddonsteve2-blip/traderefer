import { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Gift, Users, ArrowRight, DollarSign, ShieldCheck, CheckCircle, Briefcase, Quote } from "lucide-react";

export const metadata: Metadata = {
    title: "You're Invited to TradeRefer | Earn Up to $60 Per Referral",
    description: "Join TradeRefer free and earn cash rewards every time you refer a tradie. Businesses set fees from $10 to $60+ per lead — paid as Prezzee gift cards.",
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
                <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-3 flex items-center justify-between">
                    <Link href="/"><Logo size="sm" /></Link>
                    <Link
                        href={signUpUrl}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-black text-sm px-6 py-2.5 rounded-full transition-all active:scale-95 shadow-lg shadow-orange-600/25 ring-2 ring-orange-600/20"
                    >
                        Join Free
                    </Link>
                </div>
            </header>

            {/* ═══ HERO — Split layout ═══ */}
            <section className="w-full bg-white">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 md:py-16 grid lg:grid-cols-2 gap-8 lg:gap-14 items-center">
                    {/* Left: Copy */}
                    <div>
                        {inviterName && (
                            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 font-bold text-sm px-4 py-2 rounded-full mb-4 border border-emerald-100">
                                <Users className="w-4 h-4" />
                                {inviterName} invited you
                            </div>
                        )}

                        <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-black text-zinc-900 tracking-tight leading-[1.1] mb-4">
                            {inviteeName ? (
                                <>Hi {inviteeName}!<br />Earn <span className="text-emerald-600">up to $60</span> every time you refer a tradie</>
                            ) : (
                                <>Earn <span className="text-emerald-600">up to $60</span> every time you refer a tradie</>
                            )}
                        </h1>

                        <p className="text-lg text-zinc-500 font-medium leading-relaxed mb-5 max-w-lg">
                            Know someone who needs a plumber, sparky or builder? Refer a quality tradie from our network. <strong className="text-zinc-800">Each business sets their own referral fee</strong> — you earn 80% as a Prezzee gift card every time they take your lead.
                        </p>

                        <p className="text-sm text-emerald-600 font-bold mb-5 flex items-center gap-1.5">
                            <Users className="w-4 h-4" /> 1,200+ referrers already earning across Australia
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 mb-4">
                            <Link
                                href={signUpUrl}
                                className="inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-black text-lg px-8 py-4 rounded-full transition-all active:scale-95 shadow-xl shadow-orange-600/25 ring-2 ring-orange-600/20"
                            >
                                Join Free — Takes 2 Min <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>

                        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-500 font-bold">
                            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> 100% free</span>
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
                                        <p className="font-black text-white">Plumber referral</p>
                                        <p className="text-zinc-500 text-sm font-medium">Business fee: $15</p>
                                    </div>
                                    <p className="text-2xl font-black text-emerald-400">+$12</p>
                                </div>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-black text-white">Electrician referral</p>
                                        <p className="text-zinc-500 text-sm font-medium">Business fee: $25</p>
                                    </div>
                                    <p className="text-2xl font-black text-emerald-400">+$20</p>
                                </div>
                            </div>
                            <div className="bg-emerald-500/10 rounded-2xl p-4 border border-emerald-500/20">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-black text-white">Builder referral</p>
                                        <p className="text-zinc-500 text-sm font-medium">Business fee: $75</p>
                                    </div>
                                    <p className="text-3xl font-black text-emerald-400">+$60</p>
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-white/10 pt-4">
                            <p className="text-zinc-300 text-sm font-medium mb-1">You earn <strong className="text-emerald-400">80%</strong> of whatever the business sets as their referral fee.</p>
                            <p className="text-zinc-500 text-xs font-medium">Paid automatically as Prezzee gift cards — Woolworths, Bunnings, Uber, Netflix & 400+ brands.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ HOW IT WORKS — 4-step wide row ═══ */}
            <section className="w-full bg-zinc-50 border-y border-zinc-200/60">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 md:py-14">
                    <h2 className="text-2xl md:text-3xl font-black text-zinc-900 text-center mb-8 tracking-tight">
                        How it works — 4 simple steps
                    </h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
                        {[
                            { step: "1", icon: ShieldCheck, title: "Sign up free", desc: "Create your account in 2 minutes. No cost, ever." },
                            { step: "2", icon: Briefcase, title: "Pick businesses", desc: "Browse 5,000+ tradies and apply to refer the ones you trust." },
                            { step: "3", icon: Users, title: "Send leads", desc: "Know someone who needs work done? Share your unique link or submit a lead." },
                            { step: "4", icon: DollarSign, title: "Get paid", desc: "When the business takes your lead, you earn their referral fee as a Prezzee gift card." },
                        ].map(({ step, icon: Icon, title, desc }) => (
                            <div key={step} className="bg-white rounded-2xl p-5 md:p-7 border border-zinc-200/80 text-center shadow-sm">
                                <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Icon className="w-7 h-7 text-zinc-700" />
                                </div>
                                <p className="text-[11px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Step {step}</p>
                                <h3 className="text-base md:text-lg font-black text-zinc-900 mb-1.5">{title}</h3>
                                <p className="text-zinc-500 font-medium text-sm leading-snug">{desc}</p>
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
                            <p className="text-lg text-zinc-800 font-bold leading-relaxed mb-2">
                                &ldquo;I earned $145 last month just recommending my plumber and electrician to neighbours. It&apos;s genuinely the easiest side income I&apos;ve ever had.&rdquo;
                            </p>
                            <p className="text-sm text-zinc-500 font-bold">Sarah M. — Referrer, Sydney</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ SPLIT: Social proof + Prezzee bonus ═══ */}
            <section className="w-full bg-zinc-50 border-y border-zinc-200/60">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 md:py-14 grid lg:grid-cols-5 gap-6 items-stretch">

                    {/* Left: Stats + trust (3 cols) */}
                    <div className="lg:col-span-3 rounded-3xl bg-zinc-800 p-6 md:p-8 text-white flex flex-col border border-zinc-700/50">
                        <h3 className="text-2xl font-black mb-5">Why thousands trust TradeRefer</h3>
                        <div className="grid grid-cols-2 gap-3 mb-5">
                            {[
                                { value: "5,000+", label: "Businesses" },
                                { value: "1,200+", label: "Active Referrers" },
                                { value: "$10–$60", label: "Typical Earnings" },
                                { value: "335+", label: "Prezzee Brands" },
                            ].map(s => (
                                <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3.5 text-center">
                                    <p className="text-xl font-black text-emerald-400">{s.value}</p>
                                    <p className="text-zinc-500 font-bold text-[11px] uppercase tracking-widest">{s.label}</p>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-2.5 mt-auto">
                            {[
                                "Businesses set their own fee — you always know what you'll earn",
                                "AI-screened leads mean businesses trust your referrals",
                                "Earnings paid as Prezzee cards — spend at 400+ stores",
                                "Tier system: refer more, earn a bigger share (up to 90%)",
                            ].map(txt => (
                                <div key={txt} className="flex items-start gap-2.5">
                                    <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                                    <p className="text-sm text-zinc-300 font-medium">{txt}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Prezzee invite bonus (2 cols) — smaller */}
                    <div className="lg:col-span-2 rounded-3xl bg-white border border-zinc-200 p-6 md:p-8 flex flex-col">
                        <div className="flex items-center gap-2 mb-3">
                            <Gift className="w-5 h-5 text-amber-500" />
                            <span className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Bonus reward</span>
                        </div>
                        <h3 className="text-xl font-black text-zinc-900 mb-2">
                            Invite 5 friends → <span className="text-emerald-600">$25 Prezzee Card</span>
                        </h3>
                        <p className="text-zinc-500 font-medium text-sm mb-4 leading-relaxed">
                            On top of per-lead earnings, invite friends and family. Once 5 sign up and become active, you get a $25 Prezzee gift card automatically.
                        </p>
                        <div className="flex items-center gap-3 mt-auto">
                            <div className="shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src="https://files.poweredbyprezzee.com/products/7af951a6-2a13-004b-f0eb-a87382a5b2e7/8eff8e56-2718-4514-8e1a-15ca1eb22793/Prezzee_3D_-_AU_%281%29_452_280.gif"
                                    alt="Prezzee Smart Card"
                                    className="w-20 rounded-lg shadow-sm"
                                />
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {["Woolworths", "Bunnings", "Uber", "Netflix", "+400"].map(b => (
                                    <span key={b} className="bg-zinc-50 text-zinc-500 font-bold text-[10px] px-2 py-0.5 rounded-full border border-zinc-200">{b}</span>
                                ))}
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
                            ? `${inviterName} is already earning. Join them.`
                            : "Start earning today — it's free"
                        }
                    </h2>
                    <p className="text-lg text-zinc-500 font-medium mb-6 max-w-lg mx-auto">
                        Sign up in 2 minutes, pick the tradies you trust, and earn up to $60 every time someone takes your referral.
                    </p>
                    <Link
                        href={signUpUrl}
                        className="inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-black text-lg px-10 py-4 rounded-full transition-all active:scale-95 shadow-xl shadow-orange-600/25 ring-2 ring-orange-600/20"
                    >
                        Join Free & Start Earning <ArrowRight className="w-5 h-5" />
                    </Link>
                    <p className="mt-3 text-sm text-zinc-400 font-medium">No credit card. No experience. No strings.</p>
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
