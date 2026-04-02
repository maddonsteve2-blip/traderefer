import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, ChevronRight, Clock3, DollarSign, FileText, Home, MapPin, ShieldCheck, Star, Wrench } from "lucide-react";
import { sql } from "@/lib/db";
import { JOB_TYPES, STATE_LICENSING, TRADE_COST_GUIDE, TRADE_FAQ_BANK, jobToSlug } from "@/lib/constants";
import { PublicMultiQuoteForm } from "@/components/PublicMultiQuoteForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Stonemasonry Services Australia | Find Verified Stonemasons | TradeRefer",
    description: "Find trusted stonemasons across Australia. Compare stone wall, retaining wall, and paving costs by city, and hire verified local stonemasonry businesses through TradeRefer.",
    alternates: { canonical: "https://traderefer.au/trades/stonemasonry" },
    openGraph: { title: "Stonemasonry Services Australia | TradeRefer", description: "Compare stonemasonry costs, stone wall pricing, and verified local stonemasons across Australia.", url: "https://traderefer.au/trades/stonemasonry", type: "website" },
};

const TRADE_NAME = "Stonemasonry";
const cost = TRADE_COST_GUIDE[TRADE_NAME];
const faqs = TRADE_FAQ_BANK[TRADE_NAME]?.slice(0, 6) ?? [];
const services = JOB_TYPES[TRADE_NAME]?.slice(0, 12) ?? [];
const relatedTrades = [
    { label: "Concreting", href: "/trades/concreting" },
    { label: "Tiling", href: "/trades/tiling" },
    { label: "Rendering", href: "/trades/rendering" },
    { label: "Landscaping", href: "/trades/landscaping" },
    { label: "Fencing", href: "/trades/fencing" },
    { label: "Building", href: "/categories#building" },
];
const cityPricing = [
    { city: "Sydney", state: "NSW", dryStack: "$280–$480/m²", mortared: "$350–$600/m²", paving: "$120–$220/m²", feature: "$400–$800/m²" },
    { city: "Melbourne", state: "VIC", dryStack: "$260–$450/m²", mortared: "$320–$560/m²", paving: "$110–$200/m²", feature: "$380–$750/m²" },
    { city: "Brisbane", state: "QLD", dryStack: "$250–$430/m²", mortared: "$300–$540/m²", paving: "$100–$190/m²", feature: "$360–$720/m²" },
    { city: "Perth", state: "WA", dryStack: "$260–$450/m²", mortared: "$320–$560/m²", paving: "$110–$200/m²", feature: "$380–$750/m²" },
    { city: "Adelaide", state: "SA", dryStack: "$250–$430/m²", mortared: "$300–$540/m²", paving: "$100–$190/m²", feature: "$360–$720/m²" },
    { city: "Canberra", state: "ACT", dryStack: "$280–$480/m²", mortared: "$350–$600/m²", paving: "$120–$220/m²", feature: "$400–$800/m²" },
    { city: "Hobart", state: "TAS", dryStack: "$270–$460/m²", mortared: "$330–$580/m²", paving: "$115–$210/m²", feature: "$390–$770/m²" },
    { city: "Darwin", state: "NT", dryStack: "$300–$520/m²", mortared: "$380–$640/m²", paving: "$130–$240/m²", feature: "$430–$850/m²" },
];
const commonJobCosts = [
    ["Dry stack stone wall (per m²)", "$250–$480/m²"],
    ["Mortared stone wall (per m²)", "$300–$600/m²"],
    ["Natural stone paving (supply & lay, per m²)", "$100–$220/m²"],
    ["Feature stone wall (landscaping, per m²)", "$360–$800/m²"],
    ["Stone retaining wall (per lm)", "$600–$1,500/lm"],
    ["Sandstone block wall (per m²)", "$350–$650/m²"],
    ["Bluestone paving (per m²)", "$150–$280/m²"],
    ["Stone fireplace / fire pit (feature)", "$3,000–$12,000"],
    ["Heritage stone restoration (per m²)", "$200–$500/m²"],
    ["Stone garden border / edging (per lm)", "$80–$200/lm"],
];
const hiringTips = [
    { title: "Specify the stone type and origin in writing", body: "Stone quality varies enormously between quarries and suppliers. Specifying 'sandstone' or 'bluestone' without a quarry of origin, thickness, and finish specification (bush-hammered, sawn, split face) leaves room for significant quality substitution. Get the stone species, origin, and specification in the written quote before signing.", icon: BadgeCheck },
    { title: "Structural walls require engineering for retaining walls", body: "Any retaining wall over 600–800mm high (height varies by state) requires an engineer's design and council building permit in most Australian states. An unlicensed stonemason building a structural retaining wall without engineer sign-off is non-compliant and creates significant liability for the property owner if the wall fails.", icon: FileText },
    { title: "Confirm whether mortar colour is matched to the stone", body: "A significant portion of a stonework's visual quality is determined by the mortar joint — its colour, profile (flush, raked, rounded), and consistency. Get mortar samples or photos of completed work before engaging a stonemason, particularly for feature walls and facades where the mortar joint is highly visible.", icon: ShieldCheck },
    { title: "Assess the stonemason's portfolio for similar projects", body: "Stonework quality is highly skill-dependent. A stonemason experienced in dry stack boundary walls may not have the skill set for detailed heritage restoration or complex curved feature walls. Always view at least 3 recent completed examples of the same type of work you're commissioning before proceeding.", icon: Star },
];
const whyTradeRefer = [
    { title: "Verified stonemasonry businesses", body: "TradeRefer helps homeowners and builders find ABN-verified stonemasons with proven portfolios in stone walls, paving, feature work, and heritage restoration — trades where quality and experience vary significantly between contractors." },
    { title: "Compare costs before you call", body: "Use this hub to understand typical stonemasonry costs per square metre across Australian cities so you can benchmark any quote and identify unusually low-priced work that may indicate material substitution or inadequate skill levels." },
    { title: "Australia-wide local discovery", body: "Navigate from this national stonemasonry guide into city and suburb-level pages to find verified stonemasons in the specific area where your project is located." },
];
const customFaqs = [
    { q: "How much does a stone wall cost in Australia?", a: "A dry stack stone garden wall costs $250–$480/m² installed. A mortared stone wall costs $300–$600/m². Prices depend on stone type, wall height, site access, and the complexity of the coursing pattern. Heritage-quality feature walls in premium sandstone or granite can exceed $800/m²." },
    { q: "What is the difference between dry stack and mortared stonemasonry?", a: "Dry stack stonework is assembled without mortar — relying on the weight and interlocking of stones for stability. It's traditional, allows drainage, and suits garden walls and retaining walls up to approximately 1m. Mortared stonework uses a cement-lime mortar mix to bond courses — it's stronger, more suitable for higher walls, and more waterproof, but irreversible if you later want to change the stone." },
    { q: "Do I need council approval for a stone retaining wall?", a: "In most Australian states, retaining walls over 600–1,000mm in height (the threshold varies by council and state) require a building permit and engineer's design. Some councils also require permits for walls adjacent to boundaries, regardless of height. Check with your local council before starting work — the stonemason should advise you, but ultimate responsibility for obtaining approval rests with the property owner." },
    { q: "What types of stone are used for walls and paving in Australia?", a: "Common Australian stone types include: Bluestone (basalt) for paving and feature walls; Sandstone for heritage walls, steps, and retaining walls; Granite for high-durability paving and feature work; Limestone for garden walls and heritage restoration; Travertine for indoor/outdoor paving. Local quarried stone is generally cheaper and more sustainable than imported varieties." },
    { q: "Can stonemasonry be done in heritage properties?", a: "Heritage stonework requires specialist knowledge of lime mortars (not cement), traditional jointing profiles, and period-appropriate stone types. Many Australian heritage councils require heritage-approved tradespeople for work on listed buildings. If your property is heritage listed, request evidence of heritage experience and check whether council approval is required before any repairs or modifications." },
    { q: "How do I maintain natural stone paving or walls?", a: "Natural stone should be sealed every 2–5 years (depending on stone type and traffic) to reduce staining and weathering. Jointing mortar in mortared walls should be inspected every 5–10 years for cracking or spalling, especially in climate zones with frost. Dry stack walls benefit from occasional re-levelling as settling occurs over years. Avoid pressure washing with high pressure — it erodes mortar joints and can damage softer stone surfaces." },
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

export default async function StonemasonryTradeHubPage() {
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
                        <span className="text-[#FF6600]">Stonemasonry</span>
                    </nav>
                    <div className="max-w-4xl">
                        <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-2 font-black text-orange-400 uppercase tracking-widest mb-6" style={{ fontSize: "16px" }}><Home className="w-4 h-4" />Australia-Wide Trade Hub</div>
                        <h1 className="font-black mb-6 leading-[1.05] font-display text-white" style={{ fontSize: "clamp(48px, 8vw, 80px)" }}>Find Verified <span className="text-[#FF6600]">Stonemasons</span> Across Australia</h1>
                        <p className="text-zinc-400 max-w-3xl mb-8" style={{ fontSize: "20px", lineHeight: 1.7 }}>Use this TradeRefer stonemasonry hub to compare stone wall, paving, and feature work costs across Australian cities, understand structural and council requirements, and connect with verified local stonemasons.</p>
                        <div className="flex flex-wrap gap-4">
                            <Link href={`/quotes?trade=${encodeURIComponent(TRADE_NAME)}&source=%2Ftrades%2Fstonemasonry`} className="bg-[#FF6600] hover:bg-[#E65C00] text-white font-black px-8 rounded-xl transition-colors inline-flex items-center justify-center gap-2" style={{ minHeight: "64px", fontSize: "18px" }}>Get 3 Free Quotes<ArrowRight className="w-5 h-5" /></Link>
                            <Link href={`/businesses?category=${encodeURIComponent(TRADE_NAME)}`} className="bg-white/10 hover:bg-white/20 text-white font-black px-8 rounded-xl transition-colors border border-white/10 inline-flex items-center justify-center" style={{ minHeight: "64px", fontSize: "18px" }}>Browse Stonemasons</Link>
                            <Link href="/local" className="bg-white/10 hover:bg-white/20 text-white font-black px-8 rounded-xl transition-colors border border-white/10 inline-flex items-center justify-center" style={{ minHeight: "64px", fontSize: "18px" }}>Browse by Location</Link>
                        </div>
                        <div className="flex flex-wrap gap-6 text-white font-bold mt-8" style={{ fontSize: "16px" }}>
                            {cost && <span className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-[#FF6600]" />Stone walls from ${cost.low}–${cost.high}{cost.unit}</span>}
                            {totalBusinesses > 0 && <span className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-[#FF6600]" />{totalBusinesses.toLocaleString()} stonemasonry businesses listed</span>}
                            {statesCovered > 0 && <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#FF6600]" />Available in {statesCovered} states & territories</span>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16">
                <div className="max-w-6xl mx-auto space-y-16">
                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><DollarSign className="w-6 h-6 text-[#FF6600]" />Stonemasonry Cost Guide Australia</h2>
                        <p className="text-zinc-500 mb-8" style={{ fontSize: "18px", lineHeight: 1.7 }}>Stonemasonry costs vary by stone type, wall height, mortar type, access, and the complexity of the work. Heritage restoration and complex curved feature walls are priced at premium rates.</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100"><p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Dry Stack Wall</p><p className="text-3xl font-black text-zinc-900">$250–$480</p><p className="text-zinc-500" style={{ fontSize: "16px" }}>per m², installed</p></div>
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100"><p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Stone Paving</p><p className="text-3xl font-black text-zinc-900">$100–$220</p><p className="text-zinc-500" style={{ fontSize: "16px" }}>per m², supply & lay</p></div>
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100"><p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Retaining Wall</p><p className="text-3xl font-black text-zinc-900">$600–$1,500</p><p className="text-zinc-500" style={{ fontSize: "16px" }}>per linear metre</p></div>
                        </div>
                        <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                            <table className="min-w-full text-left">
                                <thead className="bg-zinc-100 text-zinc-700"><tr><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>City</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Dry Stack</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Mortared</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Stone Paving</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Feature Wall</th></tr></thead>
                                <tbody>{cityPricing.map((row) => (<tr key={row.city} className="border-t border-zinc-200 bg-white"><td className="px-4 py-3 font-bold text-zinc-900" style={{ fontSize: "16px" }}>{row.city}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.dryStack}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.mortared}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.paving}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.feature}</td></tr>))}</tbody>
                            </table>
                        </div>
                        <div className="mt-8">
                            <h3 className="font-black text-zinc-900 mb-4 font-display" style={{ fontSize: "24px" }}>Common Stonemasonry Job Costs</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{commonJobCosts.map(([label, value]) => (<div key={label} className="flex items-center justify-between bg-zinc-50 rounded-2xl border border-zinc-100 px-5 py-4 gap-4"><span className="font-bold text-zinc-700" style={{ fontSize: "16px" }}>{label}</span><span className="font-black text-zinc-900 whitespace-nowrap" style={{ fontSize: "16px" }}>{value}</span></div>))}</div>
                        </div>
                    </section>

                    <section className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8">
                        <div className="bg-white rounded-3xl border border-zinc-200 p-8">
                            <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><Wrench className="w-6 h-6 text-[#FF6600]" />Stonemasonry Services We Cover</h2>
                            <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>TradeRefer&apos;s stonemasonry hub covers dry stack walls, mortared stone walls, natural stone paving, retaining walls, heritage restoration, feature walls, and fireplaces Australia-wide.</p>
                            {services.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{services.map((service) => (<Link key={service} href={`/trades/${jobToSlug(service)}`} className="flex items-center justify-between px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl font-bold text-zinc-700 hover:bg-orange-50 hover:border-[#FF6600] hover:text-[#FF6600] transition-colors capitalize" style={{ fontSize: "16px" }}><span>{service}</span><ArrowRight className="w-4 h-4 text-zinc-300" /></Link>))}</div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{["Dry stack stone walls", "Mortared stone walls", "Natural stone paving", "Stone retaining walls", "Feature stone walls", "Heritage restoration", "Sandstone work", "Bluestone paving", "Stone fireplaces", "Stone garden borders"].map((s) => (<div key={s} className="px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl font-bold text-zinc-700 capitalize" style={{ fontSize: "16px" }}>{s}</div>))}</div>
                            )}
                        </div>
                        <div className="bg-white rounded-3xl border border-zinc-200 p-8">
                            <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "28px" }}><Clock3 className="w-5 h-5 text-blue-500" />Before You Hire a Stonemason</h2>
                            <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>Use these checks to avoid material substitutions, structural failures, and poor mortar quality on your stonework project.</p>
                            <div className="space-y-4">{hiringTips.map(({ title, body, icon: Icon }) => (<div key={title} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-5"><div className="flex items-start gap-3 mb-2"><div className="w-10 h-10 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center shrink-0"><Icon className="w-5 h-5 text-[#FF6600]" /></div><h3 className="font-black text-zinc-900" style={{ fontSize: "18px" }}>{title}</h3></div><p className="text-zinc-600" style={{ fontSize: "16px", lineHeight: 1.7 }}>{body}</p></div>))}</div>
                        </div>
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><MapPin className="w-6 h-6 text-[#FF6600]" />Find Stonemasons by City</h2>
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
                        <div className="max-w-3xl mb-8"><h2 className="font-black text-[#1A1A1A] mb-3 font-display" style={{ fontSize: "32px" }}>Get 3 Free Stonemasonry Quotes</h2><p className="text-zinc-500" style={{ fontSize: "18px", lineHeight: 1.7 }}>Request quotes here and we&apos;ll match your project with up to 3 verified local stonemasons.</p></div>
                        <PublicMultiQuoteForm initialTradeCategory={TRADE_NAME} initialSourcePage="/trades/stonemasonry" />
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><FileText className="w-6 h-6 text-blue-500" />Stonemasonry Licensing Requirements by State</h2>
                        <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>Stonemasonry licensing varies by state. Structural retaining walls require engineer sign-off and council approval above certain heights. Heritage work may require specialist accreditation.</p>
                        <div className="space-y-3">{Object.entries(STATE_LICENSING[TRADE_NAME] ?? {}).map(([stateCode, text]) => (<div key={stateCode} className="bg-blue-50 border border-blue-100 rounded-2xl p-5"><p className="font-black text-blue-600 uppercase tracking-wider mb-2" style={{ fontSize: "14px" }}>{stateCode}</p><p className="text-zinc-700" style={{ fontSize: "16px", lineHeight: 1.7 }}>{text as string}</p></div>))}</div>
                    </section>

                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">{whyTradeRefer.map((item) => (<div key={item.title} className="bg-white rounded-3xl border border-zinc-200 p-8"><h2 className="font-black text-[#1A1A1A] mb-3 font-display" style={{ fontSize: "24px" }}>{item.title}</h2><p className="text-zinc-600" style={{ fontSize: "16px", lineHeight: 1.7 }}>{item.body}</p></div>))}</section>

                    <section>
                        <h2 className="font-black text-[#1A1A1A] mb-8 font-display" style={{ fontSize: "32px" }}>Stonemasonry: Frequently Asked Questions</h2>
                        <div className="space-y-4">{activeFaqs.map((faq) => (<div key={faq.q} className="bg-white rounded-2xl border border-zinc-200 p-6"><h3 className="font-black text-zinc-900 mb-2" style={{ fontSize: "18px" }}>{faq.q}</h3><p className="text-zinc-600" style={{ fontSize: "16px", lineHeight: 1.7 }}>{faq.a}</p></div>))}</div>
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "28px" }}><Wrench className="w-5 h-5 text-[#FF6600]" />Related Trade Guides</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{relatedTrades.map((trade) => (<Link key={trade.href} href={trade.href} className="flex items-center justify-between px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl font-bold text-zinc-700 hover:bg-orange-50 hover:border-[#FF6600] hover:text-[#FF6600] transition-colors" style={{ fontSize: "16px" }}><span>{trade.label}</span><ArrowRight className="w-4 h-4 text-zinc-300" /></Link>))}</div>
                    </section>

                    <section className="bg-[#1A1A1A] rounded-3xl p-8 md:p-12 text-center text-white">
                        <h2 className="font-black mb-4 text-white" style={{ fontSize: "40px" }}>Need a Stonemason Near You?</h2>
                        <p className="text-zinc-400 mb-8 max-w-2xl mx-auto" style={{ fontSize: "20px", lineHeight: 1.7 }}>Browse verified local stonemasonry businesses and find the right stonemason for your stone wall, paving, retaining wall, or heritage restoration project.</p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link href={`/quotes?trade=${encodeURIComponent(TRADE_NAME)}&source=%2Ftrades%2Fstonemasonry`} className="inline-flex items-center gap-2 bg-[#FF6600] hover:bg-[#E65C00] text-white font-black rounded-xl px-8 transition-colors" style={{ minHeight: "64px", fontSize: "18px" }}>Get 3 Free Quotes <ArrowRight className="w-5 h-5" /></Link>
                            <Link href={`/businesses?category=${encodeURIComponent(TRADE_NAME)}`} className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-black rounded-xl px-8 transition-colors border border-white/10" style={{ minHeight: "64px", fontSize: "18px" }}>Browse Stonemasons</Link>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
