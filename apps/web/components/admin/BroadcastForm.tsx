"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Send, Loader2, CheckCircle2, Users, Building2, Globe } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function BroadcastForm() {
    const { getToken } = useAuth();
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [audience, setAudience] = useState("all");
    const [link, setLink] = useState("");
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState<{ recipient_count: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function handleSend() {
        if (!title || !message) {
            setError("Title and message are required.");
            return;
        }
        setSending(true);
        setError(null);
        setSent(null);
        try {
            const token = await getToken();
            const res = await fetch(`${API}/admin/notifications/broadcast`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ title, message, audience, link: link || undefined }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Send failed");
            setSent(data);
            setTitle("");
            setMessage("");
            setLink("");
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSending(false);
        }
    }

    const audiences = [
        { key: "all", label: "Everyone", icon: Globe, color: "text-violet-600", bg: "bg-violet-50" },
        { key: "businesses", label: "Businesses", icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
        { key: "referrers", label: "Referrers", icon: Users, color: "text-green-600", bg: "bg-green-50" },
    ];

    return (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
            <h3 className="font-bold text-zinc-900 mb-4 flex items-center gap-2">
                <Send className="w-4 h-4 text-violet-500" /> Compose Broadcast
            </h3>

            {sent && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 flex items-center gap-2 text-sm text-green-700 font-bold">
                    <CheckCircle2 className="w-4 h-4" /> Sent to {sent.recipient_count} recipients!
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm text-red-700 font-bold">{error}</div>
            )}

            <div className="space-y-4">
                {/* Audience */}
                <div>
                    <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Audience</label>
                    <div className="flex gap-2">
                        {audiences.map((a) => (
                            <button
                                key={a.key}
                                onClick={() => setAudience(a.key)}
                                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                                    audience === a.key
                                        ? "bg-zinc-900 text-white"
                                        : "bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-300"
                                }`}
                            >
                                <a.icon className="w-3.5 h-3.5" /> {a.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Title */}
                <div>
                    <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Notification title..."
                        className="w-full mt-1 px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                    />
                </div>

                {/* Message */}
                <div>
                    <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Message</label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Write your message..."
                        rows={4}
                        className="w-full mt-1 px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 resize-none"
                    />
                </div>

                {/* Link */}
                <div>
                    <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Link (optional)</label>
                    <input
                        type="url"
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        placeholder="https://traderefer.au/..."
                        className="w-full mt-1 px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                    />
                </div>

                <button
                    onClick={handleSend}
                    disabled={sending || !title || !message}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-300 text-white rounded-xl font-bold text-sm transition-colors"
                >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {sending ? "Sending..." : "Send Broadcast"}
                </button>
            </div>
        </div>
    );
}
