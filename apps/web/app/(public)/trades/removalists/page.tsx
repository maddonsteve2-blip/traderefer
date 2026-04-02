import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, ChevronRight, Clock3, DollarSign, FileText, Home, MapPin, ShieldCheck, Star, Wrench } from "lucide-react";
import { sql } from "@/lib/db";
import { PublicMultiQuoteForm } from "@/components/PublicMultiQuoteForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Removalists Australia | Find Verified Local Removalists | TradeRefer",
    description: "Find trusted removalists across Australia. Compare local and interstate removal costs by city, understand insurance and liability, and hire verified local removalist businesses through TradeRefer.",
    alternates: { canonical: "https://traderefer.au/trades/removalists" },
    openGraph: { title: "Removalists Australia | TradeRefer", description: "Compare removalist costs, local vs interstate moving rates, and verified local removalist businesses across Australia.", url: "https://traderefer.au/trades/removalists", type: "website" },
};

const relatedTrades = [
    { label: "House Cleaning", href: "/trades/house-cleaning" },
    { label: "Commercial Cleaning", href: "/trades/commercial-cleaning" },
    { label: "Skip Bins", href: "/trades/skip-bins" },
    { label: "Handyman", href: "/categories#handyman" },
    { label: "Painting", href: "/trades/painting" },
    { label: "Carpentry", href: "/trades/carpentry" },
];
const cityPricing = [
    { city: "Sydney", state: "NSW", twoMen2hr: "$200–$350", halfDay: "$500–$900", fullDay: "$900–$1,600", interstate: "from $1,500" },
    { city: "Melbourne", state: "VIC", twoMen2hr: "$180–$320", halfDay: "$450–$850", fullDay: "$850–$1,500", interstate: "from $1,400" },
    { city: "Brisbane", state: "QLD", twoMen2hr: "$160–$300", halfDay: "$420–$800", fullDay: "$800–$1,400", interstate: "from $1,200" },
    { city: "Perth", state: "WA", twoMen2hr: "$180–$320", halfDay: "$450–$850", fullDay: "$850–$1,500", interstate: "from $2,500" },
    { city: "Adelaide", state: "SA", twoMen2hr: "$160–$295", halfDay: "$400–$780", fullDay: "$780–$1,350", interstate: "from $1,300" },
    { city: "Canberra", state: "ACT", twoMen2hr: "$190–$340", halfDay: "$460–$880", fullDay: "$880–$1,550", interstate: "from $1,400" },
    { city: "Hobart", state: "TAS", twoMen2hr: "$170–$310", halfDay: "$430–$820", fullDay: "$820–$1,450", interstate: "from $2,000" },
    { city: "Darwin", state: "NT", twoMen2hr: "$200–$380", halfDay: "$500–$950", fullDay: "$950–$1,700", interstate: "from $3,500" },
];
const commonJobCosts = [
    ["2 bedroom apartment (local)", "$600–$1,200"],
    ["3 bedroom house (local)", "$900–$1,800"],
    ["4 bedroom house (local)", "$1,400–$2,800"],
    ["Studio apartment move", "$250–$600"],
    ["Office relocation (small, 10 staff)", "$1,500–$4,000"],
    ["Sydney to Melbourne (3-bed)", "$2,500–$4,500"],
    ["Backloading / shared truck", "$800–$2,000"],
    ["Piano move (upright)", "$300–$700"],
    ["Pool table move", "$300–$600"],
    ["Packing service (per room)", "$150–$350"],
];
const hiringTips = [
    { title: "Confirm transit insurance is included", body: "Your contents are at risk during a move. A reputable removalist carries transit insurance for items in their care. Ask if it's included or an add-on, and what the per-item limit is. High-value items (artwork, antiques) may need to be declared separately. Check your home and contents policy too — it may cover transit.", icon: BadgeCheck },
    { title: "Get a binding written quote, not an estimate", body: "An estimate is not a price — it can blow out significantly if the move takes longer or requires more items than originally discussed. A reputable removalist provides a written fixed-price quote after viewing your inventory (in-home or video walkthrough). Never accept a quote based on a vague verbal description.", icon: FileText },
    { title: "Understand cancellation and delay policies", body: "Settlement dates change, tenancies fall through, and weather affects moves. Check the cancellation and rescheduling policy in your written agreement before booking. Reputable removalists offer flexible rescheduling — those with strict no-refund policies on short notice are a risk.", icon: ShieldCheck },
    { title: "De-clutter before getting quotes", body: "The fewer items you move, the lower your cost. A pre-move de-clutter can reduce move time by 20–40% and save hundreds of dollars. Donate, sell, or skip-bin items before the removalist does an inventory walk — your quote will be significantly lower and the move faster.", icon: Star },
];
const whyTradeRefer = [
    { title: "Verified removalist businesses", body: "TradeRefer helps homeowners find ABN-verified, insured removalist businesses — not owner-operators without transit insurance or public liability coverage who leave you unprotected if something goes wrong." },
    { title: "Compare costs before you call", body: "Use this hub to understand typical removalist hourly and full-day rates across Australian cities so you can benchmark any quote before committing to a moving company." },
    { title: "Australia-wide local discovery", body: "Navigate from this national removalist guide into city and suburb-level pages to find verified local removalist businesses operating where your move begins." },
];
const faqs = [
    { q: "How much do removalists charge per hour in Australia?", a: "A 2-person removalist team charges $100–$180/hr in most Australian cities, with most companies having a 2-hour minimum. Total move costs depend on team size, truck size, access, and travel time. Always get a fixed-price quote rather than relying on hourly estimates for large moves." },
    { q: "Do removalists provide packing materials?", a: "Most removalists offer packing materials (boxes, tape, bubble wrap) as an add-on service. Basic cardboard boxes cost $3–$8 each. Wardrobe boxes, picture boxes, and specialty packaging cost more. Ask your removalist what's included and compare the cost of supplying your own materials." },
    { q: "What items won't removalists move?", a: "Standard exclusions include: hazardous materials (paint, chemicals, gas cylinders), plants, pets, perishable food, and items with outstanding finance or legal encumbrances. Check your specific removalist's exclusion list before booking — particularly if you have items outside these standard categories." },
    { q: "What is backloading and how much does it cost?", a: "Backloading means sharing a truck with other customers on an existing interstate route. It's typically 30–60% cheaper than a dedicated truck, but you sacrifice specific timing — your goods may take 1–7 days longer to arrive. It's ideal for non-urgent interstate moves where flexibility saves money." },
    { q: "How far in advance should I book a removalist?", a: "Book 2–4 weeks ahead for local moves, 4–8 weeks for interstate moves, and 8–12 weeks for moves during peak periods (December–January, Easter, end of financial year). Last-minute moves are possible but more expensive and have limited availability for large households." },
    { q: "What should I do if items are damaged during a move?", a: "Document damage immediately with photos before unpacking further. Notify the removalist in writing within 24–48 hours (check your contract). File a transit insurance claim if applicable. Most reputable removalists have a formal complaints and claims process — avoid companies that dismiss damage claims verbally without a written process." },
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
        const results = await sql<StateCountRow[]>`SELECT state, COUNT(*) as count FROM businesses WHERE status = 'active' AND trade_category ILIKE '%remov%' AND state IS NOT NULL GROUP BY state ORDER BY count DESC`;
        const map: Record<string, number> = {};
        results.forEach((row) => { map[row.state] = parseInt(String(row.count), 10); });
        return map;
    } catch { return {}; }
}
async function getFeaturedCityCounts(): Promise<Record<string, number>> {
    try {
        const results = await sql<CityCountRow[]>`SELECT city, state, COUNT(*) as count FROM businesses WHERE status = 'active' AND trade_category ILIKE '%remov%' AND city IS NOT NULL AND city != '' GROUP BY city, state`;
        const map: Record<string, number> = {};
        results.forEach((row) => { map[`${String(row.city).toLowerCase()}::${String(row.state).toUpperCase()}`] = parseInt(String(row.count), 10); });
        return map;
    } catch { return {}; }
}

export default async function RemovalistsTradeHubPage() {
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
                        <span className="text-[#FF6600]">Removalists</span>
                    </nav>
                    <div className="max-w-4xl">
                        <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-2 font-black text-orange-400 uppercase tracking-widest mb-6" style={{ fontSize: "16px" }}><Home className="w-4 h-4" />Australia-Wide Trade Hub</div>
                        <h1 className="font-black mb-6 leading-[1.05] font-display text-white" style={{ fontSize: "clamp(48px, 8vw, 80px)" }}>Find Verified <span className="text-[#FF6600]">Removalists</span> Across Australia</h1>
                        <p className="text-zinc-400 max-w-3xl mb-8" style={{ fontSize: "20px", lineHeight: 1.7 }}>Use this TradeRefer removalist hub to compare local and interstate moving costs across Australian cities, understand transit insurance and your rights, and connect with verified local removalist businesses.</p>
                        <div className="flex flex-wrap gap-4">
                            <Link href="/quotes?trade=Removalists&source=%2Ftrades%2Fremovalists" className="bg-[#FF6600] hover:bg-[#E65C00] text-white font-black px-8 rounded-xl transition-colors inline-flex items-center justify-center gap-2" style={{ minHeight: "64px", fontSize: "18px" }}>Get 3 Free Quotes<ArrowRight className="w-5 h-5" /></Link>
                            <Link href="/businesses?category=Removalists" className="bg-white/10 hover:bg-white/20 text-white font-black px-8 rounded-xl transition-colors border border-white/10 inline-flex items-center justify-center" style={{ minHeight: "64px", fontSize: "18px" }}>Browse Removalists</Link>
                            <Link href="/local" className="bg-white/10 hover:bg-white/20 text-white font-black px-8 rounded-xl transition-colors border border-white/10 inline-flex items-center justify-center" style={{ minHeight: "64px", fontSize: "18px" }}>Browse by Location</Link>
                        </div>
                        <div className="flex flex-wrap gap-6 text-white font-bold mt-8" style={{ fontSize: "16px" }}>
                            <span className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-[#FF6600]" />2-bed local move from $600–$1,200</span>
                            {totalBusinesses > 0 && <span className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-[#FF6600]" />{totalBusinesses.toLocaleString()} removalist businesses listed</span>}
                            {statesCovered > 0 && <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#FF6600]" />Available in {statesCovered} states & territories</span>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16">
                <div className="max-w-6xl mx-auto space-y-16">
                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><DollarSign className="w-6 h-6 text-[#FF6600]" />Removalist Cost Guide Australia</h2>
                        <p className="text-zinc-500 mb-8" style={{ fontSize: "18px", lineHeight: 1.7 }}>Moving costs depend on home size, distance, access, and whether packing is included. Use these benchmarks across major Australian cities to evaluate quotes.</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100"><p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>2-Man Team Rate</p><p className="text-3xl font-black text-zinc-900">$100–$180</p><p className="text-zinc-500" style={{ fontSize: "16px" }}>per hour (2hr min)</p></div>
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100"><p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>3-Bed Local Move</p><p className="text-3xl font-black text-zinc-900">$900–$1,800</p><p className="text-zinc-500" style={{ fontSize: "16px" }}>full service, local</p></div>
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100"><p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Transit Insurance</p><p className="text-3xl font-black text-zinc-900">Required</p><p className="text-zinc-500" style={{ fontSize: "16px" }}>confirm coverage before booking</p></div>
                        </div>
                        <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                            <table className="min-w-full text-left">
                                <thead className="bg-zinc-100 text-zinc-700"><tr><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>City</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>2 Men / 2hrs</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Half Day</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Full Day</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Interstate</th></tr></thead>
                                <tbody>{cityPricing.map((row) => (<tr key={row.city} className="border-t border-zinc-200 bg-white"><td className="px-4 py-3 font-bold text-zinc-900" style={{ fontSize: "16px" }}>{row.city}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.twoMen2hr}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.halfDay}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.fullDay}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.interstate}</td></tr>))}</tbody>
                            </table>
                        </div>
                        <div className="mt-8">
                            <h3 className="font-black text-zinc-900 mb-4 font-display" style={{ fontSize: "24px" }}>Common Removalist Job Costs</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{commonJobCosts.map(([label, value]) => (<div key={label} className="flex items-center justify-between bg-zinc-50 rounded-2xl border border-zinc-100 px-5 py-4 gap-4"><span className="font-bold text-zinc-700" style={{ fontSize: "16px" }}>{label}</span><span className="font-black text-zinc-900 whitespace-nowrap" style={{ fontSize: "16px" }}>{value}</span></div>))}</div>
                        </div>
                    </section>

                    <section className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8">
                        <div className="bg-white rounded-3xl border border-zinc-200 p-8">
                            <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><Wrench className="w-6 h-6 text-[#FF6600]" />Removalist Services We Cover</h2>
                            <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>TradeRefer&apos;s removalist hub covers local residential moves, interstate relocation, office moves, backloading, packing services, and specialty item transport across Australia.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{["Local residential move", "Interstate relocation", "Office / commercial move", "Backloading (shared truck)", "Packing & unpacking service", "Piano & specialty items", "Furniture-only move", "Storage & transit", "Same-day emergency move", "International relocation"].map((s) => (<div key={s} className="px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl font-bold text-zinc-700 capitalize" style={{ fontSize: "16px" }}>{s}</div>))}</div>
                        </div>
                        <div className="bg-white rounded-3xl border border-zinc-200 p-8">
                            <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "28px" }}><Clock3 className="w-5 h-5 text-blue-500" />Before You Hire a Removalist</h2>
                            <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>Use these checks to avoid damage disputes, unexpected charges, and uninsured transit losses.</p>
                            <div className="space-y-4">{hiringTips.map(({ title, body, icon: Icon }) => (<div key={title} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-5"><div className="flex items-start gap-3 mb-2"><div className="w-10 h-10 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center shrink-0"><Icon className="w-5 h-5 text-[#FF6600]" /></div><h3 className="font-black text-zinc-900" style={{ fontSize: "18px" }}>{title}</h3></div><p className="text-zinc-600" style={{ fontSize: "16px", lineHeight: 1.7 }}>{body}</p></div>))}</div>
                        </div>
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><MapPin className="w-6 h-6 text-[#FF6600]" />Find Removalists by City</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{featuredCities.map(({ city, state, stateSlug, citySlug }) => { const count = cityCounts[`${city.toLowerCase()}::${state}`] || 0; return (<Link key={`${city}-${state}`} href={`/local/${stateSlug}/${citySlug}?category=Removalists`} className="flex items-center justify-between px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl hover:bg-orange-50 hover:border-[#FF6600] transition-colors group"><div><span className="font-black text-zinc-900 group-hover:text-[#FF6600]" style={{ fontSize: "16px" }}>{city}</span><p className="text-zinc-400" style={{ fontSize: "16px" }}>{state} · {count > 0 ? `${count} listed` : "Browse local directory"}</p></div><ArrowRight className="w-5 h-5 text-zinc-300 group-hover:text-[#FF6600]" /></Link>); })}</div>
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <div className="max-w-3xl mb-8"><h2 className="font-black text-[#1A1A1A] mb-3 font-display" style={{ fontSize: "32px" }}>Get 3 Free Removalist Quotes</h2><p className="text-zinc-500" style={{ fontSize: "18px", lineHeight: 1.7 }}>Request quotes here and we&apos;ll match your move with up to 3 verified local removalist businesses.</p></div>
                        <PublicMultiQuoteForm initialTradeCategory="Removalists" initialSourcePage="/trades/removalists" />
                    </section>

                    <section>
                        <h2 className="font-black text-[#1A1A1A] mb-8 font-display" style={{ fontSize: "32px" }}>Removalists: Frequently Asked Questions</h2>
                        <div className="space-y-4">{faqs.map((faq) => (<div key={faq.q} className="bg-white rounded-2xl border border-zinc-200 p-6"><h3 className="font-black text-zinc-900 mb-2" style={{ fontSize: "18px" }}>{faq.q}</h3><p className="text-zinc-600" style={{ fontSize: "16px", lineHeight: 1.7 }}>{faq.a}</p></div>))}</div>
                    </section>

                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">{whyTradeRefer.map((item) => (<div key={item.title} className="bg-white rounded-3xl border border-zinc-200 p-8"><h2 className="font-black text-[#1A1A1A] mb-3 font-display" style={{ fontSize: "24px" }}>{item.title}</h2><p className="text-zinc-600" style={{ fontSize: "16px", lineHeight: 1.7 }}>{item.body}</p></div>))}</section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "28px" }}><Wrench className="w-5 h-5 text-[#FF6600]" />Related Trade Guides</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{relatedTrades.map((trade) => (<Link key={trade.href} href={trade.href} className="flex items-center justify-between px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl font-bold text-zinc-700 hover:bg-orange-50 hover:border-[#FF6600] hover:text-[#FF6600] transition-colors" style={{ fontSize: "16px" }}><span>{trade.label}</span><ArrowRight className="w-4 h-4 text-zinc-300" /></Link>))}</div>
                    </section>

                    <section className="bg-[#1A1A1A] rounded-3xl p-8 md:p-12 text-center text-white">
                        <h2 className="font-black mb-4 text-white" style={{ fontSize: "40px" }}>Ready to Move? Get Local Removalist Quotes</h2>
                        <p className="text-zinc-400 mb-8 max-w-2xl mx-auto" style={{ fontSize: "20px", lineHeight: 1.7 }}>Browse verified local removalist businesses, compare prices and services, and find the right team for your local or interstate move.</p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link href="/quotes?trade=Removalists&source=%2Ftrades%2Fremovalists" className="inline-flex items-center gap-2 bg-[#FF6600] hover:bg-[#E65C00] text-white font-black rounded-xl px-8 transition-colors" style={{ minHeight: "64px", fontSize: "18px" }}>Get 3 Free Quotes <ArrowRight className="w-5 h-5" /></Link>
                            <Link href="/businesses?category=Removalists" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-black rounded-xl px-8 transition-colors border border-white/10" style={{ minHeight: "64px", fontSize: "18px" }}>Browse Removalists</Link>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
