"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { ChevronLeft } from "lucide-react";

export function BackToDashboard() {
    const { isSignedIn } = useAuth();

    if (!isSignedIn) return null;

    return (
        <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-zinc-400 hover:text-orange-500 transition-colors mb-6"
        >
            <ChevronLeft className="w-4 h-4" />
            Back to My Dashboard
        </Link>
    );
}
