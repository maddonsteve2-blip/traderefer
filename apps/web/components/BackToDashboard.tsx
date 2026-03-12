"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";

export function BackToDashboard() {
    const { isSignedIn } = useAuth();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted || !isSignedIn) return null;

    return (
        <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 hover:text-orange-500 transition-colors mb-8 font-black"
            style={{ fontSize: '16px' }}
        >
            <ChevronLeft className="w-5 h-5" />
            Back to My Dashboard
        </Link>
    );
}
