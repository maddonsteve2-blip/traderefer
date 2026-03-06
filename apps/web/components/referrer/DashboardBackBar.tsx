"use client";
import { useAuth } from "@clerk/nextjs";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export function DashboardBackBar() {
    const { isSignedIn } = useAuth();
    if (!isSignedIn) return null;
    return (
        <div className="bg-zinc-900 text-white py-3 px-4 fixed top-0 left-0 right-0 z-50">
            <div className="container mx-auto flex items-center">
                <Link href="/dashboard/referrer" className="flex items-center gap-2 text-sm font-bold text-zinc-300 hover:text-white transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                    Back to Dashboard
                </Link>
            </div>
        </div>
    );
}
