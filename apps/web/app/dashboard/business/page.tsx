export const dynamic = "force-dynamic";

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Target, Zap, Star, Pencil, User, DollarSign, AlertTriangle, Users, Shield, Info } from "lucide-react";
import { WalletWidget } from "@/components/dashboard/WalletWidget";
import { DashboardError } from "@/components/dashboard/DashboardError";
import { BusinessWelcomeDialog } from "@/components/dashboard/BusinessWelcomeDialog";
import { CommandActionQueue, PartnerLeaderboard } from "@/components/business/CommandCentreQueue";
import { BusinessSidebar } from "@/components/business/BusinessSidebar";
import { CommandStrip } from "@/components/business/CommandStrip";
import { MobileBusinessDashboard } from "@/components/business/MobileBusinessDashboard";
import { AnimatedStatGrid, AnimatedStatCard } from "@/components/ui/AnimatedStatGrid";

const ICON_MAP: Record<string, React.ElementType> = { Target, Zap, Star, Users, DollarSign };

async function getBusinessDashboardData() {
    const { userId, getToken } = await auth();
    if (!userId) {
        redirect("/login");
    }

    const token = await getToken();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/business/dashboard`, {
        cache: 'no-store',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (res.status === 404) {
        return { error: true, noProfile: true };
    }

    if (!res.ok) {
        return { error: true, noProfile: false };
    }

    return res.json();
}

export default async function BusinessDashboardPage() {
    const [{ sessionClaims }, clerkUser] = await Promise.all([auth(), currentUser()]);
    const meta = sessionClaims?.metadata as { role?: string; roles?: string[] } | undefined;
    const roles = meta?.roles ?? (meta?.role ? [meta.role] : []);
    const hasReferrer = roles.includes("referrer");
    const ownerFirstName = clerkUser?.firstName ?? null;

    let data;
    let fetchError = null;
    
    try {
        data = await getBusinessDashboardData();
    } catch (err) {
        // Re-throw Next.js redirect/not-found errors — do NOT swallow them
        if (err && typeof err === 'object' && 'digest' in err) throw err;
        fetchError = err instanceof Error ? err.message : 'Unknown error';
        data = { error: true };
    }

    if (!data || data.error) {
        return <DashboardError fetchError={fetchError} noProfile={data?.noProfile} profileType="business" />;
    }

    const { business, stats: rawStats, recent_leads } = data;
    const apiStats = (rawStats as { label: string; value: string | number; icon: string; color: string; bg: string }[]).map(stat => {
        if (stat.label === "Referral Fee") {
            const feeDollars = parseFloat(String(stat.value).replace("$", "")) || 0;
            return { ...stat, label: "Lead Unlock Cost", value: `$${(feeDollars * 1.2).toFixed(2)}` };
        }
        return stat;
    });
    const walletCents: number = business.wallet_balance_cents || 0;

    const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";

    return (
        <div className="min-h-[100dvh] flex flex-col bg-zinc-50 lg:h-screen lg:overflow-hidden">
            <BusinessWelcomeDialog />

            <div className="w-full flex-1 px-3 lg:px-5 py-4 md:py-5">
                {/* ── MOBILE VIEW (Simplified Design) ── */}
                <MobileBusinessDashboard 
                    business={business} 
                    stats={apiStats} 
                    recentLeads={recent_leads} 
                />

                {/* ── DESKTOP VIEW ── */}
                <div className="hidden lg:grid grid-cols-12 gap-4 items-start lg:h-full">

                    {/* ── LEFT MAIN (9/12, independent scroll) ── */}
                    <div className="lg:col-span-9 min-w-0 space-y-4 pb-4 lg:pb-8 lg:min-h-0 lg:overflow-y-auto lg:pr-5">

                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 md:mb-6">
                            <div className="flex items-start gap-3 min-w-0">
                                <div className="w-10 h-10 bg-orange-100 rounded-2xl flex items-center justify-center shrink-0">
                                    <User className="w-5 h-5 text-orange-600" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h1 className="font-black text-zinc-900 leading-tight break-words text-4xl">
                                            {greeting}, {ownerFirstName ?? business.name}
                                        </h1>
                                        <span className="text-sm font-black bg-slate-800 text-white px-3 py-1 rounded-full uppercase tracking-widest">
                                            Business Mode
                                        </span>
                                        <Link href={`/b/${business.slug}?edit=1`} className="p-1.5 text-zinc-400 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-all">
                                            <Pencil className="w-5 h-5" />
                                        </Link>
                                    </div>
                                    <p className="text-zinc-500 font-bold mt-1 text-lg">
                                        Business Dashboard
                                    </p>
                                </div>
                            </div>
                            <Button asChild variant="outline" className="rounded-full px-8 border-2 border-zinc-200 h-16 font-black text-zinc-600 hover:text-orange-600 transition-all w-full sm:w-auto justify-center shadow-sm active:scale-95 text-xl">
                                <Link href={`/b/${business.slug}`} target="_blank">View Live Profile</Link>
                            </Button>
                        </div>

                        {/* ABN pending banner */}
                        {!business.is_verified && (
                            <Link href="/dashboard/business/settings" className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-4 hover:bg-amber-100 transition-all group">
                                <Shield className="w-5 h-5 text-amber-500 shrink-0" />
                                <div className="flex-1">
                                    <p className="font-black text-amber-800 text-lg">ABN not yet verified</p>
                                    <p className="text-amber-700 font-medium text-base">Verify your ABN in Settings to build trust with referrers and unlock all features.</p>
                                </div>
                                <span className="text-amber-600 font-bold text-sm group-hover:translate-x-1 transition-transform">Go to Settings &rarr;</span>
                            </Link>
                        )}

                        {/* Wallet warning */}
                        {walletCents < 2500 && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-4">
                                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                                <div className="flex-1">
                                    <p className="font-black text-red-700 text-xl">Wallet below minimum — top up to unlock leads</p>
                                    <p className="text-red-600 font-bold mt-0.5 text-lg">Balance: ${(walletCents / 100).toFixed(2)} · Need $25.00</p>
                                </div>
                                <WalletWidget currentBalance={walletCents} />
                            </div>
                        )}

                        {/* Command Strip — recruit + invite wide buttons */}
                        <div id="tour-biz-share-link">
                            <CommandStrip slug={business.slug} />
                        </div>

                        {/* Power Metrics — full-width row, 48px bold values */}
                        <AnimatedStatGrid>
                            {apiStats.map((stat: { label: string; icon: string; bg: string; color: string; value: string | number }) => {
                                const Icon = ICON_MAP[stat.icon] || Target;
                                return (
                                    <AnimatedStatCard key={stat.label}>
                                        <div className="bg-white border border-zinc-100 rounded-2xl p-4 hover:shadow-md transition-all group">
                                            <div className="flex items-center gap-1.5 mb-1.5">
                                                <div className="w-9 h-9 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                <span className="font-bold text-zinc-400 text-[11px]">{stat.label}{stat.label === 'Lead Unlock Cost' && <span title="This is the cost a business pays to unlock a lead's contact details. It includes the referral fee + 20% platform fee." className="inline-flex ml-1 cursor-help"><Info className="w-3 h-3 text-zinc-300" /></span>}</span>
                                            </div>
                                            <div className="font-black text-zinc-900 leading-none tracking-tight text-base">{stat.value}</div>
                                        </div>
                                    </AnimatedStatCard>
                                );
                            })}
                        </AnimatedStatGrid>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
                            <div id="tour-biz-action-queue">
                                <CommandActionQueue recentLeads={recent_leads} />
                            </div>

                            <div>
                                <PartnerLeaderboard />
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT SIDEBAR (3/12, independent scroll) ── */}
                    <aside className="lg:col-span-3 bg-slate-50 rounded-2xl lg:rounded-l-2xl pb-4 lg:pb-8 lg:min-h-0 lg:overflow-y-auto">
                        <BusinessSidebar
                            slug={business.slug}
                            businessName={business.name}
                            hasReferrer={hasReferrer}
                        />
                    </aside>

                </div>
            </div>
        </div>
    );
}
