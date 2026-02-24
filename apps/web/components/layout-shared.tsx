"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TrendingUp, Wallet, Plus } from "lucide-react";
import { SignInButton, SignUpButton, UserButton, SignedIn, SignedOut, useAuth } from "@clerk/nextjs";
import { TopUpDialog } from "@/components/dashboard/TopUpDialog";
import { Logo } from "@/components/Logo";

export function Navbar() {
    const pathname = usePathname();
    const isDashboard = pathname?.startsWith("/dashboard");
    const isBusinessDashboard = pathname?.startsWith("/dashboard/business");
    const isReferrerDashboard = pathname?.startsWith("/dashboard/referrer");
    const { getToken, isSignedIn } = useAuth();
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

    return (
        <>
            <header className="fixed top-0 w-full border-b bg-white/80 backdrop-blur-md z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <Logo size="sm" />
                    </Link>

                    <nav className="flex items-center gap-4 md:gap-8">
                        {!isDashboard && (
                            <Link href="/businesses" className="hidden md:block text-sm font-medium text-zinc-600 hover:text-orange-600 transition-colors">
                                Browse Businesses
                            </Link>
                        )}

                        <SignedOut>
                            <SignInButton mode="modal">
                                <Button variant="ghost" className="text-sm font-bold text-zinc-600 hover:text-zinc-900">
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
                                            <Link href="/dashboard/business" className="hidden sm:block">
                                                <Button variant="ghost" className="text-sm font-bold text-zinc-600 hover:text-orange-600">
                                                    Dashboard
                                                </Button>
                                            </Link>
                                            {walletBalance !== null && (
                                                <button
                                                    onClick={() => setShowTopUp(true)}
                                                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-50 hover:bg-orange-50 border border-zinc-200 hover:border-orange-200 rounded-full transition-all group"
                                                >
                                                    <Wallet className="w-4 h-4 text-zinc-400 group-hover:text-orange-500" />
                                                    <span className="text-sm font-bold text-zinc-700">${(walletBalance / 100).toFixed(2)}</span>
                                                    <Plus className="w-3.5 h-3.5 text-orange-500" />
                                                </button>
                                            )}
                                            <Link href="/dashboard/business/leads" className="hidden sm:block">
                                                <Button variant="ghost" className="text-sm font-bold text-zinc-600 hover:text-orange-600">
                                                    Leads
                                                </Button>
                                            </Link>
                                            <Link href="/dashboard/business/messages" className="hidden sm:block">
                                                <Button variant="ghost" className="text-sm font-bold text-zinc-600 hover:text-orange-600">
                                                    Messages
                                                </Button>
                                            </Link>
                                            <Link href="/dashboard/business/referrers" className="hidden sm:block">
                                                <Button variant="ghost" className="text-sm font-bold text-zinc-600 hover:text-orange-600">
                                                    Referrers
                                                </Button>
                                            </Link>
                                            <Link href="/dashboard/business/profile" className="hidden sm:block">
                                                <Button variant="ghost" className="text-sm font-bold text-zinc-600 hover:text-orange-600">
                                                    Public Profile
                                                </Button>
                                            </Link>
                                            <Link href="/dashboard/business/settings" className="hidden sm:block">
                                                <Button variant="ghost" className="text-sm font-bold text-zinc-600 hover:text-zinc-900">
                                                    Settings
                                                </Button>
                                            </Link>
                                        </>
                                    )}
                                    {isReferrerDashboard && (
                                        <>
                                            <Link href="/dashboard/referrer" className="hidden sm:block">
                                                <Button variant="ghost" className="text-sm font-bold text-zinc-600 hover:text-orange-600">
                                                    Dashboard
                                                </Button>
                                            </Link>
                                            <Link href="/businesses" className="hidden sm:block">
                                                <Button variant="ghost" className="text-sm font-bold text-zinc-600 hover:text-orange-600">
                                                    Find Businesses
                                                </Button>
                                            </Link>
                                            <Link href="/dashboard/referrer/messages" className="hidden sm:block">
                                                <Button variant="ghost" className="text-sm font-bold text-zinc-600 hover:text-orange-600">
                                                    Messages
                                                </Button>
                                            </Link>
                                            <Link href="/dashboard/referrer/withdraw" className="hidden sm:block">
                                                <Button variant="ghost" className="text-sm font-bold text-zinc-600 hover:text-orange-600">
                                                    Withdraw
                                                </Button>
                                            </Link>
                                        </>
                                    )}
                                    {!isBusinessDashboard && !isReferrerDashboard && (
                                        <Link href="/dashboard" className="hidden sm:block">
                                            <Button variant="ghost" className="text-sm font-bold text-zinc-600 hover:text-orange-600">
                                                Dashboard
                                            </Button>
                                        </Link>
                                    )}
                                </>
                            ) : (
                                <Link href="/dashboard" className="hidden sm:block">
                                    <Button className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-full px-6 font-bold">
                                        Dashboard
                                    </Button>
                                </Link>
                            )}
                            <UserButton afterSignOutUrl="/" />
                        </SignedIn>
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

export function Footer() {
    return (
        <footer className="bg-white border-t py-12">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <Link href="/" className="flex items-center gap-2">
                        <Logo size="sm" />
                    </Link>

                    <div className="flex gap-8 text-sm text-zinc-500">
                        <Link href="/privacy" className="hover:text-zinc-900 transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-zinc-900 transition-colors">Terms</Link>
                        <Link href="/support" className="hover:text-zinc-900 transition-colors">Support</Link>
                        <Link href="/contact" className="hover:text-zinc-900 transition-colors">Contact</Link>
                    </div>

                    <div className="text-sm text-zinc-400">
                        © 2026 TradeRefer Pty Ltd
                    </div>
                </div>
            </div>
        </footer>
    );
}
