"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { MessageSquare, Send, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

interface PrivateFeedbackProps {
    businessSlug: string;
    businessName: string;
}

const CATEGORIES = [
    { value: "general", label: "General" },
    { value: "response_time", label: "Response Time" },
    { value: "quality", label: "Work Quality" },
    { value: "communication", label: "Communication" },
];

export function PrivateFeedback({ businessSlug, businessName }: PrivateFeedbackProps) {
    const { getToken, isSignedIn } = useAuth();
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [category, setCategory] = useState("general");
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    const handleSubmit = async () => {
        if (!message.trim()) { toast.error("Enter feedback"); return; }
        setSending(true);
        try {
            const token = await getToken();
            const res = await fetch(`${apiUrl}/referrer/feedback`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ business_slug: businessSlug, message, category }),
            });
            if (res.ok) {
                setSent(true);
                setMessage("");
                toast.success("Feedback sent privately to the business");
            } else {
                toast.error("Failed to send feedback");
            }
        } catch {
            toast.error("Error sending feedback");
        } finally {
            setSending(false);
        }
    };

    if (!isSignedIn) return null;

    if (sent) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
                <Check className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-green-800">Feedback sent to {businessName}</p>
                <button onClick={() => { setSent(false); setOpen(false); }} className="text-xs text-green-600 mt-1 underline">
                    Send another
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 w-full text-left"
            >
                <MessageSquare className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-bold text-zinc-700">Private Feedback</span>
            </button>

            {open && (
                <div className="mt-4 space-y-3">
                    <p className="text-xs text-zinc-400">Only the business owner will see this. Help them improve.</p>
                    <div className="flex flex-wrap gap-1.5">
                        {CATEGORIES.map(c => (
                            <button
                                key={c.value}
                                onClick={() => setCategory(c.value)}
                                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
                                    category === c.value
                                        ? "bg-zinc-900 text-white"
                                        : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                                }`}
                            >
                                {c.label}
                            </button>
                        ))}
                    </div>
                    <textarea
                        rows={3}
                        className="w-full bg-zinc-50 border-none rounded-xl px-3 py-2.5 text-sm text-zinc-900 font-medium focus:ring-2 focus:ring-zinc-200 resize-none placeholder-zinc-300"
                        placeholder="e.g. Response times have been slow lately..."
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={sending || !message.trim()}
                        className="w-full bg-zinc-900 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        Send Privately
                    </button>
                </div>
            )}
        </div>
    );
}
