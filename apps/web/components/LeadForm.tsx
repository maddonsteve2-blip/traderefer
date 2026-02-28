"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertCircle, User, Phone, Mail, MapPin, MessageSquare, Clock, Zap } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";

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
    const [submitSuccess, setSubmitSuccess] = useState(false);
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
    const [addressValue, setAddressValue] = useState("");
    const [suburbValue, setSuburbValue] = useState("");
    const [stateValue, setStateValue] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleAddressSelect = (address: string, suburb: string, state: string, postcode?: string) => {
        setAddressValue(address);
        setSuburbValue(suburb);
        setStateValue(state);
        setFormData(prev => ({
            ...prev,
            consumer_address: address,
            consumer_suburb: suburb
        }));
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

            // Show success state briefly before redirect
            setSubmitSuccess(true);
            setIsLoading(false);

            // Small delay to show success message
            await new Promise(resolve => setTimeout(resolve, 1500));

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
            <div className="bg-orange-50 border-2 border-orange-100 rounded-[20px] p-4 flex items-center gap-3 shadow-sm">
                <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-md shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                    <div className="text-base font-black text-orange-950">Free Enquiry / Quote</div>
                    <div className="text-xs text-orange-800/80 font-bold">No obligation, 100% free to send.</div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border-2 border-red-100 rounded-[16px] p-4 flex items-center gap-3 text-red-700 shadow-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-black">{error}</p>
                </div>
            )}

            {submitSuccess && (
                <div className="bg-green-50 border-2 border-green-200 rounded-[16px] p-4 flex items-center gap-3 text-green-800 shadow-sm">
                    <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
                    <div>
                        <p className="text-base font-black">Enquiry sent successfully!</p>
                        <p className="text-xs font-bold">Check your email for confirmation...</p>
                    </div>
                </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1">
                    <label className="flex items-center gap-2 text-sm font-black text-zinc-600 uppercase tracking-widest ml-1">
                        <User className="w-4 h-4 text-orange-600" />
                        Full Name
                    </label>
                    <input
                        required
                        name="consumer_name"
                        value={formData.consumer_name}
                        onChange={handleChange}
                        type="text"
                        className="w-full px-4 py-3 bg-zinc-50 border-2 border-zinc-200 rounded-[16px] focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-bold text-lg text-zinc-900 placeholder:text-zinc-300 shadow-sm"
                        placeholder="e.g. John Smith"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="flex items-center gap-2 text-sm font-black text-zinc-600 uppercase tracking-widest ml-1">
                            <Phone className="w-4 h-4 text-orange-600" />
                            Mobile Number
                        </label>
                        <input
                            required
                            name="consumer_phone"
                            value={formData.consumer_phone}
                            onChange={handleChange}
                            type="tel"
                            className="w-full px-4 py-3 bg-zinc-50 border-2 border-zinc-200 rounded-[16px] focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-bold text-lg text-zinc-900 placeholder:text-zinc-300 shadow-sm"
                            placeholder="0400 000 000"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="flex items-center gap-2 text-sm font-black text-zinc-600 uppercase tracking-widest ml-1">
                            <Mail className="w-4 h-4 text-orange-600" />
                            Email Address
                        </label>
                        <input
                            required
                            name="consumer_email"
                            value={formData.consumer_email}
                            onChange={handleChange}
                            type="email"
                            className="w-full px-4 py-3 bg-zinc-50 border-2 border-zinc-200 rounded-[16px] focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-bold text-lg text-zinc-900 placeholder:text-zinc-300 shadow-sm"
                            placeholder="john@example.com"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="flex items-center gap-2 text-sm font-black text-zinc-600 uppercase tracking-widest ml-1">
                        <MapPin className="w-4 h-4 text-orange-600" />
                        Job Location
                    </label>
                    <AddressAutocomplete
                        addressValue={addressValue}
                        suburbValue={suburbValue}
                        stateValue={stateValue}
                        onAddressSelect={handleAddressSelect}
                        className="w-full px-4 py-3 bg-zinc-50 border-2 border-zinc-200 rounded-[16px] focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-bold text-lg text-zinc-900 placeholder:text-zinc-300 shadow-sm"
                        placeholder="Type property address..."
                    />
                </div>

                <div className="space-y-1">
                    <label className="flex items-center gap-2 text-sm font-black text-zinc-600 uppercase tracking-widest ml-1">
                        <MessageSquare className="w-4 h-4 text-orange-600" />
                        Job Description
                    </label>
                    <textarea
                        required
                        rows={3}
                        name="job_description"
                        value={formData.job_description}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-zinc-50 border-2 border-zinc-200 rounded-[20px] focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-bold text-lg text-zinc-900 placeholder:text-zinc-300 shadow-sm resize-none"
                        placeholder="Please describe what you need help with..."
                    />
                </div>

                <div className="space-y-2 pt-1">
                    <label className="flex items-center gap-2.5 text-xs font-black text-zinc-500 uppercase tracking-[0.15em] ml-1">
                        <Clock className="w-3.5 h-3.5 text-orange-600" />
                        When do you need it done?
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { value: "hot", label: "Urgent", icon: Zap, color: "border-orange-600 bg-orange-600 text-white ring-orange-200 shadow-orange-200" },
                            { value: "warm", label: "Soon", icon: Clock, color: "border-zinc-900 bg-zinc-900 text-white ring-zinc-200 shadow-zinc-200" },
                            { value: "cold", label: "Quoting", icon: MessageSquare, color: "border-zinc-300 bg-zinc-100 text-zinc-900 ring-zinc-100 shadow-zinc-100" },
                        ].map(opt => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, lead_urgency: opt.value }))}
                                className={`h-12 rounded-xl border-2 text-center transition-all group relative overflow-hidden flex items-center justify-center p-2 ${formData.lead_urgency === opt.value
                                    ? opt.color + " ring-3 shadow-xl -translate-y-0.5"
                                    : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-400 hover:bg-zinc-50"
                                    }`}
                            >
                                <span className="text-sm font-black uppercase tracking-wider">{opt.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-zinc-50 rounded-[16px] border-2 border-zinc-100">
                    <div className="pt-0.5">
                        <input required type="checkbox" id="consent" className="w-4 h-4 rounded-md border-2 border-zinc-300 text-orange-600 focus:ring-orange-500/20 cursor-pointer transition-all" />
                    </div>
                    <label htmlFor="consent" className="text-xs text-zinc-600 font-bold leading-relaxed cursor-pointer select-none">
                        I agree to share my details with <span className="text-zinc-900">{businessName}</span> only for this enquiry. <Link href="/privacy" className="text-orange-600 underline decoration-orange-200 hover:decoration-orange-500 transition-all font-black">Privacy Policy</Link>
                    </label>
                </div>

                <Button disabled={isLoading} className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-full py-7 h-auto text-xl font-black shadow-2xl shadow-zinc-900/20 transition-all active:scale-95 group relative overflow-hidden mt-4">
                    {isLoading ? (
                        <div className="flex items-center gap-4">
                            <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                            Processing...
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-4">
                            Send Secure Enquiry
                            <Zap className="w-5 h-5 fill-white" />
                        </div>
                    )}
                </Button>
            </form>
        </div>
    );
}
