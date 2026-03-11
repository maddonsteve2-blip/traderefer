"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout-shared";

const STANDALONE_ROUTES = ["/login", "/register", "/signup", "/onboarding", "/claim", "/leads/verify", "/leads/success", "/admin", "/join"];
const NO_FOOTER_ROUTES = ["/dashboard", "/b/"];

export function ConditionalLayout({ children, footer }: { children: React.ReactNode; footer: React.ReactNode }) {
    const pathname = usePathname();
    const isStandalone = STANDALONE_ROUTES.some((route) => pathname?.startsWith(route));
    const hideFooter = NO_FOOTER_ROUTES.some((route) => pathname?.startsWith(route));

    if (isStandalone) {
        return <>{children}</>;
    }

    return (
        <>
            <Navbar />
            {children}
            {!hideFooter && footer}
        </>
    );
}
