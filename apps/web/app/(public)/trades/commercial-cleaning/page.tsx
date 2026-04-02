import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, ChevronRight, Clock3, DollarSign, FileText, Home, MapPin, ShieldCheck, Star, Wrench } from "lucide-react";
import { sql } from "@/lib/db";
import { JOB_TYPES, STATE_LICENSING, TRADE_COST_GUIDE, TRADE_FAQ_BANK, jobToSlug } from "@/lib/constants";
import { PublicMultiQuoteForm } from "@/components/PublicMultiQuoteForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Commercial Cleaning Services Australia | Find Verified Commercial Cleaners | TradeRefer",
    description: "Find trusted commercial cleaners across Australia. Compare office, retail, and industrial cleaning costs by city, understand insurance requirements, and hire verified local commercial cleaning businesses through TradeRefer.",
    alternates: { canonical: "https://traderefer.au/trades/commercial-cleaning" },
    openGraph: { title: "Commercial Cleaning Services Australia | TradeRefer", description: "Compare commercial cleaning costs, office cleaning rates, and verified local commercial cleaners across Australia.", url: "https://traderefer.au/trades/commercial-cleaning", type: "website" },
};

const TRADE_NAME = "Cleaning";
const cost = TRADE_COST_GUIDE[TRADE_NAME];
const faqs = TRADE_FAQ_BANK[TRADE_NAME].slice(0, 6);
const services = JOB_TYPES[TRADE_NAME]?.slice(0, 12) ?? [];
const relatedTrades = [
    { label: "House Cleaning", href: "/trades/house-cleaning" },
    { label: "Pest Control", href: "/trades/pest-control" },
    { label: "Carpet Cleaning", href: "/categories#cleaning" },
    { label: "Window Cleaning", href: "/categories#cleaning" },
    { label: "Rubbish Removal", href: "/categories#rubbish-removal" },
    { label: "Landscaping", href: "/trades/landscaping" },
];
const cityPricing = [
    { city: "Sydney", state: "NSW", office: "$35–$65/hr", retail: "$30–$55/hr", medical: "$55–$95/hr", industrial: "$45–$80/hr" },
    { city: "Melbourne", state: "VIC", office: "$30–$60/hr", retail: "$28–$52/hr", medical: "$50–$90/hr", industrial: "$40–$75/hr" },
    { city: "Brisbane", state: "QLD", office: "$28–$58/hr", retail: "$26–$50/hr", medical: "$48–$88/hr", industrial: "$38–$72/hr" },
    { city: "Perth", state: "WA", office: "$32–$62/hr", retail: "$28–$54/hr", medical: "$52–$92/hr", industrial: "$42–$78/hr" },
    { city: "Adelaide", state: "SA", office: "$28–$55/hr", retail: "$25–$48/hr", medical: "$48–$85/hr", industrial: "$38–$70/hr" },
    { city: "Canberra", state: "ACT", office: "$35–$65/hr", retail: "$30–$56/hr", medical: "$55–$95/hr", industrial: "$45–$80/hr" },
    { city: "Hobart", state: "TAS", office: "$30–$60/hr", retail: "$28–$52/hr", medical: "$50–$88/hr", industrial: "$40–$75/hr" },
    { city: "Darwin", state: "NT", office: "$38–$72/hr", retail: "$34–$62/hr", medical: "$60–$100/hr", industrial: "$50–$88/hr" },
];
const commonJobCosts = [
    ["Small office (200m², nightly)", "$80–$160/visit"],
    ["Large office (1,000m², nightly)", "$300–$600/visit"],
    ["Retail store (weekly clean)", "$150–$350/visit"],
    ["Medical / dental clinic (daily)", "$100–$250/visit"],
    ["Industrial / warehouse (weekly)", "$250–$600/visit"],
    ["End-of-lease commercial clean", "$400–$1,500"],
    ["Post-construction clean (per m²)", "$8–$20/m²"],
    ["Window cleaning – external (per pane)", "$5–$15/pane"],
    ["Carpet steam clean (commercial, per m²)", "$3–$8/m²"],
    ["High-pressure wash (external areas)", "$150–$500"],
];
const hiringTips = [
    { title: "Verify public liability insurance ($20M minimum)", body: "Commercial cleaning businesses must carry a minimum of $20 million in public liability insurance. For medical, food service, and government facilities, some contracts require $50M+. Always request the current certificate of currency before allowing any cleaner to access your premises.", icon: BadgeCheck },
    { title: "Confirm staff are security-cleared for your premises", body: "For offices with sensitive data, medical facilities, schools, or government buildings, cleaning staff may need police clearance or Working With Children Checks. Reputable commercial cleaners will have staff clearance policies — ask for documentation before starting.", icon: FileText },
    { title: "Specify exactly what is included in the scope", body: "Commercial cleaning quotes should detail exactly which tasks are included at what frequency: vacuuming, mopping, kitchen clean, bin emptying, toilet restocking, window cleaning. 'Office clean' means different things to different contractors — always get a written scope of works.", icon: ShieldCheck },
    { title: "Request references from comparable premises", body: "Ask for at least 2 references from similar-sized commercial premises. A commercial cleaner servicing small offices may not have the right equipment, staffing, or procedures for larger buildings or specialist environments like medical or industrial sites.", icon: Star },
];
const whyTradeRefer = [
    { title: "Verified cleaning businesses", body: "TradeRefer helps facility managers and business owners find ABN-verified commercial cleaning businesses — ensuring you're engaging a legitimate operator with proper insurance, not an informal contractor." },
    { title: "Compare costs before you call", body: "Use this hub to understand typical commercial cleaning hourly rates across Australian cities so you can benchmark any contractor quote before committing to a regular service agreement." },
    { title: "Australia-wide local discovery", body: "Navigate from this national commercial cleaning guide into city and suburb-level pages to find verified commercial cleaning businesses servicing the specific area where your premises are located." },
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

export default async function CommercialCleaningTradeHubPage() {
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
                        <span className="text-[#FF6600]">Commercial Cleaning</span>
                    </nav>
                    <div className="max-w-4xl">
                        <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-2 font-black text-orange-400 uppercase tracking-widest mb-6" style={{ fontSize: "16px" }}><Home className="w-4 h-4" />Australia-Wide Trade Hub</div>
                        <h1 className="font-black mb-6 leading-[1.05] font-display text-white" style={{ fontSize: "clamp(48px, 8vw, 80px)" }}>Find Verified <span className="text-[#FF6600]">Commercial Cleaners</span> Across Australia</h1>
                        <p className="text-zinc-400 max-w-3xl mb-8" style={{ fontSize: "20px", lineHeight: 1.7 }}>Use this TradeRefer commercial cleaning hub to compare office, retail, medical, and industrial cleaning rates across Australian cities, understand insurance requirements, and connect with verified local commercial cleaning businesses.</p>
                        <div className="flex flex-wrap gap-4">
                            <Link href="/quotes?trade=Cleaning&source=%2Ftrades%2Fcommercial-cleaning" className="bg-[#FF6600] hover:bg-[#E65C00] text-white font-black px-8 rounded-xl transition-colors inline-flex items-center justify-center gap-2" style={{ minHeight: "64px", fontSize: "18px" }}>Get 3 Free Quotes<ArrowRight className="w-5 h-5" /></Link>
                            <Link href="/businesses?category=Cleaning" className="bg-white/10 hover:bg-white/20 text-white font-black px-8 rounded-xl transition-colors border border-white/10 inline-flex items-center justify-center" style={{ minHeight: "64px", fontSize: "18px" }}>Browse Commercial Cleaners</Link>
                            <Link href="/local" className="bg-white/10 hover:bg-white/20 text-white font-black px-8 rounded-xl transition-colors border border-white/10 inline-flex items-center justify-center" style={{ minHeight: "64px", fontSize: "18px" }}>Browse by Location</Link>
                        </div>
                        <div className="flex flex-wrap gap-6 text-white font-bold mt-8" style={{ fontSize: "16px" }}>
                            <span className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-[#FF6600]" />Office cleaning from ${cost.low}–${cost.high}{cost.unit}</span>
                            {totalBusinesses > 0 && <span className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-[#FF6600]" />{totalBusinesses.toLocaleString()} cleaning businesses listed</span>}
                            {statesCovered > 0 && <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#FF6600]" />Available in {statesCovered} states & territories</span>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16">
                <div className="max-w-6xl mx-auto space-y-16">
                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><DollarSign className="w-6 h-6 text-[#FF6600]" />Commercial Cleaning Cost Guide Australia</h2>
                        <p className="text-zinc-500 mb-8" style={{ fontSize: "18px", lineHeight: 1.7 }}>Commercial cleaning rates vary by premises type, frequency, and scope. Use these city benchmarks to evaluate any regular service quote.</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100"><p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Office Cleaning Rate</p><p className="text-3xl font-black text-zinc-900">${cost.low}–${cost.high}</p><p className="text-zinc-500" style={{ fontSize: "16px" }}>{cost.unit}</p></div>
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100"><p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Medical / Clinic</p><p className="text-3xl font-black text-zinc-900">$48–$95</p><p className="text-zinc-500" style={{ fontSize: "16px" }}>per hour (higher spec)</p></div>
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100"><p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Insurance Required</p><p className="text-3xl font-black text-zinc-900">$20M+</p><p className="text-zinc-500" style={{ fontSize: "16px" }}>public liability minimum</p></div>
                        </div>
                        <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                            <table className="min-w-full text-left">
                                <thead className="bg-zinc-100 text-zinc-700"><tr><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>City</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Office (hr)</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Retail (hr)</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Medical (hr)</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Industrial (hr)</th></tr></thead>
                                <tbody>{cityPricing.map((row) => (<tr key={row.city} className="border-t border-zinc-200 bg-white"><td className="px-4 py-3 font-bold text-zinc-900" style={{ fontSize: "16px" }}>{row.city}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.office}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.retail}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.medical}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.industrial}</td></tr>))}</tbody>
                            </table>
                        </div>
                        <div className="mt-8">
                            <h3 className="font-black text-zinc-900 mb-4 font-display" style={{ fontSize: "24px" }}>Common Commercial Cleaning Job Costs</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{commonJobCosts.map(([label, value]) => (<div key={label} className="flex items-center justify-between bg-zinc-50 rounded-2xl border border-zinc-100 px-5 py-4 gap-4"><span className="font-bold text-zinc-700" style={{ fontSize: "16px" }}>{label}</span><span className="font-black text-zinc-900 whitespace-nowrap" style={{ fontSize: "16px" }}>{value}</span></div>))}</div>
                        </div>
                    </section>

                    <section className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8">
                        <div className="bg-white rounded-3xl border border-zinc-200 p-8">
                            <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><Wrench className="w-6 h-6 text-[#FF6600]" />Commercial Cleaning Services We Cover</h2>
                            <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>TradeRefer&apos;s commercial cleaning hub covers office, retail, medical, industrial, post-construction, and specialist cleaning services Australia-wide.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{services.map((service) => (<Link key={service} href={`/trades/${jobToSlug(service)}`} className="flex items-center justify-between px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl font-bold text-zinc-700 hover:bg-orange-50 hover:border-[#FF6600] hover:text-[#FF6600] transition-colors capitalize" style={{ fontSize: "16px" }}><span>{service}</span><ArrowRight className="w-4 h-4 text-zinc-300" /></Link>))}</div>
                        </div>
                        <div className="bg-white rounded-3xl border border-zinc-200 p-8">
                            <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "28px" }}><Clock3 className="w-5 h-5 text-blue-500" />Before You Hire a Commercial Cleaner</h2>
                            <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>Use these checks to avoid underinsured contractors, inadequate scope definitions, and non-compliant staff.</p>
                            <div className="space-y-4">{hiringTips.map(({ title, body, icon: Icon }) => (<div key={title} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-5"><div className="flex items-start gap-3 mb-2"><div className="w-10 h-10 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center shrink-0"><Icon className="w-5 h-5 text-[#FF6600]" /></div><h3 className="font-black text-zinc-900" style={{ fontSize: "18px" }}>{title}</h3></div><p className="text-zinc-600" style={{ fontSize: "16px", lineHeight: 1.7 }}>{body}</p></div>))}</div>
                        </div>
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><MapPin className="w-6 h-6 text-[#FF6600]" />Find Commercial Cleaners by City</h2>
                        <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>Browse Australian cities where TradeRefer has commercial cleaning businesses listed.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{featuredCities.map(({ city, state, stateSlug, citySlug }) => { const count = cityCounts[`${city.toLowerCase()}::${state}`] || 0; return (<Link key={`${city}-${state}`} href={`/local/${stateSlug}/${citySlug}?category=${encodeURIComponent(TRADE_NAME)}`} className="flex items-center justify-between px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl hover:bg-orange-50 hover:border-[#FF6600] transition-colors group"><div><span className="font-black text-zinc-900 group-hover:text-[#FF6600]" style={{ fontSize: "16px" }}>{city}</span><p className="text-zinc-400" style={{ fontSize: "16px" }}>{state} · {count > 0 ? `${count} listed` : "Browse local directory"}</p></div><ArrowRight className="w-5 h-5 text-zinc-300 group-hover:text-[#FF6600]" /></Link>); })}</div>
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <div className="max-w-3xl mb-8"><h2 className="font-black text-[#1A1A1A] mb-3 font-display" style={{ fontSize: "32px" }}>Get 3 Free Commercial Cleaning Quotes</h2><p className="text-zinc-500" style={{ fontSize: "18px", lineHeight: 1.7 }}>Request quotes here and we&apos;ll match your premises with up to 3 verified local commercial cleaning businesses.</p></div>
                        <PublicMultiQuoteForm initialTradeCategory="Cleaning" initialSourcePage="/trades/commercial-cleaning" />
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><FileText className="w-6 h-6 text-blue-500" />Cleaning Business Requirements by State</h2>
                        <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>Commercial cleaning is unlicensed in most states, but public liability insurance, staff clearances, and workplace safety compliance are mandatory for reputable operators.</p>
                        <div className="space-y-3">{Object.entries(STATE_LICENSING[TRADE_NAME]).map(([stateCode, text]) => (<div key={stateCode} className="bg-blue-50 border border-blue-100 rounded-2xl p-5"><p className="font-black text-blue-600 uppercase tracking-wider mb-2" style={{ fontSize: "14px" }}>{stateCode}</p><p className="text-zinc-700" style={{ fontSize: "16px", lineHeight: 1.7 }}>{text}</p></div>))}</div>
                    </section>

                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">{whyTradeRefer.map((item) => (<div key={item.title} className="bg-white rounded-3xl border border-zinc-200 p-8"><h2 className="font-black text-[#1A1A1A] mb-3 font-display" style={{ fontSize: "24px" }}>{item.title}</h2><p className="text-zinc-600" style={{ fontSize: "16px", lineHeight: 1.7 }}>{item.body}</p></div>))}</section>

                    <section>
                        <h2 className="font-black text-[#1A1A1A] mb-8 font-display" style={{ fontSize: "32px" }}>Commercial Cleaning: Frequently Asked Questions</h2>
                        <div className="space-y-4">{faqs.map((faq) => (<div key={faq.q} className="bg-white rounded-2xl border border-zinc-200 p-6"><h3 className="font-black text-zinc-900 mb-2" style={{ fontSize: "18px" }}>{faq.q}</h3><p className="text-zinc-600" style={{ fontSize: "16px", lineHeight: 1.7 }}>{faq.a}</p></div>))}</div>
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "28px" }}><Wrench className="w-5 h-5 text-[#FF6600]" />Related Trade Guides</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{relatedTrades.map((trade) => (<Link key={trade.href} href={trade.href} className="flex items-center justify-between px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl font-bold text-zinc-700 hover:bg-orange-50 hover:border-[#FF6600] hover:text-[#FF6600] transition-colors" style={{ fontSize: "16px" }}><span>{trade.label}</span><ArrowRight className="w-4 h-4 text-zinc-300" /></Link>))}</div>
                    </section>

                    <section className="bg-[#1A1A1A] rounded-3xl p-8 md:p-12 text-center text-white">
                        <h2 className="font-black mb-4 text-white" style={{ fontSize: "40px" }}>Need a Commercial Cleaner Near You?</h2>
                        <p className="text-zinc-400 mb-8 max-w-2xl mx-auto" style={{ fontSize: "20px", lineHeight: 1.7 }}>Browse verified local commercial cleaning businesses and find the right service for your office, retail, medical, or industrial premises.</p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link href="/quotes?trade=Cleaning&source=%2Ftrades%2Fcommercial-cleaning" className="inline-flex items-center gap-2 bg-[#FF6600] hover:bg-[#E65C00] text-white font-black rounded-xl px-8 transition-colors" style={{ minHeight: "64px", fontSize: "18px" }}>Get 3 Free Quotes <ArrowRight className="w-5 h-5" /></Link>
                            <Link href="/businesses?category=Cleaning" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-black rounded-xl px-8 transition-colors border border-white/10" style={{ minHeight: "64px", fontSize: "18px" }}>Browse Commercial Cleaners</Link>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
