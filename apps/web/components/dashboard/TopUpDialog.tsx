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
    { label: "$50", cents: 5000 },
    { label: "$100", cents: 10000 },
    { label: "$250", cents: 25000 },
    { label: "$500", cents: 50000 },
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
                <Button variant="outline" onClick={onBack} className="flex-1 rounded-full h-12 font-bold">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button
                    onClick={handlePay}
                    disabled={isProcessing || !stripe || !elements}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white rounded-full h-12 font-bold shadow-lg shadow-orange-500/20"
                >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : `Pay $${(amountCents / 100).toFixed(2)}`}
                </Button>
            </div>
            <p className="text-xs text-zinc-400 text-center">
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
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <Wallet className="w-5 h-5 text-orange-500" /> Top Up Wallet
                    </DialogTitle>
                    <DialogDescription>
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
                        <div className={`text-center p-4 rounded-2xl border ${
                            currentBalance < MIN_WALLET_FLOOR_CENTS
                                ? "bg-red-50 border-red-200"
                                : currentBalance < 3000
                                ? "bg-amber-50 border-amber-200"
                                : "bg-zinc-50 border-zinc-100"
                        }`}>
                            <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Current Balance</div>
                            <div className={`text-3xl font-black font-display ${
                                currentBalance < MIN_WALLET_FLOOR_CENTS ? "text-red-600" : "text-zinc-900"
                            }`}>
                                ${(currentBalance / 100).toFixed(2)}
                            </div>
                            {currentBalance < MIN_WALLET_FLOOR_CENTS && (
                                <p className="text-xs text-red-600 font-semibold mt-1">
                                    ⚠️ Minimum $25.00 balance required to unlock leads
                                </p>
                            )}
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
                            onClick={handleProceedToPayment}
                            disabled={isCreatingIntent || amountCents < 500}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-full py-6 h-auto text-base font-bold shadow-lg shadow-orange-500/20"
                        >
                            {isCreatingIntent ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Continue {amountCents >= 500 ? `— $${(amountCents / 100).toFixed(2)}` : ""}
                                </>
                            )}
                        </Button>

                        <p className="text-xs text-zinc-400 text-center">
                            Payments processed securely via Stripe. A minimum wallet balance of $25.00 is required to unlock leads.
                        </p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
