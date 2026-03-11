import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Target, Zap, Star, Pencil, User, DollarSign, AlertTriangle, Users } from "lucide-react";
import { WalletWidget } from "@/components/dashboard/WalletWidget";
import { DashboardError } from "@/components/dashboard/DashboardError";
import { BusinessWelcomeDialog } from "@/components/dashboard/BusinessWelcomeDialog";
import { CommandActionQueue, PartnerLeaderboard } from "@/components/business/CommandCentreQueue";
import { BusinessSidebar } from "@/components/business/BusinessSidebar";
import { CommandStrip } from "@/components/business/CommandStrip";

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
    const { sessionClaims } = await auth();
    const meta = sessionClaims?.metadata as { role?: string; roles?: string[] } | undefined;
    const roles = meta?.roles ?? (meta?.role ? [meta.role] : []);
    const hasReferrer = roles.includes("referrer");

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

    const { business, stats: apiStats, recent_leads } = data;
    const walletCents: number = business.wallet_balance_cents || 0;

    const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";

    return (
        <div className="min-h-[100dvh] pt-[72px] md:pt-[100px] flex flex-col bg-zinc-50 lg:h-screen lg:overflow-hidden">
            <BusinessWelcomeDialog />

            <div className="w-full flex-1 px-3 lg:px-5 py-4 md:py-5">

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start lg:h-full">

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
                                        <h1 className="font-black text-zinc-900 leading-tight break-words" style={{ fontSize: 24 }}>
                                            {greeting}, {business.name}
                                        </h1>
                                        <span className="text-[10px] font-bold bg-slate-800 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">
                                            Business Mode
                                        </span>
                                        <Link href={`/b/${business.slug}?edit=1`} className="p-1.5 text-zinc-400 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-all">
                                            <Pencil className="w-4 h-4" />
                                        </Link>
                                    </div>
                                    <p className="text-zinc-500 font-bold uppercase tracking-wide mt-0.5" style={{ fontSize: 12 }}>
                                        Business Command Centre
                                    </p>
                                </div>
                            </div>
                            <Button asChild variant="outline" className="rounded-full px-5 border-zinc-200 h-10 font-bold text-zinc-600 hover:text-orange-600 transition-all w-full sm:w-auto justify-center" style={{ fontSize: 14 }}>
                                <Link href={`/b/${business.slug}`} target="_blank">View Live Profile</Link>
                            </Button>
                        </div>

                        {/* Wallet warning */}
                        {walletCents < 2500 && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-4">
                                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                                <div className="flex-1">
                                    <p className="font-bold text-red-700" style={{ fontSize: 14 }}>Wallet below minimum — top up to unlock leads</p>
                                    <p className="text-red-600 font-medium" style={{ fontSize: 13 }}>Balance: ${(walletCents / 100).toFixed(2)} · Need $25.00</p>
                                </div>
                                <WalletWidget currentBalance={walletCents} />
                            </div>
                        )}

                        {/* Command Strip — recruit + invite wide buttons */}
                        <CommandStrip slug={business.slug} />

                        {/* Power Metrics — full-width row, 48px bold values */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {apiStats.map((stat: { label: string; icon: string; bg: string; color: string; value: string | number }) => {
                                const Icon = ICON_MAP[stat.icon] || Target;
                                return (
                                    <div key={stat.label} className="bg-white border border-zinc-100 rounded-2xl p-5 hover:shadow-md hover:-translate-y-px transition-all group">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className={`w-8 h-8 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <span className="font-bold text-zinc-400 uppercase tracking-wider" style={{ fontSize: 14 }}>{stat.label}</span>
                                        </div>
                                        <div className="font-black text-zinc-900 leading-none" style={{ fontSize: 32 }}>{stat.value}</div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
                            <div>
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
