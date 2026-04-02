import { Metadata } from "next";
import Link from "next/link";
import {
    ArrowRight,
    BadgeCheck,
    ChevronRight,
    DollarSign,
    FileText,
    MapPin,
    ShieldCheck,
    Star,
    Wrench,
    CheckCircle2,
    Clock3,
} from "lucide-react";
import { sql } from "@/lib/db";
import { PublicMultiQuoteForm } from "@/components/PublicMultiQuoteForm";

export const dynamic = "force-dynamic";

const BASE_URL = "https://traderefer.au";

export const metadata: Metadata = {
    title: "Find a Trusted Local Plumber | TradeRefer",
    description:
        "Need a reliable plumber near you? TradeRefer connects you with trusted, reviewed local plumbers fast. Post your job free and get quotes today.",
    alternates: { canonical: `${BASE_URL}/trades/plumbers` },
    openGraph: {
        title: "Find a Trusted Local Plumber | TradeRefer",
        description:
            "Need a reliable plumber near you? TradeRefer connects you with trusted, reviewed local plumbers fast. Post your job free and get quotes today.",
        url: `${BASE_URL}/trades/plumbers`,
        type: "website",
    },
};

const plumberServices = [
    {
        title: "Leak detection and repair",
        body: "Identifying and fixing leaky taps, pipes, and joints before small drips become costly water damage.",
    },
    {
        title: "Blocked drain clearing",
        body: "Using specialist equipment to clear blocked sinks, toilets, showers, and stormwater drains.",
    },
    {
        title: "Hot water system installation and repair",
        body: "Replacing faulty hot water units or upgrading to energy-efficient systems — electric, gas, or solar.",
    },
    {
        title: "Bathroom and kitchen fit-outs",
        body: "Installing new toilets, basins, sinks, showers, and tapware as part of a renovation or new build.",
    },
    {
        title: "Pipe replacement and repiping",
        body: "Replacing ageing copper, galvanised, or PVC pipework to restore water pressure and prevent future leaks.",
    },
    {
        title: "Gas fitting",
        body: "Installing and servicing gas appliances including cooktops, heaters, and BBQ points (requires a licensed gas fitter).",
    },
    {
        title: "Emergency plumbing",
        body: "Responding to urgent call-outs for burst pipes, sewage backups, and flooding.",
    },
];

const costGuide = [
    ["Callout / hourly rate", "$100 – $200/hr"],
    ["Fixing a leaky tap", "$80 – $200"],
    ["Clearing a blocked drain", "$150 – $400"],
    ["Hot water system replacement", "$900 – $2,500+"],
    ["Toilet installation", "$200 – $500"],
    ["Bathroom renovation (plumbing only)", "$1,500 – $5,000+"],
    ["Emergency / after-hours callout", "$200 – $400 surcharge"],
];

const howItWorks = [
    {
        step: "1",
        title: "Post your job",
        body: "Describe your plumbing problem or project (less than 2 minutes). Tell us your location, what needs doing, and when you need it.",
    },
    {
        step: "2",
        title: "Get quotes from local plumbers",
        body: "Qualified plumbers in your area review your job and send you quotes. Compare prices, profiles, and reviews all in one place.",
    },
    {
        step: "3",
        title: "Hire with confidence",
        body: "Choose the plumber that's right for you. Message them directly, agree on the job details, and get the work done.",
    },
];

const faqs = [
    {
        q: "How do I find a plumber near me?",
        a: "The fastest way is to post your job on TradeRefer. We match your job with licensed, reviewed plumbers in your suburb or city — usually within minutes. No need to call around or hunt through directories.",
    },
    {
        q: "How much does a plumber cost in Australia?",
        a: "Most plumbers charge between $100 and $200 per hour, plus a callout fee. Smaller jobs like fixing a leaky tap might cost $80–$200 all up, while larger jobs like hot water system replacement can run $900–$2,500 or more. Get a free quote through TradeRefer to see real prices for your specific job.",
    },
    {
        q: "Do I need a licensed plumber?",
        a: "Yes — in Australia, all plumbing work must be carried out by a licensed plumber. It's a legal requirement, and it protects you if something goes wrong. All tradespeople on TradeRefer are verified, so you can hire with peace of mind.",
    },
    {
        q: "What's the difference between a plumber and a gas fitter?",
        a: "While many plumbers are also licensed gas fitters, they are separate licences in Australia. If your job involves gas appliances, pipework, or connections, make sure you specifically request a licensed gas fitter. When posting on TradeRefer, you can specify gas fitting work so we match you with the right tradie.",
    },
];

const whyTradeRefer = [
    {
        icon: BadgeCheck,
        title: "Only verified, reviewed tradies",
        body: "Every plumber on TradeRefer has been reviewed by real customers. You can read genuine feedback before you commit — no fake reviews, no guesswork.",
    },
    {
        icon: DollarSign,
        title: "Free to post, no hidden fees",
        body: "Posting your plumbing job on TradeRefer is completely free. You describe the work, get quotes from local plumbers, and choose who you hire — you're in control.",
    },
    {
        icon: MapPin,
        title: "Local plumbers who know your area",
        body: "We match you with licensed plumbers near you, so you're not waiting days for someone to travel from the other side of town. Faster response, more competitive quotes.",
    },
];

const featuredCities = [
    { city: "Sydney", state: "NSW", stateSlug: "nsw", citySlug: "sydney" },
    { city: "Melbourne", state: "VIC", stateSlug: "vic", citySlug: "melbourne" },
    { city: "Brisbane", state: "QLD", stateSlug: "qld", citySlug: "brisbane" },
    { city: "Perth", state: "WA", stateSlug: "wa", citySlug: "perth" },
    { city: "Adelaide", state: "SA", stateSlug: "sa", citySlug: "adelaide" },
    { city: "Gold Coast", state: "QLD", stateSlug: "qld", citySlug: "gold-coast" },
    { city: "Newcastle", state: "NSW", stateSlug: "nsw", citySlug: "newcastle" },
    { city: "Canberra", state: "ACT", stateSlug: "act", citySlug: "canberra" },
];

type CountRow = { count: string | number };

async function getPlumberCount(): Promise<number> {
    try {
        const result = await sql<CountRow[]>`
            SELECT COUNT(*) as count
            FROM businesses
            WHERE status = 'active'
              AND trade_category ILIKE '%plumb%'
        `;
        return parseInt(String(result[0]?.count || 0), 10);
    } catch {
        return 0;
    }
}

const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
        { "@type": "ListItem", position: 2, name: "Trade Guides", item: `${BASE_URL}/categories` },
        { "@type": "ListItem", position: 3, name: "Find a Plumber Near You", item: `${BASE_URL}/trades/plumbers` },
    ],
};

const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Find a Plumber Near You",
    serviceType: "Plumbing",
    areaServed: { "@type": "Country", name: "Australia" },
    provider: { "@type": "Organization", name: "TradeRefer", url: BASE_URL },
    offers: {
        "@type": "AggregateOffer",
        lowPrice: "80",
        highPrice: "2500",
        priceCurrency: "AUD",
    },
};

const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
};

export default async function FindAPlumberPage() {
    const totalPlumbers = await getPlumberCount();

    return (
        <main className="min-h-screen bg-zinc-50">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* ── HERO ── */}
            <div className="bg-[#1A1A1A] pt-32 pb-20 text-white">
                <div className="container mx-auto px-4">
                    <nav className="flex flex-wrap items-center gap-2 font-bold text-zinc-400 uppercase tracking-widest mb-8" style={{ fontSize: "16px" }}>
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <ChevronRight className="w-4 h-4" />
                        <Link href="/categories" className="hover:text-white transition-colors">Trade Guides</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-[#FF6600]">Find a Plumber</span>
                    </nav>

                    <div className="max-w-4xl">
                        <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-2 font-black text-orange-400 uppercase tracking-widest mb-6" style={{ fontSize: "16px" }}>
                            <Wrench className="w-4 h-4" />
                            Plumbers Near You
                        </div>
                        <h1 className="font-black mb-6 leading-[1.05] font-display text-white" style={{ fontSize: "clamp(48px, 8vw, 80px)" }}>
                            Find a Trusted <span className="text-[#FF6600]">Plumber</span> Near You
                        </h1>
                        <p className="text-zinc-400 max-w-3xl mb-8" style={{ fontSize: "20px", lineHeight: 1.7 }}>
                            Whether you&apos;ve got a burst pipe at midnight or a bathroom renovation on the horizon,
                            finding a reliable plumber quickly can save you time, money, and stress.
                            Post your job free and get connected with trusted, reviewed plumbers in your local area.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link
                                href="/quotes?trade=Plumbing&source=%2Ftrades%2Fplumbers"
                                className="bg-[#FF6600] hover:bg-[#E65C00] text-white font-black px-8 rounded-xl transition-colors inline-flex items-center justify-center gap-2"
                                style={{ minHeight: "64px", fontSize: "18px" }}
                            >
                                Post Your Plumbing Job — Free
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                href="/businesses?category=Plumbing"
                                className="bg-white/10 hover:bg-white/20 text-white font-black px-8 rounded-xl transition-colors border border-white/10 inline-flex items-center justify-center"
                                style={{ minHeight: "64px", fontSize: "18px" }}
                            >
                                Browse Plumbers
                            </Link>
                        </div>

                        <div className="flex flex-wrap gap-6 text-white font-bold mt-8" style={{ fontSize: "16px" }}>
                            {totalPlumbers > 0 && (
                                <span className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-[#FF6600]" />{totalPlumbers.toLocaleString()} plumbers listed</span>
                            )}
                            <span className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-[#FF6600]" />Typical rates $100–$200/hr</span>
                            <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#FF6600]" />Australia-wide</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16">
                <div className="max-w-6xl mx-auto space-y-16">

                    {/* ── WHAT DOES A PLUMBER DO ── */}
                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}>
                            <Wrench className="w-6 h-6 text-[#FF6600]" />
                            What Does a Plumber Do?
                        </h2>
                        <p className="text-zinc-500 mb-8" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                            Plumbers are licensed tradespeople who install, maintain, and repair the water, drainage, and gas systems in your home or business.
                            Here are the most common jobs they handle:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {plumberServices.map((service) => (
                                <div key={service.title} className="bg-zinc-50 rounded-2xl border border-zinc-100 p-5">
                                    <h3 className="font-black text-zinc-900 mb-1" style={{ fontSize: "16px" }}>{service.title}</h3>
                                    <p className="text-zinc-500" style={{ fontSize: "15px", lineHeight: 1.6 }}>{service.body}</p>
                                </div>
                            ))}
                        </div>
                        <p className="text-zinc-400 mt-6" style={{ fontSize: "15px" }}>
                            Need a deep dive on plumbing costs, licensing by state, and more?{" "}
                            <Link href="/trades/plumbing" className="text-[#FF6600] font-bold hover:underline">See the full plumbing trade guide →</Link>
                        </p>
                    </section>

                    {/* ── COST GUIDE ── */}
                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}>
                            <DollarSign className="w-6 h-6 text-[#FF6600]" />
                            How Much Does a Plumber Cost?
                        </h2>
                        <p className="text-zinc-500 mb-8" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                            Plumbing costs in Australia vary depending on the job type, your location, and whether the work is routine or an emergency.
                            The following are general estimates only — always get a written quote before work begins.
                        </p>
                        <div className="overflow-x-auto rounded-2xl border border-zinc-200 mb-6">
                            <table className="min-w-full text-left">
                                <thead className="bg-zinc-100 text-zinc-700">
                                    <tr>
                                        <th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Job Type</th>
                                        <th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Typical Cost (AUD)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {costGuide.map(([label, value]) => (
                                        <tr key={label} className="border-t border-zinc-200 bg-white">
                                            <td className="px-4 py-3 font-bold text-zinc-700" style={{ fontSize: "16px" }}>{label}</td>
                                            <td className="px-4 py-3 font-black text-zinc-900 whitespace-nowrap" style={{ fontSize: "16px" }}>{value}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-amber-800 text-sm leading-relaxed">
                                These are estimates based on general Australian market knowledge and are provided as a guide only.
                                Prices vary significantly by state, job complexity, and contractor. Use TradeRefer to get real quotes from local plumbers for your specific job.
                            </p>
                        </div>
                    </section>

                    {/* ── WHY TRADEREFER ── */}
                    <section>
                        <h2 className="font-black text-[#1A1A1A] mb-6 font-display" style={{ fontSize: "32px" }}>
                            Why Use TradeRefer to Find a Plumber?
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {whyTradeRefer.map(({ icon: Icon, title, body }) => (
                                <div key={title} className="bg-white rounded-3xl border border-zinc-200 p-8">
                                    <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mb-4">
                                        <Icon className="w-6 h-6 text-[#FF6600]" />
                                    </div>
                                    <h3 className="font-black text-zinc-900 mb-2 font-display" style={{ fontSize: "20px" }}>{title}</h3>
                                    <p className="text-zinc-500" style={{ fontSize: "16px", lineHeight: 1.7 }}>{body}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ── HOW IT WORKS ── */}
                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-8 font-display text-center" style={{ fontSize: "32px" }}>
                            How It Works
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {howItWorks.map(({ step, title, body }) => (
                                <div key={step} className="text-center">
                                    <div className="w-12 h-12 rounded-full bg-orange-100 text-[#FF6600] font-black text-xl flex items-center justify-center mx-auto mb-4">
                                        {step}
                                    </div>
                                    <h3 className="font-black text-zinc-900 mb-2" style={{ fontSize: "18px" }}>{title}</h3>
                                    <p className="text-zinc-500" style={{ fontSize: "16px", lineHeight: 1.7 }}>{body}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ── QUOTE FORM ── */}
                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <div className="max-w-3xl mb-8">
                            <h2 className="font-black text-[#1A1A1A] mb-3 font-display" style={{ fontSize: "32px" }}>Post Your Plumbing Job — It&apos;s Free</h2>
                            <p className="text-zinc-500" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                                Don&apos;t waste time chasing quotes. Post your job here and let trusted local plumbers come to you.
                            </p>
                        </div>
                        <PublicMultiQuoteForm initialTradeCategory="Plumbing" initialSourcePage="/trades/plumbers" />
                    </section>

                    {/* ── FIND BY CITY ── */}
                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}>
                            <MapPin className="w-6 h-6 text-[#FF6600]" />
                            Find Plumbers by City
                        </h2>
                        <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                            Browse verified plumbers in your city — or drill into suburb-level pages from there.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {featuredCities.map(({ city, state, stateSlug, citySlug }) => (
                                <Link
                                    key={`${city}-${state}`}
                                    href={`/local/${stateSlug}/${citySlug}?category=${encodeURIComponent("Plumbing")}`}
                                    className="flex items-center justify-between px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl hover:bg-orange-50 hover:border-[#FF6600] transition-colors group"
                                >
                                    <div>
                                        <span className="font-black text-zinc-900 group-hover:text-[#FF6600]" style={{ fontSize: "16px" }}>{city}</span>
                                        <p className="text-zinc-400" style={{ fontSize: "14px" }}>{state}</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-zinc-300 group-hover:text-[#FF6600]" />
                                </Link>
                            ))}
                        </div>
                    </section>

                    {/* ── FAQ ── */}
                    <section>
                        <h2 className="font-black text-[#1A1A1A] mb-8 font-display" style={{ fontSize: "32px" }}>
                            Frequently Asked Questions
                        </h2>
                        <div className="space-y-4">
                            {faqs.map((faq) => (
                                <div key={faq.q} className="bg-white rounded-2xl border border-zinc-200 p-6">
                                    <h3 className="font-black text-zinc-900 mb-2" style={{ fontSize: "18px" }}>{faq.q}</h3>
                                    <p className="text-zinc-600" style={{ fontSize: "16px", lineHeight: 1.7 }}>{faq.a}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ── HIRING TIPS ── */}
                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "28px" }}>
                            <Clock3 className="w-5 h-5 text-blue-500" />
                            Before You Hire a Plumber
                        </h2>
                        <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                            Use these checks to avoid unlicensed work, hidden fees, and poor-quality outcomes.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { icon: BadgeCheck, title: "Verify the plumbing licence", body: "All plumbing work in Australia must be completed by a licensed plumber. Ask for the licence number and confirm it with your state authority before work starts." },
                                { icon: FileText, title: "Get 2–3 written quotes", body: "Written quotes should separate labour, materials, call-out fees, and GST. Avoid vague verbal pricing and compare scope carefully before accepting." },
                                { icon: ShieldCheck, title: "Check insurance and compliance", body: "A reputable plumber should carry public liability insurance and provide compliance certificates where required, especially for regulated installations." },
                                { icon: Star, title: "Read verified reviews", body: "Look for patterns about punctuality, hidden charges, and cleanup quality. TradeRefer surfaces businesses ranked by real community referrals, not paid placement." },
                            ].map(({ icon: Icon, title, body }) => (
                                <div key={title} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-5">
                                    <div className="flex items-start gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center shrink-0">
                                            <Icon className="w-5 h-5 text-[#FF6600]" />
                                        </div>
                                        <h3 className="font-black text-zinc-900 pt-1" style={{ fontSize: "17px" }}>{title}</h3>
                                    </div>
                                    <p className="text-zinc-600" style={{ fontSize: "15px", lineHeight: 1.7 }}>{body}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ── RELATED ── */}
                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "28px" }}>
                            <Wrench className="w-5 h-5 text-[#FF6600]" />
                            Related Trade Guides
                        </h2>
                        <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                            Explore adjacent trade categories that homeowners often compare alongside plumbing work.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                { label: "Plumbing — Full Trade Guide", href: "/trades/plumbing" },
                                { label: "Electrical", href: "/trades/electrical" },
                                { label: "Air Conditioning & Heating", href: "/categories#air-conditioning-heating" },
                                { label: "Roofing", href: "/trades/roofing" },
                                { label: "Waterproofing", href: "/trades/waterproofing" },
                                { label: "Bathroom Renovations", href: "/local/bathroom-renovations-perth" },
                            ].map(({ label, href }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    className="flex items-center justify-between px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl font-bold text-zinc-700 hover:bg-orange-50 hover:border-[#FF6600] hover:text-[#FF6600] transition-colors"
                                    style={{ fontSize: "16px" }}
                                >
                                    <span>{label}</span>
                                    <ArrowRight className="w-4 h-4 text-zinc-300" />
                                </Link>
                            ))}
                        </div>
                    </section>

                    {/* ── BOTTOM CTA ── */}
                    <section className="bg-[#1A1A1A] rounded-3xl p-8 md:p-12 text-center text-white">
                        <CheckCircle2 className="w-12 h-12 text-[#FF6600] mx-auto mb-5" />
                        <h2 className="font-black mb-4 text-white" style={{ fontSize: "40px" }}>Need a Plumber Near You?</h2>
                        <p className="text-zinc-400 mb-8 max-w-2xl mx-auto" style={{ fontSize: "20px", lineHeight: 1.7 }}>
                            Post your plumbing job for free and get connected with trusted, reviewed local plumbers.
                            No obligation, no signup required.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link
                                href="/quotes?trade=Plumbing&source=%2Ftrades%2Fplumbers"
                                className="inline-flex items-center gap-2 bg-[#FF6600] hover:bg-[#E65C00] text-white font-black rounded-xl px-8 transition-colors"
                                style={{ minHeight: "64px", fontSize: "18px" }}
                            >
                                Post Your Plumber Job — Free <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                href="/businesses?category=Plumbing"
                                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-black rounded-xl px-8 transition-colors border border-white/10"
                                style={{ minHeight: "64px", fontSize: "18px" }}
                            >
                                Browse Plumbers
                            </Link>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
