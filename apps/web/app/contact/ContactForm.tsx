"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, CheckCircle2, Loader2 } from "lucide-react";

export default function ContactForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        department: "General Support",
        message: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.name || !formData.email || !formData.message) {
            setError("Please fill in all required fields.");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/support", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.error || "Failed to send message. Please try again.");
                return;
            }

            setIsSuccess(true);
            setFormData({ name: "", email: "", department: "General Support", message: "" });
        } catch {
            setError("Failed to send message. Please check your connection and try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="text-center py-12 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-2xl font-black text-zinc-900 mb-3 font-display">Message received</h2>
                <p className="text-zinc-500 font-medium mb-8 max-w-md mx-auto" style={{ fontSize: '18px' }}>
                    We&apos;ll reply to your email as soon as we can.
                </p>
                <Button
                    onClick={() => setIsSuccess(false)}
                    className="rounded-full px-8 bg-orange-600 hover:bg-orange-700 text-white font-bold"
                >
                    Send Another Message
                </Button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-base font-black text-zinc-400 uppercase tracking-widest ml-1">Your Name</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Doe"
                        className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl h-14 px-6 text-base font-bold focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-base font-black text-zinc-400 uppercase tracking-widest ml-1">Email Address</label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                        className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl h-14 px-6 text-base font-bold focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
                        required
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-base font-black text-zinc-400 uppercase tracking-widest ml-1">Department</label>
                <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl h-14 px-6 text-base font-bold focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all appearance-none cursor-pointer"
                >
                    <option>General Support</option>
                    <option>Dispute Resolution</option>
                    <option>Billing & Payouts</option>
                    <option>Sales & Partnerships</option>
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-base font-black text-zinc-400 uppercase tracking-widest ml-1">Your Message</label>
                <textarea
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="How can we help?"
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-3xl p-6 text-base font-bold focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all resize-none"
                    required
                />
            </div>

            {error && (
                <p className="text-red-600 font-bold" style={{ fontSize: '16px' }}>{error}</p>
            )}

            <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-16 bg-orange-600 hover:bg-orange-700 text-white rounded-full text-lg font-black shadow-xl shadow-orange-500/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" /> Sending...
                    </>
                ) : (
                    <>
                        Send Message <Send className="w-5 h-5" />
                    </>
                )}
            </Button>
        </form>
    );
}
