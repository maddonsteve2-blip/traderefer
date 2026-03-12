import {
    ArrowLeft, Gift, CheckCircle2, Clock,
    Mail, HelpCircle, History, LayoutDashboard,
    ShieldCheck, TrendingUp, Star,
} from "lucide-react";
import Link from "next/link";
import { WithdrawalForm } from "@/components/dashboard/WithdrawalForm";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

async function getRewardsData(token: string) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const [meRes, payoutsRes] = await Promise.all([
        fetch(`${apiUrl}/referrer/me`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' }),
        fetch(`${apiUrl}/referrer/payouts`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' })
    ]);
    const referrer = meRes.ok ? await meRes.json() : null;
    const payouts = payoutsRes.ok ? await payoutsRes.json() : [];
    return { referrer, payouts };
}

const CATALOG_BRANDS = [
    { name: "Woolworths", bg: "#007737", text: "#fff" },
    { name: "Bunnings", bg: "#e31837", text: "#fff" },
    { name: "Uber", bg: "#000", text: "#fff" },
    { name: "Netflix", bg: "#e50914", text: "#fff" },
    { name: "Myer", bg: "#1a1a2e", text: "#fff" },
    { name: "JB Hi-Fi", bg: "#ffd600", text: "#111" },
    { name: "Coles", bg: "#e2001a", text: "#fff" },
    { name: "Kmart", bg: "#e31837", text: "#fff" },
    { name: "David Jones", bg: "#1c1c1c", text: "#fff" },
    { name: "Amazon", bg: "#ff9900", text: "#111" },
    { name: "EB Games", bg: "#6d28d9", text: "#fff" },
    { name: "Rebel Sport", bg: "#0f172a", text: "#fff" },
];

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
    const isReady = pendingBalance >= 25;
    const qualityColor = qualityScore >= 70 ? "text-green-600" : qualityScore >= 50 ? "text-amber-500" : "text-red-500";
    const qualityBarColor = qualityScore >= 70 ? "bg-green-500" : qualityScore >= 50 ? "bg-amber-400" : "bg-red-500";

    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="w-full px-4 md:px-6 py-5 md:py-6">

                {/* Breadcrumb */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <Link href="/dashboard/referrer" className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-700 transition-colors font-bold" style={{ fontSize: '18px' }}>
                        <ArrowLeft className="w-4 h-4" /> Dashboard
                    </Link>
                    <span className="text-zinc-300">/</span>
                    <span className="text-zinc-700 font-bold" style={{ fontSize: '18px' }}>Gift Card Rewards</span>
                </div>

                <div className="mb-8">
                    <h1 className="font-black text-zinc-900 flex items-center gap-3" style={{ fontSize: '32px' }}>
                        <Gift className="w-8 h-8 text-orange-500" /> Gift Card Rewards
                    </h1>
                    <p className="text-zinc-500 font-medium mt-1" style={{ fontSize: '19px' }}>
                        Your referral earnings are automatically paid as Prezzee gift cards — accepted at 400+ stores.
                    </p>
                </div>

                {/* ── 2-COLUMN GRID ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    {/* ── LEFT: MAIN CONTENT ── */}
                    <div className="lg:col-span-8 space-y-5">

                        {/* HERO: Balance Card */}
                        <div className="bg-zinc-900 rounded-[32px] p-5 md:p-8 text-white relative overflow-hidden shadow-2xl">
                            {/* Powered by Prezzee badge */}
                            <div className="static md:absolute md:top-6 md:right-7 inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 mb-5 md:mb-0">
                                <span className="font-black text-white" style={{ fontSize: '16px' }}>Powered by</span>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src="https://cdn.prod.website-files.com/67e0cab92cc4f35b3b006055/6808567053b358df8bfa79c3_Logo%20Consumer_Web.svg"
                                    alt="Prezzee"
                                    className="h-5"
                                    style={{ filter: 'brightness(0) invert(1)' }}
                                />
                            </div>

                            <div className="relative z-10 pt-2">
                                <p className="font-black text-zinc-400 uppercase tracking-widest mb-2" style={{ fontSize: '16px' }}>
                                    Pending Reward Balance
                                </p>
                                <p className="font-black text-white tracking-tighter leading-none mb-3" style={{ fontSize: '48px' }}>
                                    ${pendingBalance.toFixed(2)}
                                </p>
                                <p className={`font-black mb-6 ${isReady ? 'text-green-400' : 'text-zinc-400'}`} style={{ fontSize: '19px' }}>
                                    {isReady
                                        ? "✅ Ready to claim — you can claim up to $300 per transaction."
                                        : `Accumulating — gift cards can be claimed once balance reaches $25.00`}
                                </p>

                                {/* Progress bar to $25 */}
                                {!isReady && (
                                    <div className="mb-6">
                                        <div className="flex justify-between mb-1.5">
                                            <span className="font-bold text-zinc-400" style={{ fontSize: '16px' }}>Progress to minimum claim</span>
                                            <span className="font-bold text-orange-400" style={{ fontSize: '16px' }}>${pendingBalance.toFixed(2)} / $25.00</span>
                                        </div>
                                        <div className="w-full bg-white/10 rounded-full h-2.5">
                                            <div className="h-2.5 rounded-full bg-orange-500 transition-all" style={{ width: `${Math.min((pendingBalance / 25) * 100, 100)}%` }} />
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                                        <p className="font-black text-zinc-400 uppercase tracking-widest mb-1" style={{ fontSize: '17px' }}>Total Earned</p>
                                        <p className="font-black text-zinc-100" style={{ fontSize: '24px' }}>${totalEarned.toFixed(2)}</p>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                                        <p className="font-black text-zinc-400 uppercase tracking-widest mb-1" style={{ fontSize: '17px' }}>Last Gift Card</p>
                                        <p className="font-black text-zinc-100" style={{ fontSize: '24px' }}>
                                            {lastGiftCard ? `$${(lastGiftCard.amount_cents / 100).toFixed(2)}` : "None yet"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Gift className="absolute -right-10 -bottom-10 w-44 h-44 text-white/5 rotate-12" />
                        </div>

                        {/* CLAIM BUTTON FORM */}
                        <WithdrawalForm 
                            totalPendingCents={referrer.wallet_balance_cents || 0} 
                            maxClaimCents={30000} 
                        />

                        {/* CATALOG STRIP */}
                        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                                <p className="font-black text-zinc-900" style={{ fontSize: '20px' }}>One Card. 400+ Places to Spend It.</p>
                                <Link href="/rewards" className="font-bold text-orange-500 hover:text-orange-600 underline underline-offset-2" style={{ fontSize: '18px' }}>
                                    See all →
                                </Link>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                                {CATALOG_BRANDS.map((brand) => (
                                    <div
                                        key={brand.name}
                                        className="rounded-xl flex items-center justify-center py-3 px-2 text-center"
                                        style={{ backgroundColor: brand.bg }}
                                    >
                                        <span className="font-black leading-tight text-center" style={{ fontSize: '11px', color: brand.text }}>
                                            {brand.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-zinc-400 font-medium mt-3" style={{ fontSize: '16px' }}>
                                Plus Visa, EFTPOS, Target, Rebel Sport, BWS &amp; hundreds more.
                            </p>
                        </div>

                        {/* HOW REWARDS WORK */}
                        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                            <h3 className="font-black text-zinc-900 mb-4" style={{ fontSize: '20px' }}>How Rewards Work</h3>
                            <div className="space-y-4">
                                {[
                                    { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50", title: "Job confirmed", desc: "Business confirms the job was won and completed." },
                                    { icon: Gift, color: "text-orange-500", bg: "bg-orange-50", title: "Claim Prezzee gift card", desc: "You receive 80% of the unlock fee as credit. Claim from $25 up to $300 at a time." },
                                    { icon: Mail, color: "text-blue-500", bg: "bg-blue-50", title: "Delivered to your email", desc: "Your Prezzee Swap gift card link arrives in your inbox instantly." },
                                    { icon: ShieldCheck, color: "text-zinc-500", bg: "bg-zinc-50", title: "Platform limits", desc: "Maximum claim is $300 per transaction per platform rules." },
                                ].map(({ icon: Icon, color, bg, title, desc }) => (
                                    <div key={title} className="flex items-start gap-4">
                                        <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center shrink-0 mt-0.5`}>
                                            <Icon className={`w-5 h-5 ${color}`} />
                                        </div>
                                        <div>
                                            <p className="font-black text-zinc-900" style={{ fontSize: '17px' }}>{title}</p>
                                            <p className="text-zinc-500 font-medium" style={{ fontSize: '16px' }}>{desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* RECENT GIFT CARDS */}
                        {prezzeePayouts.length > 0 && (
                            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                                <h3 className="font-black text-zinc-900 mb-4 flex items-center gap-2" style={{ fontSize: '20px' }}>
                                    <History className="w-5 h-5 text-zinc-400" /> Recent Gift Cards
                                </h3>
                                <div className="space-y-3">
                                    {prezzeePayouts.slice(0, 5).map((p: { id: string; amount_cents: number; created_at: string; destination_email?: string }) => (
                                        <div key={p.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 border-b border-zinc-50 last:border-0">
                                            <div className="min-w-0">
                                                <p className="font-black text-zinc-900" style={{ fontSize: '17px' }}>${(p.amount_cents / 100).toFixed(2)} Prezzee Swap</p>
                                                <p className="text-zinc-400 font-medium break-all" style={{ fontSize: '16px' }}>
                                                    {new Date(p.created_at).toLocaleDateString('en-AU')} · {p.destination_email || "gift card"}
                                                </p>
                                            </div>
                                            <span className="font-bold text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full" style={{ fontSize: '16px' }}>Issued</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ACTION BUTTONS */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                href="/dashboard/referrer"
                                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-zinc-900 text-white font-bold hover:bg-zinc-800 transition-colors"
                                style={{ fontSize: '18px' }}
                            >
                                <LayoutDashboard className="w-5 h-5" /> Back to Dashboard
                            </Link>
                            <Link
                                href="/contact"
                                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-white border-2 border-zinc-200 text-zinc-700 font-bold hover:border-orange-400 hover:text-orange-600 transition-colors"
                                style={{ fontSize: '18px' }}
                            >
                                <HelpCircle className="w-5 h-5" /> Help Centre
                            </Link>
                        </div>
                    </div>

                    {/* ── RIGHT: SIDEBAR ── */}
                    <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-24 self-start">

                        {/* LEAD QUALITY SCORE */}
                        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                            <h3 className="font-black text-zinc-900 mb-4 flex items-center gap-2" style={{ fontSize: '20px' }}>
                                <ShieldCheck className="w-5 h-5 text-green-500" /> Lead Quality Score
                            </h3>

                            <div className="text-center py-4">
                                <p className={`font-black tracking-tight ${qualityColor}`} style={{ fontSize: '56px', lineHeight: 1 }}>
                                    {qualityScore}
                                </p>
                                <p className="font-black text-zinc-400 uppercase tracking-widest mt-1" style={{ fontSize: '16px' }}>
                                    out of 100
                                </p>
                            </div>

                            <div className="w-full bg-zinc-100 rounded-full h-3 mb-4">
                                <div className={`h-3 rounded-full transition-all ${qualityBarColor}`} style={{ width: `${qualityScore}%` }} />
                            </div>

                            <p className={`font-black text-center leading-snug ${qualityColor}`} style={{ fontSize: '20px' }}>
                                {qualityScore >= 70
                                    ? "Excellent — your leads are top quality. Keep it up!"
                                    : qualityScore >= 50
                                    ? "Some leads are being flagged. Focus on genuine referrals."
                                    : "Low quality detected. Please review your referral practices."}
                            </p>

                            {referrer.accountability_stage && referrer.accountability_stage !== "none" && (
                                <div className={`mt-4 p-4 rounded-xl font-semibold ${
                                    referrer.accountability_stage === "paused" ? "bg-red-50 text-red-700 border border-red-200" :
                                    referrer.accountability_stage === "warning" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                                    "bg-zinc-50 text-zinc-600 border border-zinc-200"
                                }`} style={{ fontSize: '16px' }}>
                                    Account: <span className="font-black uppercase">{referrer.accountability_stage}</span>
                                    {referrer.accountability_stage === "paused" && " — Lead submission paused. Contact support."}
                                </div>
                            )}
                        </div>

                        {/* EARNINGS SUMMARY */}
                        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                            <h3 className="font-black text-zinc-900 mb-4 flex items-center gap-2" style={{ fontSize: '20px' }}>
                                <TrendingUp className="w-5 h-5 text-orange-500" /> Your Earnings
                            </h3>
                            <div className="space-y-3">
                                {[
                                    { label: "Total Earned", value: `$${totalEarned.toFixed(2)}`, highlight: false },
                                    { label: "Pending Balance", value: `$${pendingBalance.toFixed(2)}`, highlight: isReady },
                                    { label: "Gift Cards Issued", value: String(prezzeePayouts.length), highlight: false },
                                ].map(({ label, value, highlight }) => (
                                    <div key={label} className="flex items-center justify-between py-3 border-b border-zinc-50 last:border-0">
                                        <span className="font-bold text-zinc-500" style={{ fontSize: '16px' }}>{label}</span>
                                        <span className={`font-black ${highlight ? "text-green-600" : "text-zinc-900"}`} style={{ fontSize: '20px' }}>{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* PREZZEE SMART CARD VISUAL */}
                        <div className="bg-zinc-900 rounded-2xl overflow-hidden shadow-xl">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="https://files.poweredbyprezzee.com/products/7af951a6-2a13-004b-f0eb-a87382a5b2e7/8eff8e56-2718-4514-8e1a-15ca1eb22793/Prezzee_3D_-_AU_(1)_452_280.gif"
                                alt="Prezzee Smart Card"
                                className="w-full"
                            />
                            <div className="p-4 text-center">
                                <p className="font-black text-white" style={{ fontSize: '17px' }}>The Prezzee Smart Card</p>
                                <p className="text-zinc-400 font-medium" style={{ fontSize: '16px' }}>One card. Endless choice.</p>
                                <Link href="/rewards" className="inline-block mt-3 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-colors" style={{ fontSize: '16px' }}>
                                    View all 400+ brands →
                                </Link>
                            </div>
                        </div>

                        {/* TRUST BADGES */}
                        <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
                            {[
                                { icon: ShieldCheck, text: "Platform standard $300 limit per claim", color: "text-green-500" },
                                { icon: Star, text: "Instant email delivery", color: "text-orange-500" },
                                { icon: Gift, text: "Accepted at 400+ stores nationwide", color: "text-blue-500" },
                            ].map(({ icon: Icon, text, color }) => (
                                <div key={text} className="flex items-center gap-3 py-3 border-b border-zinc-50 last:border-0">
                                    <Icon className={`w-5 h-5 shrink-0 ${color}`} />
                                    <span className="font-bold text-zinc-700" style={{ fontSize: '16px' }}>{text}</span>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>

                <p className="text-center mt-10 text-zinc-400 font-bold uppercase tracking-widest" style={{ fontSize: '16px' }}>
                    Claims processed instantly via Prezzee API · © 2026 TradeRefer Pty Ltd
                </p>

            </div>
        </div>
    );
}
