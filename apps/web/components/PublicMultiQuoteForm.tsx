"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { AlertCircle, ArrowRight, CheckCircle2, Clock, Loader2, Mail, MapPin, MessageSquare, Phone, User, Zap } from "lucide-react";
import { TRADE_CATEGORIES } from "@/lib/constants";

type PublicMultiQuoteFormProps = {
    initialTradeCategory?: string;
    initialState?: string;
    initialSuburb?: string;
    initialCity?: string;
    initialSourcePage?: string;
};

export function PublicMultiQuoteForm({
    initialTradeCategory = "",
    initialState = "",
    initialSuburb = "",
    initialCity = "",
    initialSourcePage = "/quotes",
}: PublicMultiQuoteFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [addressValue, setAddressValue] = useState("");
    const [suburbValue, setSuburbValue] = useState(initialSuburb);
    const [stateValue, setStateValue] = useState(initialState);
    const [cityValue] = useState(initialCity);
    const [formData, setFormData] = useState({
        trade_category: initialTradeCategory,
        consumer_name: "",
        consumer_phone: "",
        consumer_email: "",
        consumer_suburb: initialSuburb,
        consumer_address: "",
        job_description: "",
        lead_urgency: "warm",
    });

    const tradeLabel = useMemo(() => formData.trade_category || "local tradies", [formData.trade_category]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleAddressSelect = (address: string, suburb: string, state: string) => {
        setAddressValue(address);
        setSuburbValue(suburb);
        setStateValue(state);
        setFormData((prev) => ({
            ...prev,
            consumer_address: address,
            consumer_suburb: suburb,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/backend/website-quotes/submit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...formData,
                    trade_category: formData.trade_category,
                    consumer_state: stateValue,
                    consumer_city: cityValue,
                    source_page: typeof window !== "undefined" ? window.location.pathname + window.location.search : initialSourcePage,
                    target_match_count: 3,
                }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.detail || "Failed to request quotes");
            }

            setSubmitSuccess(true);
            setIsLoading(false);
            await new Promise((resolve) => setTimeout(resolve, 1500));
            router.push("/leads/success");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to request quotes");
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
                    <div className="text-lg font-black text-orange-950 leading-tight">Get up to 3 free quotes</div>
                    <div className="text-xs md:text-sm text-orange-800/70 font-bold">We’ll match your request with up to 3 local businesses. No obligation.</div>
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
                        <p className="text-lg font-black leading-none mb-1">Quote request sent!</p>
                        <p className="text-sm font-bold opacity-80">We’ve started matching your job with local businesses.</p>
                    </div>
                </div>
            )}

            <form className="space-y-5 md:space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] md:text-xs font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">
                        <Zap className="w-3.5 h-3.5 text-orange-500" />
                        Trade Needed
                    </label>
                    <select
                        required
                        name="trade_category"
                        value={formData.trade_category}
                        onChange={handleChange}
                        className="w-full h-14 md:h-16 px-5 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-medium text-lg text-zinc-900 shadow-sm appearance-none"
                    >
                        <option value="" disabled>Select a trade</option>
                        {TRADE_CATEGORIES.map((trade) => (
                            <option key={trade} value={trade}>{trade}</option>
                        ))}
                    </select>
                </div>

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
                        className="w-full h-14 md:h-16 px-5 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-medium text-lg text-zinc-900 placeholder:text-zinc-300 shadow-sm"
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
                        placeholder={`Tell us what you need help with from ${tradeLabel} businesses...`}
                    />
                </div>

                <div className="space-y-3 pt-2">
                    <label className="flex items-center gap-2 text-[10px] md:text-xs font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">
                        <Clock className="w-3.5 h-3.5 text-orange-500" />
                        When do you need it done?
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { value: "hot", label: "Urgent", color: "border-orange-500 bg-orange-500 text-white shadow-orange-500/20" },
                            { value: "warm", label: "Soon", color: "border-orange-500 bg-orange-500 text-white shadow-orange-500/20" },
                            { value: "cold", label: "Later", color: "border-orange-500 bg-orange-500 text-white shadow-orange-500/20" },
                        ].map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setFormData((prev) => ({ ...prev, lead_urgency: opt.value }))}
                                className={`h-12 md:h-14 rounded-2xl border-2 text-center transition-all flex items-center justify-center p-2 active:scale-95 ${formData.lead_urgency === opt.value
                                    ? opt.color + " shadow-lg -translate-y-0.5"
                                    : "border-zinc-100 bg-zinc-50 text-zinc-400 hover:border-zinc-300 hover:bg-white"
                                    }`}
                            >
                                <span className={`text-[11px] md:text-xs font-black uppercase tracking-widest ${formData.lead_urgency === opt.value ? "text-white" : "text-zinc-500"}`}>{opt.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-start gap-4 p-5 bg-zinc-50 rounded-[20px] border border-zinc-100">
                    <div className="pt-0.5">
                        <input required type="checkbox" id="quotes-consent" className="w-5 h-5 rounded-lg border-2 border-zinc-200 text-orange-500 focus:ring-orange-500/10 cursor-pointer transition-all" />
                    </div>
                    <label htmlFor="quotes-consent" className="text-xs md:text-sm text-zinc-500 font-bold leading-relaxed cursor-pointer select-none">
                        I agree to share my details with up to 3 matching businesses for this quote request. <Link href="/privacy" className="text-orange-500 hover:text-orange-600 transition-all font-black">Privacy Policy</Link>
                    </label>
                </div>

                <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#FF6600] hover:bg-[#E65C00] text-white rounded-[24px] h-16 md:h-20 text-lg md:text-2xl font-black shadow-2xl shadow-orange-500/20 transition-all active:scale-95 group mt-4"
                >
                    {isLoading ? (
                        <div className="flex items-center gap-3">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            Finding quotes...
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-3">
                            Get 3 Free Quotes
                            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                        </div>
                    )}
                </Button>
            </form>
        </div>
    );
}
