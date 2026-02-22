"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Zap, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";

export function WithdrawalForm() {
    const [status, setStatus] = useState<"idle" | "processing" | "success">("idle");
    const [method, setMethod] = useState<"standard" | "instant" | null>(null);
    const { getToken } = useAuth();
    const router = useRouter();

    const handleWithdraw = async (selectedMethod: "standard" | "instant") => {
        if (status === "processing") return;
        
        setMethod(selectedMethod);
        setStatus("processing");
        
        try {
            const token = await getToken();
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/referrer/withdraw`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ method: selectedMethod })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Withdrawal failed");
            }

            setStatus("success");
            toast.success("Transfer initiated successfully!");
            router.refresh(); // Refresh server components to show updated balance
        } catch (err: any) {
            toast.error(err.message || "Connection error. Please try again.");
            setStatus("idle");
        }
    };

    if (status === "success") {
        return (
            <div className="bg-white p-12 rounded-[40px] border border-green-100 shadow-2xl text-center animate-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-black text-zinc-900 mb-2">Transfer Initiated!</h3>
                <p className="text-zinc-500 mb-8 font-medium">
                    Your {method} payout is being processed. You'll receive a notification once it hits your account.
                </p>
                <Button onClick={() => setStatus("idle")} className="bg-zinc-900 hover:bg-black text-white rounded-full px-8 h-12 font-bold">
                    Done
                </Button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
                disabled={status === "processing"}
                onClick={() => handleWithdraw("standard")}
                className="bg-white p-8 rounded-3xl border border-zinc-200 text-left hover:border-zinc-900 transition-all group disabled:opacity-50"
            >
                <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-zinc-900 transition-colors">
                    <CreditCard className="w-6 h-6 text-zinc-400 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 mb-1">Standard Transfer</h3>
                <p className="text-sm text-zinc-500 mb-4">1-3 business days. No fees.</p>
                <div className="text-orange-600 font-bold text-sm flex items-center gap-1">
                    {status === "processing" && method === "standard" ? "Processing..." : <>Select <ChevronRight className="w-4 h-4" /></>}
                </div>
            </button>

            <button
                disabled={status === "processing"}
                onClick={() => handleWithdraw("instant")}
                className="bg-white p-8 rounded-3xl border border-blue-100 text-left hover:border-blue-500 transition-all group relative overflow-hidden disabled:opacity-50"
            >
                <div className="absolute top-4 right-4 bg-blue-100 text-blue-700 text-base font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                    Fast
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
                    <Zap className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 mb-1">Instant Payout</h3>
                <p className="text-sm text-zinc-500 mb-4">Within minutes. 1% fee applies.</p>
                <div className="text-blue-600 font-bold text-sm flex items-center gap-1">
                    {status === "processing" && method === "instant" ? "Processing..." : <>Select <ChevronRight className="w-4 h-4" /></>}
                </div>
            </button>
        </div>
    );
}
