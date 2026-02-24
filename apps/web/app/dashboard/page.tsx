"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

export default function DashboardRedirect() {
    const router = useRouter();
    const { getToken, isLoaded, isSignedIn } = useAuth();

    useEffect(() => {
        if (!isLoaded) return;
        if (!isSignedIn) {
            router.push("/login");
            return;
        }

        async function resolveDashboard() {
            try {
                const token = await getToken();
                if (!token) return;

                const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
                const headers = { 'Authorization': `Bearer ${token}` };

                // Check both roles in parallel
                const [bizRes, refRes] = await Promise.all([
                    fetch(`${apiBase}/business/me`, { headers }),
                    fetch(`${apiBase}/referrer/me`, { headers })
                ]);

                if (bizRes.ok) {
                    router.push("/dashboard/business");
                    return;
                }

                if (refRes.ok) {
                    router.push("/dashboard/referrer");
                    return;
                }

                // Neither role found — send to onboarding choice
                router.push("/onboarding");
            } catch (err) {
                console.error("Redirect error", err);
                router.push("/onboarding");
            }
        }

        resolveDashboard();
    }, [isLoaded, isSignedIn, getToken, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-zinc-500 font-bold animate-pulse">Redirecting to your dashboard...</p>
            </div>
        </div>
    );
}
