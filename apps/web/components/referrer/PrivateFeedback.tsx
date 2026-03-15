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

    const apiUrl = "/api/backend";

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
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center shadow-sm">
                <Check className="w-8 h-8 text-green-500 mx-auto mb-3" />
                <p className="text-lg font-black text-green-800">Feedback sent to {businessName}</p>
                <button onClick={() => { setSent(false); setOpen(false); }} className="text-sm font-bold text-green-600 mt-2 underline underline-offset-4 hover:text-green-700 transition-colors">
                    Send another
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border-2 border-zinc-200 p-6 shadow-sm">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-3 w-full text-left group"
            >
                <MessageSquare className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
                <span className="text-lg font-black text-zinc-700 group-hover:text-zinc-900 transition-colors">Private Feedback</span>
            </button>

            {open && (
                <div className="mt-5 space-y-4">
                    <p className="text-sm font-bold text-zinc-400">Only the business owner will see this. Help them improve.</p>
                    <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map(c => (
                            <button
                                key={c.value}
                                onClick={() => setCategory(c.value)}
                                className={`text-sm font-black px-4 py-2 rounded-full transition-all ${
                                    category === c.value
                                        ? "bg-orange-600 text-white shadow-md shadow-orange-200"
                                        : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700"
                                }`}
                            >
                                {c.label}
                            </button>
                        ))}
                    </div>
                    <textarea
                        rows={3}
                        className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl px-4 py-3.5 text-lg text-zinc-900 font-bold focus:ring-4 focus:ring-zinc-100 focus:border-zinc-200 focus:outline-none transition-all resize-none placeholder-zinc-300"
                        placeholder="e.g. Response times have been slow lately..."
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={sending || !message.trim()}
                        className="w-full bg-orange-600 text-white rounded-2xl h-14 font-black hover:bg-orange-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2.5 shadow-xl shadow-orange-500/20 active:scale-95"
                        style={{ fontSize: '17px' }}
                    >
                        {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        Send Privately
                    </button>
                </div>
            )}
        </div>
    );
}
