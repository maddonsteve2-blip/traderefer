import { Metadata } from "next";
import Link from "next/link";
import {
    MapPin, Star, ShieldCheck, CheckCircle2, ChevronRight,
    ArrowRight, Clock, Wrench, BadgeCheck, DollarSign,
} from "lucide-react";
import { sql } from "@/lib/db";
import { BusinessLogo } from "@/components/BusinessLogo";
import { generateFallbackDescription } from "@/lib/business-utils";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

const BASE_URL = "https://traderefer.au";

export const metadata: Metadata = {
    title: "Gutter Cleaning Geelong — Find Trusted Local Gutter Cleaners | TradeRefer",
    description:
        "Find reliable gutter cleaning in Geelong. Compare local tradies, read real reviews, and post your job free on TradeRefer. Quick quotes, no hassle.",
    alternates: { canonical: `${BASE_URL}/local/gutter-cleaning-geelong` },
    openGraph: {
        title: "Gutter Cleaning Geelong — Find Trusted Local Gutter Cleaners | TradeRefer",
        description:
            "Find reliable gutter cleaning in Geelong. Compare local tradies, read real reviews, and post your job free on TradeRefer.",
        url: `${BASE_URL}/local/gutter-cleaning-geelong`,
        type: "website",
    },
};

const FAQS = [
    {
        q: "How much does gutter cleaning cost in Geelong?",
        a: "Gutter cleaning in Geelong typically costs between $150 and $400 depending on your home's size, the number of storeys, and how long since the last clean. Single-storey homes on a standard block usually fall toward the lower end. Post your job on TradeRefer to get real, competitive quotes from local Geelong gutter cleaners.",
    },
    {
        q: "How often should I have my gutters cleaned in Geelong?",
        a: "Most Geelong homes benefit from at least two gutter cleans per year — once in autumn after the leaves have fallen, and once in spring before the storm season. Homes near trees, or in leafy suburbs like Newtown or Highton, may need cleaning more frequently to prevent blockages and water damage.",
    },
    {
        q: "Do gutter cleaners in Geelong also repair downpipes and fix leaks?",
        a: "Yes — many gutter cleaning tradies in Geelong offer minor repairs as part of the same visit, including resealing joints, re-securing loose brackets, and clearing blocked downpipes. If you need more extensive gutter replacement or fascia repairs, TradeRefer can also connect you with licensed roofing and guttering specialists in the Geelong area.",
    },
    {
        q: "What suburbs around Geelong do gutter cleaners service?",
        a: "Most Geelong gutter cleaners service the full Greater Geelong area including Newtown, Belmont, Highton, Leopold, Lara, Corio, Norlane, Grovedale, Waurn Ponds, Ocean Grove, Barwon Heads, and the Bellarine Peninsula.",
    },
    {
        q: "What happens if gutters are not cleaned regularly?",
        a: "Blocked gutters can cause roof leaks, fascia rot, overflowing water damaging foundations and gardens, mosquito breeding in stagnant water, and in severe cases structural damage. Geelong's seasonal rainfall and leafy suburbs make regular gutter maintenance especially important.",
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

async function getGeelongGutterBusinesses(): Promise<Business[]> {
    try {
        const result = await sql<Business[]>`
            SELECT id, slug, business_name, suburb, city, state,
                   avg_rating, total_reviews, logo_url, description, trade_category
            FROM businesses
            WHERE status = 'active'
              AND trade_category ILIKE '%gutter%'
              AND (
                  city ILIKE '%geelong%'
                  OR suburb ILIKE '%geelong%'
                  OR suburb ILIKE '%newtown%'
                  OR suburb ILIKE '%belmont%'
                  OR suburb ILIKE '%highton%'
                  OR suburb ILIKE '%leopold%'
                  OR suburb ILIKE '%lara%'
                  OR suburb ILIKE '%corio%'
                  OR suburb ILIKE '%grovedale%'
                  OR suburb ILIKE '%waurn ponds%'
                  OR suburb ILIKE '%ocean grove%'
              )
            ORDER BY
                CASE WHEN avg_rating IS NOT NULL AND total_reviews > 0 THEN 0 ELSE 1 END,
                (COALESCE(avg_rating::numeric, 0) * LOG(COALESCE(total_reviews::numeric, 1) + 1)) DESC
            LIMIT 12
        `;
        return result;
    } catch {
        return [];
    }
}

async function getGeelongGutterCount(): Promise<number> {
    try {
        const result = await sql`
            SELECT COUNT(*) as count
            FROM businesses
            WHERE status = 'active'
              AND trade_category ILIKE '%gutter%'
              AND (
                  city ILIKE '%geelong%'
                  OR suburb ILIKE '%geelong%'
                  OR suburb ILIKE '%newtown%'
                  OR suburb ILIKE '%belmont%'
                  OR suburb ILIKE '%highton%'
                  OR suburb ILIKE '%leopold%'
                  OR suburb ILIKE '%lara%'
              )
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
        { "@type": "ListItem", position: 2, name: "Local Trades", item: `${BASE_URL}/local` },
        { "@type": "ListItem", position: 3, name: "Victoria", item: `${BASE_URL}/local/vic` },
        {
            "@type": "ListItem",
            position: 4,
            name: "Gutter Cleaning Geelong",
            item: `${BASE_URL}/local/gutter-cleaning-geelong`,
        },
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
    name: "Gutter Cleaning Geelong",
    serviceType: "Gutter Cleaning",
    provider: {
        "@type": "Organization",
        name: "TradeRefer",
        url: BASE_URL,
    },
    areaServed: {
        "@type": "City",
        name: "Geelong",
        containedInPlace: { "@type": "State", name: "Victoria", containedInPlace: { "@type": "Country", name: "Australia" } },
    },
    description:
        "Find trusted gutter cleaning professionals in Geelong and Greater Geelong. Compare quotes, read real reviews, post your job free.",
    offers: {
        "@type": "AggregateOffer",
        priceCurrency: "AUD",
        lowPrice: "150",
        highPrice: "400",
        offerCount: "10+",
    },
};

export default async function GutterCleaningGeelongPage() {
    const [businesses, count] = await Promise.all([
        getGeelongGutterBusinesses(),
        getGeelongGutterCount(),
    ]);

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
                        {/* Breadcrumb */}
                        <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
                            <Link href="/" className="hover:text-[#FF6600] transition-colors">Home</Link>
                            <ChevronRight className="w-3.5 h-3.5" />
                            <Link href="/local/vic" className="hover:text-[#FF6600] transition-colors">Victoria</Link>
                            <ChevronRight className="w-3.5 h-3.5" />
                            <span className="text-gray-400">Gutter Cleaning Geelong</span>
                        </nav>

                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-5 leading-[1.1] tracking-tight font-display">
                            Gutter Cleaning in{" "}
                            <span className="text-[#FF6600]">Geelong</span>
                            <br />Find Trusted Local Gutter Cleaners
                        </h1>
                        <p className="text-xl text-gray-300 mb-8 max-w-2xl leading-relaxed">
                            Blocked gutters are one of Geelong&apos;s most overlooked maintenance problems. Compare reviewed local gutter cleaners, get free quotes, and protect your home before storm season.
                        </p>

                        {/* Stats */}
                        <div className="flex flex-wrap gap-6 mb-10">
                            {count > 0 && (
                                <div className="flex items-center gap-2 text-gray-300">
                                    <ShieldCheck className="w-5 h-5 text-[#FF6600]" />
                                    <span className="font-semibold">{count}+ verified gutter cleaners in Geelong</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-gray-300">
                                <DollarSign className="w-5 h-5 text-[#FF6600]" />
                                <span className="font-semibold">$150–$400 typical cost</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                                <Clock className="w-5 h-5 text-[#FF6600]" />
                                <span className="font-semibold">Free quotes, no obligation</span>
                            </div>
                        </div>

                        <Link
                            href="/businesses?category=Guttering&location=Geelong"
                            className="inline-flex items-center gap-2 bg-[#FF6600] hover:bg-[#E65C00] text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg transition-all active:scale-95"
                        >
                            Browse Geelong Gutter Cleaners <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </section>

                {/* ── WHY TRADEREFER ── */}
                <section className="py-14 bg-white border-b border-gray-100">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-2xl font-extrabold mb-8 text-[#1A1A1A] font-display">Why Use TradeRefer for Gutter Cleaning in Geelong?</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-[#FCFCFC] border border-gray-100 rounded-2xl p-6">
                                <Star className="w-8 h-8 text-[#FF6600] mb-3" />
                                <h3 className="font-bold text-lg mb-2">Real Geelong Reviews</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">Every gutter cleaner listed has been reviewed by local Geelong homeowners — hire with confidence, not guesswork.</p>
                            </div>
                            <div className="bg-[#FCFCFC] border border-gray-100 rounded-2xl p-6">
                                <Wrench className="w-8 h-8 text-[#FF6600] mb-3" />
                                <h3 className="font-bold text-lg mb-2">Post Once, Get Quotes</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">Describe your job, hit submit, and let local gutter cleaning businesses come to you — no endless phone calls required.</p>
                            </div>
                            <div className="bg-[#FCFCFC] border border-gray-100 rounded-2xl p-6">
                                <BadgeCheck className="w-8 h-8 text-[#FF6600] mb-3" />
                                <h3 className="font-bold text-lg mb-2">Free for Homeowners</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">Posting a job on TradeRefer costs you nothing. Compare quotes, check reviews, and choose your tradie at zero cost.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── LOCAL BUSINESSES ── */}
                {businesses.length > 0 && (
                    <section className="py-14 bg-[#FCFCFC] border-b border-gray-100">
                        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                            <h2 className="text-2xl font-extrabold mb-2 text-[#1A1A1A] font-display">
                                Top Gutter Cleaners in Geelong
                            </h2>
                            <p className="text-gray-500 mb-8">Verified businesses serving Greater Geelong and surrounds</p>
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
                                    const location = [biz.suburb, biz.state?.toUpperCase()].filter(Boolean).join(", ");
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
                                                <h3 className="font-bold text-[#1A1A1A] group-hover:text-[#FF6600] transition-colors leading-tight mb-1 truncate">
                                                    {biz.business_name}
                                                </h3>
                                                {location && (
                                                    <p className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                                                        <MapPin className="w-3 h-3 shrink-0" />
                                                        {location}
                                                    </p>
                                                )}
                                                {rating !== null && reviews > 0 && (
                                                    <p className="flex items-center gap-1 text-sm text-amber-500 font-semibold mb-2">
                                                        <Star className="w-3.5 h-3.5 fill-amber-500" />
                                                        {rating.toFixed(1)}
                                                        <span className="text-gray-400 font-normal">({reviews.toLocaleString()} reviews)</span>
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
                                <Link
                                    href="/businesses?category=Guttering&location=Geelong"
                                    className="inline-flex items-center gap-2 border-2 border-[#FF6600] text-[#FF6600] hover:bg-[#FF6600] hover:text-white font-bold px-7 py-3 rounded-xl transition-all"
                                >
                                    View all Geelong gutter cleaners <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </section>
                )}

                {/* ── HOW IT WORKS ── */}
                <section className="py-14 bg-white border-b border-gray-100">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-2xl font-extrabold mb-10 text-[#1A1A1A] font-display text-center">How to Find a Gutter Cleaner in Geelong</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-full bg-orange-100 text-[#FF6600] font-extrabold text-xl flex items-center justify-center mx-auto mb-4">1</div>
                                <h3 className="font-bold text-lg mb-2">Post your gutter cleaning job</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">Describe your property, the number of storeys, and any access issues. Takes less than two minutes and it&apos;s completely free.</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-full bg-orange-100 text-[#FF6600] font-extrabold text-xl flex items-center justify-center mx-auto mb-4">2</div>
                                <h3 className="font-bold text-lg mb-2">Receive quotes from local tradies</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">Reviewed gutter cleaners in Geelong and surrounds — Newtown, Belmont, Leopold, Ocean Grove — will respond with their availability and pricing.</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-full bg-orange-100 text-[#FF6600] font-extrabold text-xl flex items-center justify-center mx-auto mb-4">3</div>
                                <h3 className="font-bold text-lg mb-2">Choose your tradie and get it done</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">Compare quotes and reviews, confirm your preferred tradie, and get your gutters cleaned — no surprises, no hidden fees.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── INTRO CONTENT ── */}
                <section className="py-14 bg-[#FCFCFC] border-b border-gray-100">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-2xl font-extrabold mb-5 text-[#1A1A1A] font-display">Gutter Cleaning in Geelong — What You Need to Know</h2>
                        <div className="prose prose-gray max-w-none text-gray-600 leading-relaxed space-y-4">
                            <p>
                                Blocked gutters are one of Geelong&apos;s most overlooked maintenance problems — and with the Bellarine Peninsula&apos;s autumn leaf falls and coastal storm debris, local homes need regular gutter clearing to protect roofs, fascias, and foundations. TradeRefer connects Geelong homeowners with trusted, reviewed local gutter cleaners who show up on time and leave your downpipes clear.
                            </p>
                            <p>
                                Whether you need a one-off clean before winter or a recurring maintenance schedule, finding the right tradie takes minutes. Gutter cleaning in Geelong typically costs between <strong>$150 and $400</strong> depending on your home&apos;s size and storey count — post your job to get real, competitive quotes rather than guessing at a fixed price.
                            </p>
                            <p>
                                Many Geelong gutter cleaners also offer minor on-the-spot repairs including downpipe clearing, bracket re-securing, and joint resealing. If you need full gutter replacement or Colorbond fascia work, TradeRefer can also match you with licensed guttering and roofing specialists across the Greater Geelong area.
                            </p>
                        </div>
                        <div className="mt-6 flex flex-wrap gap-2">
                            {["Newtown", "Belmont", "Highton", "Leopold", "Lara", "Ocean Grove", "Barwon Heads", "Waurn Ponds", "Corio", "Grovedale"].map((suburb) => (
                                <span key={suburb} className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-full px-3 py-1 text-sm text-gray-600">
                                    <MapPin className="w-3 h-3 text-[#FF6600]" /> {suburb}
                                </span>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── FAQ ── */}
                <section className="py-14 bg-white border-b border-gray-100">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-2xl font-extrabold mb-8 text-[#1A1A1A] font-display">Gutter Cleaning Geelong: Frequently Asked Questions</h2>
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

                {/* ── RELATED LINKS ── */}
                <section className="py-12 bg-[#F2F2F2] border-b border-gray-200">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-lg font-extrabold mb-6 text-[#1A1A1A] font-display">Related Trades in Geelong</h2>
                        <div className="flex flex-wrap gap-3">
                            {[
                                { label: "Roofers in Geelong", href: "/local/vic/geelong" },
                                { label: "Plumbers in Geelong", href: "/businesses?category=Plumbing&location=Geelong" },
                                { label: "Painters in Geelong", href: "/businesses?category=Painting&location=Geelong" },
                                { label: "All Gutter Installers Near Me", href: "/gutter-installers-near-me" },
                                { label: "All trades in Victoria", href: "/local/vic" },
                            ].map(({ label, href }) => (
                                <Link
                                    key={label}
                                    href={href}
                                    className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm font-semibold text-gray-600 hover:border-[#FF6600] hover:text-[#FF6600] transition-all"
                                >
                                    <ChevronRight className="w-3.5 h-3.5" /> {label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── CTA ── */}
                <section className="py-16 bg-[#1A1A1A] text-white">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <CheckCircle2 className="w-12 h-12 text-[#FF6600] mx-auto mb-5" />
                        <h2 className="text-3xl font-extrabold mb-4 font-display">Need a Gutter Cleaner in Geelong?</h2>
                        <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                            Join thousands of Geelong homeowners who&apos;ve found trusted local tradies through TradeRefer. Describe your gutter cleaning job and get quotes today — no signup required.
                        </p>
                        <Link
                            href="/businesses?category=Guttering&location=Geelong"
                            className="inline-flex items-center gap-2 bg-[#FF6600] hover:bg-[#E65C00] text-white font-bold text-lg px-10 py-4 rounded-xl shadow-xl transition-all active:scale-95"
                        >
                            Post your gutter cleaning job — it&apos;s free <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </section>

            </main>
        </>
    );
}
