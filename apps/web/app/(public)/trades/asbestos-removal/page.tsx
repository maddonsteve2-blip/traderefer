import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, ChevronRight, Clock3, DollarSign, FileText, Home, MapPin, ShieldCheck, Star, Wrench } from "lucide-react";
import { sql } from "@/lib/db";
import { STATE_LICENSING } from "@/lib/constants";
import { PublicMultiQuoteForm } from "@/components/PublicMultiQuoteForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Asbestos Removal Australia | Find Licensed Asbestos Removalists | TradeRefer",
    description: "Find licensed asbestos removalists across Australia. Compare asbestos inspection and removal costs by city, understand Class A and Class B licencing requirements, and hire verified local asbestos removal businesses through TradeRefer.",
    alternates: { canonical: "https://traderefer.au/trades/asbestos-removal" },
    openGraph: { title: "Asbestos Removal Australia | TradeRefer", description: "Compare asbestos removal costs, Class A vs Class B licensing, and verified licensed asbestos removalists across Australia.", url: "https://traderefer.au/trades/asbestos-removal", type: "website" },
};

const relatedTrades = [
    { label: "Demolition", href: "/trades/demolition" },
    { label: "Roofing", href: "/trades/roofing" },
    { label: "Rendering", href: "/trades/rendering" },
    { label: "Building", href: "/categories#building" },
    { label: "Skip Bins", href: "/trades/skip-bins" },
    { label: "Painting", href: "/trades/painting" },
];
const cityPricing = [
    { city: "Sydney", state: "NSW", inspection: "$350–$800", classB: "$40–$80/m²", classA: "$80–$200/m²", disposal: "$300–$600" },
    { city: "Melbourne", state: "VIC", inspection: "$300–$750", classB: "$35–$75/m²", classA: "$75–$180/m²", disposal: "$280–$550" },
    { city: "Brisbane", state: "QLD", inspection: "$280–$700", classB: "$32–$70/m²", classA: "$70–$170/m²", disposal: "$260–$520" },
    { city: "Perth", state: "WA", inspection: "$300–$750", classB: "$35–$75/m²", classA: "$75–$180/m²", disposal: "$280–$550" },
    { city: "Adelaide", state: "SA", inspection: "$280–$700", classB: "$32–$68/m²", classA: "$68–$170/m²", disposal: "$260–$500" },
    { city: "Canberra", state: "ACT", inspection: "$350–$800", classB: "$40–$80/m²", classA: "$80–$200/m²", disposal: "$300–$600" },
    { city: "Hobart", state: "TAS", inspection: "$300–$750", classB: "$35–$75/m²", classA: "$75–$185/m²", disposal: "$280–$560" },
    { city: "Darwin", state: "NT", inspection: "$380–$900", classB: "$45–$90/m²", classA: "$90–$220/m²", disposal: "$350–$700" },
];
const commonJobCosts = [
    ["Asbestos inspection / survey (residential)", "$280–$800"],
    ["Air monitoring (during / post removal)", "$200–$600"],
    ["Class B removal – flat fibro sheeting (per m²)", "$32–$80/m²"],
    ["Class B removal – eaves / fascias (per m²)", "$40–$90/m²"],
    ["Class A removal – friable asbestos (per m²)", "$70–$200/m²"],
    ["Asbestos roof removal (per m²)", "$50–$120/m²"],
    ["Asbestos floor tiles removal (per m²)", "$40–$90/m²"],
    ["Soil contamination remediation (per m²)", "$80–$250/m²"],
    ["Clearance certificate issue", "$150–$400"],
    ["Licensed disposal at approved facility", "$280–$700"],
];
const hiringTips = [
    { title: "Always verify the removalist's Class A or Class B licence", body: "All asbestos removal must be performed by a business holding either a Class A (friable asbestos) or Class B (non-friable) licence issued by the relevant state/territory regulator. Never use an unlicensed contractor — it's illegal, dangerous, and leaves you personally liable. Verify licences at your state's WHS regulator website before engaging anyone.", icon: BadgeCheck },
    { title: "Get an inspection before any removal quote", body: "A proper asbestos survey by a licensed assessor identifies all asbestos-containing materials (ACMs) and their condition. Never allow removal to proceed without a formal written asbestos register. Skipping this step means you may miss contamination and face incomplete or illegal removal.", icon: FileText },
    { title: "Clearance certificates are mandatory before re-occupying", body: "After Class A removal, an independent licensed assessor must perform air monitoring and issue a clearance certificate before the area can be re-occupied. This is a legal requirement under Safe Work Australia standards — not optional. A contractor who says you don't need one is non-compliant.", icon: ShieldCheck },
    { title: "Confirm licensed disposal and documentation", body: "Asbestos waste must be double-bagged in UN-rated asbestos waste bags, labelled, and transported to an EPA-approved disposal facility — never to a general tip. Request the disposal docket (weighbridge receipt) as proof. Improper disposal carries significant personal liability for the property owner.", icon: Star },
];
const whyTradeRefer = [
    { title: "Verified licensed removalists", body: "TradeRefer helps homeowners find ABN-verified, Class A and Class B licensed asbestos removalists — the only legal and safe option for asbestos removal in Australia." },
    { title: "Compare costs before you call", body: "Use this hub to understand typical asbestos inspection and removal costs per square metre across Australian cities so you can immediately identify underpriced, non-compliant quotes." },
    { title: "Australia-wide local discovery", body: "Navigate from this national asbestos removal guide into city and suburb-level pages to find licensed asbestos removalists in the specific area where your property is located." },
];
const faqs = [
    { q: "What is the difference between Class A and Class B asbestos removal?", a: "Class B licence covers non-friable asbestos (solid, bonded material like fibro sheeting, floor tiles, and Hardiplank). Class A licence is required for friable asbestos — any loose, powdery, or crumbling asbestos that can be reduced to dust by hand pressure. Class A work is higher risk and more expensive. Only Class A licensed contractors can remove friable asbestos." },
    { q: "Do I need a permit to remove asbestos in Australia?", a: "For removal over 10m² of non-friable asbestos, or any amount of friable asbestos, you must notify your state WHS regulator before removal begins. The notification requirements vary by state. In all cases, only licensed removalists can legally perform the work — DIY removal is prohibited above 10m² in most states and territories." },
    { q: "How long does asbestos removal take?", a: "A standard residential asbestos removal job (fibro shed, eaves, or roof) typically takes 1–2 days. Larger or more complex jobs involving friable asbestos, multiple contaminated areas, or decontamination procedures can take several days. Add 1–3 days for clearance air monitoring results before re-occupying." },
    { q: "Can I stay in my home during asbestos removal?", a: "For Class B (non-friable) removal from external areas like eaves or outbuildings, occupants may remain in the home if the area is properly delineated and sealed. For any Class A (friable) removal, or extensive Class B work affecting internal areas, the home should be vacated until a clearance certificate is issued." },
    { q: "Is asbestos removal covered by home insurance?", a: "Standard home and contents insurance does not cover asbestos removal or contamination remediation. Some policies include limited asbestos emergency cover — check your product disclosure statement. If you're purchasing a pre-1990 property, commission an asbestos survey before purchase and factor remediation costs into your offer." },
    { q: "How do I find out if my home has asbestos?", a: "Homes built before 1987 in Australia commonly contain asbestos-containing materials in eaves, fibro cladding, floor tiles, roof sheeting, and pipe lagging. The only way to confirm is through an asbestos survey by a licensed assessor who can take samples and send them for laboratory testing. Visual identification alone is unreliable — many materials look similar to non-asbestos alternatives." },
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
        const results = await sql<StateCountRow[]>`SELECT state, COUNT(*) as count FROM businesses WHERE status = 'active' AND (trade_category ILIKE '%asbestos%' OR trade_category ILIKE '%demolition%') AND state IS NOT NULL GROUP BY state ORDER BY count DESC`;
        const map: Record<string, number> = {};
        results.forEach((row) => { map[row.state] = parseInt(String(row.count), 10); });
        return map;
    } catch { return {}; }
}
async function getFeaturedCityCounts(): Promise<Record<string, number>> {
    try {
        const results = await sql<CityCountRow[]>`SELECT city, state, COUNT(*) as count FROM businesses WHERE status = 'active' AND (trade_category ILIKE '%asbestos%' OR trade_category ILIKE '%demolition%') AND city IS NOT NULL AND city != '' GROUP BY city, state`;
        const map: Record<string, number> = {};
        results.forEach((row) => { map[`${String(row.city).toLowerCase()}::${String(row.state).toUpperCase()}`] = parseInt(String(row.count), 10); });
        return map;
    } catch { return {}; }
}

export default async function AsbestosRemovalTradeHubPage() {
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
                        <span className="text-[#FF6600]">Asbestos Removal</span>
                    </nav>
                    <div className="max-w-4xl">
                        <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-2 font-black text-orange-400 uppercase tracking-widest mb-6" style={{ fontSize: "16px" }}><Home className="w-4 h-4" />Australia-Wide Trade Hub</div>
                        <h1 className="font-black mb-6 leading-[1.05] font-display text-white" style={{ fontSize: "clamp(48px, 8vw, 80px)" }}>Find Licensed <span className="text-[#FF6600]">Asbestos Removalists</span> Across Australia</h1>
                        <p className="text-zinc-400 max-w-3xl mb-8" style={{ fontSize: "20px", lineHeight: 1.7 }}>Use this TradeRefer asbestos removal hub to compare inspection and removal costs across Australian cities, understand Class A and Class B licensing obligations, and connect with verified licensed asbestos removalists.</p>
                        <div className="flex flex-wrap gap-4">
                            <Link href="/quotes?trade=Demolition&source=%2Ftrades%2Fasbestos-removal" className="bg-[#FF6600] hover:bg-[#E65C00] text-white font-black px-8 rounded-xl transition-colors inline-flex items-center justify-center gap-2" style={{ minHeight: "64px", fontSize: "18px" }}>Get 3 Free Quotes<ArrowRight className="w-5 h-5" /></Link>
                            <Link href="/businesses?category=Demolition" className="bg-white/10 hover:bg-white/20 text-white font-black px-8 rounded-xl transition-colors border border-white/10 inline-flex items-center justify-center" style={{ minHeight: "64px", fontSize: "18px" }}>Browse Asbestos Removalists</Link>
                            <Link href="/local" className="bg-white/10 hover:bg-white/20 text-white font-black px-8 rounded-xl transition-colors border border-white/10 inline-flex items-center justify-center" style={{ minHeight: "64px", fontSize: "18px" }}>Browse by Location</Link>
                        </div>
                        <div className="flex flex-wrap gap-6 text-white font-bold mt-8" style={{ fontSize: "16px" }}>
                            <span className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-[#FF6600]" />Class B from $32–$80/m²</span>
                            {totalBusinesses > 0 && <span className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-[#FF6600]" />{totalBusinesses.toLocaleString()} demolition/asbestos businesses listed</span>}
                            {statesCovered > 0 && <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#FF6600]" />Available in {statesCovered} states & territories</span>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16">
                <div className="max-w-6xl mx-auto space-y-16">
                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><DollarSign className="w-6 h-6 text-[#FF6600]" />Asbestos Removal Cost Guide Australia</h2>
                        <p className="text-zinc-500 mb-8" style={{ fontSize: "18px", lineHeight: 1.7 }}>Asbestos removal costs vary significantly by asbestos type (Class A friable vs Class B non-friable), volume, access, and decontamination requirements. All costs below exclude independent air monitoring and clearance certificates.</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100"><p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Inspection / Survey</p><p className="text-3xl font-black text-zinc-900">$280–$800</p><p className="text-zinc-500" style={{ fontSize: "16px" }}>licensed assessor, residential</p></div>
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100"><p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Class B Removal</p><p className="text-3xl font-black text-zinc-900">$32–$80/m²</p><p className="text-zinc-500" style={{ fontSize: "16px" }}>non-friable fibro sheeting</p></div>
                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100"><p className="font-black text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "14px" }}>Class A Removal</p><p className="text-3xl font-black text-zinc-900">$70–$200/m²</p><p className="text-zinc-500" style={{ fontSize: "16px" }}>friable asbestos, higher risk</p></div>
                        </div>
                        <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                            <table className="min-w-full text-left">
                                <thead className="bg-zinc-100 text-zinc-700"><tr><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>City</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Inspection</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Class B</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Class A</th><th className="px-4 py-3 font-black" style={{ fontSize: "14px" }}>Disposal</th></tr></thead>
                                <tbody>{cityPricing.map((row) => (<tr key={row.city} className="border-t border-zinc-200 bg-white"><td className="px-4 py-3 font-bold text-zinc-900" style={{ fontSize: "16px" }}>{row.city}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.inspection}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.classB}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.classA}</td><td className="px-4 py-3 text-zinc-600" style={{ fontSize: "16px" }}>{row.disposal}</td></tr>))}</tbody>
                            </table>
                        </div>
                        <div className="mt-8">
                            <h3 className="font-black text-zinc-900 mb-4 font-display" style={{ fontSize: "24px" }}>Common Asbestos Removal Job Costs</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{commonJobCosts.map(([label, value]) => (<div key={label} className="flex items-center justify-between bg-zinc-50 rounded-2xl border border-zinc-100 px-5 py-4 gap-4"><span className="font-bold text-zinc-700" style={{ fontSize: "16px" }}>{label}</span><span className="font-black text-zinc-900 whitespace-nowrap" style={{ fontSize: "16px" }}>{value}</span></div>))}</div>
                        </div>
                    </section>

                    <section className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8">
                        <div className="bg-white rounded-3xl border border-zinc-200 p-8">
                            <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><Wrench className="w-6 h-6 text-[#FF6600]" />Asbestos Services We Cover</h2>
                            <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>TradeRefer&apos;s asbestos removal hub covers surveys, Class A and Class B removal, soil remediation, disposal, and clearance certification Australia-wide.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{["Asbestos inspection & survey", "Class B fibro removal", "Class A friable removal", "Asbestos roof removal", "Floor tile removal", "Pipe lagging removal", "Soil remediation", "Air monitoring", "Clearance certificate", "Licensed disposal"].map((s) => (<div key={s} className="px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl font-bold text-zinc-700 capitalize" style={{ fontSize: "16px" }}>{s}</div>))}</div>
                        </div>
                        <div className="bg-white rounded-3xl border border-zinc-200 p-8">
                            <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "28px" }}><Clock3 className="w-5 h-5 text-blue-500" />Before You Hire an Asbestos Removalist</h2>
                            <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>Asbestos removal has strict legal requirements. Use these checks to protect your health, your property, and your legal compliance.</p>
                            <div className="space-y-4">{hiringTips.map(({ title, body, icon: Icon }) => (<div key={title} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-5"><div className="flex items-start gap-3 mb-2"><div className="w-10 h-10 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center shrink-0"><Icon className="w-5 h-5 text-[#FF6600]" /></div><h3 className="font-black text-zinc-900" style={{ fontSize: "18px" }}>{title}</h3></div><p className="text-zinc-600" style={{ fontSize: "16px", lineHeight: 1.7 }}>{body}</p></div>))}</div>
                        </div>
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><MapPin className="w-6 h-6 text-[#FF6600]" />Find Asbestos Removalists by City</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{featuredCities.map(({ city, state, stateSlug, citySlug }) => { const count = cityCounts[`${city.toLowerCase()}::${state}`] || 0; return (<Link key={`${city}-${state}`} href={`/local/${stateSlug}/${citySlug}?category=Demolition`} className="flex items-center justify-between px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl hover:bg-orange-50 hover:border-[#FF6600] transition-colors group"><div><span className="font-black text-zinc-900 group-hover:text-[#FF6600]" style={{ fontSize: "16px" }}>{city}</span><p className="text-zinc-400" style={{ fontSize: "16px" }}>{state} · {count > 0 ? `${count} listed` : "Browse local directory"}</p></div><ArrowRight className="w-5 h-5 text-zinc-300 group-hover:text-[#FF6600]" /></Link>); })}</div>
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <div className="max-w-3xl mb-8"><h2 className="font-black text-[#1A1A1A] mb-3 font-display" style={{ fontSize: "32px" }}>Get 3 Free Asbestos Removal Quotes</h2><p className="text-zinc-500" style={{ fontSize: "18px", lineHeight: 1.7 }}>Request quotes here and we&apos;ll match your project with up to 3 verified licensed asbestos removalists in your area.</p></div>
                        <PublicMultiQuoteForm initialTradeCategory="Demolition" initialSourcePage="/trades/asbestos-removal" />
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "32px" }}><FileText className="w-6 h-6 text-blue-500" />Asbestos Licensing Requirements by State</h2>
                        <p className="text-zinc-500 mb-6" style={{ fontSize: "18px", lineHeight: 1.7 }}>Asbestos removal is strictly regulated across all Australian states. Class A and Class B licences are issued by state and territory WHS regulators — here&apos;s what applies where your property is located.</p>
                        <div className="space-y-3">{Object.entries(STATE_LICENSING["Demolition"] ?? {}).map(([stateCode, text]) => (<div key={stateCode} className="bg-blue-50 border border-blue-100 rounded-2xl p-5"><p className="font-black text-blue-600 uppercase tracking-wider mb-2" style={{ fontSize: "14px" }}>{stateCode}</p><p className="text-zinc-700" style={{ fontSize: "16px", lineHeight: 1.7 }}>{text as string}</p></div>))}</div>
                    </section>

                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">{whyTradeRefer.map((item) => (<div key={item.title} className="bg-white rounded-3xl border border-zinc-200 p-8"><h2 className="font-black text-[#1A1A1A] mb-3 font-display" style={{ fontSize: "24px" }}>{item.title}</h2><p className="text-zinc-600" style={{ fontSize: "16px", lineHeight: 1.7 }}>{item.body}</p></div>))}</section>

                    <section>
                        <h2 className="font-black text-[#1A1A1A] mb-8 font-display" style={{ fontSize: "32px" }}>Asbestos Removal: Frequently Asked Questions</h2>
                        <div className="space-y-4">{faqs.map((faq) => (<div key={faq.q} className="bg-white rounded-2xl border border-zinc-200 p-6"><h3 className="font-black text-zinc-900 mb-2" style={{ fontSize: "18px" }}>{faq.q}</h3><p className="text-zinc-600" style={{ fontSize: "16px", lineHeight: 1.7 }}>{faq.a}</p></div>))}</div>
                    </section>

                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                        <h2 className="font-black text-[#1A1A1A] mb-2 flex items-center gap-2 font-display" style={{ fontSize: "28px" }}><Wrench className="w-5 h-5 text-[#FF6600]" />Related Trade Guides</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{relatedTrades.map((trade) => (<Link key={trade.href} href={trade.href} className="flex items-center justify-between px-5 py-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl font-bold text-zinc-700 hover:bg-orange-50 hover:border-[#FF6600] hover:text-[#FF6600] transition-colors" style={{ fontSize: "16px" }}><span>{trade.label}</span><ArrowRight className="w-4 h-4 text-zinc-300" /></Link>))}</div>
                    </section>

                    <section className="bg-[#1A1A1A] rounded-3xl p-8 md:p-12 text-center text-white">
                        <h2 className="font-black mb-4 text-white" style={{ fontSize: "40px" }}>Need a Licensed Asbestos Removalist?</h2>
                        <p className="text-zinc-400 mb-8 max-w-2xl mx-auto" style={{ fontSize: "20px", lineHeight: 1.7 }}>Browse verified licensed asbestos removal businesses and find the right contractor for your inspection, removal, or clearance needs.</p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link href="/quotes?trade=Demolition&source=%2Ftrades%2Fasbestos-removal" className="inline-flex items-center gap-2 bg-[#FF6600] hover:bg-[#E65C00] text-white font-black rounded-xl px-8 transition-colors" style={{ minHeight: "64px", fontSize: "18px" }}>Get 3 Free Quotes <ArrowRight className="w-5 h-5" /></Link>
                            <Link href="/businesses?category=Demolition" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-black rounded-xl px-8 transition-colors border border-white/10" style={{ minHeight: "64px", fontSize: "18px" }}>Browse Asbestos Removalists</Link>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
