import { Wrench, ArrowRight } from "lucide-react";
import type { JobMaterial } from "@/lib/materials";

function money(n: number) {
    return n >= 100 ? `$${Math.round(n)}` : `$${n.toFixed(2).replace(/\.00$/, "")}`;
}

// Single-product samples have low === high; "around $499" reads honestly
// where "$499–$499" reads like a bug.
function moneyRange(low: number, high: number) {
    return money(low) === money(high) ? `about ${money(low)}` : `${money(low)}–${money(high)}`;
}

/**
 * "Materials you'll need" card for job pages — renders the job's mapped
 * materials with live-sampled retail price ranges and a quote CTA. Server
 * component; render only when materials.length > 0.
 */
export function JobMaterialsCard({
    jobName,
    tradeNoun,
    materials,
}: {
    jobName: string;
    tradeNoun: string;
    materials: JobMaterial[];
}) {
    const priced = materials.filter((m) => !m.optional && m.price_low != null && m.price_high != null);
    const totalLow = priced.reduce((acc, m) => acc + (m.price_low as number), 0);
    const totalHigh = priced.reduce((acc, m) => acc + (m.price_high as number), 0);
    const latestSample = materials
        .map((m) => m.sampled_at)
        .filter(Boolean)
        .sort()
        .pop();
    const sampledLabel = latestSample
        ? new Date(latestSample).toLocaleDateString("en-AU", { month: "long", year: "numeric" })
        : null;

    return (
        <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
            <h2 className="text-2xl font-black text-zinc-900 mb-2 flex items-center gap-2">
                <Wrench className="w-6 h-6 text-orange-500" />
                Materials You&apos;ll Need for {jobName}
            </h2>
            <p className="text-zinc-600 mb-6 text-base max-w-prose">
                What a tradie typically uses for {jobName.toLowerCase()}, with current retail price ranges.
                Your tradie usually supplies these — the quote should itemise them.
            </p>
            <ul className="divide-y divide-zinc-100 mb-5">
                {materials.map((m) => (
                    <li key={m.name} className="py-3 flex items-baseline justify-between gap-4">
                        <div className="min-w-0">
                            <span className="font-bold text-zinc-900">{m.name}</span>
                            <span className="text-zinc-500 text-base"> · {m.unit}</span>
                            {m.qty_note && <span className="block text-sm text-zinc-600">{m.qty_note}</span>}
                            {m.optional && (
                                <span className="inline-block mt-0.5 text-[10px] font-black uppercase tracking-wider text-zinc-400 bg-zinc-100 rounded px-1.5 py-0.5">
                                    If needed
                                </span>
                            )}
                        </div>
                        <span className="shrink-0 font-bold text-zinc-800 text-base tabular-nums">
                            {m.price_low != null && m.price_high != null
                                ? moneyRange(m.price_low, m.price_high)
                                : "varies"}
                        </span>
                    </li>
                ))}
            </ul>
            {priced.length >= 2 && (
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-black text-orange-400 uppercase tracking-wider mb-0.5">
                            Rough materials total
                        </p>
                        <p className="text-2xl font-black text-zinc-900">
                            {money(totalLow)}–{money(totalHigh)}
                        </p>
                        <p className="text-sm text-zinc-600">Core items only — labour is on top (see cost guide above)</p>
                    </div>
                    <a
                        href="#businesses"
                        className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-full px-5 py-3 text-sm"
                    >
                        Get quotes from local {tradeNoun.toLowerCase()}
                        <ArrowRight className="w-4 h-4" />
                    </a>
                </div>
            )}
            <p className="text-sm text-zinc-500">
                Price ranges sampled from major Australian hardware retailers
                {sampledLabel ? ` (${sampledLabel})` : ""}. Estimates only — quantities and final costs depend on your
                job. Always confirm inclusions in writing with your tradie.
            </p>
        </section>
    );
}
