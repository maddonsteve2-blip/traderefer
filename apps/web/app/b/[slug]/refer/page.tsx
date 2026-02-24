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
    Copy,
    MessageSquare,
    Share2,
    Zap,
    CheckCircle2,
    ExternalLink,
    Phone
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReferrerShareKit } from "@/components/referrer/ShareKit";
import { StartReferringButton } from "@/components/referrer/StartReferringButton";

async function getBusiness(slug: string) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const res = await fetch(`${apiUrl}/businesses/${slug}`, {
        cache: 'no-store'
    });
    if (!res.ok) return null;
    return res.json();
}

export default async function ReferrerBusinessPage({
    params
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const business = await getBusiness(slug);

    if (!business) {
        notFound();
    }

    const commissionPerLead = (business.referral_fee_cents || 1000) / 100;
    const platformFee = commissionPerLead * 0.2;
    const referrerEarns = commissionPerLead * 0.8;
    const connectionRate = business.connection_rate || 0;
    const totalLeads = business.total_leads_unlocked || 0;
    const totalConfirmed = business.total_confirmed || 0;
    const trustScore = ((business.trust_score || 0) / 20).toFixed(1);

    return (
        <main className="min-h-screen bg-zinc-50">
            {/* Hero */}
            <div className="bg-zinc-900 pt-24 pb-20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-green-500/10 blur-[120px] rounded-full" />
                <div className="container mx-auto px-4 relative z-10">
                    <Link href="/businesses" className="inline-flex items-center gap-2 text-zinc-500 hover:text-orange-400 mb-8 transition-colors group">
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-bold">Back to Directory</span>
                    </Link>

                    <div className="flex flex-col md:flex-row items-start gap-8">
                        <div className="w-24 h-24 md:w-32 md:h-32 bg-zinc-800 rounded-3xl border border-zinc-700 flex items-center justify-center text-3xl font-black text-orange-500 shadow-2xl overflow-hidden shrink-0">
                            {business.logo_url ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={business.logo_url} alt={business.business_name} className="w-full h-full object-cover" />
                            ) : (
                                business.business_name[0]
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                <span className="px-4 py-1.5 bg-orange-500/10 text-orange-400 rounded-full text-sm font-bold uppercase tracking-widest border border-orange-500/20">
                                    {business.trade_category}
                                </span>
                                {business.is_verified && (
                                    <span className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-500/10 text-blue-400 rounded-full text-sm font-bold border border-blue-500/20">
                                        <Shield className="w-3.5 h-3.5" /> Verified
                                    </span>
                                )}
                            </div>
                            <h1 className="text-3xl md:text-5xl font-black text-white mb-3 font-display">
                                {business.business_name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 text-zinc-400 text-sm font-medium">
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4 text-orange-500" />
                                    {business.suburb}{business.state ? `, ${business.state}` : ''}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                    {trustScore} / 5.0
                                </span>
                            </div>
                        </div>

                        {/* Commission Hero Card */}
                        <div className="w-full md:w-auto md:min-w-[280px] bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-8 text-white shadow-2xl shadow-green-500/20 shrink-0">
                            <div className="text-sm font-bold uppercase tracking-widest text-green-100 mb-2">You Earn Per Lead</div>
                            <div className="text-5xl font-black mb-1">${referrerEarns.toFixed(2)}</div>
                            <div className="text-sm text-green-200 font-medium">
                                ${commissionPerLead.toFixed(2)} total · 80% referrer share
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-10">

                        {/* Business Scorecard */}
                        <section>
                            <h2 className="text-xl font-bold text-zinc-900 mb-6 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-orange-500" /> Partner Scorecard
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    {
                                        label: "Commission",
                                        value: `$${referrerEarns.toFixed(2)}`,
                                        sub: "per lead",
                                        icon: DollarSign,
                                        bg: "bg-green-50",
                                        color: "text-green-600",
                                        border: "border-green-100"
                                    },
                                    {
                                        label: "Connection Rate",
                                        value: `${connectionRate}%`,
                                        sub: "leads responded to",
                                        icon: Zap,
                                        bg: "bg-blue-50",
                                        color: "text-blue-600",
                                        border: "border-blue-100"
                                    },
                                    {
                                        label: "Trust Score",
                                        value: `${trustScore}/5`,
                                        sub: "community rated",
                                        icon: Star,
                                        bg: "bg-yellow-50",
                                        color: "text-yellow-600",
                                        border: "border-yellow-100"
                                    },
                                    {
                                        label: "Total Leads",
                                        value: `${totalLeads}`,
                                        sub: `${totalConfirmed} confirmed`,
                                        icon: Users,
                                        bg: "bg-purple-50",
                                        color: "text-purple-600",
                                        border: "border-purple-100"
                                    }
                                ].map((stat) => (
                                    <div key={stat.label} className={`${stat.bg} border ${stat.border} rounded-2xl p-5`}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className={`w-8 h-8 ${stat.bg} ${stat.color} rounded-lg flex items-center justify-center`}>
                                                <stat.icon className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider">{stat.label}</span>
                                        </div>
                                        <div className="text-2xl font-black text-zinc-900">{stat.value}</div>
                                        <div className="text-sm text-zinc-500 font-medium mt-1">{stat.sub}</div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* About the Business */}
                        <section className="bg-white rounded-3xl border border-zinc-200 p-8">
                            <h2 className="text-xl font-bold text-zinc-900 mb-4">About This Business</h2>
                            <p className="text-zinc-600 leading-relaxed mb-6">
                                {business.description || `${business.business_name} is a premier ${business.trade_category} service provider in ${business.suburb}. They pride themselves on quality workmanship and reliable service.`}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { label: "Trade Category", value: business.trade_category },
                                    { label: "Service Area", value: `${business.suburb} · ${business.service_radius_km}km radius` },
                                    { label: "Verified", value: business.is_verified ? "Yes — ABN Verified" : "Pending verification" },
                                    { label: "Active Since", value: business.created_at ? new Date(business.created_at).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' }) : 'N/A' },
                                ].map((item) => (
                                    <div key={item.label} className="flex items-start gap-3 p-4 bg-zinc-50 rounded-xl">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                        <div>
                                            <div className="text-sm font-bold text-zinc-400 uppercase tracking-wider">{item.label}</div>
                                            <div className="text-sm font-medium text-zinc-900">{item.value}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Why Refer This Business */}
                        <section className="bg-white rounded-3xl border border-zinc-200 p-8">
                            <h2 className="text-xl font-bold text-zinc-900 mb-6">Why Refer {business.business_name}?</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(business.features && business.features.length > 0 ? business.features : [
                                    "Licensed & Insured",
                                    "Verified Business",
                                    "Fast Response Time",
                                    "TradeRefer Trusted"
                                ]).map((feature: string) => (
                                    <div key={feature} className="flex items-center gap-3 p-4 bg-orange-50/50 rounded-xl border border-orange-100/50">
                                        <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0" />
                                        <span className="font-medium text-zinc-900">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Earnings Estimator */}
                        <section className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-3xl p-8 text-white">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-green-400" /> Earnings Estimator
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { referrals: 3, label: "Casual" },
                                    { referrals: 10, label: "Active" },
                                    { referrals: 25, label: "Power Referrer" }
                                ].map((tier) => (
                                    <div key={tier.label} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                                        <div className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2">{tier.label}</div>
                                        <div className="text-3xl font-black text-white mb-1">
                                            ${(tier.referrals * referrerEarns).toFixed(0)}
                                        </div>
                                        <div className="text-sm text-zinc-500">
                                            {tier.referrals} referrals/month
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-sm text-zinc-500 mt-6 text-center">
                                Based on ${referrerEarns.toFixed(2)} per verified lead · 80% referrer share
                            </p>
                        </section>

                        {/* Work Photos */}
                        {business.photo_urls && business.photo_urls.length > 0 && (
                            <section>
                                <h2 className="text-xl font-bold text-zinc-900 mb-6">Their Work</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {business.photo_urls.slice(0, 6).map((url: string, i: number) => (
                                        <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-100">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={url} alt={`${business.business_name} work ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6 lg:sticky lg:top-24 self-start">
                        {/* Start Referring CTA */}
                        <div className="bg-white rounded-3xl border-2 border-orange-200 p-8 shadow-lg shadow-orange-100/50">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Share2 className="w-8 h-8 text-orange-600" />
                                </div>
                                <h3 className="text-xl font-bold text-zinc-900 mb-2">Start Referring</h3>
                                <p className="text-sm text-zinc-500">
                                    Get your unique link and earn <span className="font-bold text-green-600">${referrerEarns.toFixed(2)}</span> for every verified lead.
                                </p>
                            </div>
                            <StartReferringButton slug={slug} businessName={business.business_name} />
                        </div>

                        {/* Share Kit */}
                        <div className="bg-white rounded-3xl border border-zinc-200 p-8">
                            <h3 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-orange-500" /> Share Kit
                            </h3>
                            <p className="text-sm text-zinc-500 mb-6">
                                Pre-written messages ready to share. Just copy, paste, and send.
                            </p>
                            <ReferrerShareKit
                                businessName={business.business_name}
                                tradeCategory={business.trade_category}
                                suburb={business.suburb}
                                slug={slug}
                                commission={referrerEarns}
                            />
                        </div>

                        {/* Quick Stats */}
                        <div className="bg-zinc-900 rounded-3xl p-6 text-white">
                            <div className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-3">Quick Facts</div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-zinc-400">Service Radius</span>
                                    <span className="text-sm font-bold">{business.service_radius_km}km</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-zinc-400">Location</span>
                                    <span className="text-sm font-bold">{business.suburb}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-zinc-400">Connection Rate</span>
                                    <span className="text-sm font-bold text-green-400">{connectionRate}%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-zinc-400">Confirmed Jobs</span>
                                    <span className="text-sm font-bold">{totalConfirmed}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
