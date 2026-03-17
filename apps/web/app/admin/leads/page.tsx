export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { Target, ShieldAlert, Search, ChevronLeft, ChevronRight, Clock, CheckCircle2, XCircle, AlertTriangle, Calendar, Building2, User } from "lucide-react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getLeads(token: string, params: { tab?: string; page?: number; search?: string; status?: string }) {
    const sp = new URLSearchParams();
    sp.set("tab", params.tab || "leads");
    if (params.page) sp.set("page", String(params.page));
    if (params.search) sp.set("search", params.search);
    if (params.status) sp.set("status", params.status);

    const res = await fetch(`${API}/admin/leads?${sp.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
    });
    if (!res.ok) return { items: [], total: 0, page: 1, pages: 1, stats: {} };
    return res.json();
}

const statusColors: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-600",
    UNLOCKED: "bg-blue-50 text-blue-600",
    CONFIRMED: "bg-green-50 text-green-600",
    EXPIRED: "bg-zinc-100 text-zinc-500",
    DISPUTED: "bg-red-50 text-red-600",
    SCREENING: "bg-violet-50 text-violet-600",
};

export default async function LeadsPage({
    searchParams,
}: {
    searchParams: Promise<{ tab?: string; page?: string; search?: string; status?: string }>;
}) {
    const { getToken } = await auth();
    const token = await getToken();
    const sp = await searchParams;
    const tab = sp.tab || "leads";
    const page = parseInt(sp.page || "1");

    const data = token ? await getLeads(token, { tab, page, search: sp.search, status: sp.status }) : { items: [], total: 0, page: 1, pages: 1, stats: {} };

    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-black text-zinc-900 flex items-center gap-2">
                        <Target className="w-6 h-6 text-red-600" /> Leads & Disputes
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">Review leads, manage disputes, track conversions</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    {[
                        { key: "leads", label: "All Leads", icon: Target },
                        { key: "disputes", label: "Disputes", icon: ShieldAlert },
                    ].map((t) => (
                        <Link
                            key={t.key}
                            href={`/admin/leads?tab=${t.key}`}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                                tab === t.key ? "bg-zinc-900 text-white" : "bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-300"
                            }`}
                        >
                            <t.icon className="w-4 h-4" /> {t.label}
                        </Link>
                    ))}
                </div>

                {/* Status stats */}
                {data.stats && Object.keys(data.stats).length > 0 && (
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
                        {Object.entries(data.stats).map(([status, count]) => (
                            <Link
                                key={status}
                                href={`/admin/leads?tab=${tab}&status=${status}`}
                                className={`rounded-xl border p-3 text-center ${sp.status === status ? "border-orange-400 ring-2 ring-orange-200" : "border-zinc-200"} bg-white`}
                            >
                                <div className="text-xl font-black text-zinc-900">{String(count)}</div>
                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{status}</div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Search */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-4 mb-6 shadow-sm">
                    <form className="flex gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                                type="text"
                                name="search"
                                defaultValue={sp.search || ""}
                                placeholder="Search by customer name, business, referrer..."
                                className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                            />
                        </div>
                        <input type="hidden" name="tab" value={tab} />
                        {sp.status && <input type="hidden" name="status" value={sp.status} />}
                        <button type="submit" className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-colors">
                            Search
                        </button>
                    </form>
                </div>

                {/* Leads table */}
                <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
                    {data.items.length === 0 ? (
                        <div className="text-center py-12 text-zinc-400">
                            <Target className="w-8 h-8 mx-auto mb-2" />
                            <p className="font-semibold">No {tab} found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-zinc-100 text-[11px] font-black text-zinc-400 uppercase tracking-widest">
                                        <th className="text-left p-3 pl-4">Customer</th>
                                        <th className="text-left p-3">Business</th>
                                        <th className="text-left p-3">Referrer</th>
                                        <th className="text-left p-3">Status</th>
                                        <th className="text-left p-3">Value</th>
                                        <th className="text-left p-3">Created</th>
                                        {tab === "disputes" && <th className="text-left p-3">Reason</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.items.map((item: any) => (
                                        <tr key={item.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                                            <td className="p-3 pl-4">
                                                <span className="flex items-center gap-1.5">
                                                    <User className="w-3 h-3 text-zinc-400" />
                                                    <span className="font-bold text-zinc-900">{item.customer_name || "—"}</span>
                                                </span>
                                                {item.customer_phone && (
                                                    <span className="text-xs text-zinc-400 ml-4.5">{item.customer_phone}</span>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                <span className="flex items-center gap-1.5 text-zinc-700">
                                                    <Building2 className="w-3 h-3 text-zinc-400" />
                                                    {item.business_name || "—"}
                                                </span>
                                            </td>
                                            <td className="p-3 text-zinc-500 text-xs">{item.referrer_name || "Direct"}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-full ${statusColors[item.status] || "bg-zinc-100 text-zinc-500"}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="p-3 text-xs font-bold text-zinc-700">
                                                {item.lead_price_cents ? `$${(item.lead_price_cents / 100).toFixed(0)}` : "—"}
                                            </td>
                                            <td className="p-3 text-xs text-zinc-400">
                                                {item.created_at ? new Date(item.created_at).toLocaleDateString("en-AU") : "—"}
                                            </td>
                                            {tab === "disputes" && (
                                                <td className="p-3 text-xs text-red-600 font-medium">{item.reason || "—"}</td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {data.pages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-100">
                            <p className="text-xs text-zinc-400">Page {data.page} of {data.pages} · {data.total?.toLocaleString()} total</p>
                            <div className="flex gap-1">
                                {data.page > 1 && (
                                    <Link href={`/admin/leads?tab=${tab}&page=${data.page - 1}${sp.search ? `&search=${sp.search}` : ""}${sp.status ? `&status=${sp.status}` : ""}`}
                                        className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs font-bold text-zinc-600 hover:bg-zinc-50 flex items-center gap-1">
                                        <ChevronLeft className="w-3 h-3" /> Prev
                                    </Link>
                                )}
                                {data.page < data.pages && (
                                    <Link href={`/admin/leads?tab=${tab}&page=${data.page + 1}${sp.search ? `&search=${sp.search}` : ""}${sp.status ? `&status=${sp.status}` : ""}`}
                                        className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs font-bold text-zinc-600 hover:bg-zinc-50 flex items-center gap-1">
                                        Next <ChevronRight className="w-3 h-3" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
