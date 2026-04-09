import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, ChevronRight, Clock3, DollarSign, FileText, Home, MapPin, ShieldCheck, Star, Wrench } from "lucide-react";
import { sql } from "@/lib/db";
import { JOB_TYPES, STATE_LICENSING, TRADE_COST_GUIDE, TRADE_FAQ_BANK, jobToSlug } from "@/lib/constants";
import { PublicMultiQuoteForm } from "@/components/PublicMultiQuoteForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Pool Building Services Australia | Pool Builders | TradeRefer",
    description: "Find trusted pool builders across Australia. Compare concrete, fibreglass, and above-ground pool costs by city, understand council approval and fencing requirements, and hire verified local pool builders through TradeRefer.",
    alternates: { canonical: "https://traderefer.au/trades/pool-building" },
    openGraph: { title: "Pool Building Services Australia | TradeRefer", description: "Compare pool construction costs, fibreglass vs concrete pricing, and verified local pool builders across Australia.", url: "https://traderefer.au/trades/pool-building", type: "website" },
};

const TRADE_NAME = "Pool & Spa";
const cost = TRADE_COST_GUIDE[TRADE_NAME];
const faqs = TRADE_FAQ_BANK[TRADE_NAME]?.slice(0, 6) ?? [];
const services = JOB_TYPES[TRADE_NAME]?.slice(0, 12) ?? [];
const relatedTrades = [
    { label: "Landscaping", href: "/trades/landscaping" },
    { label: "Concreting", href: "/trades/concreting" },
    { label: "Fencing", href: "/trades/fencing" },
    { label: "Tiling", href: "/trades/tiling" },
    { label: "Plumbing", href: "/trades/plumbing" },
    { label: "Electrical", href: "/trades/electrical" },
];
const cityPricing = [
    { city: "Sydney", state: "NSW", fibreglass: "$35,000–$65,000", concrete: "$60,000–$120,000", plunge: "$15,000–$35,000", aboveGround: "$3,000–$10,000" },
    { city: "Melbourne", state: "VIC", fibreglass: "$32,000–$60,000", concrete: "$55,000–$110,000", plunge: "$14,000–$32,000", aboveGround: "$3,000–$10,000" },
    { city: "Brisbane", state: "QLD", fibreglass: "$30,000–$58,000", concrete: "$52,000–$105,000", plunge: "$13,000–$30,000", aboveGround: "$2,800–$9,500" },
    { city: "Perth", state: "WA", fibreglass: "$32,000–$60,000", concrete: "$55,000–$110,000", plunge: "$14,000–$32,000", aboveGround: "$3,000–$10,000" },
    { city: "Adelaide", state: "SA", fibreglass: "$30,000–$58,000", concrete: "$52,000–$105,000", plunge: "$13,000–$30,000", aboveGround: "$2,800–$9,500" },
    { city: "Canberra", state: "ACT", fibreglass: "$35,000–$65,000", concrete: "$60,000–$120,000", plunge: "$15,000–$35,000", aboveGround: "$3,000–$10,000" },
    { city: "Gold Coast", state: "QLD", fibreglass: "$30,000–$58,000", concrete: "$52,000–$105,000", plunge: "$13,000–$30,000", aboveGround: "$2,800–$9,500" },
    { city: "Darwin", state: "NT", fibreglass: "$38,000–$70,000", concrete: "$65,000–$130,000", plunge: "$16,000–$38,000", aboveGround: "$3,500–$12,000" },
];
const commonJobCosts = [
    ["Fibreglass pool (standard shape, 8×4m)", "$35,000–$65,000"],
    ["Concrete / gunite pool (custom shape)", "$55,000–$120,000"],
    ["Plunge pool (3×2m, concrete)", "$13,000–$35,000"],
    ["Above-ground pool (steel frame)", "$2,800–$10,000"],
    ["Pool fencing (glass, per lm)", "$250–$600/lm"],
    ["Pool fencing (aluminium, per lm)", "$80–$180/lm"],
    ["Pool heating (heat pump)", "$2,500–$6,000"],
    ["Solar heating system", "$3,000–$7,000"],
    ["Pool automation / smart system", "$1,500–$5,000"],
    ["Pool resurfacing / re-lining", "$8,000–$25,000"],
];
const hiringTips = [
    { title: "Development Approval is required before excavation", body: "In all Australian states, a swimming pool requires council Development Approval (DA) or a building permit before construction begins. The approval process typically takes 4–12 weeks and includes engineering drawings, site drainage, and compliance with setback requirements. Ensure your builder includes DA lodgement in the project timeline — some cheaper quotes exclude this step.", icon: BadgeCheck },
    { title: "Pool fencing is mandatory by law across all states", body: "The Australian Standard AS 1926.1 mandates compliant pool fencing (minimum 1.2m height, non-climbable zone, self-closing/self-latching gates) for any pool that holds more than 300mm of water. Fencing must be in place before the pool is filled — not after. Non-compliance can result in significant fines and personal liability.", icon: FileText },
    { title: "Get a fixed price — not a preliminary estimate", body: "Pool builds are notorious for scope creep. Ensure the written contract specifies: pool model and dimensions, excavation, concrete/fibreglass work, filtration system, lighting, coping, and pool shell colour. 'Extras' like landscaping restoration, electrical connection, compliance certification, and soil removal should be itemised — not assumed to be included.", icon: ShieldCheck },
    { title: "Understand the ongoing maintenance commitment", body: "A pool requires weekly chemical dosing, regular filter cleaning, and annual servicing. Basic chemical and maintenance costs run $600–$2,000/year for a residential pool. Salt water chlorinators ($800–$2,500 installed) reduce chemical handling. Factor these costs into your decision — especially for second pools or holiday homes with infrequent use.", icon: Star },
];
const whyTradeRefer = [
    { title: "Verified pool builders", body: "TradeRefer helps homeowners find ABN-verified, licensed pool builders who manage DA approvals, fencing compliance, and installation to AS 1926 standards — critical for pool safety and legal compliance." },
    { title: "Compare costs before you call", body: "Use this hub to understand typical fibreglass and concrete pool costs across Australian cities so you can benchmark builder quotes and identify what's included vs what's an extra." },
    { title: "Australia-wide local discovery", body: "Navigate from this national pool building guide into city and suburb-level pages to find verified pool builders in the specific area where your property is located." },
];
const customFaqs = [
    { q: "How much does a fibreglass pool cost in Australia?", a: "A standard fibreglass pool (8×4m) installed in a typical suburban backyard costs $35,000–$65,000 in most Australian cities, including excavation, installation, filtration, and basic landscaping restoration. Difficult access, rock excavation, complex soil conditions, or extensive landscaping can add $5,000–$25,000 to the project cost." },
    { q: "What is the difference between fibreglass and concrete pools?", a: "Fibreglass pools are factory-moulded shells, installed in 1–2 days (after excavation), lower maintenance, and typically last 20–25 years. They're limited to pre-made shapes and sizes. Concrete (gunite/shotcrete) pools are custom-built on site, any shape or size, but take 8–16 weeks to construct and require more ongoing maintenance. Concrete pools cost 30–60% more than equivalent fibreglass pools." },
    { q: "Do I need council approval to build a swimming pool?", a: "Yes — a DA or building permit is required in all Australian states before pool construction begins. The approval covers pool placement, structural design, drainage, pool fencing compliance, and setback requirements. The approval process typically takes 4–12 weeks. Your pool builder should manage the DA lodgement — confirm this is included in the contract." },
    { q: "What pool fencing is required by law in Australia?", a: "Under AS 1926.1, pool fencing must be at least 1.2m high, have no climbable handholds within 900mm, and feature self-closing, self-latching gates that open outwards (away from the pool). Compliant glass fencing costs $250–$600/lm installed. Aluminium palisade fencing costs $80–$180/lm. The fence must be complete before the pool is filled." },
    { q: "How long does a pool build take?", a: "A fibreglass pool installation (post-DA approval) takes 2–6 weeks on-site: excavation (1–3 days), installation (1–2 days), plumbing and electrical (1–2 weeks), fencing, and landscaping. A concrete pool takes 8–16 weeks. Factor 4–12 weeks for DA approval before construction begins. Total timeline from contract to swimming is typically 3–6 months." },
    { q: "What ongoing maintenance costs should I expect?", a: "Annual pool maintenance costs typically run $600–$2,000 for a residential pool, covering chemicals, water testing, filter cleaning, and annual servicing. A salt water chlorinator ($800–$2,500 installed) reduces chemical handling and cost. Pool heating (heat pump) adds $800–$2,500/year in electricity. Budget 1–2% of the pool's construction cost per year in maintenance." },
];
const activeFaqs = faqs.length > 0 ? faqs : customFaqs;

type StateCountRow = { state: string; count: string | number };
type CityCountRow = { city: string; state: string; count: string | number };
async function getBusinessCountByState(): Promise<Record<string, number>> {
    try {
        const results = await sql<StateCountRow[]>`SELECT state, COUNT(*) as count FROM businesses WHERE status = 'active' AND (trade_category ILIKE '%pool%' OR trade_category ILIKE '%spa%') AND state IS NOT NULL GROUP BY state ORDER BY count DESC`;
        const map: Record<string, number> = {};
        results.forEach((row) => { map[row.state] = parseInt(String(row.count), 10); });
        return map;
    } catch { return {}; }
}
async function getFeaturedCityCounts(): Promise<Record<string, number>> {
    try {
        const results = await sql<CityCountRow[]>`SELECT city, state, COUNT(*) as count FROM businesses WHERE status = 'active' AND (trade_category ILIKE '%pool%' OR trade_category ILIKE '%spa%') AND city IS NOT NULL AND city != '' GROUP BY city, state`;
        const map: Record<string, number> = {};
        results.forEach((row) => { map[`${String(row.city).toLowerCase()}::${String(row.state).toUpperCase()}`] = parseInt(String(row.count), 10); });
        return map;
    } catch { return {}; }
}

export default async function PoolBuildingTradeHubPage() {
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
                        <span className="text-[#FF6600]">Pool Building</span>
                    </nav>
                    <div className="max-w-4xl">
                        <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-2 font-black text-orange-400 uppercase tracking-widest mb-6" style={{ fontSize: "16px" }}><Home className="w-4 h-4" />Australia-Wide Trade Hub</div>
                        <h1 className="font-black mb-6 leading-[1.05] font-display text-white" style={{ fontSize: "clamp(48px, 8vw, 80px)" }}>Find Verified <span className="text-[#FF6600]">Pool Builders</span> Across Australia</h1>
                        <p className="text-zinc-400 max-w-3xl mb-8" style={{ fontSize: "20px", lineHeight: 1.7 }}>Use this TradeRefer pool building hub to compare fibreglass, concrete, and plunge pool costs across Australian cities, understand DA and fencing requirements, and connect with verified local pool builders.</p>
                        <div className="flex flex-wrap gap-4">
                            <Link href={`/quotes?trade=${encodeURIComponent(TRADE_NAME)}&source=%2Ftrades%2Fpool-building`} className="bg-[#FF6600] hover:bg-[#E65C00] text-white font-black px-8 rounded-xl transition-colors inline-flex items-center justify-center gap-2" style={{ minHeight: "64px", fontSize: "18px" }}>Get 3 Free Quotes<ArrowRight className="w-5 h-5" /></Link>
                            <Link href={`/businesses?category=${encodeURIComponent(TRADE_NAME)}`} className="bg-white/10 hover:bg-white/20 text-white font-black px-8 rounded-xl transition-colors border border-white/10 inline-flex items-center justify-center" style={{ minHeight: "64px", fontSize: "18px" }}>Browse Pool Builders</Link>
                            <Link href="/local" className="bg-white/10 hover:bg-white/20 text-white font-black px-8 rounded-xl transition-colors border border-white/10 inline-flex items-center justify-center" style={{ minHeight: "64px", fontSize: "18px" }}>Browse by Location</Link>
                        </div>
                        <div className="flex flex-wrap gap-6 text-white font-bold mt-8" style={{ fontSize: "16px" }}>
                            {cost && <span className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-[#FF6600]" />From ${cost.low?.toLocaleString()}–${cost.high?.toLocaleString()}{cost.unit}</span>}
                            {totalBusinesses > 0 && <span className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-[#FF6600]" />{totalBusinesses.toLocaleString()} pool businesses listed</span>}
                            {statesCovered > 0 && <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#FF6600]" />Available in {statesCovered} states & territories</span>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16">
                <div className="max-w-6xl mx-auto space-y-16">
                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><DollarSign className="w-6 h-6 text-[#FF6600]" />Pool Building Cost Guide Australia</h2>
                        <p className="text-zinc-500 mb-8" style={{ fontSize: "18px", lineHeight: 1.7 }}>Pool costs vary significantly by type (fibreglass vs concrete), size, site conditions, fencing, and landscaping. These benchmarks cover the pool shell and standard installation — additional landscaping, heating, and automation are extras.</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100"><p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Fibreglass Pool</p><p className="text-3xl font-black text-zinc-900">$35k–$65k</p><p className="text-zinc-500" style={{ fontSize: "16px" }}>standard 8×4m, installed</p></div>
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100"><p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Concrete Pool</p><p className="text-3xl font-black text-zinc-900">$55k–$120k</p><p className="text-zinc-500" style={{ fontSize: "16px" }}>custom shape, any size</p></div>
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100"><p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Fencing Required</p><p className="text-3xl font-black text-zinc-900">AS 1926.1</p><p className="text-zinc-500" style={{ fontSize: "16px" }}>mandatory by law, all states</p></div>
                        </div>
                        <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                            <table className="min-w-full text-left">
                                <thead className="bg-zinc-100 text-zinc-700"><tr><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>City</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Fibreglass</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Concrete</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Plunge Pool</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Above Ground</th></tr></thead>
                                <tbody>{cityPricing.map((row) => (<tr key={row.city} className="border-t border-zinc-200 bg-white"><td className="px-4 py-3 font-bold text-zinc-900" style={{ fontSize: "16px" }}>{row.city}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.fibreglass}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.concrete}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.plunge}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.aboveGround}</td></tr>))}</tbody>
                            </table>
                        </div>
                        <div className="mt-8">
                            <h3 className="font-black text-zinc-900 mb-4 font-display" style={{ fontSize: "24px" }}>Common Pool Project Costs</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{commonJobCosts.map(([label, value]) => (<div key={label} className="flex items-center justify-between bg-zinc-50 rounded-2xl border border-zinc-100 px-5 py-4 gap-4"><span className="font-bold text-zinc-700" style={{ fontSize: "16px" }}>{label}</span><span className="font-black text-zinc-900 whitespace-nowrap" style={{ fontSize: "16px" }}>{value}</span></div>))}</div>
                        </div>
                    </section>

                    <section className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8">
                        <div className="bg-white rounded-3xl border border-zinc-200 p-8">
                            <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><Wrench className="w-6 h-6 text-[#FF6600]" />Pool Services We Cover</h2>
                            <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>TradeRefer&apos;s pool building hub covers new pool construction, plunge pools, pool renovations, heating, automation, fencing, and ongoing maintenance across Australia.</p>
                            {services.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{services.map((service) => (<Link key={service} href={`/trades/${jobToSlug(service)}`} className="flex items-center justify-between px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl font-bold text-zinc-700 hover:bg-orange-50 hover:border-[#FF6600] hover:text-[#FF6600] transition-colors capitalize" style={{ fontSize: "16px" }}><span>{service}</span><ArrowRight className="w-4 h-4 text-zinc-300" /></Link>))}</div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{["Fibreglass pool installation", "Concrete / gunite pool", "Plunge pool", "Pool renovation", "Pool heating", "Pool fencing", "Pool automation", "Spa / jacuzzi", "Pool maintenance", "Pool resurfacing"].map((s) => (<div key={s} className="px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl font-bold text-zinc-700 capitalize" style={{ fontSize: "16px" }}>{s}</div>))}</div>
                            )}
                        </div>
                        <div className="bg-white rounded-3xl border border-zinc-200 p-8">
                            <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "28px" }}><Clock3 className="w-5 h-5 text-blue-500" />Before You Hire a Pool Builder</h2>
                            <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>Use these checks to avoid DA non-compliance, fencing liability, and cost overruns on your pool project.</p>
                            <div className="space-y-4">{hiringTips.map(({ title, body, icon: Icon }) => (<div key={title} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-5"><div className="flex items-start gap-3 mb-2"><div className="w-10 h-10 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center shrink-0"><Icon className="w-5 h-5 text-[#FF6600]" /></div><h3 className="font-black text-zinc-900" style={{ fontSize: "18px" }}>{title}</h3></div><p className="text-zinc-600" style={{ fontSize: "16px", lineHeight: 1.7 }}>{body}</p></div>))}</div>
                        </div>
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><MapPin className="w-6 h-6 text-[#FF6600]" />Find Pool Builders by City</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{[
                            { city: "Sydney", state: "NSW", stateSlug: "nsw", citySlug: "sydney" },
                            { city: "Melbourne", state: "VIC", stateSlug: "vic", citySlug: "melbourne" },
                            { city: "Brisbane", state: "QLD", stateSlug: "qld", citySlug: "brisbane" },
                            { city: "Perth", state: "WA", stateSlug: "wa", citySlug: "perth" },
                            { city: "Adelaide", state: "SA", stateSlug: "sa", citySlug: "adelaide" },
                            { city: "Gold Coast", state: "QLD", stateSlug: "qld", citySlug: "gold-coast" },
                            { city: "Newcastle", state: "NSW", stateSlug: "nsw", citySlug: "newcastle" },
                            { city: "Sunshine Coast", state: "QLD", stateSlug: "qld", citySlug: "sunshine-coast" },
                        ].map(({ city, state, stateSlug, citySlug }) => { const count = cityCounts[`${city.toLowerCase()}::${state}`] || 0; return (<Link key={`${city}-${state}`} href={`/local/${stateSlug}/${citySlug}?category=${encodeURIComponent(TRADE_NAME)}`} className="flex items-center justify-between px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl hover:bg-orange-50 hover:border-[#FF6600] transition-colors group"><div><span className="font-black text-zinc-900 group-hover:text-[#FF6600]" style={{ fontSize: "16px" }}>{city}</span><p className="text-zinc-400" style={{ fontSize: "16px" }}>{state} · {count > 0 ? `${count} listed` : "Browse local directory"}</p></div><ArrowRight className="w-5 h-5 text-zinc-300 group-hover:text-[#FF6600]" /></Link>); })}</div>
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <div className="max-w-3xl mb-8"><h2 className="font-black text-[#1A1A1A] mb-3 font-display" style={{ fontSize: "32px" }}>Get 3 Free Pool Building Quotes</h2><p className="text-zinc-500" style={{ fontSize: "18px", lineHeight: 1.7 }}>Request quotes here and we&apos;ll match your project with up to 3 verified local pool builders.</p></div>
                        <PublicMultiQuoteForm initialTradeCategory={TRADE_NAME} initialSourcePage="/trades/pool-building" />
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><FileText className="w-6 h-6 text-blue-500" />Pool Building Licensing Requirements by State</h2>
                        <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>Pool builders must hold a building licence in all Australian states. Pool fencing must comply with AS 1926.1. DA approval is required before construction begins. Here&apos;s a state-by-state overview.</p>
                        <div className="space-y-3">{Object.entries(STATE_LICENSING[TRADE_NAME] ?? {}).map(([stateCode, text]) => (<div key={stateCode} className="bg-blue-50 border border-blue-100 rounded-2xl p-5"><p className="font-black text-blue-600 uppercase tracking-wider mb-2" style={{ fontSize: "14px" }}>{stateCode}</p><p className="text-zinc-700" style={{ fontSize: "16px", lineHeight: 1.7 }}>{text as string}</p></div>))}</div>
                    </section>

                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">{whyTradeRefer.map((item) => (<div key={item.title} className="bg-white rounded-3xl border border-zinc-200 p-8"><h2 className="font-black text-[#1A1A1A] mb-3 font-display" style={{ fontSize: "24px" }}>{item.title}</h2><p className="text-zinc-600" style={{ fontSize: "16px", lineHeight: 1.7 }}>{item.body}</p></div>))}</section>

                    <section>
                        <h2 className="font-black text-[#1A1A1A] mb-8 font-display" style={{ fontSize: "32px" }}>Pool Building: Frequently Asked Questions</h2>
                        <div className="space-y-4">{activeFaqs.map((faq) => (<div key={faq.q} className="bg-white rounded-2xl border border-zinc-200 p-6"><h3 className="font-black text-zinc-900 mb-2" style={{ fontSize: "18px" }}>{faq.q}</h3><p className="text-zinc-600" style={{ fontSize: "16px", lineHeight: 1.7 }}>{faq.a}</p></div>))}</div>
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "28px" }}><Wrench className="w-5 h-5 text-[#FF6600]" />Related Trade Guides</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{relatedTrades.map((trade) => (<Link key={trade.href} href={trade.href} className="flex items-center justify-between px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl font-bold text-zinc-700 hover:bg-orange-50 hover:border-[#FF6600] hover:text-[#FF6600] transition-colors" style={{ fontSize: "16px" }}><span>{trade.label}</span><ArrowRight className="w-4 h-4 text-zinc-300" /></Link>))}</div>
                    </section>

                    <section className="bg-[#1A1A1A] rounded-3xl p-8 md:p-12 text-center text-white">
                        <h2 className="font-black mb-4 text-white" style={{ fontSize: "40px" }}>Ready to Build Your Pool?</h2>
                        <p className="text-zinc-400 mb-8 max-w-2xl mx-auto" style={{ fontSize: "20px", lineHeight: 1.7 }}>Browse verified local pool builders, compare fibreglass and concrete options, and find the right contractor for your backyard pool project.</p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link href={`/quotes?trade=${encodeURIComponent(TRADE_NAME)}&source=%2Ftrades%2Fpool-building`} className="inline-flex items-center gap-2 bg-[#FF6600] hover:bg-[#E65C00] text-white font-black rounded-xl px-8 transition-colors" style={{ minHeight: "64px", fontSize: "18px" }}>Get 3 Free Quotes <ArrowRight className="w-5 h-5" /></Link>
                            <Link href={`/businesses?category=${encodeURIComponent(TRADE_NAME)}`} className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-black rounded-xl px-8 transition-colors border border-white/10" style={{ minHeight: "64px", fontSize: "18px" }}>Browse Pool Builders</Link>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
