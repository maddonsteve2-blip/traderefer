import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, ChevronRight, Clock3, DollarSign, FileText, Home, MapPin, ShieldCheck, Star, Wrench } from "lucide-react";
import { sql } from "@/lib/db";
import { JOB_TYPES, STATE_LICENSING, TRADE_COST_GUIDE, TRADE_FAQ_BANK, jobToSlug } from "@/lib/constants";
import { PublicMultiQuoteForm } from "@/components/PublicMultiQuoteForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Cabinet Making Services Australia | Find Verified Cabinet Makers | TradeRefer",
    description: "Find trusted cabinet makers across Australia. Compare custom kitchen, bathroom vanity, and wardrobe cabinet costs by city, and hire verified local cabinet making businesses through TradeRefer.",
    alternates: { canonical: "https://traderefer.au/trades/cabinet-making" },
    openGraph: { title: "Cabinet Making Services Australia | TradeRefer", description: "Compare custom cabinet costs, kitchen joinery pricing, and verified local cabinet makers across Australia.", url: "https://traderefer.au/trades/cabinet-making", type: "website" },
};

const TRADE_NAME = "Cabinet Making";
const cost = TRADE_COST_GUIDE[TRADE_NAME];
const faqs = TRADE_FAQ_BANK[TRADE_NAME]?.slice(0, 6) ?? [];
const services = JOB_TYPES[TRADE_NAME]?.slice(0, 12) ?? [];
const relatedTrades = [
    { label: "Kitchen Renovation", href: "/categories#kitchen-renovation" },
    { label: "Bathroom Renovation", href: "/categories#bathroom-renovation" },
    { label: "Carpentry", href: "/trades/carpentry" },
    { label: "Tiling", href: "/trades/tiling" },
    { label: "Painting", href: "/trades/painting" },
    { label: "Flooring", href: "/trades/flooring" },
];
const cityPricing = [
    { city: "Sydney", state: "NSW", kitchenLm: "$800–$1,800/lm", vanity: "$600–$2,000", wardrobe: "$1,500–$4,500", laundry: "$1,200–$3,000" },
    { city: "Melbourne", state: "VIC", kitchenLm: "$750–$1,700/lm", vanity: "$550–$1,900", wardrobe: "$1,400–$4,200", laundry: "$1,100–$2,800" },
    { city: "Brisbane", state: "QLD", kitchenLm: "$700–$1,600/lm", vanity: "$500–$1,800", wardrobe: "$1,300–$4,000", laundry: "$1,000–$2,600" },
    { city: "Perth", state: "WA", kitchenLm: "$750–$1,700/lm", vanity: "$550–$1,900", wardrobe: "$1,400–$4,200", laundry: "$1,100–$2,800" },
    { city: "Adelaide", state: "SA", kitchenLm: "$700–$1,600/lm", vanity: "$500–$1,700", wardrobe: "$1,200–$3,800", laundry: "$1,000–$2,500" },
    { city: "Canberra", state: "ACT", kitchenLm: "$800–$1,800/lm", vanity: "$600–$2,000", wardrobe: "$1,500–$4,500", laundry: "$1,200–$3,000" },
    { city: "Hobart", state: "TAS", kitchenLm: "$750–$1,750/lm", vanity: "$550–$1,950", wardrobe: "$1,400–$4,300", laundry: "$1,100–$2,900" },
    { city: "Darwin", state: "NT", kitchenLm: "$900–$2,000/lm", vanity: "$650–$2,200", wardrobe: "$1,600–$5,000", laundry: "$1,300–$3,500" },
];
const commonJobCosts = [
    ["Kitchen cabinets – per linear metre (supply & install)", "$700–$1,800/lm"],
    ["Full kitchen joinery (3m run)", "$4,500–$12,000"],
    ["Walk-in robe (3×2.4m)", "$2,500–$8,000"],
    ["Built-in wardrobe (standard, per linear metre)", "$400–$900/lm"],
    ["Bathroom vanity (custom)", "$600–$2,500"],
    ["Laundry cabinets (full fit)", "$1,000–$3,500"],
    ["Home office built-in joinery", "$2,000–$6,000"],
    ["Entertainment unit / built-in shelving (per lm)", "$400–$900/lm"],
    ["Cabinet door replacement (per door)", "$100–$350"],
    ["Bench top supply & install (per lm)", "$200–$800/lm"],
];
const hiringTips = [
    { title: "Confirm the material and substrate in writing", body: "Cabinet pricing varies enormously based on board type: moisture-resistant (MR) MDF, HMR (high moisture resistant), solid timber, or plywood carcass. Specify exactly what board and door material will be used — 'kitchen cabinets' without a substrate specification is not a quote, it's a placeholder.", icon: BadgeCheck },
    { title: "Check whether design and installation are included", body: "Some cabinet makers quote supply-only — you then need a separate installer (tradesperson). Others quote full supply and install. Design drawings are sometimes an additional fee. Ensure you understand whether drafting, site visit, delivery, installation, and fixings are all included in the quoted price.", icon: FileText },
    { title: "Ask about warranty on doors, drawers, and hardware", body: "Quality cabinet hardware (Blum, Hettich, Häfele) carries a 10-year mechanical warranty. Doors and carcasses should carry at least 5 years. Ask specifically what the warranty covers and what it doesn't — and get it in writing before signing the deposit agreement.", icon: ShieldCheck },
    { title: "Confirm lead times before committing", body: "Custom cabinetry is typically made-to-order with 4–10 week lead times. Confirm the production and installation timeline before signing. Delays in cabinets cascade into delays for tiling, electrical, and plumbing — especially on kitchen and bathroom renovation projects.", icon: Star },
];
const whyTradeRefer = [
    { title: "Verified cabinet making businesses", body: "TradeRefer helps homeowners find ABN-verified cabinet makers for kitchen, bathroom, and wardrobe joinery — important for large renovation projects where design quality, material specifications, and warranty terms significantly affect the outcome." },
    { title: "Compare costs before you call", body: "Use this hub to understand typical cabinet making costs per linear metre across Australian cities so you can benchmark any joinery quote before committing to a cabinet maker." },
    { title: "Australia-wide local discovery", body: "Navigate from this national cabinet making guide into city and suburb-level pages to find verified cabinet making businesses operating in the specific area where your renovation is located." },
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
const customFaqs = [
    { q: "How much does a full kitchen cabinet fit-out cost in Australia?", a: "A full kitchen cabinet fit-out (supply and install) for a 4–5 metre run in an average home ranges from $8,000–$20,000 depending on material, door style, hardware, and benchtop. Semi-custom kitchens from major suppliers cost $10,000–$25,000 installed. Fully custom joinery starts from $15,000." },
    { q: "What's the difference between flat-pack and custom cabinets?", a: "Flat-pack cabinets (IKEA, Kaboodle) are pre-manufactured and assembled on site — lower cost ($200–$500/lm) but limited sizing and material options. Custom cabinets are made to specific dimensions and specifications by a cabinet maker — higher cost ($700–$1,800/lm) but exact fit, better materials, and longer lifespan." },
    { q: "How long does custom cabinet making take?", a: "Custom cabinets are typically made-to-order with 4–10 week production times. Installation usually takes 1–3 days for a kitchen or 1–2 days for a wardrobe. Allow additional time for benchtop templating (post-cabinet install) and splashback tiling if applicable." },
    { q: "Do cabinet makers supply the bench top?", a: "Many cabinet makers offer bench tops as part of the full package — stone benchtops, laminate, timber, or solid surface. Bench top supply and installation is often quoted separately as it involves templating after cabinet installation. Confirm whether benchtop is included or a separate subcontract." },
    { q: "What board material should I specify for bathroom cabinets?", a: "For wet areas, specify HMR (high moisture resistant) MDF board as a minimum. Standard MDF swells when exposed to humidity. For vanities directly adjacent to showers or in highly humid environments, consider marine plywood carcasses. This should be specified in writing — not assumed." },
    { q: "Can I supply my own cabinet hardware for a cabinet maker to use?", a: "Most cabinet makers have preferred hardware suppliers and may charge a premium or refuse to use customer-supplied hardware to maintain their warranty obligations. If you want specific hardware (e.g., touch-to-open, specific handle profile), discuss this during the quote stage — not after the contract is signed." },
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

export default async function CabinetMakingTradeHubPage() {
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
                        <span className="text-[#FF6600]">Cabinet Making</span>
                    </nav>
                    <div className="max-w-4xl">
                        <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-2 font-black text-orange-400 uppercase tracking-widest mb-6" style={{ fontSize: "16px" }}><Home className="w-4 h-4" />Australia-Wide Trade Hub</div>
                        <h1 className="font-black mb-6 leading-[1.05] font-display text-white" style={{ fontSize: "clamp(48px, 8vw, 80px)" }}>Find Verified <span className="text-[#FF6600]">Cabinet Makers</span> Across Australia</h1>
                        <p className="text-zinc-400 max-w-3xl mb-8" style={{ fontSize: "20px", lineHeight: 1.7 }}>Use this TradeRefer cabinet making hub to compare custom kitchen, bathroom vanity, and wardrobe costs across Australian cities, and connect with verified local cabinet makers for your renovation.</p>
                        <div className="flex flex-wrap gap-4">
                            <Link href={`/quotes?trade=${encodeURIComponent(TRADE_NAME)}&source=%2Ftrades%2Fcabinet-making`} className="bg-[#FF6600] hover:bg-[#E65C00] text-white font-black px-8 rounded-xl transition-colors inline-flex items-center justify-center gap-2" style={{ minHeight: "64px", fontSize: "18px" }}>Get 3 Free Quotes<ArrowRight className="w-5 h-5" /></Link>
                            <Link href={`/businesses?category=${encodeURIComponent(TRADE_NAME)}`} className="bg-white/10 hover:bg-white/20 text-white font-black px-8 rounded-xl transition-colors border border-white/10 inline-flex items-center justify-center" style={{ minHeight: "64px", fontSize: "18px" }}>Browse Cabinet Makers</Link>
                            <Link href="/local" className="bg-white/10 hover:bg-white/20 text-white font-black px-8 rounded-xl transition-colors border border-white/10 inline-flex items-center justify-center" style={{ minHeight: "64px", fontSize: "18px" }}>Browse by Location</Link>
                        </div>
                        <div className="flex flex-wrap gap-6 text-white font-bold mt-8" style={{ fontSize: "16px" }}>
                            {cost && <span className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-[#FF6600]" />Kitchen from ${cost.low}–${cost.high}{cost.unit}</span>}
                            {totalBusinesses > 0 && <span className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-[#FF6600]" />{totalBusinesses.toLocaleString()} cabinet making businesses listed</span>}
                            {statesCovered > 0 && <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#FF6600]" />Available in {statesCovered} states & territories</span>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16">
                <div className="max-w-6xl mx-auto space-y-16">
                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><DollarSign className="w-6 h-6 text-[#FF6600]" />Cabinet Making Cost Guide Australia</h2>
                        <p className="text-zinc-500 mb-8" style={{ fontSize: "18px", lineHeight: 1.7 }}>Custom cabinet costs vary by material, door profile, hardware quality, and whether benchtops are included. Use these per-linear-metre benchmarks to evaluate any joinery quote.</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            {cost && <><div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100"><p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Kitchen Cabinets</p><p className="text-3xl font-black text-zinc-900">${cost.low}–${cost.high}</p><p className="text-zinc-500" style={{ fontSize: "16px" }}>{cost.unit}</p></div></>}
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100"><p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Full Kitchen (4m run)</p><p className="text-3xl font-black text-zinc-900">$8k–$20k</p><p className="text-zinc-500" style={{ fontSize: "16px" }}>supply, install, hardware</p></div>
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100"><p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Lead Time</p><p className="text-3xl font-black text-zinc-900">4–10 wks</p><p className="text-zinc-500" style={{ fontSize: "16px" }}>custom made-to-order</p></div>
                        </div>
                        <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                            <table className="min-w-full text-left">
                                <thead className="bg-zinc-100 text-zinc-700"><tr><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>City</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Kitchen (per lm)</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Vanity</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Wardrobe</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Laundry</th></tr></thead>
                                <tbody>{cityPricing.map((row) => (<tr key={row.city} className="border-t border-zinc-200 bg-white"><td className="px-4 py-3 font-bold text-zinc-900" style={{ fontSize: "16px" }}>{row.city}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.kitchenLm}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.vanity}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.wardrobe}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.laundry}</td></tr>))}</tbody>
                            </table>
                        </div>
                        <div className="mt-8">
                            <h3 className="font-black text-zinc-900 mb-4 font-display" style={{ fontSize: "24px" }}>Common Cabinet Making Job Costs</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{commonJobCosts.map(([label, value]) => (<div key={label} className="flex items-center justify-between bg-zinc-50 rounded-2xl border border-zinc-100 px-5 py-4 gap-4"><span className="font-bold text-zinc-700" style={{ fontSize: "16px" }}>{label}</span><span className="font-black text-zinc-900 whitespace-nowrap" style={{ fontSize: "16px" }}>{value}</span></div>))}</div>
                        </div>
                    </section>

                    <section className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8">
                        <div className="bg-white rounded-3xl border border-zinc-200 p-8">
                            <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><Wrench className="w-6 h-6 text-[#FF6600]" />Cabinet Making Services We Cover</h2>
                            <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>TradeRefer&apos;s cabinet making hub covers kitchens, bathroom vanities, wardrobes, laundries, home offices, and entertainment units Australia-wide.</p>
                            {services.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{services.map((service) => (<Link key={service} href={`/trades/${jobToSlug(service)}`} className="flex items-center justify-between px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl font-bold text-zinc-700 hover:bg-orange-50 hover:border-[#FF6600] hover:text-[#FF6600] transition-colors capitalize" style={{ fontSize: "16px" }}><span>{service}</span><ArrowRight className="w-4 h-4 text-zinc-300" /></Link>))}</div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{["Kitchen cabinets", "Bathroom vanities", "Walk-in robes", "Built-in wardrobes", "Laundry cabinets", "Home office joinery", "TV / entertainment units", "Built-in shelving", "Pantry cabinets", "Bench top installation"].map((s) => (<div key={s} className="px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl font-bold text-zinc-700 capitalize" style={{ fontSize: "16px" }}>{s}</div>))}</div>
                            )}
                        </div>
                        <div className="bg-white rounded-3xl border border-zinc-200 p-8">
                            <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "28px" }}><Clock3 className="w-5 h-5 text-blue-500" />Before You Hire a Cabinet Maker</h2>
                            <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>Use these checks to avoid material substitutions, missed lead times, and warranty gaps on your joinery.</p>
                            <div className="space-y-4">{hiringTips.map(({ title, body, icon: Icon }) => (<div key={title} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-5"><div className="flex items-start gap-3 mb-2"><div className="w-10 h-10 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center shrink-0"><Icon className="w-5 h-5 text-[#FF6600]" /></div><h3 className="font-black text-zinc-900" style={{ fontSize: "18px" }}>{title}</h3></div><p className="text-zinc-600" style={{ fontSize: "16px", lineHeight: 1.7 }}>{body}</p></div>))}</div>
                        </div>
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><MapPin className="w-6 h-6 text-[#FF6600]" />Find Cabinet Makers by City</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{featuredCities.map(({ city, state, stateSlug, citySlug }) => { const count = cityCounts[`${city.toLowerCase()}::${state}`] || 0; return (<Link key={`${city}-${state}`} href={`/local/${stateSlug}/${citySlug}?category=${encodeURIComponent(TRADE_NAME)}`} className="flex items-center justify-between px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl hover:bg-orange-50 hover:border-[#FF6600] transition-colors group"><div><span className="font-black text-zinc-900 group-hover:text-[#FF6600]" style={{ fontSize: "16px" }}>{city}</span><p className="text-zinc-400" style={{ fontSize: "16px" }}>{state} · {count > 0 ? `${count} listed` : "Browse local directory"}</p></div><ArrowRight className="w-5 h-5 text-zinc-300 group-hover:text-[#FF6600]" /></Link>); })}</div>
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <div className="max-w-3xl mb-8"><h2 className="font-black text-[#1A1A1A] mb-3 font-display" style={{ fontSize: "32px" }}>Get 3 Free Cabinet Making Quotes</h2><p className="text-zinc-500" style={{ fontSize: "18px", lineHeight: 1.7 }}>Request quotes here and we&apos;ll match your project with up to 3 verified local cabinet makers.</p></div>
                        <PublicMultiQuoteForm initialTradeCategory={TRADE_NAME} initialSourcePage="/trades/cabinet-making" />
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><FileText className="w-6 h-6 text-blue-500" />Cabinet Making Licensing by State</h2>
                        <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>Cabinet making is unlicensed as a standalone trade in most Australian states, but associated building work (structural modifications, wet area waterproofing) requires licensed trades.</p>
                        <div className="space-y-3">{Object.entries(STATE_LICENSING[TRADE_NAME] ?? {}).map(([stateCode, text]) => (<div key={stateCode} className="bg-blue-50 border border-blue-100 rounded-2xl p-5"><p className="font-black text-blue-600 uppercase tracking-wider mb-2" style={{ fontSize: "14px" }}>{stateCode}</p><p className="text-zinc-700" style={{ fontSize: "16px", lineHeight: 1.7 }}>{text as string}</p></div>))}</div>
                    </section>

                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">{whyTradeRefer.map((item) => (<div key={item.title} className="bg-white rounded-3xl border border-zinc-200 p-8"><h2 className="font-black text-[#1A1A1A] mb-3 font-display" style={{ fontSize: "24px" }}>{item.title}</h2><p className="text-zinc-600" style={{ fontSize: "16px", lineHeight: 1.7 }}>{item.body}</p></div>))}</section>

                    <section>
                        <h2 className="font-black text-[#1A1A1A] mb-8 font-display" style={{ fontSize: "32px" }}>Cabinet Making: Frequently Asked Questions</h2>
                        <div className="space-y-4">{activeFaqs.map((faq) => (<div key={faq.q} className="bg-white rounded-2xl border border-zinc-200 p-6"><h3 className="font-black text-zinc-900 mb-2" style={{ fontSize: "18px" }}>{faq.q}</h3><p className="text-zinc-600" style={{ fontSize: "16px", lineHeight: 1.7 }}>{faq.a}</p></div>))}</div>
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "28px" }}><Wrench className="w-5 h-5 text-[#FF6600]" />Related Trade Guides</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{relatedTrades.map((trade) => (<Link key={trade.href} href={trade.href} className="flex items-center justify-between px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl font-bold text-zinc-700 hover:bg-orange-50 hover:border-[#FF6600] hover:text-[#FF6600] transition-colors" style={{ fontSize: "16px" }}><span>{trade.label}</span><ArrowRight className="w-4 h-4 text-zinc-300" /></Link>))}</div>
                    </section>

                    <section className="bg-[#1A1A1A] rounded-3xl p-8 md:p-12 text-center text-white">
                        <h2 className="font-black mb-4 text-white" style={{ fontSize: "40px" }}>Need a Cabinet Maker Near You?</h2>
                        <p className="text-zinc-400 mb-8 max-w-2xl mx-auto" style={{ fontSize: "20px", lineHeight: 1.7 }}>Browse verified local cabinet making businesses and find the right maker for your kitchen, bathroom, wardrobe, or custom joinery project.</p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link href={`/quotes?trade=${encodeURIComponent(TRADE_NAME)}&source=%2Ftrades%2Fcabinet-making`} className="inline-flex items-center gap-2 bg-[#FF6600] hover:bg-[#E65C00] text-white font-black rounded-xl px-8 transition-colors" style={{ minHeight: "64px", fontSize: "18px" }}>Get 3 Free Quotes <ArrowRight className="w-5 h-5" /></Link>
                            <Link href={`/businesses?category=${encodeURIComponent(TRADE_NAME)}`} className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-black rounded-xl px-8 transition-colors border border-white/10" style={{ minHeight: "64px", fontSize: "18px" }}>Browse Cabinet Makers</Link>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
