"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Gift, MessageSquare, Building2, Target, Users, User, BarChart3 } from "lucide-react";

const BUSINESS_TABS = [
    { label: "Home", href: "/dashboard/business", icon: LayoutGrid, exact: true },
    { label: "Leads", href: "/dashboard/business/sales?tab=leads", icon: Target, matchPrefixes: ["/dashboard/business/sales"] },
    { label: "Messages", href: "/dashboard/business/messages", icon: MessageSquare, matchPrefixes: ["/dashboard/business/messages"] },
    { label: "Partners", href: "/dashboard/business/force?tab=partners", icon: Users, matchPrefixes: ["/dashboard/business/force"] },
    { label: "Analytics", href: "/dashboard/business/analytics", icon: BarChart3, matchPrefixes: ["/dashboard/business/analytics"] },
];

const REFERRER_TABS = [
    { label: "Home", href: "/dashboard/referrer", icon: LayoutGrid, exact: true },
    { label: "Network", href: "/dashboard/referrer/businesses", icon: Building2, matchPrefixes: ["/dashboard/referrer/businesses", "/dashboard/referrer/manage", "/dashboard/referrer/applications", "/dashboard/referrer/refer"] },
    { label: "Messages", href: "/dashboard/referrer/messages", icon: MessageSquare, matchPrefixes: ["/dashboard/referrer/messages"] },
    { label: "Rewards", href: "/dashboard/referrer/withdraw", icon: Gift, matchPrefixes: ["/dashboard/referrer/withdraw"] },
    { label: "Profile", href: "/dashboard/referrer/profile", icon: User, matchPrefixes: ["/dashboard/referrer/profile"] },
];

export function MobileBottomNav() {
    const pathname = usePathname();

    const isReferrer = pathname?.startsWith("/dashboard/referrer");
    const TABS = isReferrer ? REFERRER_TABS : BUSINESS_TABS;

    // Hide bottom nav on messages pages — keyboard + fixed nav conflict on iOS
    const isMessagesPage = pathname?.endsWith("/messages");
    if (isMessagesPage) return null;

    function isActive(href: string, exact?: boolean, matchPrefixes?: string[]) {
        if (exact) return pathname === href;
        if (matchPrefixes?.length) return matchPrefixes.some(prefix => pathname?.startsWith(prefix));
        return pathname?.startsWith(href.split('?')[0]);
    }

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-zinc-200" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="flex items-center justify-around">
                {TABS.map((tab) => {
                    const active = isActive(tab.href, tab.exact, tab.matchPrefixes);
                    const Icon = tab.icon;

                    return (
                        <Link
                            key={tab.label}
                            href={tab.href}
                            aria-label={tab.label}
                            className={`flex-1 flex flex-col items-center gap-0.5 py-2 pt-2.5 transition-colors ${
                                active ? 'text-orange-600' : 'text-zinc-400'
                            }`}
                        >
                            <Icon className="w-[22px] h-[22px]" strokeWidth={active ? 2.5 : 1.8} />
                            <span className={`text-[11px] leading-none ${active ? 'font-bold' : 'font-medium'}`}>
                                {tab.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
