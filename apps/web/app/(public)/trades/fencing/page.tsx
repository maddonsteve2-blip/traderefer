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
    title: "Fencing Services Australia | Find Verified Fencing Contractors | TradeRefer",
    description:
        "Find trusted fencing contractors across Australia. Compare Colorbond, timber, and pool fencing costs by city, understand dividing fence laws, and hire verified fencers through TradeRefer.",
    alternates: { canonical: "https://traderefer.au/trades/fencing" },
    openGraph: {
        title: "Fencing Services Australia | TradeRefer",
        description:
            "Compare fencing costs per metre, Colorbond vs timber pricing, pool fencing requirements, and verified local fencing contractors across Australia.",
        url: "https://traderefer.au/trades/fencing",
        type: "website",
    },
};

const TRADE_NAME = "Fencing";
const cost = TRADE_COST_GUIDE[TRADE_NAME];
const faqs = TRADE_FAQ_BANK[TRADE_NAME].slice(0, 6);
const services = JOB_TYPES[TRADE_NAME].slice(0, 12);
const relatedTrades = [
    { label: "Landscaping", href: "/trades/landscaping" },
    { label: "Concreting", href: "/trades/concreting" },
    { label: "Building", href: "/categories#building" },
    { label: "Pool & Spa", href: "/categories#pool-spa" },
    { label: "Glazing & Windows", href: "/categories#glazing-windows" },
    { label: "Decking", href: "/categories#decking" },
];

const cityPricing = [
    { city: "Sydney", state: "NSW", colorbond: "$90–$130/m", timber: "$75–$110/m", pool: "$300–$650/m", retaining: "$300–$700/m" },
    { city: "Melbourne", state: "VIC", colorbond: "$80–$120/m", timber: "$70–$100/m", pool: "$280–$600/m", retaining: "$280–$650/m" },
    { city: "Brisbane", state: "QLD", colorbond: "$75–$115/m", timber: "$65–$95/m", pool: "$280–$600/m", retaining: "$260–$600/m" },
    { city: "Perth", state: "WA", colorbond: "$80–$120/m", timber: "$70–$100/m", pool: "$280–$620/m", retaining: "$280–$650/m" },
    { city: "Adelaide", state: "SA", colorbond: "$75–$110/m", timber: "$65–$95/m", pool: "$260–$580/m", retaining: "$260–$600/m" },
    { city: "Canberra", state: "ACT", colorbond: "$85–$125/m", timber: "$75–$105/m", pool: "$300–$650/m", retaining: "$300–$680/m" },
    { city: "Hobart", state: "TAS", colorbond: "$80–$120/m", timber: "$70–$100/m", pool: "$280–$600/m", retaining: "$280–$640/m" },
    { city: "Darwin", state: "NT", colorbond: "$90–$140/m", timber: "$80–$120/m", pool: "$320–$700/m", retaining: "$320–$720/m" },
];

const commonJobCosts = [
    ["Colorbond fence – standard 1.8m (per metre)", "$80–$130/m"],
    ["Timber paling fence – 1.8m (per metre)", "$65–$110/m"],
    ["Aluminium slat fence (per metre)", "$120–$200/m"],
    ["Frameless glass pool fence (per metre)", "$300–$650/m"],
    ["Semi-frameless glass pool fence (per metre)", "$180–$350/m"],
    ["Pool fence gate (self-latching)", "$300–$600"],
    ["Post and rail farm fence (per metre)", "$30–$60/m"],
    ["Boundary survey before fencing", "$500–$1,500"],
    ["Fence removal and disposal (per metre)", "$15–$40/m"],
    ["Colorbond gate – single pedestrian", "$600–$1,500"],
];

const hiringTips = [
    {
        title: "Know the dividing fence rules for your state",
        body: "In all Australian states, the cost of a standard dividing fence is shared equally between neighbours. You must serve a Fencing Notice before starting work. If your neighbour doesn't respond within 30 days, you may have rights to proceed — but state-specific rules apply. Check your state's fencing legislation before engaging a contractor.",
        icon: BadgeCheck,
    },
    {
        title: "Confirm pool fencing meets Australian Standards",
        body: "Pool fencing must comply with AS 1926.1 (minimum 1,200mm height, non-climbable zone, self-closing self-latching gates). Many states have additional requirements. A pool fence that doesn't comply is a safety risk and will fail council inspection. Always use a fencer experienced in pool compliance.",
        icon: FileText,
    },
    {
        title: "Verify the boundary before posts go in",
        body: "Fences installed on the wrong boundary are expensive to fix. Before work starts, confirm the boundary line with your title documents, existing survey pegs, or commission a new survey. This is especially important if there's any dispute with the neighbouring property about where the boundary lies.",
        icon: ShieldCheck,
    },
    {
        title: "Check if council approval is needed",
        body: "Rear and side fences up to 2m generally don't need council approval in most states. Front fences (street-facing) often have lower height limits (1.2–1.5m). Fences in heritage overlays, near intersections, or in bushfire zones may require a planning permit. Check with your local council before proceeding.",
        icon: Star,
    },
];

const whyTradeRefer = [
    {
        title: "Verified fencing businesses",
        body: "TradeRefer helps homeowners find ABN-verified fencing contractors instead of relying on letterbox drops — particularly important for pool fencing where compliance is a safety and legal requirement.",
    },
    {
        title: "Compare costs before you call",
        body: "Use this hub to understand typical fencing rates per metre across Australian cities so you can benchmark quotes and quickly identify overpriced proposals before committing.",
    },
    {
        title: "Australia-wide local discovery",
        body: "Navigate from this national fencing guide into city and suburb-level pages to find verified fencing contractors in the specific area where your property is located.",
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

export default async function FencingTradeHubPage() {
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
            { "@type": "ListItem", position: 3, name: "Fencing Services Australia", item: "https://traderefer.au/trades/fencing" },
        ],
    };

    const serviceJsonLd = {
        "@context": "https://schema.org",
        "@type": "Service",
        name: "Fencing Services Australia",
        serviceType: "Fencing",
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
                        <span className="text-[#FF6600]">Fencing</span>
                    </nav>

                    <div className="max-w-4xl">
                        <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-2 font-black text-orange-400 uppercase tracking-widest mb-6" style={{ fontSize: "16px" }}>
                            <Home className="w-4 h-4" />
                            Australia-Wide Trade Hub
                        </div>
                        <h1 className="font-black mb-6 leading-[1.05] font-display text-white" style={{ fontSize: "clamp(48px, 8vw, 80px)" }}>
                            Find Verified <span className="text-[#FF6600]">Fencing</span> Contractors Across Australia
                        </h1>
                        <p className="text-zinc-400 max-w-3xl mb-8" style={{ fontSize: "20px", lineHeight: 1.7 }}>
                            Use this TradeRefer fencing hub to compare Colorbond, timber, and pool fencing costs per metre across Australian cities, understand dividing fence laws and pool compliance requirements, and connect with verified local fencing contractors.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link
                                href="/quotes?trade=Fencing&source=%2Ftrades%2Ffencing"
                                className="bg-[#FF6600] hover:bg-[#E65C00] text-white font-black px-8 rounded-xl transition-colors inline-flex items-center justify-center gap-2"
                                style={{ minHeight: "64px", fontSize: "18px" }}
                            >
                                Get 3 Free Quotes
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                href="/businesses?category=Fencing"
                                className="bg-white/10 hover:bg-white/20 text-white font-black px-8 rounded-xl transition-colors border border-white/10 inline-flex items-center justify-center"
                                style={{ minHeight: "64px", fontSize: "18px" }}
                            >
                                Browse Fencing Contractors
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
                            <span className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-[#FF6600]" />Colorbond from ${cost.low}–${cost.high}{cost.unit}</span>
                            {totalBusinesses > 0 && (
                                <span className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-[#FF6600]" />{totalBusinesses.toLocaleString()} fencing businesses listed</span>
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
                            Fencing Cost Guide Australia
                        </h2>
                        <p className="text-zinc-500 mb-8" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                            Fencing costs vary by material, height, ground conditions, and whether posts require concrete footings. Use these benchmarks before requesting quotes.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                                <p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Colorbond Fence</p>
                                <p className="text-3xl font-black text-zinc-900">${cost.low}–${cost.high}</p>
                                <p className="text-zinc-500" style={{ fontSize: "16px" }}>{cost.unit} installed</p>
                            </div>
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                                <p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Pool Fence (frameless glass)</p>
                                <p className="text-3xl font-black text-zinc-900">$300–$650</p>
                                <p className="text-zinc-500" style={{ fontSize: "16px" }}>per metre installed</p>
                            </div>
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                                <p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Best Practice</p>
                                <p className="text-3xl font-black text-zinc-900">2–3</p>
                                <p className="text-zinc-500" style={{ fontSize: "16px" }}>quotes before proceeding</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                            <table className="min-w-full text-left">
                                <thead className="bg-zinc-100 text-zinc-700">
                                    <tr>
                                        <th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>City</th>
                                        <th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Colorbond</th>
                                        <th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Timber Paling</th>
                                        <th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Pool (glass)</th>
                                        <th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Retaining</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cityPricing.map((row) => (
                                        <tr key={`${row.city}-${row.state}`} className="border-t border-zinc-200 bg-white">
                                            <td className="px-4 py-3 font-bold text-zinc-900" style={{ fontSize: "16px" }}>{row.city}</td>
                                            <td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.colorbond}</td>
                                            <td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.timber}</td>
                                            <td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.pool}</td>
                                            <td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.retaining}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-8">
                            <h3 className="font-black text-zinc-900 mb-4 font-display" style={{ fontSize: "24px" }}>Common Fencing Job Costs</h3>
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
                                Fencing Services We Cover
                            </h2>
                            <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                                TradeRefer&apos;s fencing hub covers Colorbond, timber, aluminium, glass pool fencing, and retaining walls across residential and commercial properties.
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
                                Before You Hire a Fencing Contractor
                            </h2>
                            <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                                Use these checks to avoid neighbour disputes, pool compliance failures, and incorrect boundary installations.
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
                            Find Fencing Contractors by City
                        </h2>
                        <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                            Browse the major Australian cities where TradeRefer has fencing businesses listed, then drill into suburb-level pages from there.
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
                            <h2 className="font-black text-[#1A1A1A] mb-3 font-display" style={{ fontSize: "32px" }}>Get 3 Free Fencing Quotes</h2>
                            <p className="text-zinc-500" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                                Request your fencing quotes here and we&apos;ll match your project with up to 3 verified local fencing businesses.
                            </p>
                        </div>
                        <PublicMultiQuoteForm initialTradeCategory="Fencing" initialSourcePage="/trades/fencing" />
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}>
                            <FileText className="w-6 h-6 text-blue-500" />
                            Fencing Rules & Licensing by State
                        </h2>
                        <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                            Fencing regulations — including dividing fence cost-sharing rules, height limits, and pool compliance — vary by state. Here&apos;s what applies in your jurisdiction.
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
                            Fencing: Frequently Asked Questions
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
                            Explore adjacent trade categories that homeowners frequently research alongside fencing projects.
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
                        <h2 className="font-black mb-4 text-white" style={{ fontSize: "40px" }}>Need a Fencing Contractor Near You?</h2>
                        <p className="text-zinc-400 mb-8 max-w-2xl mx-auto" style={{ fontSize: "20px", lineHeight: 1.7 }}>
                            Browse verified local fencing businesses, compare Colorbond, timber, and glass options, and find the right fencing contractor for your residential or commercial project.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link
                                href="/quotes?trade=Fencing&source=%2Ftrades%2Ffencing"
                                className="inline-flex items-center gap-2 bg-[#FF6600] hover:bg-[#E65C00] text-white font-black rounded-xl px-8 transition-colors"
                                style={{ minHeight: "64px", fontSize: "18px" }}
                            >
                                Get 3 Free Quotes <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                href="/businesses?category=Fencing"
                                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-black rounded-xl px-8 transition-colors border border-white/10"
                                style={{ minHeight: "64px", fontSize: "18px" }}
                            >
                                Browse Fencing Contractors
                            </Link>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
