import {
    Star, MapPin, ChevronRight, Award, Briefcase,
    ArrowRight, ShieldCheck, CheckCircle, Clock,
    LayoutDashboard, Flame, Users, BadgeCheck, Wrench
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ApplyToReferButton } from "@/components/referrer/ApplyToReferButton";
import { BusinessLogo } from "@/components/BusinessLogo";
import { ReviewsSection } from "@/components/referrer/ReviewsSection";

const apiUrl = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function getBusiness(slug: string) {
    const res = await fetch(`${apiUrl()}/businesses/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
}

async function getGoogleReviews(slug: string) {
    try {
        const res = await fetch(`${apiUrl()}/businesses/${slug}/google-reviews`, { next: { revalidate: 86400 } });
        return res.ok ? res.json() : [];
    } catch { return []; }
}

async function getCampaigns(slug: string) {
    try {
        const res = await fetch(`${apiUrl()}/businesses/${slug}/campaigns`, { cache: 'no-store' });
        return res.ok ? res.json() : [];
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
    const [business, googleReviews, campaigns] = await Promise.all([
        getBusiness(slug),
        getGoogleReviews(slug),
        getCampaigns(slug),
    ]);

    if (!business) notFound();

    const commissionPerLead = (business.referral_fee_cents || 1000) / 100;
    const referrerEarns = commissionPerLead * 0.8;
    const platformFee = commissionPerLead * 0.2;
    const trustScore = business.trust_score ? (business.trust_score / 20).toFixed(1) : "5.0";
    const memberSinceYear = business.created_at ? new Date(business.created_at).getFullYear() : null;
    const googleRating = business.avg_rating ? parseFloat(business.avg_rating) : null;
    const reviewCount = business.total_reviews || 0;
    const totalConfirmed = business.total_confirmed || 0;
    const connectionRate = business.connection_rate || 0;

    const allFeatures: string[] = business.features?.length > 0 ? business.features
        : business.business_highlights?.length > 0 ? business.business_highlights : [];
    const services: string[] = business.services || [];
    const specialties: string[] = business.specialties || [];
    const photoUrls: string[] = business.photo_urls?.slice(0, 3) || [];

    const fmt = (n: number) => Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;

    const topReviews = googleReviews
        .filter((r: any) => r.review_text && r.rating >= 4);

    return (
        <main className="min-h-screen bg-zinc-50">

            {/* ── BREADCRUMB ── */}
            <div className="bg-white border-b border-zinc-100 pt-5 pb-4">
                <div className="container mx-auto px-4">
                    <nav className="flex items-center gap-3 font-black text-zinc-400 uppercase tracking-widest" style={{ fontSize: '17px' }}>
                        <Link href="/dashboard/referrer" className="hover:text-zinc-700 transition-colors flex items-center gap-2">
                            <LayoutDashboard className="w-5 h-5" /> Dashboard
                        </Link>
                        <ChevronRight className="w-5 h-5" />
                        <Link href="/dashboard/referrer/businesses" className="hover:text-zinc-700 transition-colors">Businesses</Link>
                        <ChevronRight className="w-5 h-5" />
                        <span className="text-orange-600 font-black truncate max-w-[240px]">{business.business_name}</span>
                    </nav>
                </div>
            </div>

            {/* ── PITCH HERO ── */}
            <div className="bg-white border-b border-zinc-200">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex flex-col lg:flex-row gap-6 items-start">

                        {/* Identity */}
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-3 mb-5">
                                <span className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 rounded-full font-black uppercase tracking-widest border-2 border-orange-100" style={{ fontSize: '16px' }}>
                                    <Briefcase className="w-5 h-5" /> Referral Opportunity
                                </span>
                                {business.is_verified && (
                                    <span className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-full font-black uppercase tracking-widest" style={{ fontSize: '16px' }}>
                                        <ShieldCheck className="w-5 h-5" /> Verified Partner
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-5 mb-6">
                                <BusinessLogo logoUrl={business.logo_url} name={business.business_name} size="lg" />
                                <div>
                                    <h1 className="font-black text-zinc-900 leading-tight tracking-tight" style={{ fontSize: '32px' }}>
                                        {business.business_name}
                                    </h1>
                                    <p className="font-black text-zinc-500 flex items-center gap-2.5 flex-wrap mt-1.5" style={{ fontSize: '19px' }}>
                                        <MapPin className="w-5 h-5 text-orange-500 shrink-0" />
                                        {business.suburb}{business.state ? `, ${business.state}` : ''}
                                        {business.trade_category && <><span className="text-zinc-300">·</span><span>{business.trade_category}</span></>}
                                    </p>
                                </div>
                            </div>

                            {/* Authority badges row */}
                            <div className="flex flex-wrap gap-4">
                                <div className="flex items-center gap-2.5 px-5 py-3 bg-zinc-50 border-2 border-zinc-100 rounded-2xl" style={{ fontSize: '17px' }}>
                                    <Star className="w-5 h-5 text-orange-400 fill-orange-400 shrink-0" />
                                    <span className="font-black text-zinc-800">{trustScore}</span>
                                    <span className="font-black text-zinc-400 uppercase tracking-widest text-xs">TradeRefer Score</span>
                                </div>
                                {googleRating && reviewCount > 0 && (
                                    <div className="flex items-center gap-2.5 px-5 py-3 bg-zinc-50 border-2 border-zinc-100 rounded-2xl" style={{ fontSize: '17px' }}>
                                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 shrink-0" />
                                        <span className="font-black text-zinc-800">{googleRating.toFixed(1)}</span>
                                        <span className="font-black text-zinc-400 uppercase tracking-widest text-xs">Google ({reviewCount})</span>
                                    </div>
                                )}
                                {business.years_experience && (
                                    <div className="flex items-center gap-2.5 px-5 py-3 bg-zinc-50 border-2 border-zinc-100 rounded-2xl" style={{ fontSize: '17px' }}>
                                        <Award className="w-5 h-5 text-orange-500 shrink-0" />
                                        <span className="font-black text-zinc-700">{business.years_experience} experience</span>
                                    </div>
                                )}
                                {memberSinceYear && (
                                    <div className="flex items-center gap-2.5 px-5 py-3 bg-zinc-50 border-2 border-zinc-100 rounded-2xl" style={{ fontSize: '17px' }}>
                                        <Clock className="w-5 h-5 text-orange-500 shrink-0" />
                                        <span className="font-black text-zinc-700">Member since {memberSinceYear}</span>
                                    </div>
                                )}
                                {totalConfirmed > 0 && (
                                    <div className="flex items-center gap-2.5 px-5 py-3 bg-zinc-50 border-2 border-zinc-100 rounded-2xl" style={{ fontSize: '17px' }}>
                                        <Users className="w-5 h-5 text-orange-500 shrink-0" />
                                        <span className="font-black text-zinc-700">{totalConfirmed} jobs confirmed</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Earnings pill — desktop inline with hero */}
                        <div className="bg-zinc-900 text-white rounded-[32px] px-10 py-8 shrink-0 w-full lg:w-auto border-b-8 border-orange-600 flex flex-col items-center lg:items-start gap-2 shadow-2xl">
                            <p className="font-black text-zinc-400 uppercase tracking-[0.2em]" style={{ fontSize: '14px' }}>You earn per verified lead</p>
                            <div className="flex items-baseline gap-4">
                                <span className="font-black text-white tracking-tighter" style={{ fontSize: '64px', lineHeight: 1 }}>{fmt(referrerEarns)}</span>
                                <span className="font-black text-orange-400" style={{ fontSize: '22px' }}>80% split</span>
                            </div>
                            <p className="font-bold text-zinc-500" style={{ fontSize: '18px' }}>Platform fee: {fmt(platformFee)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── MAIN BODY ── */}
            <div className="container mx-auto px-4 pt-6 pb-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                    {/* ── LEFT: SOCIAL PROOF + INTELLIGENCE ── */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* ROW 1: Expertise tags + Gallery side by side */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Expertise & Services */}
                            <div className="bg-white rounded-[32px] border-2 border-zinc-200 p-8 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <Wrench className="w-6 h-6 text-orange-500 shrink-0" />
                                    <h2 className="font-black text-zinc-900" style={{ fontSize: '24px' }}>Expertise & Services</h2>
                                </div>
                                {services.length > 0 ? (
                                    <div className="flex flex-wrap gap-2.5">
                                        {services.map((s: string, i: number) => (
                                            <span key={i} className="flex items-center gap-2 px-4 py-2.5 bg-orange-50 border-2 border-orange-100 text-orange-800 rounded-2xl font-black" style={{ fontSize: '17px' }}>
                                                <CheckCircle className="w-5 h-5 text-orange-500 shrink-0" />{s}
                                            </span>
                                        ))}
                                    </div>
                                ) : specialties.length > 0 ? (
                                    <div className="flex flex-wrap gap-2.5">
                                        {specialties.map((s: string, i: number) => (
                                            <span key={i} className="flex items-center gap-2 px-4 py-2.5 bg-orange-50 border-2 border-orange-100 text-orange-800 rounded-2xl font-black" style={{ fontSize: '17px' }}>
                                                <CheckCircle className="w-5 h-5 text-orange-500 shrink-0" />{s}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2.5">
                                        {[
                                            business.trade_category,
                                            "Licensed & Insured",
                                            "Verified Business",
                                            "Fast Response"
                                        ].filter(Boolean).map((s: string, i: number) => (
                                            <span key={i} className="flex items-center gap-2 px-4 py-2.5 bg-orange-50 border-2 border-orange-100 text-orange-800 rounded-2xl font-black" style={{ fontSize: '17px' }}>
                                                <CheckCircle className="w-5 h-5 text-orange-500 shrink-0" />{s}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {allFeatures.length > 0 && (
                                    <div className="mt-6 pt-6 border-t-2 border-zinc-100 flex flex-wrap gap-2.5">
                                        {allFeatures.map((f: string, i: number) => (
                                            <span key={i} className="px-4 py-2 bg-zinc-50 border-2 border-zinc-200 text-zinc-700 rounded-xl font-black uppercase tracking-widest" style={{ fontSize: '12px' }}>{f}</span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Recent Work Gallery */}
                            <div className="bg-white rounded-[32px] border-2 border-zinc-200 p-8 shadow-sm">
                                <h2 className="font-black text-zinc-900 mb-6" style={{ fontSize: '24px' }}>Recent Work</h2>
                                {photoUrls.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-3">
                                        {photoUrls.map((url: string, i: number) => (
                                            <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-zinc-100 group relative shadow-sm border-2 border-zinc-50">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={url}
                                                    alt={`${business.business_name} work ${i + 1}`}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-48 bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200 gap-4">
                                        <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center shadow-sm">
                                            <ShieldCheck className="w-7 h-7 text-zinc-400" />
                                        </div>
                                        <p className="font-black text-zinc-400" style={{ fontSize: '18px' }}>Verified {business.trade_category || 'Trade'} Pro</p>
                                    </div>
                                )}
                                <Link href={`/b/${slug}`} className="mt-6 flex items-center gap-2 font-black text-orange-600 hover:text-orange-700 transition-all underline underline-offset-4" style={{ fontSize: '18px' }}>
                                    View full profile <ArrowRight className="w-5 h-5" />
                                </Link>
                            </div>
                        </div>

                        {/* About + Intelligence */}
                        <div className="bg-white rounded-[32px] border-2 border-zinc-200 p-8 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <BadgeCheck className="w-6 h-6 text-orange-500 shrink-0" />
                                <h2 className="font-black text-zinc-900" style={{ fontSize: '24px' }}>Why Refer {business.business_name}?</h2>
                            </div>
                            {business.description ? (
                                <p className="text-zinc-700 font-bold leading-relaxed mb-8" style={{ fontSize: '19px', lineHeight: 1.75 }}>
                                    {business.description}
                                </p>
                            ) : (
                                <p className="text-zinc-700 font-bold leading-relaxed mb-8" style={{ fontSize: '19px', lineHeight: 1.75 }}>
                                    {business.business_name} is a{business.is_verified ? ' fully verified' : ''} {business.trade_category || 'trade'} specialist
                                    serving {business.suburb}{business.state ? `, ${business.state}` : ''}.
                                    {trustScore && ` With a ${trustScore}/5.0 TradeRefer Score,`} they are known for reliability and quality workmanship.
                                </p>
                            )}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {[
                                    { icon: Star, label: "Trust Score", value: `${trustScore}/5.0` },
                                    { icon: ShieldCheck, label: "Status", value: business.is_verified ? "Verified" : "Registered" },
                                    { icon: MapPin, label: "Area", value: business.suburb || "Local" },
                                    { icon: Briefcase, label: "Trade", value: business.trade_category || "General" },
                                ].map(({ icon: Icon, label, value }) => (
                                    <div key={label} className="p-5 bg-zinc-50 rounded-2xl border-2 border-zinc-100 text-center shadow-sm">
                                        <Icon className="w-7 h-7 text-orange-500 mx-auto mb-2" />
                                        <p className="font-black text-zinc-400 uppercase tracking-widest" style={{ fontSize: '12px' }}>{label}</p>
                                        <p className="font-black text-zinc-900 leading-tight mt-1" style={{ fontSize: '18px' }}>{value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Google Reviews */}
                        <ReviewsSection
                            reviews={topReviews}
                            googleRating={googleRating}
                            reviewCount={reviewCount}
                        />

                        {/* Active Bonus Campaigns */}
                        {campaigns && campaigns.length > 0 && (
                            <div className="bg-zinc-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl">
                                <Flame className="absolute -bottom-8 -right-8 w-48 h-48 text-orange-500 opacity-10 rotate-12" />
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="font-black text-white" style={{ fontSize: '24px' }}>Active Bonus Campaigns</h2>
                                        <span className="px-4 py-1.5 bg-orange-600 rounded-full font-black uppercase tracking-[0.2em] animate-pulse shadow-lg shadow-orange-600/20" style={{ fontSize: '14px' }}>Live</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {campaigns.map((c: any) => (
                                            <div key={c.id} className="p-6 bg-white/5 border-2 border-white/10 rounded-2xl flex items-start justify-between gap-5 hover:bg-white/10 transition-all shadow-sm">
                                                <div>
                                                    <h3 className="font-black text-white" style={{ fontSize: '20px' }}>{c.title}</h3>
                                                    <p className="font-bold text-zinc-400 mt-1.5" style={{ fontSize: '17px' }}>{c.description || "Limited time bonus."}</p>
                                                    {c.ends_at && (
                                                        <p className="text-orange-400 font-black mt-3 flex items-center gap-2" style={{ fontSize: '17px' }}>
                                                            <Clock className="w-5 h-5" /> Ends {new Date(c.ends_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="font-black text-orange-400" style={{ fontSize: '32px', lineHeight: 1 }}>
                                                        {c.campaign_type === 'flat_bonus' && `+$${(c.bonus_amount_cents / 100).toFixed(0)}`}
                                                        {c.campaign_type === 'multiplier' && `${c.multiplier}x`}
                                                    </p>
                                                    <p className="font-black text-zinc-500 uppercase tracking-widest mt-1" style={{ fontSize: '14px' }}>Bonus</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── RIGHT: STICKY JOIN CTA ── */}
                    <div className="space-y-4 lg:sticky lg:top-24 self-start">

                        {/* Earnings + Join CTA */}
                        <div className="bg-white rounded-[32px] border-2 border-zinc-200 overflow-hidden shadow-2xl">
                            <div className="bg-zinc-900 p-8 text-white text-center">
                                <p className="font-black text-zinc-400 uppercase tracking-[0.2em] mb-2" style={{ fontSize: '14px' }}>Your cut per lead</p>
                                <p className="font-black text-white tracking-tighter" style={{ fontSize: '64px', lineHeight: 1 }}>{fmt(referrerEarns)}</p>
                                <p className="font-black text-orange-400 mt-2 tracking-wide" style={{ fontSize: '22px' }}>80% of every verified lead</p>
                            </div>
                            <div className="p-8 space-y-6">
                                <p className="font-bold text-zinc-600 text-center leading-relaxed" style={{ fontSize: '18px' }}>
                                    Join {business.business_name}&apos;s referral team and earn every time you send a confirmed job.
                                </p>
                                <ApplyToReferButton slug={slug} businessName={business.business_name} />
                                {(totalConfirmed > 0 || connectionRate > 0) && (
                                    <div className="pt-6 border-t-2 border-zinc-100 grid grid-cols-2 gap-4 text-center">
                                        {totalConfirmed > 0 && (
                                            <div>
                                                <p className="font-black text-zinc-900" style={{ fontSize: '28px' }}>{totalConfirmed}</p>
                                                <p className="font-black text-zinc-400 uppercase tracking-widest" style={{ fontSize: '12px' }}>Jobs Done</p>
                                            </div>
                                        )}
                                        {connectionRate > 0 && (
                                            <div>
                                                <p className="font-black text-zinc-900" style={{ fontSize: '28px' }}>{connectionRate}%</p>
                                                <p className="font-black text-zinc-400 uppercase tracking-widest" style={{ fontSize: '12px' }}>Connect Rate</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick-view authority card */}
                        <div className="bg-white rounded-[32px] border-2 border-zinc-200 p-8 shadow-sm space-y-4">
                            <h3 className="font-black text-zinc-900 uppercase tracking-widest" style={{ fontSize: '14px' }}>Hireability Checklist</h3>
                            {[
                                { ok: business.is_verified, text: "Fully Verified by TradeRefer" },
                                { ok: parseFloat(trustScore) >= 4.5, text: `Trust Score ${trustScore}/5.0` },
                                { ok: !!business.years_experience, text: business.years_experience ? `${business.years_experience} experience` : "Experienced Pro" },
                                { ok: !!memberSinceYear, text: memberSinceYear ? `Active since ${memberSinceYear}` : "Active Member" },
                                { ok: services.length > 0 || allFeatures.length > 0, text: "Detailed service list provided" },
                                { ok: googleRating !== null && googleRating > 0, text: googleRating ? `${googleRating.toFixed(1)}★ Google Rating` : "Google Reviewed" },
                            ].filter(item => item.ok).map((item, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="w-7 h-7 bg-green-50 border-2 border-green-200 rounded-full flex items-center justify-center shrink-0">
                                        <CheckCircle className="w-4.5 h-4.5 text-green-600" />
                                    </div>
                                    <span className="font-bold text-zinc-700" style={{ fontSize: '18px' }}>{item.text}</span>
                                </div>
                            ))}
                        </div>

                        <Link
                            href={`/b/${slug}`}
                            className="flex items-center justify-center gap-3 w-full py-4 bg-zinc-50 hover:bg-zinc-100 border-2 border-zinc-200 rounded-2xl font-black text-zinc-600 hover:text-zinc-800 transition-all active:scale-[0.98] shadow-sm"
                            style={{ fontSize: '18px' }}
                        >
                            View Public Profile <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
