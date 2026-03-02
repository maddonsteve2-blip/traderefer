"use client";



import { usePathname } from "next/navigation";

import Link from "next/link";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import { Wallet, Plus, User, Settings, Globe, BarChart3, Network, LogOut, ChevronDown, LayoutDashboard, Search } from "lucide-react";

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

        { href: "/dashboard/referrer/settings", label: "Settings", icon: Settings },

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



export function Navbar() {

    const pathname = usePathname();

    const isDashboard = pathname?.startsWith("/dashboard") || pathname?.startsWith("/b/");

    const isBusinessDashboard = pathname?.startsWith("/dashboard/business") || pathname?.startsWith("/b/");

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



    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const isDirectoryPage = pathname?.startsWith("/local");

    const handleSearch = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/businesses?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery("");
        }
    }, [searchQuery, router]);

    return (

        <>

            <header className="fixed top-0 w-full border-b bg-white/90 backdrop-blur-md z-50" style={{ height: '100px' }}>

                <div className="container mx-auto px-4 h-full flex items-center justify-between gap-4">

                    <Link href="/" className="flex items-center gap-2 group shrink-0">

                        <Logo size="sm" />

                    </Link>

                    {/* ── PERSISTENT SEARCH BAR ── */}
                    {!isDashboard && (
                        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md items-center gap-3 bg-zinc-100 hover:bg-white border-2 border-zinc-200 hover:border-orange-400 rounded-2xl px-5 transition-all" style={{ height: '60px' }}>
                            <Search className="w-5 h-5 text-[#FF6600] shrink-0" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Find a Tradie in your suburb..."
                                className="flex-1 bg-transparent text-[18px] text-zinc-700 placeholder:text-zinc-400 outline-none min-w-0 font-medium"
                            />
                        </form>
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

                                                    <Button variant="ghost" className={`text-sm font-bold px-3 transition-colors ${pathname === "/dashboard/business/leads" ? "text-orange-600 bg-orange-50" : "text-zinc-600 hover:text-orange-600"}`}>

                                                        Leads

                                                    </Button>

                                                </Link>

                                                <Link href="/dashboard/business/messages" className="hidden sm:block">

                                                    <Button variant="ghost" className={`text-sm font-bold px-3 transition-colors ${pathname === "/dashboard/business/messages" ? "text-orange-600 bg-orange-50" : "text-zinc-600 hover:text-orange-600"}`}>

                                                        Messages

                                                    </Button>

                                                </Link>

                                                <Link href="/dashboard/business/referrers" className="hidden sm:block">

                                                    <Button variant="ghost" className={`text-sm font-bold px-3 transition-colors ${pathname === "/dashboard/business/referrers" ? "text-orange-600 bg-orange-50" : "text-zinc-600 hover:text-orange-600"}`}>

                                                        Referrers

                                                    </Button>

                                                </Link>

                                                <Link href="/dashboard/business/deals" className="hidden sm:block">

                                                    <Button variant="ghost" className={`text-sm font-bold px-3 transition-colors ${pathname === "/dashboard/business/deals" ? "text-orange-600 bg-orange-50" : "text-zinc-600 hover:text-orange-600"}`}>

                                                        Deals

                                                    </Button>

                                                </Link>

                                                <Link href="/dashboard/business/campaigns" className="hidden sm:block">

                                                    <Button variant="ghost" className={`text-sm font-bold px-3 transition-colors ${pathname === "/dashboard/business/campaigns" ? "text-orange-600 bg-orange-50" : "text-zinc-600 hover:text-orange-600"}`}>

                                                        Campaigns

                                                    </Button>

                                                </Link>

                                                <Link href="/dashboard/business" className="hidden sm:block ml-1">

                                                    <Button className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-full px-5 font-bold text-sm shadow-sm">

                                                        Dashboard

                                                    </Button>

                                                </Link>

                                            </>

                                        )}

                                        {isReferrerDashboard && (

                                            <>

                                                <Link href="/dashboard/referrer" className="hidden sm:block">

                                                    <Button variant="ghost" className={`text-sm font-bold px-3 transition-colors ${pathname === "/dashboard/referrer" ? "text-orange-600 bg-orange-50" : "text-zinc-600 hover:text-orange-600"}`}>

                                                        Dashboard

                                                    </Button>

                                                </Link>

                                                <Link href="/businesses" className="hidden sm:block">

                                                    <Button variant="ghost" className="text-sm font-bold px-3 text-zinc-600 hover:text-orange-600">

                                                        Find Businesses

                                                    </Button>

                                                </Link>

                                                <Link href="/dashboard/referrer/messages" className="hidden sm:block">

                                                    <Button variant="ghost" className={`text-sm font-bold px-3 transition-colors ${pathname === "/dashboard/referrer/messages" ? "text-orange-600 bg-orange-50" : "text-zinc-600 hover:text-orange-600"}`}>

                                                        Messages

                                                    </Button>

                                                </Link>

                                                <Link href="/dashboard/referrer/withdraw" className="hidden sm:block">

                                                    <Button variant="ghost" className={`text-sm font-bold px-3 transition-colors ${pathname === "/dashboard/referrer/withdraw" ? "text-orange-600 bg-orange-50" : "text-zinc-600 hover:text-orange-600"}`}>

                                                        Withdraw

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

                                            <Button variant="ghost" className="font-bold text-zinc-600 hover:text-orange-600 text-[18px]">

                                                Find Businesses

                                            </Button>

                                        </Link>

                                        <Link href="/support" className="hidden lg:block">

                                            <Button variant="ghost" className="font-bold text-zinc-600 hover:text-orange-600 text-[18px]">

                                                Support

                                            </Button>

                                        </Link>

                                        <Link href="/contact" className="hidden lg:block">

                                            <Button variant="ghost" className="font-bold text-zinc-600 hover:text-orange-600 text-[18px]">

                                                Contact

                                            </Button>

                                        </Link>

                                        <Link href="/dashboard" className="hidden sm:block">

                                            <Button className="bg-[#FF6600] hover:bg-[#E65C00] text-white rounded-xl px-6 font-bold shadow-lg shadow-orange-500/20" style={{ minHeight: '56px', fontSize: '20px' }}>

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

                </div>

            </header>



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




