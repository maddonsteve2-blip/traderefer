"use client";



import { usePathname } from "next/navigation";

import Link from "next/link";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import { Wallet, Plus, User, Settings, Globe, BarChart3, Network, LogOut, ChevronDown, LayoutDashboard, Search, Menu, X, Gift, MessageSquare } from "lucide-react";

import { SignInButton, SignUpButton, SignedIn, SignedOut, useAuth, useUser, useClerk } from "@clerk/nextjs";

import { TopUpDialog } from "@/components/dashboard/TopUpDialog";

import { NotificationBell } from "@/components/NotificationBell";

import { Logo } from "@/components/Logo";



function ProfileDropdown() {

    const { user } = useUser();

    const { signOut } = useClerk();

    const pathname = usePathname();

    const isBusinessDashboard = pathname?.startsWith("/dashboard/business");

    const isReferrerDashboard = pathname?.startsWith("/dashboard/referrer");

    const [open, setOpen] = useState(false);

    const ref = useRef<HTMLDivElement>(null);



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





export function Navbar() {

    const pathname = usePathname();

    const isDashboard = pathname?.startsWith("/dashboard") || pathname?.startsWith("/b/");

    const isBusinessDashboard = pathname?.startsWith("/dashboard/business");

    const isReferrerDashboard = pathname?.startsWith("/dashboard/referrer");

    const { getToken, isSignedIn, isLoaded } = useAuth();

    const [walletBalance, setWalletBalance] = useState<number | null>(null);

    const [showTopUp, setShowTopUp] = useState(false);



    const fetchBalance = async () => {

        if (!isSignedIn || !isBusinessDashboard) return;

        try {

            const token = await getToken();

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/business/me`, {

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

            <header className="fixed top-0 w-full border-b bg-white/90 backdrop-blur-md z-50 h-[72px] md:h-[100px]">

                <div className={`${isDashboard ? 'w-full px-4 lg:px-5' : 'container mx-auto px-4'} h-full flex items-center justify-between gap-4`}>

                    <Link href="/" className="flex items-center gap-2 group shrink-0">

                        <Logo size="sm" />

                    </Link>

                    {/* ── PERSISTENT SEARCH BAR ── */}
                    {!isDashboard && (
                        <div className="hidden md:block flex-1 max-w-xl">
                            <SmartSearch variant="navbar" />
                        </div>
                    )}



                    <nav className="flex items-center gap-1">

                        {/* Stable placeholder while Clerk resolves — prevents sign-in flash */}
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

                                <SignInButton mode="modal">

                                    <Button variant="ghost" className="text-sm font-bold text-zinc-600 hover:text-zinc-900 ml-2">

                                        Sign In

                                    </Button>

                                </SignInButton>

                                <SignUpButton mode="modal">

                                    <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-6 font-bold shadow-lg shadow-orange-500/20">

                                        Sign Up

                                    </Button>

                                </SignUpButton>

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

                                                {/* Core nav — 5 items max */}

                                                <Link href="/dashboard/business/leads" className="hidden sm:block">

                                                    <Button variant="ghost" className={`text-base font-bold px-3 transition-colors ${pathname === "/dashboard/business/leads" ? "text-orange-600 bg-orange-50" : "text-zinc-600 hover:text-orange-600"}`}>

                                                        Leads

                                                    </Button>

                                                </Link>

                                                <Link href="/dashboard/business/messages" className="hidden sm:block">

                                                    <Button variant="ghost" className={`text-base font-bold px-3 transition-colors ${pathname === "/dashboard/business/messages" ? "text-orange-600 bg-orange-50" : "text-zinc-600 hover:text-orange-600"}`}>

                                                        Messages

                                                    </Button>

                                                </Link>

                                                <Link href="/dashboard/business/referrers" className="hidden sm:block">

                                                    <Button variant="ghost" className={`text-base font-bold px-3 transition-colors ${pathname === "/dashboard/business/referrers" ? "text-orange-600 bg-orange-50" : "text-zinc-600 hover:text-orange-600"}`}>

                                                        Referrers

                                                    </Button>

                                                </Link>

                                                <Link href="/dashboard/business/deals" className="hidden sm:block">

                                                    <Button variant="ghost" className={`text-base font-bold px-3 transition-colors ${pathname === "/dashboard/business/deals" ? "text-orange-600 bg-orange-50" : "text-zinc-600 hover:text-orange-600"}`}>

                                                        Deals

                                                    </Button>

                                                </Link>

                                                <Link href="/dashboard/business/campaigns" className="hidden sm:block">

                                                    <Button variant="ghost" className={`text-base font-bold px-3 transition-colors ${pathname === "/dashboard/business/campaigns" ? "text-orange-600 bg-orange-50" : "text-zinc-600 hover:text-orange-600"}`}>

                                                        Campaigns

                                                    </Button>

                                                </Link>

                                                <Link href="/dashboard/business" className="hidden sm:block ml-1">

                                                    <Button className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-full px-5 font-bold text-base shadow-sm">

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

                                            </>

                                        )}

                                        {!isBusinessDashboard && !isReferrerDashboard && (

                                            <Link href="/dashboard" className="hidden sm:block">

                                                <Button variant="ghost" className="text-sm font-bold px-3 text-zinc-600 hover:text-orange-600">

                                                    Dashboard

                                                </Button>

                                            </Link>

                                        )}

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

                                            <Button className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-full px-5 font-bold text-sm shadow-sm">

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

            {/* ── MOBILE DRAWER ── */}
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
                                        { href: "/dashboard/business/leads", label: "Leads" },
                                        { href: "/dashboard/business/messages", label: "Messages" },
                                        { href: "/dashboard/business/referrers", label: "Referrers" },
                                        { href: "/dashboard/business/deals", label: "Deals" },
                                        { href: "/dashboard/business/campaigns", label: "Campaigns" },
                                        { href: "/dashboard/business/analytics", label: "Analytics" },
                                    ].map(({ href, label }) => (
                                        <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)}
                                            className={`flex items-center px-4 py-4 rounded-xl font-bold transition-colors ${pathname === href ? 'bg-orange-50 text-[#FF6600]' : 'text-zinc-700 hover:bg-orange-50 hover:text-[#FF6600]'}`}
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
                                        { href: "/dashboard/referrer/messages", label: "Messages" },
                                        { href: "/dashboard/referrer/withdraw", label: "Rewards" },
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
                                <SignInButton mode="modal">
                                    <button onClick={() => setMobileMenuOpen(false)}
                                        className="w-full border-2 border-zinc-200 text-zinc-700 font-black rounded-xl flex items-center justify-center transition-colors hover:border-zinc-300"
                                        style={{ minHeight: '52px', fontSize: '17px' }}>
                                        Sign In
                                    </button>
                                </SignInButton>
                                <SignUpButton mode="modal">
                                    <button onClick={() => setMobileMenuOpen(false)}
                                        className="w-full bg-[#FF6600] hover:bg-[#E65C00] text-white font-black rounded-xl flex items-center justify-center transition-colors"
                                        style={{ minHeight: '52px', fontSize: '17px' }}>
                                        Sign Up Free
                                    </button>
                                </SignUpButton>
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




