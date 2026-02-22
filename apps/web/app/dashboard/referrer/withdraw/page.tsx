import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    CreditCard,
    Zap,
    AlertTriangle,
    ChevronRight,
    History,
    HelpCircle
} from "lucide-react";
import Link from "next/link";
import { WithdrawalForm } from "@/components/dashboard/WithdrawalForm";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

async function getWithdrawalData(token: string) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    const [meRes, payoutsRes] = await Promise.all([
        fetch(`${apiUrl}/referrer/me`, {
            headers: { 'Authorization': `Bearer ${token}` },
            cache: 'no-store'
        }),
        fetch(`${apiUrl}/referrer/payouts`, {
            headers: { 'Authorization': `Bearer ${token}` },
            cache: 'no-store'
        })
    ]);

    const referrer = meRes.ok ? await meRes.json() : null;
    const payouts = payoutsRes.ok ? await payoutsRes.json() : [];

    return { referrer, payouts };
}

export default async function ReferrerWithdrawPage() {
    const { userId, getToken } = await auth();
    if (!userId) redirect("/login");
    const token = await getToken();
    if (!token) redirect("/login");

    const { referrer, payouts } = await getWithdrawalData(token);
    
    if (!referrer) {
        redirect("/onboarding/referrer");
    }

    const availableBalance = (referrer.wallet_balance_cents || 0) / 100;
    const lastPayout = payouts.length > 0 ? payouts[0] : null;

    return (
        <div className="min-h-screen bg-zinc-50 pt-16">
            <div className="container mx-auto px-4 py-8 max-w-2xl">
                <div className="mb-8">
                    <Link href="/dashboard/referrer" className="text-zinc-400 hover:text-zinc-900 flex items-center gap-2 text-sm font-bold transition-colors mb-4">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-zinc-900 font-display">Withdraw Funds</h1>
                    <p className="text-zinc-500 font-medium">Transfer your referral earnings to your bank account.</p>
                </div>

                <div className="space-y-6">
                    {/* Available Balance Card */}
                    <div className="bg-zinc-900 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl">
                        <div className="relative z-10">
                            <div className="text-base font-bold text-zinc-400 uppercase tracking-widest mb-2">Available for Withdrawal</div>
                            <div className="text-5xl font-black text-white font-display mb-8">${availableBalance.toFixed(2)}</div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4">
                                    <div className="text-base text-zinc-400 font-bold uppercase tracking-wider mb-1">Last Payout</div>
                                    <div className="text-lg font-bold text-zinc-200">
                                        {lastPayout ? `$${lastPayout.amount.toFixed(2)}` : "None yet"}
                                    </div>
                                </div>
                                <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4">
                                    <div className="text-base text-zinc-400 font-bold uppercase tracking-wider mb-1">Payout Method</div>
                                    <div className="text-lg font-bold text-zinc-200 truncate">
                                        {referrer.stripe_account_id ? "Stripe Connected" : "Not Setup"}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <CreditCard className="absolute -right-12 -bottom-12 w-48 h-48 text-white/5 rotate-12" />
                    </div>

                    <WithdrawalForm />


                    {/* Tax Warning */}
                    {!referrer.abn && (
                        <div className="bg-orange-50 rounded-3xl p-8 border border-orange-100 flex gap-6 items-start">
                            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-6 h-6 text-orange-600" />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-lg font-bold text-orange-900 uppercase tracking-tighter">Australian Tax Residency</h4>
                                <p className="text-sm text-orange-800 leading-relaxed font-medium">
                                    You haven&apos;t provided an ABN. We are required by law to withhold <span className="font-bold underline">47%</span> of your payment for tax purposes unless a valid ABN is provided.
                                </p>
                                <Button variant="link" asChild className="p-0 text-orange-700 font-bold h-auto">
                                    <Link href="/dashboard/referrer/settings">Add ABN to profile</Link>
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Secondary Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <Button variant="ghost" className="flex-1 rounded-2xl h-14 bg-white border border-zinc-100 text-zinc-600 hover:text-zinc-900 font-bold gap-2 shadow-sm">
                            <History className="w-5 h-5" /> Payout History
                        </Button>
                        <Button variant="ghost" className="flex-1 rounded-2xl h-14 bg-white border border-zinc-100 text-zinc-600 hover:text-zinc-900 font-bold gap-2 shadow-sm">
                            <HelpCircle className="w-5 h-5" /> Help Center
                        </Button>
                    </div>
                </div>

                <p className="text-center mt-12 text-base text-zinc-400 font-bold uppercase tracking-widest leading-loose">
                    Payouts are processed daily at 5 PM AEST.<br />
                    © 2026 TradeRefer Pty Ltd
                </p>
            </div>
        </div>
    );
}
