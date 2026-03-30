import { Metadata } from "next";
import Link from "next/link";
import {
    MapPin, Star, ShieldCheck, CheckCircle2, ChevronRight,
    ArrowRight, Clock, AlertTriangle, BadgeCheck, DollarSign, FileText,
} from "lucide-react";
import { sql } from "@/lib/db";
import { BusinessLogo } from "@/components/BusinessLogo";
import { generateFallbackDescription } from "@/lib/business-utils";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

const BASE_URL = "https://traderefer.au";

export const metadata: Metadata = {
    title: "Asbestos Removal Bendigo — Licensed Removalists | TradeRefer",
    description:
        "Find licensed asbestos removalists in Bendigo. Compare verified contractors, get free quotes, and ensure safe, compliant asbestos removal. Post your job free on TradeRefer.",
    alternates: { canonical: `${BASE_URL}/local/asbestos-removal-bendigo` },
    openGraph: {
        title: "Asbestos Removal Bendigo — Licensed Removalists | TradeRefer",
        description:
            "Find licensed asbestos removalists in Bendigo. Safe, compliant removal with real reviews and free quotes.",
        url: `${BASE_URL}/local/asbestos-removal-bendigo`,
        type: "website",
    },
};

const FAQS = [
    {
        q: "How much does asbestos removal cost in Bendigo?",
        a: "Asbestos removal in Bendigo typically costs between $50 and $150 per square metre, depending on the type of asbestos (friable vs non-friable), location (roof, walls, under-floor), and accessibility. A standard residential job — such as removing an asbestos cement garage roof — usually costs $1,500 to $5,000 in total. Post your job on TradeRefer to get real quotes from licensed Bendigo asbestos removalists.",
    },
    {
        q: "Do I need a licensed contractor to remove asbestos in Bendigo?",
        a: "Yes. Under Victorian WorkSafe regulations, any asbestos removal over 10 square metres must be carried out by a licensed asbestos removalist. Friable asbestos (the most dangerous type — loose, crumbly fibres) must always be removed by a Class A licensed contractor regardless of the size. Non-friable (bonded) asbestos under 10m² can be handled by trained homeowners following strict procedures, but professional removal is strongly recommended.",
    },
    {
        q: "How do I know if my Bendigo home contains asbestos?",
        a: "Homes built before 1987 in Bendigo are likely to contain some asbestos-containing materials (ACMs). Common locations include eaves, wall cladding (fibro), textured ceilings (Artex), floor tiles, and roof sheeting. The only way to confirm asbestos is laboratory testing of a sample — do not disturb suspected material yourself. A licensed asbestos assessor can inspect and test your property before any removal work begins.",
    },
    {
        q: "What happens to asbestos after it's removed in Bendigo?",
        a: "Removed asbestos waste must be double-bagged in heavy-duty plastic, labelled with asbestos warning signs, and disposed of at a licensed facility. In Bendigo, the Eaglehawk landfill accepts asbestos waste at designated times. Licensed removalists handle all disposal as part of the service — confirm this is included when comparing quotes.",
    },
    {
        q: "How long does asbestos removal take in Bendigo?",
        a: "Most standard residential asbestos removal jobs in Bendigo take one to two days. Larger projects like full roof sheet replacement or under-floor removal can take three to five days. Friable asbestos removal requires additional air monitoring and decontamination procedures which extend the timeline. Your contractor will provide a project timeline as part of their quote.",
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

async function getBendigoAsbestosBusinesses(): Promise<Business[]> {
    try {
        const result = await sql<Business[]>`
            SELECT id, slug, business_name, suburb, city, state,
                   avg_rating, total_reviews, logo_url, description, trade_category
            FROM businesses
            WHERE status = 'active'
              AND trade_category ILIKE '%asbestos%'
              AND (
                  city ILIKE '%bendigo%'
                  OR suburb ILIKE '%bendigo%'
                  OR suburb ILIKE '%kangaroo flat%'
                  OR suburb ILIKE '%flora hill%'
                  OR suburb ILIKE '%golden square%'
                  OR suburb ILIKE '%strathdale%'
                  OR suburb ILIKE '%eaglehawk%'
                  OR suburb ILIKE '%epsom%'
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

async function getBendigoAsbestosCount(): Promise<number> {
    try {
        const result = await sql`
            SELECT COUNT(*) as count
            FROM businesses
            WHERE status = 'active'
              AND trade_category ILIKE '%asbestos%'
              AND (
                  city ILIKE '%bendigo%'
                  OR suburb ILIKE '%bendigo%'
                  OR suburb ILIKE '%kangaroo flat%'
                  OR suburb ILIKE '%eaglehawk%'
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
            name: "Asbestos Removal Bendigo",
            item: `${BASE_URL}/local/asbestos-removal-bendigo`,
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
    name: "Asbestos Removal Bendigo",
    serviceType: "Asbestos Removal",
    provider: { "@type": "Organization", name: "TradeRefer", url: BASE_URL },
    areaServed: {
        "@type": "City",
        name: "Bendigo",
        containedInPlace: { "@type": "State", name: "Victoria", containedInPlace: { "@type": "Country", name: "Australia" } },
    },
    description: "Find licensed asbestos removalists in Bendigo and Greater Bendigo. Compare quotes, read real reviews, post your job free.",
    offers: {
        "@type": "AggregateOffer",
        priceCurrency: "AUD",
        lowPrice: "1500",
        highPrice: "8000",
        offerCount: "5+",
    },
};

export default async function AsbestosRemovalBendigoPage() {
    const [businesses, count] = await Promise.all([
        getBendigoAsbestosBusinesses(),
        getBendigoAsbestosCount(),
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
                            <Link href="/local/vic" className="hover:text-[#FF6600] transition-colors">Victoria</Link>
                            <ChevronRight className="w-3.5 h-3.5" />
                            <span className="text-gray-400">Asbestos Removal Bendigo</span>
                        </nav>

                        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-1.5 text-sm text-amber-400 font-semibold mb-5">
                            <AlertTriangle className="w-4 h-4" /> Licensed contractors only — Victorian WorkSafe compliant
                        </div>

                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-5 leading-[1.1] tracking-tight font-display">
                            Asbestos Removal in{" "}
                            <span className="text-[#FF6600]">Bendigo</span>
                            <br />Licensed, Safe &amp; Compliant
                        </h1>
                        <p className="text-xl text-gray-300 mb-8 max-w-2xl leading-relaxed">
                            Find WorkSafe-licensed asbestos removalists in Bendigo. Compare verified contractors with real reviews, get free quotes, and ensure compliant disposal — all in one place.
                        </p>

                        <div className="flex flex-wrap gap-6 mb-10">
                            {count > 0 && (
                                <div className="flex items-center gap-2 text-gray-300">
                                    <ShieldCheck className="w-5 h-5 text-[#FF6600]" />
                                    <span className="font-semibold">{count}+ licensed removalists in Bendigo</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-gray-300">
                                <DollarSign className="w-5 h-5 text-[#FF6600]" />
                                <span className="font-semibold">$50–$150/m² typical cost</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                                <FileText className="w-5 h-5 text-[#FF6600]" />
                                <span className="font-semibold">Full disposal included</span>
                            </div>
                        </div>

                        <Link
                            href="/businesses?category=Asbestos+Removal&location=Bendigo"
                            className="inline-flex items-center gap-2 bg-[#FF6600] hover:bg-[#E65C00] text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg transition-all active:scale-95"
                        >
                            Find Bendigo Asbestos Removalists <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </section>

                {/* ── SAFETY WARNING ── */}
                <section className="py-6 bg-amber-50 border-b border-amber-200">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-sm text-amber-800 leading-relaxed">
                                <strong>Safety notice:</strong> Never disturb suspected asbestos-containing materials yourself. Asbestos fibres are invisible and odourless — inhalation causes mesothelioma and lung cancer. Always engage a WorkSafe-licensed contractor for inspection and removal.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ── WHY TRADEREFER ── */}
                <section className="py-14 bg-white border-b border-gray-100">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-2xl font-extrabold mb-8 text-[#1A1A1A] font-display">Why Use TradeRefer for Asbestos Removal in Bendigo?</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-[#FCFCFC] border border-gray-100 rounded-2xl p-6">
                                <BadgeCheck className="w-8 h-8 text-[#FF6600] mb-3" />
                                <h3 className="font-bold text-lg mb-2">Verified Licensed Contractors</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">Every asbestos removalist on TradeRefer must hold a valid WorkSafe Victoria licence — Class A or Class B depending on the material type.</p>
                            </div>
                            <div className="bg-[#FCFCFC] border border-gray-100 rounded-2xl p-6">
                                <Star className="w-8 h-8 text-[#FF6600] mb-3" />
                                <h3 className="font-bold text-lg mb-2">Real Bendigo Reviews</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">Read reviews from Bendigo homeowners who&apos;ve used the service — not paid testimonials. Know who you&apos;re hiring before they set foot on your property.</p>
                            </div>
                            <div className="bg-[#FCFCFC] border border-gray-100 rounded-2xl p-6">
                                <Clock className="w-8 h-8 text-[#FF6600] mb-3" />
                                <h3 className="font-bold text-lg mb-2">Free Quotes, Fast Response</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">Post your job once and receive quotes from multiple licensed contractors. Compare pricing, timelines, and disposal arrangements before committing.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── LOCAL BUSINESSES ── */}
                {businesses.length > 0 && (
                    <section className="py-14 bg-[#FCFCFC] border-b border-gray-100">
                        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                            <h2 className="text-2xl font-extrabold mb-2 text-[#1A1A1A] font-display">Licensed Asbestos Removalists in Bendigo</h2>
                            <p className="text-gray-500 mb-8">Verified contractors serving Greater Bendigo and surrounds</p>
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
                                <Link href="/businesses?category=Asbestos+Removal&location=Bendigo" className="inline-flex items-center gap-2 border-2 border-[#FF6600] text-[#FF6600] hover:bg-[#FF6600] hover:text-white font-bold px-7 py-3 rounded-xl transition-all">
                                    View all Bendigo asbestos removalists <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </section>
                )}

                {/* ── HOW IT WORKS ── */}
                <section className="py-14 bg-white border-b border-gray-100">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-2xl font-extrabold mb-10 text-[#1A1A1A] font-display text-center">How to Arrange Asbestos Removal in Bendigo</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-full bg-orange-100 text-[#FF6600] font-extrabold text-xl flex items-center justify-center mx-auto mb-4">1</div>
                                <h3 className="font-bold text-lg mb-2">Post your asbestos removal job</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">Describe the location, type, and approximate area of the asbestos-containing material. Include the property address in Bendigo and any access details.</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-full bg-orange-100 text-[#FF6600] font-extrabold text-xl flex items-center justify-center mx-auto mb-4">2</div>
                                <h3 className="font-bold text-lg mb-2">Receive quotes from licensed contractors</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">Licensed Class A and Class B removalists in Bendigo and central Victoria will respond with quotes covering removal, air monitoring where required, and licensed disposal.</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-full bg-orange-100 text-[#FF6600] font-extrabold text-xl flex items-center justify-center mx-auto mb-4">3</div>
                                <h3 className="font-bold text-lg mb-2">Book and get it done safely</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">Confirm your preferred contractor, receive a clearance certificate after the job, and keep it on file — required if you sell or renovate the property in future.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── CONTENT ── */}
                <section className="py-14 bg-[#FCFCFC] border-b border-gray-100">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-2xl font-extrabold mb-5 text-[#1A1A1A] font-display">Asbestos Removal in Bendigo — Key Information</h2>
                        <div className="prose prose-gray max-w-none text-gray-600 leading-relaxed space-y-4">
                            <p>
                                Bendigo&apos;s housing stock includes a significant number of pre-1987 homes where asbestos-containing materials (ACMs) were routinely used in construction. Common materials include fibro (flat or corrugated asbestos cement sheeting), textured ceiling coatings, vinyl floor tiles, and roof sheeting — all of which must be identified and managed safely before any renovation or demolition work.
                            </p>
                            <p>
                                Under Victorian legislation, any asbestos removal job over 10 square metres requires a WorkSafe-licensed contractor. Friable asbestos — the most hazardous form, where fibres can become airborne — must always be removed by a Class A licensed removalist regardless of quantity. Non-friable (bonded) ACMs under 10m² may be removed by the homeowner following strict procedures, but professional removal is almost always the safer and more cost-effective choice when disposal costs are factored in.
                            </p>
                            <p>
                                After removal, all asbestos waste in Bendigo must be disposed of at the Eaglehawk Resource Recovery Centre, which accepts ACMs at designated times. Your licensed contractor will handle this as part of the service and provide a disposal docket and clearance certificate on completion.
                            </p>
                        </div>
                        <div className="mt-6 flex flex-wrap gap-2">
                            {["Bendigo CBD", "Kangaroo Flat", "Golden Square", "Flora Hill", "Strathdale", "Eaglehawk", "Epsom", "Huntly", "Marong"].map((suburb) => (
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
                        <h2 className="text-2xl font-extrabold mb-8 text-[#1A1A1A] font-display">Asbestos Removal Bendigo: Frequently Asked Questions</h2>
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
                        <h2 className="text-lg font-extrabold mb-6 text-[#1A1A1A] font-display">Related Trades in Bendigo</h2>
                        <div className="flex flex-wrap gap-3">
                            {[
                                { label: "Demolition in Bendigo", href: "/businesses?category=Demolition&location=Bendigo" },
                                { label: "Builders in Bendigo", href: "/businesses?category=Building+%26+Carpentry&location=Bendigo" },
                                { label: "All trades in Victoria", href: "/local/vic" },
                                { label: "Asbestos Removal Near Me", href: "/asbestos-removal-near-me" },
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
                        <h2 className="text-3xl font-extrabold mb-4 font-display">Need Licensed Asbestos Removal in Bendigo?</h2>
                        <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                            Don&apos;t risk your family&apos;s health with unlicensed work. Post your job on TradeRefer and get free quotes from WorkSafe-licensed asbestos removalists in Bendigo — no obligation, no signup required.
                        </p>
                        <Link
                            href="/businesses?category=Asbestos+Removal&location=Bendigo"
                            className="inline-flex items-center gap-2 bg-[#FF6600] hover:bg-[#E65C00] text-white font-bold text-lg px-10 py-4 rounded-xl shadow-xl transition-all active:scale-95"
                        >
                            Get free asbestos removal quotes — Bendigo <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </section>

            </main>
        </>
    );
}
