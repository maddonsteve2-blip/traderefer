"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

interface DashboardErrorProps {
    fetchError?: string | null;
    noProfile?: boolean;
    profileType?: "business" | "referrer";
}

export function DashboardError({ fetchError, noProfile, profileType = "business" }: DashboardErrorProps) {
    if (noProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
                <div className="text-center p-8 bg-white rounded-3xl border shadow-sm max-w-md w-full">
                    <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">🏗️</span>
                    </div>
                    <h2 className="text-xl font-bold mb-2 text-zinc-900">No Profile Found</h2>
                    <p className="text-zinc-500 mb-6 text-sm">
                        Your {profileType} profile hasn&apos;t been set up yet, or wasn&apos;t saved correctly.
                        Complete the setup to access your dashboard.
                    </p>
                    <Link
                        href={`/onboarding/${profileType}`}
                        className="block w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full px-8 py-2.5 font-bold text-center transition-colors"
                    >
                        Set Up {profileType === "business" ? "Business" : "Referrer"} Profile
                    </Link>
                    <p className="text-xs text-zinc-400 mt-4">
                        Wrong account? <Link href="/support" className="text-orange-600 hover:underline">Contact support</Link>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
            <div className="text-center p-8 bg-white rounded-3xl border shadow-sm max-w-md w-full">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">⚠️</span>
                </div>
                <h2 className="text-xl font-bold mb-2 text-zinc-900">Dashboard Unavailable</h2>
                <p className="text-zinc-500 mb-4 text-sm">We couldn&apos;t load your profile. The server may be temporarily unavailable.</p>
                {fetchError && (
                    <p className="text-xs text-red-500 mb-4 bg-red-50 p-2 rounded-lg font-mono">{fetchError}</p>
                )}
                <Button 
                    onClick={() => window.location.reload()} 
                    className="bg-orange-500 hover:bg-orange-600 rounded-full px-8 w-full"
                >
                    Retry Connection
                </Button>
                <p className="text-xs text-zinc-400 mt-4">
                    If this persists, please <Link href="/support" className="text-orange-600 hover:underline">contact support</Link>
                </p>
            </div>
        </div>
    );
}
