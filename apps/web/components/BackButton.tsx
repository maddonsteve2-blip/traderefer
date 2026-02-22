"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export function BackButton() {
    const router = useRouter();
    return (
        <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm font-bold text-zinc-400 hover:text-orange-500 transition-colors"
        >
            <ChevronLeft className="w-4 h-4" /> Back
        </button>
    );
}
