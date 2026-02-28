import { Button } from "@/components/ui/button";
import {
    Shield,
    Star,
    MapPin,
    DollarSign,
    Clock,
    Users,
    TrendingUp,
    ChevronLeft,
    ChevronRight,
    Copy,
    MessageSquare,
    Share2,
    Zap,
    CheckCircle2,
    ExternalLink,
    Phone,
    Tag,
    Gift,
    Flame,
    Award,
    Wrench,
    Briefcase,
    Image as ImageIcon,
    ArrowRight,
    TrendingDown,
    ShieldCheck,
    Banknote,
    Rocket
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShareKitGate } from "@/components/referrer/ShareKitGate";
import { StartReferringButton } from "@/components/referrer/StartReferringButton";
import { PrivateFeedback } from "@/components/referrer/PrivateFeedback";
import { BusinessLogo } from "@/components/BusinessLogo";
import { proxyLogoUrl } from "@/lib/logo";

async function getBusiness(slug: string) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const res = await fetch(`${apiUrl}/businesses/${slug}`, {
        cache: 'no-store'
    });
    if (!res.ok) return null;
    return res.json();
}

async function getDeals(slug: string) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    try {
        const res = await fetch(`${apiUrl}/businesses/${slug}/deals`, {
            cache: 'no-store'
        });
        if (!res.ok) return [];
        return res.json();
    } catch {
        return [];
    }
}

async function getCampaigns(slug: string) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    try {
        const res = await fetch(`${apiUrl}/businesses/${slug}/campaigns`, {
            cache: 'no-store'
        });
        if (!res.ok) return [];
        return res.json();
    } catch {
        return [];
    }
}

export default async function ReferrerBusinessPage({
    params
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const [business, deals, campaigns] = await Promise.all([
        getBusiness(slug),
        getDeals(slug),
        getCampaigns(slug)
    ]);

    if (!business) {
        notFound();
    }

    const commissionPerLead = (business.referral_fee_cents || 1000) / 100;
    const platformFee = commissionPerLead * 0.2;
    const referrerEarns = commissionPerLead * 0.8;
    const connectionRate = business.connection_rate || 0;
    const totalLeads = business.total_leads_unlocked || 0;
    const totalConfirmed = business.total_confirmed || 0;
    const trustScore = business.trust_score ? (business.trust_score / 20).toFixed(1) : "5.0";

    const allFeatures = business.features?.length > 0 ? business.features
        : business.business_highlights?.length > 0 ? business.business_highlights
            : ["Licensed & Insured", "Verified Business", "Fast Response Time", "TradeRefer Trusted"];

    return (
        <main className="min-h-screen bg-zinc-50">

            {/* ── BREADCRUMBS ── */}
            <div className="bg-white border-b border-zinc-100 pt-32 pb-4">
                <div className="container mx-auto px-4">
                    <nav className="flex items-center gap-2 text-sm font-bold text-zinc-400 uppercase tracking-widest">
                        <Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <Link href="/businesses" className="hover:text-zinc-900 transition-colors">Directory</Link>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <Link href={`/b/${slug}`} className="hover:text-zinc-900 transition-colors">{business.business_name}</Link>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-orange-600">Refer & Earn</span>
                    </nav>
                </div>
            </div>

            {/* ── HERO SECTION ── */}
            <div className="bg-white pb-20 relative overflow-hidden text-zinc-900 border-b border-zinc-200">
                <div className="absolute inset-0 opacity-[0.03]">
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                </div>

                {business.cover_photo_url && (
                    <div className="absolute inset-0 opacity-5">
                        <img src={business.cover_photo_url} alt="" className="w-full h-full object-cover grayscale" />
                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-white" />
                    </div>
                )}

                <div className="container mx-auto px-4 relative z-10 pt-16">
                    <div className="flex flex-col md:flex-row gap-12 items-start md:items-end">
                        {/* Logo Container */}
                        <div className="w-36 h-36 md:w-48 md:h-48 bg-zinc-50 rounded-[40px] flex items-center justify-center overflow-hidden border-8 border-white shadow-2xl shadow-zinc-200 shrink-0 group">
                            <BusinessLogo logoUrl={proxyLogoUrl(business.logo_url)} name={business.business_name} />
                        </div>

                        <div className="flex-1 space-y-6">
                            <div className="flex flex-wrap items-center gap-4">
                                <span className="px-4 py-1.5 bg-zinc-100 text-zinc-600 rounded-full text-xs font-black uppercase tracking-widest border border-zinc-200">
                                    Referral Program
                                </span>
                                {business.is_verified && (
                                    <span className="flex items-center gap-2 px-4 py-1.5 bg-orange-600 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-600/20">
                                        <ShieldCheck className="w-4 h-4" /> Verified Partner
                                    </span>
                                )}
                            </div>

                            <h1 className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tight text-zinc-900">
                                Earn ${referrerEarns.toFixed(2)} per verified lead
                            </h1>

                            <div className="flex flex-wrap items-center gap-8 text-base text-zinc-500 font-bold">
                                <div className="flex items-center gap-3">
                                    <Briefcase className="w-5 h-5 text-orange-600" />
                                    Referring {business.business_name}
                                </div>
                                <div className="flex items-center gap-3">
                                    <Star className="w-5 h-5 text-orange-400 fill-orange-400" />
                                    Trust Score: {trustScore}/5.0
                                </div>
                                <div className="flex items-center gap-3">
                                    <TrendingUp className="w-5 h-5 text-green-500" />
                                    {connectionRate}% Connection Rate
                                </div>
                            </div>
                        </div>

                        {/* Earnings Summary Card */}
                        <div className="bg-zinc-50 rounded-[32px] border border-zinc-200 p-8 shadow-2xl shrink-0 hidden lg:block border-b-4 border-b-orange-500 min-w-[280px]">
                            <p className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-3">Your Earnings Share</p>
                            <div className="flex items-baseline gap-2 mb-1">
                                <span className="text-5xl font-black text-zinc-900 tracking-tighter">${referrerEarns.toFixed(2)}</span>
                                <span className="text-lg font-black text-orange-600">80% of fee</span>
                            </div>
                            <p className="text-sm text-zinc-500 font-bold">Standard payout per verified connection.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── BODY ── */}
            <div className="container mx-auto px-4 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* ── MAIN COLUMN ── */}
                    <div className="lg:col-span-2 space-y-12">

                        {/* Referral Overview Card */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="bg-white rounded-[32px] border border-zinc-200 p-10 shadow-sm group hover:border-orange-200 transition-all">
                                <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 mb-8 group-hover:scale-110 transition-transform">
                                    <DollarSign className="w-7 h-7" />
                                </div>
                                <h3 className="text-lg font-black text-zinc-900 mb-3 font-display">Fast Payouts</h3>
                                <p className="text-base text-zinc-500 leading-relaxed font-medium">Receive your commission as soon as the business validates the connection.</p>
                            </div>
                            <div className="bg-white rounded-[32px] border border-zinc-200 p-10 shadow-sm group hover:border-orange-200 transition-all">
                                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-8 group-hover:scale-110 transition-transform">
                                    <Users className="w-7 h-7" />
                                </div>
                                <h3 className="text-lg font-black text-zinc-900 mb-3 font-display">Track Leads</h3>
                                <p className="text-base text-zinc-500 leading-relaxed font-medium">Real-time tracking of every lead. See which projects are confirmed.</p>
                            </div>
                            <div className="bg-white rounded-[32px] border border-zinc-200 p-10 shadow-sm group hover:border-orange-200 transition-all">
                                <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mb-8 group-hover:scale-110 transition-transform">
                                    <Award className="w-7 h-7" />
                                </div>
                                <h3 className="text-lg font-black text-zinc-900 mb-3 font-display">Trusted Pro</h3>
                                <p className="text-base text-zinc-500 leading-relaxed font-medium">{business.business_name} is a verified {business.trade_category} with high trust levels.</p>
                            </div>
                        </div>

                        {/* Active Campaigns */}
                        {campaigns && campaigns.length > 0 && (
                            <section className="bg-zinc-900 rounded-[32px] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
                                <Flame className="absolute -bottom-10 -right-10 w-48 h-48 text-orange-500 opacity-10 rotate-12" />
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-8">
                                        <h2 className="text-2xl font-black font-display">Active Bonus Campaigns</h2>
                                        <span className="px-3 py-1 bg-orange-500 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">Hot Rewards</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {campaigns.map((campaign: any) => (
                                            <div key={campaign.id} className="p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl flex items-start justify-between gap-4 group hover:bg-white/10 transition-all cursor-default">
                                                <div className="space-y-1">
                                                    <h3 className="font-black text-zinc-100 group-hover:text-white transition-colors uppercase tracking-tight">{campaign.title}</h3>
                                                    <p className="text-xs text-zinc-400 font-medium leading-relaxed">{campaign.description || "Limited time bonus for active referrers."}</p>
                                                    <div className="flex items-center gap-2 mt-4 text-[10px] text-orange-500 font-black uppercase">
                                                        <Clock className="w-3 h-3" />
                                                        Ends {new Date(campaign.ends_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <div className="text-right">
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
                        <section className="bg-white rounded-[40px] border border-zinc-200 p-12 md:p-16 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-orange-50 rounded-bl-full opacity-50 transition-all group-hover:scale-110" />

                            <div className="relative z-10">
                                <div className="text-center mb-16">
                                    <h2 className="text-4xl font-black text-zinc-900 mb-4 font-display">Potential Monthly Earnings</h2>
                                    <p className="text-xl text-zinc-500 font-medium">See how much you could earn by referring local jobs.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                    {[
                                        { referrals: 3, label: "Casual", icon: Rocket, color: "orange" },
                                        { referrals: 10, label: "Active", icon: TrendingUp, color: "blue" },
                                        { referrals: 25, label: "Power", icon: Zap, color: "green" },
                                    ].map((tier) => (
                                        <div key={tier.label} className="relative p-10 bg-zinc-50 rounded-[32px] border border-zinc-100 text-center hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                                            <div className={`w-16 h-16 mx-auto rounded-3xl bg-white shadow-sm flex items-center justify-center mb-8 text-${tier.color}-500 group-hover:rotate-12 transition-transform`}>
                                                <tier.icon className="w-8 h-8" />
                                            </div>
                                            <p className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-2">{tier.label}</p>
                                            <p className="text-6xl font-black text-zinc-900 leading-none mb-2 tracking-tighter">${(tier.referrals * referrerEarns).toFixed(0)}</p>
                                            <p className="text-base text-zinc-400 font-bold uppercase tracking-tight mt-2">{tier.referrals} referrals/mo</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-16 text-center p-8 bg-zinc-50 rounded-3xl border border-dashed border-zinc-200">
                                    <p className="text-sm text-zinc-500 font-bold italic">Calculation based on regular per-lead commission of ${referrerEarns.toFixed(2)} (excludes bonus campaigns).</p>
                                </div>
                            </div>
                        </section>

                        {/* Active Deals for Customers */}
                        {deals && deals.length > 0 && (
                            <section className="bg-white rounded-[32px] border border-zinc-200 p-8 md:p-12 shadow-sm">
                                <h2 className="text-2xl font-black text-zinc-900 mb-8 font-display flex items-center gap-3">
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

                        <div className="pt-12 text-center pb-8 border-t border-zinc-100 flex flex-col items-center">
                            <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mb-6">Want to provide direct review?</p>
                            <PrivateFeedback businessSlug={business.slug} businessName={business.business_name} />
                        </div>
                    </div>

                    {/* ── SIDEBAR ── */}
                    <div className="space-y-6 lg:sticky lg:top-24 self-start">

                        {/* Start Referring Card */}
                        <div className="bg-white rounded-[32px] border border-zinc-200 p-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-zinc-900/5 rounded-bl-[80px]" />
                            <h3 className="text-xl font-black text-zinc-900 mb-2 relative z-10">Get Your Link</h3>
                            <p className="text-sm text-zinc-400 mb-8 relative z-10 italic">Start earning commission today.</p>
                            <StartReferringButton slug={slug} businessName={business.business_name} />
                            <div className="mt-8 pt-8 border-t border-zinc-100 flex items-center justify-between">
                                <div className="text-center flex-1">
                                    <p className="text-xl font-black text-zinc-900">{totalConfirmed}</p>
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter">Jobs Closed</p>
                                </div>
                                <div className="w-px h-8 bg-zinc-100" />
                                <div className="text-center flex-1">
                                    <p className="text-xl font-black text-zinc-900">{connectionRate}%</p>
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter">Connect Rate</p>
                                </div>
                            </div>
                        </div>

                        {/* Share Kit — gated to active referrers only */}
                        <div className="bg-zinc-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl">
                            <MessageSquare className="absolute -bottom-6 -left-6 w-32 h-32 text-orange-500 opacity-5 rotate-12" />
                            <div className="relative z-10">
                                <h3 className="text-sm font-black uppercase tracking-widest mb-2 text-orange-500">Share Assets</h3>
                                <p className="text-xs text-zinc-400 mb-6 font-medium">Copy pre-verified messages for WhatsApp, Email or SMS.</p>
                                <ShareKitGate
                                    slug={slug}
                                    businessName={business.business_name}
                                    tradeCategory={business.trade_category}
                                    suburb={business.suburb}
                                    commission={referrerEarns}
                                    deals={deals}
                                />
                            </div>
                        </div>

                        {/* Quick business bio */}
                        <div className="bg-white rounded-[32px] border border-zinc-200 p-10 shadow-sm">
                            <h3 className="text-lg font-black text-zinc-900 uppercase tracking-widest mb-8 border-b border-zinc-50 pb-6">Business Information</h3>
                            <div className="space-y-8">
                                <div className="flex gap-6">
                                    <div className="w-12 h-12 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400 shrink-0">
                                        <MapPin className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-zinc-400 uppercase tracking-tight mb-1">Service Area</p>
                                        <p className="text-lg text-zinc-800 font-bold leading-tight">{business.suburb}, {business.state}</p>
                                    </div>
                                </div>
                                <div className="flex gap-6">
                                    <div className="w-12 h-12 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400 shrink-0">
                                        <ShieldCheck className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-zinc-400 uppercase tracking-tight mb-1">Verification Status</p>
                                        <p className="text-lg text-green-600 font-bold leading-tight flex items-center gap-2">
                                            {business.is_verified ? "Fully Verified Provider" : "Standard Registered Profile"}
                                        </p>
                                    </div>
                                </div>
                                <div className="pt-8 border-t border-zinc-50">
                                    <p className="text-base text-zinc-500 font-medium leading-[1.6] italic border-l-4 border-orange-500 pl-6">
                                        &ldquo;{business.description?.slice(0, 150)}...&rdquo;
                                    </p>
                                    <Link href={`/b/${slug}`} className="mt-8 inline-flex items-center text-sm font-black text-orange-600 uppercase tracking-widest hover:translate-x-2 transition-transform">
                                        View Full Business Profile <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
