"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Loader2, CheckCircle2, AlertCircle, Inbox, MapPin, Clock3 } from "lucide-react";

type WebsiteQuoteQueueItem = {
    id: string;
    trade_category: string | null;
    consumer_name: string;
    consumer_suburb: string | null;
    consumer_city: string | null;
    consumer_state: string | null;
    job_description: string;
    urgency: string | null;
    claimed_match_count: number;
    target_match_count: number;
    created_at: string | null;
    total_matches?: number;
};

type QueueResponse = {
    items: WebsiteQuoteQueueItem[];
    total: number;
};

export function WebsiteQuotesQueueClient({ initialItems }: { initialItems: WebsiteQuoteQueueItem[] }) {
    const { getToken } = useAuth();
    const [items, setItems] = useState(initialItems);
    const [businessIds, setBusinessIds] = useState<Record<string, string>>({});
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const total = useMemo(() => items.length, [items]);

    const refreshQueue = async () => {
        const token = await getToken();
        const response = await fetch("/api/backend/website-quotes/admin-queue", {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            cache: "no-store",
        });

        if (!response.ok) {
            throw new Error("Failed to refresh the website quotes queue");
        }

        const data: QueueResponse = await response.json();
        setItems(data.items || []);
    };

    const handleAssign = async (requestId: string) => {
        const businessId = businessIds[requestId]?.trim();
        if (!businessId) {
            setMessage({ type: "error", text: "Enter a business ID before assigning this website quote." });
            return;
        }

        setLoadingId(requestId);
        setMessage(null);

        try {
            const token = await getToken();
            const response = await fetch(`/api/backend/website-quotes/${requestId}/assign`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ business_id: businessId }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.detail || "Failed to assign the website quote");
            }

            await refreshQueue();
            setBusinessIds((current) => ({ ...current, [requestId]: "" }));
            setMessage({ type: "success", text: `Website quote ${requestId} assigned successfully.` });
        } catch (error) {
            const text = error instanceof Error ? error.message : "Failed to assign the website quote";
            setMessage({ type: "error", text });
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div>
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-zinc-900">Website Quotes Queue</h1>
                    <p className="text-zinc-500 font-medium mt-1">Requests that need manual admin review because supply was too thin.</p>
                </div>
                <div className="bg-white border border-zinc-200 rounded-2xl px-5 py-4 shadow-sm">
                    <div className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Open queue items</div>
                    <div className="text-3xl font-black text-zinc-900 mt-1">{total}</div>
                </div>
            </div>

            {message && (
                <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm font-bold ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                    {message.text}
                </div>
            )}

            {items.length ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {items.map((item) => (
                        <div key={item.id} className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div>
                                    <div className="text-xs font-black uppercase tracking-[0.2em] text-orange-500 mb-2">Needs admin review</div>
                                    <h2 className="text-2xl font-black text-zinc-900">{item.trade_category || "Website Quote"}</h2>
                                    <p className="text-zinc-500 font-medium mt-1">{item.consumer_name}</p>
                                </div>
                                <div className="px-3 py-2 rounded-2xl bg-orange-50 text-orange-700 text-sm font-black">
                                    {item.claimed_match_count} / {item.target_match_count} claimed
                                </div>
                            </div>

                            <div className="space-y-3 mb-5">
                                <div className="flex items-center gap-2 text-zinc-600 font-medium">
                                    <MapPin className="w-4 h-4 text-orange-500" />
                                    {item.consumer_suburb || item.consumer_city || item.consumer_state || "Location not set"}
                                </div>
                                <div className="flex items-center gap-2 text-zinc-600 font-medium">
                                    <Clock3 className="w-4 h-4 text-orange-500" />
                                    {item.urgency || "warm"}
                                </div>
                            </div>

                            <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100 mb-5">
                                <div className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Job summary</div>
                                <p className="text-zinc-700 font-medium leading-relaxed">{item.job_description}</p>
                            </div>

                            <div className="mb-3">
                                <label className="block text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Assign business ID</label>
                                <input
                                    value={businessIds[item.id] || ""}
                                    onChange={(e) => setBusinessIds((current) => ({ ...current, [item.id]: e.target.value }))}
                                    placeholder="Paste business UUID"
                                    className="w-full rounded-2xl border border-zinc-200 px-4 py-3 font-medium text-zinc-800 outline-none focus:border-orange-400"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => handleAssign(item.id)}
                                disabled={loadingId === item.id}
                                className="w-full rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-black py-3 px-4 transition-colors inline-flex items-center justify-center gap-2"
                            >
                                {loadingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                Assign quote
                            </button>

                            <div className="mt-4 flex items-start gap-2 text-xs text-zinc-500 font-medium">
                                <AlertCircle className="w-4 h-4 mt-0.5 text-zinc-400 shrink-0" />
                                Use a claimed business ID to move this request closer to a full free website quote allocation.
                            </div>

                            <div className="mt-5 pt-4 border-t border-zinc-100">
                                <div className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Request ID</div>
                                <div className="text-sm font-bold text-zinc-600 mt-1 break-all">{item.id}</div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white border border-zinc-200 rounded-3xl p-12 shadow-sm flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-zinc-50 flex items-center justify-center mb-4">
                        <Inbox className="w-8 h-8 text-zinc-300" />
                    </div>
                    <h2 className="text-2xl font-black text-zinc-900">No queued website quotes</h2>
                    <p className="text-zinc-500 font-medium mt-2 max-w-xl">When website quote requests can’t be matched to enough claimed businesses, they’ll appear here for admin follow-up and manual allocation.</p>
                </div>
            )}
        </div>
    );
}
