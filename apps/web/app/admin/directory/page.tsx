export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { Building2, Search, Plus, ChevronLeft, ChevronRight, Filter, MoreHorizontal, ExternalLink, MapPin, Star, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { BusinessLogo } from "@/components/BusinessLogo";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getBusinesses(token: string, params: { page?: number; search?: string; state?: string; trade?: string }) {
    const sp = new URLSearchParams();
    if (params.page) sp.set("page", String(params.page));
    if (params.search) sp.set("search", params.search);
    if (params.state) sp.set("state", params.state);
    if (params.trade) sp.set("trade", params.trade);

    const res = await fetch(`${API}/admin/businesses?${sp.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
    });
    if (!res.ok) return { businesses: [], total: 0, page: 1, pages: 1 };
    return res.json();
}

export default async function DirectoryPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; search?: string; state?: string; trade?: string }>;
}) {
    const { getToken } = await auth();
    const token = await getToken();
    const sp = await searchParams;
    const page = parseInt(sp.page || "1");

    const data = token ? await getBusinesses(token, { page, search: sp.search, state: sp.state, trade: sp.trade }) : { businesses: [], total: 0, page: 1, pages: 1 };

    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-zinc-900 flex items-center gap-2">
                            <Building2 className="w-6 h-6 text-blue-600" /> Business Directory
                        </h1>
                        <p className="text-zinc-500 text-sm mt-1">
                            {data.total?.toLocaleString() ?? 0} businesses total
                        </p>
                    </div>
                    <Link
                        href="/admin/directory/add"
                        className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-sm transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Add Business
                    </Link>
                </div>

                {/* Search & Filters */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-4 mb-6 shadow-sm">
                    <form className="flex flex-wrap gap-3">
                        <div className="flex-1 min-w-[200px] relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                                type="text"
                                name="search"
                                defaultValue={sp.search || ""}
                                placeholder="Search businesses..."
                                className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                            />
                        </div>
                        <select
                            name="state"
                            defaultValue={sp.state || ""}
                            className="px-4 py-2.5 border border-zinc-200 rounded-xl text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                        >
                            <option value="">All States</option>
                            {["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"].map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        <select
                            name="trade"
                            defaultValue={sp.trade || ""}
                            className="px-4 py-2.5 border border-zinc-200 rounded-xl text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                        >
                            <option value="">All Trades</option>
                            {["Plumber", "Electrician", "Builder", "Painter", "Roofer", "Landscaper", "Carpenter", "Tiler", "Concreter", "Fencer", "Cleaner", "HVAC"].map((t) => (
                                <option key={t} value={t.toLowerCase()}>{t}</option>
                            ))}
                        </select>
                        <button type="submit" className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-colors flex items-center gap-2">
                            <Filter className="w-4 h-4" /> Filter
                        </button>
                    </form>
                </div>

                {/* Business table */}
                <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
                    {data.businesses.length === 0 ? (
                        <div className="text-center py-12 text-zinc-400">
                            <Building2 className="w-8 h-8 mx-auto mb-2" />
                            <p className="font-semibold">No businesses found</p>
                            <p className="text-xs mt-1">Try adjusting your filters</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-zinc-100 text-[11px] font-black text-zinc-400 uppercase tracking-widest">
                                        <th className="text-left p-3 pl-4">Business</th>
                                        <th className="text-left p-3">Trade</th>
                                        <th className="text-left p-3">Location</th>
                                        <th className="text-left p-3">Rating</th>
                                        <th className="text-left p-3">Photos</th>
                                        <th className="text-left p-3">Status</th>
                                        <th className="text-left p-3">Claimed</th>
                                        <th className="text-right p-3 pr-4"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.businesses.map((biz: any) => {
                                        const photoCount = biz.photo_urls
                                            ? (Array.isArray(biz.photo_urls)
                                                ? biz.photo_urls.filter(Boolean).length
                                                : String(biz.photo_urls).replace(/[{}]/g, "").split(",").filter((u: string) => u.length > 5).length)
                                            : 0;
                                        return (
                                            <tr key={biz.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                                                <td className="p-3 pl-4">
                                                    <div className="flex items-center gap-3">
                                                        <BusinessLogo logoUrl={biz.logo_url} name={biz.business_name} size="xs" />
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-zinc-900 truncate max-w-[200px]">{biz.business_name}</p>
                                                            <p className="text-xs text-zinc-400 truncate max-w-[200px]">{biz.slug}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <span className="px-2 py-1 bg-zinc-100 text-zinc-600 text-xs font-bold rounded-lg">
                                                        {biz.trade_category || "—"}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-1 text-zinc-600 text-xs">
                                                        <MapPin className="w-3 h-3" />
                                                        {biz.suburb ? `${biz.suburb}, ${biz.state}` : biz.state || "—"}
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    {biz.avg_rating ? (
                                                        <div className="flex items-center gap-1">
                                                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                                            <span className="font-bold text-zinc-700 text-xs">{Number(biz.avg_rating).toFixed(1)}</span>
                                                            <span className="text-zinc-400 text-[10px]">({biz.review_count || 0})</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-zinc-300 text-xs">—</span>
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    <span className={`text-xs font-bold ${photoCount > 0 ? "text-green-600" : "text-zinc-300"}`}>
                                                        {photoCount > 0 ? (
                                                            <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3" /> {photoCount}</span>
                                                        ) : "0"}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-full ${
                                                        biz.status === "active" ? "bg-green-50 text-green-600" :
                                                        biz.status === "suspended" ? "bg-red-50 text-red-600" :
                                                        "bg-zinc-100 text-zinc-500"
                                                    }`}>
                                                        {biz.status}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <span className={`text-xs font-bold ${biz.clerk_user_id ? "text-green-600" : "text-zinc-300"}`}>
                                                        {biz.clerk_user_id ? "Yes" : "No"}
                                                    </span>
                                                </td>
                                                <td className="p-3 pr-4 text-right">
                                                    <div className="flex items-center gap-1 justify-end">
                                                        <Link
                                                            href={`/admin/directory/${biz.id}`}
                                                            className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400 hover:text-zinc-700"
                                                            title="Edit"
                                                        >
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Link>
                                                        {biz.slug && (
                                                            <Link
                                                                href={`/b/${biz.slug}`}
                                                                target="_blank"
                                                                className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400 hover:text-zinc-700"
                                                                title="View profile"
                                                            >
                                                                <ExternalLink className="w-4 h-4" />
                                                            </Link>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {data.pages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-100">
                            <p className="text-xs text-zinc-400">
                                Page {data.page} of {data.pages} · {data.total?.toLocaleString()} total
                            </p>
                            <div className="flex gap-1">
                                {data.page > 1 && (
                                    <Link
                                        href={`/admin/directory?page=${data.page - 1}${sp.search ? `&search=${sp.search}` : ""}${sp.state ? `&state=${sp.state}` : ""}${sp.trade ? `&trade=${sp.trade}` : ""}`}
                                        className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs font-bold text-zinc-600 hover:bg-zinc-50 flex items-center gap-1"
                                    >
                                        <ChevronLeft className="w-3 h-3" /> Prev
                                    </Link>
                                )}
                                {data.page < data.pages && (
                                    <Link
                                        href={`/admin/directory?page=${data.page + 1}${sp.search ? `&search=${sp.search}` : ""}${sp.state ? `&state=${sp.state}` : ""}${sp.trade ? `&trade=${sp.trade}` : ""}`}
                                        className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs font-bold text-zinc-600 hover:bg-zinc-50 flex items-center gap-1"
                                    >
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
