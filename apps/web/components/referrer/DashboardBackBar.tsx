"use client";
import { useAuth } from "@clerk/nextjs";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export function DashboardBackBar() {
    const { isSignedIn } = useAuth();
    if (!isSignedIn) return null;
    return (
        <div className="bg-orange-600 text-white py-4 px-6 fixed top-0 left-0 right-0 z-50 shadow-xl shadow-orange-500/20">
            <div className="container mx-auto flex items-center">
                <Link href="/dashboard/referrer" className="flex items-center gap-2.5 hover:text-orange-400 transition-all font-black group" style={{ fontSize: '17px' }}>
                    <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                    Back to Dashboard
                </Link>
            </div>
        </div>
    );
}
