"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, MessageSquare } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Props {
    leadId: string;
    customerName: string;
    businessName: string;
    status: string;
}

export function DisputeResolver({ leadId, customerName, businessName, status }: Props) {
    const { getToken } = useAuth();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [outcome, setOutcome] = useState<"confirm" | "reject">("confirm");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    if (status !== "DISPUTED" && status !== "SCREENING") return null;

    async function handleResolve() {
        setLoading(true);
        setError(null);
        try {
            const token = await getToken();
            const res = await fetch(`${API}/admin/leads/${leadId}/resolve`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ outcome, admin_notes: notes || undefined }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Resolution failed");
            }
            setDone(true);
            setTimeout(() => router.refresh(), 1000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    if (done) {
        return (
            <div className="flex items-center gap-2 text-xs font-bold text-green-600">
                <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
            </div>
        );
    }

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold transition-colors"
            >
                <MessageSquare className="w-3 h-3" /> Resolve
            </button>
        );
    }

    return (
        <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-3 mt-2 space-y-2">
            <p className="text-xs font-bold text-zinc-700">
                Resolve: <span className="text-zinc-500">{customerName}</span> → <span className="text-zinc-500">{businessName}</span>
            </p>
            <div className="flex gap-2">
                <button
                    onClick={() => setOutcome("confirm")}
                    className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        outcome === "confirm" ? "bg-green-600 text-white" : "bg-white border border-zinc-200 text-zinc-600"
                    }`}
                >
                    <CheckCircle2 className="w-3 h-3" /> Confirm Lead
                </button>
                <button
                    onClick={() => setOutcome("reject")}
                    className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        outcome === "reject" ? "bg-red-600 text-white" : "bg-white border border-zinc-200 text-zinc-600"
                    }`}
                >
                    <XCircle className="w-3 h-3" /> Reject Lead
                </button>
            </div>
            <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Admin notes (optional)..."
                rows={2}
                className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
            {error && <p className="text-xs text-red-600 font-bold">{error}</p>}
            <div className="flex gap-2">
                <button
                    onClick={handleResolve}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 disabled:bg-zinc-300 text-white rounded-lg text-xs font-bold transition-colors"
                >
                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    {loading ? "Resolving..." : `${outcome === "confirm" ? "Confirm" : "Reject"} & Close`}
                </button>
                <button
                    onClick={() => setOpen(false)}
                    className="px-3 py-1.5 bg-white border border-zinc-200 text-zinc-600 rounded-lg text-xs font-bold hover:bg-zinc-50 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
