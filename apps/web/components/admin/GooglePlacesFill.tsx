"use client";

import { useState } from "react";
import { MapPin, Play, Loader2, CheckCircle2, XCircle, SkipForward } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];
const TRADES = [
    "Plumber", "Electrician", "Carpenter", "Painter", "Tiler", "Roofer",
    "Landscaper", "Concreter", "Builder", "Fencer", "Cleaner", "HVAC",
    "Locksmith", "Plasterer", "Glazier", "Demolition", "Flooring",
    "Handyman", "Tree Lopping", "Pest Control", "Pool Builder",
];

interface Stats {
    total_active?: number;
    from_google?: number;
    has_place_id?: number;
    states_covered?: number;
    trades_covered?: number;
}

export function GooglePlacesFill({ initialStats }: { initialStats: Stats | null }) {
    const { getToken } = useAuth();
    const [stats, setStats] = useState<Stats | null>(initialStats);
    const [trade, setTrade] = useState("Plumber");
    const [state, setState] = useState("VIC");
    const [suburb, setSuburb] = useState("");
    const [limit, setLimit] = useState(20);
    const [running, setRunning] = useState(false);
    const [log, setLog] = useState<string[]>([]);
    const [result, setResult] = useState<any>(null);

    async function runFill() {
        setRunning(true);
        setLog([]);
        setResult(null);
        try {
            const token = await getToken();
            const res = await fetch(`${API}/admin/places/run`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ trade, state, suburb: suburb || undefined, limit }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Failed");
            setResult(data.stats);
            setLog(data.log || []);
            // Refresh stats
            const statsRes = await fetch(`${API}/admin/places/stats`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (statsRes.ok) setStats(await statsRes.json());
        } catch (err: any) {
            setLog([`❌ Error: ${err.message}`]);
        } finally {
            setRunning(false);
        }
    }

    return (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <h3 className="font-bold text-zinc-900">Google Places Fill</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                        Search Google Places API and add new businesses to the directory
                    </p>
                </div>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-zinc-50 rounded-lg p-2 text-center">
                        <div className="text-lg font-black text-zinc-900">{stats.total_active?.toLocaleString() ?? "—"}</div>
                        <div className="text-[10px] font-bold text-zinc-400 uppercase">Total Active</div>
                    </div>
                    <div className="bg-zinc-50 rounded-lg p-2 text-center">
                        <div className="text-lg font-black text-blue-600">{stats.from_google?.toLocaleString() ?? "—"}</div>
                        <div className="text-[10px] font-bold text-zinc-400 uppercase">From Google</div>
                    </div>
                    <div className="bg-zinc-50 rounded-lg p-2 text-center">
                        <div className="text-lg font-black text-green-600">{stats.trades_covered ?? "—"}</div>
                        <div className="text-[10px] font-bold text-zinc-400 uppercase">Trade Types</div>
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className="space-y-3 mb-4">
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Trade</label>
                        <select
                            value={trade}
                            onChange={(e) => setTrade(e.target.value)}
                            disabled={running}
                            className="w-full mt-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm"
                        >
                            {TRADES.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">State</label>
                        <select
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            disabled={running}
                            className="w-full mt-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm"
                        >
                            {STATES.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Suburb (optional)</label>
                        <input
                            type="text"
                            value={suburb}
                            onChange={(e) => setSuburb(e.target.value)}
                            disabled={running}
                            placeholder="e.g. Richmond"
                            className="w-full mt-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Limit</label>
                        <input
                            type="number"
                            value={limit}
                            onChange={(e) => setLimit(Number(e.target.value))}
                            disabled={running}
                            min={1}
                            max={60}
                            className="w-full mt-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm"
                        />
                    </div>
                </div>
            </div>

            <button
                onClick={runFill}
                disabled={running}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 text-white rounded-xl font-bold text-sm transition-colors"
            >
                {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {running ? "Searching Google Places..." : "Run Fill"}
            </button>

            {/* Results summary */}
            {result && (
                <div className="mt-4 grid grid-cols-4 gap-2">
                    <div className="bg-green-50 rounded-lg p-2 text-center">
                        <div className="text-lg font-black text-green-600">{result.created}</div>
                        <div className="text-[10px] font-bold text-green-500 uppercase">Created</div>
                    </div>
                    <div className="bg-zinc-50 rounded-lg p-2 text-center">
                        <div className="text-lg font-black text-zinc-500">{result.skipped_duplicate}</div>
                        <div className="text-[10px] font-bold text-zinc-400 uppercase">Dupes</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-2 text-center">
                        <div className="text-lg font-black text-blue-600">{result.searched}</div>
                        <div className="text-[10px] font-bold text-blue-400 uppercase">Searched</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-2 text-center">
                        <div className="text-lg font-black text-red-500">{result.errors}</div>
                        <div className="text-[10px] font-bold text-red-400 uppercase">Errors</div>
                    </div>
                </div>
            )}

            {/* Log */}
            {log.length > 0 && (
                <div className="mt-3 max-h-48 overflow-y-auto bg-zinc-900 rounded-lg p-3 text-xs font-mono text-zinc-300 space-y-0.5">
                    {log.map((entry, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                            {entry.startsWith("✅") ? <CheckCircle2 className="w-3 h-3 text-green-400 mt-0.5 shrink-0" /> :
                             entry.startsWith("⏭") ? <SkipForward className="w-3 h-3 text-zinc-500 mt-0.5 shrink-0" /> :
                             <XCircle className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />}
                            <span>{entry.replace(/^[✅⏭❌]\s*/, "")}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
