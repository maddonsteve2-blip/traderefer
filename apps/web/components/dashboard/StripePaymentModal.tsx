'use client';

import { useState, FormEvent } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2, X } from 'lucide-react';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

interface StripePaymentModalProps {
    clientSecret: string;
    onSuccess: () => void;
    onCancel: () => void;
}

function CheckoutForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setLoading(true);
        setError(null);

        const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
            elements,
            redirect: 'if_required',
        });

        if (stripeError) {
            setError(stripeError.message || 'An unexpected error occurred.');
            setLoading(false);
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            onSuccess();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <PaymentElement />
            </div>
            {error && <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 font-bold">{error}</div>}
            <div className="flex gap-3">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onCancel}
                    className="flex-1 rounded-full text-zinc-400 hover:text-zinc-600 h-12"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={!stripe || loading}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white rounded-full font-bold h-12 shadow-lg shadow-orange-500/20"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Unlock Lead'}
                </Button>
            </div>
        </form>
    );
}

export function StripePaymentModal({ clientSecret, onSuccess, onCancel }: StripePaymentModalProps) {
    return (
        <Dialog open={true} onOpenChange={onCancel}>
            <DialogContent className="sm:max-w-lg rounded-[32px] border-none shadow-2xl p-8">
                <DialogHeader className="mb-6">
                    <DialogTitle className="text-2xl font-black text-zinc-900 font-display">
                        Unlock Lead Details
                    </DialogTitle>
                    <DialogDescription className="text-zinc-500 font-medium">
                        Your payment is secured and processed by Stripe. Details will be revealed immediately after.
                    </DialogDescription>
                </DialogHeader>

                <Elements
                    stripe={stripePromise}
                    options={{
                        clientSecret,
                        appearance: {
                            theme: 'stripe',
                            variables: {
                                colorPrimary: '#f97316',
                                borderRadius: '16px',
                                colorBackground: '#ffffff',
                                colorText: '#18181b',
                            }
                        }
                    }}
                >
                    <CheckoutForm onSuccess={onSuccess} onCancel={onCancel} />
                </Elements>
            </DialogContent>
        </Dialog>
    );
}
