"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import Image from "next/image";
import {
    LayoutDashboard,
    Building2,
    Wrench,
    Users,
    Target,
    Search,
    Settings,
    Megaphone,
    ChevronRight,
    LogOut,
    ArrowLeftRight,
    Menu,
    X,
    ShieldAlert,
    FolderSearch,
    ImagePlus,
    Globe,
    Database,
    Mail,
} from "lucide-react";
import { motion } from "framer-motion";

interface NavItem {
    label: string;
    href: string;
    matchPath: string;
    icon: React.ElementType;
    exact?: boolean;
}

interface NavGroup {
    title: string;
    items: NavItem[];
}

const ADMIN_NAV: NavGroup[] = [
    {
        title: "Overview",
        items: [
            { label: "Dashboard", href: "/admin", matchPath: "/admin", icon: LayoutDashboard, exact: true },
        ],
    },
    {
        title: "Directory",
        items: [
            { label: "Businesses", href: "/admin/directory", matchPath: "/admin/directory", icon: Building2 },
            { label: "Fill & Scrape", href: "/admin/tools", matchPath: "/admin/tools", icon: Wrench },
            { label: "Fill Queue", href: "/admin/fill-queue", matchPath: "/admin/fill-queue", icon: FolderSearch },
        ],
    },
    {
        title: "Users",
        items: [
            { label: "User Management", href: "/admin/users", matchPath: "/admin/users", icon: Users },
            { label: "Leads & Disputes", href: "/admin/leads", matchPath: "/admin/leads", icon: Target },
        ],
    },
    {
        title: "Analytics",
        items: [
            { label: "SEO & Search", href: "/admin/seo", matchPath: "/admin/seo", icon: Search },
            { label: "Outreach", href: "/admin/outreach", matchPath: "/admin/outreach", icon: Mail },
        ],
    },
    {
        title: "Config",
        items: [
            { label: "Campaigns", href: "/admin/campaigns", matchPath: "/admin/campaigns", icon: Megaphone },
            { label: "Notifications", href: "/admin/notifications", matchPath: "/admin/notifications", icon: Megaphone },
            { label: "Settings", href: "/admin/settings", matchPath: "/admin/settings", icon: Settings },
        ],
    },
];

function SidebarContent({
    expanded,
    onClose,
}: {
    expanded: boolean;
    onClose?: () => void;
}) {
    const pathname = usePathname();
    const { signOut } = useClerk();
    const { user } = useUser();

    const initials = user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0] ?? "A";
    const avatarUrl = user?.imageUrl;

    function isActive(item: NavItem) {
        if (item.exact) return pathname === item.matchPath;
        return pathname?.startsWith(item.matchPath) ?? false;
    }

    return (
        <div className="flex flex-col h-full">
            {/* Logo + Admin badge */}
            <div className="flex items-center h-16 shrink-0 border-b border-zinc-800 overflow-hidden px-3">
                <Link href="/admin" className={`flex items-center gap-2.5 ${!expanded ? "justify-center w-full" : ""}`} onClick={onClose}>
                    <Image
                        src="/logo-dark.png"
                        alt="TradeRefer"
                        width={32}
                        height={32}
                        className="rounded-lg shrink-0"
                        priority
                    />
                    {expanded && (
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-black tracking-tight leading-none uppercase whitespace-nowrap">
                                <span className="text-white">TRADE</span>
                                <span className="text-orange-500">REFER</span>
                            </span>
                            <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-black uppercase rounded-md tracking-wider">
                                Admin
                            </span>
                        </div>
                    )}
                </Link>
            </div>

            {/* Nav groups */}
            <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
                {ADMIN_NAV.map((group, gi) => (
                    <div key={group.title}>
                        {expanded && (
                            <p className="px-2.5 mb-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">
                                {group.title}
                            </p>
                        )}
                        {!expanded && gi > 0 && (
                            <div className="mx-2 mb-2 border-t border-zinc-800" />
                        )}
                        <div className="space-y-0.5">
                            {group.items.map((item, i) => {
                                const active = isActive(item);
                                const Icon = item.icon;
                                return (
                                    <motion.div
                                        key={item.matchPath}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: (gi * 3 + i) * 0.03, duration: 0.25 }}
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
                                                    layoutId="admin-sidebar-active"
                                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-red-400 rounded-full"
                                                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                                                />
                                            )}
                                            <Icon
                                                className={`shrink-0 w-[18px] h-[18px] transition-colors ${
                                                    active ? "text-red-400" : "text-zinc-500 group-hover:text-zinc-200"
                                                }`}
                                            />
                                            {expanded && (
                                                <span
                                                    className={`text-[15px] font-bold whitespace-nowrap truncate ${
                                                        active ? "text-white" : "text-zinc-300 group-hover:text-white"
                                                    }`}
                                                >
                                                    {item.label}
                                                </span>
                                            )}
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Bottom section */}
            <div className="shrink-0 border-t border-zinc-800 px-2 py-3 space-y-0.5">
                {/* Back to dashboard */}
                <Link
                    href="/dashboard"
                    onClick={onClose}
                    title={!expanded ? "Back to Dashboard" : undefined}
                    className="flex items-center gap-3 rounded-xl px-2.5 py-2 text-zinc-500 hover:bg-white/5 hover:text-zinc-200 transition-all group"
                >
                    <ArrowLeftRight className="shrink-0 w-[18px] h-[18px]" />
                    {expanded && (
                        <span className="text-[15px] font-bold text-zinc-400 group-hover:text-zinc-200 whitespace-nowrap truncate">
                            Back to Dashboard
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
                        <span className="text-[15px] font-bold whitespace-nowrap">Sign Out</span>
                    )}
                </button>

                {/* User avatar */}
                <div className={`flex items-center gap-3 px-2.5 py-2 ${!expanded ? "justify-center" : ""}`}>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-400 flex items-center justify-center overflow-hidden shrink-0 ring-1 ring-white/10">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-white text-xs font-black uppercase">{initials}</span>
                        )}
                    </div>
                    {expanded && (
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-zinc-200 truncate leading-tight">
                                {user?.firstName} {user?.lastName}
                            </p>
                            <p className="text-xs text-zinc-500 truncate">
                                {user?.emailAddresses?.[0]?.emailAddress}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
    const [expanded, setExpanded] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();
    const overlayRef = useRef<HTMLDivElement>(null);

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
        return () => {
            document.body.style.overflow = "";
        };
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
                    onClick={() => setExpanded((e) => !e)}
                    aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
                    className={`absolute -right-3 top-[68px] w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all z-50 ${
                        expanded ? "rotate-180" : ""
                    }`}
                >
                    <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <SidebarContent expanded={expanded} />
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

                <Link href="/admin" className="flex items-center gap-2 shrink-0">
                    <Image src="/logo-dark.png" alt="TradeRefer" width={28} height={28} className="rounded-lg" />
                    <span className="text-lg font-black tracking-tight uppercase">
                        <span className="text-zinc-900">TRADE</span>
                        <span className="text-orange-500">REFER</span>
                    </span>
                    <span className="px-1.5 py-0.5 bg-red-50 text-red-600 text-[10px] font-black uppercase rounded-md tracking-wider">
                        Admin
                    </span>
                </Link>

                <div className="flex-1" />
            </div>

            {/* ── MOBILE DRAWER OVERLAY ── */}
            {mobileOpen && (
                <div
                    ref={overlayRef}
                    className="lg:hidden fixed inset-0 z-50 flex"
                    onClick={(e) => {
                        if (e.target === overlayRef.current) setMobileOpen(false);
                    }}
                >
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
                    <div className="relative w-64 bg-[#09090B] h-full flex flex-col shadow-2xl">
                        <button
                            onClick={() => setMobileOpen(false)}
                            className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <SidebarContent expanded={true} onClose={() => setMobileOpen(false)} />
                    </div>
                </div>
            )}

            {/* ── MAIN CONTENT ── */}
            <main
                className={`flex-1 min-w-0 transition-all duration-300 ease-in-out ${
                    expanded ? "lg:ml-60" : "lg:ml-16"
                } pt-[60px] lg:pt-0`}
            >
                {children}
            </main>
        </div>
    );
}
