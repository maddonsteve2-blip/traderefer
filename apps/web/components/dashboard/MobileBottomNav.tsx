"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Gift, MessageSquare, Building2, Target, Users, User, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

const BUSINESS_TABS = [
    { label: "HOME", href: "/dashboard/business", icon: LayoutGrid, exact: true },
    { label: "LEADS", href: "/dashboard/business/sales?tab=leads", icon: Target, matchPrefixes: ["/dashboard/business/sales"] },
    { label: "MESSAGES", href: "/dashboard/business/messages", icon: MessageSquare, matchPrefixes: ["/dashboard/business/messages"] },
    { label: "PARTNERS", href: "/dashboard/business/force?tab=partners", icon: Users, matchPrefixes: ["/dashboard/business/force"] },
    { label: "ANALYTICS", href: "/dashboard/business/analytics", icon: BarChart3, matchPrefixes: ["/dashboard/business/analytics"] },
];

const REFERRER_TABS = [
    { label: "HOME", href: "/dashboard/referrer", icon: LayoutGrid, exact: true },
    { label: "NETWORK", href: "/dashboard/referrer/businesses", icon: Building2, matchPrefixes: ["/dashboard/referrer/businesses", "/dashboard/referrer/manage", "/dashboard/referrer/applications", "/dashboard/referrer/refer"] },
    { label: "MESSAGES", href: "/dashboard/referrer/messages", icon: MessageSquare, matchPrefixes: ["/dashboard/referrer/messages"] },
    { label: "REWARDS", href: "/dashboard/referrer/withdraw", icon: Gift, matchPrefixes: ["/dashboard/referrer/withdraw"] },
    { label: "PROFILE", href: "/dashboard/referrer/profile", icon: User, matchPrefixes: ["/dashboard/referrer/profile"] },
];

export function MobileBottomNav() {
    const pathname = usePathname();

    const isReferrer = pathname?.startsWith("/dashboard/referrer");
    const TABS = isReferrer ? REFERRER_TABS : BUSINESS_TABS;

    function isActive(href: string, exact?: boolean, matchPrefixes?: string[]) {
        if (exact) return pathname === href;
        if (matchPrefixes?.length) return matchPrefixes.some(prefix => pathname?.startsWith(prefix));
        return pathname?.startsWith(href.split('?')[0]);
    }

    return (
        <div className="lg:hidden fixed bottom-6 left-0 right-0 px-5 z-50 pointer-events-none">
            <div className="max-w-md mx-auto w-full pointer-events-auto">
                <nav className="bg-zinc-900 border border-white/10 rounded-[32px] p-1.5 flex items-center justify-between shadow-2xl shadow-black/40">
                    {TABS.map((tab) => {
                        const active = isActive(tab.href, tab.exact, tab.matchPrefixes);
                        const Icon = tab.icon;

                        return (
                            <Link
                                key={tab.label}
                                href={tab.href}
                                aria-label={tab.label}
                                className="relative flex-1 flex flex-col items-center justify-center py-2.5 outline-none transition-all"
                            >
                                {active && (
                                    <motion.div
                                        layoutId="activePill"
                                        className="absolute inset-0 bg-orange-500 rounded-[26px]"
                                        transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
                                    />
                                )}
                                <div className={`relative z-10 flex flex-col items-center gap-1 ${active ? 'text-white' : 'text-zinc-500'}`}>
                                    <Icon className="w-[18px] h-[18px]" />
                                    <span className="text-[10px] font-black tracking-wider uppercase leading-none">
                                        {tab.label}
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
