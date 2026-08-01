import { Metadata } from "next";
import Link from "next/link";
import {
    BadgeCheck, FileText, Users, ShieldCheck, Search, CheckCircle2,
    ArrowRight, HeartHandshake, Wrench, Home, KeyRound, Zap,
} from "lucide-react";
import { buildOgImageUrl } from "@/lib/og-image";

const CANONICAL_URL = "https://traderefer.au/about";

const aboutOgImage = buildOgImageUrl({
    template: "home",
    title: "How TradeRefer verifies local tradies",
    subtitle: "ABN checks, state licence checks and community referral signals on every listed business.",
    eyebrow: "About TradeRefer",
    badge: "Verification process",
    stat1: "ABN checked",
    stat2: "Licence checked",
    stat3: "Referral signals",
});

export const metadata: Metadata = {
    title: "About TradeRefer — How We Verify Local Tradies",
    description: "TradeRefer is an Australian trades directory built on real referrals. Learn how we verify every business — ABN checks, state licence checks and community referral signals — and how the platform works for homeowners, tradies and referrers.",
    alternates: { canonical: CANONICAL_URL },
    openGraph: {
        title: "About TradeRefer — How We Verify Local Tradies",
        description: "How TradeRefer verifies local trade businesses and connects them with homeowners through real community referrals.",
        url: CANONICAL_URL,
        siteName: "TradeRefer",
        type: "website",
        images: [{ url: aboutOgImage, width: 1200, height: 630, alt: "How TradeRefer verifies local tradies" }],
    },
    twitter: {
        card: "summary_large_image",
        title: "About TradeRefer — How We Verify Local Tradies",
        description: "ABN checks, state licence checks and community referral signals on every listed business.",
        images: [aboutOgImage],
    },
};

const VERIFY_STEPS = [
    {
        icon: BadgeCheck,
        title: "Step 1 — ABN Check",
        body: "Every listed business is checked against Australian Business Register data where available. Listings show an \"ABN checked\" badge only once this check has passed.",
    },
    {
        icon: FileText,
        title: "Step 2 — Licence Check",
        body: "For licensed trades (plumbing, electrical, building and more) we confirm the relevant state trade licence and link to the state authority so you can verify it yourself.",
    },
    {
        icon: Users,
        title: "Step 3 — Community Referrals",
        body: "Rankings are driven by public trust signals — Google reviews and referrals from real people who know the business — never by paid placement.",
    },
];

const HOW_IT_WORKS = [
    {
        icon: Home,
        title: "For Homeowners",
        body: "Browse ABN-checked local businesses, compare public ratings and request free quotes. There's no cost to use TradeRefer and no obligation to hire.",
        cta: { href: "/register?type=homeowner", label: "Get free quotes" },
    },
    {
        icon: Wrench,
        title: "For Trade Businesses",
        body: "List your business free — no subscription, no monthly fee and no charge per lead. You only ever pay a small fee to unlock a genuine lead, and you set the price.",
        cta: { href: "/register?type=business", label: "List your business free" },
    },
    {
        icon: HeartHandshake,
        title: "For Referrers",
        body: "Anyone can recommend a tradie they trust. Share your personal referral link and earn a reward every time your referral becomes a genuine connection.",
        cta: { href: "/rewards", label: "How rewards work" },
    },
];

export default function AboutPage() {
    const organizationJsonLd = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "TradeRefer",
        "url": "https://traderefer.au",
        "description": "An Australian trades directory that connects homeowners with ABN-checked local trade businesses through real community referrals.",
        "areaServed": { "@type": "Country", "name": "Australia" },
    };

    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://traderefer.au" },
            { "@type": "ListItem", "position": 2, "name": "About" },
        ],
    };

    return (
        <main className="min-h-screen bg-white">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

            {/* Hero */}
            <div className="bg-zinc-900 pt-32 pb-20 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                </div>
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-3xl">
                        <div className="flex items-center gap-2 mb-4">
                            <ShieldCheck className="w-5 h-5 text-orange-500" />
                            <span className="text-orange-500 font-black text-sm uppercase tracking-widest">About TradeRefer</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight text-white">
                            Word of mouth, <span className="text-orange-500">verified</span>.
                        </h1>
                        <p className="text-lg text-zinc-400 mb-8 leading-relaxed max-w-2xl">
                            TradeRefer is an Australian trades directory built on the way people actually find good tradies — recommendations
                            from someone they trust. We list local trade businesses, check them against public registers, and rank them by
                            real community signals instead of paid placement.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link prefetch={false} href="#how-we-verify" className="bg-orange-500 hover:bg-orange-600 text-white font-black px-8 rounded-xl transition-colors inline-flex items-center justify-center" style={{ minHeight: '56px', fontSize: '17px' }}>
                                How we verify
                            </Link>
                            <Link prefetch={false} href="#how-it-works" className="bg-white/10 hover:bg-white/20 text-white font-black px-8 rounded-xl border border-white/20 transition-colors inline-flex items-center justify-center" style={{ minHeight: '56px', fontSize: '17px' }}>
                                How it works
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-zinc-50 py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto space-y-12">

                        {/* What TradeRefer is */}
                        <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                            <h2 className="text-2xl font-black text-zinc-900 mb-4">What TradeRefer Is</h2>
                            <p className="text-zinc-600 leading-relaxed mb-4" style={{ fontSize: '17px' }}>
                                Most lead-generation sites sell the same enquiry to multiple competing businesses and charge tradies
                                whether or not they win the work. TradeRefer takes the opposite approach: listings are free, leads are
                                exclusive, and the people who recommend a business — past customers, neighbours, local community members —
                                are the ones who power the platform.
                            </p>
                            <p className="text-zinc-600 leading-relaxed" style={{ fontSize: '17px' }}>
                                Every suburb and trade page you see on TradeRefer is built from our directory of ABN-checked Australian
                                trade businesses, with ratings and review counts drawn from public Google review data.
                            </p>
                        </section>

                        {/* How we verify */}
                        <section id="how-we-verify" className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10 scroll-mt-28">
                            <h2 className="text-2xl font-black text-zinc-900 mb-2 flex items-center gap-2">
                                <ShieldCheck className="w-6 h-6 text-orange-500" />
                                How We Verify Businesses
                            </h2>
                            <p className="text-zinc-500 mb-8" style={{ fontSize: '16px' }}>
                                Verification is reviewed by our Verification Team — ABN, licence and community referral checks, running since 2024.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {VERIFY_STEPS.map((step) => (
                                    <div key={step.title} className="bg-zinc-50 rounded-2xl border border-zinc-100 p-6">
                                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 mb-4">
                                            <step.icon className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-black text-zinc-900 mb-2" style={{ fontSize: '17px' }}>{step.title}</h3>
                                        <p className="text-zinc-600 leading-relaxed" style={{ fontSize: '15px' }}>{step.body}</p>
                                    </div>
                                ))}
                            </div>
                            <p className="text-zinc-400 mt-6" style={{ fontSize: '14px' }}>
                                Verification reduces risk but is not a guarantee. Always confirm licence details with your state authority
                                and get written quotes before authorising work.
                            </p>
                        </section>

                        {/* How it works */}
                        <section id="how-it-works" className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10 scroll-mt-28">
                            <h2 className="text-2xl font-black text-zinc-900 mb-2 flex items-center gap-2">
                                <Zap className="w-6 h-6 text-orange-500" />
                                How TradeRefer Works
                            </h2>
                            <p className="text-zinc-500 mb-8" style={{ fontSize: '16px' }}>
                                Three groups of people use TradeRefer, and the platform only succeeds when a genuine connection happens.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {HOW_IT_WORKS.map((item) => (
                                    <div key={item.title} className="bg-zinc-50 rounded-2xl border border-zinc-100 p-6 flex flex-col">
                                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 mb-4">
                                            <item.icon className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-black text-zinc-900 mb-2" style={{ fontSize: '17px' }}>{item.title}</h3>
                                        <p className="text-zinc-600 leading-relaxed mb-4 flex-1" style={{ fontSize: '15px' }}>{item.body}</p>
                                        <Link prefetch={false} href={item.cta.href} className="inline-flex items-center gap-1.5 font-bold text-orange-600 hover:underline" style={{ fontSize: '15px' }}>
                                            {item.cta.label} <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Verified connections */}
                        <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                            <h2 className="text-2xl font-black text-zinc-900 mb-4 flex items-center gap-2">
                                <KeyRound className="w-6 h-6 text-orange-500" />
                                Connections, Confirmed in the Real World
                            </h2>
                            <p className="text-zinc-600 leading-relaxed mb-6" style={{ fontSize: '17px' }}>
                                When a tradie heads out to a job that came through TradeRefer, the customer receives a unique connection
                                code. The tradie confirms it on arrival — proof that the two parties actually met. This keeps fake leads
                                off the platform and means the trust signals you see on our pages reflect real jobs, not bots or bought reviews.
                            </p>
                            <ul className="space-y-3">
                                {[
                                    "Phone-verified enquiries — every lead confirms their mobile number first",
                                    "Exclusive leads — an enquiry goes to one business, never auctioned to competitors",
                                    "No pay-to-rank — position on TradeRefer can't be bought",
                                ].map((point) => (
                                    <li key={point} className="flex gap-3 items-start">
                                        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                        <span className="text-zinc-700" style={{ fontSize: '16px' }}>{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        {/* Contact / CTA */}
                        <section className="bg-zinc-900 rounded-3xl p-8 md:p-10 text-white text-center">
                            <Search className="w-10 h-10 text-orange-500 mx-auto mb-4" />
                            <h2 className="text-2xl font-black mb-2 text-white">Questions About TradeRefer?</h2>
                            <p className="text-zinc-400 mb-6 max-w-md mx-auto" style={{ fontSize: '16px' }}>
                                We're an Australian platform and we answer our own support inbox. Get in touch, or read our terms and privacy policy.
                            </p>
                            <div className="flex flex-wrap justify-center gap-4">
                                <Link prefetch={false} href="/contact" className="bg-orange-500 hover:bg-orange-600 text-white font-black px-8 rounded-xl transition-colors inline-flex items-center justify-center" style={{ minHeight: '52px', fontSize: '16px' }}>
                                    Contact Us
                                </Link>
                                <Link prefetch={false} href="/terms" className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 rounded-xl border border-white/20 transition-colors inline-flex items-center justify-center" style={{ minHeight: '52px', fontSize: '16px' }}>
                                    Terms
                                </Link>
                                <Link prefetch={false} href="/privacy" className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 rounded-xl border border-white/20 transition-colors inline-flex items-center justify-center" style={{ minHeight: '52px', fontSize: '16px' }}>
                                    Privacy
                                </Link>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </main>
    );
}
