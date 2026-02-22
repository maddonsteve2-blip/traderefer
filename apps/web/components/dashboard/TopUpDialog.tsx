"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Wallet, Plus, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const TOPUP_AMOUNTS = [
    { label: "$25", cents: 2500 },
    { label: "$50", cents: 5000 },
    { label: "$100", cents: 10000 },
    { label: "$250", cents: 25000 },
];

interface TopUpDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentBalance: number;
    onTopUpSuccess?: (newBalance: number) => void;
}

export function TopUpDialog({ open, onOpenChange, currentBalance, onTopUpSuccess }: TopUpDialogProps) {
    const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
    const [customAmount, setCustomAmount] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const { getToken } = useAuth();

    const amountCents = selectedAmount ?? (customAmount ? Math.round(parseFloat(customAmount) * 100) : 0);

    const handleTopUp = async () => {
        if (amountCents < 500) {
            toast.error("Minimum top-up is $5.00");
            return;
        }

        setIsProcessing(true);
        try {
            const token = await getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/business/wallet/topup`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ amount_cents: amountCents }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Top-up failed");
            }

            const data = await res.json();
            toast.success(`Wallet topped up by $${(amountCents / 100).toFixed(2)}`);
            onTopUpSuccess?.(data.new_balance_cents ?? currentBalance + amountCents);
            setSelectedAmount(null);
            setCustomAmount("");
            onOpenChange(false);
        } catch (error) {
            toast.error((error as Error).message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <Wallet className="w-5 h-5 text-orange-500" /> Top Up Wallet
                    </DialogTitle>
                    <DialogDescription>
                        Add funds to unlock leads instantly.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 pt-2">
                    <div className="text-center p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                        <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Current Balance</div>
                        <div className="text-3xl font-black text-zinc-900 font-display">
                            ${(currentBalance / 100).toFixed(2)}
                        </div>
                    </div>

                    <div>
                        <div className="text-sm font-bold text-zinc-500 mb-3">Select amount</div>
                        <div className="grid grid-cols-4 gap-2">
                            {TOPUP_AMOUNTS.map((amt) => (
                                <button
                                    key={amt.cents}
                                    onClick={() => { setSelectedAmount(amt.cents); setCustomAmount(""); }}
                                    className={`py-3 rounded-xl text-sm font-bold border transition-all ${
                                        selectedAmount === amt.cents
                                            ? "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20"
                                            : "bg-white text-zinc-700 border-zinc-200 hover:border-orange-300"
                                    }`}
                                >
                                    {amt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="text-sm font-bold text-zinc-500 mb-2">Or enter custom amount</div>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">$</span>
                            <input
                                type="number"
                                min="5"
                                step="0.01"
                                placeholder="0.00"
                                value={customAmount}
                                onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                                className="w-full pl-8 pr-4 py-3 rounded-xl border border-zinc-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none text-lg font-bold"
                            />
                        </div>
                    </div>

                    <Button
                        onClick={handleTopUp}
                        disabled={isProcessing || amountCents < 500}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-full py-6 h-auto text-base font-bold shadow-lg shadow-orange-500/20"
                    >
                        {isProcessing ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Plus className="w-4 h-4 mr-2" />
                                Top Up {amountCents >= 500 ? `$${(amountCents / 100).toFixed(2)}` : ""}
                            </>
                        )}
                    </Button>

                    <p className="text-xs text-zinc-400 text-center">
                        Payments processed securely via Stripe. Minimum top-up $5.00.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
