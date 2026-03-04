import {
    ArrowLeft,
    Gift,
    CheckCircle2,
    Clock,
    Mail,
    HelpCircle,
    History,
    Star,
} from "lucide-react";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

async function getRewardsData(token: string) {
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

export default async function ReferrerRewardsPage() {
    const { userId, getToken } = await auth();
    if (!userId) redirect("/login");
    const token = await getToken();
    if (!token) redirect("/login");

    const { referrer, payouts } = await getRewardsData(token);

    if (!referrer) redirect("/onboarding/referrer");

    const pendingBalance = (referrer.wallet_balance_cents || 0) / 100;
    const totalEarned = (referrer.total_earned_cents || 0) / 100;
    const prezzeePayouts = payouts.filter((p: { method?: string }) => p.method === 'PREZZEE_SWAP');
    const lastGiftCard = prezzeePayouts.length > 0 ? prezzeePayouts[0] : null;
    const qualityScore = referrer.quality_score ?? 100;

    return (
        <div className="min-h-screen bg-zinc-50 pt-16">
            <div className="container mx-auto px-4 py-8 max-w-2xl">
                <div className="mb-8">
                    <Link href="/dashboard/referrer" className="text-zinc-400 hover:text-zinc-900 flex items-center gap-2 text-sm font-bold transition-colors mb-4">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-zinc-900 font-display">Gift Card Rewards</h1>
                    <p className="text-zinc-500 font-medium">Your referral earnings are automatically paid as Prezzee gift cards.</p>
                </div>

                <div className="space-y-6">
                    {/* Hero balance card */}
                    <div className="bg-zinc-900 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl">
                        <div className="relative z-10">
                            <div className="text-base font-bold text-zinc-400 uppercase tracking-widest mb-2">Pending Reward Balance</div>
                            <div className="text-5xl font-black text-white font-display mb-2">${pendingBalance.toFixed(2)}</div>
                            <p className="text-zinc-400 text-sm font-medium mb-8">
                                {pendingBalance >= 5
                                    ? "✅ Ready — issued automatically on your next confirmed job"
                                    : `Accumulating — gift card issued once balance reaches $5.00`}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4">
                                    <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-1">Total Earned</div>
                                    <div className="text-lg font-bold text-zinc-200">${totalEarned.toFixed(2)}</div>
                                </div>
                                <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4">
                                    <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-1">Last Gift Card</div>
                                    <div className="text-lg font-bold text-zinc-200">
                                        {lastGiftCard
                                            ? `$${(lastGiftCard.amount_cents / 100).toFixed(2)}`
                                            : "None yet"}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Gift className="absolute -right-12 -bottom-12 w-48 h-48 text-white/5 rotate-12" />
                    </div>

                    {/* How it works */}
                    <div className="bg-white rounded-3xl p-8 border border-zinc-100 shadow-sm">
                        <h3 className="text-lg font-bold text-zinc-900 mb-6">How rewards work</h3>
                        <div className="space-y-5">
                            {[
                                { icon: CheckCircle2, color: "text-green-500", title: "Job confirmed", desc: "Business and customer both confirm the job was won and hired." },
                                { icon: Gift, color: "text-orange-500", title: "Prezzee gift card issued", desc: "You receive 80% of the unlock fee as a Prezzee Swap gift card — spend it anywhere." },
                                { icon: Mail, color: "text-blue-500", title: "Delivered to your email", desc: "Gift card link arrives in your inbox automatically. No action needed." },
                                { icon: Clock, color: "text-zinc-400", title: "Minimum $5 per card", desc: "Rewards under $5 accumulate until they reach the minimum to avoid card fees." },
                            ].map(({ icon: Icon, color, title, desc }) => (
                                <div key={title} className="flex items-start gap-4">
                                    <div className={`mt-0.5 ${color}`}><Icon className="w-5 h-5" /></div>
                                    <div>
                                        <div className="font-bold text-zinc-900 text-sm">{title}</div>
                                        <div className="text-sm text-zinc-500">{desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quality score */}
                    <div className="bg-white rounded-3xl p-8 border border-zinc-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-zinc-900">Lead Quality Score</h3>
                            <div className={`text-2xl font-black ${qualityScore >= 70 ? "text-green-600" : qualityScore >= 50 ? "text-amber-500" : "text-red-500"}`}>
                                {qualityScore}/100
                            </div>
                        </div>
                        <div className="w-full bg-zinc-100 rounded-full h-3 mb-3">
                            <div
                                className={`h-3 rounded-full transition-all ${qualityScore >= 70 ? "bg-green-500" : qualityScore >= 50 ? "bg-amber-400" : "bg-red-500"}`}
                                style={{ width: `${qualityScore}%` }}
                            />
                        </div>
                        <p className="text-sm text-zinc-500">
                            {qualityScore >= 70
                                ? "Great work! Your leads are high quality."
                                : qualityScore >= 50
                                ? "Some of your leads are being flagged. Focus on genuine referrals."
                                : "Warning: low quality score. Please review your referral practices."}
                        </p>
                        {referrer.accountability_stage && referrer.accountability_stage !== "none" && (
                            <div className={`mt-4 p-4 rounded-2xl text-sm font-semibold ${
                                referrer.accountability_stage === "paused" ? "bg-red-50 text-red-700" :
                                referrer.accountability_stage === "warning" ? "bg-amber-50 text-amber-700" :
                                "bg-zinc-50 text-zinc-600"
                            }`}>
                                Account status: <span className="font-bold uppercase">{referrer.accountability_stage}</span>
                                {referrer.accountability_stage === "paused" && " — Lead submission is paused. Contact support."}
                            </div>
                        )}
                    </div>

                    {/* Recent gift cards */}
                    {prezzeePayouts.length > 0 && (
                        <div className="bg-white rounded-3xl p-8 border border-zinc-100 shadow-sm">
                            <h3 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
                                <History className="w-5 h-5 text-zinc-400" /> Recent Gift Cards
                            </h3>
                            <div className="space-y-3">
                                {prezzeePayouts.slice(0, 5).map((p: { id: string; amount_cents: number; created_at: string; destination_email?: string }) => (
                                    <div key={p.id} className="flex items-center justify-between py-3 border-b border-zinc-50 last:border-0">
                                        <div>
                                            <div className="font-bold text-zinc-900 text-sm">${(p.amount_cents / 100).toFixed(2)} Prezzee Swap</div>
                                            <div className="text-xs text-zinc-400">{new Date(p.created_at).toLocaleDateString('en-AU')} · {p.destination_email || "gift card"}</div>
                                        </div>
                                        <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">Issued</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 pt-2">
                        <Link href="/dashboard/referrer" className="flex-1 flex items-center justify-center gap-2 h-14 rounded-2xl bg-white border border-zinc-100 text-zinc-600 hover:text-zinc-900 font-bold text-sm shadow-sm transition-colors">
                            <Star className="w-5 h-5" /> Back to Dashboard
                        </Link>
                        <Link href="/contact" className="flex-1 flex items-center justify-center gap-2 h-14 rounded-2xl bg-white border border-zinc-100 text-zinc-600 hover:text-zinc-900 font-bold text-sm shadow-sm transition-colors">
                            <HelpCircle className="w-5 h-5" /> Help Centre
                        </Link>
                    </div>
                </div>

                <p className="text-center mt-12 text-base text-zinc-400 font-bold uppercase tracking-widest leading-loose">
                    Rewards issued automatically after job confirmation.<br />
                    © 2026 TradeRefer Pty Ltd
                </p>
            </div>
        </div>
    );
}
