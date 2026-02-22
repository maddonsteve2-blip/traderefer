"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    ShieldCheck,
    ArrowRight,
    RefreshCcw,
    Phone,
    Edit2
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function VerifyForm() {
    const searchParams = useSearchParams();
    const leadId = searchParams.get("id");
    const phoneNumber = searchParams.get("phone") || "your number";

    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleChange = (index: number, value: string) => {
        if (value.length > 1) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleSubmit = async () => {
        if (otp.join("").length < 6) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/leads/${leadId}/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ otp: otp.join("") })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || "Failed to verify OTP");
            }

            router.push("/leads/success");
        } catch (err) {
            setError((err as Error).message || "Invalid verification code. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-[40px] border border-zinc-200 shadow-2xl p-10 md:p-14 text-center relative overflow-hidden">
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-bl-[100px]" />

            <div className="w-20 h-20 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-8">
                <ShieldCheck className="w-10 h-10 text-orange-600" />
            </div>

            <h1 className="text-3xl font-black text-zinc-900 mb-4 font-display">Verify your number</h1>
            <p className="text-zinc-500 font-medium mb-10 leading-relaxed">
                We sent a 6-digit code to <span className="text-zinc-900 font-bold">{phoneNumber}</span> to verify your enquiry.
            </p>

            {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
                    {error}
                </div>
            )}

            <div className="flex justify-center gap-4 mb-10">
                {otp.map((digit, i) => (
                    <input
                        key={i}
                        id={`otp-${i}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(i, e.target.value)}
                        disabled={isLoading}
                        className="w-16 h-20 bg-zinc-50 border-2 border-zinc-100 rounded-2xl text-3xl font-black text-center text-zinc-900 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-display disabled:opacity-50"
                    />
                ))}
            </div>

            <div className="space-y-4 mb-10">
                <Button
                    onClick={handleSubmit}
                    disabled={isLoading || otp.join("").length < 6}
                    className="w-full bg-zinc-900 hover:bg-black text-white rounded-full h-16 text-xl font-black shadow-xl shadow-zinc-200 disabled:opacity-50"
                >
                    {isLoading ? "Verifying..." : "Verify Enquiry"} <ArrowRight className="ml-2 w-6 h-6" />
                </Button>

                <div className="flex items-center justify-center gap-6">
                    <button className="text-sm font-bold text-zinc-400 hover:text-zinc-600 flex items-center gap-1.5 transition-colors">
                        <RefreshCcw className="w-3.5 h-3.5" /> Resend Code
                    </button>
                    <div className="w-1.5 h-1.5 bg-zinc-200 rounded-full" />
                    <button className="text-sm font-bold text-zinc-400 hover:text-zinc-600 flex items-center gap-1.5 transition-colors">
                        <Edit2 className="w-3.5 h-3.5" /> Edit Number
                    </button>
                </div>
            </div>

            <p className="text-base text-zinc-400 font-bold uppercase tracking-widest leading-loose">
                By verifying, you agree to our Terms of Service.<br />
                © 2026 TradeRefer
            </p>
        </div>
    );
}

export default function LeadVerifyPage() {
    return (
        <main className="min-h-screen bg-zinc-50 pt-32 pb-20 flex items-center justify-center">
            <div className="container mx-auto px-4 max-w-lg">
                <Suspense fallback={<div>Loading...</div>}>
                    <VerifyForm />
                </Suspense>
            </div>
        </main>
    );
}
