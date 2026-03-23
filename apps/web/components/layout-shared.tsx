"use client";



import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

import Link from "next/link";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import { Wallet, Plus, User, Settings, Globe, BarChart3, Network, LogOut, ChevronDown, LayoutDashboard, Search, Menu, X, Gift, MessageSquare, ArrowLeftRight, Rocket, Building2, DollarSign, Users as Users2, Target, ArrowRight } from "lucide-react";

import { SignedIn, SignedOut, useAuth, useUser, useClerk } from "@clerk/nextjs";

import { NotificationBell } from "@/components/NotificationBell";

import { Logo } from "@/components/Logo";

const TopUpDialog = dynamic(() => import("@/components/dashboard/TopUpDialog").then((mod) => mod.TopUpDialog));



function useDbRoleStatus() {

    const { getToken, isLoaded, userId } = useAuth();

    const [roleStatus, setRoleStatus] = useState<{ hasBusiness: boolean; hasReferrer: boolean } | null>(null);

    useEffect(() => {

        if (!isLoaded || !userId) {

            setRoleStatus(null);

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

                    setRoleStatus({

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



    return roleStatus;

}



function ProfileDropdown() {

    const { user } = useUser();

    const { signOut } = useClerk();

    const pathname = usePathname();

    const isBusinessDashboard = pathname?.startsWith("/dashboard/business");

    const isReferrerDashboard = pathname?.startsWith("/dashboard/referrer");

    const [open, setOpen] = useState(false);

    const ref = useRef<HTMLDivElement>(null);

    const dbRoleStatus = useDbRoleStatus();

    const roles = (user?.publicMetadata?.roles as string[] | undefined) ?? [];
    const role = user?.publicMetadata?.role as string | undefined;
    const effectiveRoles = roles.length > 0 ? roles : role ? [role] : [];
    const hasBusiness = dbRoleStatus?.hasBusiness ?? effectiveRoles.includes("business");
    const hasReferrer = dbRoleStatus?.hasReferrer ?? effectiveRoles.includes("referrer");
    const isDual = hasBusiness && hasReferrer;



    useEffect(() => {

        const handler = (e: MouseEvent) => {

            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);

        };

        document.addEventListener("mousedown", handler);

        return () => document.removeEventListener("mousedown", handler);

    }, []);



    const initials = user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0] ?? "U";

    const avatarUrl = user?.imageUrl;



    const businessLinks = [

        { href: "/dashboard/business", label: "Overview", icon: LayoutDashboard },

        { href: "/dashboard/business/profile", label: "Public Profile", icon: Globe },

        { href: "/dashboard/business/analytics", label: "Analytics", icon: BarChart3 },

        { href: "/dashboard/business/network", label: "Network", icon: Network },

        { href: "/dashboard/business/settings", label: "Settings", icon: Settings },

    ];

    const referrerLinks = [

        { href: "/dashboard/referrer", label: "Overview", icon: LayoutDashboard },

        { href: "/dashboard/referrer/messages", label: "Messages", icon: MessageSquare },

        { href: "/dashboard/referrer/withdraw", label: "Rewards", icon: Gift },

    ];

    const dropdownLinks = isBusinessDashboard ? businessLinks : isReferrerDashboard ? referrerLinks : [];



    return (

        <div className="relative" ref={ref}>

            <button

                onClick={() => setOpen(o => !o)}

                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-zinc-100 transition-all group"

            >

                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center overflow-hidden shrink-0 ring-2 ring-white shadow-sm">

                    {avatarUrl ? (

                        // eslint-disable-next-line @next/next/no-img-element

                        <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />

                    ) : (

                        <span className="text-white text-xs font-black uppercase">{initials}</span>

                    )}

                </div>

                <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />

            </button>



            {open && (

                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-zinc-200 rounded-2xl shadow-xl shadow-zinc-200/60 overflow-hidden z-50">

                    {/* User info header */}

                    <div className="px-4 py-3 border-b border-zinc-100">

                        <p className="text-sm font-bold text-zinc-900 truncate">{user?.firstName} {user?.lastName}</p>

                        <p className="text-xs text-zinc-400 truncate">{user?.emailAddresses?.[0]?.emailAddress}</p>

                    </div>



                    {/* Nav links */}

                    {dropdownLinks.length > 0 && (

                        <div className="py-1.5">

                            {dropdownLinks.map(({ href, label, icon: Icon }) => (

                                <Link

                                    key={href}

                                    href={href}

                                    onClick={() => setOpen(false)}

                                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"

                                >

                                    <Icon className="w-4 h-4 text-zinc-400" />

                                    {label}

                                </Link>

                            ))}

                        </div>

                    )}



                    {/* Dual-role switch (only if already both) */}
                    {isDual && (isBusinessDashboard || isReferrerDashboard) && (
                        <div className="border-t border-zinc-100 py-1.5">
                            <Link
                                href={isBusinessDashboard ? "/dashboard/referrer" : "/dashboard/business"}
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-zinc-700 hover:bg-zinc-50 transition-colors"
                            >
                                <ArrowLeftRight className="w-4 h-4 text-zinc-400" />
                                Switch to {isBusinessDashboard ? "Referrer" : "Business"} Mode
                            </Link>
                        </div>
                    )}

                    {/* Sign out */}

                    <div className="border-t border-zinc-100 py-1.5">

                        <button

                            onClick={() => signOut({ redirectUrl: "/" })}

                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"

                        >

                            <LogOut className="w-4 h-4" />

                            Sign Out

                        </button>

                    </div>

                </div>

            )}


        </div>

    );

}



import { SmartSearch } from "@/components/SmartSearch";

function DualRoleSwitcher({ isBusinessDashboard, isReferrerDashboard }: { isBusinessDashboard: boolean; isReferrerDashboard: boolean }) {
    const { user } = useUser();
    const roles = (user?.publicMetadata?.roles as string[] | undefined) ?? [];
    const isDual = roles.includes("referrer") && roles.includes("business");
    if (!isDual || (!isBusinessDashboard && !isReferrerDashboard)) return null;

    const href = isBusinessDashboard ? "/dashboard/referrer" : "/dashboard/business";
    const label = isBusinessDashboard ? "Referrer" : "Business";

    return (
        <Link
            href={href}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-full font-bold transition-all ml-1 text-xs"
        >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Switch to {label}
        </Link>
    );
}

function DashboardCenterAction({ isBusinessDashboard, isReferrerDashboard }: { isBusinessDashboard: boolean; isReferrerDashboard: boolean }) {
    const { user } = useUser();
    const [open, setOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const dbRoleStatus = useDbRoleStatus();
    const roles = (user?.publicMetadata?.roles as string[] | undefined) ?? [];
    const role = user?.publicMetadata?.role as string | undefined;
    const effectiveRoles = roles.length > 0 ? roles : role ? [role] : [];
    const hasBusiness = dbRoleStatus?.hasBusiness ?? effectiveRoles.includes("business");
    const hasReferrer = dbRoleStatus?.hasReferrer ?? effectiveRoles.includes("referrer");
    const isDual = hasBusiness && hasReferrer;
    const currentMode = isBusinessDashboard ? "business" : isReferrerDashboard ? "referrer" : null;

    useEffect(() => {
        if (!open) return;

        const handlePointerDown = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handlePointerDown);
        return () => document.removeEventListener("mousedown", handlePointerDown);
    }, [open]);

    if (!currentMode) return null;

    const CurrentIcon = currentMode === "business" ? Building2 : Rocket;
    const currentLabel = currentMode === "business" ? "Business" : "Referrer";
    const switchHref = currentMode === "business" ? "/dashboard/referrer" : "/dashboard/business";
    const switchLabel = currentMode === "business" ? "Referrer" : "Business";
    const SwitchIcon = currentMode === "business" ? Rocket : Building2;
    const activateHref = currentMode === "business" ? "/onboarding/referrer" : "/onboarding/business";
    const activateLabel = currentMode === "business" ? "Add Referrer Dashboard" : "Add Business Dashboard";
    const activateDescription = currentMode === "business"
        ? "Create a referrer profile so you can flip between both dashboards."
        : "Create a business profile so you can flip between both dashboards.";
    const buttonClasses = currentMode === "business"
        ? "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
        : "border-zinc-200 bg-zinc-100 text-zinc-800 hover:bg-zinc-200";

    return (
        <div ref={panelRef} className="relative flex flex-1 min-w-0 justify-center">
            <button
                onClick={() => setOpen(value => !value)}
                className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-2 md:px-4 md:py-2.5 font-black transition-all shadow-sm ${buttonClasses}`}
            >
                <CurrentIcon className="w-4 h-4 shrink-0" />
                <span className="truncate text-xs md:text-sm">{currentLabel} Dashboard</span>
                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <div className="absolute top-full mt-2 w-[min(22rem,calc(100vw-2rem))] max-w-[22rem] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl shadow-zinc-200/60 z-50">
                    <div className="border-b border-zinc-100 px-4 py-3">
                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Dashboard Mode</p>
                        <div className="mt-2 flex items-center gap-2 text-zinc-900">
                            <CurrentIcon className="w-4 h-4" />
                            <span className="font-black text-sm">{currentLabel} Dashboard</span>
                        </div>
                    </div>

                    <div className="p-2">
                        {isDual ? (
                            <Link
                                href={switchHref}
                                onClick={() => setOpen(false)}
                                className="flex items-start gap-3 rounded-xl px-3 py-3 text-left text-zinc-700 hover:bg-zinc-50 transition-colors"
                            >
                                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
                                    <ArrowLeftRight className="w-4 h-4 text-zinc-600" />
                                </div>
                                <div>
                                    <p className="font-black text-sm text-zinc-900">Switch to {switchLabel} Dashboard</p>
                                    <p className="text-xs font-medium text-zinc-500">Move between your two workspaces from the same menu.</p>
                                </div>
                            </Link>
                        ) : (
                            <Link
                                href={activateHref}
                                onClick={() => setOpen(false)}
                                className="flex items-start gap-3 rounded-xl px-3 py-3 text-left text-zinc-700 hover:bg-zinc-50 transition-colors"
                            >
                                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                                    <SwitchIcon className="w-4 h-4 text-orange-600" />
                                </div>
                                <div>
                                    <p className="font-black text-sm text-zinc-900">{activateLabel}</p>
                                    <p className="text-xs font-medium text-zinc-500">{activateDescription}</p>
                                </div>
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function BecomeReferrerModal({ onClose }: { onClose: () => void }) {
    const BENEFITS = [
        { icon: DollarSign, title: "Monetize Your Network", desc: "Don't let out-of-area or over-booked calls go to waste. Refer them to verified peers and earn." },
        { icon: Gift, title: "Zero-Admin Rewards", desc: "All referral fees are paid via Prezzee Smart Cards. Choose from 300+ brands: Bunnings, Woolworths, Uber." },
        { icon: Users2, title: "Professional Reciprocity", desc: "Build a circle of trusted trades who send work back to you â€” automatically." },
        { icon: Rocket, title: "Free to Activate", desc: "No subscription. No upfront cost. The system issues digital cards instantly once a lead is verified." },
    ];
    return createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="flex min-h-full items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="bg-gradient-to-br from-orange-500 to-amber-400 px-8 pt-8 pb-10 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"><X className="w-4 h-4" /></button>
                    <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center mb-5"><Rocket className="w-9 h-9 text-white" /></div>
                    <h2 className="text-2xl font-black text-white mb-2 leading-tight">Monetize Your Network.<br />Earn Instant Rewards.</h2>
                    <p className="text-orange-100 font-medium text-sm">Turn every referral into real money â€” the system handles everything.</p>
                </div>
                <div className="px-8 py-6 space-y-5">
                    {BENEFITS.map(({ icon: Icon, title, desc }) => (
                        <div key={title} className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center shrink-0 border border-orange-100"><Icon className="w-6 h-6 text-orange-500" /></div>
                            <div><p className="font-black text-zinc-900 text-sm">{title}</p><p className="text-zinc-500 font-medium leading-relaxed text-xs">{desc}</p></div>
                        </div>
                    ))}
                </div>
                <div className="px-8 pb-8">
                    <Link href="/onboarding/referrer" onClick={onClose} className="flex items-center justify-center gap-2 w-full h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black transition-all shadow-lg shadow-orange-200 text-base">
                        Activate My Partner Profile <ArrowRight className="w-5 h-5" />
                    </Link>
                    <button onClick={onClose} className="w-full mt-3 text-zinc-400 hover:text-zinc-600 font-medium transition-colors" style={{ fontSize: '14px' }}>Maybe later</button>
                </div>
            </div>
            </div>
        </div>,
        document.body
    );
}

function RegisterBusinessModal({ onClose }: { onClose: () => void }) {
    const BENEFITS = [
        { icon: Target, title: "Pre-Vetted Leads, Delivered", desc: "Receive pre-screened leads from trusted referrers who personally vouch for each job." },
        { icon: Users2, title: "Your Own Partner Network", desc: "Approve trusted referrers to represent your brand â€” they grow your pipeline hands-free." },
        { icon: BarChart3, title: "Dashboard Analytics", desc: "Track lead quality, conversion rates, and referrer performance from one dashboard." },
        { icon: Gift, title: "Zero-Admin Reward System", desc: "Prezzee Smart Cards handle referrer payouts automatically. No bank transfers, no invoices." },
    ];
    return createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="flex min-h-full items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="bg-zinc-900 px-8 pt-8 pb-10 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"><X className="w-4 h-4" /></button>
                    <div className="w-16 h-16 bg-orange-500/20 rounded-2xl flex items-center justify-center mb-5"><Building2 className="w-9 h-9 text-orange-400" /></div>
                    <p className="text-orange-400 font-black text-xs uppercase tracking-widest mb-2">Business Dashboard</p>
                    <h2 className="text-[22px] font-black text-white mb-2 leading-tight">Unlock Your Business<br />Dashboard</h2>
                    <p className="text-zinc-400 font-medium text-sm">A professional hub where your partner network delivers verified leads â€” on autopilot.</p>
                </div>
                <div className="px-8 py-6 space-y-5">
                    {BENEFITS.map(({ icon: Icon, title, desc }) => (
                        <div key={title} className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center shrink-0 border border-zinc-200"><Icon className="w-6 h-6 text-orange-500" /></div>
                            <div><p className="font-black text-zinc-900 text-sm">{title}</p><p className="text-zinc-500 font-medium leading-relaxed text-xs">{desc}</p></div>
                        </div>
                    ))}
                </div>
                <div className="px-8 pb-8">
                    <Link href="/onboarding/business" onClick={onClose} className="flex items-center justify-center gap-2 w-full h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black transition-all shadow-lg shadow-orange-200" style={{ fontSize: '16px' }}>
                        Start Business Onboarding <ArrowRight className="w-5 h-5" />
                    </Link>
                    <button onClick={onClose} className="w-full mt-3 text-zinc-400 hover:text-zinc-600 font-medium transition-colors" style={{ fontSize: '14px' }}>Maybe later</button>
                </div>
            </div>
            </div>
        </div>,
        document.body
    );
}

export function Navbar() {

    const pathname = usePathname();

    const apiUrl = "/api/backend";

    const isDashboard = pathname?.startsWith("/dashboard");

    const isBusinessDashboard = pathname?.startsWith("/dashboard/business");

    const isReferrerDashboard = pathname?.startsWith("/dashboard/referrer");

    const [currentSearch, setCurrentSearch] = useState("");

    useEffect(() => {

        if (typeof window === "undefined") return;

        setCurrentSearch(window.location.search);

    }, [pathname]);

    const currentParams = new URLSearchParams(currentSearch);

    const businessForceTab = isBusinessDashboard && pathname?.startsWith("/dashboard/business/force")
        ? (currentParams.get("tab") ?? "partners")
        : null;

    const businessSalesTab = isBusinessDashboard && pathname?.startsWith("/dashboard/business/sales")
        ? (currentParams.get("tab") ?? "leads")
        : null;

    const isBusinessOverview = pathname === "/dashboard/business";

    const isBusinessLeads = pathname === "/dashboard/business/leads"
        || (pathname?.startsWith("/dashboard/business/sales") && businessSalesTab === "leads");

    const isBusinessMessages = pathname === "/dashboard/business/messages";

    const isBusinessReferralForce = pathname?.startsWith("/dashboard/business/referrers")
        || pathname?.startsWith("/dashboard/business/team")
        || pathname?.startsWith("/dashboard/business/force") && businessForceTab === "partners";

    const isBusinessApplications = pathname?.startsWith("/dashboard/business/applications")
        || pathname?.startsWith("/dashboard/business/force") && businessForceTab === "applications";

    const isBusinessDeals = pathname === "/dashboard/business/deals"
        || (pathname?.startsWith("/dashboard/business/sales") && businessSalesTab === "offers");

    const isBusinessCampaigns = pathname === "/dashboard/business/campaigns"
        || (pathname?.startsWith("/dashboard/business/sales") && businessSalesTab === "promotions");

    const { getToken, isSignedIn, isLoaded } = useAuth();

    const [walletBalance, setWalletBalance] = useState<number | null>(null);

    const [showTopUp, setShowTopUp] = useState(false);



    const fetchBalance = async () => {

        if (!isSignedIn || !isBusinessDashboard) return;

        try {

            const token = await getToken();

            const res = await fetch(`${apiUrl}/business/me`, {

                headers: { Authorization: `Bearer ${token}` },

            });

            if (res.ok) {

                const data = await res.json();

                setWalletBalance(data.wallet_balance_cents ?? 0);

            }

        } catch { }

    };



    useEffect(() => {

        fetchBalance();

    }, [isSignedIn, isBusinessDashboard, getToken, pathname]);



    useEffect(() => {

        const handler = () => fetchBalance();

        window.addEventListener('wallet-updated', handler);

        return () => window.removeEventListener('wallet-updated', handler);

    }, [isSignedIn, isBusinessDashboard, getToken]);



    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [mobileMenuOpen]);

    return (

        <>

            <header className="fixed top-0 w-full border-b border-gray-100 bg-white/90 backdrop-blur-md z-50 h-[72px] md:h-[100px]">

                <div className={`${isDashboard ? 'w-full px-4 lg:px-5' : 'container mx-auto px-4'} h-full flex items-center justify-between gap-4`}>

                    <Link href="/" className="flex items-center gap-2 group shrink-0">

                        <Logo size="sm" />

                    </Link>

                    {/* â”€â”€ PERSISTENT SEARCH BAR â”€â”€ */}
                    {!isDashboard && (
                        <div className="hidden md:block flex-1 max-w-xl">
                            <SmartSearch variant="navbar" />
                        </div>
                    )}

                    {isDashboard && (
                        <SignedIn>
                            <DashboardCenterAction isBusinessDashboard={isBusinessDashboard} isReferrerDashboard={isReferrerDashboard} />
                        </SignedIn>
                    )}



                    <nav className="flex items-center gap-1">

                        {/* Stable placeholder while Clerk resolves â€” prevents sign-in flash */}
                        {!isLoaded && (
                            <div className="flex items-center gap-2" aria-hidden>
                                <div className="w-16 h-8 rounded-full bg-zinc-100 animate-pulse" />
                                <div className="w-20 h-8 rounded-full bg-zinc-100 animate-pulse" />
                            </div>
                        )}
                        {isLoaded && (<>

                            <SignedOut>

                                {!isDashboard && (

                                    <>

                                        <Link href="/businesses" className="hidden md:block text-sm font-medium text-zinc-600 hover:text-orange-600 transition-colors px-3 py-2">

                                            Browse Businesses

                                        </Link>

                                        <Link href="/support" className="hidden lg:block text-sm font-medium text-zinc-600 hover:text-orange-600 transition-colors px-3 py-2">

                                            Support

                                        </Link>

                                        <Link href="/contact" className="hidden lg:block text-sm font-medium text-zinc-600 hover:text-orange-600 transition-colors px-3 py-2">

                                            Contact

                                        </Link>

                                    </>

                                )}

                                <Button asChild variant="ghost" className="text-sm font-bold text-zinc-600 hover:text-zinc-900 ml-2">

                                    <Link href="/login">

                                        Sign In

                                    </Link>

                                </Button>

                                <Button asChild className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-6 font-bold shadow-lg shadow-orange-500/20">

                                    <Link href="/signup">

                                        Sign Up

                                    </Link>

                                </Button>

                            </SignedOut>



                            <SignedIn>

                                {isDashboard ? (

                                    <>

                                        {isBusinessDashboard && (

                                            <>

                                                {/* Wallet balance */}

                                                {walletBalance !== null && (

                                                    <button

                                                        onClick={() => setShowTopUp(true)}

                                                        className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-50 hover:bg-orange-50 border border-zinc-200 hover:border-orange-200 rounded-full transition-all group mr-2"

                                                    >

                                                        <Wallet className="w-4 h-4 text-zinc-400 group-hover:text-orange-500" />

                                                        <span className="text-sm font-bold text-zinc-700">${(walletBalance / 100).toFixed(2)}</span>

                                                        <Plus className="w-3.5 h-3.5 text-orange-500" />

                                                    </button>

                                                )}

                                                {/* Core nav â€” 5 items max */}

                                                <Link href="/dashboard/business/sales?tab=leads" className="hidden sm:block">

                                                    <Button variant="ghost" className={`text-base font-bold px-3 transition-colors ${isBusinessLeads ? "text-orange-600 bg-orange-50" : "text-zinc-600 hover:text-orange-600"}`}>

                                                        Leads

                                                    </Button>

                                                </Link>

                                                <Link href="/dashboard/business/messages" className="hidden sm:block">

                                                    <Button variant="ghost" className={`text-base font-bold px-3 transition-colors ${isBusinessMessages ? "text-orange-600 bg-orange-50" : "text-zinc-600 hover:text-orange-600"}`}>

                                                        Messages

                                                    </Button>

                                                </Link>

                                                <Link href="/dashboard/business/force?tab=partners" className="hidden sm:block">

                                                    <Button variant="ghost" className={`text-base font-bold px-3 transition-colors ${isBusinessReferralForce ? "text-orange-600 bg-orange-50" : "text-zinc-600 hover:text-orange-600"}`}>

                                                        Referral Force

                                                    </Button>

                                                </Link>

                                                <Link href="/dashboard/business/force?tab=applications" className="hidden sm:block">

                                                    <Button variant="ghost" className={`text-base font-bold px-3 transition-colors ${isBusinessApplications ? "text-orange-600 bg-orange-50" : "text-zinc-600 hover:text-orange-600"}`}>

                                                        Applications

                                                    </Button>

                                                </Link>

                                                <Link href="/dashboard/business/sales?tab=offers" className="hidden sm:block">

                                                    <Button variant="ghost" className={`text-base font-bold px-3 transition-colors ${isBusinessDeals ? "text-orange-600 bg-orange-50" : "text-zinc-600 hover:text-orange-600"}`}>

                                                        Deals

                                                    </Button>

                                                </Link>

                                                <Link href="/dashboard/business/sales?tab=promotions" className="hidden sm:block">

                                                    <Button variant="ghost" className={`text-base font-bold px-3 transition-colors ${isBusinessCampaigns ? "text-orange-600 bg-orange-50" : "text-zinc-600 hover:text-orange-600"}`}>

                                                        Campaigns

                                                    </Button>

                                                </Link>

                                                <Link href="/dashboard/business" className="hidden sm:block ml-1">

                                                    <Button variant={isBusinessOverview ? "default" : "ghost"} className={isBusinessOverview ? "bg-orange-600 hover:bg-orange-700 text-white rounded-full px-5 font-bold text-base shadow-sm" : "text-base font-bold px-3 transition-colors text-zinc-600 hover:text-orange-600"}>

                                                        Dashboard

                                                    </Button>

                                                </Link>

                                            </>

                                        )}

                                        {isReferrerDashboard && (

                                            <>

                                                <Link href="/dashboard/referrer" className="hidden sm:block">

                                                    <Button variant="ghost" className={`text-base font-bold px-3 transition-colors ${pathname === "/dashboard/referrer" ? "text-orange-600 bg-orange-50" : "text-zinc-600 hover:text-orange-600"}`}>

                                                        Dashboard

                                                    </Button>

                                                </Link>

                                                <Link href="/dashboard/referrer/businesses" className="hidden sm:block">

                                                    <Button variant="ghost" className="text-base font-bold px-3 text-zinc-600 hover:text-orange-600">

                                                        Find Businesses

                                                    </Button>

                                                </Link>

                                                <Link href="/dashboard/referrer/manage" className="hidden sm:block">

                                                    <Button variant="ghost" className={`text-base font-bold px-3 transition-colors ${pathname?.startsWith("/dashboard/referrer/manage") ? "text-orange-600 bg-orange-50" : "text-zinc-600 hover:text-orange-600"}`}>

                                                        My Team

                                                    </Button>

                                                </Link>

                                                <Link href="/dashboard/referrer/messages" className="hidden sm:block">

                                                    <Button variant="ghost" className={`text-base font-bold px-3 transition-colors ${pathname === "/dashboard/referrer/messages" ? "text-orange-600 bg-orange-50" : "text-zinc-600 hover:text-orange-600"}`}>

                                                        Messages

                                                    </Button>

                                                </Link>

                                                <Link href="/dashboard/referrer/withdraw" className="hidden sm:block">

                                                    <Button variant="ghost" className={`text-base font-bold px-3 transition-colors ${pathname === "/dashboard/referrer/withdraw" ? "text-orange-600 bg-orange-50" : "text-zinc-600 hover:text-orange-600"}`}>

                                                        Rewards

                                                    </Button>

                                                </Link>

                                                <Link href="/dashboard/referrer/profile" className="hidden sm:block">

                                                    <Button variant="ghost" className={`text-base font-bold px-3 transition-colors ${pathname?.startsWith("/dashboard/referrer/profile") || pathname?.startsWith("/dashboard/referrer/applications") ? "text-orange-600 bg-orange-50" : "text-zinc-600 hover:text-orange-600"}`}>

                                                        My Profile

                                                    </Button>

                                                </Link>

                                            </>

                                        )}

                                        {!isBusinessDashboard && !isReferrerDashboard && (

                                            <Link href="/dashboard" className="hidden sm:block">

                                                <Button variant="ghost" className="text-sm font-bold px-3 text-zinc-600 hover:text-orange-600">

                                                    Dashboard

                                                </Button>

                                            </Link>

                                        )}

                                        {/* Dual-role switcher pill */}
                                        {/* <DualRoleSwitcher isBusinessDashboard={isBusinessDashboard} isReferrerDashboard={isReferrerDashboard} /> */}

                                    </>

                                ) : (

                                    <>

                                        <Link href="/businesses" className="hidden sm:block">

                                            <Button variant="ghost" className="text-sm font-bold px-3 text-zinc-600 hover:text-orange-600 transition-colors">

                                                Find Businesses

                                            </Button>

                                        </Link>

                                        <Link href="/support" className="hidden lg:block">

                                            <Button variant="ghost" className="text-sm font-bold px-3 text-zinc-600 hover:text-orange-600 transition-colors">

                                                Support

                                            </Button>

                                        </Link>

                                        <Link href="/contact" className="hidden lg:block">

                                            <Button variant="ghost" className="text-sm font-bold px-3 text-zinc-600 hover:text-orange-600 transition-colors">

                                                Contact

                                            </Button>

                                        </Link>

                                        <Link href="/dashboard" className="hidden sm:block ml-1">

                                            <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-5 font-bold text-sm shadow-sm">

                                                My Dashboard

                                            </Button>

                                        </Link>

                                    </>

                                )}

                                <NotificationBell />

                                <ProfileDropdown />

                            </SignedIn>
                        </>)}

                    </nav>

                    {/* Mobile hamburger */}
                    <button
                        onClick={() => setMobileMenuOpen(o => !o)}
                        className="md:hidden flex items-center justify-center w-11 h-11 rounded-xl text-zinc-700 hover:bg-zinc-100 transition-colors ml-1 shrink-0"
                        aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>

                </div>

            </header>

            {/* â”€â”€ MOBILE DRAWER â”€â”€ */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-[45] md:hidden">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
                    <div className="absolute top-0 right-0 h-full w-[85vw] max-w-sm bg-white shadow-2xl flex flex-col">
                        {/* Drawer header */}
                        <div className="flex items-center justify-between px-5 border-b border-zinc-100 h-[72px] shrink-0">
                            <Link href="/" onClick={() => setMobileMenuOpen(false)}><Logo size="sm" /></Link>
                            <button onClick={() => setMobileMenuOpen(false)} className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-500 hover:bg-zinc-100 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        {/* Nav links */}
                        <div className="flex-1 overflow-y-auto py-3 px-3">
                            {!isDashboard && (
                                <nav className="space-y-1">
                                    {[
                                        { href: "/businesses", label: "Find Businesses" },
                                        { href: "/local", label: "Directory" },
                                        { href: "/categories", label: "Browse Trades" },
                                        { href: "/support", label: "Support" },
                                        { href: "/contact", label: "Contact" },
                                    ].map(({ href, label }) => (
                                        <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)}
                                            className="flex items-center px-4 py-4 rounded-xl text-zinc-700 hover:bg-orange-50 hover:text-[#FF6600] font-bold transition-colors"
                                            style={{ fontSize: '18px' }}>
                                            {label}
                                        </Link>
                                    ))}
                                </nav>
                            )}
                            {isDashboard && isBusinessDashboard && (
                                <nav className="space-y-1">
                                    {[
                                        { href: "/dashboard/business", label: "Overview" },
                                        { href: "/dashboard/business/sales?tab=leads", label: "Leads", active: isBusinessLeads },
                                        { href: "/dashboard/business/messages", label: "Messages", active: isBusinessMessages },
                                        { href: "/dashboard/business/force?tab=partners", label: "Referral Force", active: isBusinessReferralForce },
                                        { href: "/dashboard/business/force?tab=applications", label: "Applications", active: isBusinessApplications },
                                        { href: "/dashboard/business/sales?tab=offers", label: "Deals", active: isBusinessDeals },
                                        { href: "/dashboard/business/sales?tab=promotions", label: "Campaigns", active: isBusinessCampaigns },
                                        { href: "/dashboard/business/analytics", label: "Analytics", active: pathname === "/dashboard/business/analytics" },
                                    ].map(({ href, label, active }) => (
                                        <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)}
                                            className={`flex items-center px-4 py-4 rounded-xl font-bold transition-colors ${active ?? pathname === href ? 'bg-orange-50 text-[#FF6600]' : 'text-zinc-700 hover:bg-orange-50 hover:text-[#FF6600]'}`}
                                            style={{ fontSize: '18px' }}>
                                            {label}
                                        </Link>
                                    ))}
                                </nav>
                            )}
                            {isDashboard && isReferrerDashboard && (
                                <nav className="space-y-1">
                                    {[
                                        { href: "/dashboard/referrer", label: "Dashboard" },
                                        { href: "/dashboard/referrer/businesses", label: "Find Businesses" },
                                        { href: "/dashboard/referrer/manage", label: "My Team" },
                                        { href: "/dashboard/referrer/messages", label: "Messages" },
                                        { href: "/dashboard/referrer/withdraw", label: "Rewards" },
                                        { href: "/dashboard/referrer/profile", label: "My Profile" },
                                        { href: "/dashboard/referrer/applications", label: "Applications" },
                                    ].map(({ href, label }) => (
                                        <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)}
                                            className={`flex items-center px-4 py-4 rounded-xl font-bold transition-colors ${pathname === href ? 'bg-orange-50 text-[#FF6600]' : 'text-zinc-700 hover:bg-orange-50 hover:text-[#FF6600]'}`}
                                            style={{ fontSize: '18px' }}>
                                            {label}
                                        </Link>
                                    ))}
                                </nav>
                            )}
                        </div>
                        {/* Bottom CTA */}
                        <div className="p-4 border-t border-zinc-100 space-y-2 shrink-0">
                            <SignedOut>
                                <Link href="/login" onClick={() => setMobileMenuOpen(false)}
                                    className="w-full border-2 border-zinc-200 text-zinc-700 font-black rounded-xl flex items-center justify-center transition-colors hover:border-zinc-300"
                                    style={{ minHeight: '52px', fontSize: '17px' }}>
                                    Sign In
                                </Link>
                                <Link href="/signup" onClick={() => setMobileMenuOpen(false)}
                                    className="w-full bg-[#FF6600] hover:bg-[#E65C00] text-white font-black rounded-xl flex items-center justify-center transition-colors"
                                    style={{ minHeight: '52px', fontSize: '17px' }}>
                                    Sign Up Free
                                </Link>
                            </SignedOut>
                            <SignedIn>
                                {!isDashboard && (
                                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}
                                        className="w-full bg-[#FF6600] hover:bg-[#E65C00] text-white font-black rounded-xl flex items-center justify-center transition-colors"
                                        style={{ minHeight: '52px', fontSize: '17px', display: 'flex' }}>
                                        My Dashboard
                                    </Link>
                                )}
                            </SignedIn>
                        </div>
                    </div>
                </div>
            )}

            {isBusinessDashboard && walletBalance !== null && (

                <TopUpDialog

                    open={showTopUp}

                    onOpenChange={setShowTopUp}

                    currentBalance={walletBalance}

                    onTopUpSuccess={(newBal) => setWalletBalance(newBal)}

                />

            )}

        </>

    );

}




