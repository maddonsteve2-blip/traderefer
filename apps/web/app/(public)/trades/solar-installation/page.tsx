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
    title: "Solar Panel Installation Australia | Find Verified Solar Installers | TradeRefer",
    description:
        "Find CEC-accredited solar installers across Australia. Compare 6.6kW and 10kW solar system costs by city, understand the STC rebate, and hire verified local solar businesses through TradeRefer.",
    alternates: { canonical: "https://traderefer.au/trades/solar-installation" },
    openGraph: {
        title: "Solar Panel Installation Australia | TradeRefer",
        description:
            "Compare solar panel installation costs, STC rebate amounts, and verified local CEC-accredited solar installers across Australia.",
        url: "https://traderefer.au/trades/solar-installation",
        type: "website",
    },
};

const TRADE_NAME = "Solar & Energy";
const TRADE_SLUG_LABEL = "Solar Installation";
const cost = TRADE_COST_GUIDE[TRADE_NAME] ?? { low: 4500, high: 9000, unit: " (6.6kW after rebate)" };
const faqs = TRADE_FAQ_BANK[TRADE_NAME].slice(0, 6);
const services = JOB_TYPES[TRADE_NAME]?.slice(0, 12) ?? [];
const relatedTrades = [
    { label: "Electrical", href: "/trades/electrical" },
    { label: "Air Conditioning & Heating", href: "/trades/air-conditioning" },
    { label: "Roofing", href: "/trades/roofing" },
    { label: "Building", href: "/categories#building" },
    { label: "Plumbing", href: "/trades/plumbing" },
    { label: "Insulation", href: "/categories#insulation" },
];

const cityPricing = [
    { city: "Sydney", state: "NSW", sys66kw: "$5,000–$9,000", sys10kw: "$8,000–$14,000", battery: "$11,000–$16,000", hotWater: "$2,500–$5,500" },
    { city: "Melbourne", state: "VIC", sys66kw: "$4,500–$8,500", sys10kw: "$7,500–$13,000", battery: "$10,500–$16,000", hotWater: "$2,500–$5,500" },
    { city: "Brisbane", state: "QLD", sys66kw: "$4,500–$8,000", sys10kw: "$7,500–$13,000", battery: "$10,000–$15,500", hotWater: "$2,200–$5,000" },
    { city: "Perth", state: "WA", sys66kw: "$4,500–$8,000", sys10kw: "$7,500–$13,000", battery: "$10,000–$15,500", hotWater: "$2,200–$5,000" },
    { city: "Adelaide", state: "SA", sys66kw: "$4,500–$8,000", sys10kw: "$7,500–$12,500", battery: "$10,000–$15,000", hotWater: "$2,200–$5,000" },
    { city: "Canberra", state: "ACT", sys66kw: "$5,000–$9,000", sys10kw: "$8,000–$14,000", battery: "$11,000–$16,000", hotWater: "$2,500–$5,500" },
    { city: "Hobart", state: "TAS", sys66kw: "$5,000–$9,500", sys10kw: "$8,500–$14,500", battery: "$11,000–$16,500", hotWater: "$2,500–$5,500" },
    { city: "Darwin", state: "NT", sys66kw: "$5,500–$10,000", sys10kw: "$9,000–$15,000", battery: "$12,000–$17,500", hotWater: "$3,000–$6,000" },
];

const commonJobCosts = [
    ["6.6kW solar system (after STC rebate)", "$4,500–$9,000"],
    ["10kW solar system (after STC rebate)", "$7,500–$14,000"],
    ["Solar battery (10–13kWh, installed)", "$10,000–$16,000"],
    ["Solar hot water system (installed)", "$2,200–$6,000"],
    ["Microinverter upgrade (per panel)", "$80–$180/panel"],
    ["Panel cleaning (annual service)", "$150–$350"],
    ["System health check / audit", "$150–$300"],
    ["Export limiter installation", "$300–$600"],
    ["Battery-ready system upgrade", "$500–$1,500"],
    ["EV charger + solar integration", "$1,500–$4,000"],
];

const hiringTips = [
    {
        title: "Only use CEC-accredited installers",
        body: "The STC government rebate (which reduces system cost by $2,500–$4,500) is only available if your system is installed by a Clean Energy Council (CEC) accredited installer. Always verify accreditation at the CEC website before proceeding. Unaccredited installers cannot legally issue STCs.",
        icon: BadgeCheck,
    },
    {
        title: "Compare at least 3 quotes including panel and inverter brands",
        body: "Solar quotes vary significantly by panel tier, inverter brand, and warranty terms. A valid quote must specify the panel model, inverter model, system size in kW, and expected annual output (kWh). Avoid quotes that use 'premium' or 'Tier 1' without naming specific brands — these are red flags.",
        icon: FileText,
    },
    {
        title: "Understand your feed-in tariff before sizing",
        body: "Feed-in tariffs (what your retailer pays for excess solar exported to the grid) have dropped to 5–12 cents/kWh in most Australian states. Maximising self-consumption of solar during the day — not export — is now the key to ROI. This affects whether to add a battery and what system size makes sense for your usage profile.",
        icon: ShieldCheck,
    },
    {
        title: "Check roof orientation and shading before signing",
        body: "North-facing roofs in Australia maximise solar output. East/west splits can still perform well. A good installer will conduct a shading analysis before quoting. Shade from trees, chimneys, or neighbouring structures significantly reduces performance — ensure any installer accounts for this in their production estimates.",
        icon: Star,
    },
];

const whyTradeRefer = [
    {
        title: "Verified solar businesses",
        body: "TradeRefer helps homeowners find ABN-verified, CEC-accredited solar installers — the only way to ensure your system qualifies for the STC rebate and that the installation meets Australian electrical standards.",
    },
    {
        title: "Compare costs before you call",
        body: "Use this hub to understand typical 6.6kW and 10kW system costs across Australian cities so you can benchmark any quote against your postcode's STC rebate level before committing to an installer.",
    },
    {
        title: "Australia-wide local discovery",
        body: "Navigate from this national solar installation guide into city and suburb-level pages to find CEC-accredited solar installers in the specific area where your property is located.",
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

async function getBusinessCountByState(): Promise<Record<string, number>> {
    try {
        const results = await sql<StateCountRow[]>`
            SELECT state, COUNT(*) as count FROM businesses
            WHERE status = 'active' AND (trade_category ILIKE '%solar%' OR trade_category ILIKE '%energy%') AND state IS NOT NULL
            GROUP BY state ORDER BY count DESC
        `;
        const map: Record<string, number> = {};
        results.forEach((row) => { map[row.state] = parseInt(String(row.count), 10); });
        return map;
    } catch { return {}; }
}

async function getFeaturedCityCounts(): Promise<Record<string, number>> {
    try {
        const results = await sql<CityCountRow[]>`
            SELECT city, state, COUNT(*) as count FROM businesses
            WHERE status = 'active' AND (trade_category ILIKE '%solar%' OR trade_category ILIKE '%energy%') AND city IS NOT NULL AND city != ''
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

export default async function SolarInstallationTradeHubPage() {
    const [countsByState, cityCounts] = await Promise.all([
        getBusinessCountByState(),
        getFeaturedCityCounts(),
    ]);

    const totalBusinesses = Object.values(countsByState).reduce((sum, count) => sum + count, 0);
    const statesCovered = Object.keys(countsByState).length;

    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://traderefer.au" },
            { "@type": "ListItem", position: 2, name: "Trade Guides", item: "https://traderefer.au/categories" },
            { "@type": "ListItem", position: 3, name: "Solar Installation Australia", item: "https://traderefer.au/trades/solar-installation" },
        ],
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
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            <div className="bg-[#1A1A1A] pt-32 pb-20 text-white">
                <div className="container mx-auto px-4">
                    <nav className="flex flex-wrap items-center gap-2 font-bold text-zinc-400 uppercase tracking-widest mb-8" style={{ fontSize: "16px" }}>
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <ChevronRight className="w-4 h-4" />
                        <Link href="/categories" className="hover:text-white transition-colors">Trade Guides</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-[#FF6600]">Solar Installation</span>
                    </nav>

                    <div className="max-w-4xl">
                        <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-2 font-black text-orange-400 uppercase tracking-widest mb-6" style={{ fontSize: "16px" }}>
                            <Home className="w-4 h-4" />
                            Australia-Wide Trade Hub
                        </div>
                        <h1 className="font-black mb-6 leading-[1.05] font-display text-white" style={{ fontSize: "clamp(48px, 8vw, 80px)" }}>
                            Find Verified <span className="text-[#FF6600]">Solar Installers</span> Across Australia
                        </h1>
                        <p className="text-zinc-400 max-w-3xl mb-8" style={{ fontSize: "20px", lineHeight: 1.7 }}>
                            Use this TradeRefer solar hub to compare 6.6kW and 10kW system costs across Australian cities, understand the STC government rebate,
                            and connect with verified CEC-accredited solar installers for your home or business.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link
                                href="/quotes?trade=Solar+%26+Energy&source=%2Ftrades%2Fsolar-installation"
                                className="bg-[#FF6600] hover:bg-[#E65C00] text-white font-black px-8 rounded-xl transition-colors inline-flex items-center justify-center gap-2"
                                style={{ minHeight: "64px", fontSize: "18px" }}
                            >
                                Get 3 Free Quotes
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                href="/businesses?category=Solar+%26+Energy"
                                className="bg-white/10 hover:bg-white/20 text-white font-black px-8 rounded-xl transition-colors border border-white/10 inline-flex items-center justify-center"
                                style={{ minHeight: "64px", fontSize: "18px" }}
                            >
                                Browse Solar Installers
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
                            <span className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-[#FF6600]" />6.6kW from ${cost.low.toLocaleString()}–${cost.high.toLocaleString()} after rebate</span>
                            {totalBusinesses > 0 && (
                                <span className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-[#FF6600]" />{totalBusinesses.toLocaleString()} solar businesses listed</span>
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
                            Solar Installation Cost Guide Australia
                        </h2>
                        <p className="text-zinc-500 mb-8" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                            Solar costs shown below are after the federal STC rebate, which reduces prices by $2,500–$4,500 for typical residential systems. Rebate amounts vary by postcode (STC zone) and current STC market price.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                                <p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>6.6kW System (most popular)</p>
                                <p className="text-3xl font-black text-zinc-900">$4.5k–$9k</p>
                                <p className="text-zinc-500" style={{ fontSize: "16px" }}>after STC rebate, installed</p>
                            </div>
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                                <p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>10kW System</p>
                                <p className="text-3xl font-black text-zinc-900">$7.5k–$14k</p>
                                <p className="text-zinc-500" style={{ fontSize: "16px" }}>after STC rebate, installed</p>
                            </div>
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                                <p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Typical Payback</p>
                                <p className="text-3xl font-black text-zinc-900">3–6 yrs</p>
                                <p className="text-zinc-500" style={{ fontSize: "16px" }}>system life 25–30 years</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                            <table className="min-w-full text-left">
                                <thead className="bg-zinc-100 text-zinc-700">
                                    <tr>
                                        <th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>City</th>
                                        <th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>6.6kW System</th>
                                        <th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>10kW System</th>
                                        <th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>+ Battery</th>
                                        <th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Solar Hot Water</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cityPricing.map((row) => (
                                        <tr key={`${row.city}-${row.state}`} className="border-t border-zinc-200 bg-white">
                                            <td className="px-4 py-3 font-bold text-zinc-900" style={{ fontSize: "16px" }}>{row.city}</td>
                                            <td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.sys66kw}</td>
                                            <td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.sys10kw}</td>
                                            <td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.battery}</td>
                                            <td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.hotWater}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-8">
                            <h3 className="font-black text-zinc-900 mb-4 font-display" style={{ fontSize: "24px" }}>Common Solar Job Costs</h3>
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
                                Solar Services We Cover
                            </h2>
                            <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                                TradeRefer&apos;s solar hub covers solar panel installation, battery storage, solar hot water, EV charger integration, and system health checks Australia-wide.
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
                                Before You Hire a Solar Installer
                            </h2>
                            <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                                Use these checks to ensure your system qualifies for the STC rebate, is correctly sized, and uses quality hardware.
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
                            Find Solar Installers by City
                        </h2>
                        <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                            Browse the major Australian cities where TradeRefer has solar businesses listed, then drill into suburb-level pages from there.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {featuredCities.map(({ city, state, stateSlug, citySlug }) => {
                                const count = cityCounts[`${city.toLowerCase()}::${state}`] || 0;
                                return (
                                    <Link
                                        key={`${city}-${state}`}
                                        href={`/local/${stateSlug}/${citySlug}?category=${encodeURIComponent("Solar & Energy")}`}
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
                            <h2 className="font-black text-[#1A1A1A] mb-3 font-display" style={{ fontSize: "32px" }}>Get 3 Free Solar Quotes</h2>
                            <p className="text-zinc-500" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                                Request your solar quotes here and we&apos;ll match your project with up to 3 verified local CEC-accredited solar installers.
                            </p>
                        </div>
                        <PublicMultiQuoteForm initialTradeCategory="Solar & Energy" initialSourcePage="/trades/solar-installation" />
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}>
                            <FileText className="w-6 h-6 text-blue-500" />
                            Solar Licensing Requirements by State
                        </h2>
                        <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>
                            Solar installation requires an electrician&apos;s licence in all Australian states. CEC accreditation is additionally required for STC rebate eligibility.
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
                            Solar Installation: Frequently Asked Questions
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
                            Explore adjacent trade categories that homeowners frequently research alongside solar installation.
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
                        <h2 className="font-black mb-4 text-white" style={{ fontSize: "40px" }}>Get Solar Quotes From Local Installers</h2>
                        <p className="text-zinc-400 mb-8 max-w-2xl mx-auto" style={{ fontSize: "20px", lineHeight: 1.7 }}>
                            Browse verified CEC-accredited solar businesses, compare system sizes and battery options, and find the right solar installer to reduce your energy bills.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link
                                href="/quotes?trade=Solar+%26+Energy&source=%2Ftrades%2Fsolar-installation"
                                className="inline-flex items-center gap-2 bg-[#FF6600] hover:bg-[#E65C00] text-white font-black rounded-xl px-8 transition-colors"
                                style={{ minHeight: "64px", fontSize: "18px" }}
                            >
                                Get 3 Free Quotes <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                href="/businesses?category=Solar+%26+Energy"
                                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-black rounded-xl px-8 transition-colors border border-white/10"
                                style={{ minHeight: "64px", fontSize: "18px" }}
                            >
                                Browse Solar Installers
                            </Link>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
