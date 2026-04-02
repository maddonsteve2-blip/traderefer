import { Metadata } from "next";
import Link from "next/link";
import {
    ArrowRight,
    BadgeCheck,
    ChevronRight,
    Clock3,
    DollarSign,
    FileText,
    MapPin,
    ShieldCheck,
    Star,
    Wrench,
    Thermometer,
} from "lucide-react";
import { sql } from "@/lib/db";
import { JOB_TYPES, STATE_LICENSING, TRADE_COST_GUIDE, TRADE_FAQ_BANK, jobToSlug } from "@/lib/constants";
import { PublicMultiQuoteForm } from "@/components/PublicMultiQuoteForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Air Conditioning Installation & Service Australia | TradeRefer",
    description:
        "Find trusted air conditioning installers and HVAC technicians across Australia. Compare split system and ducted AC costs, check ARC licensing requirements, and hire with confidence through TradeRefer.",
    alternates: { canonical: "https://traderefer.au/trades/air-conditioning" },
    openGraph: {
        title: "Air Conditioning Installation & Service Australia | TradeRefer",
        description:
            "Compare air conditioning costs, split system vs ducted pricing, licensing requirements, and verified local HVAC businesses across Australia.",
        url: "https://traderefer.au/trades/air-conditioning",
        type: "website",
    },
};

const TRADE_NAME = "Air Conditioning & Heating";
const cost = TRADE_COST_GUIDE[TRADE_NAME];
const faqs = TRADE_FAQ_BANK[TRADE_NAME].slice(0, 6);
const services = JOB_TYPES[TRADE_NAME].slice(0, 12);
const relatedTrades = [
    { label: "Electrical", href: "/trades/electrical" },
    { label: "Solar Installation", href: "/categories#solar-installation" },
    { label: "Insulation", href: "/categories#insulation" },
    { label: "Plumbing", href: "/trades/plumbing" },
    { label: "Roofing", href: "/categories#roofing" },
    { label: "Building", href: "/categories#building" },
];

const cityPricing = [
    { city: "Sydney", state: "NSW", splitSystem: "$1,000–$2,500", ducted: "$7,000–$15,000", service: "$150–$300", multiHead: "$3,500–$7,000" },
    { city: "Melbourne", state: "VIC", splitSystem: "$950–$2,400", ducted: "$6,500–$14,000", service: "$140–$280", multiHead: "$3,200–$6,500" },
    { city: "Brisbane", state: "QLD", splitSystem: "$900–$2,200", ducted: "$6,000–$13,500", service: "$130–$260", multiHead: "$3,000–$6,200" },
    { city: "Perth", state: "WA", splitSystem: "$950–$2,400", ducted: "$6,500–$14,000", service: "$140–$280", multiHead: "$3,200–$6,500" },
    { city: "Adelaide", state: "SA", splitSystem: "$900–$2,200", ducted: "$6,000–$13,000", service: "$130–$260", multiHead: "$3,000–$6,000" },
    { city: "Canberra", state: "ACT", splitSystem: "$1,000–$2,500", ducted: "$7,000–$15,000", service: "$150–$300", multiHead: "$3,500–$7,000" },
    { city: "Hobart", state: "TAS", splitSystem: "$950–$2,300", ducted: "$6,500–$13,500", service: "$140–$270", multiHead: "$3,200–$6,300" },
    { city: "Darwin", state: "NT", splitSystem: "$1,050–$2,600", ducted: "$7,500–$16,000", service: "$160–$320", multiHead: "$3,800–$7,500" },
];

const commonJobCosts = [
    ["Split system supply & install (2.5kW)", "$900–$1,800"],
    ["Split system supply & install (6–7kW)", "$1,500–$2,800"],
    ["Multi-head split system (3 rooms)", "$3,500–$7,000"],
    ["Ducted reverse-cycle (3–4 bed home)", "$6,500–$14,000"],
    ["Ducted add-on zone", "$600–$1,200"],
    ["Annual split system service & clean", "$120–$250"],
    ["Refrigerant regas (per system)", "$150–$350"],
    ["Thermostat or controller replacement", "$150–$400"],
    ["Ducted system service (6–8 outlets)", "$250–$500"],
    ["Air conditioner removal & disposal", "$150–$300"],
];

const hiringTips = [
    {
        title: "Check for an ARC licence",
        body: "Any tradesperson who handles refrigerants must hold a current Australian Refrigeration Council (ARC) Refrigerant Handling Licence. This is a federal requirement. Ask for the licence number and verify at www.arctick.org before booking.",
        icon: BadgeCheck,
    },
    {
        title: "Get a written quote with full specifications",
        body: "Your quote should specify the exact brand, model, capacity (kW), energy star rating, warranty period, and installation conditions. Vague quotes allow contractors to substitute lower-quality equipment without your knowledge.",
        icon: FileText,
    },
    {
        title: "Confirm electrical and gas sub-contractors",
        body: "Air conditioning installation involves electrical connections (requiring a licensed electrician) and potentially gas connections for ducted heating. Confirm whether your installer manages these in-house or sub-contracts, and that all sub-contractors are appropriately licensed.",
        icon: ShieldCheck,
    },
    {
        title: "Compare brand-agnostic installers",
        body: "Some technicians are aligned with or incentivised by specific brands. TradeRefer surfaces verified businesses ranked by real community referrals — helping you find independent HVAC technicians who will recommend the right system for your home, not just the brand they stock.",
        icon: Star,
    },
];

const whyTradeRefer = [
    {
        title: "Verified HVAC businesses",
        body: "TradeRefer helps surface ABN-checked air conditioning businesses so homeowners can compare verified providers instead of relying on anonymous listings or branded directories.",
    },
    {
        title: "Better quote comparison",
        body: "Use this hub to understand typical air conditioning installation and service costs before requesting quotes, so you can quickly identify overpriced proposals or suspiciously cheap offers that may involve inferior equipment.",
    },
    {
        title: "Australia-wide local discovery",
        body: "Move from this national air conditioning guide into city and suburb-level pages to find licensed HVAC technicians in the areas that matter most to you.",
    },
];

const featuredCities = [
    { city: "Sydney", state: "NSW", stateSlug: "nsw", citySlug: "sydney" },
    { city: "Melbourne", state: "VIC", stateSlug: "vic", citySlug: "melbourne" },
    { city: "Brisbane", state: "QLD", stateSlug: "qld", citySlug: "brisbane" },
    { city: "Perth", state: "WA", stateSlug: "wa", citySlug: "perth" },
    { city: "Adelaide", state: "SA", stateSlug: "sa", citySlug: "adelaide" },
    { city: "Gold Coast", state: "QLD", stateSlug: "qld", citySlug: "gold-coast" },
    { city: "Canberra", state: "ACT", stateSlug: "act", citySlug: "canberra" },
    { city: "Darwin", state: "NT", stateSlug: "nt", citySlug: "darwin" },
];

type StateCountRow = {
    state: string;
    count: string | number;
};

type CityCountRow = {
    city: string;
    state: string;
    count: string | number;
};

async function getBusinessCountByState(tradeName: string): Promise<Record<string, number>> {
    try {
        const results = await sql<StateCountRow[]>`
            SELECT state, COUNT(*) as count
            FROM businesses
            WHERE status = 'active'
              AND trade_category ILIKE ${"%" + tradeName + "%"}
              AND state IS NOT NULL
            GROUP BY state
            ORDER BY count DESC
        `;
        const map: Record<string, number> = {};
        results.forEach((row) => {
            map[row.state] = parseInt(String(row.count), 10);
        });
        return map;
    } catch {
        return {};
    }
}

async function getFeaturedCityCounts(tradeName: string): Promise<Record<string, number>> {
    try {
        const results = await sql<CityCountRow[]>`
            SELECT city, state, COUNT(*) as count
            FROM businesses
            WHERE status = 'active'
              AND trade_category ILIKE ${"%" + tradeName + "%"}
              AND city IS NOT NULL
              AND city != ''
            GROUP BY city, state
        `;
        const map: Record<string, number> = {};
        results.forEach((row) => {
            const key = `${String(row.city).toLowerCase()}::${String(row.state).toUpperCase()}`;
            map[key] = parseInt(String(row.count), 10);
        });
        return map;
    } catch {
        return {};
    }
}

export default async function AirConditioningTradeHubPage() {
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
            { "@type": "ListItem", position: 3, name: "Air Conditioning & Heating Australia", item: "https://traderefer.au/trades/air-conditioning" },
        ],
    };

    const serviceJsonLd = {
        "@context": "https://schema.org",
        "@type": "Service",
        name: "Air Conditioning & Heating Services Australia",
        serviceType: "Air Conditioning & Heating",
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
            acceptedAnswer: {
                "@type": "Answer",
                text: faq.a,
            },
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
                        <span className="text-[#FF6600]">Air Conditioning</span>
                    </nav>

                    <div className="max-w-4xl">
                        <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-2 font-black text-orange-400 uppercase tracking-widest mb-6" style={{ fontSize: "16px" }}>
                            <Thermometer className="w-4 h-4" />
                            Australia-Wide Trade Hub
                        </div>
                        <h1 className="font-black mb-6 leading-[1.05] font-display text-white" style={{ fontSize: "clamp(48px, 8vw, 80px)" }}>
                            Find Trusted <span className="text-[#FF6600]">Air Conditioning</span> Installers Across Australia
                        </h1>
                        <p className="text-zinc-400 max-w-3xl mb-8" style={{ fontSize: "20px", lineHeight: 1.7 }}>
                            Use this TradeRefer air conditioning hub to compare typical split system and ducted AC costs, understand
                            ARC licensing requirements, and discover verified local HVAC businesses in the Australian cities where demand is highest.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link
                                href="/quotes?trade=Air+Conditioning+%26+Heating&source=%2Ftrades%2Fair-conditioning"
                                className="bg-[#FF6600] hover:bg-[#E65C00] text-white font-black px-8 rounded-xl transition-colors inline-flex items-center justify-center gap-2"
                                style={{ minHeight: "64px", fontSize: "18px" }}
                            >
                                Get 3 Free Quotes
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                href="/businesses?category=Air+Conditioning+%26+Heating"
                                className="bg-white/10 hover:bg-white/20 text-white font-black px-8 rounded-xl transition-colors border border-white/10 inline-flex items-center justify-center"
                                style={{ minHeight: "64px", fontSize: "18px" }}
                            >
                                Browse AC Businesses
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
                            <span className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-[#FF6600]" />Typical ${cost.low}–${cost.high}{cost.unit}</span>
                            {totalBusinesses > 0 && (
                                <span className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-[#FF6600]" />{totalBusinesses.toLocaleString()} AC businesses listed</span>
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
                            Air Conditioning Cost Guide Australia
                        </h2>
                        <p className="text-zinc-500 mb-8" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                            Air conditioning costs vary by system type, home size, brand, and city. These national guide figures help you benchmark quotes before choosing a provider.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                                <p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Split System (Installed)</p>
                                <p className="text-3xl font-black text-zinc-900">$900–$2,500</p>
                                <p className="text-zinc-500" style={{ fontSize: "16px" }}>single room unit</p>
                            </div>
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                                <p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Ducted System (Installed)</p>
                                <p className="text-3xl font-black text-zinc-900">$6,500–$15,000</p>
                                <p className="text-zinc-500" style={{ fontSize: "16px" }}>3–4 bedroom home</p>
                            </div>
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                                <p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Best Practice</p>
                                <p className="text-3xl font-black text-zinc-900">2–3</p>
                                <p className="text-zinc-500" style={{ fontSize: "16px" }}>written quotes per job</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                            <table className="min-w-full text-left">
                                <thead className="bg-zinc-100 text-zinc-700">
                                    <tr>
                                        <th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>City</th>
                                        <th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Split System</th>
                                        <th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Ducted System</th>
                                        <th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Annual Service</th>
                                        <th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Multi-Head (3 rooms)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cityPricing.map((row) => (
                                        <tr key={`${row.city}-${row.state}`} className="border-t border-zinc-200 bg-white">
                                            <td className="px-4 py-3 font-bold text-zinc-900" style={{ fontSize: "16px" }}>{row.city}</td>
                                            <td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.splitSystem}</td>
                                            <td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.ducted}</td>
                                            <td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.service}</td>
                                            <td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.multiHead}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-8">
                            <h3 className="font-black text-zinc-900 mb-4 font-display" style={{ fontSize: "24px" }}>Common Air Conditioning Job Costs</h3>
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
                                Air Conditioning Services We Cover
                            </h2>
                            <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                                TradeRefer&apos;s air conditioning hub supports everything from single split system installations to full ducted system replacements and routine maintenance.
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
                                Before You Hire an AC Installer
                            </h2>
                            <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                                Use these checks to avoid unlicensed refrigerant work, substandard equipment, and hidden installation costs.
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
                            Find Air Conditioning Businesses by City
                        </h2>
                        <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                            Start with the major cities where TradeRefer already has air conditioning businesses listed, then drill into suburb-level pages from there.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {featuredCities.map(({ city, state, stateSlug, citySlug }) => {
                                const count = cityCounts[`${city.toLowerCase()}::${state}`] || 0;
                                return (
                                    <Link
                                        key={`${city}-${state}`}
                                        href={`/local/${stateSlug}/${citySlug}`}
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
                            <h2 className="font-black text-[#1A1A1A] mb-3 font-display" style={{ fontSize: "32px" }}>Get 3 Free Air Conditioning Quotes</h2>
                            <p className="text-zinc-500" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                                Request your air conditioning quotes here and we&apos;ll match your job with up to 3 verified local businesses.
                            </p>
                        </div>
                        <PublicMultiQuoteForm initialTradeCategory="Air Conditioning & Heating" initialSourcePage="/trades/air-conditioning" />
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}>
                            <FileText className="w-6 h-6 text-blue-500" />
                            Air Conditioning Licensing Requirements by State
                        </h2>
                        <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                            Air conditioning installation and refrigerant handling is regulated across all Australian states and territories. Always confirm your contractor holds both an ARC licence and any additional state-specific trade licences before work begins.
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
                            Air Conditioning: Frequently Asked Questions
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
                            Continue exploring adjacent trade categories that homeowners often compare alongside air conditioning and heating work.
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
                        <h2 className="font-black mb-4 text-white" style={{ fontSize: "40px" }}>Need an Air Conditioning Installer Near You?</h2>
                        <p className="text-zinc-400 mb-8 max-w-2xl mx-auto" style={{ fontSize: "20px", lineHeight: 1.7 }}>
                            Browse verified local air conditioning businesses, compare their services, and move into suburb-level directory pages to find the best licensed HVAC installer for your home or business.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link
                                href="/quotes?trade=Air+Conditioning+%26+Heating&source=%2Ftrades%2Fair-conditioning"
                                className="inline-flex items-center gap-2 bg-[#FF6600] hover:bg-[#E65C00] text-white font-black rounded-xl px-8 transition-colors"
                                style={{ minHeight: "64px", fontSize: "18px" }}
                            >
                                Get 3 Free Quotes <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                href="/businesses?category=Air+Conditioning+%26+Heating"
                                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-black rounded-xl px-8 transition-colors border border-white/10"
                                style={{ minHeight: "64px", fontSize: "18px" }}
                            >
                                Browse AC Businesses
                            </Link>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
