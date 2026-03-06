import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ListTodo, CheckCircle2, Clock, MapPin, Wrench, ArrowLeft } from "lucide-react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getFillQueue(token: string, status = "pending") {
    const [rows, stats] = await Promise.all([
        fetch(`${API}/admin/fill-queue?status=${status}`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
        }).then(r => r.ok ? r.json() : []),
        fetch(`${API}/admin/fill-queue/stats`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
        }).then(r => r.ok ? r.json() : { pending: 0, filled: 0, total: 0 }),
    ]);
    return { rows, stats };
}

export default async function FillQueuePage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string }>;
}) {
    const { userId, getToken } = await auth();
    if (!userId) redirect("/login");
    const token = await getToken();
    if (!token) redirect("/login");

    const sp = await searchParams;
    const statusFilter = sp.status || "pending";

    let data: { rows: any[]; stats: any };
    try {
        data = await getFillQueue(token, statusFilter);
    } catch {
        redirect("/dashboard");
    }

    if (!data) redirect("/dashboard");
    const { rows, stats } = data;

    const byState: Record<string, number> = {};
    const byTrade: Record<string, number> = {};
    for (const r of rows) {
        byState[r.state?.toUpperCase() || "?"] = (byState[r.state?.toUpperCase() || "?"] || 0) + 1;
        const trade = r.trade?.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) || "?";
        byTrade[trade] = (byTrade[trade] || 0) + 1;
    }
    const topStates = Object.entries(byState).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const topTrades = Object.entries(byTrade).sort((a, b) => b[1] - a[1]).slice(0, 6);

    return (
        <div className="min-h-screen bg-zinc-50 pt-16">
            <div className="container mx-auto px-4 py-8 max-w-5xl">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/admin" className="text-zinc-400 hover:text-zinc-600">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-zinc-900 flex items-center gap-2">
                            <ListTodo className="w-6 h-6 text-orange-500" /> Fill Queue
                        </h1>
                        <p className="text-zinc-500 text-sm">Pages Google found with no businesses — awaiting fill.</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                        { label: "Pending", value: stats.pending, color: "text-orange-600", bg: "bg-orange-50" },
                        { label: "Filled", value: stats.filled, color: "text-green-600", bg: "bg-green-50" },
                        { label: "Total seen", value: stats.total, color: "text-zinc-900", bg: "bg-white" },
                    ].map(s => (
                        <div key={s.label} className={`${s.bg} rounded-2xl border border-zinc-200 p-4`}>
                            <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">{s.label}</div>
                            <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
                        </div>
                    ))}
                </div>

                {/* Breakdowns */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white rounded-2xl border border-zinc-200 p-4">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> Top States
                        </h3>
                        <div className="space-y-1.5">
                            {topStates.map(([st, cnt]) => (
                                <div key={st} className="flex justify-between text-sm">
                                    <span className="font-semibold text-zinc-700">{st}</span>
                                    <span className="font-black text-zinc-900">{cnt}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-zinc-200 p-4">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                            <Wrench className="w-3 h-3" /> Top Trades
                        </h3>
                        <div className="space-y-1.5">
                            {topTrades.map(([tr, cnt]) => (
                                <div key={tr} className="flex justify-between text-sm">
                                    <span className="font-semibold text-zinc-700 truncate max-w-[140px]">{tr}</span>
                                    <span className="font-black text-zinc-900">{cnt}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Filter tabs */}
                <div className="flex gap-2 mb-4">
                    {["pending", "filled", "all"].map(s => (
                        <Link
                            key={s}
                            href={`/admin/fill-queue?status=${s}`}
                            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${statusFilter === s
                                ? "bg-orange-500 text-white"
                                : "bg-white border border-zinc-200 text-zinc-600 hover:border-orange-300"
                            }`}
                        >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                        </Link>
                    ))}
                    <div className="ml-auto text-sm text-zinc-400 self-center">{rows.length} entries</div>
                </div>

                {/* Run script note */}
                {statusFilter === "pending" && rows.length > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4 text-sm text-orange-700 font-medium">
                        Run <code className="bg-orange-100 px-1 rounded">node scripts/fill_from_queue.js --dry-run</code> to preview,
                        then <code className="bg-orange-100 px-1 rounded">node scripts/fill_from_queue.js</code> to fill all.
                    </div>
                )}

                {/* Table */}
                <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                    {rows.length === 0 ? (
                        <div className="text-center py-12 text-zinc-400">
                            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-400" />
                            <p className="font-semibold">No {statusFilter} entries</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-zinc-100 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                    <th className="text-left p-3">State</th>
                                    <th className="text-left p-3">Suburb</th>
                                    <th className="text-left p-3">Trade</th>
                                    <th className="text-left p-3">Seen</th>
                                    <th className="text-left p-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row: any) => (
                                    <tr key={row.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                                        <td className="p-3 font-bold text-zinc-500">{row.state?.toUpperCase()}</td>
                                        <td className="p-3 font-semibold text-zinc-800">
                                            {row.suburb?.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                                        </td>
                                        <td className="p-3 text-zinc-600">
                                            {row.trade?.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                                        </td>
                                        <td className="p-3 text-zinc-400 text-xs">
                                            {row.first_seen_at ? new Date(row.first_seen_at).toLocaleDateString("en-AU") : "—"}
                                        </td>
                                        <td className="p-3">
                                            {row.filled_at ? (
                                                <span className="flex items-center gap-1 text-green-600 font-semibold text-xs">
                                                    <CheckCircle2 className="w-3 h-3" /> Filled
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-orange-500 font-semibold text-xs">
                                                    <Clock className="w-3 h-3" /> Pending
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
