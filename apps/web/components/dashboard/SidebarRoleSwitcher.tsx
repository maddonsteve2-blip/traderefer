"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Building2, Rocket } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
    currentRole: "business" | "referrer";
}

export function SidebarRoleSwitcher({ currentRole }: Props) {
    const { user } = useUser();
    const { getToken, isLoaded, userId } = useAuth();
    const router = useRouter();
    const [fading, setFading] = useState(false);
    const [dbRoleStatus, setDbRoleStatus] = useState<{ hasBusiness: boolean; hasReferrer: boolean } | null>(null);

    useEffect(() => {
        if (!isLoaded || !userId) {
            setDbRoleStatus(null);
            return;
        }

        let cancelled = false;

        getToken().then(async (token) => {
            if (!token) return;

            try {
                const res = await fetch("/api/backend/auth/status", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) return;

                const data = await res.json();
                if (!cancelled) {
                    setDbRoleStatus({
                        hasBusiness: !!data.has_business,
                        hasReferrer: !!data.has_referrer,
                    });
                }
            } catch {
            }
        });

        return () => {
            cancelled = true;
        };
    }, [getToken, isLoaded, userId]);

    const roles = (user?.publicMetadata?.roles as string[] | undefined) ?? [];
    const role = user?.publicMetadata?.role as string | undefined;
    const effectiveRoles = roles.length > 0 ? roles : role ? [role] : [];
    const hasBusiness = dbRoleStatus?.hasBusiness ?? effectiveRoles.includes("business");
    const hasReferrer = dbRoleStatus?.hasReferrer ?? effectiveRoles.includes("referrer");
    const isDual = hasBusiness && hasReferrer;

    const targetHref = currentRole === "business" ? "/dashboard/referrer" : "/dashboard/business";
    const targetLabel = currentRole === "business" ? "Referrer" : "Business";
    const TargetIcon = currentRole === "business" ? Rocket : Building2;

    const handleSwitch = () => {
        setFading(true);
        setTimeout(() => router.push(targetHref), 280);
    };

    if (!isDual) return null;

    return (
        <>
            {fading && (
                <div
                    className="fixed inset-0 z-[9998] bg-zinc-200/80 backdrop-blur-sm transition-opacity duration-300"
                    style={{ opacity: fading ? 1 : 0 }}
                />
            )}
            <button
                onClick={handleSwitch}
                className="w-full flex items-center gap-3 p-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl font-bold transition-all group"
            >
                <div className="w-9 h-9 bg-orange-500/20 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-orange-500/30 transition-colors">
                    <TargetIcon className="w-5 h-5 text-orange-400" />
                </div>
                <div className="text-left">
                    <p className="text-sm font-black text-white leading-tight">Switch to {targetLabel} Mode</p>
                    <p className="text-xs text-zinc-400 font-medium">Open {targetLabel} Dashboard</p>
                </div>
                <ArrowLeftRight className="w-4 h-4 text-zinc-500 ml-auto group-hover:text-orange-400 transition-colors" />
            </button>
        </>
    );
}
