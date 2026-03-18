"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Tag, Edit3, Loader2, CheckCircle2, X } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Category {
    trade_category: string;
    count: number;
}

export function TradeCategories({ initialCategories }: { initialCategories: Category[] }) {
    const { getToken } = useAuth();
    const router = useRouter();
    const [editing, setEditing] = useState<string | null>(null);
    const [newName, setNewName] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function handleRename(oldName: string) {
        if (!newName.trim() || newName === oldName) {
            setEditing(null);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const token = await getToken();
            const res = await fetch(`${API}/admin/trade-categories/rename`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ old_name: oldName, new_name: newName.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Rename failed");
            setSuccess(`Renamed "${oldName}" → "${newName.trim()}" (${data.affected} businesses)`);
            setEditing(null);
            setTimeout(() => { setSuccess(null); router.refresh(); }, 2000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm md:col-span-2">
            <h3 className="font-bold text-zinc-900 mb-4 flex items-center gap-2">
                <Tag className="w-4 h-4 text-orange-500" /> Trade Categories ({initialCategories.length})
            </h3>

            {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-3 text-xs text-green-700 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {success}
                </div>
            )}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-3 text-xs text-red-700 font-bold">{error}</div>
            )}

            <div className="max-h-[400px] overflow-y-auto space-y-1">
                {initialCategories.map((cat) => (
                    <div key={cat.trade_category} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-zinc-50 group">
                        {editing === cat.trade_category ? (
                            <div className="flex items-center gap-2 flex-1">
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleRename(cat.trade_category)}
                                    className="flex-1 px-2 py-1 border border-orange-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                    autoFocus
                                />
                                <button
                                    onClick={() => handleRename(cat.trade_category)}
                                    disabled={loading}
                                    className="px-2 py-1 bg-orange-600 text-white rounded-lg text-xs font-bold"
                                >
                                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                                </button>
                                <button onClick={() => setEditing(null)} className="p-1 text-zinc-400 hover:text-zinc-600">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-zinc-800">{cat.trade_category}</span>
                                    <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">{cat.count}</span>
                                </div>
                                <button
                                    onClick={() => { setEditing(cat.trade_category); setNewName(cat.trade_category); }}
                                    className="p-1 text-zinc-300 hover:text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Rename"
                                >
                                    <Edit3 className="w-3.5 h-3.5" />
                                </button>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
