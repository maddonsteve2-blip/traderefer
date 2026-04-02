import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, ChevronRight, Clock3, DollarSign, FileText, Home, MapPin, ShieldCheck, Star, Wrench } from "lucide-react";
import { sql } from "@/lib/db";
import { JOB_TYPES, STATE_LICENSING, TRADE_COST_GUIDE, TRADE_FAQ_BANK, jobToSlug } from "@/lib/constants";
import { PublicMultiQuoteForm } from "@/components/PublicMultiQuoteForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Irrigation Services Australia | Find Verified Irrigation Contractors | TradeRefer",
    description: "Find trusted irrigation contractors across Australia. Compare drip, pop-up, and automatic irrigation system costs by city, and hire verified local irrigation businesses through TradeRefer.",
    alternates: { canonical: "https://traderefer.au/trades/irrigation" },
    openGraph: { title: "Irrigation Services Australia | TradeRefer", description: "Compare irrigation system costs, automated watering pricing, and verified local irrigation contractors across Australia.", url: "https://traderefer.au/trades/irrigation", type: "website" },
};

const TRADE_NAME = "Irrigation";
const cost = TRADE_COST_GUIDE[TRADE_NAME];
const faqs = TRADE_FAQ_BANK[TRADE_NAME]?.slice(0, 6) ?? [];
const services = JOB_TYPES[TRADE_NAME]?.slice(0, 12) ?? [];
const relatedTrades = [
    { label: "Landscaping", href: "/trades/landscaping" },
    { label: "Plumbing", href: "/trades/plumbing" },
    { label: "Gardening & Lawn Care", href: "/categories#gardening" },
    { label: "Concreting", href: "/trades/concreting" },
    { label: "Fencing", href: "/trades/fencing" },
    { label: "Building", href: "/categories#building" },
];
const cityPricing = [
    { city: "Sydney", state: "NSW", smallYard: "$1,500–$3,500", medYard: "$3,000–$7,000", drip: "$1,200–$3,000", controller: "$300–$800" },
    { city: "Melbourne", state: "VIC", smallYard: "$1,400–$3,200", medYard: "$2,800–$6,500", drip: "$1,100–$2,800", controller: "$280–$750" },
    { city: "Brisbane", state: "QLD", smallYard: "$1,300–$3,000", medYard: "$2,600–$6,000", drip: "$1,000–$2,600", controller: "$260–$700" },
    { city: "Perth", state: "WA", smallYard: "$1,500–$3,500", medYard: "$3,000–$7,000", drip: "$1,200–$3,000", controller: "$300–$800" },
    { city: "Adelaide", state: "SA", smallYard: "$1,300–$3,000", medYard: "$2,600–$6,000", drip: "$1,000–$2,600", controller: "$260–$700" },
    { city: "Canberra", state: "ACT", smallYard: "$1,500–$3,500", medYard: "$3,000–$7,000", drip: "$1,200–$3,000", controller: "$300–$800" },
    { city: "Hobart", state: "TAS", smallYard: "$1,400–$3,200", medYard: "$2,800–$6,500", drip: "$1,100–$2,800", controller: "$280–$750" },
    { city: "Darwin", state: "NT", smallYard: "$1,600–$3,800", medYard: "$3,200–$7,500", drip: "$1,300–$3,200", controller: "$320–$850" },
];
const commonJobCosts = [
    ["Pop-up lawn sprinkler system (small yard)", "$1,200–$3,500"],
    ["Drip irrigation – garden beds (per zone)", "$400–$1,200"],
    ["Automatic controller + 4 zones", "$800–$2,000"],
    ["Smart irrigation controller (Wi-Fi)", "$300–$800"],
    { 0: "Rain sensor installation", 1: "$150–$350" },
    ["Backflow prevention device (required)", "$300–$700"],
    ["Irrigation audit / inspection", "$150–$350"],
    ["Winterisation / blow-out service", "$80–$200"],
    ["Existing system repair / re-head", "$150–$450"],
    ["Commercial/sports field irrigation", "$8,000–$50,000+"],
].map(item => Array.isArray(item) ? item : [item[0], item[1]]) as string[][];
const hiringTips = [
    { title: "Backflow prevention is legally required in most states", body: "Any irrigation system connected to the mains water supply must have a council-approved backflow prevention device installed by a licensed plumber. Without it you're non-compliant with water authority bylaws and your system may be disconnected. Confirm this is included — not assumed — in your quote.", icon: BadgeCheck },
    { title: "Zone your system for different plant water needs", body: "A well-designed irrigation system separates lawn, garden beds, and natives into separate zones so each can receive appropriate water volumes and frequency. A single 'whole garden' zone is inefficient — request zone-based design and ask how run times for each zone will be set during commissioning.", icon: FileText },
    { title: "Include a rain sensor or smart controller", body: "A rain sensor ($150–$350) prevents the system running after rainfall. A smart Wi-Fi controller ($300–$800) adjusts scheduling based on local weather forecasts. In WELS-rated states (WA, VIC, SA) smart controllers may be a rebate-eligible upgrade. These pay back in water savings within 1–2 seasons.", icon: ShieldCheck },
    { title: "Ask about warranty on heads, valves, and controller", body: "Quality components (Rain Bird, Hunter, Toro) carry 2–5 year part warranties. Labour warranties vary from 12 months to 2 years. Request brand names for heads, valves, and controller — avoid quotes that list only 'quality components' without specifying brands.", icon: Star },
];
const whyTradeRefer = [
    { title: "Verified irrigation businesses", body: "TradeRefer helps homeowners and commercial property managers find ABN-verified irrigation contractors who meet backflow prevention requirements and design systems for water efficiency." },
    { title: "Compare costs before you call", body: "Use this hub to understand typical irrigation system costs across Australian cities so you can benchmark design and installation quotes before committing to a contractor." },
    { title: "Australia-wide local discovery", body: "Navigate from this national irrigation guide into city and suburb-level pages to find verified irrigation businesses in the specific area where your property is located." },
];
const customFaqs = [
    { q: "How much does a home irrigation system cost in Australia?", a: "A pop-up lawn sprinkler system for a small to medium backyard costs $1,200–$4,500 installed, depending on zone count, pipe run length, and controller type. Drip irrigation for garden beds adds $400–$1,200 per zone. Full front and back yard automated systems with smart controllers typically cost $3,500–$8,000." },
    { q: "Do I need a plumber to install an irrigation system?", a: "In all Australian states, the connection from the mains water supply to the irrigation system must be made by a licensed plumber, who also installs the required backflow prevention device. The distribution pipework and heads can be installed by an irrigation contractor. Many irrigation specialists hold both licences." },
    { q: "How long does a home irrigation system last?", a: "Quality irrigation components last 10–15+ years with regular maintenance. Solenoid valves typically need replacement every 7–12 years. Sprinkler heads may need replacement every 5–10 years. Controllers can last 10–15 years. Annual servicing and seasonal adjustments significantly extend system lifespan." },
    { q: "What are the water restrictions rules for irrigation in Australia?", a: "Water restrictions vary by state and local water authority. Most areas have year-round restrictions on sprinkler days and times — typically restricted to 2–3 set days/times per week, with no watering during the hottest parts of the day. Drip irrigation and hand watering are usually exempt from restrictions. Check your water authority's current restrictions before programming your system." },
    { q: "What is drip irrigation and when should I use it?", a: "Drip irrigation delivers water directly to the root zone of plants via emitters on low-pressure poly tubing. It uses 30–50% less water than sprinklers and is ideal for garden beds, native plants, vegetables, and trees. It's generally exempt from water restrictions. For lawns, pop-up sprinklers remain the standard option." },
    { q: "How often should I service my irrigation system?", a: "Annual servicing (spring or pre-summer) is recommended — checking for broken heads, blocked emitters, solenoid valve performance, controller programming, and water coverage. A seasonal service costs $80–$200 and prevents expensive head and valve failures during peak summer use." },
];
const activeFaqs = faqs.length > 0 ? faqs : customFaqs;

type StateCountRow = { state: string; count: string | number };
type CityCountRow = { city: string; state: string; count: string | number };
async function getBusinessCountByState(): Promise<Record<string, number>> {
    try {
        const results = await sql<StateCountRow[]>`SELECT state, COUNT(*) as count FROM businesses WHERE status = 'active' AND trade_category ILIKE ${"%" + TRADE_NAME + "%"} AND state IS NOT NULL GROUP BY state ORDER BY count DESC`;
        const map: Record<string, number> = {};
        results.forEach((row) => { map[row.state] = parseInt(String(row.count), 10); });
        return map;
    } catch { return {}; }
}
async function getFeaturedCityCounts(): Promise<Record<string, number>> {
    try {
        const results = await sql<CityCountRow[]>`SELECT city, state, COUNT(*) as count FROM businesses WHERE status = 'active' AND trade_category ILIKE ${"%" + TRADE_NAME + "%"} AND city IS NOT NULL AND city != '' GROUP BY city, state`;
        const map: Record<string, number> = {};
        results.forEach((row) => { map[`${String(row.city).toLowerCase()}::${String(row.state).toUpperCase()}`] = parseInt(String(row.count), 10); });
        return map;
    } catch { return {}; }
}

export default async function IrrigationTradeHubPage() {
    const [countsByState, cityCounts] = await Promise.all([getBusinessCountByState(), getFeaturedCityCounts()]);
    const totalBusinesses = Object.values(countsByState).reduce((sum, count) => sum + count, 0);
    const statesCovered = Object.keys(countsByState).length;
    const faqJsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: activeFaqs.map((faq) => ({ "@type": "Question", name: faq.q, acceptedAnswer: { "@type": "Answer", text: faq.a } })) };

    return (
        <main className="min-h-screen bg-zinc-50">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
            <div className="bg-[#1A1A1A] pt-32 pb-20 text-white">
                <div className="container mx-auto px-4">
                    <nav className="flex flex-wrap items-center gap-2 font-bold text-zinc-400 uppercase tracking-widest mb-8" style={{ fontSize: "16px" }}>
                        <Link href="/" className="hover:text-white transition-colors">Home</Link><ChevronRight className="w-4 h-4" />
                        <Link href="/categories" className="hover:text-white transition-colors">Trade Guides</Link><ChevronRight className="w-4 h-4" />
                        <span className="text-[#FF6600]">Irrigation</span>
                    </nav>
                    <div className="max-w-4xl">
                        <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-2 font-black text-orange-400 uppercase tracking-widest mb-6" style={{ fontSize: "16px" }}><Home className="w-4 h-4" />Australia-Wide Trade Hub</div>
                        <h1 className="font-black mb-6 leading-[1.05] font-display text-white" style={{ fontSize: "clamp(48px, 8vw, 80px)" }}>Find Verified <span className="text-[#FF6600]">Irrigation</span> Contractors Across Australia</h1>
                        <p className="text-zinc-400 max-w-3xl mb-8" style={{ fontSize: "20px", lineHeight: 1.7 }}>Use this TradeRefer irrigation hub to compare automated watering system costs across Australian cities, understand backflow prevention requirements, and connect with verified local irrigation businesses.</p>
                        <div className="flex flex-wrap gap-4">
                            <Link href={`/quotes?trade=${encodeURIComponent(TRADE_NAME)}&source=%2Ftrades%2Firrigation`} className="bg-[#FF6600] hover:bg-[#E65C00] text-white font-black px-8 rounded-xl transition-colors inline-flex items-center justify-center gap-2" style={{ minHeight: "64px", fontSize: "18px" }}>Get 3 Free Quotes<ArrowRight className="w-5 h-5" /></Link>
                            <Link href={`/businesses?category=${encodeURIComponent(TRADE_NAME)}`} className="bg-white/10 hover:bg-white/20 text-white font-black px-8 rounded-xl transition-colors border border-white/10 inline-flex items-center justify-center" style={{ minHeight: "64px", fontSize: "18px" }}>Browse Irrigation Contractors</Link>
                            <Link href="/local" className="bg-white/10 hover:bg-white/20 text-white font-black px-8 rounded-xl transition-colors border border-white/10 inline-flex items-center justify-center" style={{ minHeight: "64px", fontSize: "18px" }}>Browse by Location</Link>
                        </div>
                        <div className="flex flex-wrap gap-6 text-white font-bold mt-8" style={{ fontSize: "16px" }}>
                            {cost && <span className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-[#FF6600]" />Systems from ${cost.low?.toLocaleString()}–${cost.high?.toLocaleString()}{cost.unit}</span>}
                            {totalBusinesses > 0 && <span className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-[#FF6600]" />{totalBusinesses.toLocaleString()} irrigation businesses listed</span>}
                            {statesCovered > 0 && <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#FF6600]" />Available in {statesCovered} states & territories</span>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16">
                <div className="max-w-6xl mx-auto space-y-16">
                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><DollarSign className="w-6 h-6 text-[#FF6600]" />Irrigation Cost Guide Australia</h2>
                        <p className="text-zinc-500 mb-8" style={{ fontSize: "18px", lineHeight: 1.7 }}>Irrigation system costs vary by yard size, zone count, pipe run length, controller type, and whether a licensed plumber is required for mains connection. All systems require a backflow prevention device by law.</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100"><p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Small Yard System</p><p className="text-3xl font-black text-zinc-900">$1,200–$3,500</p><p className="text-zinc-500" style={{ fontSize: "16px" }}>pop-up lawn + 2 zones</p></div>
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100"><p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Medium Yard System</p><p className="text-3xl font-black text-zinc-900">$3,000–$7,000</p><p className="text-zinc-500" style={{ fontSize: "16px" }}>lawn + garden, 4–6 zones</p></div>
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100"><p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Backflow Device</p><p className="text-3xl font-black text-zinc-900">$300–$700</p><p className="text-zinc-500" style={{ fontSize: "16px" }}>legally required by law</p></div>
                        </div>
                        <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                            <table className="min-w-full text-left">
                                <thead className="bg-zinc-100 text-zinc-700"><tr><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>City</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Small Yard</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Medium Yard</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Drip System</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Smart Controller</th></tr></thead>
                                <tbody>{cityPricing.map((row) => (<tr key={row.city} className="border-t border-zinc-200 bg-white"><td className="px-4 py-3 font-bold text-zinc-900" style={{ fontSize: "16px" }}>{row.city}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.smallYard}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.medYard}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.drip}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.controller}</td></tr>))}</tbody>
                            </table>
                        </div>
                        <div className="mt-8">
                            <h3 className="font-black text-zinc-900 mb-4 font-display" style={{ fontSize: "24px" }}>Common Irrigation Job Costs</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{commonJobCosts.map(([label, value]) => (<div key={label} className="flex items-center justify-between bg-zinc-50 rounded-2xl border border-zinc-100 px-5 py-4 gap-4"><span className="font-bold text-zinc-700" style={{ fontSize: "16px" }}>{label}</span><span className="font-black text-zinc-900 whitespace-nowrap" style={{ fontSize: "16px" }}>{value}</span></div>))}</div>
                        </div>
                    </section>

                    <section className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8">
                        <div className="bg-white rounded-3xl border border-zinc-200 p-8">
                            <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><Wrench className="w-6 h-6 text-[#FF6600]" />Irrigation Services We Cover</h2>
                            <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>TradeRefer&apos;s irrigation hub covers pop-up lawn systems, drip irrigation, automatic controllers, smart watering, commercial irrigation, and system servicing Australia-wide.</p>
                            {services.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{services.map((service) => (<Link key={service} href={`/trades/${jobToSlug(service)}`} className="flex items-center justify-between px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl font-bold text-zinc-700 hover:bg-orange-50 hover:border-[#FF6600] hover:text-[#FF6600] transition-colors capitalize" style={{ fontSize: "16px" }}><span>{service}</span><ArrowRight className="w-4 h-4 text-zinc-300" /></Link>))}</div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{["Pop-up lawn irrigation", "Drip irrigation", "Automatic controllers", "Smart Wi-Fi controllers", "Rain sensors", "Backflow prevention", "Commercial irrigation", "Sports field irrigation", "System servicing", "Irrigation repairs"].map((s) => (<div key={s} className="px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl font-bold text-zinc-700 capitalize" style={{ fontSize: "16px" }}>{s}</div>))}</div>
                            )}
                        </div>
                        <div className="bg-white rounded-3xl border border-zinc-200 p-8">
                            <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "28px" }}><Clock3 className="w-5 h-5 text-blue-500" />Before You Hire an Irrigation Contractor</h2>
                            <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>Use these checks to ensure backflow compliance, efficient zone design, and quality components with warranty coverage.</p>
                            <div className="space-y-4">{hiringTips.map(({ title, body, icon: Icon }) => (<div key={title} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-5"><div className="flex items-start gap-3 mb-2"><div className="w-10 h-10 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center shrink-0"><Icon className="w-5 h-5 text-[#FF6600]" /></div><h3 className="font-black text-zinc-900" style={{ fontSize: "18px" }}>{title}</h3></div><p className="text-zinc-600" style={{ fontSize: "16px", lineHeight: 1.7 }}>{body}</p></div>))}</div>
                        </div>
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><MapPin className="w-6 h-6 text-[#FF6600]" />Find Irrigation Contractors by City</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{[
                            { city: "Sydney", state: "NSW", stateSlug: "nsw", citySlug: "sydney" },
                            { city: "Melbourne", state: "VIC", stateSlug: "vic", citySlug: "melbourne" },
                            { city: "Brisbane", state: "QLD", stateSlug: "qld", citySlug: "brisbane" },
                            { city: "Perth", state: "WA", stateSlug: "wa", citySlug: "perth" },
                            { city: "Adelaide", state: "SA", stateSlug: "sa", citySlug: "adelaide" },
                            { city: "Gold Coast", state: "QLD", stateSlug: "qld", citySlug: "gold-coast" },
                            { city: "Newcastle", state: "NSW", stateSlug: "nsw", citySlug: "newcastle" },
                            { city: "Canberra", state: "ACT", stateSlug: "act", citySlug: "canberra" },
                        ].map(({ city, state, stateSlug, citySlug }) => { const count = cityCounts[`${city.toLowerCase()}::${state}`] || 0; return (<Link key={`${city}-${state}`} href={`/local/${stateSlug}/${citySlug}?category=${encodeURIComponent(TRADE_NAME)}`} className="flex items-center justify-between px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl hover:bg-orange-50 hover:border-[#FF6600] transition-colors group"><div><span className="font-black text-zinc-900 group-hover:text-[#FF6600]" style={{ fontSize: "16px" }}>{city}</span><p className="text-zinc-400" style={{ fontSize: "16px" }}>{state} · {count > 0 ? `${count} listed` : "Browse local directory"}</p></div><ArrowRight className="w-5 h-5 text-zinc-300 group-hover:text-[#FF6600]" /></Link>); })}</div>
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <div className="max-w-3xl mb-8"><h2 className="font-black text-[#1A1A1A] mb-3 font-display" style={{ fontSize: "32px" }}>Get 3 Free Irrigation Quotes</h2><p className="text-zinc-500" style={{ fontSize: "18px", lineHeight: 1.7 }}>Request quotes here and we&apos;ll match your project with up to 3 verified local irrigation businesses.</p></div>
                        <PublicMultiQuoteForm initialTradeCategory={TRADE_NAME} initialSourcePage="/trades/irrigation" />
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><FileText className="w-6 h-6 text-blue-500" />Irrigation Licensing Requirements by State</h2>
                        <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>Mains water connections and backflow prevention device installation require a licensed plumber in all Australian states. Irrigation system design and distribution is largely unregulated but backflow compliance is mandatory.</p>
                        <div className="space-y-3">{Object.entries(STATE_LICENSING[TRADE_NAME] ?? {}).map(([stateCode, text]) => (<div key={stateCode} className="bg-blue-50 border border-blue-100 rounded-2xl p-5"><p className="font-black text-blue-600 uppercase tracking-wider mb-2" style={{ fontSize: "14px" }}>{stateCode}</p><p className="text-zinc-700" style={{ fontSize: "16px", lineHeight: 1.7 }}>{text as string}</p></div>))}</div>
                    </section>

                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">{whyTradeRefer.map((item) => (<div key={item.title} className="bg-white rounded-3xl border border-zinc-200 p-8"><h2 className="font-black text-[#1A1A1A] mb-3 font-display" style={{ fontSize: "24px" }}>{item.title}</h2><p className="text-zinc-600" style={{ fontSize: "16px", lineHeight: 1.7 }}>{item.body}</p></div>))}</section>

                    <section>
                        <h2 className="font-black text-[#1A1A1A] mb-8 font-display" style={{ fontSize: "32px" }}>Irrigation: Frequently Asked Questions</h2>
                        <div className="space-y-4">{activeFaqs.map((faq) => (<div key={faq.q} className="bg-white rounded-2xl border border-zinc-200 p-6"><h3 className="font-black text-zinc-900 mb-2" style={{ fontSize: "18px" }}>{faq.q}</h3><p className="text-zinc-600" style={{ fontSize: "16px", lineHeight: 1.7 }}>{faq.a}</p></div>))}</div>
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "28px" }}><Wrench className="w-5 h-5 text-[#FF6600]" />Related Trade Guides</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{relatedTrades.map((trade) => (<Link key={trade.href} href={trade.href} className="flex items-center justify-between px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl font-bold text-zinc-700 hover:bg-orange-50 hover:border-[#FF6600] hover:text-[#FF6600] transition-colors" style={{ fontSize: "16px" }}><span>{trade.label}</span><ArrowRight className="w-4 h-4 text-zinc-300" /></Link>))}</div>
                    </section>

                    <section className="bg-[#1A1A1A] rounded-3xl p-8 md:p-12 text-center text-white">
                        <h2 className="font-black mb-4 text-white" style={{ fontSize: "40px" }}>Need an Irrigation Contractor Near You?</h2>
                        <p className="text-zinc-400 mb-8 max-w-2xl mx-auto" style={{ fontSize: "20px", lineHeight: 1.7 }}>Browse verified local irrigation businesses and find the right contractor for your lawn sprinkler, drip irrigation, or automated watering system project.</p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link href={`/quotes?trade=${encodeURIComponent(TRADE_NAME)}&source=%2Ftrades%2Firrigation`} className="inline-flex items-center gap-2 bg-[#FF6600] hover:bg-[#E65C00] text-white font-black rounded-xl px-8 transition-colors" style={{ minHeight: "64px", fontSize: "18px" }}>Get 3 Free Quotes <ArrowRight className="w-5 h-5" /></Link>
                            <Link href={`/businesses?category=${encodeURIComponent(TRADE_NAME)}`} className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-black rounded-xl px-8 transition-colors border border-white/10" style={{ minHeight: "64px", fontSize: "18px" }}>Browse Irrigation Contractors</Link>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
