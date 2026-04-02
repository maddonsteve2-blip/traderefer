import { Metadata } from "next";
import Link from "next/link";
import {
    ArrowRight,
    BadgeCheck,
    ChevronRight,
    Clock3,
    DollarSign,
    FileText,
    Home,
    MapPin,
    ShieldCheck,
    Star,
    Wrench,
} from "lucide-react";
import { sql } from "@/lib/db";
import { JOB_TYPES, STATE_LICENSING, TRADE_COST_GUIDE, TRADE_FAQ_BANK, jobToSlug } from "@/lib/constants";
import { PublicMultiQuoteForm } from "@/components/PublicMultiQuoteForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Rendering Services Australia | Find Verified Renderers | TradeRefer",
    description:
        "Find trusted renderers across Australia. Compare cement and acrylic rendering costs per m² by city, understand curing requirements, and hire verified local rendering businesses through TradeRefer.",
    alternates: { canonical: "https://traderefer.au/trades/rendering" },
    openGraph: {
        title: "Rendering Services Australia | TradeRefer",
        description:
            "Compare rendering costs per m², cement vs acrylic render, curing requirements, and verified local renderers across Australia.",
        url: "https://traderefer.au/trades/rendering",
        type: "website",
    },
};

const TRADE_NAME = "Rendering";
const cost = TRADE_COST_GUIDE[TRADE_NAME];
const faqs = TRADE_FAQ_BANK[TRADE_NAME].slice(0, 6);
const services = JOB_TYPES[TRADE_NAME].slice(0, 12);
const relatedTrades = [
    { label: "Painting", href: "/trades/painting" },
    { label: "Plastering", href: "/categories#plastering" },
    { label: "Building", href: "/categories#building" },
    { label: "Tiling", href: "/trades/tiling" },
    { label: "Roofing", href: "/trades/roofing" },
    { label: "Concreting", href: "/trades/concreting" },
];

const cityPricing = [
    { city: "Sydney", state: "NSW", cement: "$35–$65/m²", acrylic: "$50–$90/m²", texture: "$30–$55/m²", fullHouse: "$10,000–$22,000" },
    { city: "Melbourne", state: "VIC", cement: "$30–$60/m²", acrylic: "$45–$85/m²", texture: "$28–$50/m²", fullHouse: "$9,000–$20,000" },
    { city: "Brisbane", state: "QLD", cement: "$30–$58/m²", acrylic: "$42–$80/m²", texture: "$25–$48/m²", fullHouse: "$8,500–$18,000" },
    { city: "Perth", state: "WA", cement: "$32–$62/m²", acrylic: "$46–$85/m²", texture: "$28–$52/m²", fullHouse: "$9,000–$20,000" },
    { city: "Adelaide", state: "SA", cement: "$28–$55/m²", acrylic: "$40–$78/m²", texture: "$25–$46/m²", fullHouse: "$8,000–$17,000" },
    { city: "Canberra", state: "ACT", cement: "$35–$65/m²", acrylic: "$50–$90/m²", texture: "$30–$55/m²", fullHouse: "$10,000–$22,000" },
    { city: "Hobart", state: "TAS", cement: "$32–$62/m²", acrylic: "$46–$85/m²", texture: "$28–$52/m²", fullHouse: "$9,000–$19,000" },
    { city: "Darwin", state: "NT", cement: "$40–$75/m²", acrylic: "$55–$100/m²", texture: "$35–$60/m²", fullHouse: "$11,000–$25,000" },
];

const commonJobCosts = [
    ["Cement render – single storey (per m²)", "$30–$65/m²"],
    ["Acrylic render system – per m²", "$45–$90/m²"],
    ["Texture coat / spray texture (per m²)", "$25–$55/m²"],
    ["Full house render – brick (200m² wall)", "$8,000–$18,000"],
    ["Boundary wall rendering (per m²)", "$35–$70/m²"],
    ["Patch render repair (per m²)", "$60–$150/m²"],
    ["Render removal (per m²)", "$15–$35/m²"],
    ["Scaffold hire (2-storey, 4 weeks)", "$2,500–$5,000"],
    ["Render + paint (combined, per m²)", "$65–$130/m²"],
    ["Polished plaster / venetian (per m²)", "$80–$180/m²"],
];

const hiringTips = [
    {
        title: "Specify the render system in writing",
        body: "Cement render and acrylic render systems require different surface preparation, curing times, and finishing approaches. Insist on the product brand, coat thicknesses, and number of coats specified in your written quote — not just 'acrylic render' or 'cement render'.",
        icon: BadgeCheck,
    },
    {
        title: "Understand the 28-day curing rule",
        body: "Cement render must cure for at least 28 days before painting. Painting too early traps moisture and causes catastrophic paint failure within months. If a renderer says they can paint in a week, walk away. Acrylic render systems are integral colour and typically don't need painting.",
        icon: FileText,
    },
    {
        title: "Check scaffold compliance",
        body: "For any work above 2m, Australian law requires compliant scaffolding. Scaffold must comply with AS/NZS 4576. Ask if scaffold is included in the quote — for 2-storey homes this adds $2,500–$5,000. Renderers working from ladders without edge protection on upper levels are non-compliant.",
        icon: ShieldCheck,
    },
    {
        title: "Assess surface preparation before signing",
        body: "Render bonding failures almost always trace back to poor surface preparation: dirty substrate, incompatible existing paint, insufficient mechanical key on smooth surfaces, or skipping a bonding agent. Ask specifically how the existing surface will be prepared before render is applied.",
        icon: Star,
    },
];

const whyTradeRefer = [
    {
        title: "Verified rendering businesses",
        body: "TradeRefer helps homeowners find ABN-verified rendering contractors — important for exterior work where poor surface preparation and missed curing steps lead to expensive failures within 1–2 years.",
    },
    {
        title: "Compare costs before you call",
        body: "Use this hub to understand typical rendering rates per square metre across Australian cities so you can immediately identify underspecified or overpriced quotes before signing anything.",
    },
    {
        title: "Australia-wide local discovery",
        body: "Navigate from this national rendering guide into city and suburb-level pages to find verified renderers in the specific area where your property is located.",
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

type StateCountRow = { state: string; count: string | number };
type CityCountRow = { city: string; state: string; count: string | number };

async function getBusinessCountByState(tradeName: string): Promise<Record<string, number>> {
    try {
        const results = await sql<StateCountRow[]>`
            SELECT state, COUNT(*) as count FROM businesses
            WHERE status = 'active' AND trade_category ILIKE ${"%" + tradeName + "%"} AND state IS NOT NULL
            GROUP BY state ORDER BY count DESC
        `;
        const map: Record<string, number> = {};
        results.forEach((row) => { map[row.state] = parseInt(String(row.count), 10); });
        return map;
    } catch { return {}; }
}

async function getFeaturedCityCounts(tradeName: string): Promise<Record<string, number>> {
    try {
        const results = await sql<CityCountRow[]>`
            SELECT city, state, COUNT(*) as count FROM businesses
            WHERE status = 'active' AND trade_category ILIKE ${"%" + tradeName + "%"} AND city IS NOT NULL AND city != ''
            GROUP BY city, state
        `;
        const map: Record<string, number> = {};
        results.forEach((row) => {
            const key = `${String(row.city).toLowerCase()}::${String(row.state).toUpperCase()}`;
            map[key] = parseInt(String(row.count), 10);
        });
        return map;
    } catch { return {}; }
}

export default async function RenderingTradeHubPage() {
    const [countsByState, cityCounts] = await Promise.all([
        getBusinessCountByState(TRADE_NAME),
        getFeaturedCityCounts(TRADE_NAME),
    ]);

    const totalBusinesses = Object.values(countsByState).reduce((sum, count) => sum + count, 0);
    const statesCovered = Object.keys(countsByState).length;

    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://traderefer.au" },
            { "@type": "ListItem", position: 2, name: "Trade Guides", item: "https://traderefer.au/categories" },
            { "@type": "ListItem", position: 3, name: "Rendering Services Australia", item: "https://traderefer.au/trades/rendering" },
        ],
    };

    const serviceJsonLd = {
        "@context": "https://schema.org",
        "@type": "Service",
        name: "Rendering Services Australia",
        serviceType: "Rendering",
        areaServed: { "@type": "Country", name: "Australia" },
        provider: { "@type": "Organization", name: "TradeRefer", url: "https://traderefer.au" },
        offers: {
            "@type": "AggregateOffer",
            lowPrice: cost.low.toString(),
            highPrice: cost.high.toString(),
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

    return (
        <main className="min-h-screen bg-zinc-50">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            <div className="bg-[#1A1A1A] pt-32 pb-20 text-white">
                <div className="container mx-auto px-4">
                    <nav className="flex flex-wrap items-center gap-2 font-bold text-zinc-400 uppercase tracking-widest mb-8" style={{ fontSize: "16px" }}>
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <ChevronRight className="w-4 h-4" />
                        <Link href="/categories" className="hover:text-white transition-colors">Trade Guides</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-[#FF6600]">Rendering</span>
                    </nav>

                    <div className="max-w-4xl">
                        <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-2 font-black text-orange-400 uppercase tracking-widest mb-6" style={{ fontSize: "16px" }}>
                            <Home className="w-4 h-4" />
                            Australia-Wide Trade Hub
                        </div>
                        <h1 className="font-black mb-6 leading-[1.05] font-display text-white" style={{ fontSize: "clamp(48px, 8vw, 80px)" }}>
                            Find Verified <span className="text-[#FF6600]">Renderers</span> Across Australia
                        </h1>
                        <p className="text-zinc-400 max-w-3xl mb-8" style={{ fontSize: "20px", lineHeight: 1.7 }}>
                            Use this TradeRefer rendering hub to compare cement and acrylic rendering costs per square metre, understand curing and painting timelines,
                            and connect with verified local renderers across Australia.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link
                                href="/quotes?trade=Rendering&source=%2Ftrades%2Frendering"
                                className="bg-[#FF6600] hover:bg-[#E65C00] text-white font-black px-8 rounded-xl transition-colors inline-flex items-center justify-center gap-2"
                                style={{ minHeight: "64px", fontSize: "18px" }}
                            >
                                Get 3 Free Quotes
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                href="/businesses?category=Rendering"
                                className="bg-white/10 hover:bg-white/20 text-white font-black px-8 rounded-xl transition-colors border border-white/10 inline-flex items-center justify-center"
                                style={{ minHeight: "64px", fontSize: "18px" }}
                            >
                                Browse Renderers
                            </Link>
                            <Link
                                href="/local"
                                className="bg-white/10 hover:bg-white/20 text-white font-black px-8 rounded-xl transition-colors border border-white/10 inline-flex items-center justify-center"
                                style={{ minHeight: "64px", fontSize: "18px" }}
                            >
                                Browse by Location
                            </Link>
                        </div>

                        <div className="flex flex-wrap gap-6 text-white font-bold mt-8" style={{ fontSize: "16px" }}>
                            <span className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-[#FF6600]" />From ${cost.low}–${cost.high}{cost.unit}</span>
                            {totalBusinesses > 0 && (
                                <span className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-[#FF6600]" />{totalBusinesses.toLocaleString()} rendering businesses listed</span>
                            )}
                            {statesCovered > 0 && (
                                <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#FF6600]" />Available in {statesCovered} states & territories</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16">
                <div className="max-w-6xl mx-auto space-y-16">
                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}>
                            <DollarSign className="w-6 h-6 text-[#FF6600]" />
                            Rendering Cost Guide Australia
                        </h2>
                        <p className="text-zinc-500 mb-8" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                            Rendering costs depend on wall area, render system, surface preparation required, and access (single vs double storey). Use these benchmarks before requesting quotes.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                                <p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Cement Render</p>
                                <p className="text-3xl font-black text-zinc-900">${cost.low}–${cost.high}</p>
                                <p className="text-zinc-500" style={{ fontSize: "16px" }}>{cost.unit} (labour + materials)</p>
                            </div>
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                                <p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Full House Render</p>
                                <p className="text-3xl font-black text-zinc-900">$8k–$22k</p>
                                <p className="text-zinc-500" style={{ fontSize: "16px" }}>200m² single/double storey</p>
                            </div>
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                                <p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Curing Time</p>
                                <p className="text-3xl font-black text-zinc-900">28 days</p>
                                <p className="text-zinc-500" style={{ fontSize: "16px" }}>before painting cement render</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                            <table className="min-w-full text-left">
                                <thead className="bg-zinc-100 text-zinc-700">
                                    <tr>
                                        <th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>City</th>
                                        <th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Cement Render</th>
                                        <th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Acrylic Render</th>
                                        <th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Texture Coat</th>
                                        <th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Full House</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cityPricing.map((row) => (
                                        <tr key={`${row.city}-${row.state}`} className="border-t border-zinc-200 bg-white">
                                            <td className="px-4 py-3 font-bold text-zinc-900" style={{ fontSize: "16px" }}>{row.city}</td>
                                            <td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.cement}</td>
                                            <td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.acrylic}</td>
                                            <td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.texture}</td>
                                            <td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.fullHouse}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-8">
                            <h3 className="font-black text-zinc-900 mb-4 font-display" style={{ fontSize: "24px" }}>Common Rendering Job Costs</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {commonJobCosts.map(([label, value]) => (
                                    <div key={label} className="flex items-center justify-between bg-zinc-50 rounded-2xl border border-zinc-100 px-5 py-4 gap-4">
                                        <span className="font-bold text-zinc-700" style={{ fontSize: "16px" }}>{label}</span>
                                        <span className="font-black text-zinc-900 whitespace-nowrap" style={{ fontSize: "16px" }}>{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8">
                        <div className="bg-white rounded-3xl border border-zinc-200 p-8">
                            <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}>
                                <Wrench className="w-6 h-6 text-[#FF6600]" />
                                Rendering Services We Cover
                            </h2>
                            <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                                TradeRefer&apos;s rendering hub covers cement render, acrylic render, texture coat, Venetian plaster, and patch rendering across residential and commercial properties.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {services.map((service) => (
                                    <Link
                                        key={service}
                                        href={`/trades/${jobToSlug(service)}`}
                                        className="flex items-center justify-between px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl font-bold text-zinc-700 hover:bg-orange-50 hover:border-[#FF6600] hover:text-[#FF6600] transition-colors capitalize"
                                        style={{ fontSize: "16px" }}
                                    >
                                        <span>{service}</span>
                                        <ArrowRight className="w-4 h-4 text-zinc-300" />
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl border border-zinc-200 p-8">
                            <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "28px" }}>
                                <Clock3 className="w-5 h-5 text-blue-500" />
                                Before You Hire a Renderer
                            </h2>
                            <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                                Use these checks to avoid bonding failures, missed curing requirements, and non-compliant scaffold.
                            </p>
                            <div className="space-y-4">
                                {hiringTips.map(({ title, body, icon: Icon }) => (
                                    <div key={title} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-5">
                                        <div className="flex items-start gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center shrink-0">
                                                <Icon className="w-5 h-5 text-[#FF6600]" />
                                            </div>
                                            <h3 className="font-black text-zinc-900" style={{ fontSize: "18px" }}>{title}</h3>
                                        </div>
                                        <p className="text-zinc-600" style={{ fontSize: "16px", lineHeight: 1.7 }}>{body}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}>
                            <MapPin className="w-6 h-6 text-[#FF6600]" />
                            Find Renderers by City
                        </h2>
                        <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                            Browse the major Australian cities where TradeRefer has rendering businesses listed, then drill into suburb-level pages from there.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {featuredCities.map(({ city, state, stateSlug, citySlug }) => {
                                const count = cityCounts[`${city.toLowerCase()}::${state}`] || 0;
                                return (
                                    <Link
                                        key={`${city}-${state}`}
                                        href={`/local/${stateSlug}/${citySlug}?category=${encodeURIComponent(TRADE_NAME)}`}
                                        className="flex items-center justify-between px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl hover:bg-orange-50 hover:border-[#FF6600] transition-colors group"
                                    >
                                        <div>
                                            <span className="font-black text-zinc-900 group-hover:text-[#FF6600]" style={{ fontSize: "16px" }}>{city}</span>
                                            <p className="text-zinc-400" style={{ fontSize: "16px" }}>{state} · {count > 0 ? `${count} listed` : "Browse local directory"}</p>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-zinc-300 group-hover:text-[#FF6600]" />
                                    </Link>
                                );
                            })}
                        </div>
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <div className="max-w-3xl mb-8">
                            <h2 className="font-black text-[#1A1A1A] mb-3 font-display" style={{ fontSize: "32px" }}>Get 3 Free Rendering Quotes</h2>
                            <p className="text-zinc-500" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                                Request your rendering quotes here and we&apos;ll match your project with up to 3 verified local rendering businesses.
                            </p>
                        </div>
                        <PublicMultiQuoteForm initialTradeCategory="Rendering" initialSourcePage="/trades/rendering" />
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}>
                            <FileText className="w-6 h-6 text-blue-500" />
                            Rendering Licensing Requirements by State
                        </h2>
                        <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                            Rendering is largely unlicensed across Australia, but scaffold compliance and public liability insurance are essential for any work above 2 metres.
                        </p>
                        <div className="space-y-3">
                            {Object.entries(STATE_LICENSING[TRADE_NAME]).map(([stateCode, text]) => (
                                <div key={stateCode} className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                                    <p className="font-black text-blue-600 uppercase tracking-wider mb-2" style={{ fontSize: "14px" }}>{stateCode}</p>
                                    <p className="text-zinc-700" style={{ fontSize: "16px", lineHeight: 1.7 }}>{text}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {whyTradeRefer.map((item) => (
                            <div key={item.title} className="bg-white rounded-3xl border border-zinc-200 p-8">
                                <h2 className="font-black text-[#1A1A1A] mb-3 font-display" style={{ fontSize: "24px" }}>{item.title}</h2>
                                <p className="text-zinc-600" style={{ fontSize: "16px", lineHeight: 1.7 }}>{item.body}</p>
                            </div>
                        ))}
                    </section>

                    <section>
                        <h2 className="font-black text-[#1A1A1A] mb-8 font-display" style={{ fontSize: "32px" }}>
                            Rendering: Frequently Asked Questions
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

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "28px" }}>
                            <Wrench className="w-5 h-5 text-[#FF6600]" />
                            Related Trade Guides
                        </h2>
                        <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                            Explore adjacent trade categories that homeowners frequently research alongside rendering projects.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {relatedTrades.map((trade) => (
                                <Link
                                    key={trade.href}
                                    href={trade.href}
                                    className="flex items-center justify-between px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl font-bold text-zinc-700 hover:bg-orange-50 hover:border-[#FF6600] hover:text-[#FF6600] transition-colors"
                                    style={{ fontSize: "16px" }}
                                >
                                    <span>{trade.label}</span>
                                    <ArrowRight className="w-4 h-4 text-zinc-300" />
                                </Link>
                            ))}
                        </div>
                    </section>

                    <section className="bg-[#1A1A1A] rounded-3xl p-8 md:p-12 text-center text-white">
                        <h2 className="font-black mb-4 text-white" style={{ fontSize: "40px" }}>Need a Renderer Near You?</h2>
                        <p className="text-zinc-400 mb-8 max-w-2xl mx-auto" style={{ fontSize: "20px", lineHeight: 1.7 }}>
                            Browse verified local rendering businesses, compare cement and acrylic systems, and find the right renderer to transform your home&apos;s exterior.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link
                                href="/quotes?trade=Rendering&source=%2Ftrades%2Frendering"
                                className="inline-flex items-center gap-2 bg-[#FF6600] hover:bg-[#E65C00] text-white font-black rounded-xl px-8 transition-colors"
                                style={{ minHeight: "64px", fontSize: "18px" }}
                            >
                                Get 3 Free Quotes <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                href="/businesses?category=Rendering"
                                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-black rounded-xl px-8 transition-colors border border-white/10"
                                style={{ minHeight: "64px", fontSize: "18px" }}
                            >
                                Browse Renderers
                            </Link>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
