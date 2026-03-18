"use client";

import { useState } from "react";
import { Globe, Play, Loader2, CheckCircle2, XCircle, RotateCcw } from "lucide-react";

interface ScrapeStats {
    scraped?: number;
    unscraped?: number;
    got_description?: number;
    got_logo?: number;
    got_email?: number;
    got_phone?: number;
    last_scraped_at?: string;
}

interface LogEntry {
    name: string;
    status: string;
    found?: string[];
    detail?: string;
}

interface RunResult {
    status: string;
    stats: { processed: number; desc: number; logo: number; email: number; phone: number; errors: number };
    remaining: number;
    log: LogEntry[];
}

export function WebsiteScraper({ initialStats }: { initialStats: ScrapeStats | null }) {
    const [stats, setStats] = useState<ScrapeStats | null>(initialStats);
    const [running, setRunning] = useState(false);
    const [batchSize, setBatchSize] = useState(50);
    const [force, setForce] = useState(false);
    const [result, setResult] = useState<RunResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [totalProcessed, setTotalProcessed] = useState(0);
    const [autoRun, setAutoRun] = useState(false);

    const runBatch = async () => {
        setRunning(true);
        setError(null);
        setResult(null);
        try {
            const res = await fetch("/api/backend/admin/scrape/run", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ limit: batchSize, force }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: RunResult = await res.json();
            setResult(data);
            setTotalProcessed((prev) => prev + data.stats.processed);

            // Refresh stats
            const statsRes = await fetch("/api/backend/admin/scrape/stats");
            if (statsRes.ok) {
                const freshStats = await statsRes.json();
                setStats(freshStats);
            }

            // Auto-run next batch if enabled and there's more to do
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

    const stopAutoRun = () => {
        setAutoRun(false);
        setRunning(false);
    };

    return (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5 text-green-600" />
                </div>
                <div>
                    <h3 className="font-bold text-zinc-900">Website Scraper</h3>
                    <p className="text-sm text-zinc-500 mt-0.5">
                        Scrape business websites for real descriptions, logos, emails &amp; phones
                    </p>
                </div>
            </div>

            {/* Stats grid */}
            {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                    <StatCard label="Scraped" value={stats.scraped ?? 0} color="green" />
                    <StatCard label="Remaining" value={stats.unscraped ?? 0} color="orange" />
                    <StatCard label="Descriptions" value={stats.got_description ?? 0} color="blue" />
                    <StatCard label="Logos" value={stats.got_logo ?? 0} color="cyan" />
                    <StatCard label="Emails" value={stats.got_email ?? 0} color="violet" />
                    <StatCard label="Phones" value={stats.got_phone ?? 0} color="pink" />
                </div>
            )}

            {stats?.last_scraped_at && (
                <p className="text-[11px] text-zinc-400 mb-4">
                    Last scraped: {new Date(stats.last_scraped_at).toLocaleString("en-AU")}
                </p>
            )}

            {/* Controls */}
            <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Batch</label>
                    <input
                        type="number"
                        value={batchSize}
                        onChange={(e) => setBatchSize(Math.min(100, Math.max(1, parseInt(e.target.value) || 50)))}
                        className="w-20 px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
                        min={1}
                        max={100}
                    />
                </div>
                <label className="flex items-center gap-2 text-xs font-bold text-zinc-500 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={force}
                        onChange={(e) => setForce(e.target.checked)}
                        className="w-4 h-4 rounded border-zinc-300 text-green-600 focus:ring-green-500"
                    />
                    Re-scrape all
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-zinc-500 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={autoRun}
                        onChange={(e) => setAutoRun(e.target.checked)}
                        className="w-4 h-4 rounded border-zinc-300 text-orange-600 focus:ring-orange-500"
                    />
                    Auto-continue
                </label>
            </div>

            {/* Run / Stop buttons */}
            <div className="flex gap-2">
                {!running ? (
                    <button
                        onClick={runBatch}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold text-sm transition-colors"
                    >
                        <Play className="w-4 h-4" /> Run Batch ({batchSize})
                    </button>
                ) : (
                    <button
                        onClick={stopAutoRun}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-colors"
                    >
                        <Loader2 className="w-4 h-4 animate-spin" /> Running... Click to stop
                    </button>
                )}
            </div>

            {totalProcessed > 0 && (
                <p className="text-xs text-zinc-400 mt-2 text-center">
                    Total this session: {totalProcessed} processed
                </p>
            )}

            {/* Error */}
            {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    <XCircle className="w-4 h-4 inline mr-1" /> {error}
                </div>
            )}

            {/* Results */}
            {result && (
                <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-4 text-xs font-bold">
                        <span className="text-green-600">✓ {result.stats.desc} desc</span>
                        <span className="text-cyan-600">✓ {result.stats.logo} logo</span>
                        <span className="text-violet-600">✓ {result.stats.email} email</span>
                        <span className="text-pink-600">✓ {result.stats.phone} phone</span>
                        <span className="text-red-500">✗ {result.stats.errors} err</span>
                        <span className="text-zinc-400 ml-auto">{result.remaining} remaining</span>
                    </div>

                    {/* Log */}
                    <div className="max-h-48 overflow-y-auto bg-zinc-50 rounded-xl p-3 text-xs font-mono space-y-1">
                        {result.log.map((entry, i) => (
                            <div key={i} className={entry.status === "error" ? "text-red-500" : "text-zinc-600"}>
                                {entry.status === "ok" ? (
                                    <><CheckCircle2 className="w-3 h-3 inline mr-1 text-green-500" />{entry.name} → {entry.found?.join(", ") || "—"}</>
                                ) : (
                                    <><XCircle className="w-3 h-3 inline mr-1" />{entry.name} — {entry.detail}</>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
    const colorMap: Record<string, string> = {
        green: "bg-green-50 text-green-700",
        orange: "bg-orange-50 text-orange-700",
        blue: "bg-blue-50 text-blue-700",
        cyan: "bg-cyan-50 text-cyan-700",
        violet: "bg-violet-50 text-violet-700",
        pink: "bg-pink-50 text-pink-700",
    };
    return (
        <div className={`rounded-xl px-3 py-2 ${colorMap[color] || "bg-zinc-50 text-zinc-700"}`}>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">{label}</p>
            <p className="text-lg font-black">{value.toLocaleString()}</p>
        </div>
    );
}
