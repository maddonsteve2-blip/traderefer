import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, ChevronRight, Clock3, DollarSign, FileText, Home, MapPin, ShieldCheck, Star, Wrench } from "lucide-react";
import { sql } from "@/lib/db";
import { JOB_TYPES, STATE_LICENSING, TRADE_COST_GUIDE, TRADE_FAQ_BANK, jobToSlug } from "@/lib/constants";
import { PublicMultiQuoteForm } from "@/components/PublicMultiQuoteForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "House Cleaning Services Australia | Find Verified House Cleaners | TradeRefer",
    description: "Find trusted house cleaners across Australia. Compare regular and end-of-lease cleaning costs by city, understand what to look for, and hire verified local house cleaning businesses through TradeRefer.",
    alternates: { canonical: "https://traderefer.au/trades/house-cleaning" },
    openGraph: { title: "House Cleaning Services Australia | TradeRefer", description: "Compare house cleaning costs, end-of-lease cleaning prices, and verified local house cleaners across Australia.", url: "https://traderefer.au/trades/house-cleaning", type: "website" },
};

const TRADE_NAME = "Cleaning";
const cost = TRADE_COST_GUIDE[TRADE_NAME];
const faqs = TRADE_FAQ_BANK[TRADE_NAME].slice(0, 6);
const services = JOB_TYPES[TRADE_NAME]?.slice(0, 12) ?? [];
const relatedTrades = [
    { label: "Commercial Cleaning", href: "/trades/commercial-cleaning" },
    { label: "Pest Control", href: "/trades/pest-control" },
    { label: "Carpet Cleaning", href: "/categories#cleaning" },
    { label: "Painting", href: "/trades/painting" },
    { label: "Landscaping", href: "/trades/landscaping" },
    { label: "Handyman", href: "/categories#handyman" },
];
const cityPricing = [
    { city: "Sydney", state: "NSW", regular: "$35–$65/hr", endOfLease: "$350–$700", deepClean: "$300–$600", spring: "$250–$500" },
    { city: "Melbourne", state: "VIC", regular: "$30–$60/hr", endOfLease: "$300–$650", deepClean: "$260–$550", spring: "$220–$450" },
    { city: "Brisbane", state: "QLD", regular: "$28–$58/hr", endOfLease: "$280–$600", deepClean: "$240–$520", spring: "$200–$420" },
    { city: "Perth", state: "WA", regular: "$30–$62/hr", endOfLease: "$300–$650", deepClean: "$260–$540", spring: "$220–$440" },
    { city: "Adelaide", state: "SA", regular: "$27–$55/hr", endOfLease: "$270–$580", deepClean: "$230–$500", spring: "$190–$400" },
    { city: "Canberra", state: "ACT", regular: "$32–$65/hr", endOfLease: "$320–$680", deepClean: "$280–$560", spring: "$230–$460" },
    { city: "Hobart", state: "TAS", regular: "$30–$60/hr", endOfLease: "$290–$620", deepClean: "$250–$520", spring: "$210–$430" },
    { city: "Darwin", state: "NT", regular: "$35–$68/hr", endOfLease: "$350–$720", deepClean: "$300–$580", spring: "$250–$480" },
];
const commonJobCosts = [
    ["Regular fortnightly clean (3-bed home)", "$130–$280"],
    ["Weekly clean (3-bed home)", "$100–$220"],
    ["End-of-lease clean (3-bed home)", "$280–$650"],
    ["End-of-lease + carpet steam clean", "$400–$850"],
    ["Deep clean (neglected property, 3-bed)", "$300–$600"],
    ["Spring clean (seasonal, 3-bed)", "$200–$450"],
    ["Oven clean (add-on service)", "$50–$120"],
    ["Window cleaning (interior, per home)", "$80–$180"],
    ["Carpet steam clean (3-bed home)", "$150–$350"],
    ["Move-in clean (empty property)", "$200–$450"],
];
const hiringTips = [
    { title: "Always use an insured cleaner", body: "A professional house cleaner must carry public liability insurance (minimum $5–$10M) and workers compensation if they have employees. This protects you if a cleaner is injured in your home or accidentally damages your property. Ask for the certificate of currency before the first visit.", icon: BadgeCheck },
    { title: "Understand what an end-of-lease clean covers", body: "An 'end-of-lease clean' should be a full bond-back standard clean including oven, rangehood, blinds, skirting boards, and window tracks. Many cheap end-of-lease quotes exclude these items. Get an itemised scope in writing — your bond return depends on it.", icon: FileText },
    { title: "Check reviews and get references", body: "House cleaning is highly trust-based — cleaners have access to your home, often without you present. Always read Google or TradeRefer reviews, and ask for references for regular cleaning services. A cleaner with no verifiable reviews is a higher risk.", icon: ShieldCheck },
    { title: "Provide access instructions and a priority list", body: "A written brief before the first clean dramatically improves outcomes. List your priority areas, any products you prefer used (or avoided), access instructions, and areas to skip. Good cleaners work to a checklist — great results start with clear communication.", icon: Star },
];
const whyTradeRefer = [
    { title: "Verified house cleaning businesses", body: "TradeRefer helps homeowners find ABN-verified, insured house cleaning businesses — not individuals operating cash-in-hand without insurance coverage or accountability." },
    { title: "Compare costs before you call", body: "Use this hub to understand typical house cleaning rates and end-of-lease clean costs across Australian cities so you can benchmark any quote before committing to a cleaner." },
    { title: "Australia-wide local discovery", body: "Navigate from this national house cleaning guide into city and suburb-level pages to find verified house cleaners in the specific area where your property is located." },
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

export default async function HouseCleaningTradeHubPage() {
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
                        <span className="text-[#FF6600]">House Cleaning</span>
                    </nav>
                    <div className="max-w-4xl">
                        <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-2 font-black text-orange-400 uppercase tracking-widest mb-6" style={{ fontSize: "16px" }}><Home className="w-4 h-4" />Australia-Wide Trade Hub</div>
                        <h1 className="font-black mb-6 leading-[1.05] font-display text-white" style={{ fontSize: "clamp(48px, 8vw, 80px)" }}>Find Verified <span className="text-[#FF6600]">House Cleaners</span> Across Australia</h1>
                        <p className="text-zinc-400 max-w-3xl mb-8" style={{ fontSize: "20px", lineHeight: 1.7 }}>Use this TradeRefer house cleaning hub to compare regular, end-of-lease, and deep cleaning costs across Australian cities, understand what to look for in a cleaner, and connect with verified local house cleaning businesses.</p>
                        <div className="flex flex-wrap gap-4">
                            <Link href="/quotes?trade=Cleaning&source=%2Ftrades%2Fhouse-cleaning" className="bg-[#FF6600] hover:bg-[#E65C00] text-white font-black px-8 rounded-xl transition-colors inline-flex items-center justify-center gap-2" style={{ minHeight: "64px", fontSize: "18px" }}>Get 3 Free Quotes<ArrowRight className="w-5 h-5" /></Link>
                            <Link href="/businesses?category=Cleaning" className="bg-white/10 hover:bg-white/20 text-white font-black px-8 rounded-xl transition-colors border border-white/10 inline-flex items-center justify-center" style={{ minHeight: "64px", fontSize: "18px" }}>Browse House Cleaners</Link>
                            <Link href="/local" className="bg-white/10 hover:bg-white/20 text-white font-black px-8 rounded-xl transition-colors border border-white/10 inline-flex items-center justify-center" style={{ minHeight: "64px", fontSize: "18px" }}>Browse by Location</Link>
                        </div>
                        <div className="flex flex-wrap gap-6 text-white font-bold mt-8" style={{ fontSize: "16px" }}>
                            <span className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-[#FF6600]" />Regular clean from ${cost.low}–${cost.high}{cost.unit}</span>
                            {totalBusinesses > 0 && <span className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-[#FF6600]" />{totalBusinesses.toLocaleString()} cleaning businesses listed</span>}
                            {statesCovered > 0 && <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#FF6600]" />Available in {statesCovered} states & territories</span>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16">
                <div className="max-w-6xl mx-auto space-y-16">
                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><DollarSign className="w-6 h-6 text-[#FF6600]" />House Cleaning Cost Guide Australia</h2>
                        <p className="text-zinc-500 mb-8" style={{ fontSize: "18px", lineHeight: 1.7 }}>Cleaning costs vary by service type, home size, and frequency. End-of-lease cleans are typically priced by scope, not by the hour. Use these benchmarks before booking.</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100"><p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Regular Clean Rate</p><p className="text-3xl font-black text-zinc-900">${cost.low}–${cost.high}</p><p className="text-zinc-500" style={{ fontSize: "16px" }}>{cost.unit}</p></div>
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100"><p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>End-of-Lease (3-bed)</p><p className="text-3xl font-black text-zinc-900">$280–$650</p><p className="text-zinc-500" style={{ fontSize: "16px" }}>bond-back standard</p></div>
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100"><p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Deep Clean (3-bed)</p><p className="text-3xl font-black text-zinc-900">$240–$600</p><p className="text-zinc-500" style={{ fontSize: "16px" }}>one-off thorough clean</p></div>
                        </div>
                        <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                            <table className="min-w-full text-left">
                                <thead className="bg-zinc-100 text-zinc-700"><tr><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>City</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Regular (hr)</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>End-of-Lease</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Deep Clean</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Spring Clean</th></tr></thead>
                                <tbody>{cityPricing.map((row) => (<tr key={row.city} className="border-t border-zinc-200 bg-white"><td className="px-4 py-3 font-bold text-zinc-900" style={{ fontSize: "16px" }}>{row.city}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.regular}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.endOfLease}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.deepClean}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.spring}</td></tr>))}</tbody>
                            </table>
                        </div>
                        <div className="mt-8">
                            <h3 className="font-black text-zinc-900 mb-4 font-display" style={{ fontSize: "24px" }}>Common House Cleaning Job Costs</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{commonJobCosts.map(([label, value]) => (<div key={label} className="flex items-center justify-between bg-zinc-50 rounded-2xl border border-zinc-100 px-5 py-4 gap-4"><span className="font-bold text-zinc-700" style={{ fontSize: "16px" }}>{label}</span><span className="font-black text-zinc-900 whitespace-nowrap" style={{ fontSize: "16px" }}>{value}</span></div>))}</div>
                        </div>
                    </section>

                    <section className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8">
                        <div className="bg-white rounded-3xl border border-zinc-200 p-8">
                            <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><Wrench className="w-6 h-6 text-[#FF6600]" />House Cleaning Services We Cover</h2>
                            <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>TradeRefer&apos;s house cleaning hub covers regular, end-of-lease, deep, spring, move-in, and post-renovation cleaning services Australia-wide.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{services.map((service) => (<Link key={service} href={`/trades/${jobToSlug(service)}`} className="flex items-center justify-between px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl font-bold text-zinc-700 hover:bg-orange-50 hover:border-[#FF6600] hover:text-[#FF6600] transition-colors capitalize" style={{ fontSize: "16px" }}><span>{service}</span><ArrowRight className="w-4 h-4 text-zinc-300" /></Link>))}</div>
                        </div>
                        <div className="bg-white rounded-3xl border border-zinc-200 p-8">
                            <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "28px" }}><Clock3 className="w-5 h-5 text-blue-500" />Before You Hire a House Cleaner</h2>
                            <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>Use these checks to find a trustworthy, insured cleaner and avoid bond-back disputes with your landlord.</p>
                            <div className="space-y-4">{hiringTips.map(({ title, body, icon: Icon }) => (<div key={title} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-5"><div className="flex items-start gap-3 mb-2"><div className="w-10 h-10 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center shrink-0"><Icon className="w-5 h-5 text-[#FF6600]" /></div><h3 className="font-black text-zinc-900" style={{ fontSize: "18px" }}>{title}</h3></div><p className="text-zinc-600" style={{ fontSize: "16px", lineHeight: 1.7 }}>{body}</p></div>))}</div>
                        </div>
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><MapPin className="w-6 h-6 text-[#FF6600]" />Find House Cleaners by City</h2>
                        <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>Browse Australian cities where TradeRefer has house cleaning businesses listed.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{featuredCities.map(({ city, state, stateSlug, citySlug }) => { const count = cityCounts[`${city.toLowerCase()}::${state}`] || 0; return (<Link key={`${city}-${state}`} href={`/local/${stateSlug}/${citySlug}?category=${encodeURIComponent(TRADE_NAME)}`} className="flex items-center justify-between px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl hover:bg-orange-50 hover:border-[#FF6600] transition-colors group"><div><span className="font-black text-zinc-900 group-hover:text-[#FF6600]" style={{ fontSize: "16px" }}>{city}</span><p className="text-zinc-400" style={{ fontSize: "16px" }}>{state} · {count > 0 ? `${count} listed` : "Browse local directory"}</p></div><ArrowRight className="w-5 h-5 text-zinc-300 group-hover:text-[#FF6600]" /></Link>); })}</div>
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <div className="max-w-3xl mb-8"><h2 className="font-black text-[#1A1A1A] mb-3 font-display" style={{ fontSize: "32px" }}>Get 3 Free House Cleaning Quotes</h2><p className="text-zinc-500" style={{ fontSize: "18px", lineHeight: 1.7 }}>Request quotes here and we&apos;ll match your home with up to 3 verified local house cleaning businesses.</p></div>
                        <PublicMultiQuoteForm initialTradeCategory="Cleaning" initialSourcePage="/trades/house-cleaning" />
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><FileText className="w-6 h-6 text-blue-500" />Cleaning Business Requirements by State</h2>
                        <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>House cleaning is unlicensed in all Australian states, but reputable businesses carry public liability insurance, workers compensation, and have police-cleared staff.</p>
                        <div className="space-y-3">{Object.entries(STATE_LICENSING[TRADE_NAME]).map(([stateCode, text]) => (<div key={stateCode} className="bg-blue-50 border border-blue-100 rounded-2xl p-5"><p className="font-black text-blue-600 uppercase tracking-wider mb-2" style={{ fontSize: "14px" }}>{stateCode}</p><p className="text-zinc-700" style={{ fontSize: "16px", lineHeight: 1.7 }}>{text}</p></div>))}</div>
                    </section>

                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">{whyTradeRefer.map((item) => (<div key={item.title} className="bg-white rounded-3xl border border-zinc-200 p-8"><h2 className="font-black text-[#1A1A1A] mb-3 font-display" style={{ fontSize: "24px" }}>{item.title}</h2><p className="text-zinc-600" style={{ fontSize: "16px", lineHeight: 1.7 }}>{item.body}</p></div>))}</section>

                    <section>
                        <h2 className="font-black text-[#1A1A1A] mb-8 font-display" style={{ fontSize: "32px" }}>House Cleaning: Frequently Asked Questions</h2>
                        <div className="space-y-4">{faqs.map((faq) => (<div key={faq.q} className="bg-white rounded-2xl border border-zinc-200 p-6"><h3 className="font-black text-zinc-900 mb-2" style={{ fontSize: "18px" }}>{faq.q}</h3><p className="text-zinc-600" style={{ fontSize: "16px", lineHeight: 1.7 }}>{faq.a}</p></div>))}</div>
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "28px" }}><Wrench className="w-5 h-5 text-[#FF6600]" />Related Trade Guides</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{relatedTrades.map((trade) => (<Link key={trade.href} href={trade.href} className="flex items-center justify-between px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl font-bold text-zinc-700 hover:bg-orange-50 hover:border-[#FF6600] hover:text-[#FF6600] transition-colors" style={{ fontSize: "16px" }}><span>{trade.label}</span><ArrowRight className="w-4 h-4 text-zinc-300" /></Link>))}</div>
                    </section>

                    <section className="bg-[#1A1A1A] rounded-3xl p-8 md:p-12 text-center text-white">
                        <h2 className="font-black mb-4 text-white" style={{ fontSize: "40px" }}>Need a House Cleaner Near You?</h2>
                        <p className="text-zinc-400 mb-8 max-w-2xl mx-auto" style={{ fontSize: "20px", lineHeight: 1.7 }}>Browse verified local house cleaning businesses and find the right cleaner for your regular, end-of-lease, or deep cleaning needs.</p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link href="/quotes?trade=Cleaning&source=%2Ftrades%2Fhouse-cleaning" className="inline-flex items-center gap-2 bg-[#FF6600] hover:bg-[#E65C00] text-white font-black rounded-xl px-8 transition-colors" style={{ minHeight: "64px", fontSize: "18px" }}>Get 3 Free Quotes <ArrowRight className="w-5 h-5" /></Link>
                            <Link href="/businesses?category=Cleaning" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-black rounded-xl px-8 transition-colors border border-white/10" style={{ minHeight: "64px", fontSize: "18px" }}>Browse House Cleaners</Link>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
