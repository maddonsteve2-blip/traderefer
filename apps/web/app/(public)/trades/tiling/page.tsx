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
    title: "Tiling Services Australia | Find Verified Tilers | TradeRefer",
    description:
        "Find trusted tilers across Australia. Compare tiling costs per square metre by city, understand wet area waterproofing requirements, and hire with confidence through TradeRefer.",
    alternates: { canonical: "https://traderefer.au/trades/tiling" },
    openGraph: {
        title: "Tiling Services Australia | TradeRefer",
        description:
            "Compare tiling costs per m², floor and wall tiling rates, waterproofing requirements, and verified local tilers across Australia.",
        url: "https://traderefer.au/trades/tiling",
        type: "website",
    },
};

const TRADE_NAME = "Tiling";
const cost = TRADE_COST_GUIDE[TRADE_NAME];
const faqs = TRADE_FAQ_BANK[TRADE_NAME].slice(0, 6);
const services = JOB_TYPES[TRADE_NAME].slice(0, 12);
const relatedTrades = [
    { label: "Waterproofing", href: "/categories#waterproofing" },
    { label: "Bathroom Renovation", href: "/categories#bathroom-renovation" },
    { label: "Concreting", href: "/trades/concreting" },
    { label: "Plastering", href: "/categories#plastering" },
    { label: "Kitchen Renovation", href: "/categories#kitchen-renovation" },
    { label: "Flooring", href: "/categories#flooring" },
];

const cityPricing = [
    { city: "Sydney", state: "NSW", labour: "$55–$120/m²", supplyInstall: "$90–$200/m²", shower: "$800–$2,500", bathroom: "$3,000–$8,000" },
    { city: "Melbourne", state: "VIC", labour: "$50–$110/m²", supplyInstall: "$85–$190/m²", shower: "$750–$2,200", bathroom: "$2,800–$7,500" },
    { city: "Brisbane", state: "QLD", labour: "$45–$105/m²", supplyInstall: "$80–$180/m²", shower: "$700–$2,000", bathroom: "$2,500–$7,000" },
    { city: "Perth", state: "WA", labour: "$55–$120/m²", supplyInstall: "$90–$200/m²", shower: "$800–$2,500", bathroom: "$3,000–$8,000" },
    { city: "Adelaide", state: "SA", labour: "$45–$100/m²", supplyInstall: "$80–$175/m²", shower: "$700–$2,000", bathroom: "$2,500–$6,500" },
    { city: "Canberra", state: "ACT", labour: "$55–$115/m²", supplyInstall: "$90–$195/m²", shower: "$800–$2,500", bathroom: "$3,000–$7,500" },
    { city: "Hobart", state: "TAS", labour: "$50–$110/m²", supplyInstall: "$85–$185/m²", shower: "$750–$2,200", bathroom: "$2,800–$7,000" },
    { city: "Darwin", state: "NT", labour: "$60–$130/m²", supplyInstall: "$95–$210/m²", shower: "$900–$2,800", bathroom: "$3,500–$9,000" },
];

const commonJobCosts = [
    ["Shower floor & walls (supply & install)", "$1,200–$3,500"],
    ["Bathroom floor retile (labour only)", "$400–$900"],
    ["Kitchen splashback (supply & install)", "$400–$1,200"],
    ["Laundry floor retile", "$300–$700"],
    ["Outdoor alfresco area (per m²)", "$60–$150/m²"],
    ["Large format floor tiles (600×600+)", "$80–$180/m²"],
    ["Herringbone/feature pattern (labour)", "$120–$200/m²"],
    ["Pool coping & surrounds", "$90–$180/m²"],
    ["Waterproofing (shower, mandatory)", "$300–$600"],
    ["Grout replacement (shower)", "$300–$600"],
];

const hiringTips = [
    {
        title: "Waterproofing must come before tiling",
        body: "Under Australian Standard AS 3740, all wet areas (showers, baths, laundries) must be waterproofed before tiling begins. If a tiler doesn't mention waterproofing or tries to skip it, walk away. Failure to waterproof is the number one cause of expensive shower rectification.",
        icon: BadgeCheck,
    },
    {
        title: "Check their experience with your tile type",
        body: "Large format tiles (600×600mm+), natural stone, mosaic, and rectified porcelain all require different techniques and substrate preparation. Ask to see examples of the specific tile type in your quote. Not all tilers have experience with large format or natural stone.",
        icon: FileText,
    },
    {
        title: "Confirm the slip rating for outdoor tiles",
        body: "Outdoor tiles must have a minimum R11 slip rating (P4 or P5 for slopes). Using polished or low-slip-rated tiles outdoors is a safety risk and may not comply with Australian Standards. Your tiler should be able to confirm the slip rating of any tile they recommend.",
        icon: ShieldCheck,
    },
    {
        title: "Ask about substrate preparation",
        body: "Poor substrate preparation is the primary cause of cracked, hollow, and failed tiles. A quality tiler will check for and correct substrate deflection, moisture issues, and unevenness before tiling. Any quote that doesn't mention substrate prep is a red flag.",
        icon: Star,
    },
];

const whyTradeRefer = [
    {
        title: "Verified tiling businesses",
        body: "TradeRefer helps homeowners find ABN-verified tilers instead of relying on unchecked listings — particularly important for wet area work where compliance is mandatory.",
    },
    {
        title: "Compare costs before you call",
        body: "Use this hub to understand typical tiling rates per square metre across Australian cities so you can benchmark any quote you receive before committing to a contractor.",
    },
    {
        title: "Australia-wide local discovery",
        body: "Move from this national tiling guide into city and suburb-level pages to find verified tilers in the specific area where your project is located.",
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

export default async function TilingTradeHubPage() {
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
            { "@type": "ListItem", position: 3, name: "Tiling Services Australia", item: "https://traderefer.au/trades/tiling" },
        ],
    };

    const serviceJsonLd = {
        "@context": "https://schema.org",
        "@type": "Service",
        name: "Tiling Services Australia",
        serviceType: "Tiling",
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
                        <span className="text-[#FF6600]">Tiling</span>
                    </nav>

                    <div className="max-w-4xl">
                        <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-2 font-black text-orange-400 uppercase tracking-widest mb-6" style={{ fontSize: "16px" }}>
                            <Home className="w-4 h-4" />
                            Australia-Wide Trade Hub
                        </div>
                        <h1 className="font-black mb-6 leading-[1.05] font-display text-white" style={{ fontSize: "clamp(48px, 8vw, 80px)" }}>
                            Find Verified <span className="text-[#FF6600]">Tilers</span> Across Australia
                        </h1>
                        <p className="text-zinc-400 max-w-3xl mb-8" style={{ fontSize: "20px", lineHeight: 1.7 }}>
                            Use this TradeRefer tiling hub to compare floor and wall tiling costs per square metre, understand mandatory waterproofing requirements,
                            and connect with verified local tilers across Australia.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link
                                href="/quotes?trade=Tiling&source=%2Ftrades%2Ftiling"
                                className="bg-[#FF6600] hover:bg-[#E65C00] text-white font-black px-8 rounded-xl transition-colors inline-flex items-center justify-center gap-2"
                                style={{ minHeight: "64px", fontSize: "18px" }}
                            >
                                Get 3 Free Quotes
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                href="/businesses?category=Tiling"
                                className="bg-white/10 hover:bg-white/20 text-white font-black px-8 rounded-xl transition-colors border border-white/10 inline-flex items-center justify-center"
                                style={{ minHeight: "64px", fontSize: "18px" }}
                            >
                                Browse Tilers
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
                            <span className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-[#FF6600]" />Typical rates ${cost.low}–${cost.high}{cost.unit}</span>
                            {totalBusinesses > 0 && (
                                <span className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-[#FF6600]" />{totalBusinesses.toLocaleString()} tiling businesses listed</span>
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
                            Tiling Cost Guide Australia
                        </h2>
                        <p className="text-zinc-500 mb-8" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                            Tiling costs depend on tile size, pattern complexity, substrate preparation, and wet area requirements. Use these benchmarks across Australian cities to evaluate quotes.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                                <p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Labour Rate</p>
                                <p className="text-3xl font-black text-zinc-900">${cost.low}–${cost.high}</p>
                                <p className="text-zinc-500" style={{ fontSize: "16px" }}>{cost.unit} (labour only)</p>
                            </div>
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                                <p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Supply & Install</p>
                                <p className="text-3xl font-black text-zinc-900">$80–$200</p>
                                <p className="text-zinc-500" style={{ fontSize: "16px" }}>per m² inc. tiles</p>
                            </div>
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                                <p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Waterproofing (mandatory)</p>
                                <p className="text-3xl font-black text-zinc-900">$300–$600</p>
                                <p className="text-zinc-500" style={{ fontSize: "16px" }}>per shower (AS 3740)</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                            <table className="min-w-full text-left">
                                <thead className="bg-zinc-100 text-zinc-700">
                                    <tr>
                                        <th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>City</th>
                                        <th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Labour (per m²)</th>
                                        <th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Supply & Install</th>
                                        <th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Shower Retile</th>
                                        <th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Full Bathroom</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cityPricing.map((row) => (
                                        <tr key={`${row.city}-${row.state}`} className="border-t border-zinc-200 bg-white">
                                            <td className="px-4 py-3 font-bold text-zinc-900" style={{ fontSize: "16px" }}>{row.city}</td>
                                            <td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.labour}</td>
                                            <td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.supplyInstall}</td>
                                            <td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.shower}</td>
                                            <td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.bathroom}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-8">
                            <h3 className="font-black text-zinc-900 mb-4 font-display" style={{ fontSize: "24px" }}>Common Tiling Job Costs</h3>
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
                                Tiling Services We Cover
                            </h2>
                            <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                                TradeRefer&apos;s tiling hub covers bathroom, kitchen, outdoor, and commercial tiling across floor, wall, and feature applications.
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
                                Before You Hire a Tiler
                            </h2>
                            <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                                Use these checks to avoid compliance failures, hollow tiles, and costly shower rectification.
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
                            Find Tilers by City
                        </h2>
                        <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                            Browse the major Australian cities where TradeRefer has tiling businesses listed, then drill into suburb-level pages from there.
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
                            <h2 className="font-black text-[#1A1A1A] mb-3 font-display" style={{ fontSize: "32px" }}>Get 3 Free Tiling Quotes</h2>
                            <p className="text-zinc-500" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                                Request your tiling quotes here and we&apos;ll match your job with up to 3 verified local tiling businesses.
                            </p>
                        </div>
                        <PublicMultiQuoteForm initialTradeCategory="Tiling" initialSourcePage="/trades/tiling" />
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}>
                            <FileText className="w-6 h-6 text-blue-500" />
                            Tiling Licensing Requirements by State
                        </h2>
                        <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                            Tiling is largely unlicensed across most states, but mandatory wet area waterproofing to AS 3740 applies nationally regardless of licence status.
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
                            Tiling: Frequently Asked Questions
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
                            Explore trade categories that homeowners frequently research alongside tiling projects.
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
                        <h2 className="font-black mb-4 text-white" style={{ fontSize: "40px" }}>Need a Tiler Near You?</h2>
                        <p className="text-zinc-400 mb-8 max-w-2xl mx-auto" style={{ fontSize: "20px", lineHeight: 1.7 }}>
                            Browse verified local tiling businesses, compare services and tile experience, and find the right tiler for your bathroom, kitchen, or outdoor project.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link
                                href="/quotes?trade=Tiling&source=%2Ftrades%2Ftiling"
                                className="inline-flex items-center gap-2 bg-[#FF6600] hover:bg-[#E65C00] text-white font-black rounded-xl px-8 transition-colors"
                                style={{ minHeight: "64px", fontSize: "18px" }}
                            >
                                Get 3 Free Quotes <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                href="/businesses?category=Tiling"
                                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-black rounded-xl px-8 transition-colors border border-white/10"
                                style={{ minHeight: "64px", fontSize: "18px" }}
                            >
                                Browse Tilers
                            </Link>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
