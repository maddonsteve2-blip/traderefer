import { Button } from "@/components/ui/button";
import {
    Shield,
    Star,
    MapPin,
    Phone,
    Mail,
    Globe,
    ChevronRight,
    Search,
    Share2,
    CheckCircle2,
    Image as ImageIcon,
    Users,
    Briefcase,
    Clock,
    Award,
    Wrench,
    Zap,
    BadgeCheck,
    ArrowRight,
    Calendar,
    TrendingUp,
    ShieldCheck,
    Info,
    ExternalLink,
    Facebook,
    Twitter,
    Linkedin
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LeadForm } from "@/components/LeadForm";
import { BookNowButton } from "@/components/BookNowButton";
import { EditableProfile } from "@/components/EditableProfile";
import { BusinessDelistDialog } from "@/components/BusinessDelistDialog";
import { ScrollNavButtons } from "@/components/ScrollNavButtons";
import { BusinessLogo } from "@/components/BusinessLogo";
import Script from "next/script";
import { proxyLogoUrl } from "@/lib/logo";

async function getBusiness(slug: string) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const res = await fetch(`${apiUrl}/businesses/${slug}`, {
        cache: 'no-store'
    });
    if (!res.ok) return null;
    return res.json();
}

async function getProjects(slug: string) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const res = await fetch(`${apiUrl}/business/${slug}/projects/public`, {
        cache: 'no-store'
    });
    if (!res.ok) return [];
    return res.json();
}

async function getGoogleReviews(slug: string) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const res = await fetch(`${apiUrl}/businesses/${slug}/google-reviews`, {
        cache: 'no-store'
    });
    if (!res.ok) return [];
    return res.json();
}

export default async function PublicProfilePage({
    params,
    searchParams
}: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ ref?: string }>;
}) {
    const { slug } = await params;
    const { ref: referralCode } = await searchParams;
    const [business, projects, googleReviews] = await Promise.all([
        getBusiness(slug),
        getProjects(slug),
        getGoogleReviews(slug),
    ]);

    if (!business) {
        notFound();
    }

    const featuredProject = projects.find((p: any) => p.is_featured);
    const otherProjects = projects.filter((p: any) => p !== featuredProject);

    // Compute derived stats
    const memberSinceYear = business.created_at ? new Date(business.created_at).getFullYear() : null;
    const jobsCompleted = business.total_leads_unlocked || 0;

    const allFeatures = business.features?.length > 0 ? business.features
        : business.business_highlights?.length > 0 ? business.business_highlights
            : [];

    const trustScore = business.trust_score ? (business.trust_score / 20).toFixed(1) : "5.0";
    const googleRating = business.avg_rating || null;
    const reviewCount = business.total_reviews || 0;

    // Schema Markup
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": business.business_name,
        "description": business.description || `Specialist ${business.trade_category} in ${business.suburb}.`,
        "url": `https://traderefer.au/b/${slug}`,
        "telephone": business.business_phone,
        "address": {
            "@type": "PostalAddress",
            "addressLocality": business.suburb,
            "addressRegion": business.state,
            "addressCountry": "AU"
        },
        "aggregateRating": googleRating ? {
            "@type": "AggregateRating",
            "ratingValue": googleRating,
            "reviewCount": reviewCount
        } : undefined
    };

    return (
        <EditableProfile businessSlug={slug}>
            <main className="min-h-screen bg-zinc-50">
                <Script
                    id="business-jsonld"
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />

                {/* ── BREADCRUMBS ── */}
                <div className="bg-white border-b border-zinc-100 pt-20 pb-3">
                    <div className="container mx-auto px-4">
                        <nav className="flex items-center gap-2 text-sm font-bold text-zinc-400 uppercase tracking-widest">
                            <Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link>
                            <ChevronRight className="w-3.5 h-3.5" />
                            <Link href="/businesses" className="hover:text-zinc-900 transition-colors">Directory</Link>
                            <ChevronRight className="w-3.5 h-3.5" />
                            <span className="text-orange-600">{business.business_name}</span>
                        </nav>
                    </div>
                </div>

                {/* ── TWO-COLUMN LAYOUT ── */}
                <div className="container mx-auto px-4 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 items-start">

                        {/* ── LEFT SIDEBAR ── */}
                        <div className="space-y-4 lg:sticky lg:top-24 self-start">

                            {/* Cover photo card with logo overlay */}
                            <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
                                <div className="relative">
                                    {/* Cover photo */}
                                    <div className="h-36 relative overflow-hidden bg-zinc-200">
                                        {business.cover_photo_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={business.cover_photo_url}
                                                alt={`${business.business_name} cover`}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-gradient-to-br from-orange-100 via-zinc-50 to-zinc-200" />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
                                        {/* Claim CTA overlay for unclaimed businesses with no cover photo */}
                                        {business.is_claimed === false && !business.cover_photo_url && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-900/60">
                                                <p className="text-white text-xs font-black uppercase tracking-widest">This business is unclaimed</p>
                                                <Link
                                                    href={`/onboarding/business?claim=${business.id}&slug=${slug}`}
                                                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-lg"
                                                >
                                                    Claim This Business
                                                </Link>
                                            </div>
                                        )}
                                    </div>

                                    {/* Logo overlapping bottom-left of cover */}
                                    <div className="absolute bottom-0 left-4 translate-y-1/2 z-10">
                                        <div className="w-16 h-16 rounded-xl bg-white border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                                            <BusinessLogo logoUrl={business.logo_url} name={business.business_name} />
                                        </div>
                                    </div>
                                </div>

                                {/* Business info */}
                                <div className="pt-10 px-5 pb-5 space-y-3">
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-3 py-1 bg-zinc-100 text-zinc-600 rounded-full text-xs font-black uppercase tracking-widest border border-zinc-200">
                                            {business.trade_category}
                                        </span>
                                        {business.is_verified && (
                                            <span className="flex items-center gap-1.5 px-3 py-1 bg-orange-600 text-white rounded-full text-xs font-black uppercase tracking-widest">
                                                <ShieldCheck className="w-3.5 h-3.5" /> Verified
                                            </span>
                                        )}
                                    </div>

                                    <h1 className="text-xl font-black text-zinc-900 leading-tight">
                                        {business.business_name}
                                    </h1>

                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(Number(trustScore)) ? 'fill-orange-400 text-orange-400' : 'fill-zinc-200 text-zinc-200'}`} />
                                            ))}
                                        </div>
                                        <span className="text-sm font-black text-zinc-700">{trustScore}</span>
                                        {reviewCount > 0 && (
                                            <span className="text-xs text-zinc-400 font-medium">({reviewCount})</span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium">
                                        <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                        {business.suburb}, {business.state}
                                    </div>

                                    {memberSinceYear && (
                                        <div className="flex items-center gap-2 text-sm text-zinc-400 font-medium">
                                            <Clock className="w-3.5 h-3.5 shrink-0" />
                                            Member since {memberSinceYear}
                                        </div>
                                    )}

                                    {business.years_experience && (
                                        <div className="flex items-center gap-2 text-sm text-zinc-400 font-medium">
                                            <Award className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                            {business.years_experience} experience
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* CTA Buttons */}
                            <div className="space-y-2">
                                <Button asChild size="lg" className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black h-12 text-base border-none shadow-md shadow-orange-200 transition-all active:scale-95">
                                    <Link href="#enquiry-form">Get a Free Quote</Link>
                                </Button>
                                <Button asChild variant="outline" size="lg" className="w-full bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-xl font-black h-12 text-base shadow-sm">
                                    <Link href={`/b/${slug}/refer`}>Refer &amp; Earn <ArrowRight className="w-4 h-4 ml-2" /></Link>
                                </Button>
                            </div>

                            {/* Contact details */}
                            <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-4">
                                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest pb-3 border-b border-zinc-100">Contact & Location</h3>
                                {business.business_phone && (
                                    <a href={`tel:${business.business_phone}`} className="flex items-center gap-3 group">
                                        <div className="w-9 h-9 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-center text-zinc-400 group-hover:text-orange-500 transition-colors shrink-0">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest leading-none mb-0.5">Phone</p>
                                            <p className="text-sm font-black text-orange-600">{business.business_phone}</p>
                                        </div>
                                    </a>
                                )}
                                {business.address && (
                                    <div className="flex items-start gap-3">
                                        <div className="w-9 h-9 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-center text-zinc-400 shrink-0">
                                            <MapPin className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest leading-none mb-0.5">Address</p>
                                            <p className="text-sm font-bold text-zinc-700 leading-snug">{business.address}</p>
                                        </div>
                                    </div>
                                )}
                                {business.website && (
                                    <a href={business.website.startsWith('http') ? business.website : `https://${business.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
                                        <div className="w-9 h-9 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-center text-zinc-400 group-hover:text-orange-500 transition-colors shrink-0">
                                            <Globe className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest leading-none mb-0.5">Website</p>
                                            <p className="text-sm font-bold text-orange-600 flex items-center gap-1">Visit Site <ExternalLink className="w-3.5 h-3.5" /></p>
                                        </div>
                                    </a>
                                )}
                                {business.business_email && (
                                    <a href={`mailto:${business.business_email}`} className="flex items-center gap-3 group">
                                        <div className="w-9 h-9 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-center text-zinc-400 group-hover:text-orange-500 transition-colors shrink-0">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest leading-none mb-0.5">Email</p>
                                            <p className="text-sm font-bold text-zinc-700 break-all">{business.business_email}</p>
                                        </div>
                                    </a>
                                )}
                                {business.abn && (
                                    <div className="flex items-start gap-3">
                                        <div className="w-9 h-9 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-center text-zinc-400 shrink-0">
                                            <Briefcase className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest leading-none mb-0.5">ABN</p>
                                            <p className="text-sm font-bold text-zinc-700 uppercase tracking-widest">{business.abn}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Claim banner (sidebar) */}
                            {business.is_claimed === false && (
                                <Link
                                    href={`/onboarding/business?claim=${business.id}&slug=${slug}`}
                                    className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-2xl p-4 hover:border-orange-400 hover:bg-orange-100 transition-all group"
                                >
                                    <ShieldCheck className="w-5 h-5 text-orange-500 shrink-0" />
                                    <div>
                                        <p className="text-sm font-black text-orange-800">Own this business?</p>
                                        <p className="text-xs text-orange-600 font-bold group-hover:underline">Claim your free profile →</p>
                                    </div>
                                </Link>
                            )}
                            <BusinessDelistDialog businessId={business.id} businessName={business.business_name} />
                        </div>

                        {/* ── MAIN CONTENT ── */}
                        <div className="space-y-6 min-w-0">

                            {/* Scroll nav buttons */}
                            <ScrollNavButtons
                                hasServices={!!(business.services?.length > 0 || business.specialties?.length > 0)}
                                hasGallery={!!(business.photo_urls?.length > 0)}
                                hasReviews={googleReviews.length > 0}
                            />

                            {/* About */}
                            <section id="about" className="bg-white rounded-2xl border border-zinc-200 p-7 shadow-sm scroll-mt-24">
                                <h2 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] mb-5 flex items-center gap-3">
                                    <div className="w-6 h-px bg-zinc-200" /> About the Business
                                </h2>
                                <p className="text-base text-zinc-700 leading-relaxed font-medium">
                                    {business.description || (
                                        <>
                                            {business.business_name} is a highly-rated {business.trade_category} specialist serving {business.suburb} and the wider {business.city || 'region'}.
                                            {googleRating && ` With a ${googleRating} star rating from ${reviewCount} local reviews, `}
                                            they are recognized for their reliability, quality craftsmanship, and exceptional customer service.
                                        </>
                                    )}
                                </p>
                                {allFeatures.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-5">
                                        {allFeatures.map((feature: string) => (
                                            <div key={feature} className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-black text-zinc-700 flex items-center gap-2 hover:border-orange-200 transition-all">
                                                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full shrink-0" />
                                                {feature}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* Services & Expertise */}
                            {(business.services?.length > 0 || business.specialties?.length > 0) && (
                                <section id="services" className="bg-white rounded-2xl border border-zinc-200 p-7 shadow-sm scroll-mt-24">
                                    <h2 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] mb-5 flex items-center gap-3">
                                        <div className="w-6 h-px bg-zinc-200" /> Expertise &amp; Services
                                    </h2>
                                    {business.services?.length > 0 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                                            {business.services.map((service: string) => (
                                                <div key={service} className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100 hover:border-orange-200 hover:bg-white transition-all">
                                                    <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                                                    <span className="text-sm text-zinc-800 font-bold">{service}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {business.specialties?.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {business.specialties.map((spec: string) => (
                                                <div key={spec} className="px-3 py-1.5 bg-orange-50 border border-orange-100 text-orange-800 rounded-lg text-xs font-black hover:bg-orange-100 transition-all">
                                                    {spec}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            )}

                            {/* Project Gallery */}
                            {business.photo_urls?.length > 0 && (
                                <section id="gallery" className="bg-white rounded-2xl border border-zinc-200 p-7 shadow-sm scroll-mt-24">
                                    <h2 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] mb-5 flex items-center justify-between">
                                        <span className="flex items-center gap-3"><div className="w-6 h-px bg-zinc-200" /> Project Gallery</span>
                                        <span className="text-xs font-bold text-zinc-300 normal-case tracking-normal">{business.trade_category}</span>
                                    </h2>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {business.photo_urls.map((url: string, i: number) => (
                                            <div key={i} className="aspect-square rounded-xl overflow-hidden bg-zinc-100 group relative cursor-pointer">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={url} alt={`${business.business_name} work`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Trust & Reliability */}
                            <section className="bg-white rounded-2xl border border-zinc-200 p-7 shadow-sm">
                                <h2 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] mb-5 flex items-center gap-3">
                                    <div className="w-6 h-px bg-zinc-200" /> Trust &amp; Reliability
                                </h2>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-5 bg-zinc-50 rounded-xl border border-zinc-100">
                                        <p className="text-3xl font-black text-zinc-900">{trustScore}</p>
                                        <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mt-1">TradeRefer Score</p>
                                    </div>
                                    <div className="text-center p-5 bg-zinc-50 rounded-xl border border-zinc-100 flex flex-col items-center justify-center">
                                        <div className="flex items-center text-orange-400 mb-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(googleRating || 5) ? 'fill-current' : 'opacity-30'}`} />
                                            ))}
                                        </div>
                                        <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Google</p>
                                        <p className="text-xs text-zinc-400 mt-0.5">{reviewCount} reviews</p>
                                    </div>
                                    <div className="text-center p-5 bg-zinc-50 rounded-xl border border-zinc-100">
                                        <p className="text-3xl font-black text-zinc-900">{jobsCompleted}</p>
                                        <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mt-1">Connections</p>
                                    </div>
                                </div>
                            </section>

                            {/* Google Reviews */}
                            {googleReviews.length > 0 && (
                                <section id="reviews" className="bg-white rounded-2xl border border-zinc-200 p-7 shadow-sm scroll-mt-24">
                                    <h2 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] mb-5 flex items-center justify-between">
                                        <span className="flex items-center gap-3"><div className="w-6 h-px bg-zinc-200" /> Google Reviews</span>
                                        <span className="flex items-center gap-1.5 text-orange-500">
                                            <Star className="w-3.5 h-3.5 fill-orange-400 text-orange-400" />
                                            <span className="text-zinc-900 font-black text-sm">{googleRating}</span>
                                            <span className="text-zinc-400 text-xs">({reviewCount})</span>
                                        </span>
                                    </h2>
                                    <div className="space-y-4">
                                        {googleReviews.map((review: any) => (
                                            <div key={review.id} className="p-5 bg-zinc-50 rounded-xl border border-zinc-100 hover:border-orange-100 hover:bg-white hover:shadow-sm transition-all">
                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-black text-sm shrink-0">
                                                            {(review.profile_name || 'A')[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-zinc-900 text-sm leading-none">{review.profile_name || 'Google Reviewer'}</p>
                                                            <p className="text-xs text-zinc-400 font-medium mt-0.5">Google Review</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-0.5 shrink-0">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} className={`w-3.5 h-3.5 ${i < (review.rating || 5) ? 'fill-orange-400 text-orange-400' : 'text-zinc-200 fill-zinc-200'}`} />
                                                        ))}
                                                    </div>
                                                </div>
                                                {review.review_text && (
                                                    <p className="text-zinc-600 text-sm leading-relaxed">&ldquo;{review.review_text}&rdquo;</p>
                                                )}
                                                {review.owner_answer && (
                                                    <div className="mt-3 pl-4 border-l-2 border-orange-200">
                                                        <p className="text-xs font-black text-orange-600 uppercase tracking-widest mb-1">Owner Response</p>
                                                        <p className="text-zinc-500 text-xs leading-relaxed">{review.owner_answer}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Enquiry Form */}
                            <div id="enquiry-form" className="bg-white rounded-2xl border border-zinc-200 p-7 shadow-sm scroll-mt-24">
                                <h3 className="text-lg font-black text-zinc-900 mb-1">Get a Free Quote</h3>
                                <p className="text-sm text-zinc-400 mb-6 italic">Expect a response within 24 hours.</p>
                                <LeadForm businessName={business.business_name} businessId={business.id} referralCode={referralCode} />
                            </div>

                            {/* Refer & Earn */}
                            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-7 relative overflow-hidden">
                                <Zap className="absolute -bottom-8 -right-8 w-36 h-36 text-orange-300/30 rotate-12" />
                                <div className="relative z-10">
                                    <h3 className="text-lg font-black text-zinc-900 mb-2">Refer &amp; Earn</h3>
                                    <p className="text-zinc-600 text-sm mb-5 leading-relaxed">Know someone who needs {business.trade_category} services? Refer {business.business_name} and earn a reward when the job closes.</p>
                                    <Button asChild size="lg" className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black h-12 text-base border-none shadow-md shadow-orange-200">
                                        <Link href={`/b/${slug}/refer`}>Get Referral Link <Share2 className="w-5 h-5 ml-2" /></Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </EditableProfile>
    );
}


