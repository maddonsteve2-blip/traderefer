import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, ChevronRight, Clock3, DollarSign, FileText, Home, MapPin, ShieldCheck, Star, Wrench } from "lucide-react";
import { sql } from "@/lib/db";
import { JOB_TYPES, STATE_LICENSING, TRADE_COST_GUIDE, TRADE_FAQ_BANK, jobToSlug } from "@/lib/constants";
import { PublicMultiQuoteForm } from "@/components/PublicMultiQuoteForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Insulation Services Australia | Find Verified Insulation Installers | TradeRefer",
    description: "Find trusted insulation installers across Australia. Compare ceiling, wall, and underfloor insulation costs by city, understand R-value requirements, and hire verified local insulation businesses through TradeRefer.",
    alternates: { canonical: "https://traderefer.au/trades/insulation" },
    openGraph: { title: "Insulation Services Australia | TradeRefer", description: "Compare insulation costs, R-value requirements, and verified local insulation installers across Australia.", url: "https://traderefer.au/trades/insulation", type: "website" },
};

const TRADE_NAME = "Insulation";
const cost = TRADE_COST_GUIDE[TRADE_NAME];
const faqs = TRADE_FAQ_BANK[TRADE_NAME]?.slice(0, 6) ?? [];
const services = JOB_TYPES[TRADE_NAME]?.slice(0, 12) ?? [];
const relatedTrades = [
    { label: "Solar Installation", href: "/trades/solar-installation" },
    { label: "Roofing", href: "/trades/roofing" },
    { label: "Glazing & Windows", href: "/trades/glazing" },
    { label: "Building", href: "/categories#building" },
    { label: "Air Conditioning", href: "/trades/air-conditioning" },
    { label: "Rendering", href: "/trades/rendering" },
];
const cityPricing = [
    { city: "Sydney", state: "NSW", ceiling: "$12–$22/m²", wall: "$18–$35/m²", underfloor: "$15–$28/m²", house90: "$3,000–$6,000" },
    { city: "Melbourne", state: "VIC", ceiling: "$12–$22/m²", wall: "$18–$35/m²", underfloor: "$15–$28/m²", house90: "$3,200–$6,500" },
    { city: "Brisbane", state: "QLD", ceiling: "$10–$18/m²", wall: "$15–$28/m²", underfloor: "$12–$22/m²", house90: "$2,500–$5,000" },
    { city: "Perth", state: "WA", ceiling: "$11–$20/m²", wall: "$16–$30/m²", underfloor: "$13–$24/m²", house90: "$2,800–$5,500" },
    { city: "Adelaide", state: "SA", ceiling: "$11–$20/m²", wall: "$16–$30/m²", underfloor: "$13–$24/m²", house90: "$2,800–$5,500" },
    { city: "Canberra", state: "ACT", ceiling: "$14–$25/m²", wall: "$20–$38/m²", underfloor: "$16–$30/m²", house90: "$3,500–$7,000" },
    { city: "Hobart", state: "TAS", ceiling: "$14–$25/m²", wall: "$20–$38/m²", underfloor: "$16–$30/m²", house90: "$3,500–$7,000" },
    { city: "Darwin", state: "NT", ceiling: "$10–$18/m²", wall: "$14–$26/m²", underfloor: "$11–$20/m²", house90: "$2,200–$4,500" },
];
const commonJobCosts = [
    ["Ceiling insulation – batts (per m²)", "$10–$22/m²"],
    ["Blown-in ceiling insulation (per m²)", "$12–$20/m²"],
    ["Wall insulation – new build (per m²)", "$15–$35/m²"],
    ["Wall insulation – retrofit injection (per m²)", "$25–$55/m²"],
    ["Underfloor insulation – batts (per m²)", "$12–$28/m²"],
    ["Roof insulation upgrade (90m² home)", "$2,500–$6,500"],
    ["Sarking (roof underlay, per m²)", "$8–$18/m²"],
    ["Acoustic wall insulation (per m²)", "$20–$45/m²"],
    ["Existing insulation removal (per m²)", "$8–$18/m²"],
    ["Insulation top-up (existing ceiling)", "$8–$15/m²"],
];
const hiringTips = [
    { title: "Specify the R-value for your climate zone", body: "The National Construction Code requires minimum insulation R-values that vary by climate zone — from R1.3 in tropical Darwin to R6.3 for roofs in alpine zones. Always specify the required R-value in your quote and confirm it matches your climate zone requirements, not just 'standard insulation'.", icon: BadgeCheck },
    { title: "Check if government rebates apply to your installation", body: "Victoria's Energy Upgrades program and other state schemes subsidise ceiling and underfloor insulation for eligible households. Check energyupgrade.vic.gov.au (VIC) and your state's energy department before paying full price — rebate-eligible installs can cost as little as $0–$1,500.", icon: FileText },
    { title: "Confirm no gaps, compression, or moisture barriers are missed", body: "Insulation effectiveness drops dramatically if batts are compressed (to fit), have gaps at junctions, or are installed without required vapour barriers in high-humidity zones. Ask your installer specifically how they handle edges, penetrations, and downlights — these areas are the most common failure points.", icon: ShieldCheck },
    { title: "Ensure downlights are IC-rated or clearance is maintained", body: "Recessed downlights generate heat that can cause a fire if covered with insulation. The installer must either use IC-rated (insulation contact) downlights or maintain a 75mm clearance around each light. This is a mandatory fire safety requirement — confirm compliance in writing before starting.", icon: Star },
];
const whyTradeRefer = [
    { title: "Verified insulation businesses", body: "TradeRefer helps homeowners find ABN-verified insulation installers who comply with NCC R-value requirements and fire safety standards around downlights — critical for both energy performance and building compliance." },
    { title: "Compare costs before you call", body: "Use this hub to understand typical insulation costs per square metre across Australian cities so you can benchmark any quote and identify whether government rebates apply to your installation." },
    { title: "Australia-wide local discovery", body: "Navigate from this national insulation guide into city and suburb-level pages to find verified insulation businesses servicing the specific area where your property is located." },
];
const customFaqs = [
    { q: "What R-value insulation do I need in Australia?", a: "Required R-values vary by climate zone under the National Construction Code. As a guide: Darwin (zone 1) needs R1.3+ ceiling insulation; Brisbane (zone 2) needs R2.7+; Sydney/Perth (zone 5) needs R3.5–R4.1+; Melbourne (zone 6) needs R4.1–R5.1+; Canberra (zone 7) needs R5.1–R6.3+. Higher R-values cost more but deliver greater energy savings." },
    { q: "How much can insulation reduce my energy bills?", a: "Well-installed ceiling insulation typically reduces heating and cooling costs by 30–45% in a poorly insulated home. The payback period for ceiling insulation is typically 2–5 years, making it one of the highest-ROI home improvements available in Australia, particularly when combined with available government rebates." },
    { q: "Can I install insulation myself in Australia?", a: "Ceiling batt insulation can legally be installed by homeowners in some states, but wall and underfloor insulation is more complex. Working in roof spaces carries significant safety risks (heat, asbestos, electrical hazards). Most energy rebate schemes require professional installation by a registered contractor to qualify." },
    { q: "What is the difference between batts and blown insulation?", a: "Insulation batts are pre-cut glass wool, rockwool, or polyester sections placed between framing members. Blown insulation (loose-fill) is machine-blown into cavity spaces — ideal for retrofitting in existing ceilings without removing the lining. Blown insulation provides better coverage of irregular spaces but may settle over time." },
    { q: "Does insulation help with noise as well as temperature?", a: "Yes — acoustic insulation (typically higher-density rockwool or polyester) reduces sound transmission between rooms. Standard thermal batts provide some acoustic benefit, but dedicated acoustic batts have higher noise reduction coefficients. For party walls, acoustic insulation can make a significant difference to noise levels between rooms." },
    { q: "How do I know if my existing insulation needs replacing?", a: "Insulation over 25–30 years old should be inspected. Signs it needs replacement include: energy bills much higher than similar-sized homes, visible gaps or compression of batts, rodent damage, moisture contamination, or if the insulation was installed before 2010 without adequate downlight clearance. A professional inspection costs $150–$300." },
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

export default async function InsulationTradeHubPage() {
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
                        <span className="text-[#FF6600]">Insulation</span>
                    </nav>
                    <div className="max-w-4xl">
                        <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-2 font-black text-orange-400 uppercase tracking-widest mb-6" style={{ fontSize: "16px" }}><Home className="w-4 h-4" />Australia-Wide Trade Hub</div>
                        <h1 className="font-black mb-6 leading-[1.05] font-display text-white" style={{ fontSize: "clamp(48px, 8vw, 80px)" }}>Find Verified <span className="text-[#FF6600]">Insulation</span> Installers Across Australia</h1>
                        <p className="text-zinc-400 max-w-3xl mb-8" style={{ fontSize: "20px", lineHeight: 1.7 }}>Use this TradeRefer insulation hub to compare ceiling, wall, and underfloor insulation costs across Australian cities, understand R-value requirements by climate zone, and check available government rebates before you book.</p>
                        <div className="flex flex-wrap gap-4">
                            <Link href={`/quotes?trade=${encodeURIComponent(TRADE_NAME)}&source=%2Ftrades%2Finsulation`} className="bg-[#FF6600] hover:bg-[#E65C00] text-white font-black px-8 rounded-xl transition-colors inline-flex items-center justify-center gap-2" style={{ minHeight: "64px", fontSize: "18px" }}>Get 3 Free Quotes<ArrowRight className="w-5 h-5" /></Link>
                            <Link href={`/businesses?category=${encodeURIComponent(TRADE_NAME)}`} className="bg-white/10 hover:bg-white/20 text-white font-black px-8 rounded-xl transition-colors border border-white/10 inline-flex items-center justify-center" style={{ minHeight: "64px", fontSize: "18px" }}>Browse Insulation Installers</Link>
                            <Link href="/local" className="bg-white/10 hover:bg-white/20 text-white font-black px-8 rounded-xl transition-colors border border-white/10 inline-flex items-center justify-center" style={{ minHeight: "64px", fontSize: "18px" }}>Browse by Location</Link>
                        </div>
                        <div className="flex flex-wrap gap-6 text-white font-bold mt-8" style={{ fontSize: "16px" }}>
                            {cost && <span className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-[#FF6600]" />Ceiling from ${cost.low}–${cost.high}{cost.unit}</span>}
                            {totalBusinesses > 0 && <span className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-[#FF6600]" />{totalBusinesses.toLocaleString()} insulation businesses listed</span>}
                            {statesCovered > 0 && <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#FF6600]" />Available in {statesCovered} states & territories</span>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16">
                <div className="max-w-6xl mx-auto space-y-16">
                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><DollarSign className="w-6 h-6 text-[#FF6600]" />Insulation Cost Guide Australia</h2>
                        <p className="text-zinc-500 mb-8" style={{ fontSize: "18px", lineHeight: 1.7 }}>Insulation costs vary by type, R-value, and access. Check state and federal energy rebate programs before booking — eligible homes may reduce costs significantly.</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100"><p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Ceiling Insulation</p><p className="text-3xl font-black text-zinc-900">{cost ? `$${cost.low}–$${cost.high}` : "$10–$22"}</p><p className="text-zinc-500" style={{ fontSize: "16px" }}>{cost?.unit ?? "per m²"}</p></div>
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100"><p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Full Home (90m²)</p><p className="text-3xl font-black text-zinc-900">$2,500–$7,000</p><p className="text-zinc-500" style={{ fontSize: "16px" }}>ceiling + underfloor, installed</p></div>
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100"><p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Rebates Available</p><p className="text-3xl font-black text-zinc-900">VIC, SA, QLD</p><p className="text-zinc-500" style={{ fontSize: "16px" }}>check your state scheme</p></div>
                        </div>
                        <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                            <table className="min-w-full text-left">
                                <thead className="bg-zinc-100 text-zinc-700"><tr><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>City</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Ceiling</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Wall</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Underfloor</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Full Home</th></tr></thead>
                                <tbody>{cityPricing.map((row) => (<tr key={row.city} className="border-t border-zinc-200 bg-white"><td className="px-4 py-3 font-bold text-zinc-900" style={{ fontSize: "16px" }}>{row.city}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.ceiling}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.wall}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.underfloor}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.house90}</td></tr>))}</tbody>
                            </table>
                        </div>
                        <div className="mt-8">
                            <h3 className="font-black text-zinc-900 mb-4 font-display" style={{ fontSize: "24px" }}>Common Insulation Job Costs</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{commonJobCosts.map(([label, value]) => (<div key={label} className="flex items-center justify-between bg-zinc-50 rounded-2xl border border-zinc-100 px-5 py-4 gap-4"><span className="font-bold text-zinc-700" style={{ fontSize: "16px" }}>{label}</span><span className="font-black text-zinc-900 whitespace-nowrap" style={{ fontSize: "16px" }}>{value}</span></div>))}</div>
                        </div>
                    </section>

                    <section className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8">
                        <div className="bg-white rounded-3xl border border-zinc-200 p-8">
                            <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><Wrench className="w-6 h-6 text-[#FF6600]" />Insulation Services We Cover</h2>
                            <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>TradeRefer&apos;s insulation hub covers ceiling batts, blown-in insulation, wall insulation, underfloor insulation, sarking, acoustic insulation, and insulation removal Australia-wide.</p>
                            {services.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{services.map((service) => (<Link key={service} href={`/trades/${jobToSlug(service)}`} className="flex items-center justify-between px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl font-bold text-zinc-700 hover:bg-orange-50 hover:border-[#FF6600] hover:text-[#FF6600] transition-colors capitalize" style={{ fontSize: "16px" }}><span>{service}</span><ArrowRight className="w-4 h-4 text-zinc-300" /></Link>))}</div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{["Ceiling batt insulation", "Blown-in insulation", "Wall insulation", "Underfloor insulation", "Sarking / roof underlay", "Acoustic insulation", "Insulation top-up", "Old insulation removal", "Injection foam walls", "Commercial insulation"].map((s) => (<div key={s} className="px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl font-bold text-zinc-700 capitalize" style={{ fontSize: "16px" }}>{s}</div>))}</div>
                            )}
                        </div>
                        <div className="bg-white rounded-3xl border border-zinc-200 p-8">
                            <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "28px" }}><Clock3 className="w-5 h-5 text-blue-500" />Before You Hire an Insulation Installer</h2>
                            <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>Use these checks to ensure correct R-values, downlight compliance, and government rebate eligibility.</p>
                            <div className="space-y-4">{hiringTips.map(({ title, body, icon: Icon }) => (<div key={title} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-5"><div className="flex items-start gap-3 mb-2"><div className="w-10 h-10 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center shrink-0"><Icon className="w-5 h-5 text-[#FF6600]" /></div><h3 className="font-black text-zinc-900" style={{ fontSize: "18px" }}>{title}</h3></div><p className="text-zinc-600" style={{ fontSize: "16px", lineHeight: 1.7 }}>{body}</p></div>))}</div>
                        </div>
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><MapPin className="w-6 h-6 text-[#FF6600]" />Find Insulation Installers by City</h2>
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
                        <div className="max-w-3xl mb-8"><h2 className="font-black text-[#1A1A1A] mb-3 font-display" style={{ fontSize: "32px" }}>Get 3 Free Insulation Quotes</h2><p className="text-zinc-500" style={{ fontSize: "18px", lineHeight: 1.7 }}>Request quotes here and we&apos;ll match your home with up to 3 verified local insulation businesses.</p></div>
                        <PublicMultiQuoteForm initialTradeCategory={TRADE_NAME} initialSourcePage="/trades/insulation" />
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><FileText className="w-6 h-6 text-blue-500" />Insulation Requirements by State</h2>
                        <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>Insulation R-value requirements are set by the National Construction Code and vary by climate zone. State energy schemes offer rebates to reduce installation costs for eligible households.</p>
                        <div className="space-y-3">{Object.entries(STATE_LICENSING[TRADE_NAME] ?? {}).map(([stateCode, text]) => (<div key={stateCode} className="bg-blue-50 border border-blue-100 rounded-2xl p-5"><p className="font-black text-blue-600 uppercase tracking-wider mb-2" style={{ fontSize: "14px" }}>{stateCode}</p><p className="text-zinc-700" style={{ fontSize: "16px", lineHeight: 1.7 }}>{text as string}</p></div>))}</div>
                    </section>

                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">{whyTradeRefer.map((item) => (<div key={item.title} className="bg-white rounded-3xl border border-zinc-200 p-8"><h2 className="font-black text-[#1A1A1A] mb-3 font-display" style={{ fontSize: "24px" }}>{item.title}</h2><p className="text-zinc-600" style={{ fontSize: "16px", lineHeight: 1.7 }}>{item.body}</p></div>))}</section>

                    <section>
                        <h2 className="font-black text-[#1A1A1A] mb-8 font-display" style={{ fontSize: "32px" }}>Insulation: Frequently Asked Questions</h2>
                        <div className="space-y-4">{activeFaqs.map((faq) => (<div key={faq.q} className="bg-white rounded-2xl border border-zinc-200 p-6"><h3 className="font-black text-zinc-900 mb-2" style={{ fontSize: "18px" }}>{faq.q}</h3><p className="text-zinc-600" style={{ fontSize: "16px", lineHeight: 1.7 }}>{faq.a}</p></div>))}</div>
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "28px" }}><Wrench className="w-5 h-5 text-[#FF6600]" />Related Trade Guides</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{relatedTrades.map((trade) => (<Link key={trade.href} href={trade.href} className="flex items-center justify-between px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl font-bold text-zinc-700 hover:bg-orange-50 hover:border-[#FF6600] hover:text-[#FF6600] transition-colors" style={{ fontSize: "16px" }}><span>{trade.label}</span><ArrowRight className="w-4 h-4 text-zinc-300" /></Link>))}</div>
                    </section>

                    <section className="bg-[#1A1A1A] rounded-3xl p-8 md:p-12 text-center text-white">
                        <h2 className="font-black mb-4 text-white" style={{ fontSize: "40px" }}>Need an Insulation Installer Near You?</h2>
                        <p className="text-zinc-400 mb-8 max-w-2xl mx-auto" style={{ fontSize: "20px", lineHeight: 1.7 }}>Browse verified local insulation businesses, compare ceiling and wall options, check rebate eligibility, and find the right installer to reduce your energy bills.</p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link href={`/quotes?trade=${encodeURIComponent(TRADE_NAME)}&source=%2Ftrades%2Finsulation`} className="inline-flex items-center gap-2 bg-[#FF6600] hover:bg-[#E65C00] text-white font-black rounded-xl px-8 transition-colors" style={{ minHeight: "64px", fontSize: "18px" }}>Get 3 Free Quotes <ArrowRight className="w-5 h-5" /></Link>
                            <Link href={`/businesses?category=${encodeURIComponent(TRADE_NAME)}`} className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-black rounded-xl px-8 transition-colors border border-white/10" style={{ minHeight: "64px", fontSize: "18px" }}>Browse Insulation Installers</Link>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
