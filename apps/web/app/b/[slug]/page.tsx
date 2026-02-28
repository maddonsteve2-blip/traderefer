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
import { BusinessClaimDialog } from "@/components/BusinessClaimDialog";
import { BusinessDelistDialog } from "@/components/BusinessDelistDialog";
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
                <div className="bg-white border-b border-zinc-100 pt-32 pb-4">
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

                {/* ── HERO SECTION ── */}
                <div className="bg-white pb-20 relative overflow-hidden text-zinc-900 border-b border-zinc-100">

                    {business.cover_photo_url && (
                        <div className="absolute inset-0 opacity-5">
                            <img src={business.cover_photo_url} alt="" className="w-full h-full object-cover grayscale" />
                            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-white" />
                        </div>
                    )}

                    <div className="container mx-auto px-4 relative z-10 pt-16">
                        <div className="flex flex-col md:flex-row gap-12 items-start md:items-end">
                            {/* Logo */}
                            <div className="w-36 h-36 md:w-48 md:h-48 bg-zinc-50 rounded-[40px] flex items-center justify-center overflow-hidden border-8 border-white shadow-2xl shadow-zinc-200 shrink-0 group">
                                <BusinessLogo logoUrl={business.logo_url} name={business.business_name} />
                            </div>

                            <div className="flex-1 space-y-6">
                                <div className="flex flex-wrap items-center gap-4">
                                    <span className="px-4 py-1.5 bg-zinc-100 text-zinc-600 rounded-full text-xs font-black uppercase tracking-widest border border-zinc-200">
                                        {business.trade_category}
                                    </span>
                                    {business.is_verified && (
                                        <span className="flex items-center gap-2 px-4 py-1.5 bg-orange-600 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-600/20">
                                            <ShieldCheck className="w-4 h-4" /> Verified
                                        </span>
                                    )}
                                    {business.is_claimed === false && (
                                        <BusinessClaimDialog
                                            businessId={business.id}
                                            businessName={business.business_name}
                                        />
                                    )}
                                </div>
                                <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight">
                                    {business.business_name}
                                </h1>
                                <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-400 font-bold">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-orange-500" />
                                        {business.suburb}, {business.state}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Star className="w-5 h-5 text-orange-400 fill-orange-400" />
                                        {trustScore}/5.0 Trust Score
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 w-full md:w-auto self-start md:self-end">
                                <Button asChild size="lg" className="bg-orange-500 hover:bg-orange-600 text-white rounded-full font-black h-16 px-10 text-xl border-none shadow-lg shadow-orange-200 transition-all active:scale-95">
                                    <Link href="#enquiry-form">Get a Free Quote</Link>
                                </Button>
                                <Button asChild variant="outline" size="lg" className="bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 rounded-full font-black h-16 px-10 text-xl shadow-sm">
                                    <Link href={`/b/${slug}/refer`}>Refer & Earn <ArrowRight className="w-6 h-6 ml-2" /></Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── BODY ── */}
                <div className="container mx-auto px-4 py-16">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                        {/* ── MAIN COLUMN ── */}
                        <div className="lg:col-span-2 space-y-12">

                            {/* About Section */}
                            <section className="bg-white rounded-[40px] border border-zinc-200 p-8 md:p-14 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-orange-500/10 transition-colors duration-1000" />
                                <div className="relative z-10">
                                    <h2 className="text-sm font-black text-zinc-500 uppercase tracking-[0.2em] mb-10 flex items-center gap-3">
                                        <div className="w-8 h-px bg-zinc-200" />
                                        About the Business
                                    </h2>
                                    <div className="prose prose-zinc max-w-none">
                                        <p className="text-2xl text-zinc-800 leading-[1.8] font-medium tracking-tight">
                                            {business.description || (
                                                <>
                                                    {business.business_name} is a highly-rated {business.trade_category} specialist serving {business.suburb} and the wider {business.city || 'Geelong'} region.
                                                    {googleRating && ` With a stellar ${googleRating} star rating from ${reviewCount} local reviews, `}
                                                    they are recognized for their reliability, quality craftsmanship, and exceptional customer service across the VIC region.
                                                </>
                                            )}
                                        </p>
                                    </div>

                                    {/* Feature Badges */}
                                    {allFeatures.length > 0 && (
                                        <div className="flex flex-wrap gap-3 mt-12 p-3 bg-zinc-50 border border-zinc-100 rounded-[32px]">
                                            {allFeatures.map((feature: string) => (
                                                <div key={feature} className="px-6 py-3.5 bg-white border border-zinc-200 rounded-2xl text-base font-black text-zinc-900 flex items-center gap-3 shadow-sm transform transition-transform hover:-translate-y-1">
                                                    <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" />
                                                    {feature}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {business.years_experience && (
                                        <div className="mt-16 pt-12 border-t border-zinc-100 flex items-center gap-8">
                                            <div className="w-20 h-20 bg-orange-50 border border-orange-100 rounded-[28px] flex items-center justify-center text-orange-500">
                                                <Award className="w-10 h-10" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-black text-zinc-900 tracking-tight">{business.years_experience} of Industry Excellence</p>
                                                <p className="text-base text-zinc-500 font-medium mt-1">Verified professional experience in {business.trade_category}.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Service Capabilities */}
                            {(business.services?.length > 0 || business.specialties?.length > 0) && (
                                <section className="bg-white rounded-[40px] border border-zinc-200 p-8 md:p-14 shadow-sm">
                                    <h2 className="text-sm font-black text-zinc-500 uppercase tracking-[0.2em] mb-10 flex items-center gap-3">
                                        <div className="w-8 h-px bg-zinc-200" />
                                        Expertise & Services
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {business.services && business.services.length > 0 && (
                                            <div className="col-span-full mb-8">
                                                <h3 className="text-sm font-black text-zinc-400 mb-6 px-1 uppercase tracking-widest">Primary Services</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {business.services.map((service: string) => (
                                                        <div key={service} className="flex items-center gap-5 p-6 bg-zinc-50 rounded-3xl border border-zinc-100 group hover:border-orange-200 transition-all hover:bg-white hover:shadow-xl hover:shadow-zinc-200/50">
                                                            <div className="w-12 h-12 bg-white border border-zinc-100 rounded-2xl flex items-center justify-center text-orange-600 shadow-sm group-hover:scale-110 transition-transform">
                                                                <CheckCircle2 className="w-6 h-6" />
                                                            </div>
                                                            <span className="text-xl text-zinc-800 font-bold tracking-tight">{service}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {business.specialties && business.specialties.length > 0 && (
                                            <div className="col-span-full mt-8">
                                                <h3 className="text-sm font-black text-zinc-400 mb-6 px-1 uppercase tracking-widest">Key Specialties</h3>
                                                <div className="flex flex-wrap gap-3">
                                                    {business.specialties.map((spec: string) => (
                                                        <div key={spec} className="px-6 py-3 bg-zinc-50 border border-zinc-200 text-zinc-800 rounded-2xl text-lg font-black transition-all hover:-translate-y-1 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700">
                                                            {spec}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}

                            {/* Work Gallery */}
                            {business.photo_urls && business.photo_urls.length > 0 ? (
                                <section className="bg-white rounded-[32px] border border-zinc-200 p-8 md:p-12 shadow-sm">
                                    <div className="flex items-center justify-between mb-8">
                                        <h2 className="text-2xl font-black text-zinc-900 font-display">Project Gallery</h2>
                                        <span className="text-sm font-bold text-zinc-400 capitalize">{business.trade_category} Projects</span>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {business.photo_urls.map((url: string, i: number) => (
                                            <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-zinc-100 group relative cursor-pointer">
                                                <img src={url} alt={`${business.business_name} work`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 font-display" />
                                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            ) : (
                                <section className="bg-zinc-50 border border-zinc-200 rounded-[32px] p-12 text-center relative overflow-hidden">
                                    <ImageIcon className="absolute -bottom-10 -left-10 w-48 h-48 text-zinc-200" />
                                    <div className="relative z-10">
                                        <h3 className="text-2xl font-black text-zinc-800 mb-2">Want to see more work?</h3>
                                        <p className="text-zinc-500 mb-8 max-w-md mx-auto">This business hasn&apos;t uploaded their latest project photos yet. Request a quote to see their recent portfolio.</p>
                                        <Button asChild size="lg" className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold border-none">
                                            <Link href="#enquiry-form">Contact Business</Link>
                                        </Button>
                                    </div>
                                </section>
                            )}

                            {/* Testimonials / Trust Section */}
                            <section className="bg-white rounded-2xl border border-zinc-200 p-8 md:p-10 shadow-sm">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="p-2.5 bg-zinc-50 border border-zinc-100 text-zinc-500 rounded-xl">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-2xl font-black text-zinc-900 font-display">Trust & Reliability</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="p-8 bg-zinc-50 rounded-3xl border border-zinc-100 text-center">
                                        <p className="text-5xl font-black text-zinc-900 mb-2">{trustScore}</p>
                                        <p className="text-sm font-black text-zinc-500 uppercase tracking-widest">TradeRefer Score</p>
                                        <p className="text-base text-zinc-500 mt-4 leading-relaxed italic">Verified local community rating.</p>
                                    </div>
                                    <div className="p-8 bg-zinc-50 rounded-3xl border border-zinc-100 text-center flex flex-col items-center justify-center">
                                        <div className="flex items-center text-orange-400 mb-4">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`w-6 h-6 ${i < Math.floor(googleRating || 5) ? 'fill-current' : 'opacity-30'}`} />
                                            ))}
                                        </div>
                                        <p className="text-sm font-black text-zinc-500 uppercase tracking-widest leading-none">Google Rating</p>
                                        <p className="text-base text-zinc-500 mt-3 font-medium">From {reviewCount} verified reviews</p>
                                    </div>
                                    <div className="p-8 bg-zinc-50 rounded-3xl border border-zinc-100 text-center">
                                        <p className="text-5xl font-black text-zinc-900 mb-2">{jobsCompleted}</p>
                                        <p className="text-sm font-black text-zinc-500 uppercase tracking-widest">Connections</p>
                                        <p className="text-base text-zinc-500 mt-4 leading-relaxed font-medium">Successful jobs in {business.suburb}.</p>
                                    </div>
                                </div>
                            </section>

                            {/* Google Reviews Section */}
                            {googleReviews.length > 0 && (
                                <section className="bg-white rounded-[40px] border border-zinc-200 p-8 md:p-14 shadow-sm">
                                    <h2 className="text-sm font-black text-zinc-500 uppercase tracking-[0.2em] mb-10 flex items-center gap-3">
                                        <div className="w-8 h-px bg-zinc-200" />
                                        Google Reviews
                                        <span className="ml-auto flex items-center gap-2 text-orange-500">
                                            <Star className="w-4 h-4 fill-orange-400 text-orange-400" />
                                            <span className="text-zinc-900 font-black text-base">{googleRating}</span>
                                            <span className="text-zinc-400 font-medium text-sm">({reviewCount})</span>
                                        </span>
                                    </h2>
                                    <div className="space-y-6">
                                        {googleReviews.map((review: any) => (
                                            <div key={review.id} className="p-8 bg-zinc-50 rounded-3xl border border-zinc-100 group hover:border-orange-100 hover:bg-white hover:shadow-lg transition-all duration-300">
                                                <div className="flex items-start justify-between gap-4 mb-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-orange-200">
                                                            {(review.profile_name || 'A')[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-zinc-900 text-lg leading-none">{review.profile_name || 'Google Reviewer'}</p>
                                                            <p className="text-xs text-zinc-400 font-medium mt-1 uppercase tracking-widest">Google Review</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} className={`w-4 h-4 ${i < (review.rating || 5) ? 'fill-orange-400 text-orange-400' : 'text-zinc-200 fill-zinc-200'}`} />
                                                        ))}
                                                    </div>
                                                </div>
                                                {review.review_text && (
                                                    <p className="text-zinc-700 text-lg leading-relaxed font-medium pl-16">&ldquo;{review.review_text}&rdquo;</p>
                                                )}
                                                {review.owner_answer && (
                                                    <div className="mt-5 ml-16 pl-6 border-l-2 border-orange-200">
                                                        <p className="text-xs font-black text-orange-600 uppercase tracking-widest mb-2">Owner Response</p>
                                                        <p className="text-zinc-600 text-base leading-relaxed">{review.owner_answer}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* ── SIDEBAR ── */}
                        <div className="space-y-6 lg:sticky lg:top-24 self-start">

                            {/* Contact Box */}
                            <div className="bg-white rounded-2xl border border-zinc-200 p-8 shadow-sm">
                                <h3 className="text-sm font-black text-zinc-400 mb-10 uppercase tracking-[0.2em] px-1 border-b border-zinc-50 pb-6">Contact & Location</h3>
                                <div className="space-y-6">
                                    {business.address && (
                                        <div className="flex items-start gap-6 p-6 bg-zinc-50 rounded-3xl border border-zinc-100 group">
                                            <div className="w-14 h-14 bg-white border border-zinc-100 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:text-orange-500 transition-colors shrink-0 shadow-sm">
                                                <MapPin className="w-7 h-7" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-1.5">Business Address</p>
                                                <p className="text-lg text-zinc-800 font-bold leading-tight break-words">{business.address}</p>
                                            </div>
                                        </div>
                                    )}
                                    {business.abn && (
                                        <div className="flex items-start gap-6 p-6 bg-zinc-50 rounded-3xl border border-zinc-100 group">
                                            <div className="w-14 h-14 bg-white border border-zinc-100 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:text-orange-500 transition-colors shrink-0 shadow-sm">
                                                <Briefcase className="w-7 h-7" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-1.5">Registered ABN</p>
                                                <p className="text-lg text-zinc-800 font-bold leading-tight uppercase tracking-widest">{business.abn}</p>
                                            </div>
                                        </div>
                                    )}
                                    {business.business_phone && (
                                        <a href={`tel:${business.business_phone}`} className="flex items-start gap-6 p-6 bg-zinc-50 rounded-3xl border border-orange-100 group hover:border-orange-500 hover:bg-white hover:shadow-2xl transition-all h-28">
                                            <div className="w-14 h-14 bg-white border border-zinc-100 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:text-orange-500 transition-colors shrink-0 shadow-sm">
                                                <Phone className="w-7 h-7" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-1.5">Office Phone</p>
                                                <p className="text-lg text-orange-600 font-black break-all">{business.business_phone}</p>
                                            </div>
                                        </a>
                                    )}
                                    {business.website && (
                                        <a href={business.website.startsWith('http') ? business.website : `https://${business.website}`} target="_blank" rel="noopener noreferrer" className="flex items-start gap-6 p-6 bg-zinc-50 rounded-3xl border border-zinc-100 group hover:border-orange-500 hover:bg-white hover:shadow-2xl transition-all">
                                            <div className="w-14 h-14 bg-white border border-zinc-100 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:text-orange-500 transition-colors shrink-0 shadow-sm">
                                                <Globe className="w-7 h-7" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-1.5">Official Website</p>
                                                <p className="text-lg text-zinc-700 font-bold flex items-center gap-2">Visit Site <ExternalLink className="w-5 h-5" /></p>
                                            </div>
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Enquiry Form */}
                            <div id="enquiry-form" className="bg-white rounded-3xl border border-zinc-200 p-8 shadow-sm relative overflow-hidden scroll-mt-24">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-bl-[100px]" />
                                <h3 className="text-xl font-black text-zinc-900 mb-2 relative z-10">Get a Free Quote</h3>
                                <p className="text-sm text-zinc-400 mb-8 relative z-10 italic">Expect a response within 24 hours.</p>
                                <LeadForm businessName={business.business_name} businessId={business.id} referralCode={referralCode} />
                            </div >

                            {/* Share & refer Card */}
                            <div className="bg-orange-50 border border-orange-100 rounded-3xl p-8 relative overflow-hidden">
                                <Zap className="absolute -bottom-10 -right-10 w-48 h-48 text-orange-300/30 rotate-12" />
                                <div className="relative z-10">
                                    <h3 className="text-2xl font-black text-zinc-900 mb-3">Refer & Earn</h3>
                                    <p className="text-zinc-600 text-lg mb-8 leading-relaxed font-medium">Know someone who needs {business.trade_category} services? Refer {business.business_name} and earn a reward when the job closes.</p>
                                    <Button asChild size="lg" className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black h-16 text-xl border-none shadow-lg shadow-orange-200">
                                        <Link href={`/b/${slug}/refer`}>Get Referral Link <Share2 className="w-6 h-6 ml-3" /></Link>
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


