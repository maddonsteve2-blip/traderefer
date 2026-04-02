import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, ChevronRight, Clock3, DollarSign, FileText, Home, MapPin, ShieldCheck, Star, Wrench } from "lucide-react";
import { sql } from "@/lib/db";
import { JOB_TYPES, STATE_LICENSING, TRADE_COST_GUIDE, TRADE_FAQ_BANK, jobToSlug } from "@/lib/constants";
import { PublicMultiQuoteForm } from "@/components/PublicMultiQuoteForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Demolition Services Australia | Find Verified Demolition Contractors | TradeRefer",
    description: "Find trusted demolition contractors across Australia. Compare house, shed, and pool demolition costs by city, understand DA requirements, and hire verified local demolition businesses through TradeRefer.",
    alternates: { canonical: "https://traderefer.au/trades/demolition" },
    openGraph: { title: "Demolition Services Australia | TradeRefer", description: "Compare demolition costs, DA requirements, asbestos obligations, and verified local demolition contractors across Australia.", url: "https://traderefer.au/trades/demolition", type: "website" },
};

const TRADE_NAME = "Demolition";
const cost = TRADE_COST_GUIDE[TRADE_NAME];
const faqs = TRADE_FAQ_BANK[TRADE_NAME]?.slice(0, 6) ?? [];
const services = JOB_TYPES[TRADE_NAME]?.slice(0, 12) ?? [];
const relatedTrades = [
    { label: "Asbestos Removal", href: "/trades/asbestos-removal" },
    { label: "Excavation", href: "/categories#excavation" },
    { label: "Concreting", href: "/trades/concreting" },
    { label: "Building", href: "/categories#building" },
    { label: "Rendering", href: "/trades/rendering" },
    { label: "Skip Bins", href: "/trades/skip-bins" },
];
const cityPricing = [
    { city: "Sydney", state: "NSW", shed: "$800–$2,500", garage: "$2,500–$6,000", house: "$15,000–$35,000", pool: "$3,000–$7,000" },
    { city: "Melbourne", state: "VIC", shed: "$700–$2,200", garage: "$2,200–$5,500", house: "$13,000–$32,000", pool: "$2,800–$6,500" },
    { city: "Brisbane", state: "QLD", shed: "$700–$2,000", garage: "$2,000–$5,000", house: "$12,000–$30,000", pool: "$2,500–$6,000" },
    { city: "Perth", state: "WA", shed: "$700–$2,200", garage: "$2,200–$5,500", house: "$13,000–$32,000", pool: "$2,800–$6,500" },
    { city: "Adelaide", state: "SA", shed: "$650–$2,000", garage: "$2,000–$5,000", house: "$12,000–$28,000", pool: "$2,500–$5,800" },
    { city: "Canberra", state: "ACT", shed: "$800–$2,500", garage: "$2,500–$6,000", house: "$15,000–$35,000", pool: "$3,000–$7,000" },
    { city: "Hobart", state: "TAS", shed: "$700–$2,200", garage: "$2,200–$5,500", house: "$13,000–$32,000", pool: "$2,800–$6,500" },
    { city: "Darwin", state: "NT", shed: "$900–$2,800", garage: "$2,800–$6,500", house: "$16,000–$38,000", pool: "$3,500–$8,000" },
];
const commonJobCosts = [
    ["Garden shed demolition & removal", "$600–$2,500"],
    ["Garage demolition (single)", "$2,000–$5,500"],
    ["Fibro / asbestos shed (licenced removal)", "$2,500–$6,000"],
    ["House demolition (full, 3-bed)", "$12,000–$35,000"],
    ["Partial demolition (internal wall removal)", "$800–$3,000"],
    ["Swimming pool demolition", "$2,500–$7,000"],
    ["Concrete slab removal (per m²)", "$30–$80/m²"],
    ["Driveway removal (concrete, per m²)", "$25–$60/m²"],
    ["Asbestos removal (licensed, per m²)", "$30–$80/m²"],
    ["Skip bin hire (8m³, 7 days)", "$350–$600"],
];
const hiringTips = [
    { title: "Obtain a Development Approval before demolishing", body: "Full house demolition requires Development Approval (DA) or a demolition permit from your local council in all Australian states. Some states also require a Complying Development Certificate (CDC) for heritage or flood-prone zones. Never allow demolition to proceed without confirmed approvals.", icon: BadgeCheck },
    { title: "Mandatory asbestos survey before any demolition", body: "Any building constructed before 1990 must be surveyed for asbestos by a licensed assessor before demolition begins. Asbestos removal must be done by a Class A or Class B licenced removalist depending on quantity and type. This is a non-negotiable legal obligation under Safe Work Australia standards.", icon: FileText },
    { title: "Check for underground services before excavation begins", body: "Always call Dial Before You Dig (1100 or dialbeforeyoudig.com.au) at least 2 business days before any excavation associated with demolition. Cutting through gas, electrical, or telecommunications services can be fatal and you may be liable for costly repairs.", icon: ShieldCheck },
    { title: "Confirm waste disposal is included in the quote", body: "Demolition waste disposal costs are significant. Confirm whether the quote includes removal, haulage, and tip fees for all waste material. Separate rates often apply for concrete, masonry, and contaminated materials. Get a fixed price for waste removal, not an estimate.", icon: Star },
];
const whyTradeRefer = [
    { title: "Verified demolition businesses", body: "TradeRefer helps property owners find ABN-verified demolition contractors with proper licensing, asbestos compliance, and public liability insurance — critical for any project involving structures built before 1990." },
    { title: "Compare costs before you call", body: "Use this hub to understand typical shed, garage, and house demolition costs across Australian cities so you can benchmark any quote before committing to a contractor." },
    { title: "Australia-wide local discovery", body: "Navigate from this national demolition guide into city and suburb-level pages to find verified demolition contractors in the specific area where your property is located." },
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

export default async function DemolitionTradeHubPage() {
    const [countsByState, cityCounts] = await Promise.all([getBusinessCountByState(), getFeaturedCityCounts()]);
    const totalBusinesses = Object.values(countsByState).reduce((sum, count) => sum + count, 0);
    const statesCovered = Object.keys(countsByState).length;
    const faqJsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.q, acceptedAnswer: { "@type": "Answer", text: faq.a } })) };

    return (
        <main className="min-h-screen bg-zinc-50">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
            <div className="bg-[#1A1A1A] pt-32 pb-20 text-white">
                <div className="container mx-auto px-4">
                    <nav className="flex flex-wrap items-center gap-2 font-bold text-zinc-400 uppercase tracking-widest mb-8" style={{ fontSize: "16px" }}>
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <ChevronRight className="w-4 h-4" />
                        <Link href="/categories" className="hover:text-white transition-colors">Trade Guides</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-[#FF6600]">Demolition</span>
                    </nav>
                    <div className="max-w-4xl">
                        <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-2 font-black text-orange-400 uppercase tracking-widest mb-6" style={{ fontSize: "16px" }}><Home className="w-4 h-4" />Australia-Wide Trade Hub</div>
                        <h1 className="font-black mb-6 leading-[1.05] font-display text-white" style={{ fontSize: "clamp(48px, 8vw, 80px)" }}>Find Verified <span className="text-[#FF6600]">Demolition</span> Contractors Across Australia</h1>
                        <p className="text-zinc-400 max-w-3xl mb-8" style={{ fontSize: "20px", lineHeight: 1.7 }}>Use this TradeRefer demolition hub to compare shed, garage, and house demolition costs across Australian cities, understand DA and asbestos obligations, and connect with verified local demolition businesses.</p>
                        <div className="flex flex-wrap gap-4">
                            <Link href="/quotes?trade=Demolition&source=%2Ftrades%2Fdemolition" className="bg-[#FF6600] hover:bg-[#E65C00] text-white font-black px-8 rounded-xl transition-colors inline-flex items-center justify-center gap-2" style={{ minHeight: "64px", fontSize: "18px" }}>Get 3 Free Quotes<ArrowRight className="w-5 h-5" /></Link>
                            <Link href="/businesses?category=Demolition" className="bg-white/10 hover:bg-white/20 text-white font-black px-8 rounded-xl transition-colors border border-white/10 inline-flex items-center justify-center" style={{ minHeight: "64px", fontSize: "18px" }}>Browse Demolition Contractors</Link>
                            <Link href="/local" className="bg-white/10 hover:bg-white/20 text-white font-black px-8 rounded-xl transition-colors border border-white/10 inline-flex items-center justify-center" style={{ minHeight: "64px", fontSize: "18px" }}>Browse by Location</Link>
                        </div>
                        <div className="flex flex-wrap gap-6 text-white font-bold mt-8" style={{ fontSize: "16px" }}>
                            {cost && <span className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-[#FF6600]" />From ${cost.low?.toLocaleString()}–${cost.high?.toLocaleString()}{cost.unit}</span>}
                            {totalBusinesses > 0 && <span className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-[#FF6600]" />{totalBusinesses.toLocaleString()} demolition businesses listed</span>}
                            {statesCovered > 0 && <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#FF6600]" />Available in {statesCovered} states & territories</span>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16">
                <div className="max-w-6xl mx-auto space-y-16">
                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><DollarSign className="w-6 h-6 text-[#FF6600]" />Demolition Cost Guide Australia</h2>
                        <p className="text-zinc-500 mb-8" style={{ fontSize: "18px", lineHeight: 1.7 }}>Demolition costs depend on structure size, asbestos presence, access, and whether waste removal is included. Always get a fixed-price quote — not an estimate — for demolition work.</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100"><p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Shed Demolition</p><p className="text-3xl font-black text-zinc-900">$600–$2,500</p><p className="text-zinc-500" style={{ fontSize: "16px" }}>standard garden shed, cleared</p></div>
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100"><p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Full House Demolition</p><p className="text-3xl font-black text-zinc-900">$12k–$35k</p><p className="text-zinc-500" style={{ fontSize: "16px" }}>3-bedroom, incl. waste removal</p></div>
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100"><p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>DA Required?</p><p className="text-3xl font-black text-zinc-900">Always</p><p className="text-zinc-500" style={{ fontSize: "16px" }}>for full structure demolition</p></div>
                        </div>
                        <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                            <table className="min-w-full text-left">
                                <thead className="bg-zinc-100 text-zinc-700"><tr><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>City</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Shed</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Garage</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Full House</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Pool</th></tr></thead>
                                <tbody>{cityPricing.map((row) => (<tr key={row.city} className="border-t border-zinc-200 bg-white"><td className="px-4 py-3 font-bold text-zinc-900" style={{ fontSize: "16px" }}>{row.city}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.shed}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.garage}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.house}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.pool}</td></tr>))}</tbody>
                            </table>
                        </div>
                        <div className="mt-8">
                            <h3 className="font-black text-zinc-900 mb-4 font-display" style={{ fontSize: "24px" }}>Common Demolition Job Costs</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{commonJobCosts.map(([label, value]) => (<div key={label} className="flex items-center justify-between bg-zinc-50 rounded-2xl border border-zinc-100 px-5 py-4 gap-4"><span className="font-bold text-zinc-700" style={{ fontSize: "16px" }}>{label}</span><span className="font-black text-zinc-900 whitespace-nowrap" style={{ fontSize: "16px" }}>{value}</span></div>))}</div>
                        </div>
                    </section>

                    <section className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8">
                        <div className="bg-white rounded-3xl border border-zinc-200 p-8">
                            <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><Wrench className="w-6 h-6 text-[#FF6600]" />Demolition Services We Cover</h2>
                            <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>TradeRefer&apos;s demolition hub covers house, shed, garage, pool, and partial demolition, as well as concrete removal and asbestos-containing structure demolition Australia-wide.</p>
                            {services.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{services.map((service) => (<Link key={service} href={`/trades/${jobToSlug(service)}`} className="flex items-center justify-between px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl font-bold text-zinc-700 hover:bg-orange-50 hover:border-[#FF6600] hover:text-[#FF6600] transition-colors capitalize" style={{ fontSize: "16px" }}><span>{service}</span><ArrowRight className="w-4 h-4 text-zinc-300" /></Link>))}</div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{["House demolition", "Shed demolition", "Garage demolition", "Pool demolition", "Asbestos removal", "Partial demolition", "Concrete slab removal", "Driveway removal", "Retaining wall removal", "Internal wall removal"].map((s) => (<div key={s} className="px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl font-bold text-zinc-700 capitalize" style={{ fontSize: "16px" }}>{s}</div>))}</div>
                            )}
                        </div>
                        <div className="bg-white rounded-3xl border border-zinc-200 p-8">
                            <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "28px" }}><Clock3 className="w-5 h-5 text-blue-500" />Before You Hire a Demolition Contractor</h2>
                            <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>Use these checks to avoid DA compliance failures, illegal asbestos handling, and unexpected waste disposal costs.</p>
                            <div className="space-y-4">{hiringTips.map(({ title, body, icon: Icon }) => (<div key={title} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-5"><div className="flex items-start gap-3 mb-2"><div className="w-10 h-10 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center shrink-0"><Icon className="w-5 h-5 text-[#FF6600]" /></div><h3 className="font-black text-zinc-900" style={{ fontSize: "18px" }}>{title}</h3></div><p className="text-zinc-600" style={{ fontSize: "16px", lineHeight: 1.7 }}>{body}</p></div>))}</div>
                        </div>
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><MapPin className="w-6 h-6 text-[#FF6600]" />Find Demolition Contractors by City</h2>
                        <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>Browse Australian cities where TradeRefer has demolition businesses listed.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{featuredCities.map(({ city, state, stateSlug, citySlug }) => { const count = cityCounts[`${city.toLowerCase()}::${state}`] || 0; return (<Link key={`${city}-${state}`} href={`/local/${stateSlug}/${citySlug}?category=${encodeURIComponent(TRADE_NAME)}`} className="flex items-center justify-between px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl hover:bg-orange-50 hover:border-[#FF6600] transition-colors group"><div><span className="font-black text-zinc-900 group-hover:text-[#FF6600]" style={{ fontSize: "16px" }}>{city}</span><p className="text-zinc-400" style={{ fontSize: "16px" }}>{state} · {count > 0 ? `${count} listed` : "Browse local directory"}</p></div><ArrowRight className="w-5 h-5 text-zinc-300 group-hover:text-[#FF6600]" /></Link>); })}</div>
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <div className="max-w-3xl mb-8"><h2 className="font-black text-[#1A1A1A] mb-3 font-display" style={{ fontSize: "32px" }}>Get 3 Free Demolition Quotes</h2><p className="text-zinc-500" style={{ fontSize: "18px", lineHeight: 1.7 }}>Request quotes here and we&apos;ll match your project with up to 3 verified local demolition businesses.</p></div>
                        <PublicMultiQuoteForm initialTradeCategory="Demolition" initialSourcePage="/trades/demolition" />
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><FileText className="w-6 h-6 text-blue-500" />Demolition Licensing Requirements by State</h2>
                        <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>Demolition is a licensed trade in all Australian states. Asbestos removal requires additional specialist licences separate from the demolition licence.</p>
                        <div className="space-y-3">{Object.entries(STATE_LICENSING[TRADE_NAME] ?? {}).map(([stateCode, text]) => (<div key={stateCode} className="bg-blue-50 border border-blue-100 rounded-2xl p-5"><p className="font-black text-blue-600 uppercase tracking-wider mb-2" style={{ fontSize: "14px" }}>{stateCode}</p><p className="text-zinc-700" style={{ fontSize: "16px", lineHeight: 1.7 }}>{text as string}</p></div>))}</div>
                    </section>

                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">{whyTradeRefer.map((item) => (<div key={item.title} className="bg-white rounded-3xl border border-zinc-200 p-8"><h2 className="font-black text-[#1A1A1A] mb-3 font-display" style={{ fontSize: "24px" }}>{item.title}</h2><p className="text-zinc-600" style={{ fontSize: "16px", lineHeight: 1.7 }}>{item.body}</p></div>))}</section>

                    {faqs.length > 0 && (
                        <section>
                            <h2 className="font-black text-[#1A1A1A] mb-8 font-display" style={{ fontSize: "32px" }}>Demolition: Frequently Asked Questions</h2>
                            <div className="space-y-4">{faqs.map((faq) => (<div key={faq.q} className="bg-white rounded-2xl border border-zinc-200 p-6"><h3 className="font-black text-zinc-900 mb-2" style={{ fontSize: "18px" }}>{faq.q}</h3><p className="text-zinc-600" style={{ fontSize: "16px", lineHeight: 1.7 }}>{faq.a}</p></div>))}</div>
                        </section>
                    )}

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "28px" }}><Wrench className="w-5 h-5 text-[#FF6600]" />Related Trade Guides</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{relatedTrades.map((trade) => (<Link key={trade.href} href={trade.href} className="flex items-center justify-between px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl font-bold text-zinc-700 hover:bg-orange-50 hover:border-[#FF6600] hover:text-[#FF6600] transition-colors" style={{ fontSize: "16px" }}><span>{trade.label}</span><ArrowRight className="w-4 h-4 text-zinc-300" /></Link>))}</div>
                    </section>

                    <section className="bg-[#1A1A1A] rounded-3xl p-8 md:p-12 text-center text-white">
                        <h2 className="font-black mb-4 text-white" style={{ fontSize: "40px" }}>Need a Demolition Contractor Near You?</h2>
                        <p className="text-zinc-400 mb-8 max-w-2xl mx-auto" style={{ fontSize: "20px", lineHeight: 1.7 }}>Browse verified local demolition businesses and find the right contractor for your shed, garage, pool, or house demolition project.</p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link href="/quotes?trade=Demolition&source=%2Ftrades%2Fdemolition" className="inline-flex items-center gap-2 bg-[#FF6600] hover:bg-[#E65C00] text-white font-black rounded-xl px-8 transition-colors" style={{ minHeight: "64px", fontSize: "18px" }}>Get 3 Free Quotes <ArrowRight className="w-5 h-5" /></Link>
                            <Link href="/businesses?category=Demolition" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-black rounded-xl px-8 transition-colors border border-white/10" style={{ minHeight: "64px", fontSize: "18px" }}>Browse Demolition Contractors</Link>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
