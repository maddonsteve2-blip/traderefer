"use client";

import { useState } from "react";
import { Database, Play, Loader2, CheckCircle2, XCircle } from "lucide-react";

interface BlobStats {
    needs_conversion?: number;
    fully_converted?: number;
    logos_need_conversion?: number;
    logos_converted?: number;
}

interface LogEntry { name: string; status: string; found?: string[]; detail?: string; }
interface RunResult {
    status: string;
    stats: { processed: number; logos_converted: number; photos_converted: number; errors: number };
    remaining: number;
    log: LogEntry[];
    message?: string;
}

export function BlobConverter({ initialStats }: { initialStats: BlobStats | null }) {
    const [stats, setStats] = useState<BlobStats | null>(initialStats);
    const [running, setRunning] = useState(false);
    const [batchSize, setBatchSize] = useState(15);
    const [result, setResult] = useState<RunResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [autoRun, setAutoRun] = useState(false);
    const [totalProcessed, setTotalProcessed] = useState(0);

    const runBatch = async () => {
        setRunning(true);
        setError(null);
        setResult(null);
        try {
            const res = await fetch("/api/backend/admin/blob/run", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ limit: batchSize, concurrency: 5 }),
            });
            if (!res.ok) {
                const body = await res.text();
                throw new Error(body || `HTTP ${res.status}`);
            }
            const data: RunResult = await res.json();
            setResult(data);
            setTotalProcessed(p => p + (data.stats?.processed || 0));

            const statsRes = await fetch("/api/backend/admin/blob/stats");
            if (statsRes.ok) setStats(await statsRes.json());

            if (autoRun && data.remaining > 0 && data.status === "done") {
                setTimeout(() => runBatch(), 1000);
            } else {
                setRunning(false);
            }
        } catch (e: any) {
            setError(e.message);
            setRunning(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                    <Database className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                    <h3 className="font-bold text-zinc-900">Photo URL → Blob Converter</h3>
                    <p className="text-sm text-zinc-500 mt-0.5">
                        Convert Google Places photo URLs to permanent Vercel Blob storage
                    </p>
                </div>
            </div>

            {stats && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <StatCard label="Need Conversion" value={stats.needs_conversion ?? 0} color="orange" />
                    <StatCard label="Fully Converted" value={stats.fully_converted ?? 0} color="green" />
                    <StatCard label="Logos to Convert" value={stats.logos_need_conversion ?? 0} color="red" />
                    <StatCard label="Logos Done" value={stats.logos_converted ?? 0} color="blue" />
                </div>
            )}

            <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Batch</label>
                    <input type="number" value={batchSize} onChange={e => setBatchSize(Math.min(30, Math.max(1, parseInt(e.target.value) || 15)))}
                        className="w-16 px-2 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20" min={1} max={30} />
                </div>
                <label className="flex items-center gap-2 text-xs font-bold text-zinc-500 cursor-pointer">
                    <input type="checkbox" checked={autoRun} onChange={e => setAutoRun(e.target.checked)}
                        className="w-4 h-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500" />
                    Auto-continue
                </label>
            </div>

            <div className="flex gap-2">
                {!running ? (
                    <button onClick={runBatch}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold text-sm transition-colors">
                        <Play className="w-4 h-4" /> Run Batch ({batchSize})
                    </button>
                ) : (
                    <button onClick={() => { setAutoRun(false); setRunning(false); }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-colors">
                        <Loader2 className="w-4 h-4 animate-spin" /> Running... Click to stop
                    </button>
                )}
            </div>

            {totalProcessed > 0 && <p className="text-xs text-zinc-400 mt-2 text-center">Session: {totalProcessed} processed</p>}
            {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"><XCircle className="w-4 h-4 inline mr-1" />{error}</div>}

            {result && (
                <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-4 text-xs font-bold">
                        <span className="text-blue-600">✓ {result.stats.logos_converted} logos</span>
                        <span className="text-violet-600">✓ {result.stats.photos_converted} photos</span>
                        <span className="text-red-500">✗ {result.stats.errors} err</span>
                        <span className="text-zinc-400 ml-auto">{result.remaining} remaining</span>
                    </div>
                    <div className="max-h-48 overflow-y-auto bg-zinc-50 rounded-xl p-3 text-xs font-mono space-y-1">
                        {result.log.map((entry, i) => (
                            <div key={i} className={entry.status === "error" ? "text-red-500" : entry.status === "skip" ? "text-zinc-400" : "text-zinc-600"}>
                                {entry.status === "ok" ? <><CheckCircle2 className="w-3 h-3 inline mr-1 text-green-500" />{entry.name} → {entry.found?.join(", ")}</> :
                                 entry.status === "skip" ? <span>{entry.name} — skipped</span> :
                                 <><XCircle className="w-3 h-3 inline mr-1" />{entry.name} — {entry.detail}</>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
    const cm: Record<string, string> = { green: "bg-green-50 text-green-700", orange: "bg-orange-50 text-orange-700", blue: "bg-blue-50 text-blue-700", red: "bg-red-50 text-red-700" };
    return (
        <div className={`rounded-xl px-3 py-2 ${cm[color] || "bg-zinc-50 text-zinc-700"}`}>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">{label}</p>
            <p className="text-lg font-black">{value.toLocaleString()}</p>
        </div>
    );
}
