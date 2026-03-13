'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';

interface StripeConnectButtonProps {
    type: 'business' | 'referrer';
}

export function StripeConnectButton({ type }: StripeConnectButtonProps) {
    const [loading, setLoading] = useState(false);
    const { userId, getToken } = useAuth();

    const handleConnect = async () => {
        if (!userId) {
            toast.error("Please sign in first");
            return;
        }

        setLoading(true);
        try {
            const endpoint = type === 'business'
                ? '/business/stripe/connect'
                : '/referrer/stripe/connect';

            const token = await getToken();
            const res = await fetch(`/api/backend${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) throw new Error("Failed to start onboarding");

            const { url } = await res.json();
            window.location.href = url;
        } catch (error) {
            console.error(error);
            toast.error("Stripe connection failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            onClick={handleConnect}
            disabled={loading}
            className="w-full bg-[#635bff] hover:bg-[#5851d8] text-white rounded-full font-black h-16 flex items-center justify-center gap-3 text-2xl shadow-xl shadow-indigo-200 active:scale-95 transition-all"
        >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <CreditCard className="w-6 h-6" />}
            Connect Stripe for Payouts
        </Button>
    );
}
