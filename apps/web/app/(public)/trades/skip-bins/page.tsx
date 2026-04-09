import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, ChevronRight, Clock3, DollarSign, FileText, Home, MapPin, ShieldCheck, Star, Wrench } from "lucide-react";
import { sql } from "@/lib/db";
import { STATE_LICENSING } from "@/lib/constants";
import { PublicMultiQuoteForm } from "@/components/PublicMultiQuoteForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Skip Bin Hire Australia | Skip Bin Companies | TradeRefer",
    description: "Find trusted skip bin hire companies across Australia. Compare skip bin sizes and hire costs by city, understand permitted vs prohibited waste, and book verified local skip bin services through TradeRefer.",
    alternates: { canonical: "https://traderefer.au/trades/skip-bins" },
    openGraph: { title: "Skip Bin Hire Australia | TradeRefer", description: "Compare skip bin hire costs, sizes, and verified local skip bin companies across Australia.", url: "https://traderefer.au/trades/skip-bins", type: "website" },
};

const TRADE_CATEGORY = "Rubbish Removal";
const relatedTrades = [
    { label: "Demolition", href: "/trades/demolition" },
    { label: "Landscaping", href: "/trades/landscaping" },
    { label: "House Cleaning", href: "/trades/house-cleaning" },
    { label: "Concreting", href: "/trades/concreting" },
    { label: "Removalists", href: "/trades/removalists" },
    { label: "Building", href: "/categories#building" },
];
const cityPricing = [
    { city: "Sydney", state: "NSW", bin2m3: "$200–$350", bin4m3: "$280–$450", bin6m3: "$350–$550", bin8m3: "$420–$650" },
    { city: "Melbourne", state: "VIC", bin2m3: "$180–$320", bin4m3: "$260–$420", bin6m3: "$320–$520", bin8m3: "$400–$620" },
    { city: "Brisbane", state: "QLD", bin2m3: "$170–$300", bin4m3: "$250–$400", bin6m3: "$300–$500", bin8m3: "$380–$600" },
    { city: "Perth", state: "WA", bin2m3: "$180–$320", bin4m3: "$260–$420", bin6m3: "$320–$520", bin8m3: "$400–$620" },
    { city: "Adelaide", state: "SA", bin2m3: "$170–$300", bin4m3: "$250–$400", bin6m3: "$300–$500", bin8m3: "$370–$580" },
    { city: "Canberra", state: "ACT", bin2m3: "$200–$350", bin4m3: "$280–$460", bin6m3: "$350–$560", bin8m3: "$420–$660" },
    { city: "Hobart", state: "TAS", bin2m3: "$185–$330", bin4m3: "$265–$430", bin6m3: "$325–$530", bin8m3: "$400–$630" },
    { city: "Darwin", state: "NT", bin2m3: "$220–$380", bin4m3: "$300–$490", bin6m3: "$380–$580", bin8m3: "$460–$700" },
];
const sizeGuide = [
    ["2m³ mini skip", "1 bedroom cleanout, small reno", "$180–$350"],
    ["3m³ skip", "Bathroom reno, medium cleanout", "$230–$400"],
    ["4m³ skip (most popular)", "Kitchen reno, large cleanout", "$250–$450"],
    ["6m³ skip", "Full room renovation", "$300–$550"],
    ["8m³ skip", "Multi-room reno, small demolition", "$380–$650"],
    ["10m³ large skip", "House clearance, major reno", "$450–$750"],
    ["12m³ hook bin", "Large demolition, construction", "$500–$900"],
    ["Crane-lifted bin (2–4m³)", "No truck access, tight spaces", "$300–$550"],
];
const hiringTips = [
    { title: "Check if you need a council permit for street placement", body: "If the skip bin will be placed on a public road, footpath, or nature strip, most councils require a permit before placement. Costs range from $30–$150 depending on duration and location. Your skip bin company should apply on your behalf — confirm this before booking, as unapproved bins can be removed and fined.", icon: BadgeCheck },
    { title: "Understand prohibited waste before filling", body: "Most skip bin companies prohibit: asbestos, tyres, liquid waste, batteries, refrigerants, paint, chemicals, and mattresses (sometimes at surcharge). Putting prohibited waste in a standard skip can result in additional charges of $200–$1,000+ or rejection of the entire bin. Confirm the prohibited list with your supplier before filling.", icon: FileText },
    { title: "Don't overfill — bins must be flush with the top", body: "Australian waste transport regulations prohibit overfilled bins (waste protruding above the bin walls). An overfilled bin may not be collected, requiring you to remove waste before pickup. Estimate conservatively — upgrading to the next bin size is cheaper than a failed collection.", icon: ShieldCheck },
    { title: "Confirm the hire period and extension costs", body: "Standard skip bin hire periods are 2–7 days. Extensions are usually $20–$60/day. If your project runs long, it's significantly cheaper to call and extend than to have the bin collected and another delivered. Ask about the extension rate before confirming your booking.", icon: Star },
];
const whyTradeRefer = [
    { title: "Verified skip bin companies", body: "TradeRefer helps homeowners and builders find ABN-verified skip bin companies with proper waste disposal licences and recycling commitments — not unlicensed operators who illegally dump waste." },
    { title: "Compare costs before you book", body: "Use this hub to understand typical skip bin hire rates across Australian cities so you can benchmark pricing by size and duration before committing to a booking." },
    { title: "Australia-wide local discovery", body: "Navigate from this national skip bin guide into city and suburb-level pages to find verified skip bin companies servicing the specific area where your project is located." },
];
const faqs = [
    { q: "What size skip bin do I need for a bathroom renovation?", a: "A 3–4m³ skip bin is typically sufficient for a full bathroom renovation, accommodating tiles, bathroom suite fixtures, timber framing offcuts, and general construction waste. A 4m³ skip is the most popular size for residential renovations as it handles most jobs without being too large for suburban driveways." },
    { q: "Can I put dirt and soil in a skip bin?", a: "Soil and dirt ('clean fill') is accepted by most skip bin companies but often at a surcharge or requires a dedicated soil skip, as it's very heavy. Some companies have a maximum weight per bin size — typically 1.5–2 tonnes for a 4m³ bin. Confirm soil acceptance and any weight limits before booking if this is your primary waste type." },
    { q: "Do I need a council permit for a skip bin on my driveway?", a: "No permit is required for a skip bin placed entirely on private property (your driveway or yard). Permits are only required when the bin occupies public space — road, footpath, nature strip, or verge. Your skip bin company should advise you and can often arrange the council permit on your behalf for an additional fee." },
    { q: "How long can I keep a skip bin?", a: "Standard hire periods are 2–7 days depending on the company. Most allow extensions at $20–$60/day. If you need longer-term placement (for a major renovation), negotiate a fixed weekly rate upfront — this is usually cheaper than day-rate extensions. Some companies offer open-ended hire for major projects." },
    { q: "Can I put asbestos in a skip bin?", a: "No — asbestos is strictly prohibited in standard skip bins in all Australian states. Asbestos waste must be handled by a licensed asbestos removalist and disposed of at an EPA-approved facility. Any property built before 1987 should be surveyed for asbestos before any renovation or demolition work begins." },
    { q: "What happens to the waste after collection?", a: "Reputable skip bin companies sort waste at licensed transfer stations and recycle as much as possible. Typical recycling rates are 60–80% for mixed building waste. If sustainability is important to you, ask your skip bin company what their diversion-from-landfill rate is before booking." },
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
        const results = await sql<StateCountRow[]>`SELECT state, COUNT(*) as count FROM businesses WHERE status = 'active' AND (trade_category ILIKE '%rubbish%' OR trade_category ILIKE '%skip%' OR trade_category ILIKE '%waste%') AND state IS NOT NULL GROUP BY state ORDER BY count DESC`;
        const map: Record<string, number> = {};
        results.forEach((row) => { map[row.state] = parseInt(String(row.count), 10); });
        return map;
    } catch { return {}; }
}
async function getFeaturedCityCounts(): Promise<Record<string, number>> {
    try {
        const results = await sql<CityCountRow[]>`SELECT city, state, COUNT(*) as count FROM businesses WHERE status = 'active' AND (trade_category ILIKE '%rubbish%' OR trade_category ILIKE '%skip%' OR trade_category ILIKE '%waste%') AND city IS NOT NULL AND city != '' GROUP BY city, state`;
        const map: Record<string, number> = {};
        results.forEach((row) => { map[`${String(row.city).toLowerCase()}::${String(row.state).toUpperCase()}`] = parseInt(String(row.count), 10); });
        return map;
    } catch { return {}; }
}

export default async function SkipBinsTradeHubPage() {
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
                        <Link href="/" className="hover:text-white transition-colors">Home</Link><ChevronRight className="w-4 h-4" />
                        <Link href="/categories" className="hover:text-white transition-colors">Trade Guides</Link><ChevronRight className="w-4 h-4" />
                        <span className="text-[#FF6600]">Skip Bins</span>
                    </nav>
                    <div className="max-w-4xl">
                        <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-2 font-black text-orange-400 uppercase tracking-widest mb-6" style={{ fontSize: "16px" }}><Home className="w-4 h-4" />Australia-Wide Trade Hub</div>
                        <h1 className="font-black mb-6 leading-[1.05] font-display text-white" style={{ fontSize: "clamp(48px, 8vw, 80px)" }}>Find Verified <span className="text-[#FF6600]">Skip Bin</span> Companies Across Australia</h1>
                        <p className="text-zinc-400 max-w-3xl mb-8" style={{ fontSize: "20px", lineHeight: 1.7 }}>Use this TradeRefer skip bin hub to compare bin sizes and hire costs across Australian cities, understand council permit requirements and prohibited waste, and connect with verified local skip bin companies.</p>
                        <div className="flex flex-wrap gap-4">
                            <Link href={`/quotes?trade=${encodeURIComponent(TRADE_CATEGORY)}&source=%2Ftrades%2Fskip-bins`} className="bg-[#FF6600] hover:bg-[#E65C00] text-white font-black px-8 rounded-xl transition-colors inline-flex items-center justify-center gap-2" style={{ minHeight: "64px", fontSize: "18px" }}>Get 3 Free Quotes<ArrowRight className="w-5 h-5" /></Link>
                            <Link href={`/businesses?category=${encodeURIComponent(TRADE_CATEGORY)}`} className="bg-white/10 hover:bg-white/20 text-white font-black px-8 rounded-xl transition-colors border border-white/10 inline-flex items-center justify-center" style={{ minHeight: "64px", fontSize: "18px" }}>Browse Skip Bin Companies</Link>
                            <Link href="/local" className="bg-white/10 hover:bg-white/20 text-white font-black px-8 rounded-xl transition-colors border border-white/10 inline-flex items-center justify-center" style={{ minHeight: "64px", fontSize: "18px" }}>Browse by Location</Link>
                        </div>
                        <div className="flex flex-wrap gap-6 text-white font-bold mt-8" style={{ fontSize: "16px" }}>
                            <span className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-[#FF6600]" />4m³ bin from $250–$450 (7 days)</span>
                            {totalBusinesses > 0 && <span className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-[#FF6600]" />{totalBusinesses.toLocaleString()} waste removal businesses listed</span>}
                            {statesCovered > 0 && <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#FF6600]" />Available in {statesCovered} states & territories</span>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16">
                <div className="max-w-6xl mx-auto space-y-16">
                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><DollarSign className="w-6 h-6 text-[#FF6600]" />Skip Bin Cost Guide Australia</h2>
                        <p className="text-zinc-500 mb-8" style={{ fontSize: "18px", lineHeight: 1.7 }}>Skip bin prices vary by size, hire period, waste type, and location. Prices below are for standard 7-day hire of general waste bins. Heavy waste (soil, concrete) and hazardous materials are priced separately.</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100"><p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Most Popular Size</p><p className="text-3xl font-black text-zinc-900">4m³</p><p className="text-zinc-500" style={{ fontSize: "16px" }}>$250–$450, 7-day hire</p></div>
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100"><p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Street Permit</p><p className="text-3xl font-black text-zinc-900">$30–$150</p><p className="text-zinc-500" style={{ fontSize: "16px" }}>required for road placement</p></div>
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100"><p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Extension Rate</p><p className="text-3xl font-black text-zinc-900">$20–$60</p><p className="text-zinc-500" style={{ fontSize: "16px" }}>per additional day</p></div>
                        </div>
                        <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                            <table className="min-w-full text-left">
                                <thead className="bg-zinc-100 text-zinc-700"><tr><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>City</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>2m³</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>4m³</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>6m³</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>8m³</th></tr></thead>
                                <tbody>{cityPricing.map((row) => (<tr key={row.city} className="border-t border-zinc-200 bg-white"><td className="px-4 py-3 font-bold text-zinc-900" style={{ fontSize: "16px" }}>{row.city}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.bin2m3}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.bin4m3}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.bin6m3}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.bin8m3}</td></tr>))}</tbody>
                            </table>
                        </div>
                        <div className="mt-8">
                            <h3 className="font-black text-zinc-900 mb-4 font-display" style={{ fontSize: "24px" }}>Skip Bin Size Guide</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{sizeGuide.map(([size, use, price]) => (<div key={size} className="bg-zinc-50 rounded-2xl border border-zinc-100 px-5 py-4"><div className="flex items-center justify-between mb-1"><span className="font-black text-zinc-900" style={{ fontSize: "16px" }}>{size}</span><span className="font-black text-zinc-900" style={{ fontSize: "16px" }}>{price}</span></div><span className="text-zinc-500" style={{ fontSize: "15px" }}>{use}</span></div>))}</div>
                        </div>
                    </section>

                    <section className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8">
                        <div className="bg-white rounded-3xl border border-zinc-200 p-8">
                            <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><Wrench className="w-6 h-6 text-[#FF6600]" />Skip Bin Services We Cover</h2>
                            <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>TradeRefer&apos;s skip bin hub covers residential and commercial bin hire, soil and concrete bins, crane-lifted bins, long-term hire, and same-day delivery services across Australia.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{["Residential skip bins", "Commercial waste bins", "Construction waste bins", "Green waste bins", "Soil & concrete bins", "Crane-lifted bins", "Long-term hire", "Same-day delivery", "End-of-lease cleanout bins", "Commercial hook bins"].map((s) => (<div key={s} className="px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl font-bold text-zinc-700 capitalize" style={{ fontSize: "16px" }}>{s}</div>))}</div>
                        </div>
                        <div className="bg-white rounded-3xl border border-zinc-200 p-8">
                            <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "28px" }}><Clock3 className="w-5 h-5 text-blue-500" />Before You Hire a Skip Bin</h2>
                            <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>Use these checks to avoid permit fines, prohibited waste charges, and bin collection failures.</p>
                            <div className="space-y-4">{hiringTips.map(({ title, body, icon: Icon }) => (<div key={title} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-5"><div className="flex items-start gap-3 mb-2"><div className="w-10 h-10 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center shrink-0"><Icon className="w-5 h-5 text-[#FF6600]" /></div><h3 className="font-black text-zinc-900" style={{ fontSize: "18px" }}>{title}</h3></div><p className="text-zinc-600" style={{ fontSize: "16px", lineHeight: 1.7 }}>{body}</p></div>))}</div>
                        </div>
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><MapPin className="w-6 h-6 text-[#FF6600]" />Find Skip Bin Companies by City</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{featuredCities.map(({ city, state, stateSlug, citySlug }) => { const count = cityCounts[`${city.toLowerCase()}::${state}`] || 0; return (<Link key={`${city}-${state}`} href={`/local/${stateSlug}/${citySlug}?category=${encodeURIComponent(TRADE_CATEGORY)}`} className="flex items-center justify-between px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl hover:bg-orange-50 hover:border-[#FF6600] transition-colors group"><div><span className="font-black text-zinc-900 group-hover:text-[#FF6600]" style={{ fontSize: "16px" }}>{city}</span><p className="text-zinc-400" style={{ fontSize: "16px" }}>{state} · {count > 0 ? `${count} listed` : "Browse local directory"}</p></div><ArrowRight className="w-5 h-5 text-zinc-300 group-hover:text-[#FF6600]" /></Link>); })}</div>
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <div className="max-w-3xl mb-8"><h2 className="font-black text-[#1A1A1A] mb-3 font-display" style={{ fontSize: "32px" }}>Get 3 Free Skip Bin Quotes</h2><p className="text-zinc-500" style={{ fontSize: "18px", lineHeight: 1.7 }}>Request quotes here and we&apos;ll match your project with up to 3 verified local skip bin companies.</p></div>
                        <PublicMultiQuoteForm initialTradeCategory={TRADE_CATEGORY} initialSourcePage="/trades/skip-bins" />
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><FileText className="w-6 h-6 text-blue-500" />Waste Disposal Requirements by State</h2>
                        <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>Skip bin companies require EPA waste transport licences in all Australian states. Council permits are required for street placement. Here&apos;s what applies in each state.</p>
                        <div className="space-y-3">{Object.entries(STATE_LICENSING["Rubbish Removal"] ?? {}).map(([stateCode, text]) => (<div key={stateCode} className="bg-blue-50 border border-blue-100 rounded-2xl p-5"><p className="font-black text-blue-600 uppercase tracking-wider mb-2" style={{ fontSize: "14px" }}>{stateCode}</p><p className="text-zinc-700" style={{ fontSize: "16px", lineHeight: 1.7 }}>{text as string}</p></div>))}</div>
                    </section>

                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">{whyTradeRefer.map((item) => (<div key={item.title} className="bg-white rounded-3xl border border-zinc-200 p-8"><h2 className="font-black text-[#1A1A1A] mb-3 font-display" style={{ fontSize: "24px" }}>{item.title}</h2><p className="text-zinc-600" style={{ fontSize: "16px", lineHeight: 1.7 }}>{item.body}</p></div>))}</section>

                    <section>
                        <h2 className="font-black text-[#1A1A1A] mb-8 font-display" style={{ fontSize: "32px" }}>Skip Bins: Frequently Asked Questions</h2>
                        <div className="space-y-4">{faqs.map((faq) => (<div key={faq.q} className="bg-white rounded-2xl border border-zinc-200 p-6"><h3 className="font-black text-zinc-900 mb-2" style={{ fontSize: "18px" }}>{faq.q}</h3><p className="text-zinc-600" style={{ fontSize: "16px", lineHeight: 1.7 }}>{faq.a}</p></div>))}</div>
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "28px" }}><Wrench className="w-5 h-5 text-[#FF6600]" />Related Trade Guides</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{relatedTrades.map((trade) => (<Link key={trade.href} href={trade.href} className="flex items-center justify-between px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl font-bold text-zinc-700 hover:bg-orange-50 hover:border-[#FF6600] hover:text-[#FF6600] transition-colors" style={{ fontSize: "16px" }}><span>{trade.label}</span><ArrowRight className="w-4 h-4 text-zinc-300" /></Link>))}</div>
                    </section>

                    <section className="bg-[#1A1A1A] rounded-3xl p-8 md:p-12 text-center text-white">
                        <h2 className="font-black mb-4 text-white" style={{ fontSize: "40px" }}>Need a Skip Bin Delivered?</h2>
                        <p className="text-zinc-400 mb-8 max-w-2xl mx-auto" style={{ fontSize: "20px", lineHeight: 1.7 }}>Browse verified local skip bin companies and get the right size bin delivered to your renovation, cleanout, or construction project anywhere in Australia.</p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link href={`/quotes?trade=${encodeURIComponent(TRADE_CATEGORY)}&source=%2Ftrades%2Fskip-bins`} className="inline-flex items-center gap-2 bg-[#FF6600] hover:bg-[#E65C00] text-white font-black rounded-xl px-8 transition-colors" style={{ minHeight: "64px", fontSize: "18px" }}>Get 3 Free Quotes <ArrowRight className="w-5 h-5" /></Link>
                            <Link href={`/businesses?category=${encodeURIComponent(TRADE_CATEGORY)}`} className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-black rounded-xl px-8 transition-colors border border-white/10" style={{ minHeight: "64px", fontSize: "18px" }}>Browse Skip Bin Companies</Link>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
