export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { Users, Building2, UserCheck, Search, ChevronLeft, ChevronRight, Star, MapPin, DollarSign, Calendar, ShieldCheck, Download } from "lucide-react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getUsers(token: string, params: { tab?: string; page?: number; search?: string }) {
    const sp = new URLSearchParams();
    sp.set("tab", params.tab || "businesses");
    if (params.page) sp.set("page", String(params.page));
    if (params.search) sp.set("search", params.search);

    const res = await fetch(`${API}/admin/users?${sp.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
    });
    if (!res.ok) return { users: [], total: 0, page: 1, pages: 1 };
    return res.json();
}

export default async function UsersPage({
    searchParams,
}: {
    searchParams: Promise<{ tab?: string; page?: string; search?: string }>;
}) {
    const { getToken } = await auth();
    const token = await getToken();
    const sp = await searchParams;
    const tab = sp.tab || "businesses";
    const page = parseInt(sp.page || "1");

    const data = token ? await getUsers(token, { tab, page, search: sp.search }) : { users: [], total: 0, page: 1, pages: 1 };

    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-black text-zinc-900 flex items-center gap-2">
                        <Users className="w-6 h-6 text-violet-600" /> User Management
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">Manage business and referrer accounts</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    {[
                        { key: "businesses", label: "Businesses", icon: Building2 },
                        { key: "referrers", label: "Referrers", icon: UserCheck },
                    ].map((t) => (
                        <Link
                            key={t.key}
                            href={`/admin/users?tab=${t.key}`}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                                tab === t.key
                                    ? "bg-zinc-900 text-white"
                                    : "bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-300"
                            }`}
                        >
                            <t.icon className="w-4 h-4" /> {t.label}
                        </Link>
                    ))}
                </div>

                {/* Export button for referrers */}
                {tab === "referrers" && (
                    <div className="flex justify-end mb-3">
                        <a
                            href={`${API}/admin/referrers/tax-export`}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-zinc-800 transition-colors"
                        >
                            <Download className="w-4 h-4" /> Export Tax CSV
                        </a>
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
                                placeholder={tab === "businesses" ? "Search by name, email, suburb..." : "Search by name, email..."}
                                className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                            />
                        </div>
                        <input type="hidden" name="tab" value={tab} />
                        <button type="submit" className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-colors">
                            Search
                        </button>
                    </form>
                </div>

                {/* User table */}
                <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
                    {data.users.length === 0 ? (
                        <div className="text-center py-12 text-zinc-400">
                            <Users className="w-8 h-8 mx-auto mb-2" />
                            <p className="font-semibold">No {tab} found</p>
                        </div>
                    ) : tab === "businesses" ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-zinc-100 text-[11px] font-black text-zinc-400 uppercase tracking-widest">
                                        <th className="text-left p-3 pl-4">Business</th>
                                        <th className="text-left p-3">Owner</th>
                                        <th className="text-left p-3">Location</th>
                                        <th className="text-left p-3">Rating</th>
                                        <th className="text-left p-3">Joined</th>
                                        <th className="text-left p-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.users.map((u: any) => (
                                        <tr key={u.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                                            <td className="p-3 pl-4 font-bold text-zinc-900">{u.business_name}</td>
                                            <td className="p-3 text-zinc-600">{u.owner_name || u.business_email || "—"}</td>
                                            <td className="p-3 text-zinc-500 text-xs">
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {u.suburb ? `${u.suburb}, ${u.state}` : u.state || "—"}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                {u.avg_rating ? (
                                                    <span className="flex items-center gap-1 text-xs">
                                                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                                        <span className="font-bold">{Number(u.avg_rating).toFixed(1)}</span>
                                                    </span>
                                                ) : "—"}
                                            </td>
                                            <td className="p-3 text-xs text-zinc-400">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {u.created_at ? new Date(u.created_at).toLocaleDateString("en-AU") : "—"}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-full ${
                                                    u.clerk_user_id ? "bg-green-50 text-green-600" : "bg-zinc-100 text-zinc-500"
                                                }`}>
                                                    {u.clerk_user_id ? "Claimed" : "Unclaimed"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-zinc-100 text-[11px] font-black text-zinc-400 uppercase tracking-widest">
                                        <th className="text-left p-3 pl-4">Name</th>
                                        <th className="text-left p-3">Email</th>
                                        <th className="text-left p-3">Location</th>
                                        <th className="text-left p-3">Balance</th>
                                        <th className="text-left p-3">Tax</th>
                                        <th className="text-left p-3">Joined</th>
                                        <th className="text-left p-3">Verified</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.users.map((u: any) => (
                                        <tr key={u.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                                            <td className="p-3 pl-4 font-bold text-zinc-900">{u.full_name || "—"}</td>
                                            <td className="p-3 text-zinc-600 text-xs">{u.email || "—"}</td>
                                            <td className="p-3 text-zinc-500 text-xs">
                                                {u.suburb ? `${u.suburb}, ${u.state}` : "—"}
                                            </td>
                                            <td className="p-3">
                                                <span className="flex items-center gap-1 text-xs font-bold text-green-600">
                                                    <DollarSign className="w-3 h-3" />
                                                    {u.wallet_balance_cents ? (u.wallet_balance_cents / 100).toFixed(2) : "0.00"}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                {u.abn ? (
                                                    <span className="flex items-center gap-1 text-[10px] font-black text-blue-600">
                                                        <ShieldCheck className="w-3 h-3" /> ABN
                                                    </span>
                                                ) : u.supplier_statement_declared_at ? (
                                                    <span className="flex items-center gap-1 text-[10px] font-black text-green-600">
                                                        <ShieldCheck className="w-3 h-3" /> Dec
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-zinc-300">—</span>
                                                )}
                                            </td>
                                            <td className="p-3 text-xs text-zinc-400">
                                                {u.created_at ? new Date(u.created_at).toLocaleDateString("en-AU") : "—"}
                                            </td>
                                            <td className="p-3">
                                                <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-full ${
                                                    u.phone_verified ? "bg-green-50 text-green-600" : "bg-zinc-100 text-zinc-500"
                                                }`}>
                                                    {u.phone_verified ? "Yes" : "No"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {data.pages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-100">
                            <p className="text-xs text-zinc-400">Page {data.page} of {data.pages} · {data.total?.toLocaleString()} total</p>
                            <div className="flex gap-1">
                                {data.page > 1 && (
                                    <Link href={`/admin/users?tab=${tab}&page=${data.page - 1}${sp.search ? `&search=${sp.search}` : ""}`}
                                        className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs font-bold text-zinc-600 hover:bg-zinc-50 flex items-center gap-1">
                                        <ChevronLeft className="w-3 h-3" /> Prev
                                    </Link>
                                )}
                                {data.page < data.pages && (
                                    <Link href={`/admin/users?tab=${tab}&page=${data.page + 1}${sp.search ? `&search=${sp.search}` : ""}`}
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
