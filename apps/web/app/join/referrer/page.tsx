import { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Gift, Users, Star, CheckCircle, ArrowRight, Zap, DollarSign, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
    title: "You're Invited to TradeRefer | Earn Gift Cards by Referring Tradies",
    description: "Join TradeRefer and earn $25 Prezzee gift cards for every 5 friends you invite. Refer quality tradies to people you know — free to join.",
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
            {/* Navbar */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-100">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/"><Logo size="sm" /></Link>
                    <Link
                        href={signUpUrl}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-black text-sm px-5 py-2.5 rounded-full transition-all active:scale-95 shadow-lg shadow-orange-500/20"
                    >
                        Join Free
                    </Link>
                </div>
            </header>

            {/* Hero */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-amber-50" />
                <div className="relative max-w-3xl mx-auto px-4 py-16 md:py-24 text-center">
                    {inviterName && (
                        <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 font-bold text-sm px-4 py-2 rounded-full mb-6">
                            <Users className="w-4 h-4" />
                            {inviterName} invited you
                        </div>
                    )}

                    <h1 className="text-4xl md:text-6xl font-black text-zinc-900 tracking-tight leading-[1.1] mb-5">
                        {inviteeName ? (
                            <>Hi {inviteeName}! Earn <span className="text-orange-500">gift cards</span> by referring tradies</>
                        ) : (
                            <>Earn <span className="text-orange-500">gift cards</span> by referring quality tradies</>
                        )}
                    </h1>

                    <p className="text-lg md:text-xl text-zinc-500 font-medium max-w-xl mx-auto mb-8 leading-relaxed">
                        Know a good plumber, sparky, or builder? Refer them to people who need work done and earn <strong className="text-zinc-900">$25 Prezzee Smart Cards</strong> — spend at Woolworths, Bunnings, Uber, Netflix & 400+ brands.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                            href={signUpUrl}
                            className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black text-lg px-8 py-4 rounded-full transition-all active:scale-95 shadow-xl shadow-orange-500/20"
                        >
                            Join Free & Start Earning <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>

                    <p className="mt-4 text-sm text-zinc-400 font-medium">No cost. No experience needed. Takes 2 minutes.</p>
                </div>
            </section>

            {/* How it works */}
            <section className="py-16 md:py-20 bg-zinc-50">
                <div className="max-w-4xl mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-black text-zinc-900 text-center mb-12 tracking-tight">
                        How it works
                    </h2>

                    <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                        <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-zinc-100">
                            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                                <span className="text-2xl font-black text-orange-500">1</span>
                            </div>
                            <h3 className="text-xl font-black text-zinc-900 mb-2">Sign up free</h3>
                            <p className="text-zinc-500 font-medium">Create your account in under 2 minutes. No fees, no commitments.</p>
                        </div>

                        <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-zinc-100">
                            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                                <span className="text-2xl font-black text-orange-500">2</span>
                            </div>
                            <h3 className="text-xl font-black text-zinc-900 mb-2">Refer tradies</h3>
                            <p className="text-zinc-500 font-medium">Someone needs a tradie? Refer a quality one from our network and earn a referral fee.</p>
                        </div>

                        <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-zinc-100">
                            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                                <Gift className="w-7 h-7 text-green-600" />
                            </div>
                            <h3 className="text-xl font-black text-zinc-900 mb-2">Earn rewards</h3>
                            <p className="text-zinc-500 font-medium">Invite 5 friends who join → get a <strong>$25 Prezzee Smart Card</strong>. Plus earn on every referral.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Prezzee Rewards Strip */}
            <section className="py-16 md:py-20">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="rounded-3xl bg-[#EAF4FF] border border-blue-100 p-6 md:p-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
                        <div className="shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="https://files.poweredbyprezzee.com/products/7af951a6-2a13-004b-f0eb-a87382a5b2e7/8eff8e56-2718-4514-8e1a-15ca1eb22793/Prezzee_3D_-_AU_%281%29_452_280.gif"
                                alt="Prezzee Smart Card"
                                className="w-40 md:w-52 rounded-xl shadow-lg"
                            />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Rewards powered by</span>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src="/images/prezzee/prezzee-logo.svg"
                                    alt="Prezzee"
                                    className="h-5 w-auto"
                                />
                            </div>
                            <h3 className="text-2xl md:text-3xl font-black text-zinc-900 mb-2">
                                Invite 5 friends → earn a <span className="text-[#FF6600]">$25 Smart Card</span>
                            </h3>
                            <p className="text-zinc-500 font-medium mb-3">
                                Spend at Woolworths, Bunnings, Uber Eats, Netflix, JB Hi-Fi, Kmart & 400+ more brands. Issued automatically when your friends join.
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                {["Woolworths", "Bunnings", "Uber Eats", "Netflix", "JB Hi-Fi", "+400 more"].map(brand => (
                                    <span key={brand} className="bg-white/80 text-zinc-700 font-bold text-xs px-3 py-1.5 rounded-full border border-zinc-200">
                                        {brand}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trust / Social Proof */}
            <section className="py-16 md:py-20 bg-zinc-900 text-white">
                <div className="max-w-4xl mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-black text-center mb-12 tracking-tight">
                        Join thousands of Australians
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                        {[
                            { label: "Active Tradies", value: "5,000+" },
                            { label: "Referrers", value: "1,200+" },
                            { label: "Leads Matched", value: "10,000+" },
                            { label: "Rewards Paid", value: "$50K+" },
                        ].map(stat => (
                            <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
                                <p className="text-2xl font-black text-white">{stat.value}</p>
                                <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest mt-1">{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-wrap gap-4 justify-center">
                        {[
                            { icon: ShieldCheck, text: "100% Free to join" },
                            { icon: Zap, text: "No experience needed" },
                            { icon: DollarSign, text: "Earn on every referral" },
                            { icon: Star, text: "335+ reward brands" },
                        ].map(({ icon: Icon, text }) => (
                            <div key={text} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
                                <Icon className="w-4 h-4 text-orange-400" />
                                <span className="font-bold text-sm text-zinc-300">{text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-16 md:py-24">
                <div className="max-w-2xl mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-black text-zinc-900 mb-4 tracking-tight">
                        Ready to start earning?
                    </h2>
                    <p className="text-lg text-zinc-500 font-medium mb-8">
                        {inviterName
                            ? `${inviterName} is already on TradeRefer. Join them and start earning rewards together.`
                            : "Join Australia's leading trade referral network. Free to sign up, takes 2 minutes."
                        }
                    </p>
                    <Link
                        href={signUpUrl}
                        className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black text-lg px-10 py-4 rounded-full transition-all active:scale-95 shadow-xl shadow-orange-500/20"
                    >
                        Join Free & Start Earning <ArrowRight className="w-5 h-5" />
                    </Link>
                    <p className="mt-4 text-sm text-zinc-400 font-medium">No credit card. No strings attached.</p>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 border-t border-zinc-100">
                <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
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
