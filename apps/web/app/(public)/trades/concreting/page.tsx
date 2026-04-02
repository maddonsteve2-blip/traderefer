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
    title: "Concreting Services Australia | Find Verified Concreters | TradeRefer",
    description:
        "Find trusted concreters across Australia. Compare concrete driveway and slab costs by city, understand licensing requirements by state, and hire verified local concreters through TradeRefer.",
    alternates: { canonical: "https://traderefer.au/trades/concreting" },
    openGraph: {
        title: "Concreting Services Australia | TradeRefer",
        description:
            "Compare concreting costs per m², driveway and slab pricing, licensing requirements, and verified local concreters across Australia.",
        url: "https://traderefer.au/trades/concreting",
        type: "website",
    },
};

const TRADE_NAME = "Concreting";
const cost = TRADE_COST_GUIDE[TRADE_NAME];
const faqs = TRADE_FAQ_BANK[TRADE_NAME].slice(0, 6);
const services = JOB_TYPES[TRADE_NAME].slice(0, 12);
const relatedTrades = [
    { label: "Paving", href: "/categories#paving" },
    { label: "Landscaping", href: "/trades/landscaping" },
    { label: "Fencing", href: "/trades/fencing" },
    { label: "Building", href: "/categories#building" },
    { label: "Tiling", href: "/trades/tiling" },
    { label: "Drainage", href: "/categories#drainage" },
];

const cityPricing = [
    { city: "Sydney", state: "NSW", sqm: "$75–$150/m²", driveway: "$4,000–$8,000", slab: "$6,000–$15,000", exposed: "$90–$170/m²" },
    { city: "Melbourne", state: "VIC", sqm: "$65–$140/m²", driveway: "$3,500–$7,500", slab: "$5,500–$14,000", exposed: "$80–$160/m²" },
    { city: "Brisbane", state: "QLD", sqm: "$65–$130/m²", driveway: "$3,500–$7,000", slab: "$5,000–$13,000", exposed: "$80–$150/m²" },
    { city: "Perth", state: "WA", sqm: "$70–$145/m²", driveway: "$3,800–$7,500", slab: "$5,500–$14,000", exposed: "$85–$165/m²" },
    { city: "Adelaide", state: "SA", sqm: "$60–$130/m²", driveway: "$3,200–$7,000", slab: "$5,000–$13,000", exposed: "$75–$150/m²" },
    { city: "Canberra", state: "ACT", sqm: "$75–$150/m²", driveway: "$4,000–$8,000", slab: "$6,000–$15,000", exposed: "$90–$170/m²" },
    { city: "Hobart", state: "TAS", sqm: "$70–$140/m²", driveway: "$3,800–$7,500", slab: "$5,500–$14,000", exposed: "$85–$160/m²" },
    { city: "Darwin", state: "NT", sqm: "$80–$160/m²", driveway: "$4,500–$9,000", slab: "$7,000–$17,000", exposed: "$95–$180/m²" },
];

const commonJobCosts = [
    ["Plain concrete driveway (double, 50m²)", "$3,500–$7,500"],
    ["Exposed aggregate driveway (50m²)", "$5,000–$9,000"],
    ["Concrete slab (100mm, 20m²)", "$2,000–$4,000"],
    ["House slab (100mm, 200m²)", "$15,000–$30,000"],
    ["Concrete path (plain, per m²)", "$60–$120/m²"],
    ["Pool surrounds (exposed aggregate)", "$80–$150/m²"],
    ["Coloured concrete (per m²)", "$80–$160/m²"],
    ["Concrete steps (per step)", "$400–$800"],
    ["Retaining wall footings (per m)", "$200–$500/m"],
    ["Concrete cutting / saw cutting (per m)", "$20–$50/m"],
];

const hiringTips = [
    {
        title: "Confirm concrete grade and reinforcement specs",
        body: "A residential driveway should use N20 or N25 concrete at 100mm thickness minimum with SL72 or SL82 mesh. A reputable concretor will specify the concrete grade, mesh type, and slab thickness in writing. If a quote doesn't mention these, ask before proceeding.",
        icon: BadgeCheck,
    },
    {
        title: "Understand control joint placement",
        body: "Concrete cracks — the goal is to control where. Control joints should be placed every 3–4 metres in driveways. Concretors who skip control joints often end up with cracking patterns that can't be easily repaired. Always ask how many joints are planned and where.",
        icon: FileText,
    },
    {
        title: "Get a driveway crossing permit before work starts",
        body: "Most councils require a vehicle crossing permit for any new or modified driveway at the street boundary. The permit must be obtained before concrete is poured. A good concretor will advise you to get this before starting — if they don't mention it, ask.",
        icon: ShieldCheck,
    },
    {
        title: "Ask about curing procedures",
        body: "Proper curing significantly affects concrete strength and durability. Curing compound, wet hessian, or plastic sheeting should be applied after pouring. Avoid concreting in extreme heat without adequate curing provision — a professional concretor knows to adjust for Australian summer conditions.",
        icon: Star,
    },
];

const whyTradeRefer = [
    {
        title: "Verified concreting businesses",
        body: "TradeRefer helps homeowners find ABN-verified concreting contractors instead of relying on unchecked listings — particularly important for structural slabs where compliance and quality directly affect your property value.",
    },
    {
        title: "Compare costs before you call",
        body: "Use this hub to understand typical concreting rates per square metre across Australian cities so you can benchmark quotes and identify underspecified proposals before signing anything.",
    },
    {
        title: "Australia-wide local discovery",
        body: "Navigate from this national concreting guide into city and suburb-level pages to find verified concreters in the specific area where your project is located.",
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

export default async function ConcretingTradeHubPage() {
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
            { "@type": "ListItem", position: 3, name: "Concreting Services Australia", item: "https://traderefer.au/trades/concreting" },
        ],
    };

    const serviceJsonLd = {
        "@context": "https://schema.org",
        "@type": "Service",
        name: "Concreting Services Australia",
        serviceType: "Concreting",
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
                        <span className="text-[#FF6600]">Concreting</span>
                    </nav>

                    <div className="max-w-4xl">
                        <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-2 font-black text-orange-400 uppercase tracking-widest mb-6" style={{ fontSize: "16px" }}>
                            <Home className="w-4 h-4" />
                            Australia-Wide Trade Hub
                        </div>
                        <h1 className="font-black mb-6 leading-[1.05] font-display text-white" style={{ fontSize: "clamp(48px, 8vw, 80px)" }}>
                            Find Verified <span className="text-[#FF6600]">Concreters</span> Across Australia
                        </h1>
                        <p className="text-zinc-400 max-w-3xl mb-8" style={{ fontSize: "20px", lineHeight: 1.7 }}>
                            Use this TradeRefer concreting hub to compare driveway and slab costs per square metre across Australian cities, understand licensing requirements,
                            and connect with verified local concreters for your residential or commercial project.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link
                                href="/quotes?trade=Concreting&source=%2Ftrades%2Fconcreting"
                                className="bg-[#FF6600] hover:bg-[#E65C00] text-white font-black px-8 rounded-xl transition-colors inline-flex items-center justify-center gap-2"
                                style={{ minHeight: "64px", fontSize: "18px" }}
                            >
                                Get 3 Free Quotes
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                href="/businesses?category=Concreting"
                                className="bg-white/10 hover:bg-white/20 text-white font-black px-8 rounded-xl transition-colors border border-white/10 inline-flex items-center justify-center"
                                style={{ minHeight: "64px", fontSize: "18px" }}
                            >
                                Browse Concreters
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
                                <span className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-[#FF6600]" />{totalBusinesses.toLocaleString()} concreting businesses listed</span>
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
                            Concreting Cost Guide Australia
                        </h2>
                        <p className="text-zinc-500 mb-8" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                            Concrete costs vary by mix grade, thickness, reinforcement, finish, and site access. Use these city-by-city benchmarks to evaluate any quote before committing.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                                <p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Typical Rate</p>
                                <p className="text-3xl font-black text-zinc-900">${cost.low}–${cost.high}</p>
                                <p className="text-zinc-500" style={{ fontSize: "16px" }}>{cost.unit} (plain finish)</p>
                            </div>
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                                <p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Double Driveway</p>
                                <p className="text-3xl font-black text-zinc-900">$3.5k–$8k</p>
                                <p className="text-zinc-500" style={{ fontSize: "16px" }}>approx 50m², plain finish</p>
                            </div>
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                                <p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Best Practice</p>
                                <p className="text-3xl font-black text-zinc-900">2–3</p>
                                <p className="text-zinc-500" style={{ fontSize: "16px" }}>written quotes with specs</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                            <table className="min-w-full text-left">
                                <thead className="bg-zinc-100 text-zinc-700">
                                    <tr>
                                        <th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>City</th>
                                        <th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Plain (per m²)</th>
                                        <th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Driveway (double)</th>
                                        <th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>House Slab</th>
                                        <th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Exposed Agg</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cityPricing.map((row) => (
                                        <tr key={`${row.city}-${row.state}`} className="border-t border-zinc-200 bg-white">
                                            <td className="px-4 py-3 font-bold text-zinc-900" style={{ fontSize: "16px" }}>{row.city}</td>
                                            <td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.sqm}</td>
                                            <td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.driveway}</td>
                                            <td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.slab}</td>
                                            <td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.exposed}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-8">
                            <h3 className="font-black text-zinc-900 mb-4 font-display" style={{ fontSize: "24px" }}>Common Concreting Job Costs</h3>
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
                                Concreting Services We Cover
                            </h2>
                            <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                                TradeRefer&apos;s concreting hub covers driveways, slabs, paths, pool surrounds, exposed aggregate, and decorative concrete finishes.
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
                                Before You Hire a Concreter
                            </h2>
                            <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                                Use these checks to avoid underspecified concrete, missing permits, and inadequate curing.
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
                            Find Concreters by City
                        </h2>
                        <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                            Browse the major Australian cities where TradeRefer has concreting businesses listed, then drill into suburb-level pages from there.
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
                            <h2 className="font-black text-[#1A1A1A] mb-3 font-display" style={{ fontSize: "32px" }}>Get 3 Free Concreting Quotes</h2>
                            <p className="text-zinc-500" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                                Request your concreting quotes here and we&apos;ll match your project with up to 3 verified local concreting businesses.
                            </p>
                        </div>
                        <PublicMultiQuoteForm initialTradeCategory="Concreting" initialSourcePage="/trades/concreting" />
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}>
                            <FileText className="w-6 h-6 text-blue-500" />
                            Concreting Licensing Requirements by State
                        </h2>
                        <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                            Structural concreting (slabs, footings) requires licensed builders or registered practitioners in all Australian states. Decorative and non-structural work has lower thresholds.
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
                            Concreting: Frequently Asked Questions
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
                            Explore adjacent trade categories that homeowners frequently research alongside concreting projects.
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
                        <h2 className="font-black mb-4 text-white" style={{ fontSize: "40px" }}>Need a Concreter Near You?</h2>
                        <p className="text-zinc-400 mb-8 max-w-2xl mx-auto" style={{ fontSize: "20px", lineHeight: 1.7 }}>
                            Browse verified local concreting businesses, compare services and finishes, and find the right concreter for your driveway, slab, or outdoor project.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link
                                href="/quotes?trade=Concreting&source=%2Ftrades%2Fconcreting"
                                className="inline-flex items-center gap-2 bg-[#FF6600] hover:bg-[#E65C00] text-white font-black rounded-xl px-8 transition-colors"
                                style={{ minHeight: "64px", fontSize: "18px" }}
                            >
                                Get 3 Free Quotes <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                href="/businesses?category=Concreting"
                                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-black rounded-xl px-8 transition-colors border border-white/10"
                                style={{ minHeight: "64px", fontSize: "18px" }}
                            >
                                Browse Concreters
                            </Link>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
