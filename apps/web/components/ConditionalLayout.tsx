"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout-shared";

const STANDALONE_ROUTES = ["/login", "/register", "/signup", "/onboarding", "/leads/verify", "/leads/success", "/admin", "/join"];

export function ConditionalLayout({ children, footer }: { children: React.ReactNode; footer: React.ReactNode }) {
    const pathname = usePathname();
    const isStandalone = STANDALONE_ROUTES.some((route) => pathname?.startsWith(route));

    if (isStandalone) {
        return <>{children}</>;
    }

    return (
        <>
            <Navbar />
            {children}
            {footer}
        </>
    );
}
