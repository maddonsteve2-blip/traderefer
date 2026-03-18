export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { Megaphone, Tag, Zap, Calendar, ExternalLink, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchAdmin(token: string, path: string) {
    try {
        const res = await fetch(`${API}/admin/${path}`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
        });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

export default async function CampaignsPage() {
    const { getToken } = await auth();
    const token = await getToken();

    const [campaignData, dealData] = token
        ? await Promise.all([fetchAdmin(token, "campaigns"), fetchAdmin(token, "deals")])
        : [null, null];

    const campaigns = campaignData?.campaigns || [];
    const campaignStats = campaignData?.stats || {};
    const deals = dealData?.deals || [];
    const dealStats = dealData?.stats || {};

    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-black text-zinc-900 flex items-center gap-2">
                        <Megaphone className="w-6 h-6 text-violet-600" /> Campaigns & Deals
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">View all active campaigns and deals across businesses</p>
                </div>

                {/* Summary stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <StatCard label="Active Campaigns" value={campaignStats.active ?? 0} color="violet" />
                    <StatCard label="Inactive Campaigns" value={campaignStats.inactive ?? 0} color="zinc" />
                    <StatCard label="Active Deals" value={dealStats.active ?? 0} color="green" />
                    <StatCard label="Inactive Deals" value={dealStats.inactive ?? 0} color="zinc" />
                </div>

                {/* Campaigns table */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm mb-6">
                    <h2 className="text-base font-black text-zinc-900 mb-4 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-violet-500" /> Campaigns ({campaigns.length})
                    </h2>
                    {campaigns.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-zinc-100 text-[11px] font-black text-zinc-400 uppercase tracking-widest">
                                        <th className="text-left p-2">Title</th>
                                        <th className="text-left p-2">Business</th>
                                        <th className="text-left p-2">Type</th>
                                        <th className="text-right p-2">Bonus</th>
                                        <th className="text-left p-2">Ends</th>
                                        <th className="text-center p-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {campaigns.map((c: any) => {
                                        const isActive = c.is_active && (!c.ends_at || new Date(c.ends_at) > new Date());
                                        return (
                                            <tr key={c.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                                                <td className="p-2 font-bold text-zinc-800">{c.title}</td>
                                                <td className="p-2">
                                                    <Link href={`/b/${c.business_slug}`} className="text-blue-600 hover:underline text-xs font-bold flex items-center gap-1">
                                                        {c.business_name} <ExternalLink className="w-3 h-3" />
                                                    </Link>
                                                </td>
                                                <td className="p-2 text-xs text-zinc-500">{c.campaign_type?.replace(/_/g, " ")}</td>
                                                <td className="p-2 text-right text-xs font-bold">
                                                    {c.bonus_amount_cents ? `$${(c.bonus_amount_cents / 100).toFixed(0)}` : `${c.multiplier}x`}
                                                </td>
                                                <td className="p-2 text-xs text-zinc-500">
                                                    {c.ends_at ? new Date(c.ends_at).toLocaleDateString("en-AU") : "—"}
                                                </td>
                                                <td className="p-2 text-center">
                                                    {isActive ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-black rounded-full">
                                                            <CheckCircle2 className="w-3 h-3" /> Active
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-100 text-zinc-400 text-[10px] font-black rounded-full">
                                                            <XCircle className="w-3 h-3" /> Ended
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-sm text-zinc-400 text-center py-6">No campaigns created yet</p>
                    )}
                </div>

                {/* Deals table */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                    <h2 className="text-base font-black text-zinc-900 mb-4 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-green-500" /> Deals ({deals.length})
                    </h2>
                    {deals.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-zinc-100 text-[11px] font-black text-zinc-400 uppercase tracking-widest">
                                        <th className="text-left p-2">Title</th>
                                        <th className="text-left p-2">Business</th>
                                        <th className="text-left p-2">Discount</th>
                                        <th className="text-left p-2">Expires</th>
                                        <th className="text-center p-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {deals.map((d: any) => (
                                        <tr key={d.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                                            <td className="p-2 font-bold text-zinc-800">{d.title}</td>
                                            <td className="p-2">
                                                <Link href={`/b/${d.business_slug}`} className="text-blue-600 hover:underline text-xs font-bold flex items-center gap-1">
                                                    {d.business_name} <ExternalLink className="w-3 h-3" />
                                                </Link>
                                            </td>
                                            <td className="p-2 text-xs text-zinc-600 font-bold">{d.discount_text || "—"}</td>
                                            <td className="p-2 text-xs text-zinc-500">
                                                {d.expires_at ? new Date(d.expires_at).toLocaleDateString("en-AU") : "No expiry"}
                                            </td>
                                            <td className="p-2 text-center">
                                                {d.is_active ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-black rounded-full">
                                                        <CheckCircle2 className="w-3 h-3" /> Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-100 text-zinc-400 text-[10px] font-black rounded-full">
                                                        <XCircle className="w-3 h-3" /> Inactive
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-sm text-zinc-400 text-center py-6">No deals created yet</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
    const cm: Record<string, string> = { violet: "bg-violet-50 text-violet-600", green: "bg-green-50 text-green-600", zinc: "bg-zinc-100 text-zinc-500" };
    return (
        <div className={`rounded-2xl border border-zinc-200 p-4 shadow-sm bg-white`}>
            <div className={`text-2xl font-black ${cm[color]?.split(" ")[1] || "text-zinc-900"}`}>{value}</div>
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mt-1">{label}</div>
        </div>
    );
}
