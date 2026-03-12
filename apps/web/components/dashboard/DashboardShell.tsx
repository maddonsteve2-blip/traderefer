"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import Image from "next/image";
import {
    LayoutDashboard,
    Target,
    MessageSquare,
    Users,
    ClipboardList,
    BarChart3,
    Globe,
    Settings,
    Search,
    Gift,
    User,
    ChevronRight,
    LogOut,
    ArrowLeftRight,
    Menu,
    X,
    Megaphone,
    Tag,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";

const BUSINESS_NAV = [
    { label: "Overview",        href: "/dashboard/business",                        matchPath: "/dashboard/business",                 icon: LayoutDashboard, exact: true },
    { label: "Leads",           href: "/dashboard/business/sales?tab=leads",        matchPath: "/dashboard/business/sales",           icon: Target },
    { label: "Messages",        href: "/dashboard/business/messages",               matchPath: "/dashboard/business/messages",        icon: MessageSquare },
    { label: "Referral Force",  href: "/dashboard/business/force?tab=partners",     matchPath: "/dashboard/business/force",           icon: Users },
    { label: "Deals",           href: "/dashboard/business/sales?tab=offers",       matchPath: "/dashboard/business/deals",           icon: Tag },
    { label: "Campaigns",       href: "/dashboard/business/sales?tab=promotions",   matchPath: "/dashboard/business/campaigns",       icon: Megaphone },
    { label: "Analytics",       href: "/dashboard/business/analytics",              matchPath: "/dashboard/business/analytics",       icon: BarChart3 },
    { label: "Profile",         href: "/dashboard/business/profile",                matchPath: "/dashboard/business/profile",         icon: Globe },
    { label: "Settings",        href: "/dashboard/business/settings",               matchPath: "/dashboard/business/settings",        icon: Settings },
];

const REFERRER_NAV = [
    { label: "Overview",        href: "/dashboard/referrer",                   matchPath: "/dashboard/referrer",                 icon: LayoutDashboard, exact: true },
    { label: "Find Businesses", href: "/dashboard/referrer/businesses",        matchPath: "/dashboard/referrer/businesses",      icon: Search },
    { label: "My Team",         href: "/dashboard/referrer/manage",            matchPath: "/dashboard/referrer/manage",          icon: Users },
    { label: "Messages",        href: "/dashboard/referrer/messages",          matchPath: "/dashboard/referrer/messages",        icon: MessageSquare },
    { label: "Applications",    href: "/dashboard/referrer/applications",      matchPath: "/dashboard/referrer/applications",    icon: ClipboardList },
    { label: "Rewards",         href: "/dashboard/referrer/withdraw",          matchPath: "/dashboard/referrer/withdraw",        icon: Gift },
    { label: "My Profile",      href: "/dashboard/referrer/profile",           matchPath: "/dashboard/referrer/profile",         icon: User },
];

interface NavItem {
    label: string;
    href: string;
    matchPath: string;
    icon: React.ElementType;
    exact?: boolean;
}

function SidebarContent({
    expanded,
    navLinks,
    isBusinessDashboard,
    onClose,
}: {
    expanded: boolean;
    navLinks: NavItem[];
    isBusinessDashboard: boolean;
    onClose?: () => void;
}) {
    const pathname = usePathname();
    const { signOut } = useClerk();
    const { user } = useUser();

    const initials = user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0] ?? "U";
    const avatarUrl = user?.imageUrl;

    function isActive(item: NavItem) {
        if (item.exact) return pathname === item.matchPath;
        return pathname?.startsWith(item.matchPath) ?? false;
    }

    return (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center h-16 shrink-0 border-b border-zinc-800 overflow-hidden px-3">
                <Link href="/" className={`flex items-center gap-2.5 ${!expanded ? "justify-center w-full" : ""}`} onClick={onClose}>
                    <Image
                        src="/logo-dark.png"
                        alt="TradeRefer"
                        width={32}
                        height={32}
                        className="rounded-lg shrink-0"
                        priority
                    />
                    {expanded && (
                        <span className="text-base font-black tracking-tight leading-none uppercase whitespace-nowrap">
                            <span className="text-white">TRADE</span>
                            <span className="text-orange-500">REFER</span>
                        </span>
                    )}
                </Link>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
                {navLinks.map((item) => {
                    const active = isActive(item);
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.matchPath}
                            href={item.href}
                            title={!expanded ? item.label : undefined}
                            onClick={onClose}
                            className={`relative flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-all duration-150 group ${
                                active
                                    ? "bg-white/10 text-white"
                                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
                            }`}
                        >
                            {/* Active indicator bar */}
                            {active && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-orange-400 rounded-full" />
                            )}
                            <Icon
                                className={`shrink-0 w-[18px] h-[18px] transition-colors ${
                                    active ? "text-orange-400" : "text-zinc-500 group-hover:text-zinc-200"
                                }`}
                            />
                            {expanded && (
                                <span className={`text-sm font-semibold whitespace-nowrap truncate ${
                                    active ? "text-white" : "text-zinc-300 group-hover:text-white"
                                }`}>
                                    {item.label}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom section */}
            <div className="shrink-0 border-t border-zinc-800 px-2 py-3 space-y-0.5">
                {/* Role switch */}
                <Link
                    href={isBusinessDashboard ? "/dashboard/referrer" : "/dashboard/business"}
                    onClick={onClose}
                    title={!expanded ? (isBusinessDashboard ? "Switch to Referrer" : "Switch to Business") : undefined}
                    className="flex items-center gap-3 rounded-xl px-2.5 py-2 text-zinc-500 hover:bg-white/5 hover:text-zinc-200 transition-all group"
                >
                    <ArrowLeftRight className="shrink-0 w-[18px] h-[18px]" />
                    {expanded && (
                        <span className="text-sm font-semibold text-zinc-400 group-hover:text-zinc-200 whitespace-nowrap truncate">
                            {isBusinessDashboard ? "Switch to Referrer" : "Switch to Business"}
                        </span>
                    )}
                </Link>

                {/* Sign out */}
                <button
                    onClick={() => signOut({ redirectUrl: "/" })}
                    title={!expanded ? "Sign Out" : undefined}
                    className="w-full flex items-center gap-3 rounded-xl px-2.5 py-2 text-zinc-500 hover:bg-red-900/20 hover:text-red-400 transition-all group"
                >
                    <LogOut className="shrink-0 w-[18px] h-[18px]" />
                    {expanded && (
                        <span className="text-sm font-semibold whitespace-nowrap">Sign Out</span>
                    )}
                </button>

                {/* User avatar */}
                <div className={`flex items-center gap-3 px-2.5 py-2 ${!expanded ? "justify-center" : ""}`}>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center overflow-hidden shrink-0 ring-1 ring-white/10">
                        {avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-white text-xs font-black uppercase">{initials}</span>
                        )}
                    </div>
                    {expanded && (
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-zinc-200 truncate leading-tight">
                                {user?.firstName} {user?.lastName}
                            </p>
                            <p className="text-[10px] text-zinc-500 truncate">
                                {user?.emailAddresses?.[0]?.emailAddress}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
    const [expanded, setExpanded] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();
    const overlayRef = useRef<HTMLDivElement>(null);

    const isBusinessDashboard = pathname?.startsWith("/dashboard/business");
    const navLinks = isBusinessDashboard ? BUSINESS_NAV : REFERRER_NAV;

    // Close mobile menu on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [mobileOpen]);

    return (
        <div className="flex min-h-screen bg-zinc-50">

            {/* ── DESKTOP SIDEBAR ── */}
            <aside
                className={`hidden lg:flex flex-col fixed left-0 top-0 h-screen z-40 bg-[#09090B] border-r border-zinc-800 transition-all duration-300 ease-in-out ${
                    expanded ? "w-60" : "w-16"
                }`}
            >
                {/* Toggle button */}
                <button
                    onClick={() => setExpanded(e => !e)}
                    aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
                    className={`absolute -right-3 top-[68px] w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all z-50 ${
                        expanded ? "rotate-180" : ""
                    }`}
                >
                    <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <SidebarContent
                    expanded={expanded}
                    navLinks={navLinks}
                    isBusinessDashboard={!!isBusinessDashboard}
                />
            </aside>

            {/* ── MOBILE TOP BAR ── */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#09090B] border-b border-zinc-800 flex items-center px-4 z-40">
                <button
                    onClick={() => setMobileOpen(true)}
                    aria-label="Open menu"
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all mr-3"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <Link href="/" className="flex items-center gap-2">
                    <Image
                        src="/logo-dark.png"
                        alt="TradeRefer"
                        width={28}
                        height={28}
                        className="rounded-lg"
                        priority
                    />
                    <span className="text-base font-black tracking-tight leading-none uppercase">
                        <span className="text-white">TRADE</span>
                        <span className="text-orange-500">REFER</span>
                    </span>
                </Link>
                <div className="ml-auto">
                    <NotificationBell />
                </div>
            </div>

            {/* ── MOBILE DRAWER OVERLAY ── */}
            {mobileOpen && (
                <div
                    ref={overlayRef}
                    className="lg:hidden fixed inset-0 z-50 flex"
                    onClick={(e) => { if (e.target === overlayRef.current) setMobileOpen(false); }}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />

                    {/* Drawer */}
                    <div className="relative w-64 bg-[#09090B] h-full flex flex-col shadow-2xl">
                        {/* Close button */}
                        <button
                            onClick={() => setMobileOpen(false)}
                            className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <SidebarContent
                            expanded={true}
                            navLinks={navLinks}
                            isBusinessDashboard={!!isBusinessDashboard}
                            onClose={() => setMobileOpen(false)}
                        />
                    </div>
                </div>
            )}

            {/* ── MAIN CONTENT ── */}
            <main
                className={`flex-1 min-w-0 transition-all duration-300 ease-in-out ${
                    expanded ? "lg:ml-60" : "lg:ml-16"
                } pt-14 lg:pt-0`}
            >
                {children}
            </main>
        </div>
    );
}
