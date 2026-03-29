import { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Gift, Users, Star, ArrowRight, Zap, Building2, ShieldCheck, TrendingUp, BadgeCheck } from "lucide-react";

export const metadata: Metadata = {
    title: "You're Invited to TradeRefer | Get Free Leads for Your Business",
    description: "Join TradeRefer and get qualified job leads sent directly to you by trusted local referrers. Free to list, pay only when you unlock a lead.",
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
            {/* Navbar */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-100">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/"><Logo size="sm" /></Link>
                    <Link
                        href={signUpUrl}
                        className="bg-zinc-900 hover:bg-zinc-800 text-white font-black text-sm px-5 py-2.5 rounded-full transition-all active:scale-95 shadow-lg"
                    >
                        Claim Free Profile
                    </Link>
                </div>
            </header>

            {/* Hero */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 via-white to-orange-50" />
                <div className="relative max-w-3xl mx-auto px-4 py-16 md:py-24 text-center">
                    {inviterName && (
                        <div className="inline-flex items-center gap-2 bg-zinc-100 text-zinc-700 font-bold text-sm px-4 py-2 rounded-full mb-6">
                            <Users className="w-4 h-4" />
                            {inviterName} invited you
                        </div>
                    )}

                    <h1 className="text-4xl md:text-6xl font-black text-zinc-900 tracking-tight leading-[1.1] mb-5">
                        {inviteeName ? (
                            <>Hi {inviteeName}! Get <span className="text-orange-500">free leads</span> for your business</>
                        ) : (
                            <>Get <span className="text-orange-500">free leads</span> sent straight to you</>
                        )}
                    </h1>

                    <p className="text-lg md:text-xl text-zinc-500 font-medium max-w-xl mx-auto mb-8 leading-relaxed">
                        TradeRefer connects your business with trusted local referrers who send you <strong className="text-zinc-900">qualified job enquiries</strong>. Free to list — only pay when you unlock a lead.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                            href={signUpUrl}
                            className="inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white font-black text-lg px-8 py-4 rounded-full transition-all active:scale-95 shadow-xl"
                        >
                            Claim Your Free Profile <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>

                    <p className="mt-4 text-sm text-zinc-400 font-medium">Free to list. No monthly fees. Takes 3 minutes.</p>
                </div>
            </section>

            {/* How it works */}
            <section className="py-16 md:py-20 bg-zinc-50">
                <div className="max-w-4xl mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-black text-zinc-900 text-center mb-12 tracking-tight">
                        How TradeRefer works for your business
                    </h2>

                    <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                        <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-zinc-100">
                            <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                                <Building2 className="w-7 h-7 text-zinc-900" />
                            </div>
                            <h3 className="text-xl font-black text-zinc-900 mb-2">Create your profile</h3>
                            <p className="text-zinc-500 font-medium">Set up your free business listing in minutes. Showcase your trade, service area, and reviews.</p>
                        </div>

                        <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-zinc-100">
                            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                                <TrendingUp className="w-7 h-7 text-orange-600" />
                            </div>
                            <h3 className="text-xl font-black text-zinc-900 mb-2">Referrers promote you</h3>
                            <p className="text-zinc-500 font-medium">Local referrers recommend your business to people who need work done. Real leads, not spam.</p>
                        </div>

                        <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-zinc-100">
                            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                                <BadgeCheck className="w-7 h-7 text-green-600" />
                            </div>
                            <h3 className="text-xl font-black text-zinc-900 mb-2">Win new customers</h3>
                            <p className="text-zinc-500 font-medium">Unlock lead details and contact them directly. Only pay for leads you actually want.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Value Props */}
            <section className="py-16 md:py-20">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-zinc-50 rounded-3xl p-8 border border-zinc-100">
                            <ShieldCheck className="w-8 h-8 text-green-600 mb-4" />
                            <h3 className="text-xl font-black text-zinc-900 mb-2">No monthly fees</h3>
                            <p className="text-zinc-500 font-medium">Your listing is completely free. No subscriptions, no lock-in contracts, no hidden charges.</p>
                        </div>
                        <div className="bg-zinc-50 rounded-3xl p-8 border border-zinc-100">
                            <Zap className="w-8 h-8 text-orange-500 mb-4" />
                            <h3 className="text-xl font-black text-zinc-900 mb-2">Quality leads only</h3>
                            <p className="text-zinc-500 font-medium">Leads come from trusted referrers who personally recommend your business — not bots or scrapers.</p>
                        </div>
                        <div className="bg-zinc-50 rounded-3xl p-8 border border-zinc-100">
                            <Star className="w-8 h-8 text-amber-500 mb-4" />
                            <h3 className="text-xl font-black text-zinc-900 mb-2">Build your reputation</h3>
                            <p className="text-zinc-500 font-medium">Get reviews, badges, and climb the local rankings. The more you deliver, the more referrals you get.</p>
                        </div>
                        <div className="bg-zinc-50 rounded-3xl p-8 border border-zinc-100">
                            <Gift className="w-8 h-8 text-purple-500 mb-4" />
                            <h3 className="text-xl font-black text-zinc-900 mb-2">Earn rewards too</h3>
                            <p className="text-zinc-500 font-medium">Invite 5 others to TradeRefer and earn a $25 Prezzee gift card — spend at 335+ brands Australia-wide.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Social Proof */}
            <section className="py-16 md:py-20 bg-zinc-900 text-white">
                <div className="max-w-4xl mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-black text-center mb-12 tracking-tight">
                        Trusted by tradies across Australia
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                        {[
                            { label: "Businesses Listed", value: "5,000+" },
                            { label: "Active Referrers", value: "1,200+" },
                            { label: "Leads Delivered", value: "10,000+" },
                            { label: "All Trade Types", value: "50+" },
                        ].map(stat => (
                            <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
                                <p className="text-2xl font-black text-white">{stat.value}</p>
                                <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest mt-1">{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-wrap gap-3 justify-center">
                        {["Plumbing", "Electrical", "Building", "Roofing", "Painting", "Carpentry", "Landscaping", "Tiling"].map(trade => (
                            <span key={trade} className="bg-white/5 border border-white/10 text-zinc-300 font-bold text-sm px-4 py-2 rounded-full">
                                {trade}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-16 md:py-24">
                <div className="max-w-2xl mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-black text-zinc-900 mb-4 tracking-tight">
                        Ready to grow your business?
                    </h2>
                    <p className="text-lg text-zinc-500 font-medium mb-8">
                        {inviterName
                            ? `${inviterName} thinks you'd be a great fit for TradeRefer. Claim your free profile and start getting leads.`
                            : "Claim your free profile and start receiving qualified job leads from trusted local referrers."
                        }
                    </p>
                    <Link
                        href={signUpUrl}
                        className="inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white font-black text-lg px-10 py-4 rounded-full transition-all active:scale-95 shadow-xl"
                    >
                        Claim Your Free Profile <ArrowRight className="w-5 h-5" />
                    </Link>
                    <p className="mt-4 text-sm text-zinc-400 font-medium">Free forever. No credit card required.</p>
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
