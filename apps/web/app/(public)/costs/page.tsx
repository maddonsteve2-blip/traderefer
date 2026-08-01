import { sql } from "@/lib/db";
import Link from "next/link";
import { Metadata } from "next";
import { ChevronRight, DollarSign } from "lucide-react";
import { JOB_TYPES, TRADE_COST_GUIDE, jobToSlug, normalizeTradeName } from "@/lib/constants";
import { jobCostGuide } from "@/lib/job-costs";

// Daily is plenty: ranges move when the price sampler or FAQ pipeline runs.
export const revalidate = 86400;

const BASE = "https://traderefer.au";

type CostRow = {
    job_slug: string;
    question: string;
    answer: string;
};

async function getCostAnswers(): Promise<Map<string, CostRow>> {
    try {
        const rows = await sql<CostRow[]>`
            SELECT DISTINCT ON (job_slug) job_slug, question, answer
            FROM job_questions
            WHERE answer IS NOT NULL AND answer != ''
              AND question ~* '(cost|how much|price)'
            ORDER BY job_slug, sort ASC
        `;
        return new Map(rows.map((r) => [r.job_slug, r]));
    } catch {
        return new Map();
    }
}

function firstSentence(text: string) {
    const m = text.match(/^.*?[.!?](?=\s|$)/);
    return m ? m[0] : text;
}

function titleCase(slug: string) {
    return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function buildSections(costAnswers: Map<string, CostRow>) {
    const sections: Array<{
        trade: string;
        tradeSlug: string;
        guide: { unit: string; low: number; high: number } | undefined;
        jobs: Array<{ slug: string; name: string; line: string; range: string | null }>;
    }> = [];
    const used = new Set<string>();
    for (const [trade, jobs] of Object.entries(JOB_TYPES)) {
        const rows: (typeof sections)[number]["jobs"] = [];
        for (const job of jobs) {
            const slug = jobToSlug(job);
            if (used.has(slug)) continue;
            const row = costAnswers.get(slug);
            if (!row) continue;
            used.add(slug);
            const guide = jobCostGuide(slug, TRADE_COST_GUIDE[normalizeTradeName(trade)] || TRADE_COST_GUIDE[trade]);
            rows.push({
                slug,
                name: titleCase(slug),
                line: firstSentence(row.answer),
                range: guide ? `$${guide.low.toLocaleString()}–$${guide.high.toLocaleString()}${guide.unit}` : null,
            });
        }
        if (rows.length > 0) {
            sections.push({
                trade,
                tradeSlug: jobToSlug(trade),
                guide: TRADE_COST_GUIDE[normalizeTradeName(trade)] || TRADE_COST_GUIDE[trade],
                jobs: rows.sort((a, b) => a.name.localeCompare(b.name)),
            });
        }
    }
    return sections.sort((a, b) => b.jobs.length - a.jobs.length);
}

export async function generateMetadata(): Promise<Metadata> {
    const costAnswers = await getCostAnswers();
    const n = costAnswers.size;
    const title = `Trade Job Cost Guide Australia: ${n} Jobs Priced | TradeRefer`;
    const description = `What ${n} common trade jobs cost in Australia, from switchboard upgrades to turf laying. Ranges grounded in retail material price samples and Australian trade rates, updated as prices move. Free quotes from local tradies.`;
    return {
        title,
        description,
        alternates: { canonical: `${BASE}/costs` },
        openGraph: { title, description, url: `${BASE}/costs`, siteName: "TradeRefer", type: "website" },
        twitter: { card: "summary", title, description },
    };
}

export default async function CostsHubPage() {
    const costAnswers = await getCostAnswers();
    const sections = buildSections(costAnswers);
    const totalJobs = sections.reduce((acc, s) => acc + s.jobs.length, 0);
    const updated = new Date().toLocaleDateString("en-AU", { month: "long", year: "numeric" });

    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: BASE },
            { "@type": "ListItem", position: 2, name: "Cost Guide" },
        ],
    };
    const itemListJsonLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Australian trade job cost guides",
        numberOfItems: totalJobs,
        itemListElement: sections.flatMap((s) =>
            s.jobs.map((j) => ({
                "@type": "ListItem",
                position: 0,
                name: `${j.name} cost`,
                url: `${BASE}/trades/${j.slug}`,
            }))
        ).map((item, i) => ({ ...item, position: i + 1 })),
    };

    return (
        <main className="min-h-screen bg-[#FCFCFC]">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />

            <div className="bg-gray-100 border-b border-gray-200" style={{ paddingTop: "108px", paddingBottom: "12px" }}>
                <div className="container mx-auto px-4 max-w-7xl">
                    <nav className="flex items-center gap-2 font-bold text-gray-500 uppercase tracking-widest" style={{ fontSize: "16px" }}>
                        <Link href="/" className="hover:text-[#FF6600] transition-colors">Home</Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-[#1A1A1A]">Cost Guide</span>
                    </nav>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-7xl py-12">
                <h1 className="font-black text-[#1A1A1A] font-display mb-4" style={{ fontSize: "clamp(34px, 5vw, 48px)" }}>
                    What Trade Jobs Cost in Australia
                </h1>
                <p className="text-zinc-700 max-w-3xl mb-2" style={{ fontSize: "20px", lineHeight: 1.6 }}>
                    Typical prices for {totalJobs} common trade jobs, from switchboard upgrades to turf laying.
                    Every figure is grounded in retail material prices sampled from Australian hardware
                    retailers plus standard trade rates, and each job links to a full guide with materials,
                    FAQs and local businesses.
                </p>
                <p className="text-zinc-500 mb-10 text-base">Updated {updated}. Estimates only: site conditions and access change every quote.</p>

                {/* Trade jump links */}
                <div className="flex flex-wrap gap-2 mb-12">
                    {sections.map((s) => (
                        <a key={s.tradeSlug} href={`#${s.tradeSlug}`}
                            className="inline-flex items-center px-3 py-1.5 bg-white border border-zinc-200 rounded-full text-base font-bold text-zinc-600 hover:border-orange-500 hover:text-orange-600 transition-colors">
                            {s.trade} ({s.jobs.length})
                        </a>
                    ))}
                </div>

                {sections.map((s) => (
                    <section key={s.tradeSlug} id={s.tradeSlug} className="mb-12 scroll-mt-28">
                        <h2 className="font-black text-[#1A1A1A] font-display mb-1" style={{ fontSize: "28px" }}>
                            {s.trade} costs
                        </h2>
                        <p className="mb-2">
                            <Link href={`/trades/${s.tradeSlug}`} className="font-bold text-orange-600 hover:text-orange-700 transition-colors text-base">
                                All {s.trade.toLowerCase()} guides and local specialists →
                            </Link>
                        </p>
                        {s.guide && (
                            <p className="text-zinc-500 mb-5 text-base">
                                Typical {s.trade.toLowerCase()} rates: ${s.guide.low.toLocaleString()}–${s.guide.high.toLocaleString()}{s.guide.unit}
                            </p>
                        )}
                        <ul className="grid gap-3 md:grid-cols-2">
                            {s.jobs.map((j) => (
                                <li key={j.slug} className="bg-white rounded-2xl border border-zinc-200 p-5">
                                    <div className="flex items-baseline justify-between gap-3 mb-1.5">
                                        <Link href={`/trades/${j.slug}`} className="font-black text-[#1A1A1A] hover:text-[#FF6600] transition-colors" style={{ fontSize: "19px" }}>
                                            {j.name}
                                        </Link>
                                        {j.range && (
                                            <span className="shrink-0 inline-flex items-center gap-1 text-base font-bold text-orange-600 tabular-nums">
                                                <DollarSign className="w-4 h-4" />{j.range.replace(/^\$/, "")}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-zinc-600 text-base" style={{ lineHeight: 1.55 }}>{j.line}</p>
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}

                <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10 mt-4">
                    <h2 className="font-black text-[#1A1A1A] font-display mb-3" style={{ fontSize: "26px" }}>
                        Get real quotes, not estimates
                    </h2>
                    <p className="text-zinc-700 max-w-2xl mb-5 text-lg">
                        These ranges tell you what is normal. A written quote from a local tradie tells you
                        what your job costs. Request free quotes and compare before you commit.
                    </p>
                    <Link href="/register?type=homeowner"
                        className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-full px-6 py-3.5 text-base transition-colors">
                        Get free quotes
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </section>
            </div>
        </main>
    );
}
