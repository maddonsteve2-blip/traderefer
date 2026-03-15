"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Wallet, Plus, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const TOPUP_AMOUNTS = [
    { label: "$25", cents: 2500 },
    { label: "$50", cents: 5000 },
    { label: "$100", cents: 10000 },
    { label: "$250", cents: 25000 },
];

const MIN_WALLET_FLOOR_CENTS = 2500; // $25 minimum balance required to unlock leads

interface TopUpDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentBalance: number;
    onTopUpSuccess?: (newBalance: number) => void;
}

function PaymentForm({
    amountCents,
    onSuccess,
    onBack,
    getToken,
    apiUrl,
}: {
    amountCents: number;
    onSuccess: (newBalance: number) => void;
    onBack: () => void;
    getToken: () => Promise<string | null>;
    apiUrl: string;
}) {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePay = async () => {
        if (!stripe || !elements) return;
        setIsProcessing(true);
        try {
            const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                redirect: "if_required",
            });
            if (error) {
                toast.error(error.message || "Payment failed");
                return;
            }
            if (paymentIntent?.status === "succeeded") {
                const token = await getToken();
                const res = await fetch(`${apiUrl}/business/wallet/topup/confirm`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify({ payment_intent_id: paymentIntent.id, amount_cents: amountCents }),
                });
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.detail || "Failed to credit wallet");
                }
                const data = await res.json();
                toast.success(`Wallet topped up by $${(amountCents / 100).toFixed(2)}`);
                onSuccess(data.new_balance_cents);
            }
        } catch (error) {
            toast.error((error as Error).message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6 pt-2">
            <PaymentElement />
            <div className="flex gap-3">
                <Button variant="outline" onClick={onBack} className="flex-1 rounded-full h-14 font-black text-xl border-zinc-200">
                    <ArrowLeft className="w-5 h-5 mr-2" /> Back
                </Button>
                <Button
                    onClick={handlePay}
                    disabled={isProcessing || !stripe || !elements}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white rounded-full h-14 font-black shadow-lg shadow-orange-500/20 text-xl active:scale-95 transition-all"
                >
                    {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : `Pay $${(amountCents / 100).toFixed(2)}`}
                </Button>
            </div>
            <p className="text-sm text-zinc-400 text-center font-medium">
                Payments processed securely via Stripe.
            </p>
        </div>
    );
}

export function TopUpDialog({ open, onOpenChange, currentBalance, onTopUpSuccess }: TopUpDialogProps) {
    const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
    const [customAmount, setCustomAmount] = useState("");
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [isCreatingIntent, setIsCreatingIntent] = useState(false);
    const { getToken } = useAuth();

    const apiUrl = "/api/backend";
    const amountCents = selectedAmount ?? (customAmount ? Math.round(parseFloat(customAmount) * 100) : 0);

    const handleProceedToPayment = async () => {
        if (amountCents < 500) { toast.error("Minimum top-up is $5.00"); return; }
        setIsCreatingIntent(true);
        try {
            const token = await getToken();
            const res = await fetch(`${apiUrl}/business/wallet/topup/intent`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ amount_cents: amountCents }),
            });
            if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "Failed to start payment"); }
            const data = await res.json();
            setClientSecret(data.client_secret);
        } catch (error) {
            toast.error((error as Error).message);
        } finally {
            setIsCreatingIntent(false);
        }
    };

    const handleSuccess = (newBalance: number) => {
        onTopUpSuccess?.(newBalance);
        setClientSecret(null);
        setSelectedAmount(null);
        setCustomAmount("");
        onOpenChange(false);
    };

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) { setClientSecret(null); setSelectedAmount(null); setCustomAmount(""); }
        onOpenChange(isOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-3xl font-black font-display">
                        <Wallet className="w-6 h-6 text-orange-500" /> Top Up Wallet
                    </DialogTitle>
                    <DialogDescription className="text-xl font-medium text-zinc-500">
                        {clientSecret
                            ? `Pay $${(amountCents / 100).toFixed(2)} — enter your card details below.`
                            : "Add funds to unlock leads instantly."}
                    </DialogDescription>
                </DialogHeader>

                {clientSecret ? (
                    <Elements
                        stripe={stripePromise}
                        options={{ clientSecret, appearance: { theme: "stripe" } }}
                    >
                        <PaymentForm
                            amountCents={amountCents}
                            onSuccess={handleSuccess}
                            onBack={() => setClientSecret(null)}
                            getToken={getToken}
                            apiUrl={apiUrl}
                        />
                    </Elements>
                ) : (
                    <div className="space-y-6 pt-2">
                        <div className={`text-center p-6 md:p-8 rounded-[24px] border-2 ${
                            currentBalance < MIN_WALLET_FLOOR_CENTS
                                ? "bg-red-50 border-red-100"
                                : currentBalance < 3000
                                ? "bg-amber-50 border-amber-100"
                                : "bg-zinc-50 border-zinc-100"
                        }`}>
                            <div className="text-xs md:text-sm font-black text-zinc-400 uppercase tracking-widest mb-2">Current Balance</div>
                            <div className={`text-5xl md:text-6xl font-black font-display tracking-tight ${
                                currentBalance < MIN_WALLET_FLOOR_CENTS ? "text-red-600" : "text-zinc-900"
                            }`}>
                                ${(currentBalance / 100).toFixed(2)}
                            </div>
                            {currentBalance < MIN_WALLET_FLOOR_CENTS && (
                                <p className="text-sm md:text-lg text-red-600 font-bold mt-3 leading-tight underline decoration-red-200 underline-offset-4">
                                    ⚠️ $25.00 minimum required to unlock leads
                                </p>
                            )}
                        </div>

                        <div>
                            <div className="text-sm md:text-base font-black text-zinc-500 uppercase tracking-widest mb-3 ml-1">Select amount</div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {TOPUP_AMOUNTS.map((amt) => (
                                    <button
                                        key={amt.cents}
                                        onClick={() => { setSelectedAmount(amt.cents); setCustomAmount(""); }}
                                        className={`h-14 md:h-16 rounded-2xl text-xl font-black border-2 transition-all active:scale-95 ${
                                            selectedAmount === amt.cents
                                                ? "bg-orange-500 text-white border-orange-500 shadow-xl shadow-orange-500/20 -translate-y-0.5"
                                                : "bg-white text-zinc-700 border-zinc-50 hover:border-orange-200"
                                        }`}
                                    >
                                        {amt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="text-sm md:text-base font-black text-zinc-500 uppercase tracking-widest mb-3 ml-1">Custom amount</div>
                            <div className="relative group">
                                <span className={`absolute left-5 top-1/2 -translate-y-1/2 font-black text-2xl transition-colors ${customAmount ? 'text-zinc-900' : 'text-zinc-300'}`}>$</span>
                                <input
                                    type="number"
                                    min="5"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={customAmount}
                                    onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                                    className="w-full h-16 md:h-18 pl-12 pr-6 rounded-[20px] bg-zinc-50 border-2 border-zinc-100 focus:bg-white focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5 transition-all outline-none text-2xl font-black text-zinc-900 placeholder:text-zinc-200 shadow-sm"
                                />
                            </div>
                        </div>

                        <Button
                            onClick={handleProceedToPayment}
                            disabled={isCreatingIntent || amountCents < 500}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-[24px] h-18 md:h-20 text-xl md:text-2xl font-black shadow-2xl shadow-orange-500/20 active:scale-95 transition-all mt-4"
                        >
                            {isCreatingIntent ? (
                                <div className="flex items-center gap-3">
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    <span>Processing...</span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-3">
                                    <Plus className="w-6 h-6" />
                                    <span>Continue {amountCents >= 500 ? `— $${(amountCents / 100).toFixed(2)}` : ""}</span>
                                </div>
                            )}
                        </Button>

                        <p className="text-xs md:text-sm text-zinc-400 text-center font-bold leading-relaxed px-4">
                            Secured by <span className="text-zinc-900">Stripe</span>. Funds are credited instantly but may take up to 24 hours to reflect on bank statements.
                        </p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
