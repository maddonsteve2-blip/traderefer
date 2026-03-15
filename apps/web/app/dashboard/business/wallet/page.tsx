"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Loader2, Wallet, CreditCard, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import Link from "next/link";
import { WalletWidget } from "@/components/dashboard/WalletWidget";
import { PageTransition } from "@/components/ui/PageTransition";

interface Transaction {
    id: string;
    type: string;
    amount_cents: number;
    description: string;
    created_at: string;
    balance_after_cents?: number;
}

function safeDateFormat(d: string): string {
    if (!d) return "";
    try {
        const date = new Date(d.endsWith("Z") || d.includes("+") || d.includes("T") ? d : d + "Z");
        if (isNaN(date.getTime())) return "";
        return date.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
    } catch {
        return "";
    }
}

export default function BusinessWalletPage() {
    const { getToken, isLoaded } = useAuth();
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoaded) return;
        (async () => {
            try {
                const token = await getToken();
                const res = await fetch("/api/backend/business/me", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setBalance(data.wallet_balance_cents || 0);
                }

                const txRes = await fetch("/api/backend/business/transactions", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (txRes.ok) {
                    const txData = await txRes.json();
                    setTransactions(Array.isArray(txData) ? txData : []);
                }
            } catch (err) {
                console.error("Failed to load wallet data:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, [isLoaded, getToken]);

    if (loading) {
        return (
            <PageTransition className="min-h-screen bg-zinc-50">
                <div className="p-6 space-y-5 max-w-3xl mx-auto pt-10">
                    <div className="h-7 w-28 bg-zinc-200 rounded-xl animate-pulse" />
                    <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
                        <div className="h-10 w-48 bg-zinc-100 rounded-xl animate-pulse" />
                        <div className="h-4 w-32 bg-zinc-50 rounded-lg animate-pulse" />
                    </div>
                    <div className="space-y-3">
                        {[1,2,3].map(i => <div key={i} className="h-16 bg-white rounded-2xl border border-zinc-200 animate-pulse" />)}
                    </div>
                </div>
            </PageTransition>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-base font-semibold text-zinc-400">
                        <Link href="/dashboard/business" className="hover:text-zinc-800 transition-colors">Dashboard</Link>
                        <span>/</span>
                        <span className="text-zinc-700">Wallet</span>
                    </div>
                    <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Wallet</h1>
                    <p className="text-xl text-zinc-500 font-medium">Manage your balance and view transaction history.</p>
                </div>

                {/* Balance Card */}
                <div className="bg-zinc-900 rounded-3xl p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center">
                            <Wallet className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <p className="font-black text-zinc-400 uppercase tracking-widest text-xs">Current Balance</p>
                            <p className="font-black text-white text-5xl tracking-tight">${(balance / 100).toFixed(2)}</p>
                        </div>
                    </div>
                    <WalletWidget currentBalance={balance} />
                </div>

                {balance < 2500 && (
                    <div className="p-5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-4">
                        <CreditCard className="w-6 h-6 text-red-500 shrink-0" />
                        <div>
                            <p className="font-black text-red-700 text-lg">Balance below minimum</p>
                            <p className="text-red-600 font-medium">You need at least $25.00 to unlock leads. Top up your wallet to continue receiving leads.</p>
                        </div>
                    </div>
                )}

                {/* Transaction History */}
                <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden">
                    <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between">
                        <h2 className="font-black text-zinc-900 text-2xl flex items-center gap-3">
                            <TrendingUp className="w-6 h-6 text-orange-500" />
                            Transaction History
                        </h2>
                        <span className="text-zinc-400 font-bold text-lg">{transactions.length} transactions</span>
                    </div>

                    {transactions.length === 0 ? (
                        <div className="px-8 py-16 text-center">
                            <Wallet className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                            <p className="font-black text-zinc-400 text-xl">No transactions yet</p>
                            <p className="text-zinc-400 font-medium mt-1 text-lg">Top up your wallet to start unlocking leads.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-100">
                            {transactions.map((tx) => {
                                const isCredit = tx.amount_cents > 0;
                                return (
                                    <div key={tx.id} className="px-8 py-5 flex items-center justify-between gap-4 hover:bg-zinc-50 transition-colors">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isCredit ? "bg-emerald-50" : "bg-red-50"}`}>
                                                {isCredit ? <ArrowDownRight className="w-5 h-5 text-emerald-600" /> : <ArrowUpRight className="w-5 h-5 text-red-500" />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-zinc-900 text-lg truncate">{tx.description || tx.type}</p>
                                                <p className="text-zinc-400 font-medium text-base">{safeDateFormat(tx.created_at)}</p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className={`font-black text-xl ${isCredit ? "text-emerald-600" : "text-zinc-900"}`}>
                                                {isCredit ? "+" : "-"}${(Math.abs(tx.amount_cents) / 100).toFixed(2)}
                                            </p>
                                            {tx.balance_after_cents !== undefined && (
                                                <p className="text-zinc-400 font-medium text-sm">Bal: ${(tx.balance_after_cents / 100).toFixed(2)}</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
