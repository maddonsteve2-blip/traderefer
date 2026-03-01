"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

interface DashboardErrorProps {
    fetchError?: string | null;
}

export function DashboardError({ fetchError }: DashboardErrorProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
            <div className="text-center p-8 bg-white rounded-3xl border shadow-sm max-w-md w-full">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">⚠️</span>
                </div>
                <h2 className="text-xl font-bold mb-2 text-zinc-900">Dashboard Unavailable</h2>
                <p className="text-zinc-500 mb-4 text-sm">We couldn&apos;t load your business profile. The server may be temporarily unavailable.</p>
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
