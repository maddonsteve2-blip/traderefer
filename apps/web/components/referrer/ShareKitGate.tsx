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
            <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-zinc-400" />
                </div>
                <div>
                    <p className="text-sm font-bold text-zinc-700">Referrers only</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                        {isSignedIn
                            ? "Start referring this business to unlock the Share Kit."
                            : "Sign in and start referring to unlock the Share Kit."}
                    </p>
                </div>
                {!isSignedIn && (
                    <Link
                        href="/login"
                        className="text-xs font-bold text-orange-500 hover:text-orange-600 underline"
                    >
                        Sign in
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
