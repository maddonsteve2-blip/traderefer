"use client";

import { useState } from "react";
import { ImagePlus, Play, Loader2, CheckCircle2, XCircle } from "lucide-react";

interface PhotoStats {
    total_active?: number;
    has_photos?: number;
    missing_photos?: number;
    has_logo?: number;
    missing_logo?: number;
    google_photo_urls?: number;
    blob_photo_urls?: number;
    has_place_id?: number;
}

interface LogEntry { name: string; status: string; found?: string[]; detail?: string; }
interface RunResult {
    status: string;
    stats: { processed: number; updated: number; photos_added: number; not_found: number; errors: number };
    remaining: number;
    log: LogEntry[];
    message?: string;
}

const STATES = ["", "NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

export function PhotoFiller({ initialStats }: { initialStats: PhotoStats | null }) {
    const [stats, setStats] = useState<PhotoStats | null>(initialStats);
    const [running, setRunning] = useState(false);
    const [batchSize, setBatchSize] = useState(30);
    const [state, setState] = useState("");
    const [minPhotos, setMinPhotos] = useState(6);
    const [result, setResult] = useState<RunResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [autoRun, setAutoRun] = useState(false);
    const [totalProcessed, setTotalProcessed] = useState(0);

    const runBatch = async () => {
        setRunning(true);
        setError(null);
        setResult(null);
        try {
            const res = await fetch("/api/backend/admin/photos/run", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ limit: batchSize, state: state || null, min_photos: minPhotos }),
            });
            if (!res.ok) {
                const body = await res.text();
                throw new Error(body || `HTTP ${res.status}`);
            }
            const data: RunResult = await res.json();
            setResult(data);
            setTotalProcessed(p => p + (data.stats?.processed || 0));

            const statsRes = await fetch("/api/backend/admin/photos/stats");
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
                <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center shrink-0">
                    <ImagePlus className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                    <h3 className="font-bold text-zinc-900">Business Photo Filler</h3>
                    <p className="text-sm text-zinc-500 mt-0.5">
                        Fetch photos from Google Places API for businesses missing them
                    </p>
                </div>
            </div>

            {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                    <StatCard label="Has Photos" value={stats.has_photos ?? 0} color="green" />
                    <StatCard label="Missing Photos" value={stats.missing_photos ?? 0} color="orange" />
                    <StatCard label="Has Logo" value={stats.has_logo ?? 0} color="blue" />
                    <StatCard label="Missing Logo" value={stats.missing_logo ?? 0} color="red" />
                    <StatCard label="Google URLs" value={stats.google_photo_urls ?? 0} color="yellow" />
                    <StatCard label="Blob URLs" value={stats.blob_photo_urls ?? 0} color="violet" />
                </div>
            )}

            <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Batch</label>
                    <input type="number" value={batchSize} onChange={e => setBatchSize(Math.min(50, Math.max(1, parseInt(e.target.value) || 30)))}
                        className="w-16 px-2 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20" min={1} max={50} />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">State</label>
                    <select value={state} onChange={e => setState(e.target.value)}
                        className="px-2 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20">
                        {STATES.map(s => <option key={s} value={s}>{s || "All"}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Min</label>
                    <input type="number" value={minPhotos} onChange={e => setMinPhotos(parseInt(e.target.value) || 6)}
                        className="w-14 px-2 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20" min={1} max={10} />
                </div>
                <label className="flex items-center gap-2 text-xs font-bold text-zinc-500 cursor-pointer">
                    <input type="checkbox" checked={autoRun} onChange={e => setAutoRun(e.target.checked)}
                        className="w-4 h-4 rounded border-zinc-300 text-cyan-600 focus:ring-cyan-500" />
                    Auto
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
                        <span className="text-green-600">✓ {result.stats.updated} updated</span>
                        <span className="text-cyan-600">+{result.stats.photos_added} photos</span>
                        <span className="text-orange-500">{result.stats.not_found} not found</span>
                        <span className="text-red-500">✗ {result.stats.errors} err</span>
                        <span className="text-zinc-400 ml-auto">{result.remaining} remaining</span>
                    </div>
                    <div className="max-h-48 overflow-y-auto bg-zinc-50 rounded-xl p-3 text-xs font-mono space-y-1">
                        {result.log.map((entry, i) => (
                            <div key={i} className={entry.status === "error" ? "text-red-500" : entry.status === "not_found" ? "text-orange-500" : "text-zinc-600"}>
                                {entry.status === "ok" ? <><CheckCircle2 className="w-3 h-3 inline mr-1 text-green-500" />{entry.name} → {entry.found?.join(", ")}</> :
                                 entry.status === "not_found" ? <><XCircle className="w-3 h-3 inline mr-1 text-orange-400" />{entry.name} — no photos found</> :
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
    const cm: Record<string, string> = { green: "bg-green-50 text-green-700", orange: "bg-orange-50 text-orange-700", blue: "bg-blue-50 text-blue-700", red: "bg-red-50 text-red-700", yellow: "bg-yellow-50 text-yellow-700", violet: "bg-violet-50 text-violet-700" };
    return (
        <div className={`rounded-xl px-3 py-2 ${cm[color] || "bg-zinc-50 text-zinc-700"}`}>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">{label}</p>
            <p className="text-lg font-black">{value.toLocaleString()}</p>
        </div>
    );
}
