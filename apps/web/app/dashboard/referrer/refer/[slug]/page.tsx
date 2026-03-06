import {
    Star,
    MapPin,
    DollarSign,
    Clock,
    Users,
    TrendingUp,
    ChevronRight,
    MessageSquare,
    Zap,
    Tag,
    Gift,
    Flame,
    Award,
    Briefcase,
    ArrowRight,
    ShieldCheck,
    Rocket,
    CheckCircle,
    Building2,
    LayoutDashboard
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ShareKitGate } from "@/components/referrer/ShareKitGate";
import { StartReferringButton } from "@/components/referrer/StartReferringButton";
import { PrivateFeedback } from "@/components/referrer/PrivateFeedback";
import { BusinessLogo } from "@/components/BusinessLogo";

async function getBusiness(slug: string) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const res = await fetch(`${apiUrl}/businesses/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
}

async function getDeals(slug: string) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    try {
        const res = await fetch(`${apiUrl}/businesses/${slug}/deals`, { cache: 'no-store' });
        if (!res.ok) return [];
        return res.json();
    } catch { return []; }
}

async function getCampaigns(slug: string) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    try {
        const res = await fetch(`${apiUrl}/businesses/${slug}/campaigns`, { cache: 'no-store' });
        if (!res.ok) return [];
        return res.json();
    } catch { return []; }
}

export default async function DashboardReferPage({
    params
}: {
    params: Promise<{ slug: string }>;
}) {
    const { userId } = await auth();
    if (!userId) {
        const { slug: slugParam } = await params;
        redirect(`/login?redirect_url=/dashboard/referrer/refer/${slugParam}`);
    }

    const { slug } = await params;
    const [business, deals, campaigns] = await Promise.all([
        getBusiness(slug),
        getDeals(slug),
        getCampaigns(slug)
    ]);

    if (!business) notFound();

    const commissionPerLead = (business.referral_fee_cents || 1000) / 100;
    const platformFee = commissionPerLead * 0.2;
    const referrerEarns = commissionPerLead * 0.8;
    const connectionRate = business.connection_rate || 0;
    const totalConfirmed = business.total_confirmed || 0;
    const trustScore = business.trust_score ? (business.trust_score / 20).toFixed(1) : "5.0";

    const allFeatures = business.features?.length > 0 ? business.features
        : business.business_highlights?.length > 0 ? business.business_highlights
            : ["Licensed & Insured", "Verified Business", "Fast Response Time", "TradeRefer Trusted"];

    const formatEarnings = (amount: number) =>
        Number.isInteger(amount) ? `$${amount}` : `$${amount.toFixed(2)}`;

    return (
        <main className="min-h-screen bg-zinc-50">

            {/* ── BREADCRUMBS ── */}
            <div className="bg-white border-b border-zinc-100 pt-20 pb-4">
                <div className="container mx-auto px-4">
                    <nav className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                        <Link href="/dashboard/referrer" className="hover:text-zinc-600 transition-colors flex items-center gap-1">
                            <LayoutDashboard className="w-3 h-3" /> Dashboard
                        </Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href="/businesses" className="hover:text-zinc-600 transition-colors">Find Businesses</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href={`/b/${slug}`} className="hover:text-zinc-600 transition-colors truncate max-w-[180px]">{business.business_name}</Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-orange-600 font-black">Refer & Earn</span>
                    </nav>
                </div>
            </div>

            {/* ── HERO ── */}
            <div className="bg-white pb-16 border-b border-zinc-200">
                <div className="container mx-auto px-4 pt-10">
                    <div className="flex flex-col lg:flex-row gap-10 items-start">

                        {/* Left: Business Identity */}
                        <div className="flex-1 space-y-6">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full text-xs font-black uppercase tracking-widest border border-orange-100">
                                    <Briefcase className="w-3.5 h-3.5" /> Referral Program
                                </span>
                                {business.is_verified && (
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white rounded-full text-xs font-black uppercase tracking-widest">
                                        <ShieldCheck className="w-3.5 h-3.5" /> Verified Partner
                                    </span>
                                )}
                            </div>

                            {/* Business name + logo side by side — logo fills its own box */}
                            <div className="flex items-center gap-5">
                                <BusinessLogo logoUrl={business.logo_url} name={business.business_name} size="lg" />
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-black text-zinc-900 leading-tight tracking-tight">
                                        {business.business_name}
                                    </h1>
                                    <p className="text-base text-zinc-500 font-bold mt-1 flex items-center gap-2 flex-wrap">
                                        <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                                        {business.suburb}{business.state ? `, ${business.state}` : ''}
                                        {business.trade_category && (
                                            <>
                                                <span className="text-zinc-300">·</span>
                                                <span>{business.trade_category}</span>
                                            </>
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Earnings headline */}
                            <div className="pt-2">
                                <p className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-1">You earn</p>
                                <div className="flex items-baseline gap-3">
                                    <span className="text-6xl md:text-7xl font-black text-zinc-900 tracking-tighter">{formatEarnings(referrerEarns)}</span>
                                    <span className="text-xl font-black text-zinc-500">per verified lead</span>
                                </div>
                            </div>

                            {/* Stats row — hide 0% */}
                            <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-500 font-bold">
                                <div className="flex items-center gap-2">
                                    <Star className="w-4 h-4 text-orange-400 fill-orange-400" />
                                    Trust Score: {trustScore}/5.0
                                </div>
                                {totalConfirmed > 0 && (
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-orange-500" />
                                        {totalConfirmed} jobs closed
                                    </div>
                                )}
                                {connectionRate > 0 ? (
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-orange-500" />
                                        {connectionRate}% connection rate
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-orange-500" />
                                        New program — be one of the first referrers
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: Earnings Card */}
                        <div className="bg-zinc-900 text-white rounded-3xl p-8 shrink-0 w-full lg:w-[280px] border-b-4 border-orange-500">
                            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">Your Earnings Per Lead</p>
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-5xl font-black tracking-tighter">{formatEarnings(referrerEarns)}</span>
                                <span className="text-base font-black text-orange-400">80% of fee</span>
                            </div>
                            <p className="text-sm text-zinc-400 font-medium leading-relaxed">
                                Paid directly to you when the business confirms the lead.
                            </p>
                            <div className="mt-6 pt-6 border-t border-zinc-700 flex items-center justify-between text-xs font-black text-zinc-500 uppercase tracking-widest">
                                <span>Platform fee</span>
                                <span className="text-zinc-300">{formatEarnings(platformFee)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── BODY ── */}
            <div className="container mx-auto px-4 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* ── MAIN COLUMN ── */}
                    <div className="lg:col-span-2 space-y-10">

                        {/* About This Business */}
                        <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-orange-600" />
                                </div>
                                <h2 className="text-xl font-black text-zinc-900">About {business.business_name}</h2>
                            </div>

                            {business.description && (
                                <p className="text-base text-zinc-600 leading-relaxed mb-8 font-medium">
                                    {business.description}
                                </p>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-2xl">
                                    <MapPin className="w-5 h-5 text-orange-500 shrink-0" />
                                    <div>
                                        <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Service Area</p>
                                        <p className="text-sm font-bold text-zinc-800">{business.suburb}{business.state ? `, ${business.state}` : ''}</p>
                                    </div>
                                </div>
                                {business.trade_category && (
                                    <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-2xl">
                                        <Briefcase className="w-5 h-5 text-orange-500 shrink-0" />
                                        <div>
                                            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Trade</p>
                                            <p className="text-sm font-bold text-zinc-800">{business.trade_category}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-2xl">
                                    <ShieldCheck className="w-5 h-5 text-orange-500 shrink-0" />
                                    <div>
                                        <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Verification</p>
                                        <p className="text-sm font-bold text-zinc-800">{business.is_verified ? "Fully Verified" : "Registered"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-2xl">
                                    <Star className="w-5 h-5 text-orange-500 shrink-0" />
                                    <div>
                                        <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Trust Score</p>
                                        <p className="text-sm font-bold text-zinc-800">{trustScore} / 5.0</p>
                                    </div>
                                </div>
                            </div>

                            {allFeatures.length > 0 && (
                                <div>
                                    <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">Key Highlights</p>
                                    <div className="flex flex-wrap gap-2">
                                        {allFeatures.map((feature: string, i: number) => (
                                            <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full text-xs font-bold border border-orange-100">
                                                <CheckCircle className="w-3.5 h-3.5" /> {feature}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* Why Refer — all orange */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { icon: DollarSign, title: "Fast Payouts", body: `Earn ${formatEarnings(referrerEarns)} as soon as ${business.business_name} validates the lead.` },
                                { icon: Users, title: "Track Leads", body: "Real-time dashboard tracking for every lead you send. See which jobs are confirmed." },
                                { icon: Award, title: "Trusted Pro", body: `${business.business_name} is a${business.is_verified ? ' fully verified' : ''} ${business.trade_category || 'trade'} professional.` },
                            ].map(({ icon: Icon, title, body }) => (
                                <div key={title} className="bg-white rounded-3xl border border-zinc-200 p-8 shadow-sm group hover:border-orange-200 transition-all">
                                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 mb-6 group-hover:scale-110 transition-transform">
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-base font-black text-zinc-900 mb-2">{title}</h3>
                                    <p className="text-sm text-zinc-500 leading-relaxed font-medium">{body}</p>
                                </div>
                            ))}
                        </div>

                        {/* Active Campaigns */}
                        {campaigns && campaigns.length > 0 && (
                            <section className="bg-zinc-900 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
                                <Flame className="absolute -bottom-10 -right-10 w-48 h-48 text-orange-500 opacity-10 rotate-12" />
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-8">
                                        <h2 className="text-2xl font-black">Active Bonus Campaigns</h2>
                                        <span className="px-3 py-1 bg-orange-500 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">Hot Rewards</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {campaigns.map((campaign: any) => (
                                            <div key={campaign.id} className="p-6 bg-white/5 border border-white/10 rounded-2xl flex items-start justify-between gap-4 hover:bg-white/10 transition-all">
                                                <div className="space-y-1">
                                                    <h3 className="font-black text-zinc-100 uppercase tracking-tight">{campaign.title}</h3>
                                                    <p className="text-xs text-zinc-400 font-medium leading-relaxed">{campaign.description || "Limited time bonus for active referrers."}</p>
                                                    <div className="flex items-center gap-2 mt-4 text-[10px] text-orange-500 font-black uppercase">
                                                        <Clock className="w-3 h-3" />
                                                        Ends {new Date(campaign.ends_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-xl font-black text-orange-500">
                                                        {campaign.campaign_type === 'flat_bonus' && `+$${(campaign.bonus_amount_cents / 100).toFixed(0)}`}
                                                        {campaign.campaign_type === 'multiplier' && `${campaign.multiplier}x`}
                                                    </p>
                                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Bonus</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Earnings Estimator */}
                        <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-12 shadow-sm">
                            <div className="text-center mb-10">
                                <h2 className="text-3xl font-black text-zinc-900 mb-3">Potential Monthly Earnings</h2>
                                <p className="text-base text-zinc-500 font-medium">See how much you could earn referring {business.business_name}.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { referrals: 3, label: "Casual", icon: Rocket },
                                    { referrals: 10, label: "Active", icon: TrendingUp },
                                    { referrals: 25, label: "Power", icon: Zap },
                                ].map((tier) => (
                                    <div key={tier.label} className="p-8 bg-zinc-50 rounded-3xl border border-zinc-100 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                                        <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-50 flex items-center justify-center mb-6 text-orange-500">
                                            <tier.icon className="w-7 h-7" />
                                        </div>
                                        <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">{tier.label}</p>
                                        <p className="text-5xl font-black text-zinc-900 leading-none mb-1 tracking-tighter">${(tier.referrals * referrerEarns).toFixed(0)}</p>
                                        <p className="text-sm text-zinc-400 font-bold mt-2">{tier.referrals} referrals / mo</p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-8 p-5 bg-zinc-50 rounded-2xl">
                                <p className="text-sm text-zinc-400 font-medium text-center">Estimates based on {formatEarnings(referrerEarns)} per verified lead. Excludes bonus campaigns.</p>
                            </div>
                        </section>

                        {/* Deals */}
                        {deals && deals.length > 0 && (
                            <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-12 shadow-sm">
                                <h2 className="text-2xl font-black text-zinc-900 mb-8 flex items-center gap-3">
                                    <Gift className="w-6 h-6 text-orange-500" /> Exclusive Referral Deals
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {deals.map((deal: any) => (
                                        <div key={deal.id} className="p-6 bg-orange-50/50 rounded-3xl border border-orange-100 relative overflow-hidden group hover:bg-orange-50 transition-colors">
                                            <div className="absolute top-4 right-4 text-orange-200 group-hover:text-orange-300 transition-colors">
                                                <Tag className="w-8 h-8 rotate-12" />
                                            </div>
                                            <div className="relative z-10 pr-10">
                                                <h3 className="text-lg font-black text-zinc-900 mb-2 leading-tight uppercase tracking-tight">{deal.title}</h3>
                                                <p className="text-sm text-zinc-600 font-medium leading-relaxed mb-4">{deal.description || "Referral-only special offer."}</p>
                                                {deal.discount_text && (
                                                    <span className="px-3 py-1 bg-white text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100">
                                                        {deal.discount_text}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Private Feedback */}
                        <div className="p-8 bg-white rounded-3xl border border-zinc-200 shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center shrink-0">
                                    <MessageSquare className="w-5 h-5 text-orange-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-base font-black text-zinc-900 mb-1">Send Private Feedback</h3>
                                    <p className="text-sm text-zinc-500 font-medium mb-4">Have a direct experience with {business.business_name}? Send confidential feedback to the TradeRefer team — it helps us maintain quality.</p>
                                    <PrivateFeedback businessSlug={business.slug} businessName={business.business_name} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── SIDEBAR ── */}
                    <div className="space-y-6 lg:sticky lg:top-24 self-start">

                        {/* CTA card */}
                        <div className="bg-white rounded-3xl border border-zinc-200 p-8 shadow-xl">
                            <h3 className="text-xl font-black text-zinc-900 mb-1">Get Your Referral Link</h3>
                            <p className="text-sm text-zinc-400 mb-6 font-medium">Earn {formatEarnings(referrerEarns)} for every verified lead you send.</p>
                            <StartReferringButton slug={slug} businessName={business.business_name} />
                            {totalConfirmed > 0 && (
                                <div className="mt-6 pt-6 border-t border-zinc-100 flex items-center justify-between">
                                    <div className="text-center flex-1">
                                        <p className="text-2xl font-black text-zinc-900">{totalConfirmed}</p>
                                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-tight mt-1">Jobs Closed</p>
                                    </div>
                                    <div className="w-px h-8 bg-zinc-100" />
                                    <div className="text-center flex-1">
                                        <p className="text-2xl font-black text-zinc-900">{connectionRate}%</p>
                                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-tight mt-1">Connect Rate</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Share Kit */}
                        <div className="bg-zinc-900 rounded-3xl p-8 text-white shadow-xl">
                            <h3 className="text-sm font-black uppercase tracking-widest mb-1 text-orange-400">Share Assets</h3>
                            <p className="text-xs text-zinc-400 mb-5 font-medium leading-relaxed">Once you start referring, unlock pre-written messages for WhatsApp, Email or SMS.</p>
                            <ShareKitGate
                                slug={slug}
                                businessName={business.business_name}
                                tradeCategory={business.trade_category}
                                suburb={business.suburb}
                                commission={referrerEarns}
                                deals={deals}
                            />
                        </div>

                        {/* Business Info */}
                        <div className="bg-white rounded-3xl border border-zinc-200 p-8 shadow-sm">
                            <h3 className="text-base font-black text-zinc-900 mb-6">Business Info</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                                    <div>
                                        <p className="text-xs font-black text-zinc-400 uppercase tracking-tight">Service Area</p>
                                        <p className="text-sm font-bold text-zinc-800">{business.suburb}{business.state ? `, ${business.state}` : ''}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <ShieldCheck className="w-4 h-4 text-orange-500 shrink-0" />
                                    <div>
                                        <p className="text-xs font-black text-zinc-400 uppercase tracking-tight">Status</p>
                                        <p className="text-sm font-bold text-green-600">{business.is_verified ? "Fully Verified" : "Registered"}</p>
                                    </div>
                                </div>
                                {business.description && (
                                    <div className="pt-4 border-t border-zinc-100">
                                        <p className="text-sm text-zinc-500 font-medium leading-relaxed line-clamp-4">
                                            {business.description.slice(0, 200)}{business.description.length > 200 ? '…' : ''}
                                        </p>
                                    </div>
                                )}
                                <Link href={`/b/${slug}`} className="mt-2 inline-flex items-center gap-1 text-sm font-black text-orange-600 hover:text-orange-700 transition-colors">
                                    View Full Profile <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
