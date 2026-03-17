"use client";

import { useState } from "react";

export function BusinessLogo({ logoUrl, name, size = "md", photoUrls }: { logoUrl: string | null; name: string; size?: "sm" | "md" | "lg"; photoUrls?: string[] }) {
    const [failed, setFailed] = useState(false);

    const sizeClasses = {
        sm: "w-12 h-12 text-xl",
        md: "w-20 h-20 text-3xl",
        lg: "w-full h-full text-5xl"
    };

    // Force HTTPS to avoid mixed-content warnings, proxy Google logos
    const safeUrl = logoUrl?.replace(/^http:\/\//i, 'https://') ?? null;
    const displayUrl = safeUrl?.includes("googleusercontent.com")
        ? `/api/logo-proxy?url=${encodeURIComponent(safeUrl)}`
        : safeUrl;

    if (displayUrl && !failed) {
        return (
            <div className={`${sizeClasses[size]} rounded-2xl overflow-hidden shadow-sm relative bg-[#f0f0f0] border border-zinc-200`}>
                <img
                    src={displayUrl}
                    alt={name}
                    width={400}
                    height={400}
                    className="w-full h-full object-contain p-2"
                    style={{ mixBlendMode: 'multiply' }}
                    onError={() => setFailed(true)}
                />
            </div>
        );
    }

    return (
        <div className={`${sizeClasses[size]} rounded-2xl bg-gradient-to-br from-zinc-200 to-zinc-100 flex items-center justify-center font-black text-zinc-600 overflow-hidden border border-zinc-200`}>
            <span className="transform select-none uppercase">{name?.[0]}</span>
        </div>
    );
}
