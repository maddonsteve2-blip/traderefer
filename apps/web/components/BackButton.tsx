"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export function BackButton() {
    const router = useRouter();
    return (
        <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 hover:text-orange-500 transition-colors font-black"
            style={{ fontSize: '16px' }}
        >
            <ChevronLeft className="w-5 h-5" /> Back
        </button>
    );
}
