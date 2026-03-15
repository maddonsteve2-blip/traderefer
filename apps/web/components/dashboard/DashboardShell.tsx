"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import Image from "next/image";
import { Logo } from "@/components/Logo";
import {
    LayoutDashboard,
    Target,
    MessageSquare,
    Users,
    BarChart3,
    Settings,
    Gift,
    User,
    ChevronRight,
    LogOut,
    ArrowLeftRight,
    Menu,
    X,
    Megaphone,
    Tag,
    Building2,
    ClipboardList,
    UserCircle,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { MobileBottomNav } from "./MobileBottomNav";
import { motion } from "framer-motion";

const BUSINESS_NAV = [
    { label: "Overview",        href: "/dashboard/business",                        matchPath: "/dashboard/business",                 icon: LayoutDashboard, exact: true },
    { label: "Leads",           href: "/dashboard/business/sales?tab=leads",        matchPath: "/dashboard/business/sales",           icon: Target },
    { label: "Messages",        href: "/dashboard/business/messages",               matchPath: "/dashboard/business/messages",        icon: MessageSquare },
    { label: "Partners",        href: "/dashboard/business/force?tab=partners",     matchPath: "/dashboard/business/force",           icon: Users },
    { label: "Analytics",       href: "/dashboard/business/analytics",              matchPath: "/dashboard/business/analytics",       icon: BarChart3 },
    { label: "Public Profile",  href: "/dashboard/business/profile",                matchPath: "/dashboard/business/profile",         icon: UserCircle },
    { label: "Settings",        href: "/dashboard/business/settings",               matchPath: "/dashboard/business/settings",        icon: Settings },
];

const REFERRER_NAV = [
    { label: "Overview",        href: "/dashboard/referrer",                   matchPath: "/dashboard/referrer",                 icon: LayoutDashboard, exact: true },
    { label: "Network",         href: "/dashboard/referrer/businesses",        matchPath: "/dashboard/referrer/businesses",      icon: Building2 },
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
                        <span className="text-xl font-black tracking-tight leading-none uppercase whitespace-nowrap">
                            <span className="text-white">TRADE</span>
                            <span className="text-orange-500">REFER</span>
                        </span>
                    )}
                </Link>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
                {navLinks.map((item, i) => {
                    const active = isActive(item);
                    const Icon = item.icon;
                    return (
                        <motion.div
                            key={item.matchPath}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04, duration: 0.25 }}
                        >
                            <Link
                                href={item.href}
                                title={!expanded ? item.label : undefined}
                                aria-label={item.label}
                                onClick={onClose}
                                className={`relative flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-all duration-150 group ${
                                    active
                                        ? "bg-white/10 text-white"
                                        : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
                                }`}
                            >
                                {active && (
                                    <motion.span
                                        layoutId="sidebar-active"
                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-orange-400 rounded-full"
                                        transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                                    />
                                )}
                                <Icon
                                    className={`shrink-0 w-[18px] h-[18px] transition-colors ${
                                        active ? "text-orange-400" : "text-zinc-500 group-hover:text-zinc-200"
                                    }`}
                                />
                                {expanded && (
                                    <span className={`text-lg font-bold whitespace-nowrap truncate ${
                                        active ? "text-white" : "text-zinc-300 group-hover:text-white"
                                    }`}>
                                        {item.label}
                                    </span>
                                )}
                            </Link>
                        </motion.div>
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
                        <span className="text-lg font-bold text-zinc-400 group-hover:text-zinc-200 whitespace-nowrap truncate">
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
                        <span className="text-lg font-bold whitespace-nowrap">Sign Out</span>
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
                            <p className="text-base font-bold text-zinc-200 truncate leading-tight">
                                {user?.firstName} {user?.lastName}
                            </p>
                            <p className="text-sm text-zinc-500 truncate">
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
    const [expanded, setExpanded] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();
    const [currentSearch, setCurrentSearch] = useState("");
    const overlayRef = useRef<HTMLDivElement>(null);

    const isBusinessDashboard = pathname?.startsWith("/dashboard/business");
    const navLinks = isBusinessDashboard ? BUSINESS_NAV : REFERRER_NAV;

    useEffect(() => {
        if (typeof window === "undefined") return;
        setCurrentSearch(window.location.search);
    }, [pathname]);

    const currentParams = new URLSearchParams(currentSearch);
    const salesTab = currentParams.get("tab") ?? "leads";
    const forceTab = currentParams.get("tab") ?? "partners";

    const mobileBreadcrumb = (() => {
        if (pathname === "/dashboard/business") return { eyebrow: "Business", title: "Overview" };
        if (pathname?.startsWith("/dashboard/business/sales")) {
            if (salesTab === "offers") return { eyebrow: "Business", title: "Deals" };
            if (salesTab === "promotions") return { eyebrow: "Business", title: "Campaigns" };
            return { eyebrow: "Business", title: "Leads" };
        }
        if (pathname === "/dashboard/business/messages") return { eyebrow: "Business", title: "Messages" };
        if (pathname?.startsWith("/dashboard/business/force")) {
            if (forceTab === "applications") return { eyebrow: "Business", title: "Applications" };
            if (forceTab === "config") return { eyebrow: "Business", title: "Reward Structure" };
            return { eyebrow: "Business", title: "Partners" };
        }
        if (pathname?.startsWith("/dashboard/business/referrers/")) return { eyebrow: "Business", title: "Referrer Details" };
        if (pathname === "/dashboard/business/analytics") return { eyebrow: "Business", title: "Analytics" };
        if (pathname === "/dashboard/business/profile") return { eyebrow: "Business", title: "Public Profile" };
        if (pathname === "/dashboard/business/settings") return { eyebrow: "Business", title: "Settings" };

        if (pathname === "/dashboard/referrer") return { eyebrow: "Referrer", title: "Overview" };
        if (pathname === "/dashboard/referrer/businesses") return { eyebrow: "Referrer", title: "Network" };
        if (pathname?.startsWith("/dashboard/referrer/refer/")) return { eyebrow: "Referrer", title: "Business Details" };
        if (pathname === "/dashboard/referrer/manage") return { eyebrow: "Referrer", title: "My Team" };
        if (pathname === "/dashboard/referrer/messages") return { eyebrow: "Referrer", title: "Messages" };
        if (pathname === "/dashboard/referrer/applications") return { eyebrow: "Referrer", title: "Applications" };
        if (pathname === "/dashboard/referrer/withdraw") return { eyebrow: "Referrer", title: "Rewards" };
        if (pathname === "/dashboard/referrer/profile") return { eyebrow: "Referrer", title: "My Profile" };

        return { eyebrow: isBusinessDashboard ? "Business" : "Referrer", title: "Dashboard" };
    })();

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
            <div className="lg:hidden fixed top-0 left-0 right-0 h-[60px] bg-white border-b border-zinc-100 flex items-center px-4 z-40 gap-3">
                <button
                    onClick={() => setMobileOpen(true)}
                    aria-label="Open menu"
                    className="flex items-center justify-center w-10 h-10 rounded-2xl border border-zinc-200 text-zinc-700"
                >
                    <Menu className="w-5 h-5" />
                </button>

                <Link href="/" className="flex items-center gap-2 shrink-0">
                    <Logo size="sm" />
                </Link>

                <div className="min-w-0 flex-1">
                    <p className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">
                        {mobileBreadcrumb.eyebrow}
                    </p>
                    <p className="truncate text-[15px] font-black text-zinc-900">
                        {mobileBreadcrumb.title}
                    </p>
                </div>

                {/* Role switcher */}
                <Link
                    href={isBusinessDashboard ? "/dashboard/referrer" : "/dashboard/business"}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-600 text-white text-[11px] font-black uppercase tracking-widest shrink-0"
                >
                    <ArrowLeftRight className="w-3 h-3" />
                    {isBusinessDashboard ? "Referrer" : "Business"}
                </Link>

                <NotificationBell />
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
                } pt-[60px] lg:pt-0 pb-32 lg:pb-0`}
            >
                {children}
            </main>

            {/* ── MOBILE BOTTOM NAV ── */}
            <MobileBottomNav />
        </div>
    );
}
