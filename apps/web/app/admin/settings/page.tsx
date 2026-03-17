export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { Settings, Play, CheckCircle2, Database, Globe, Key, Clock, Wrench } from "lucide-react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function triggerCron(token: string) {
    // This is a display-only page; cron trigger is a client action
    return null;
}

export default async function SettingsPage() {
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
                    {/* System Status */}
                    <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                        <h3 className="font-bold text-zinc-900 mb-4 flex items-center gap-2">
                            <Database className="w-4 h-4 text-blue-500" /> System Status
                        </h3>
                        <div className="space-y-3">
                            {[
                                { label: "API (Railway)", status: "online", url: process.env.NEXT_PUBLIC_API_URL || "localhost:8000" },
                                { label: "GSC API (Railway)", status: "online", url: "traderefer-gsc-api-production.up.railway.app" },
                                { label: "Database (Neon)", status: "online", url: "neon.tech" },
                                { label: "Blob Storage (Vercel)", status: "online", url: "blob.vercel-storage.com" },
                            ].map((svc) => (
                                <div key={svc.label} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
                                    <div>
                                        <p className="text-sm font-bold text-zinc-800">{svc.label}</p>
                                        <p className="text-[11px] text-zinc-400">{svc.url}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-xs font-bold text-green-600">Online</span>
                                    </div>
                                </div>
                            ))}
                        </div>
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
                </div>
            </div>
        </div>
    );
}
