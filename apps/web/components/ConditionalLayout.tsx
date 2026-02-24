"use client";

import { usePathname } from "next/navigation";
import { Navbar, Footer } from "@/components/layout-shared";

// Pages that have their own header/footer — hide the global Navbar & Footer
const STANDALONE_ROUTES = ["/login", "/register", "/signup", "/onboarding", "/leads/verify", "/leads/success", "/admin", "/join"];
const NO_FOOTER_ROUTES = ["/dashboard/business/messages", "/dashboard/referrer/messages"];

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isStandalone = STANDALONE_ROUTES.some((route) => pathname?.startsWith(route));

    if (isStandalone) {
        return <>{children}</>;
    }

    const hideFooter = NO_FOOTER_ROUTES.some((route) => pathname?.startsWith(route));

    return (
        <>
            <Navbar />
            {children}
            {!hideFooter && <Footer />}
        </>
    );
}
