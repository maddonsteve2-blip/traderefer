import { Metadata } from "next";
import Link from "next/link";
import {
    MapPin, Star, ShieldCheck, CheckCircle2, ChevronRight,
    ArrowRight, Clock, Zap, BadgeCheck, DollarSign,
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
        title: `Find an Electrician Near Me (${year}) — Compare Licensed Electricians | TradeRefer`,
        description:
            "Find a licensed electrician near you Australia-wide. Compare real reviews, get free quotes, and hire safely. Residential, commercial, and emergency electricians. Post your job free.",
        alternates: { canonical: `${BASE_URL}/find-an-electrician-near-me` },
        openGraph: {
            title: `Find an Electrician Near Me (${year}) | TradeRefer`,
            description: "Compare licensed electricians near you. Real reviews, free quotes, no signup needed.",
            url: `${BASE_URL}/find-an-electrician-near-me`,
            type: "website",
        },
    };
}

const FAQS = [
    {
        q: "How do I find a reliable electrician near me?",
        a: "The best way to find a reliable electrician near you is to check their licence, read verified reviews from real customers, and compare at least two quotes. On TradeRefer, every listed electrician has been reviewed by homeowners — post your job and let licensed electricians in your area respond with quotes and availability.",
    },
    {
        q: "How much does an electrician cost in Australia?",
        a: "Electricians in Australia typically charge between $80 and $150 per hour, with call-out fees of $80 to $120 on top. Most standard jobs — a new power point, replacing a safety switch, ceiling fan installation — cost between $150 and $500 in total. Larger jobs like a switchboard upgrade or solar connection cost $1,000 to $3,000+. Always get a written quote before work starts.",
    },
    {
        q: "Do electricians in Australia need to be licensed?",
        a: "Yes — all electrical work in Australia must be carried out by a licensed electrician. Unlicensed electrical work is illegal, extremely dangerous, and will void your home insurance. Each state and territory has its own licensing authority (e.g. Energy Safe Victoria, NSW Fair Trading, QBCC in Queensland). A licensed electrician must provide a Certificate of Electrical Safety on completion of any work.",
    },
    {
        q: "What types of jobs can an electrician help with?",
        a: "Licensed electricians can handle: new power points and light fittings, switchboard upgrades and safety switches (RCDs), ceiling fan and split system connections, solar panel grid connections, EV charger installation, smoke alarm installation and compliance, home theatre and data cabling, outdoor and garden lighting, and full electrical fitout for renovations and new builds.",
    },
    {
        q: "Can I get an emergency electrician near me?",
        a: "Yes. Many electricians on TradeRefer offer emergency and after-hours call-outs for serious electrical faults — exposed wires, power outages, burning smell from switchboard, or safety switch tripping repeatedly. When posting your job, select 'Urgent' and describe the fault clearly so local electricians offering emergency response can reply quickly.",
    },
    {
        q: "How do I know if electrical work needs a permit in my state?",
        a: "Most electrical work in Australia requires a Certificate of Electrical Safety (or equivalent), which your licensed electrician arranges automatically as part of the job. Major works like new circuits, switchboard upgrades, or solar connections may also need a separate permit. Your electrician will advise on this — if they don't mention certificates, ask for one explicitly before they start.",
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

async function getTopElectricians(): Promise<Business[]> {
    try {
        const result = await sql<Business[]>`
            SELECT id, slug, business_name, suburb, city, state,
                   avg_rating, total_reviews, logo_url, description, trade_category
            FROM businesses
            WHERE status = 'active'
              AND trade_category ILIKE '%electric%'
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

async function getElectricianCount(): Promise<number> {
    try {
        const result = await sql`
            SELECT COUNT(*) as count FROM businesses
            WHERE status = 'active' AND trade_category ILIKE '%electric%'
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
        { "@type": "ListItem", position: 2, name: "Find an Electrician Near Me", item: `${BASE_URL}/find-an-electrician-near-me` },
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
    name: "Find an Electrician Near Me",
    serviceType: "Electrical",
    provider: { "@type": "Organization", name: "TradeRefer", url: BASE_URL },
    areaServed: { "@type": "Country", name: "Australia" },
    description: "Find licensed electricians near you anywhere in Australia. Compare quotes, read real reviews, post your job free.",
    offers: {
        "@type": "AggregateOffer",
        priceCurrency: "AUD",
        lowPrice: "150",
        highPrice: "3000",
        offerCount: "500+",
    },
};

const CITIES = [
    { name: "Sydney", href: "/businesses?category=Electrical&location=Sydney" },
    { name: "Melbourne", href: "/businesses?category=Electrical&location=Melbourne" },
    { name: "Brisbane", href: "/businesses?category=Electrical&location=Brisbane" },
    { name: "Perth", href: "/businesses?category=Electrical&location=Perth" },
    { name: "Adelaide", href: "/businesses?category=Electrical&location=Adelaide" },
    { name: "Gold Coast", href: "/businesses?category=Electrical&location=Gold+Coast" },
    { name: "Canberra", href: "/businesses?category=Electrical&location=Canberra" },
    { name: "Newcastle", href: "/businesses?category=Electrical&location=Newcastle" },
    { name: "Wollongong", href: "/businesses?category=Electrical&location=Wollongong" },
    { name: "Geelong", href: "/businesses?category=Electrical&location=Geelong" },
    { name: "Hobart", href: "/businesses?category=Electrical&location=Hobart" },
    { name: "Darwin", href: "/businesses?category=Electrical&location=Darwin" },
];

export default async function FindAnElectricianNearMePage() {
    const [businesses, count] = await Promise.all([getTopElectricians(), getElectricianCount()]);
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
                            <span className="text-gray-400">Find an Electrician Near Me</span>
                        </nav>

                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-5 leading-[1.1] tracking-tight font-display">
                            Find a Licensed{" "}
                            <span className="text-[#FF6600]">Electrician Near You</span>
                            <br />Compare Quotes on TradeRefer
                        </h1>
                        <p className="text-xl text-gray-300 mb-8 max-w-2xl leading-relaxed">
                            Australia&apos;s verified electrician directory. Compare real reviews, get free quotes from licensed electricians in your area, and hire safely — power points to full switchboard upgrades.
                        </p>

                        <div className="flex flex-wrap gap-6 mb-10">
                            {count > 0 && (
                                <div className="flex items-center gap-2 text-gray-300">
                                    <ShieldCheck className="w-5 h-5 text-[#FF6600]" />
                                    <span className="font-semibold">{count.toLocaleString()}+ licensed electricians Australia-wide</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-gray-300">
                                <DollarSign className="w-5 h-5 text-[#FF6600]" />
                                <span className="font-semibold">$80–$150/hr typical rate</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                                <Clock className="w-5 h-5 text-[#FF6600]" />
                                <span className="font-semibold">Emergency same-day available</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Link
                                href="/businesses?category=Electrical"
                                className="inline-flex items-center gap-2 bg-[#FF6600] hover:bg-[#E65C00] text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg transition-all active:scale-95"
                            >
                                Find Electricians Near Me <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                href="/electricians-near-me"
                                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-lg px-8 py-4 rounded-xl transition-all"
                            >
                                Browse all electricians
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
                            <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-[#FF6600]" /> Licensed electricians only</span>
                            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#FF6600]" /> Free to post your job</span>
                        </div>
                    </div>
                </section>

                {/* ── TOP ELECTRICIANS ── */}
                {businesses.length > 0 && (
                    <section className="py-14 bg-[#FCFCFC] border-b border-gray-100">
                        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                            <h2 className="text-2xl font-extrabold mb-2 text-[#1A1A1A] font-display">
                                Top-Rated Electricians in Australia ({year})
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
                                <Link href="/businesses?category=Electrical" className="inline-flex items-center gap-2 border-2 border-[#FF6600] text-[#FF6600] hover:bg-[#FF6600] hover:text-white font-bold px-7 py-3 rounded-xl transition-all">
                                    View all {count.toLocaleString()}+ electricians <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </section>
                )}

                {/* ── CITIES ── */}
                <section className="py-12 bg-white border-b border-gray-100">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-2xl font-extrabold mb-8 text-[#1A1A1A] font-display">Find an Electrician by City</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {CITIES.map(({ name, href }) => (
                                <Link
                                    key={name}
                                    href={href}
                                    className="flex items-center gap-2 bg-[#FCFCFC] border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 hover:border-[#FF6600] hover:text-[#FF6600] transition-all"
                                >
                                    <MapPin className="w-3.5 h-3.5 text-[#FF6600] shrink-0" />
                                    Electricians in {name}
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── HOW IT WORKS ── */}
                <section className="py-14 bg-[#FCFCFC] border-b border-gray-100">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-2xl font-extrabold mb-10 text-[#1A1A1A] font-display text-center">How to Find an Electrician Near You</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-full bg-orange-100 text-[#FF6600] font-extrabold text-xl flex items-center justify-center mx-auto mb-4">1</div>
                                <h3 className="font-bold text-lg mb-2">Post your electrical job</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">Describe what you need — new power point, switchboard upgrade, safety switch fault, EV charger — and your suburb. Takes two minutes, costs nothing.</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-full bg-orange-100 text-[#FF6600] font-extrabold text-xl flex items-center justify-center mx-auto mb-4">2</div>
                                <h3 className="font-bold text-lg mb-2">Get quotes from local electricians</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">Licensed electricians in your area respond with availability and pricing. Compare quotes, read real reviews, and choose who to hire.</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-full bg-orange-100 text-[#FF6600] font-extrabold text-xl flex items-center justify-center mx-auto mb-4">3</div>
                                <h3 className="font-bold text-lg mb-2">Get it done safely</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">Your electrician completes the work and issues a Certificate of Electrical Safety. No hidden platform fees for homeowners, ever.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── CONTENT ── */}
                <section className="py-14 bg-white border-b border-gray-100">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-2xl font-extrabold mb-5 text-[#1A1A1A] font-display">What to Look for When Hiring an Electrician</h2>
                        <div className="prose prose-gray max-w-none text-gray-600 leading-relaxed space-y-4">
                            <p>
                                Electrical work is the most tightly regulated trade in Australia — and for good reason. All electrical work must be carried out by a licensed electrician, and completed work requires a Certificate of Electrical Safety (or equivalent in your state). This certificate is required for insurance claims, property sales, and council inspections.
                            </p>
                            <p>
                                When finding an electrician near you, look for: a valid state electrical licence, public liability insurance of at least $5 million, genuine reviews from verified customers, and a written quote before work begins. Never hire someone who offers to do electrical work without a licence — the legal risk and safety risk are both significant.
                            </p>
                            <p>
                                Common jobs range from <strong>$150 for a new power point</strong> to <strong>$3,000+ for a full switchboard upgrade</strong>. Getting multiple quotes is the most effective way to ensure fair pricing — and TradeRefer makes it free and fast to compare licensed electricians in your area.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ── FAQ ── */}
                <section className="py-14 bg-[#FCFCFC] border-b border-gray-100">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-2xl font-extrabold mb-8 text-[#1A1A1A] font-display">Find an Electrician Near Me: Frequently Asked Questions</h2>
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
                                { label: "Electricians Near Me", href: "/electricians-near-me" },
                                { label: "Find a Plumber Near Me", href: "/find-a-plumber-near-me" },
                                { label: "Solar Installers Near Me", href: "/solar-installers-near-me" },
                                { label: "Air Conditioning Near Me", href: "/air-conditioning-near-me" },
                                { label: "All Electrical Services", href: "/trades/electrical" },
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
                        <Zap className="w-12 h-12 text-[#FF6600] mx-auto mb-5" />
                        <h2 className="text-3xl font-extrabold mb-4 font-display">Ready to Find an Electrician Near You?</h2>
                        <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                            Join thousands of Australians who&apos;ve found trusted local electricians through TradeRefer. Post your job free — no signup needed, no obligation.
                        </p>
                        <Link
                            href="/businesses?category=Electrical"
                            className="inline-flex items-center gap-2 bg-[#FF6600] hover:bg-[#E65C00] text-white font-bold text-lg px-10 py-4 rounded-xl shadow-xl transition-all active:scale-95"
                        >
                            Find an Electrician Near Me — Free <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </section>

            </main>
        </>
    );
}
