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
    Phone,
    Tag,
    Gift,
    Flame,
    Award,
    Wrench,
    Briefcase,
    Image as ImageIcon
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReferrerShareKit } from "@/components/referrer/ShareKit";
import { StartReferringButton } from "@/components/referrer/StartReferringButton";
import { PrivateFeedback } from "@/components/referrer/PrivateFeedback";
import { ReviewSection } from "@/components/referrer/ReviewSection";

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

async function getReviews(slug: string) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    try {
        const res = await fetch(`${apiUrl}/businesses/${slug}/reviews`, {
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
    const [business, deals, reviews, campaigns] = await Promise.all([
        getBusiness(slug),
        getDeals(slug),
        getReviews(slug),
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
    const trustScore = ((business.trust_score || 0) / 20).toFixed(1);

    const allFeatures = business.features?.length > 0 ? business.features
        : business.business_highlights?.length > 0 ? business.business_highlights
        : ["Licensed & Insured", "Verified Business", "Fast Response Time", "TradeRefer Trusted"];

    return (
        <main className="min-h-screen bg-white">

            {/* ── COVER PHOTO ── */}
            {business.cover_photo_url ? (
                <div className="w-full h-48 md:h-64 relative overflow-hidden bg-zinc-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={business.cover_photo_url} alt="" className="w-full h-full object-cover" />
                </div>
            ) : (
                <div className="h-20" />
            )}

            {/* ── PROFILE HEADER ── */}
            <div className="bg-white border-b border-zinc-200">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row md:items-end gap-5 pt-4 pb-5">
                        <div className={`w-20 h-20 md:w-24 md:h-24 rounded-xl bg-white border border-zinc-200 shadow-md overflow-hidden shrink-0 flex items-center justify-center ${business.cover_photo_url ? "-mt-10" : ""}`}>
                            {business.logo_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={business.logo_url} alt={business.business_name} className="w-full h-full object-contain" />
                            ) : (
                                <span className="text-2xl font-black text-zinc-400">{business.business_name[0]}</span>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1.5">
                                <Link href="/businesses" className="hover:text-zinc-600 transition-colors">Directory</Link>
                                <span>/</span>
                                <Link href={`/b/${slug}`} className="hover:text-zinc-600 transition-colors">{business.business_name}</Link>
                                <span>/</span>
                                <span>Refer</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="px-2.5 py-0.5 bg-zinc-100 text-zinc-600 rounded text-xs font-bold uppercase tracking-wider">{business.trade_category}</span>
                                {business.is_verified && (
                                    <span className="flex items-center gap-1 px-2.5 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-bold">
                                        <Shield className="w-3 h-3" /> Verified
                                    </span>
                                )}
                                <span className="flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-xs font-bold">
                                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {trustScore}
                                </span>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-black text-zinc-900 leading-tight">{business.business_name}</h1>
                            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-zinc-500">
                                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{business.suburb}{business.state ? `, ${business.state}` : ''}</span>
                                {business.service_radius_km && <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" />{business.service_radius_km}km radius</span>}
                                {business.avg_response_minutes != null && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />Responds in {business.avg_response_minutes < 60 ? `< ${business.avg_response_minutes} min` : `< ${Math.ceil(business.avg_response_minutes / 60)} hrs`}</span>}
                            </div>
                        </div>

                        {/* Earn badge */}
                        <div className="shrink-0 pb-1">
                            <div className="bg-zinc-900 rounded-xl px-5 py-3 text-center">
                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-0.5">You earn per lead</p>
                                <p className="text-2xl font-black text-white">${referrerEarns.toFixed(2)}</p>
                                <p className="text-xs text-zinc-500 mt-0.5">${commissionPerLead.toFixed(2)} total · 80% share</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── BODY ── */}
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* ── MAIN COLUMN ── */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Stats row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { label: "Commission", value: `$${referrerEarns.toFixed(2)}`, sub: "per verified lead", icon: DollarSign },
                                { label: "Connection Rate", value: `${connectionRate}%`, sub: "referrals responded to", icon: Zap },
                                { label: "Trust Score", value: `${trustScore}/5`, sub: "community rated", icon: Star },
                                { label: "Confirmed Jobs", value: `${totalConfirmed}`, sub: `${totalLeads} total leads`, icon: Users },
                            ].map((stat) => (
                                <div key={stat.label} className="bg-white rounded-xl border border-zinc-200 p-4">
                                    <stat.icon className="w-4 h-4 text-zinc-400 mb-2" />
                                    <p className="text-xl font-black text-zinc-900">{stat.value}</p>
                                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mt-0.5">{stat.label}</p>
                                    <p className="text-xs text-zinc-400 mt-0.5">{stat.sub}</p>
                                </div>
                            ))}
                        </div>

                        {/* Active Campaigns */}
                        {campaigns && campaigns.length > 0 && (
                            <section className="bg-white rounded-2xl border border-zinc-200 p-6">
                                <h2 className="text-base font-black text-zinc-900 mb-4 flex items-center gap-2">
                                    <Flame className="w-4 h-4 text-zinc-500" /> Active Campaigns
                                </h2>
                                <div className="space-y-3">
                                    {campaigns.map((campaign: any) => (
                                        <div key={campaign.id} className="flex items-start justify-between gap-4 p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-zinc-900 text-sm">{campaign.title}</h3>
                                                {campaign.description && <p className="text-xs text-zinc-500 mt-0.5">{campaign.description}</p>}
                                                {campaign.promo_text && <p className="text-xs text-zinc-400 mt-1 italic">&ldquo;{campaign.promo_text}&rdquo;</p>}
                                                <p className="text-xs text-zinc-400 mt-1">Ends {new Date(campaign.ends_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                            </div>
                                            <span className="px-2.5 py-1 bg-zinc-900 text-white rounded-lg text-xs font-bold shrink-0">
                                                {campaign.campaign_type === 'flat_bonus' && `+$${(campaign.bonus_amount_cents / 100).toFixed(0)}/lead`}
                                                {campaign.campaign_type === 'multiplier' && `${campaign.multiplier}x`}
                                                {campaign.campaign_type === 'volume_bonus' && `$${(campaign.bonus_amount_cents / 100).toFixed(0)} bonus`}
                                                {campaign.campaign_type === 'first_referral' && `$${(campaign.bonus_amount_cents / 100).toFixed(0)} first`}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Active Deals */}
                        {deals && deals.length > 0 && (
                            <section className="bg-white rounded-2xl border border-zinc-200 p-6">
                                <h2 className="text-base font-black text-zinc-900 mb-4 flex items-center gap-2">
                                    <Gift className="w-4 h-4 text-zinc-500" /> Active Deals for Customers
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {deals.map((deal: any) => (
                                        <div key={deal.id} className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <h3 className="font-bold text-zinc-900 text-sm leading-tight">{deal.title}</h3>
                                                {deal.discount_text && (
                                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-bold shrink-0">{deal.discount_text}</span>
                                                )}
                                            </div>
                                            {deal.description && <p className="text-xs text-zinc-500 leading-relaxed">{deal.description}</p>}
                                            {deal.terms && <p className="text-xs text-zinc-400 mt-1.5 italic">{deal.terms}</p>}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* About */}
                        <section className="bg-white rounded-2xl border border-zinc-200 p-6">
                            <h2 className="text-base font-black text-zinc-900 mb-3">About {business.business_name}</h2>
                            <p className="text-sm text-zinc-600 leading-relaxed">
                                {business.description || `${business.business_name} is a premier ${business.trade_category} service provider in ${business.suburb}. They pride themselves on quality workmanship and reliable service.`}
                            </p>
                        </section>

                        {/* Why Refer */}
                        {business.why_refer_us && (
                            <section className="bg-white rounded-2xl border border-zinc-200 p-6">
                                <h2 className="text-base font-black text-zinc-900 mb-3">Why Refer {business.business_name}</h2>
                                <p className="text-sm text-zinc-600 leading-relaxed">{business.why_refer_us}</p>
                            </section>
                        )}

                        {/* Services */}
                        {business.services && business.services.length > 0 && (
                            <section className="bg-white rounded-2xl border border-zinc-200 p-6">
                                <h2 className="text-base font-black text-zinc-900 mb-4">Services They Provide</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {business.services.map((service: string) => (
                                        <div key={service} className="flex items-center gap-2.5 px-3 py-2.5 bg-zinc-50 rounded-lg border border-zinc-100">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                                            <span className="text-sm text-zinc-700">{service}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Highlights */}
                        <section className="bg-white rounded-2xl border border-zinc-200 p-6">
                            <h2 className="text-base font-black text-zinc-900 mb-4">Why Customers Choose Them</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {allFeatures.map((feature: string) => (
                                    <div key={feature} className="flex items-center gap-2.5 px-3 py-2.5 bg-zinc-50 rounded-lg border border-zinc-100">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                                        <span className="text-sm text-zinc-700">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Reviews */}
                        <section className="bg-white rounded-2xl border border-zinc-200 p-6">
                            <ReviewSection slug={slug} initialReviews={reviews} />
                        </section>

                        {/* Earnings Estimator */}
                        <section className="bg-white rounded-2xl border border-zinc-200 p-6">
                            <h2 className="text-base font-black text-zinc-900 mb-4">Earnings Estimator</h2>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { referrals: 3, label: "Casual" },
                                    { referrals: 10, label: "Active" },
                                    { referrals: 25, label: "Power" },
                                ].map((tier) => (
                                    <div key={tier.label} className="bg-zinc-50 rounded-xl border border-zinc-100 p-4 text-center">
                                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">{tier.label}</p>
                                        <p className="text-2xl font-black text-zinc-900">${(tier.referrals * referrerEarns).toFixed(0)}</p>
                                        <p className="text-xs text-zinc-400 mt-0.5">{tier.referrals} leads/mo</p>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-zinc-400 mt-3 text-center">Based on ${referrerEarns.toFixed(2)} per verified lead · 80% referrer share</p>
                        </section>

                        {/* Work Photos */}
                        {business.photo_urls && business.photo_urls.length > 0 && (
                            <section className="bg-white rounded-2xl border border-zinc-200 p-6">
                                <h2 className="text-base font-black text-zinc-900 mb-4">Their Work</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                                    {business.photo_urls.slice(0, 6).map((url: string, i: number) => (
                                        <div key={i} className="aspect-square rounded-xl overflow-hidden bg-zinc-100 group">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={url} alt={`${business.business_name} work ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* ── SIDEBAR ── */}
                    <div className="space-y-4 lg:sticky lg:top-24 self-start">

                        {/* Start Referring */}
                        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
                            <div className="px-5 py-4 border-b border-zinc-100">
                                <h3 className="text-base font-black text-zinc-900">Start Referring</h3>
                                <p className="text-xs text-zinc-400 mt-0.5">Earn <span className="font-bold text-zinc-700">${referrerEarns.toFixed(2)}</span> for every verified lead</p>
                            </div>
                            <div className="p-5">
                                <StartReferringButton slug={slug} businessName={business.business_name} />
                            </div>
                        </div>

                        {/* Share Kit */}
                        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
                            <h3 className="text-sm font-black text-zinc-900 mb-1">Share Kit</h3>
                            <p className="text-xs text-zinc-400 mb-4">Pre-written messages ready to copy and send.</p>
                            <ReferrerShareKit
                                businessName={business.business_name}
                                tradeCategory={business.trade_category}
                                suburb={business.suburb}
                                slug={slug}
                                commission={referrerEarns}
                                deals={deals}
                            />
                        </div>

                        {/* Quick facts */}
                        <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-3">
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Quick Facts</p>
                            <div className="space-y-2.5">
                                <div className="flex items-center gap-2.5">
                                    <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-zinc-800">{business.suburb}{business.state ? `, ${business.state}` : ''}</p>
                                        {business.service_radius_km && <p className="text-xs text-zinc-400">{business.service_radius_km}km service radius</p>}
                                    </div>
                                </div>
                                {business.years_experience && (
                                    <div className="flex items-center gap-2.5">
                                        <Award className="w-4 h-4 text-zinc-400 shrink-0" />
                                        <p className="text-sm text-zinc-700">{business.years_experience} experience</p>
                                    </div>
                                )}
                                <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                                    <span className="text-sm text-zinc-500">Connection rate</span>
                                    <span className="text-sm font-bold text-zinc-900">{connectionRate}%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-zinc-500">Confirmed jobs</span>
                                    <span className="text-sm font-bold text-zinc-900">{totalConfirmed}</span>
                                </div>
                                {business.created_at && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-zinc-500">Member since</span>
                                        <span className="text-sm font-bold text-zinc-900">{new Date(business.created_at).getFullYear()}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <PrivateFeedback businessSlug={business.slug} businessName={business.business_name} />
                    </div>
                </div>
            </div>
        </main>
    );
}
