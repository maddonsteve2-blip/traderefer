export const dynamic = "force-dynamic";

import { Wrench, Play, Square, Clock, MapPin, ImagePlus, Globe, Database, CheckCircle2 } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getToolStatus(token: string) {
    try {
        const res = await fetch(`${API}/admin/tools/status`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
        });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

interface ToolParam {
    key: string;
    label: string;
    type: "select" | "number" | "checkbox";
    options?: string[];
    default?: string;
}

interface Tool {
    id: string;
    name: string;
    description: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    params: ToolParam[];
}

const tools: Tool[] = [
    {
        id: "google-places-fill",
        name: "Google Places Fill",
        description: "Search Google Places API to add new businesses by state and trade category",
        icon: MapPin,
        color: "text-blue-600",
        bg: "bg-blue-50",
        params: [
            { key: "state", label: "State", type: "select", options: ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"] },
        ],
    },
    {
        id: "photo-filler",
        name: "Business Photo Filler",
        description: "Fetch up to 10 photos per business from Google Places API",
        icon: ImagePlus,
        color: "text-cyan-600",
        bg: "bg-cyan-50",
        params: [
            { key: "state", label: "State", type: "select", options: ["", "NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"] },
            { key: "limit", label: "Limit", type: "number", default: "1000" },
        ],
    },
    {
        id: "website-scraper",
        name: "Website Scraper",
        description: "Scrape business websites for logos, emails, phone numbers, and descriptions",
        icon: Globe,
        color: "text-green-600",
        bg: "bg-green-50",
        params: [
            { key: "limit", label: "Limit", type: "number", default: "" },
            { key: "logos_only", label: "Logos Only", type: "checkbox" },
        ],
    },
    {
        id: "blob-converter",
        name: "Photo URL → Blob Converter",
        description: "Convert Google Places photo URLs to permanent Vercel Blob storage URLs",
        icon: Database,
        color: "text-violet-600",
        bg: "bg-violet-50",
        params: [
            { key: "limit", label: "Limit", type: "number", default: "500" },
            { key: "concurrency", label: "Concurrency", type: "number", default: "5" },
        ],
    },
];

export default async function ToolsPage() {
    const { getToken } = await auth();
    const token = await getToken();
    const status = token ? await getToolStatus(token) : null;

    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-black text-zinc-900 flex items-center gap-2">
                        <Wrench className="w-6 h-6 text-orange-600" /> Fill & Scrape Tools
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">
                        Run data collection scripts from the admin panel. Scripts execute on Railway.
                    </p>
                </div>

                {/* Active runs banner */}
                {status?.active_runs && status.active_runs.length > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-6">
                        <h3 className="text-sm font-bold text-orange-800 flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4" /> Active Script Runs
                        </h3>
                        {status.active_runs.map((run: any) => (
                            <div key={run.id} className="flex items-center justify-between py-2 border-b border-orange-100 last:border-0">
                                <div>
                                    <span className="font-bold text-orange-900 text-sm">{run.tool}</span>
                                    <span className="text-orange-600 text-xs ml-2">
                                        {run.progress}/{run.total} · {run.rate}/min
                                    </span>
                                </div>
                                <button className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-xs font-bold hover:bg-red-200">
                                    <Square className="w-3 h-3 inline mr-1" /> Stop
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Tool cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {tools.map((tool) => (
                        <div key={tool.id} className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                            <div className="flex items-start gap-3 mb-4">
                                <div className={`w-10 h-10 rounded-xl ${tool.bg} flex items-center justify-center shrink-0`}>
                                    <tool.icon className={`w-5 h-5 ${tool.color}`} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-zinc-900">{tool.name}</h3>
                                    <p className="text-sm text-zinc-500 mt-0.5">{tool.description}</p>
                                </div>
                            </div>

                            {/* Parameters */}
                            <form className="space-y-3 mb-4">
                                {tool.params.map((param) => (
                                    <div key={param.key} className="flex items-center gap-3">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider w-24 shrink-0">
                                            {param.label}
                                        </label>
                                        {param.type === "select" ? (
                                            <select
                                                name={param.key}
                                                className="flex-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                            >
                                                {param.options?.map((opt) => (
                                                    <option key={opt} value={opt}>{opt || "All"}</option>
                                                ))}
                                            </select>
                                        ) : param.type === "checkbox" ? (
                                            <input type="checkbox" name={param.key} className="w-4 h-4 rounded border-zinc-300 text-orange-600 focus:ring-orange-500" />
                                        ) : (
                                            <input
                                                type="number"
                                                name={param.key}
                                                defaultValue={param.default}
                                                placeholder={param.default || "No limit"}
                                                className="flex-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                            />
                                        )}
                                    </div>
                                ))}
                            </form>

                            <button
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold text-sm transition-colors"
                            >
                                <Play className="w-4 h-4" /> Run Script
                            </button>

                            {/* Last run info */}
                            {status?.last_runs?.[tool.id] && (
                                <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
                                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                                    Last run: {status.last_runs[tool.id].time} · {status.last_runs[tool.id].result}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Run history */}
                <h2 className="text-lg font-black text-zinc-900 mt-8 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-zinc-400" /> Run History
                </h2>
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                    <p className="text-sm text-zinc-400 text-center py-4">
                        Script run history will appear here once the Railway API endpoints are connected.
                    </p>
                </div>
            </div>
        </div>
    );
}
