export const dynamic = "force-dynamic";

import {
    ShieldAlert,
    Users,
    Target,
    BarChart3,
    ChevronRight,
    Building2,
    UserCheck,
    ImagePlus,
    Wrench,
    Search,
    FolderSearch,
    Activity,
} from "lucide-react";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getAdminStats(token: string) {
    const res = await fetch(`${API}/admin/overview`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
}

export default async function AdminDashboardPage() {
    const { getToken } = await auth();
    const token = await getToken();
    const stats = token ? await getAdminStats(token) : null;

    const statCards = [
        { label: "Total Businesses", value: stats?.total_businesses ?? "—", icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Total Referrers", value: stats?.total_referrers ?? "—", icon: Users, color: "text-violet-600", bg: "bg-violet-50" },
        { label: "Total Leads", value: stats?.total_leads ?? "—", icon: Target, color: "text-orange-600", bg: "bg-orange-50" },
        { label: "Open Disputes", value: stats?.open_disputes ?? "—", icon: ShieldAlert, color: "text-red-600", bg: "bg-red-50" },
        { label: "Claimed Businesses", value: stats?.claimed_businesses ?? "—", icon: UserCheck, color: "text-green-600", bg: "bg-green-50" },
        { label: "With Photos", value: stats?.businesses_with_photos ?? "—", icon: ImagePlus, color: "text-cyan-600", bg: "bg-cyan-50" },
    ];

    const quickLinks = [
        { label: "Manage Businesses", description: "Search, edit, add businesses", href: "/admin/directory", icon: Building2, color: "text-blue-500" },
        { label: "Fill & Scrape Tools", description: "Run Google Places fill, photo filler, scrapers", href: "/admin/tools", icon: Wrench, color: "text-orange-500" },
        { label: "User Management", description: "Manage businesses & referrer accounts", href: "/admin/users", icon: Users, color: "text-violet-500" },
        { label: "Leads & Disputes", description: "Review leads, resolve disputes", href: "/admin/leads", icon: Target, color: "text-red-500" },
        { label: "SEO & Analytics", description: "Google Search Console data, opportunities", href: "/admin/seo", icon: Search, color: "text-green-500" },
        { label: "Fill Queue", description: "Empty suburb+trade pages awaiting fill", href: "/admin/fill-queue", icon: FolderSearch, color: "text-amber-500" },
    ];

    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-black text-zinc-900">Admin Console</h1>
                        <p className="text-zinc-500 font-medium mt-1">System overview and management</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-white border border-zinc-200 rounded-full px-4 py-2 flex items-center gap-2 text-sm font-bold text-zinc-600">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            System Live
                        </div>
                    </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                    {statCards.map((stat) => (
                        <div key={stat.label} className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                                </div>
                            </div>
                            <div className="text-2xl font-black text-zinc-900">
                                {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
                            </div>
                            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mt-1">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Quick links grid */}
                <h2 className="text-lg font-black text-zinc-900 mb-4">Quick Access</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {quickLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all group"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3 mb-3">
                                    <link.icon className={`w-5 h-5 ${link.color}`} />
                                    <h3 className="text-base font-bold text-zinc-900 group-hover:text-orange-600 transition-colors">
                                        {link.label}
                                    </h3>
                                </div>
                                <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-orange-500 transition-colors mt-1" />
                            </div>
                            <p className="text-sm text-zinc-500">{link.description}</p>
                        </Link>
                    ))}
                </div>

                {/* Recent activity placeholder */}
                <h2 className="text-lg font-black text-zinc-900 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-zinc-400" /> Recent Activity
                </h2>
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                    {stats?.recent_activity && stats.recent_activity.length > 0 ? (
                        <div className="space-y-3">
                            {stats.recent_activity.map((item: any, i: number) => (
                                <div key={i} className="flex items-center gap-3 py-2 border-b border-zinc-50 last:border-0">
                                    <div className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                                    <span className="text-sm text-zinc-700 font-medium">{item.message}</span>
                                    <span className="text-xs text-zinc-400 ml-auto shrink-0">{item.time}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-zinc-400 text-center py-4">Activity feed will appear here once the API endpoint is connected.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
