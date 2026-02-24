"use client";

import { useState } from "react";

export function BusinessLogo({ logoUrl, name }: { logoUrl: string | null; name: string }) {
    const [failed, setFailed] = useState(false);

    if (logoUrl && !failed) {
        return (
            <img
                src={logoUrl}
                alt={name}
                width={48}
                height={48}
                className="w-full h-full object-cover"
                onError={() => setFailed(true)}
            />
        );
    }

    return (
        <div className="text-xl font-bold text-zinc-300 flex items-center justify-center w-full h-full">
            {name?.[0]}
        </div>
    );
}
