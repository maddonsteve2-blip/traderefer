"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { ReferrerShareKit } from "@/components/referrer/ShareKit";
import { Lock } from "lucide-react";
import Link from "next/link";

interface ShareKitGateProps {
    slug: string;
    businessName: string;
    tradeCategory: string;
    suburb: string;
    commission: number;
    deals: any[];
}

export function ShareKitGate({
    slug,
    businessName,
    tradeCategory,
    suburb,
    commission,
    deals,
}: ShareKitGateProps) {
    const { isSignedIn, getToken } = useAuth();
    const [linked, setLinked] = useState<boolean | null>(null);

    useEffect(() => {
        if (!isSignedIn) {
            setLinked(false);
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const token = await getToken();
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
                const res = await fetch(`${apiUrl}/referrer/is-linked/${slug}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!cancelled && res.ok) {
                    const data = await res.json();
                    setLinked(data.linked);
                } else if (!cancelled) {
                    setLinked(false);
                }
            } catch {
                if (!cancelled) setLinked(false);
            }
        })();
        return () => { cancelled = true; };
    }, [isSignedIn, slug, getToken]);

    if (linked === null) {
        return (
            <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 bg-zinc-100 rounded-lg animate-pulse" />
                ))}
            </div>
        );
    }

    if (!linked) {
        return (
            <div className="flex flex-col items-center gap-6 py-12 px-8 text-center bg-zinc-50/50 rounded-3xl border border-zinc-200 border-dashed">
                <div className="w-16 h-16 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center shadow-sm">
                    <Lock className="w-6 h-6 text-zinc-400" />
                </div>
                <div className="space-y-2">
                    <p className="text-base font-black text-zinc-900 uppercase tracking-widest">Referrers Exclusive</p>
                    <p className="text-base text-zinc-500 font-medium leading-relaxed max-w-[280px] mx-auto">
                        {isSignedIn
                            ? "Start referring this business to unlock your custom Share Kit & tracking link."
                            : "Sign in and start referring to unlock your custom Share Kit & tracking link."}
                    </p>
                </div>
                {!isSignedIn && (
                    <Link
                        href="/login"
                        className="text-base font-black text-zinc-900 hover:text-orange-600 underline decoration-zinc-300 hover:decoration-orange-600 transition-all underline-offset-4"
                    >
                        Sign in to unlock
                    </Link>
                )}
            </div>
        );
    }

    return (
        <ReferrerShareKit
            businessName={businessName}
            tradeCategory={tradeCategory}
            suburb={suburb}
            slug={slug}
            commission={commission}
            deals={deals}
        />
    );
}
