export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { Settings, Play, CheckCircle2, Database, Globe, Key, Clock, Wrench, AlertTriangle, XCircle } from "lucide-react";
import Link from "next/link";
import { TradeCategories } from "@/components/admin/TradeCategories";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getHealth(token: string) {
    try {
        const res = await fetch(`${API}/admin/health`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
        });
        if (!res.ok) return null;
        return res.json();
    } catch { return null; }
}

async function getCategories(token: string) {
    try {
        const res = await fetch(`${API}/admin/trade-categories`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
        });
        if (!res.ok) return [];
        return res.json();
    } catch { return []; }
}

function StatusDot({ status }: { status: string }) {
    const color = status === "online" ? "bg-green-500" : status === "degraded" ? "bg-amber-500" : status === "not_configured" ? "bg-zinc-300" : "bg-red-500";
    const label = status === "online" ? "Online" : status === "degraded" ? "Degraded" : status === "not_configured" ? "N/A" : "Offline";
    const textColor = status === "online" ? "text-green-600" : status === "degraded" ? "text-amber-600" : status === "not_configured" ? "text-zinc-400" : "text-red-600";
    return (
        <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${color} ${status === "online" ? "animate-pulse" : ""}`} />
            <span className={`text-xs font-bold ${textColor}`}>{label}</span>
        </div>
    );
}

export default async function SettingsPage() {
    const { getToken } = await auth();
    const token = await getToken();
    const [health, categories] = await Promise.all([
        token ? getHealth(token) : null,
        token ? getCategories(token) : [],
    ]);

    const dbSize = health?.db_stats?.db_size_bytes
        ? `${(health.db_stats.db_size_bytes / 1024 / 1024).toFixed(0)} MB`
        : "—";

    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-black text-zinc-900 flex items-center gap-2">
                        <Settings className="w-6 h-6 text-zinc-600" /> Settings
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">System configuration, API status, and cron management</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* System Status — Real Health Checks */}
                    <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                        <h3 className="font-bold text-zinc-900 mb-4 flex items-center gap-2">
                            <Database className="w-4 h-4 text-blue-500" /> System Status
                        </h3>
                        <div className="space-y-3">
                            {[
                                { label: "Database (Neon)", key: "database" },
                                { label: "GSC API (Railway)", key: "gsc_api" },
                                { label: "Blob Storage (Vercel)", key: "blob_storage" },
                                { label: "Google Places API", key: "google_api" },
                            ].map((svc) => {
                                const check = health?.[svc.key];
                                return (
                                    <div key={svc.label} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
                                        <div>
                                            <p className="text-sm font-bold text-zinc-800">{svc.label}</p>
                                            <p className="text-[11px] text-zinc-400">{check?.detail || "checking..."}</p>
                                        </div>
                                        <StatusDot status={check?.status || "offline"} />
                                    </div>
                                );
                            })}
                        </div>
                        {health?.db_stats && (
                            <div className="mt-4 pt-3 border-t border-zinc-100 grid grid-cols-3 gap-2 text-center">
                                <div>
                                    <div className="text-lg font-black text-zinc-900">{health.db_stats.businesses?.toLocaleString() ?? "—"}</div>
                                    <div className="text-[10px] font-bold text-zinc-400 uppercase">Businesses</div>
                                </div>
                                <div>
                                    <div className="text-lg font-black text-zinc-900">{health.db_stats.leads?.toLocaleString() ?? "—"}</div>
                                    <div className="text-[10px] font-bold text-zinc-400 uppercase">Leads</div>
                                </div>
                                <div>
                                    <div className="text-lg font-black text-zinc-900">{dbSize}</div>
                                    <div className="text-[10px] font-bold text-zinc-400 uppercase">DB Size</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Cron Jobs */}
                    <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                        <h3 className="font-bold text-zinc-900 mb-4 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-orange-500" /> Cron Jobs
                        </h3>
                        <div className="space-y-3 mb-4">
                            {[
                                "Expire pending leads",
                                "Expire unlocked leads",
                                "Release pending earnings",
                                "Cleanup expired PINs",
                                "D7 survey followups",
                                "D14 survey followups",
                                "Close unconfirmed leads",
                                "Auto-pass stalled screening",
                                "Re-engagement nudges",
                            ].map((job) => (
                                <div key={job} className="flex items-center gap-2 py-1">
                                    <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                                    <span className="text-sm text-zinc-700">{job}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-zinc-400 mb-3">
                            Cron jobs run via GitHub Action. Trigger manually via POST /admin/cron/process-lifecycle
                        </p>
                    </div>

                    {/* API Keys */}
                    <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                        <h3 className="font-bold text-zinc-900 mb-4 flex items-center gap-2">
                            <Key className="w-4 h-4 text-violet-500" /> API Integrations
                        </h3>
                        <div className="space-y-3">
                            {[
                                { name: "Google Maps API", status: "active" },
                                { name: "Clerk Auth", status: "active" },
                                { name: "Twilio SMS", status: "active" },
                                { name: "PostHog Analytics", status: "active" },
                                { name: "Vercel Blob", status: "active" },
                                { name: "Google Search Console", status: "active" },
                            ].map((api) => (
                                <div key={api.name} className="flex items-center justify-between py-1.5">
                                    <span className="text-sm text-zinc-700">{api.name}</span>
                                    <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-black uppercase rounded-full">
                                        {api.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                        <h3 className="font-bold text-zinc-900 mb-4 flex items-center gap-2">
                            <Globe className="w-4 h-4 text-green-500" /> External Links
                        </h3>
                        <div className="space-y-2">
                            {[
                                { label: "Neon Dashboard", url: "https://console.neon.tech" },
                                { label: "Vercel Dashboard", url: "https://vercel.com" },
                                { label: "Railway Dashboard", url: "https://railway.app" },
                                { label: "Clerk Dashboard", url: "https://dashboard.clerk.com" },
                                { label: "Google Cloud Console", url: "https://console.cloud.google.com" },
                                { label: "PostHog", url: "https://app.posthog.com" },
                            ].map((link) => (
                                <a
                                    key={link.label}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener"
                                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-zinc-50 transition-colors group"
                                >
                                    <span className="text-sm font-bold text-zinc-700 group-hover:text-orange-600">{link.label}</span>
                                    <Globe className="w-3 h-3 text-zinc-300 group-hover:text-orange-500" />
                                </a>
                            ))}
                        </div>
                    </div>
                    {/* Trade Categories */}
                    <TradeCategories initialCategories={categories} />
                </div>
            </div>
        </div>
    );
}
