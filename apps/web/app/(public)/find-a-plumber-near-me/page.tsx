import { Metadata } from "next";
import Link from "next/link";
import {
    MapPin, Star, ShieldCheck, CheckCircle2, ChevronRight,
    ArrowRight, Clock, Wrench, BadgeCheck, DollarSign, Droplets,
} from "lucide-react";
import { sql } from "@/lib/db";
import { BusinessLogo } from "@/components/BusinessLogo";
import { generateFallbackDescription } from "@/lib/business-utils";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

const BASE_URL = "https://traderefer.au";

export async function generateMetadata(): Promise<Metadata> {
    const year = new Date().getFullYear();
    return {
        title: `Find a Plumber Near Me | Compare Licensed Plumbers | TradeRefer`,
        description:
            "Find a licensed plumber near you Australia-wide. Compare real reviews, get free quotes, and hire with confidence. Emergency plumbers available. Post your job free on TradeRefer.",
        alternates: { canonical: `${BASE_URL}/find-a-plumber-near-me` },
        openGraph: {
            title: `Find a Plumber Near Me | TradeRefer`,
            description: "Compare licensed plumbers near you. Real reviews, free quotes, no signup needed.",
            url: `${BASE_URL}/find-a-plumber-near-me`,
            type: "website",
        },
    };
}

const FAQS = [
    {
        q: "How do I find a good plumber near me?",
        a: "The best way to find a reliable plumber near you is to compare verified reviews from real customers, check their licence status, and get multiple quotes for your job. On TradeRefer, every listed plumber has been reviewed by homeowners who've used their services — post your job and let licensed plumbers in your area contact you with quotes.",
    },
    {
        q: "How much does a plumber cost in Australia?",
        a: "Plumber call-out rates in Australia typically range from $80 to $180 per hour, with most jobs costing between $150 and $500 in total. Simple jobs like fixing a leaky tap or unblocking a drain cost less; larger jobs like hot water system replacement, bathroom renovation plumbing, or emergency burst pipe repairs cost more. Always get at least two quotes to compare.",
    },
    {
        q: "Do plumbers in Australia need to be licensed?",
        a: "Yes. All plumbers in Australia must hold a valid plumber's licence issued by their state or territory licensing board (e.g. VBA in Victoria, NSW Fair Trading in New South Wales). Unlicensed plumbing work is illegal and may void your home insurance. Always ask to see a contractor's licence before they start work — or use TradeRefer where licence verification is part of our listing process.",
    },
    {
        q: "Can I get an emergency plumber near me on TradeRefer?",
        a: "Yes. Many plumbers listed on TradeRefer offer emergency and same-day services. When posting your job, tick the 'Urgent' option and describe the emergency — burst pipe, sewage overflow, no hot water — and local plumbers who offer emergency call-outs will respond as quickly as possible.",
    },
    {
        q: "What plumbing jobs can a plumber help with?",
        a: "Licensed plumbers can handle a wide range of jobs including: leaky taps and pipes, blocked drains and toilets, hot water system installation and repair, bathroom and kitchen plumbing for renovations, gas fitting (gas-licensed plumbers), sewer and stormwater drainage, water pressure issues, and complete new installations for new builds. If it involves water, gas, or drainage, a licensed plumber is the person for the job.",
    },
    {
        q: "How quickly can a plumber come to my home?",
        a: "For standard (non-emergency) plumbing jobs, most licensed plumbers can attend within 1–3 business days. For emergency situations — burst pipes, sewage backflow, no hot water — many plumbers offer same-day or after-hours response. When posting your job on TradeRefer, indicate your timeframe and urgency level so the right contractors can respond.",
    },
];

type Business = {
    id: string;
    slug: string;
    business_name: string;
    suburb: string | null;
    city: string | null;
    state: string | null;
    avg_rating: string | number | null;
    total_reviews: string | number | null;
    logo_url: string | null;
    description: string | null;
    trade_category: string;
};

async function getTopPlumbers(): Promise<Business[]> {
    try {
        const result = await sql<Business[]>`
            SELECT id, slug, business_name, suburb, city, state,
                   avg_rating, total_reviews, logo_url, description, trade_category
            FROM businesses
            WHERE status = 'active'
              AND trade_category ILIKE '%plumb%'
              AND avg_rating IS NOT NULL
              AND total_reviews > 2
            ORDER BY
                (COALESCE(avg_rating::numeric, 0) * LOG(COALESCE(total_reviews::numeric, 1) + 1)) DESC
            LIMIT 12
        `;
        return result;
    } catch {
        return [];
    }
}

async function getPlumberCount(): Promise<number> {
    try {
        const result = await sql`
            SELECT COUNT(*) as count FROM businesses
            WHERE status = 'active' AND trade_category ILIKE '%plumb%'
        `;
        return parseInt(String(result[0]?.count || 0), 10);
    } catch {
        return 0;
    }
}

const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
        { "@type": "ListItem", position: 2, name: "Find a Plumber Near Me", item: `${BASE_URL}/find-a-plumber-near-me` },
    ],
};

const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
};

const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Find a Plumber Near Me",
    serviceType: "Plumbing",
    provider: { "@type": "Organization", name: "TradeRefer", url: BASE_URL },
    areaServed: { "@type": "Country", name: "Australia" },
    description: "Find licensed plumbers near you anywhere in Australia. Compare quotes, read real reviews, post your job free.",
    offers: {
        "@type": "AggregateOffer",
        priceCurrency: "AUD",
        lowPrice: "150",
        highPrice: "2000",
        offerCount: "500+",
    },
};

const CITIES = [
    { name: "Sydney", href: "/businesses?category=Plumbing&location=Sydney" },
    { name: "Melbourne", href: "/businesses?category=Plumbing&location=Melbourne" },
    { name: "Brisbane", href: "/businesses?category=Plumbing&location=Brisbane" },
    { name: "Perth", href: "/businesses?category=Plumbing&location=Perth" },
    { name: "Adelaide", href: "/businesses?category=Plumbing&location=Adelaide" },
    { name: "Gold Coast", href: "/businesses?category=Plumbing&location=Gold+Coast" },
    { name: "Canberra", href: "/businesses?category=Plumbing&location=Canberra" },
    { name: "Newcastle", href: "/businesses?category=Plumbing&location=Newcastle" },
    { name: "Wollongong", href: "/businesses?category=Plumbing&location=Wollongong" },
    { name: "Geelong", href: "/businesses?category=Plumbing&location=Geelong" },
    { name: "Hobart", href: "/businesses?category=Plumbing&location=Hobart" },
    { name: "Cairns", href: "/businesses?category=Plumbing&location=Cairns" },
];

export default async function FindAPlumberNearMePage() {
    const [businesses, count] = await Promise.all([getTopPlumbers(), getPlumberCount()]);
    const year = new Date().getFullYear();

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />

            <main className="bg-[#FCFCFC] text-[#1A1A1A] antialiased">

                {/* ── HERO ── */}
                <section className="bg-[#1A1A1A] text-white pt-28 pb-16 relative overflow-hidden border-b border-gray-800">
                    <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(#FF6600 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
                            <Link href="/" className="hover:text-[#FF6600] transition-colors">Home</Link>
                            <ChevronRight className="w-3.5 h-3.5" />
                            <span className="text-gray-400">Find a Plumber Near Me</span>
                        </nav>

                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-5 leading-[1.1] tracking-tight font-display">
                            Find a Licensed{" "}
                            <span className="text-[#FF6600]">Plumber Near You</span>
                            <br />Compare Quotes on TradeRefer
                        </h1>
                        <p className="text-xl text-gray-300 mb-8 max-w-2xl leading-relaxed">
                            Australia&apos;s verified plumber directory. Compare real reviews, get free quotes from licensed plumbers in your area, and hire with confidence — leaky taps to full bathroom renovations.
                        </p>

                        <div className="flex flex-wrap gap-6 mb-10">
                            {count > 0 && (
                                <div className="flex items-center gap-2 text-gray-300">
                                    <ShieldCheck className="w-5 h-5 text-[#FF6600]" />
                                    <span className="font-semibold">{count.toLocaleString()}+ licensed plumbers Australia-wide</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-gray-300">
                                <DollarSign className="w-5 h-5 text-[#FF6600]" />
                                <span className="font-semibold">$80–$180/hr typical rate</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                                <Clock className="w-5 h-5 text-[#FF6600]" />
                                <span className="font-semibold">Emergency same-day available</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Link
                                href="/businesses?category=Plumbing"
                                className="inline-flex items-center gap-2 bg-[#FF6600] hover:bg-[#E65C00] text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg transition-all active:scale-95"
                            >
                                Find Plumbers Near Me <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                href="/plumbers-near-me"
                                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-lg px-8 py-4 rounded-xl transition-all"
                            >
                                Browse all plumbers
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ── TRUST BAR ── */}
                <section className="py-5 bg-orange-50 border-b border-orange-100">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-semibold text-orange-800">
                            <span className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-[#FF6600]" /> ABN-verified businesses</span>
                            <span className="flex items-center gap-2"><Star className="w-4 h-4 text-[#FF6600]" /> Real customer reviews</span>
                            <span className="flex items-center gap-2"><Droplets className="w-4 h-4 text-[#FF6600]" /> Licensed plumbers only</span>
                            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#FF6600]" /> Free to post your job</span>
                        </div>
                    </div>
                </section>

                {/* ── TOP PLUMBERS ── */}
                {businesses.length > 0 && (
                    <section className="py-14 bg-[#FCFCFC] border-b border-gray-100">
                        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                            <h2 className="text-2xl font-extrabold mb-2 text-[#1A1A1A] font-display">
                                Top-Rated Plumbers in Australia ({year})
                            </h2>
                            <p className="text-gray-500 mb-8">Ranked by verified customer review score</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {businesses.map((biz) => {
                                    const rating = biz.avg_rating ? parseFloat(String(biz.avg_rating)) : null;
                                    const reviews = biz.total_reviews ? parseInt(String(biz.total_reviews), 10) : 0;
                                    const description = biz.description || generateFallbackDescription({
                                        business_name: biz.business_name,
                                        trade_category: biz.trade_category,
                                        suburb: biz.suburb ?? undefined,
                                        city: biz.city ?? undefined,
                                        state: biz.state ?? undefined,
                                        avg_rating: biz.avg_rating ?? undefined,
                                        total_reviews: biz.total_reviews ?? undefined,
                                    });
                                    const location = [biz.suburb || biz.city, biz.state?.toUpperCase()].filter(Boolean).join(", ");
                                    return (
                                        <Link
                                            key={biz.id}
                                            href={`/b/${biz.slug}`}
                                            className="flex gap-4 bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:border-[#FF6600] transition-all group"
                                        >
                                            <div className="shrink-0">
                                                <BusinessLogo logoUrl={biz.logo_url} name={biz.business_name} size="sm" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-bold text-[#1A1A1A] group-hover:text-[#FF6600] transition-colors leading-tight mb-1 truncate">{biz.business_name}</h3>
                                                {location && (
                                                    <p className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                                                        <MapPin className="w-3 h-3 shrink-0" />{location}
                                                    </p>
                                                )}
                                                {rating !== null && reviews > 0 && (
                                                    <p className="flex items-center gap-1 text-sm text-amber-500 font-semibold mb-2">
                                                        <Star className="w-3.5 h-3.5 fill-amber-500" />
                                                        {rating.toFixed(1)}<span className="text-gray-400 font-normal">({reviews.toLocaleString()} reviews)</span>
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{description}</p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#FF6600] transition-colors shrink-0 self-center" />
                                        </Link>
                                    );
                                })}
                            </div>
                            <div className="mt-8 text-center">
                                <Link href="/businesses?category=Plumbing" className="inline-flex items-center gap-2 border-2 border-[#FF6600] text-[#FF6600] hover:bg-[#FF6600] hover:text-white font-bold px-7 py-3 rounded-xl transition-all">
                                    View all {count.toLocaleString()}+ plumbers <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </section>
                )}

                {/* ── CITIES ── */}
                <section className="py-12 bg-white border-b border-gray-100">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-2xl font-extrabold mb-8 text-[#1A1A1A] font-display">Find a Plumber by City</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {CITIES.map(({ name, href }) => (
                                <Link
                                    key={name}
                                    href={href}
                                    className="flex items-center gap-2 bg-[#FCFCFC] border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 hover:border-[#FF6600] hover:text-[#FF6600] transition-all"
                                >
                                    <MapPin className="w-3.5 h-3.5 text-[#FF6600] shrink-0" />
                                    Plumbers in {name}
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── HOW IT WORKS ── */}
                <section className="py-14 bg-[#FCFCFC] border-b border-gray-100">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-2xl font-extrabold mb-10 text-[#1A1A1A] font-display text-center">How to Find a Plumber Near You</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-full bg-orange-100 text-[#FF6600] font-extrabold text-xl flex items-center justify-center mx-auto mb-4">1</div>
                                <h3 className="font-bold text-lg mb-2">Post your plumbing job</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">Describe what needs fixing — leaky tap, blocked drain, hot water system, bathroom reno — and your suburb. Takes two minutes and costs nothing.</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-full bg-orange-100 text-[#FF6600] font-extrabold text-xl flex items-center justify-center mx-auto mb-4">2</div>
                                <h3 className="font-bold text-lg mb-2">Get quotes from local plumbers</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">Licensed plumbers in your area respond with availability and quotes. Compare prices, read their reviews, and choose who you want to hire.</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-full bg-orange-100 text-[#FF6600] font-extrabold text-xl flex items-center justify-center mx-auto mb-4">3</div>
                                <h3 className="font-bold text-lg mb-2">Get the job done</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">Confirm your chosen plumber, get the work done, and leave a review to help the next homeowner. No hidden platform fees for you.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── CONTENT ── */}
                <section className="py-14 bg-white border-b border-gray-100">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-2xl font-extrabold mb-5 text-[#1A1A1A] font-display">What to Look for When Hiring a Plumber</h2>
                        <div className="prose prose-gray max-w-none text-gray-600 leading-relaxed space-y-4">
                            <p>
                                Plumbing is one of the most commonly required home services in Australia — and one of the most regulated. All plumbing and drainage work in Australia must be carried out by a licensed plumber, and completed work must be certified with a Certificate of Compliance (or equivalent in your state). This is important for insurance purposes and is required when selling your home.
                            </p>
                            <p>
                                When finding a plumber near you, look for: a valid state plumbing licence, public liability insurance of at least $5 million, genuine customer reviews from verified homeowners, and transparent pricing with a written quote before work starts. Avoid tradespeople who quote verbally only or refuse to provide a licence number.
                            </p>
                            <p>
                                Typical plumbing jobs range from <strong>$150 for minor repairs</strong> to <strong>$5,000+ for hot water system replacement or bathroom plumbing</strong>. Getting at least two quotes is the single most effective way to avoid overpaying — and TradeRefer makes this free and fast.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ── FAQ ── */}
                <section className="py-14 bg-[#FCFCFC] border-b border-gray-100">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-2xl font-extrabold mb-8 text-[#1A1A1A] font-display">Find a Plumber Near Me: Frequently Asked Questions</h2>
                        <div className="space-y-6">
                            {FAQS.map((faq, i) => (
                                <div key={i} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                                    <h3 className="font-bold text-[#1A1A1A] mb-2 text-lg leading-snug">{faq.q}</h3>
                                    <p className="text-gray-600 leading-relaxed">{faq.a}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── RELATED ── */}
                <section className="py-12 bg-[#F2F2F2] border-b border-gray-200">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-lg font-extrabold mb-6 text-[#1A1A1A] font-display">Related Trades</h2>
                        <div className="flex flex-wrap gap-3">
                            {[
                                { label: "Plumbers Near Me", href: "/plumbers-near-me" },
                                { label: "Electricians Near Me", href: "/electricians-near-me" },
                                { label: "Find an Electrician Near Me", href: "/find-an-electrician-near-me" },
                                { label: "Gas Fitters Near Me", href: "/gas-fitters-near-me" },
                                { label: "All Plumbing Services", href: "/trades/plumbing" },
                            ].map(({ label, href }) => (
                                <Link key={label} href={href} className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm font-semibold text-gray-600 hover:border-[#FF6600] hover:text-[#FF6600] transition-all">
                                    <ChevronRight className="w-3.5 h-3.5" /> {label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── CTA ── */}
                <section className="py-16 bg-[#1A1A1A] text-white">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <Wrench className="w-12 h-12 text-[#FF6600] mx-auto mb-5" />
                        <h2 className="text-3xl font-extrabold mb-4 font-display">Ready to Find a Plumber Near You?</h2>
                        <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                            Join thousands of Australians who&apos;ve found trusted local plumbers through TradeRefer. Post your job free — no signup needed, no obligation.
                        </p>
                        <Link
                            href="/businesses?category=Plumbing"
                            className="inline-flex items-center gap-2 bg-[#FF6600] hover:bg-[#E65C00] text-white font-bold text-lg px-10 py-4 rounded-xl shadow-xl transition-all active:scale-95"
                        >
                            Find a Plumber Near Me — Free <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </section>

            </main>
        </>
    );
}
