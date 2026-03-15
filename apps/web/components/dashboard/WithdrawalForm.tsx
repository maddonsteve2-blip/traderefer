"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Gift, ChevronRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";

export function WithdrawalForm({ maxClaimCents, totalPendingCents }: { maxClaimCents: number, totalPendingCents: number }) {
    const [status, setStatus] = useState<"idle" | "processing" | "success">("idle");
    const { getToken } = useAuth();
    const router = useRouter();

    const amountToClaim = Math.min(maxClaimCents, totalPendingCents);
    const amountDollars = (amountToClaim / 100).toFixed(2);
    
    // We disable if there's less than $25, OR if status is processing
    const isReady = totalPendingCents >= 2500;

    const handleClaim = async () => {
        if (status === "processing" || !isReady) return;
        
        setStatus("processing");
        
        try {
            const token = await getToken();
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api/backend";
            // Make a call to claim reward. The backend should handle the logic to cap at $300
            const res = await fetch(`${apiUrl}/referrer/withdraw`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ method: "PREZZEE_SWAP", amount_cents: amountToClaim })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Claim failed");
            }

            setStatus("success");
            toast.success("Gift card issued successfully!");
            router.refresh(); 
        } catch (err: any) {
            toast.error(err.message || "Connection error. Please try again.");
            setStatus("idle");
        }
    };

    if (status === "success") {
        return (
            <div className="bg-white p-8 md:p-12 rounded-[40px] border border-green-100 shadow-2xl text-center animate-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-3xl lg:text-4xl font-black text-zinc-900 mb-2">Gift Card Issued!</h3>
                <p className="text-zinc-500 mb-10 font-medium text-lg lg:text-xl leading-relaxed">
                    We've emailed your link. You can open it instantly to select your brand.
                </p>
                <Button onClick={() => setStatus("idle")} className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-10 h-16 font-black text-xl shadow-xl shadow-orange-500/20 active:scale-95 transition-all">
                    Done
                </Button>
            </div>
        );
    }

    return (
        <div className="mt-8">
            {!isReady ? (
                <div className="bg-orange-50 border-2 border-orange-100 rounded-[32px] p-8 flex items-center gap-6">
                    <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-7 h-7 text-orange-500" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-orange-900 mb-1">Balance Too Low</h3>
                        <p className="text-lg text-orange-700 font-medium">You need at least $25.00 to claim a gift card. You currently have ${(totalPendingCents / 100).toFixed(2)}.</p>
                    </div>
                </div>
            ) : (
                <button
                    disabled={status === "processing"}
                    onClick={handleClaim}
                    className="w-full bg-orange-500 p-8 md:p-10 rounded-[32px] border-none text-left hover:bg-orange-600 transition-all group disabled:opacity-50 disabled:hover:bg-orange-500 shadow-xl shadow-orange-500/20"
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center group-hover:bg-white/30 transition-colors shrink-0">
                                <Gift className="w-8 h-8 text-white transition-colors" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white mb-1">Claim ${amountDollars} Gift Card</h3>
                                <p className="text-lg text-orange-100 font-medium">Instantly claim your available balance (max $300 per transaction)</p>
                            </div>
                        </div>
                        <div className="bg-white text-orange-600 font-black px-6 py-4 rounded-2xl text-xl flex items-center gap-2 shrink-0 shadow-sm border border-orange-400 group-hover:-translate-y-1 transition-all">
                            {status === "processing" ? "Processing..." : <>Claim Now <ChevronRight className="w-6 h-6" /></>}
                        </div>
                    </div>
                </button>
            )}
        </div>
    );
}
