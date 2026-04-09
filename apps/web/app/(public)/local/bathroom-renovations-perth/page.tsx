import { Metadata } from "next";
import Link from "next/link";
import {
    MapPin, Star, ShieldCheck, CheckCircle2, ChevronRight,
    ArrowRight, Clock, BadgeCheck, DollarSign,
} from "lucide-react";
import { sql } from "@/lib/db";
import { BusinessLogo } from "@/components/BusinessLogo";
import { generateFallbackDescription } from "@/lib/business-utils";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

const BASE_URL = "https://traderefer.au";

export const metadata: Metadata = {
    title: "Bathroom Renovations Perth | Trusted Renovators | TradeRefer",
    description:
        "Looking for bathroom renovations in Perth? TradeRefer connects you with trusted local renovators. Post your job free and get quotes fast.",
    alternates: { canonical: `${BASE_URL}/local/bathroom-renovations-perth` },
    openGraph: {
        title: "Bathroom Renovations Perth | Trusted Renovators | TradeRefer",
        description:
            "Looking for bathroom renovations in Perth? TradeRefer connects you with trusted local renovators. Post your job free and get quotes fast.",
        url: `${BASE_URL}/local/bathroom-renovations-perth`,
        type: "website",
    },
};

const FAQS = [
    {
        q: "How much do bathroom renovations cost in Perth?",
        a: "Bathroom renovation costs in Perth vary widely depending on the scope of work. A basic refresh (retiling, vanity swap, fixtures) typically runs $8,000–$15,000, while a full mid-range renovation averages $15,000–$30,000. Premium or large bathrooms can exceed $40,000. Getting multiple quotes through TradeRefer is the easiest way to understand what your specific job will cost.",
    },
    {
        q: "How do I find a reliable bathroom renovator in Perth?",
        a: "The best bathroom renovators in Perth are licenced builders or registered tradespeople with strong local reviews. TradeRefer profiles include licence details, insurance status, and verified customer feedback, making it straightforward to compare and shortlist quality renovators before committing.",
    },
    {
        q: "How long do bathroom renovations take in Perth?",
        a: "Most standard bathroom renovations in Perth take between two and four weeks from demolition to completion, depending on the scope, material lead times, and tradie availability. Larger or fully custom projects can run six to eight weeks. Your renovator will provide a timeline as part of their quote.",
    },
    {
        q: "Do I need council approval for a bathroom renovation in Perth?",
        a: "Most standard bathroom renovations in Perth (like-for-like fixture replacements, retiling, or vanity upgrades) don't require council approval. However, if you're moving walls, changing the room's footprint, or altering plumbing drainage points, you may need a building permit. Your licensed renovator will advise on this during the quoting process.",
    },
    {
        q: "What suburbs around Perth do bathroom renovators service?",
        a: "Most Perth bathroom renovators service the full metro area including the CBD, Fremantle, Subiaco, Cottesloe, Scarborough, Joondalup, Mandurah, Armadale, Midland, and surrounding suburbs. When posting your job on TradeRefer, include your suburb and you'll be matched with tradies who work in your area.",
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

async function getPerthBathroomBusinesses(): Promise<Business[]> {
    try {
        const result = await sql<Business[]>`
            SELECT id, slug, business_name, suburb, city, state,
                   avg_rating, total_reviews, logo_url, description, trade_category
            FROM businesses
            WHERE status = 'active'
              AND (
                  trade_category ILIKE '%bathroom%'
                  OR trade_category ILIKE '%renovation%'
                  OR trade_category ILIKE '%tiling%'
              )
              AND (
                  city ILIKE '%perth%'
                  OR suburb ILIKE '%perth%'
                  OR suburb ILIKE '%fremantle%'
                  OR suburb ILIKE '%subiaco%'
                  OR suburb ILIKE '%joondalup%'
                  OR suburb ILIKE '%cottesloe%'
                  OR suburb ILIKE '%scarborough%'
                  OR suburb ILIKE '%midland%'
                  OR suburb ILIKE '%armadale%'
                  OR state ILIKE '%WA%'
              )
            ORDER BY
                CASE WHEN avg_rating IS NOT NULL AND total_reviews::int > 0 THEN 0 ELSE 1 END,
                (COALESCE(avg_rating::numeric, 0) * LOG(COALESCE(total_reviews::numeric, 1) + 1)) DESC
            LIMIT 12
        `;
        return result;
    } catch {
        return [];
    }
}

async function getPerthBathroomCount(): Promise<number> {
    try {
        const result = await sql`
            SELECT COUNT(*) as count
            FROM businesses
            WHERE status = 'active'
              AND (
                  trade_category ILIKE '%bathroom%'
                  OR trade_category ILIKE '%renovation%'
              )
              AND (
                  city ILIKE '%perth%'
                  OR state = 'WA'
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
        { "@type": "ListItem", position: 3, name: "Western Australia", item: `${BASE_URL}/local/wa` },
        {
            "@type": "ListItem",
            position: 4,
            name: "Bathroom Renovations Perth",
            item: `${BASE_URL}/local/bathroom-renovations-perth`,
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
    name: "Bathroom Renovations Perth",
    serviceType: "Bathroom Renovation",
    provider: { "@type": "Organization", name: "TradeRefer", url: BASE_URL },
    areaServed: {
        "@type": "City",
        name: "Perth",
        containedInPlace: {
            "@type": "State",
            name: "Western Australia",
            containedInPlace: { "@type": "Country", name: "Australia" },
        },
    },
    description: "Find trusted bathroom renovation contractors in Perth. Compare quotes, read real reviews, post your job free on TradeRefer.",
    offers: {
        "@type": "AggregateOffer",
        priceCurrency: "AUD",
        lowPrice: "8000",
        highPrice: "40000",
        offerCount: "5+",
    },
};

export default async function BathroomRenovationsPerthPage() {
    const [businesses, count] = await Promise.all([
        getPerthBathroomBusinesses(),
        getPerthBathroomCount(),
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
                        <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
                            <Link href="/" className="hover:text-[#FF6600] transition-colors">Home</Link>
                            <ChevronRight className="w-3.5 h-3.5" />
                            <Link href="/local/wa" className="hover:text-[#FF6600] transition-colors">Western Australia</Link>
                            <ChevronRight className="w-3.5 h-3.5" />
                            <span className="text-gray-400">Bathroom Renovations Perth</span>
                        </nav>

                        <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-4 py-1.5 text-sm text-orange-400 font-semibold mb-5">
                            <MapPin className="w-4 h-4" /> Perth, Western Australia
                        </div>

                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-5 leading-[1.1] tracking-tight font-display">
                            Bathroom Renovations in{" "}
                            <span className="text-[#FF6600]">Perth</span>
                            <br />Find Trusted Local Renovators
                        </h1>
                        <p className="text-xl text-gray-300 mb-8 max-w-2xl leading-relaxed">
                            Perth homeowners are upgrading their bathrooms faster than ever. TradeRefer makes it easy to find
                            experienced bathroom renovators in Perth who are local, vetted, and ready to quote.
                            Post your job for free and hear back from qualified tradespeople in your area.
                        </p>

                        <div className="flex flex-wrap gap-6 mb-10">
                            {count > 0 && (
                                <div className="flex items-center gap-2 text-gray-300">
                                    <ShieldCheck className="w-5 h-5 text-[#FF6600]" />
                                    <span className="font-semibold">{count}+ renovators in Perth</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-gray-300">
                                <DollarSign className="w-5 h-5 text-[#FF6600]" />
                                <span className="font-semibold">$8,000–$40,000+ typical range</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                                <Clock className="w-5 h-5 text-[#FF6600]" />
                                <span className="font-semibold">2–4 weeks typical timeline</span>
                            </div>
                        </div>

                        <Link
                            href="/businesses?category=Bathroom+Renovation&location=Perth"
                            className="inline-flex items-center gap-2 bg-[#FF6600] hover:bg-[#E65C00] text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg transition-all active:scale-95"
                        >
                            Find Perth Bathroom Renovators <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </section>

                {/* ── WHY TRADEREFER ── */}
                <section className="py-14 bg-white border-b border-gray-100">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-2xl font-extrabold mb-8 text-[#1A1A1A] font-display">Why Use TradeRefer for Bathroom Renovations in Perth?</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-[#FCFCFC] border border-gray-100 rounded-2xl p-6">
                                <BadgeCheck className="w-8 h-8 text-[#FF6600] mb-3" />
                                <h3 className="font-bold text-lg mb-2">Local Perth Renovators Only</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">Every tradie on TradeRefer operates in your area — no call centres, no interstate contractors, just Perth-based professionals who know local building codes and supplier networks.</p>
                            </div>
                            <div className="bg-[#FCFCFC] border border-gray-100 rounded-2xl p-6">
                                <Star className="w-8 h-8 text-[#FF6600] mb-3" />
                                <h3 className="font-bold text-lg mb-2">Vetted and Reviewed</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">TradeRefer surfaces real reviews from Perth homeowners and verifies tradie details, so you can hire with confidence rather than hope.</p>
                            </div>
                            <div className="bg-[#FCFCFC] border border-gray-100 rounded-2xl p-6">
                                <DollarSign className="w-8 h-8 text-[#FF6600] mb-3" />
                                <h3 className="font-bold text-lg mb-2">Free to Post, No Hidden Fees</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">Homeowners pay nothing to list a job. You describe what you need, receive quotes, and choose the renovator that fits your budget — with zero platform charges.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── LOCAL BUSINESSES ── */}
                {businesses.length > 0 && (
                    <section className="py-14 bg-[#FCFCFC] border-b border-gray-100">
                        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                            <h2 className="text-2xl font-extrabold mb-2 text-[#1A1A1A] font-display">Bathroom Renovators in Perth</h2>
                            <p className="text-gray-500 mb-8">Verified contractors serving greater Perth and surrounds</p>
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
                                <Link href="/businesses?category=Bathroom+Renovation&location=Perth" className="inline-flex items-center gap-2 border-2 border-[#FF6600] text-[#FF6600] hover:bg-[#FF6600] hover:text-white font-bold px-7 py-3 rounded-xl transition-all">
                                    View all Perth bathroom renovators <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </section>
                )}

                {/* ── HOW IT WORKS ── */}
                <section className="py-14 bg-white border-b border-gray-100">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-2xl font-extrabold mb-10 text-[#1A1A1A] font-display text-center">How to Find a Bathroom Renovator in Perth</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-full bg-orange-100 text-[#FF6600] font-extrabold text-xl flex items-center justify-center mx-auto mb-4">1</div>
                                <h3 className="font-bold text-lg mb-2">Describe your renovation</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">Tell us what you need: a full bathroom makeover, a new shower or vanity, retiling, or a complete ensuite fit-out. The more detail you add, the better the quotes you&apos;ll receive.</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-full bg-orange-100 text-[#FF6600] font-extrabold text-xl flex items-center justify-center mx-auto mb-4">2</div>
                                <h3 className="font-bold text-lg mb-2">Receive quotes from Perth renovators</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">Qualified bathroom renovators in Perth review your job and send through their quotes. You&apos;ll typically hear back within 24 hours, often sooner.</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-full bg-orange-100 text-[#FF6600] font-extrabold text-xl flex items-center justify-center mx-auto mb-4">3</div>
                                <h3 className="font-bold text-lg mb-2">Choose and get started</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">Compare quotes, check reviews, and pick the renovator you trust. There&apos;s no obligation to accept any quote — the choice is always yours.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── CONTENT ── */}
                <section className="py-14 bg-[#FCFCFC] border-b border-gray-100">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-2xl font-extrabold mb-5 text-[#1A1A1A] font-display">Bathroom Renovations in Perth — Key Information</h2>
                        <div className="prose prose-gray max-w-none text-gray-600 leading-relaxed space-y-4">
                            <p>
                                Perth homeowners are investing more in bathroom renovations than ever before, driven by rising property values and a growing appetite for modern, functional spaces.
                                Whether you&apos;re updating a tired family bathroom, adding an ensuite to the master bedroom, or undertaking a full wet-area transformation, Perth has a deep pool of experienced renovation contractors.
                            </p>
                            <p>
                                The key to a successful bathroom renovation in Perth is finding a licensed builder or registered contractor who understands local supplier lead times, tile availability, and the Western Australian building code.
                                All structural bathroom work in WA must comply with the National Construction Code and relevant Australian Standards — your renovator will handle permits and compliance as part of their service.
                            </p>
                            <p>
                                Costs vary significantly across Perth depending on the scope of work, the quality of fixtures chosen, and the suburb. Inner suburbs like Subiaco, Cottesloe, and Claremont typically see higher labour rates than outer metropolitan areas.
                                Getting three written quotes through TradeRefer is the most reliable way to understand true market pricing for your specific job.
                            </p>
                        </div>
                        <div className="mt-6 flex flex-wrap gap-2">
                            {["Perth CBD", "Fremantle", "Subiaco", "Cottesloe", "Scarborough", "Joondalup", "Midland", "Armadale", "Mandurah", "Belmont"].map((suburb) => (
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
                        <h2 className="text-2xl font-extrabold mb-8 text-[#1A1A1A] font-display">Bathroom Renovations Perth: Frequently Asked Questions</h2>
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
                        <h2 className="text-lg font-extrabold mb-6 text-[#1A1A1A] font-display">Related Trades in Perth</h2>
                        <div className="flex flex-wrap gap-3">
                            {[
                                { label: "Plumbers in Perth", href: "/businesses?category=Plumbing&location=Perth" },
                                { label: "Tiling in Perth", href: "/businesses?category=Tiling&location=Perth" },
                                { label: "Find a Plumber Near Me", href: "/trades/plumbers" },
                                { label: "All trades in Western Australia", href: "/local/wa" },
                                { label: "Waterproofing", href: "/trades/waterproofing" },
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
                        <CheckCircle2 className="w-12 h-12 text-[#FF6600] mx-auto mb-5" />
                        <h2 className="text-3xl font-extrabold mb-4 font-display">Ready to Renovate Your Bathroom in Perth?</h2>
                        <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                            Post your job on TradeRefer and get free quotes from trusted Perth bathroom renovators — no obligation, no signup required.
                        </p>
                        <Link
                            href="/businesses?category=Bathroom+Renovation&location=Perth"
                            className="inline-flex items-center gap-2 bg-[#FF6600] hover:bg-[#E65C00] text-white font-bold text-lg px-10 py-4 rounded-xl shadow-xl transition-all active:scale-95"
                        >
                            Get free quotes — Perth bathroom renovations <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </section>

            </main>
        </>
    );
}
