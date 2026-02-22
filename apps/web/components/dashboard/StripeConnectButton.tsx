'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';

interface StripeConnectButtonProps {
    type: 'business' | 'referrer';
}

export function StripeConnectButton({ type }: StripeConnectButtonProps) {
    const [loading, setLoading] = useState(false);
    const { userId, getToken } = useAuth();

    const handleConnect = async () => {
        if (!userId) {
            alert("Please sign in first");
            return;
        }

        setLoading(true);
        try {
            const endpoint = type === 'business'
                ? '/business/stripe/connect'
                : '/referrer/stripe/connect';

            const token = await getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${endpoint}`, {
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
            alert("Stripe connection failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            onClick={handleConnect}
            disabled={loading}
            className="w-full bg-[#635bff] hover:bg-[#5851d8] text-white rounded-full font-bold h-12 flex items-center gap-2"
        >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
            Connect Stripe for Payouts
        </Button>
    );
}
