"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertCircle, User, Phone, Mail, MapPin, MessageSquare, Clock, Zap, Loader2, ArrowRight } from "lucide-react";
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
                const res = await fetch(`/api/backend/business/me`, {
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
            const response = await fetch(`/api/backend/leads/`, {
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
        <div className="space-y-6 md:space-y-8">
            <div className="bg-orange-50 border border-orange-100 rounded-[20px] md:rounded-[24px] p-5 flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 bg-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-md shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                    <div className="text-lg font-black text-orange-950 leading-tight">Free Enquiry / Quote</div>
                    <div className="text-xs md:text-sm text-orange-800/70 font-bold">No obligation, 100% free to send.</div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 rounded-[20px] p-5 flex items-center gap-4 text-red-700 shadow-sm animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-6 h-6 shrink-0" />
                    <p className="text-sm font-black leading-tight">{error}</p>
                </div>
            )}

            {submitSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-[24px] p-6 flex items-center gap-4 text-green-800 shadow-sm animate-in zoom-in-95">
                    <CheckCircle2 className="w-8 h-8 shrink-0" />
                    <div>
                        <p className="text-lg font-black leading-none mb-1">Enquiry sent!</p>
                        <p className="text-sm font-bold opacity-80">Check your email for confirmation...</p>
                    </div>
                </div>
            )}

            <form className="space-y-5 md:space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] md:text-xs font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">
                        <User className="w-3.5 h-3.5 text-orange-500" />
                        Full Name
                    </label>
                    <input
                        required
                        name="consumer_name"
                        value={formData.consumer_name}
                        onChange={handleChange}
                        type="text"
                        className="w-full h-14 md:h-16 px-5 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-bold text-lg text-zinc-900 placeholder:text-zinc-300 shadow-sm"
                        placeholder="e.g. John Smith"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] md:text-xs font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">
                            <Phone className="w-3.5 h-3.5 text-orange-500" />
                            Mobile Number
                        </label>
                        <input
                            required
                            name="consumer_phone"
                            value={formData.consumer_phone}
                            onChange={handleChange}
                            type="tel"
                            className="w-full h-14 md:h-16 px-5 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-bold text-lg text-zinc-900 placeholder:text-zinc-300 shadow-sm"
                            placeholder="0400 000 000"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] md:text-xs font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">
                            <Mail className="w-3.5 h-3.5 text-orange-500" />
                            Email Address
                        </label>
                        <input
                            required
                            name="consumer_email"
                            value={formData.consumer_email}
                            onChange={handleChange}
                            type="email"
                            className="w-full h-14 md:h-16 px-5 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-bold text-lg text-zinc-900 placeholder:text-zinc-300 shadow-sm"
                            placeholder="john@example.com"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] md:text-xs font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">
                        <MapPin className="w-3.5 h-3.5 text-orange-500" />
                        Job Location
                    </label>
                    <AddressAutocomplete
                        addressValue={addressValue}
                        suburbValue={suburbValue}
                        stateValue={stateValue}
                        onAddressSelect={handleAddressSelect}
                        className="w-full h-14 md:h-16 px-5 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-bold text-lg text-zinc-900 placeholder:text-zinc-300 shadow-sm"
                        placeholder="Type property address..."
                    />
                </div>

                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] md:text-xs font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">
                        <MessageSquare className="w-3.5 h-3.5 text-orange-500" />
                        Job Description
                    </label>
                    <textarea
                        required
                        rows={4}
                        name="job_description"
                        value={formData.job_description}
                        onChange={handleChange}
                        className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-[24px] focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-bold text-lg text-zinc-900 placeholder:text-zinc-300 shadow-sm resize-none leading-relaxed"
                        placeholder="Describe the job you need help with..."
                    />
                </div>

                <div className="space-y-3 pt-2">
                    <label className="flex items-center gap-2 text-[10px] md:text-xs font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">
                        <Clock className="w-3.5 h-3.5 text-orange-500" />
                        When do you need it done?
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { value: "hot", label: "Urgent", icon: Zap, color: "border-orange-500 bg-orange-500 text-white shadow-orange-500/20" },
                            { value: "warm", label: "Soon", icon: Clock, color: "border-orange-500 bg-orange-500 text-white shadow-orange-500/20" },
                            { value: "cold", label: "Later", icon: MessageSquare, color: "border-zinc-200 bg-zinc-100 text-zinc-900 shadow-transparent" },
                        ].map(opt => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, lead_urgency: opt.value }))}
                                className={`h-12 md:h-14 rounded-2xl border-2 text-center transition-all flex items-center justify-center p-2 active:scale-95 ${formData.lead_urgency === opt.value
                                    ? opt.color + " shadow-lg -translate-y-0.5"
                                    : "border-zinc-100 bg-zinc-50 text-zinc-400 hover:border-zinc-300 hover:bg-white"
                                    }`}
                            >
                                <span className={`text-[11px] md:text-xs font-black uppercase tracking-widest ${formData.lead_urgency === opt.value ? 'text-white' : 'text-zinc-500'}`}>{opt.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-start gap-4 p-5 bg-zinc-50 rounded-[20px] border border-zinc-100">
                    <div className="pt-0.5">
                        <input required type="checkbox" id="consent" className="w-5 h-5 rounded-lg border-2 border-zinc-200 text-orange-500 focus:ring-orange-500/10 cursor-pointer transition-all" />
                    </div>
                    <label htmlFor="consent" className="text-xs md:text-sm text-zinc-500 font-bold leading-relaxed cursor-pointer select-none">
                        I agree to share my details with <span className="text-zinc-900">{businessName}</span> for this enquiry. <Link href="/privacy" className="text-orange-500 hover:text-orange-600 transition-all font-black">Privacy Policy</Link>
                    </label>
                </div>

                <Button
                    disabled={isLoading}
                    className="w-full bg-[#FF6600] hover:bg-[#E65C00] text-white rounded-[24px] h-16 md:h-20 text-lg md:text-2xl font-black shadow-2xl shadow-orange-500/20 transition-all active:scale-95 group mt-4"
                >
                    {isLoading ? (
                        <div className="flex items-center gap-3">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            Processing...
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-3">
                            Submit Enquiry
                            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                        </div>
                    )}
                </Button>
            </form>
        </div>
    );
}
