import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, ChevronRight, Clock3, DollarSign, FileText, Home, MapPin, ShieldCheck, Star, Wrench } from "lucide-react";
import { sql } from "@/lib/db";
import { JOB_TYPES, STATE_LICENSING, TRADE_COST_GUIDE, TRADE_FAQ_BANK, jobToSlug } from "@/lib/constants";
import { PublicMultiQuoteForm } from "@/components/PublicMultiQuoteForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Glazing & Window Services Australia | Glaziers | TradeRefer",
    description: "Find trusted glaziers across Australia. Compare window replacement, double glazing, and glass repair costs by city, understand energy ratings, and hire verified local glazing businesses through TradeRefer.",
    alternates: { canonical: "https://traderefer.au/trades/glazing" },
    openGraph: { title: "Glazing & Window Services Australia | TradeRefer", description: "Compare window replacement costs, double glazing pricing, and verified local glaziers across Australia.", url: "https://traderefer.au/trades/glazing", type: "website" },
};

const TRADE_NAME = "Glazing & Windows";
const cost = TRADE_COST_GUIDE[TRADE_NAME];
const faqs = TRADE_FAQ_BANK[TRADE_NAME]?.slice(0, 6) ?? [];
const services = JOB_TYPES[TRADE_NAME]?.slice(0, 12) ?? [];
const relatedTrades = [
    { label: "Building", href: "/categories#building" },
    { label: "Carpentry", href: "/trades/carpentry" },
    { label: "Rendering", href: "/trades/rendering" },
    { label: "Painting", href: "/trades/painting" },
    { label: "Insulation", href: "/trades/insulation" },
    { label: "Solar Installation", href: "/trades/solar-installation" },
];
const cityPricing = [
    { city: "Sydney", state: "NSW", singlePane: "$300–$700", doubleGlaze: "$600–$1,400", fullReplacement: "$800–$2,500", repairPerPane: "$150–$400" },
    { city: "Melbourne", state: "VIC", singlePane: "$280–$650", doubleGlaze: "$550–$1,300", fullReplacement: "$750–$2,300", repairPerPane: "$140–$380" },
    { city: "Brisbane", state: "QLD", singlePane: "$260–$620", doubleGlaze: "$500–$1,200", fullReplacement: "$700–$2,200", repairPerPane: "$130–$360" },
    { city: "Perth", state: "WA", singlePane: "$270–$640", doubleGlaze: "$520–$1,250", fullReplacement: "$720–$2,300", repairPerPane: "$135–$370" },
    { city: "Adelaide", state: "SA", singlePane: "$260–$620", doubleGlaze: "$500–$1,200", fullReplacement: "$700–$2,200", repairPerPane: "$130–$360" },
    { city: "Canberra", state: "ACT", singlePane: "$300–$700", doubleGlaze: "$600–$1,400", fullReplacement: "$800–$2,500", repairPerPane: "$150–$400" },
    { city: "Hobart", state: "TAS", singlePane: "$280–$650", doubleGlaze: "$560–$1,350", fullReplacement: "$760–$2,350", repairPerPane: "$145–$390" },
    { city: "Darwin", state: "NT", singlePane: "$320–$750", doubleGlaze: "$650–$1,500", fullReplacement: "$900–$2,700", repairPerPane: "$160–$430" },
];
const commonJobCosts = [
    ["Single pane window replacement", "$300–$700"],
    ["Double glazed unit replacement", "$550–$1,400"],
    ["Full aluminium window replacement (standard)", "$750–$2,500"],
    ["Retrofit double glazing (secondary glazing)", "$400–$900/window"],
    ["Glass shower screen supply & install", "$800–$2,500"],
    ["Frameless glass balustrade (per lm)", "$300–$700/lm"],
    ["Sliding door glass replacement", "$400–$900"],
    ["Skylight supply & install", "$1,500–$4,500"],
    ["Emergency glass repair (after hours)", "$250–$600"],
    ["Window tinting (per m²)", "$80–$180/m²"],
];
const hiringTips = [
    { title: "Check energy star ratings for replacement windows", body: "In Victoria and ACT especially, new windows and glazing must meet minimum NatHERS energy performance requirements. WERS (Window Energy Rating Scheme) labels tell you the U-value and solar heat gain coefficient. In climate zones with cold winters (Melbourne, Canberra, Hobart), double glazing pays back in heating cost savings.", icon: BadgeCheck },
    { title: "Confirm safety glazing is used where required", body: "Australian Standard AS 1288 mandates safety (toughened or laminated) glass in any pane below 450mm from the floor, adjacent to doors, in bathrooms, and frameless shower screens. Ask your glazier to confirm which panes require safety glazing and verify it's specified in the quote.", icon: FileText },
    { title: "Understand the difference between double glazing and secondary glazing", body: "True double glazing is a sealed unit with an inert gas fill between panes. Secondary glazing adds a second pane in a new frame inside the existing window. Secondary glazing is cheaper ($400–$900/window vs $600–$1,400) but performs differently — understand which option you're being quoted before committing.", icon: ShieldCheck },
    { title: "Get measured on site before receiving a final price", body: "Window sizes vary significantly even within the same building. A professional glazier will always measure on site before providing a fixed price. Be very cautious of online or phone quotes without site measurements — they become estimates that can escalate significantly once the installer arrives.", icon: Star },
];
const whyTradeRefer = [
    { title: "Verified glazing businesses", body: "TradeRefer helps homeowners find ABN-verified glaziers who meet Australian glazing standards — important for energy performance compliance, safety glazing requirements, and quality installations that last." },
    { title: "Compare costs before you call", body: "Use this hub to understand typical window replacement and double glazing costs across Australian cities so you can benchmark quotes before committing to a glazier." },
    { title: "Australia-wide local discovery", body: "Navigate from this national glazing guide into city and suburb-level pages to find verified glazing businesses in the specific area where your property is located." },
];
const customFaqs = [
    { q: "How much does double glazing cost in Australia?", a: "A double glazed unit (IGU) replacement for a standard window costs $550–$1,400 depending on size, glass type, and frame. Full window replacement with new aluminium double-glazed frames costs $750–$2,500 per window. Whole-of-home double glazing can range from $10,000–$40,000+ depending on the number and size of windows." },
    { q: "Is double glazing worth it in Australia?", a: "In cold climate zones (Melbourne, Canberra, Hobart, alpine areas), double glazing typically pays back in energy savings within 5–10 years and dramatically improves winter comfort. In tropical climates (Darwin, Cairns), the priority is solar heat gain control, where low-SHGC tinted or coated glass may be more effective than double glazing." },
    { q: "What glass is required in bathroom windows?", a: "All glass in bathrooms within 1.5m of a bath or shower must be safety glass (toughened or laminated) under AS 1288. Obscure or frosted glass is required for privacy in bathroom windows facing neighbours or public areas — but obscure does not automatically mean safety glass, so confirm both requirements with your glazier." },
    { q: "How long does window replacement take?", a: "A single window replacement typically takes 30–90 minutes per window. Full-home window replacement (10–20 windows) usually takes 1–3 days. Measure, fabrication, and delivery for non-stock sizes adds 1–4 weeks lead time. Standard aluminium window sizes may be available from stock within a few days." },
    { q: "Can I claim double glazing as a tax deduction on a rental property?", a: "Window improvements to a rental property are generally capital improvements — not immediately deductible, but depreciable over time. In some cases, window replacement (like-for-like) may qualify as a repair and be immediately deductible. Always consult your accountant for your specific situation." },
    { q: "What is retrofit double glazing and how does it work?", a: "Retrofit double glazing (secondary glazing) installs a second glazed panel inside the existing window frame rather than replacing the window unit. This preserves the existing window frame (useful for heritage homes) and costs $400–$900 per window — cheaper than full replacement. It improves thermal and acoustic performance but typically not to the same level as purpose-built double glazed units." },
];
const activeFaqs = faqs.length > 0 ? faqs : customFaqs;

type StateCountRow = { state: string; count: string | number };
type CityCountRow = { city: string; state: string; count: string | number };
async function getBusinessCountByState(): Promise<Record<string, number>> {
    try {
        const results = await sql<StateCountRow[]>`SELECT state, COUNT(*) as count FROM businesses WHERE status = 'active' AND (trade_category ILIKE '%glaz%' OR trade_category ILIKE '%window%') AND state IS NOT NULL GROUP BY state ORDER BY count DESC`;
        const map: Record<string, number> = {};
        results.forEach((row) => { map[row.state] = parseInt(String(row.count), 10); });
        return map;
    } catch { return {}; }
}
async function getFeaturedCityCounts(): Promise<Record<string, number>> {
    try {
        const results = await sql<CityCountRow[]>`SELECT city, state, COUNT(*) as count FROM businesses WHERE status = 'active' AND (trade_category ILIKE '%glaz%' OR trade_category ILIKE '%window%') AND city IS NOT NULL AND city != '' GROUP BY city, state`;
        const map: Record<string, number> = {};
        results.forEach((row) => { map[`${String(row.city).toLowerCase()}::${String(row.state).toUpperCase()}`] = parseInt(String(row.count), 10); });
        return map;
    } catch { return {}; }
}

export default async function GlazingTradeHubPage() {
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
                        <span className="text-[#FF6600]">Glazing & Windows</span>
                    </nav>
                    <div className="max-w-4xl">
                        <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-2 font-black text-orange-400 uppercase tracking-widest mb-6" style={{ fontSize: "16px" }}><Home className="w-4 h-4" />Australia-Wide Trade Hub</div>
                        <h1 className="font-black mb-6 leading-[1.05] font-display text-white" style={{ fontSize: "clamp(48px, 8vw, 80px)" }}>Find Verified <span className="text-[#FF6600]">Glaziers</span> Across Australia</h1>
                        <p className="text-zinc-400 max-w-3xl mb-8" style={{ fontSize: "20px", lineHeight: 1.7 }}>Use this TradeRefer glazing hub to compare window replacement and double glazing costs across Australian cities, understand energy and safety glazing requirements, and connect with verified local glazing businesses.</p>
                        <div className="flex flex-wrap gap-4">
                            <Link href={`/quotes?trade=${encodeURIComponent(TRADE_NAME)}&source=%2Ftrades%2Fglazing`} className="bg-[#FF6600] hover:bg-[#E65C00] text-white font-black px-8 rounded-xl transition-colors inline-flex items-center justify-center gap-2" style={{ minHeight: "64px", fontSize: "18px" }}>Get 3 Free Quotes<ArrowRight className="w-5 h-5" /></Link>
                            <Link href={`/businesses?category=${encodeURIComponent(TRADE_NAME)}`} className="bg-white/10 hover:bg-white/20 text-white font-black px-8 rounded-xl transition-colors border border-white/10 inline-flex items-center justify-center" style={{ minHeight: "64px", fontSize: "18px" }}>Browse Glaziers</Link>
                            <Link href="/local" className="bg-white/10 hover:bg-white/20 text-white font-black px-8 rounded-xl transition-colors border border-white/10 inline-flex items-center justify-center" style={{ minHeight: "64px", fontSize: "18px" }}>Browse by Location</Link>
                        </div>
                        <div className="flex flex-wrap gap-6 text-white font-bold mt-8" style={{ fontSize: "16px" }}>
                            {cost && <span className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-[#FF6600]" />Window from ${cost.low}–${cost.high}{cost.unit}</span>}
                            {totalBusinesses > 0 && <span className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-[#FF6600]" />{totalBusinesses.toLocaleString()} glazing businesses listed</span>}
                            {statesCovered > 0 && <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#FF6600]" />Available in {statesCovered} states & territories</span>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16">
                <div className="max-w-6xl mx-auto space-y-16">
                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><DollarSign className="w-6 h-6 text-[#FF6600]" />Glazing Cost Guide Australia</h2>
                        <p className="text-zinc-500 mb-8" style={{ fontSize: "18px", lineHeight: 1.7 }}>Window and glazing costs vary by glass type, frame material, size, and access. Always get a fixed on-site quote — not a phone estimate.</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100"><p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Single Pane Replacement</p><p className="text-3xl font-black text-zinc-900">$300–$700</p><p className="text-zinc-500" style={{ fontSize: "16px" }}>per standard window</p></div>
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100"><p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Double Glazed Unit</p><p className="text-3xl font-black text-zinc-900">$550–$1,400</p><p className="text-zinc-500" style={{ fontSize: "16px" }}>per window, standard size</p></div>
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100"><p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Safety Glass Required</p><p className="text-3xl font-black text-zinc-900">AS 1288</p><p className="text-zinc-500" style={{ fontSize: "16px" }}>bathrooms, low panes, doors</p></div>
                        </div>
                        <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                            <table className="min-w-full text-left">
                                <thead className="bg-zinc-100 text-zinc-700"><tr><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>City</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Single Pane</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Double Glazed</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Full Replacement</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Glass Repair</th></tr></thead>
                                <tbody>{cityPricing.map((row) => (<tr key={row.city} className="border-t border-zinc-200 bg-white"><td className="px-4 py-3 font-bold text-zinc-900" style={{ fontSize: "16px" }}>{row.city}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.singlePane}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.doubleGlaze}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.fullReplacement}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.repairPerPane}</td></tr>))}</tbody>
                            </table>
                        </div>
                        <div className="mt-8">
                            <h3 className="font-black text-zinc-900 mb-4 font-display" style={{ fontSize: "24px" }}>Common Glazing Job Costs</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{commonJobCosts.map(([label, value]) => (<div key={label} className="flex items-center justify-between bg-zinc-50 rounded-2xl border border-zinc-100 px-5 py-4 gap-4"><span className="font-bold text-zinc-700" style={{ fontSize: "16px" }}>{label}</span><span className="font-black text-zinc-900 whitespace-nowrap" style={{ fontSize: "16px" }}>{value}</span></div>))}</div>
                        </div>
                    </section>

                    <section className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8">
                        <div className="bg-white rounded-3xl border border-zinc-200 p-8">
                            <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><Wrench className="w-6 h-6 text-[#FF6600]" />Glazing Services We Cover</h2>
                            <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>TradeRefer&apos;s glazing hub covers window replacement, double glazing, glass shower screens, balustrades, skylights, tinting, and emergency glass repairs Australia-wide.</p>
                            {services.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{services.map((service) => (<Link key={service} href={`/trades/${jobToSlug(service)}`} className="flex items-center justify-between px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl font-bold text-zinc-700 hover:bg-orange-50 hover:border-[#FF6600] hover:text-[#FF6600] transition-colors capitalize" style={{ fontSize: "16px" }}><span>{service}</span><ArrowRight className="w-4 h-4 text-zinc-300" /></Link>))}</div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{["Window replacement", "Double glazing", "Glass shower screens", "Frameless balustrade", "Skylights", "Window tinting", "Glass repairs", "Splashback glazing", "Security glazing", "Emergency glass"].map((s) => (<div key={s} className="px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl font-bold text-zinc-700 capitalize" style={{ fontSize: "16px" }}>{s}</div>))}</div>
                            )}
                        </div>
                        <div className="bg-white rounded-3xl border border-zinc-200 p-8">
                            <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "28px" }}><Clock3 className="w-5 h-5 text-blue-500" />Before You Hire a Glazier</h2>
                            <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>Use these checks to ensure compliant safety glazing, energy performance, and accurate fixed-price quotes.</p>
                            <div className="space-y-4">{hiringTips.map(({ title, body, icon: Icon }) => (<div key={title} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-5"><div className="flex items-start gap-3 mb-2"><div className="w-10 h-10 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center shrink-0"><Icon className="w-5 h-5 text-[#FF6600]" /></div><h3 className="font-black text-zinc-900" style={{ fontSize: "18px" }}>{title}</h3></div><p className="text-zinc-600" style={{ fontSize: "16px", lineHeight: 1.7 }}>{body}</p></div>))}</div>
                        </div>
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><MapPin className="w-6 h-6 text-[#FF6600]" />Find Glaziers by City</h2>
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
                        <div className="max-w-3xl mb-8"><h2 className="font-black text-[#1A1A1A] mb-3 font-display" style={{ fontSize: "32px" }}>Get 3 Free Glazing Quotes</h2><p className="text-zinc-500" style={{ fontSize: "18px", lineHeight: 1.7 }}>Request quotes here and we&apos;ll match your project with up to 3 verified local glazing businesses.</p></div>
                        <PublicMultiQuoteForm initialTradeCategory={TRADE_NAME} initialSourcePage="/trades/glazing" />
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><FileText className="w-6 h-6 text-blue-500" />Glazing Licensing Requirements by State</h2>
                        <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>Glazing licensing requirements vary by state — here&apos;s what applies where your property is located.</p>
                        <div className="space-y-3">{Object.entries(STATE_LICENSING[TRADE_NAME] ?? {}).map(([stateCode, text]) => (<div key={stateCode} className="bg-blue-50 border border-blue-100 rounded-2xl p-5"><p className="font-black text-blue-600 uppercase tracking-wider mb-2" style={{ fontSize: "14px" }}>{stateCode}</p><p className="text-zinc-700" style={{ fontSize: "16px", lineHeight: 1.7 }}>{text as string}</p></div>))}</div>
                    </section>

                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">{whyTradeRefer.map((item) => (<div key={item.title} className="bg-white rounded-3xl border border-zinc-200 p-8"><h2 className="font-black text-[#1A1A1A] mb-3 font-display" style={{ fontSize: "24px" }}>{item.title}</h2><p className="text-zinc-600" style={{ fontSize: "16px", lineHeight: 1.7 }}>{item.body}</p></div>))}</section>

                    <section>
                        <h2 className="font-black text-[#1A1A1A] mb-8 font-display" style={{ fontSize: "32px" }}>Glazing & Windows: Frequently Asked Questions</h2>
                        <div className="space-y-4">{activeFaqs.map((faq) => (<div key={faq.q} className="bg-white rounded-2xl border border-zinc-200 p-6"><h3 className="font-black text-zinc-900 mb-2" style={{ fontSize: "18px" }}>{faq.q}</h3><p className="text-zinc-600" style={{ fontSize: "16px", lineHeight: 1.7 }}>{faq.a}</p></div>))}</div>
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "28px" }}><Wrench className="w-5 h-5 text-[#FF6600]" />Related Trade Guides</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{relatedTrades.map((trade) => (<Link key={trade.href} href={trade.href} className="flex items-center justify-between px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl font-bold text-zinc-700 hover:bg-orange-50 hover:border-[#FF6600] hover:text-[#FF6600] transition-colors" style={{ fontSize: "16px" }}><span>{trade.label}</span><ArrowRight className="w-4 h-4 text-zinc-300" /></Link>))}</div>
                    </section>

                    <section className="bg-[#1A1A1A] rounded-3xl p-8 md:p-12 text-center text-white">
                        <h2 className="font-black mb-4 text-white" style={{ fontSize: "40px" }}>Need a Glazier Near You?</h2>
                        <p className="text-zinc-400 mb-8 max-w-2xl mx-auto" style={{ fontSize: "20px", lineHeight: 1.7 }}>Browse verified local glazing businesses and find the right glazier for your window replacement, double glazing, or glass repair project.</p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link href={`/quotes?trade=${encodeURIComponent(TRADE_NAME)}&source=%2Ftrades%2Fglazing`} className="inline-flex items-center gap-2 bg-[#FF6600] hover:bg-[#E65C00] text-white font-black rounded-xl px-8 transition-colors" style={{ minHeight: "64px", fontSize: "18px" }}>Get 3 Free Quotes <ArrowRight className="w-5 h-5" /></Link>
                            <Link href={`/businesses?category=${encodeURIComponent(TRADE_NAME)}`} className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-black rounded-xl px-8 transition-colors border border-white/10" style={{ minHeight: "64px", fontSize: "18px" }}>Browse Glaziers</Link>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
