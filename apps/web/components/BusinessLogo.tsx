"use client";

import { useState } from "react";

export function BusinessLogo({ logoUrl, name, size = "md", photoUrls }: { logoUrl: string | null; name: string; size?: "sm" | "md" | "lg"; photoUrls?: string[] }) {
    const [failed, setFailed] = useState(false);

    const sizeClasses = {
        sm: "w-10 h-10 text-xl",
        md: "w-16 h-16 text-3xl",
        lg: "w-24 h-24 text-5xl"
    };

    // Force HTTPS to avoid mixed-content warnings, proxy Google logos
    const safeUrl = logoUrl?.replace(/^http:\/\//i, 'https://') ?? null;
    const displayUrl = safeUrl?.includes("googleusercontent.com")
        ? `/api/logo-proxy?url=${encodeURIComponent(safeUrl)}`
        : safeUrl;

    if (displayUrl && !failed) {
        return (
            <div className={`${sizeClasses[size]} rounded-2xl overflow-hidden border-2 border-white shadow-sm ring-1 ring-zinc-200 relative bg-white`}>
                <img
                    src={displayUrl}
                    alt={name}
                    width={200}
                    height={200}
                    className="w-full h-full object-contain p-1"
                    onError={() => setFailed(true)}
                />
            </div>
        );
    }

    return (
        <div className={`${sizeClasses[size]} rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-50 flex items-center justify-center font-black text-zinc-900 overflow-hidden shadow-inner border-2 border-white ring-1 ring-zinc-200`}>
            <span className="transform drop-shadow-sm select-none uppercase">{name?.[0]}</span>
        </div>
    );
}
