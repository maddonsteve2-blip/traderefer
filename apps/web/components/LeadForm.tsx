"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

interface LeadFormProps {
    businessName: string;
    businessId: string;
    referralCode?: string;
}

export function LeadForm({ businessName, businessId, referralCode }: LeadFormProps) {
    const router = useRouter();
    const { isSignedIn, userId, getToken } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isOwner, setIsOwner] = useState(false);

    // Check if current user owns this business
    useEffect(() => {
        if (!isSignedIn || !userId) {
            setIsOwner(false);
            return;
        }
        (async () => {
            try {
                const token = await getToken();
                if (!token) {
                    console.warn("No auth token available");
                    setIsOwner(false);
                    return;
                }
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/business/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const biz = await res.json();
                    setIsOwner(biz.id === businessId);
                } else {
                    console.warn("Business ownership check failed:", res.status, res.statusText);
                    setIsOwner(false);
                }
            } catch (err) {
                console.error("Business ownership check error:", err);
                // If check fails, assume not owner
                setIsOwner(false);
            }
        })();
    }, [isSignedIn, userId, businessId, getToken]);

    const [formData, setFormData] = useState({
        consumer_name: "",
        consumer_phone: "",
        consumer_email: "",
        consumer_suburb: "",
        consumer_address: "",
        job_description: "",
        lead_urgency: "warm"
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/leads/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    business_id: businessId,
                    referral_code: referralCode,
                    ...formData
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || "Failed to send enquiry");
            }

            const data = await response.json();
            
            // If current user owns this business, skip PIN verification
            if (isOwner) {
                router.push("/leads/success");
            } else {
                router.push(`/leads/verify?id=${data.id}`);
            }
        } catch (err: any) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                    <div className="text-base font-bold text-orange-900">Free Enquiry</div>
                    <div className="text-sm text-orange-700/70 font-medium">No obligation, 100% free to send.</div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3 text-red-600">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-bold">{error}</p>
                </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                    <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Your Name</label>
                    <input
                        required
                        name="consumer_name"
                        value={formData.consumer_name}
                        onChange={handleChange}
                        type="text"
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                        placeholder="John Doe"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Mobile</label>
                        <input
                            required
                            name="consumer_phone"
                            value={formData.consumer_phone}
                            onChange={handleChange}
                            type="tel"
                            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                            placeholder="0412 000 000"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Suburb</label>
                        <input
                            required
                            name="consumer_suburb"
                            value={formData.consumer_suburb}
                            onChange={handleChange}
                            type="text"
                            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                            placeholder="Highton"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Street Address</label>
                    <input
                        name="consumer_address"
                        value={formData.consumer_address}
                        onChange={handleChange}
                        type="text"
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                        placeholder="123 Example St (optional)"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Email</label>
                    <input
                        required
                        name="consumer_email"
                        value={formData.consumer_email}
                        onChange={handleChange}
                        type="email"
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                        placeholder="john@example.com"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-1.5">What do you need?</label>
                    <textarea
                        required
                        name="job_description"
                        value={formData.job_description}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none font-medium"
                        placeholder="Explain the job..."
                    ></textarea>
                </div>

                <div>
                    <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">How urgent is this?</label>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { value: "hot", label: "Urgent", desc: "Need it ASAP", color: "border-red-500 bg-red-50 text-red-700" },
                            { value: "warm", label: "Soon", desc: "Within a week", color: "border-orange-500 bg-orange-50 text-orange-700" },
                            { value: "cold", label: "Just Browsing", desc: "Getting quotes", color: "border-blue-500 bg-blue-50 text-blue-700" },
                        ].map(opt => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, lead_urgency: opt.value }))}
                                className={`p-3 rounded-xl border-2 text-center transition-all ${
                                    formData.lead_urgency === opt.value
                                        ? opt.color
                                        : "border-zinc-100 bg-zinc-50 text-zinc-500 hover:border-zinc-200"
                                }`}
                            >
                                <div className="text-sm font-bold">{opt.label}</div>
                                <div className="text-xs opacity-70">{opt.desc}</div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-start gap-3 py-2">
                    <input required type="checkbox" id="consent" className="mt-1 w-4 h-4 rounded border-zinc-300 text-orange-600 focus:ring-orange-500 cursor-pointer" />
                    <label htmlFor="consent" className="text-sm text-zinc-500 leading-normal cursor-pointer">
                        I agree to my details being shared with {businessName} only. <Link href="/privacy" className="underline hover:text-orange-600">Privacy Policy</Link>
                    </label>
                </div>

                <Button disabled={isLoading} className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-full py-6 h-auto text-lg font-bold shadow-lg shadow-orange-500/20">
                    {isLoading ? "Sending..." : "Send My Enquiry"}
                </Button>
            </form>
        </div>
    );
}
