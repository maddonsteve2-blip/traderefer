import {
    Star,
    MapPin,
    Phone,
    Mail,
    Globe,
    ChevronRight,
    Share2,
    Briefcase,
    Clock,
    Award,
    Zap,
    ArrowRight,
    ShieldCheck,
    ExternalLink,
    Tag,
    CreditCard,
    Facebook,
    Instagram,
    Linkedin,
    BadgeCheck,
    HelpCircle,
    CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LeadForm } from "@/components/LeadForm";
import { EditableConditionalSection, EditableContactField, EditableFee, EditableGallery, EditableImage, EditableProfile, EditableServices, EditableText } from "@/components/EditableProfile";
import { BusinessDelistDialog } from "@/components/BusinessDelistDialog";
import { ScrollNavButtons } from "@/components/ScrollNavButtons";
import { BusinessLogo } from "@/components/BusinessLogo";
import Script from "next/script";
import { proxyLogoUrl } from "@/lib/logo";
import { TRADE_FAQ_BANK } from "@/lib/constants";

async function getBusiness(slug: string) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const res = await fetch(`${apiUrl}/businesses/${slug}`, {
        next: { revalidate: 3600 }
    });
    if (!res.ok) return null;
    return res.json();
}

async function getProjects(slug: string) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const res = await fetch(`${apiUrl}/business/${slug}/projects/public`, {
        next: { revalidate: 3600 }
    });
    if (!res.ok) return [];
    return res.json();
}

async function getGoogleReviews(slug: string) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const res = await fetch(`${apiUrl}/businesses/${slug}/google-reviews`, {
        next: { revalidate: 86400 }
    });
    if (!res.ok) return [];
    return res.json();
}

async function getDeals(slug: string) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const res = await fetch(`${apiUrl}/businesses/${slug}/deals`, {
        next: { revalidate: 3600 }
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
    const [business, projects, googleReviews, deals] = await Promise.all([
        getBusiness(slug),
        getProjects(slug),
        getGoogleReviews(slug),
        getDeals(slug),
    ]);

    if (!business) {
        notFound();
    }

    const safeProjects = Array.isArray(projects) ? projects : [];
    const featuredProject = safeProjects.find((p: any) => p.is_featured);
    const otherProjects = safeProjects.filter((p: any) => p !== featuredProject);

    // Compute derived stats
    const memberSinceYear = business.created_at ? new Date(business.created_at).getFullYear() : null;
    const jobsCompleted = business.total_leads_unlocked || 0;

    const allFeatures = business.features?.length > 0 ? business.features
        : business.business_highlights?.length > 0 ? business.business_highlights
            : [];

    const trustScore = business.trust_score ? (business.trust_score / 20).toFixed(1) : "5.0";
    const googleRating = business.avg_rating || null;
    const reviewCount = business.total_reviews || 0;
    const aboutFallback = `${business.business_name} is a highly-rated ${business.trade_category} specialist serving ${business.suburb} and the wider ${business.city || 'region'}.${googleRating ? ` With a ${googleRating} star rating from ${reviewCount} local reviews,` : ''} they are recognized for their reliability, quality craftsmanship, and exceptional customer service.`;

    // Schema Markup
    const parsedRating = parseFloat(String(googleRating));
    const parsedReviewCount = parseInt(String(reviewCount), 10);
    const hasValidRating = !isNaN(parsedRating) && parsedRating > 0 && parsedReviewCount > 0;

    // Map trade category to specific Schema.org type for richer SERP treatment
    const tradeCategory = (business.trade_category || "").toLowerCase();
    const schemaType = tradeCategory.includes("plumb") ? "Plumber"
        : tradeCategory.includes("electr") ? "Electrician"
        : tradeCategory.includes("paint") ? "HousePainter"
        : tradeCategory.includes("lock") ? "Locksmith"
        : tradeCategory.includes("pest") ? "PestControlBusiness"
        : tradeCategory.includes("roof") ? "RoofingContractor"
        : tradeCategory.includes("air con") || tradeCategory.includes("hvac") || tradeCategory.includes("heating") ? "HVACBusiness"
        : tradeCategory.includes("mov") || tradeCategory.includes("remov") ? "MovingCompany"
        : tradeCategory.includes("build") || tradeCategory.includes("construct") || tradeCategory.includes("carpent") ? "GeneralContractor"
        : "HomeAndConstructionBusiness";

    // Individual reviews for JSON-LD (only reviews with text, max 5 — must match what's visible on page)
    const safeReviews = Array.isArray(googleReviews) ? googleReviews : [];
    const reviewItems = safeReviews
        .filter((r: any) => r.review_text && r.profile_name && r.rating)
        .slice(0, 5)
        .map((r: any) => ({
            "@type": "Review",
            "author": { "@type": "Person", "name": r.profile_name },
            "reviewRating": {
                "@type": "Rating",
                "ratingValue": r.rating,
                "bestRating": 5,
                "worstRating": 1,
            },
            "reviewBody": r.review_text,
        }));

    const jsonLd: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": schemaType,
        "name": business.business_name,
        "description": business.description || `Specialist ${business.trade_category} in ${business.suburb}.`,
        "url": `https://traderefer.au/b/${slug}`,
        ...(business.logo_url ? { "image": proxyLogoUrl(business.logo_url) } : {}),
        ...(business.business_phone ? { "telephone": business.business_phone } : {}),
        "address": {
            "@type": "PostalAddress",
            "addressLocality": business.suburb,
            "addressRegion": business.state,
            ...(business.address?.match(/\b([A-Z]{2,3})\s+(\d{4})\b/)?.[2] ? { "postalCode": business.address.match(/\b([A-Z]{2,3})\s+(\d{4})\b/)[2] } : {}),
            "addressCountry": "AU"
        },
        ...(hasValidRating ? {
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": parsedRating,
                "reviewCount": parsedReviewCount,
                "bestRating": 5,
                "worstRating": 1,
            }
        } : {}),
        ...(reviewItems.length > 0 ? { "review": reviewItems } : {}),
    };

    // FAQ schema for SEO
    const tradeFaqs = TRADE_FAQ_BANK[business.trade_category]?.slice(0, 5) || [];
    const faqJsonLd = tradeFaqs.length > 0 ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": tradeFaqs.map((faq: { q: string; a: string }) => ({
            "@type": "Question",
            "name": faq.q,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.a,
            },
        })),
    } : null;

    return (
        <EditableProfile businessSlug={slug}>
            <main className="min-h-screen bg-zinc-50">
                <Script
                    id="business-jsonld"
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
                {faqJsonLd && (
                    <Script
                        id="faq-jsonld"
                        type="application/ld+json"
                        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
                    />
                )}

                {/* ── BREADCRUMBS ── */}
                <div className="bg-white border-b border-zinc-100 pt-20 md:pt-28 pb-3">
                    <div className="container mx-auto px-4">
                        <nav className="flex items-center gap-2 font-bold text-zinc-400 uppercase tracking-widest" style={{ fontSize: '16px' }}>
                            <Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link>
                            <ChevronRight className="w-4 h-4" />
                            <Link href="/businesses" className="hover:text-zinc-900 transition-colors">Directory</Link>
                            <ChevronRight className="w-4 h-4" />
                            <span className="text-[#FF6600]">{business.business_name}</span>
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
                                        <EditableImage
                                            field="cover_photo_url"
                                            initialValue={business.cover_photo_url}
                                            alt={`${business.business_name} cover`}
                                            className="w-full h-full object-cover"
                                            empty={<div className="absolute inset-0 bg-gradient-to-br from-orange-100 via-zinc-50 to-zinc-200" />}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
                                        {/* Claim CTA overlay for unclaimed businesses with no cover photo */}
                                        {business.is_claimed === false && !business.cover_photo_url && (
                                            <div data-claim-banner className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-900/60">
                                                <p className="text-white font-black uppercase tracking-widest" style={{ fontSize: '16px' }}>This business is unclaimed</p>
                                                <Link
                                                    href={`/claim/${slug}`}
                                                    className="px-5 py-3 bg-[#FF6600] hover:bg-[#E65C00] text-white rounded-full font-black uppercase tracking-widest transition-all shadow-lg" style={{ fontSize: '16px' }}
                                                >
                                                    Claim This Business
                                                </Link>
                                            </div>
                                        )}
                                    </div>

                                    {/* Logo overlapping bottom-left of cover */}
                                    <div className="absolute bottom-0 left-4 translate-y-1/2 z-10">
                                        <div className="w-16 h-16 rounded-xl bg-white border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                                            <EditableImage
                                                field="logo_url"
                                                initialValue={business.logo_url}
                                                alt={business.business_name}
                                                className="w-full h-full object-cover"
                                                photoUrls={business.photo_urls}
                                                empty={<BusinessLogo logoUrl={business.logo_url} name={business.business_name} photoUrls={business.photo_urls} />}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Business info */}
                                <div className="pt-10 px-5 pb-5 space-y-3">
                                    <div className="flex flex-wrap gap-2">
                                        <EditableText
                                            field="trade_category"
                                            initialValue={business.trade_category}
                                            as="span"
                                            className="px-3 py-1.5 bg-zinc-100 text-zinc-600 rounded-full font-black uppercase tracking-widest border border-zinc-200 inline-flex"
                                            style={{ fontSize: '16px' }}
                                            frameClassName="inline-flex"
                                        />
                                        {business.is_verified && (
                                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF6600] text-white rounded-full font-black uppercase tracking-widest" style={{ fontSize: '16px' }}>
                                                <ShieldCheck className="w-3.5 h-3.5" /> Verified
                                            </span>
                                        )}
                                    </div>

                                    <EditableText
                                        field="business_name"
                                        initialValue={business.business_name}
                                        as="h1"
                                        className="text-xl font-black text-zinc-900 leading-tight"
                                    />

                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(Number(trustScore)) ? 'fill-orange-400 text-orange-400' : 'fill-zinc-200 text-zinc-200'}`} />
                                            ))}
                                        </div>
                                        <span className="font-black text-zinc-700" style={{ fontSize: '16px' }}>{trustScore}</span>
                                        {reviewCount > 0 && (
                                            <span className="text-zinc-400 font-medium" style={{ fontSize: '16px' }}>({reviewCount})</span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 font-bold text-zinc-600" style={{ fontSize: '16px' }}>
                                        <MapPin className="w-4 h-4 text-[#FF6600] shrink-0" />
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <EditableText field="suburb" initialValue={business.suburb} as="span" className="font-bold text-zinc-600" style={{ fontSize: '16px' }} inputClassName="min-w-[120px]" />
                                            <span>,</span>
                                            <EditableText field="state" initialValue={business.state} as="span" className="font-bold text-zinc-600" style={{ fontSize: '16px' }} inputClassName="min-w-[60px]" />
                                        </div>
                                    </div>

                                    {memberSinceYear && (
                                        <div className="flex items-center gap-2 font-medium text-zinc-500" style={{ fontSize: '16px' }}>
                                            <Clock className="w-4 h-4 shrink-0" />
                                            Member since {memberSinceYear}
                                        </div>
                                    )}

                                    <EditableConditionalSection showWhenPublic={!!business.years_experience}>
                                        <div className="flex items-center gap-2 font-medium text-zinc-500" style={{ fontSize: '16px' }}>
                                            <Award className="w-4 h-4 text-[#FF6600] shrink-0" />
                                            <EditableText
                                                field="years_experience"
                                                initialValue={business.years_experience ? String(business.years_experience) : ""}
                                                as="span"
                                                className="font-medium text-zinc-500"
                                                style={{ fontSize: '16px' }}
                                                inputClassName="min-w-[48px]"
                                                frameClassName="px-3 py-2"
                                            />
                                            <span>experience</span>
                                        </div>
                                    </EditableConditionalSection>
                                </div>
                            </div>

                            {/* CTA Buttons */}
                            <div className="space-y-2">
                                <Link href="#enquiry-form" className="w-full bg-[#FF6600] hover:bg-[#E65C00] text-white rounded-xl font-black border-none shadow-md shadow-orange-200 transition-all active:scale-95 flex items-center justify-center" style={{ minHeight: '64px', fontSize: '18px' }}>Get a Free Quote</Link>
                                <Link href={`/dashboard/referrer/refer/${slug}`} className="w-full bg-white border-2 border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-xl font-black shadow-sm flex items-center justify-center gap-2" style={{ minHeight: '64px', fontSize: '16px' }}>Refer &amp; Earn <ArrowRight className="w-4 h-4" /></Link>
                            </div>

                            {/* Contact details */}
                            <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-4">
                                <h3 className="font-black text-zinc-400 uppercase tracking-widest pb-3 border-b border-zinc-100" style={{ fontSize: '16px' }}>Contact &amp; Location</h3>
                                <EditableContactField
                                    field="business_phone"
                                    initialValue={business.business_phone}
                                    label="Phone"
                                    icon={<Phone className="w-4 h-4" />}
                                    type="phone"
                                />
                                <EditableConditionalSection showWhenPublic={!!business.address}>
                                    <div className="flex items-start gap-3">
                                        <div className="w-9 h-9 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-center text-zinc-400 shrink-0">
                                            <MapPin className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-zinc-400 uppercase tracking-widest leading-none mb-0.5" style={{ fontSize: '16px' }}>Address</p>
                                            <EditableText
                                                field="address"
                                                initialValue={business.address}
                                                as="p"
                                                multiline
                                                rows={2}
                                                className="font-bold text-zinc-700 leading-snug"
                                                style={{ fontSize: '16px' }}
                                            />
                                        </div>
                                    </div>
                                </EditableConditionalSection>
                                <EditableContactField
                                    field="website"
                                    initialValue={business.website}
                                    label="Website"
                                    icon={<Globe className="w-4 h-4" />}
                                    type="website"
                                />
                                <EditableContactField
                                    field="business_email"
                                    initialValue={business.business_email}
                                    label="Email"
                                    icon={<Mail className="w-4 h-4" />}
                                    type="email"
                                />
                                <EditableContactField
                                    field="abn"
                                    initialValue={business.abn}
                                    label="ABN"
                                    icon={<Briefcase className="w-4 h-4" />}
                                />
                            </div>

                            {/* Licence Number */}
                            {business.licence_number && (
                                <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-3">
                                    <h3 className="font-black text-zinc-400 uppercase tracking-widest pb-3 border-b border-zinc-100 flex items-center gap-2" style={{ fontSize: '16px' }}>
                                        <BadgeCheck className="w-4 h-4 text-blue-500" /> Licences
                                    </h3>
                                    <div className="flex items-start gap-3">
                                        <div className="w-9 h-9 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-500 shrink-0">
                                            <BadgeCheck className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-zinc-400 uppercase tracking-widest leading-none mb-0.5" style={{ fontSize: '16px' }}>Trade Licence</p>
                                            <p className="font-bold text-zinc-700" style={{ fontSize: '16px' }}>{business.licence_number}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Ways to Pay */}
                            {business.payment_methods?.length > 0 && (
                                <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-3">
                                    <h3 className="font-black text-zinc-400 uppercase tracking-widest pb-3 border-b border-zinc-100 flex items-center gap-2" style={{ fontSize: '16px' }}>
                                        <CreditCard className="w-4 h-4 text-green-500" /> Ways to Pay
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {business.payment_methods.map((method: string) => (
                                            <span key={method} className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-full font-bold text-zinc-600" style={{ fontSize: '16px' }}>
                                                {method}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Social Links */}
                            {(business.facebook_url || business.instagram_url || business.linkedin_url) && (
                                <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-3">
                                    <h3 className="font-black text-zinc-400 uppercase tracking-widest pb-3 border-b border-zinc-100" style={{ fontSize: '16px' }}>Follow Us</h3>
                                    <div className="flex items-center gap-3">
                                        {business.facebook_url && (
                                            <a href={business.facebook_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all">
                                                <Facebook className="w-5 h-5" />
                                            </a>
                                        )}
                                        {business.instagram_url && (
                                            <a href={business.instagram_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-500 hover:text-pink-600 hover:border-pink-200 hover:bg-pink-50 transition-all">
                                                <Instagram className="w-5 h-5" />
                                            </a>
                                        )}
                                        {business.linkedin_url && (
                                            <a href={business.linkedin_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-500 hover:text-blue-700 hover:border-blue-200 hover:bg-blue-50 transition-all">
                                                <Linkedin className="w-5 h-5" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Location Map */}
                            {(business.address || business.suburb) && (
                                <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
                                    <h3 className="font-black text-zinc-400 uppercase tracking-widest px-5 pt-5 pb-3" style={{ fontSize: '16px' }}>Location</h3>
                                    <iframe
                                        title={`${business.business_name} location`}
                                        width="100%"
                                        height="200"
                                        style={{ border: 0 }}
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                        src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyCCRQCqPgWr0WAUszGQtutWXm2KDQBEfbk&q=${encodeURIComponent((business.address ? business.address + ', ' : '') + (business.suburb || '') + (business.state ? ', ' + business.state : '') + ', Australia')}`}
                                    />
                                </div>
                            )}

                            {/* Claim banner (sidebar) — hidden for owners via data-claim-banner */}
                            {business.is_claimed === false && (
                                <Link
                                    data-claim-banner
                                    href={`/claim/${slug}`}
                                    className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-2xl p-4 hover:border-orange-400 hover:bg-orange-100 transition-all group"
                                >
                                    <ShieldCheck className="w-5 h-5 text-orange-500 shrink-0" />
                                    <div>
                                        <p className="font-black text-orange-800" style={{ fontSize: '16px' }}>Own this business?</p>
                                        <p className="text-[#FF6600] font-bold group-hover:underline" style={{ fontSize: '16px' }}>Claim your free profile →</p>
                                    </div>
                                </Link>
                            )}

                            {/* Active Deals */}
                            {deals.length > 0 && (
                                <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-3">
                                    <h3 className="font-black text-zinc-400 uppercase tracking-widest pb-3 border-b border-zinc-100 flex items-center gap-2" style={{ fontSize: '16px' }}>
                                        <Tag className="w-4 h-4 text-[#FF6600]" /> Special Offers
                                    </h3>
                                    {deals.map((deal: any) => (
                                        <div key={deal.id} className="bg-orange-50 border border-orange-100 rounded-xl p-4 space-y-1">
                                            {deal.discount_text && (
                                                <span className="inline-block px-3 py-1 bg-[#FF6600] text-white font-black rounded-full mb-1" style={{ fontSize: '16px' }}>{deal.discount_text}</span>
                                            )}
                                            <p className="font-black text-zinc-900" style={{ fontSize: '16px' }}>{deal.title}</p>
                                            {deal.description && (
                                                <p className="text-zinc-600 font-medium" style={{ fontSize: '16px', lineHeight: 1.5 }}>{deal.description}</p>
                                            )}
                                            {deal.expires_at && (
                                                <p className="text-zinc-500 font-bold" style={{ fontSize: '16px' }}>Expires {new Date(deal.expires_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            <BusinessDelistDialog businessId={business.id} businessName={business.business_name} />
                        </div>

                        {/* ── MAIN CONTENT ── */}
                        <div className="space-y-6 min-w-0">

                            {/* Pay Only When You Win Banner */}
                            <div className="flex flex-wrap items-center gap-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-100 rounded-2xl px-5 py-3.5">
                                <div className="flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-green-600" />
                                    <span className="font-black text-zinc-800" style={{ fontSize: '14px' }}>No lead fees</span>
                                </div>
                                <div className="w-1 h-1 bg-zinc-300 rounded-full" />
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                                    <span className="font-black text-zinc-800" style={{ fontSize: '14px' }}>Pay only when you win</span>
                                </div>
                                <div className="w-1 h-1 bg-zinc-300 rounded-full" />
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-orange-600" />
                                    <span className="font-black text-zinc-800" style={{ fontSize: '14px' }}>ABN verified</span>
                                </div>
                            </div>

                            {/* Scroll nav buttons */}
                            <ScrollNavButtons
                                hasServices={!!(business.services?.length > 0 || business.specialties?.length > 0)}
                                hasGallery={!!(business.photo_urls?.length > 0)}
                                hasReviews={googleReviews.length > 0}
                            />

                            {/* About */}
                            <section id="about" className="bg-white rounded-2xl border border-zinc-200 p-7 shadow-sm scroll-mt-24">
                                <h2 className="font-black text-zinc-400 uppercase tracking-[0.2em] mb-5 flex items-center gap-3" style={{ fontSize: '16px' }}>
                                    <div className="w-6 h-px bg-zinc-200" /> About the Business
                                </h2>
                                <EditableText
                                    field="description"
                                    initialValue={business.description}
                                    fallback={aboutFallback}
                                    as="p"
                                    multiline
                                    rows={6}
                                    className="text-zinc-700 font-medium"
                                    style={{ fontSize: '18px', lineHeight: 1.7 }}
                                />
                                {allFeatures.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-5">
                                        {allFeatures.map((feature: string) => (
                                            <div key={feature} className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg font-black text-zinc-700 flex items-center gap-2 hover:border-orange-200 transition-all" style={{ fontSize: '16px' }}>
                                                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full shrink-0" />
                                                {feature}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* Services & Expertise */}
                            <EditableConditionalSection showWhenPublic={!!(business.services?.length > 0 || business.specialties?.length > 0)}>
                                <section id="services" className="bg-white rounded-2xl border border-zinc-200 p-7 shadow-sm scroll-mt-24">
                                    <h2 className="font-black text-zinc-400 uppercase tracking-[0.2em] mb-5 flex items-center gap-3" style={{ fontSize: '16px' }}>
                                        <div className="w-6 h-px bg-zinc-200" /> Expertise &amp; Services
                                    </h2>
                                    <EditableServices initialServices={business.services || []} initialSpecialties={business.specialties || []} />
                                </section>
                            </EditableConditionalSection>

                            {/* Project Gallery */}
                            <EditableConditionalSection showWhenPublic={!!(business.photo_urls?.length > 0)}>
                                <section id="gallery" className="bg-white rounded-2xl border border-zinc-200 p-7 shadow-sm scroll-mt-24">
                                    <h2 className="font-black text-zinc-400 uppercase tracking-[0.2em] mb-5 flex items-center justify-between" style={{ fontSize: '16px' }}>
                                        <span className="flex items-center gap-3"><div className="w-6 h-px bg-zinc-200" /> Project Gallery</span>
                                        <span className="font-bold text-zinc-300 normal-case tracking-normal" style={{ fontSize: '16px' }}>{business.trade_category}</span>
                                    </h2>
                                    <EditableGallery initialImages={business.photo_urls || []} businessName={business.business_name} />
                                </section>
                            </EditableConditionalSection>

                            {/* Trust & Reliability */}
                            <section className="bg-white rounded-2xl border border-zinc-200 p-7 shadow-sm">
                                <h2 className="font-black text-zinc-400 uppercase tracking-[0.2em] mb-5 flex items-center gap-3" style={{ fontSize: '16px' }}>
                                    <div className="w-6 h-px bg-zinc-200" /> Trust &amp; Reliability
                                </h2>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-5 bg-zinc-50 rounded-xl border border-zinc-100">
                                        <p className="text-3xl font-black text-zinc-900">{trustScore}</p>
                                        <p className="font-black text-zinc-400 uppercase tracking-widest mt-1" style={{ fontSize: '16px' }}>TradeRefer Score</p>
                                    </div>
                                    <div className="text-center p-5 bg-zinc-50 rounded-xl border border-zinc-100 flex flex-col items-center justify-center">
                                        <div className="flex items-center text-orange-400 mb-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`w-4 h-4 ${i < Math.floor(googleRating || 5) ? 'fill-current' : 'opacity-30'}`} />
                                            ))}
                                        </div>
                                        <p className="font-black text-zinc-400 uppercase tracking-widest" style={{ fontSize: '16px' }}>Google</p>
                                        <p className="text-zinc-400 mt-0.5" style={{ fontSize: '16px' }}>{reviewCount} reviews</p>
                                    </div>
                                    <div className="text-center p-5 bg-zinc-50 rounded-xl border border-zinc-100">
                                        <p className="text-3xl font-black text-zinc-900">{jobsCompleted}</p>
                                        <p className="font-black text-zinc-400 uppercase tracking-widest mt-1" style={{ fontSize: '16px' }}>Connections</p>
                                    </div>
                                </div>
                            </section>

                            {/* Google Reviews */}
                            {googleReviews.length > 0 && (
                                <section id="reviews" className="bg-white rounded-2xl border border-zinc-200 p-7 shadow-sm scroll-mt-24">
                                    <h2 className="font-black text-zinc-400 uppercase tracking-[0.2em] mb-5 flex items-center justify-between" style={{ fontSize: '16px' }}>
                                        <span className="flex items-center gap-3"><div className="w-6 h-px bg-zinc-200" /> Google Reviews</span>
                                        <span className="flex items-center gap-1.5 text-[#FF6600]">
                                            <Star className="w-4 h-4 fill-orange-400 text-orange-400" />
                                            <span className="text-zinc-900 font-black" style={{ fontSize: '16px' }}>{googleRating}</span>
                                            <span className="text-zinc-400" style={{ fontSize: '16px' }}>({reviewCount})</span>
                                        </span>
                                    </h2>
                                    <div className="space-y-4">
                                        {googleReviews.map((review: any) => (
                                            <div key={review.id} className="p-5 bg-zinc-50 rounded-xl border border-zinc-100 hover:border-orange-100 hover:bg-white hover:shadow-sm transition-all">
                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-[#FF6600] flex items-center justify-center text-white font-black shrink-0" style={{ fontSize: '18px' }}>
                                                            {(review.profile_name || 'A')[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-zinc-900 leading-none" style={{ fontSize: '16px' }}>{review.profile_name || 'Google Reviewer'}</p>
                                                            <p className="text-zinc-400 font-medium mt-0.5" style={{ fontSize: '16px' }}>Google Review</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-0.5 shrink-0">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} className={`w-3.5 h-3.5 ${i < (review.rating || 5) ? 'fill-orange-400 text-orange-400' : 'text-zinc-200 fill-zinc-200'}`} />
                                                        ))}
                                                    </div>
                                                </div>
                                                {review.review_text && (
                                                    <p className="text-zinc-600" style={{ fontSize: '16px', lineHeight: 1.6 }}>&ldquo;{review.review_text}&rdquo;</p>
                                                )}
                                                {review.owner_answer && (
                                                    <div className="mt-3 pl-4 border-l-2 border-orange-200">
                                                        <p className="font-black text-[#FF6600] uppercase tracking-widest mb-1" style={{ fontSize: '16px' }}>Owner Response</p>
                                                        <p className="text-zinc-600" style={{ fontSize: '16px', lineHeight: 1.6 }}>{review.owner_answer}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Trade FAQs */}
                            {TRADE_FAQ_BANK[business.trade_category]?.length > 0 && (
                                <section className="bg-white rounded-2xl border border-zinc-200 p-7 shadow-sm">
                                    <h2 className="font-black text-zinc-400 uppercase tracking-[0.2em] mb-5 flex items-center gap-3" style={{ fontSize: '16px' }}>
                                        <div className="w-6 h-px bg-zinc-200" /> Frequently Asked Questions
                                    </h2>
                                    <div className="space-y-4">
                                        {TRADE_FAQ_BANK[business.trade_category].slice(0, 5).map((faq: { q: string; a: string }, i: number) => (
                                            <details key={i} className="group rounded-xl border border-zinc-100 bg-zinc-50 hover:bg-white hover:border-zinc-200 transition-all">
                                                <summary className="flex items-start gap-3 p-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                                                    <HelpCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                                                    <span className="font-black text-zinc-900 flex-1" style={{ fontSize: '16px' }}>{faq.q}</span>
                                                    <ChevronRight className="w-5 h-5 text-zinc-400 shrink-0 transition-transform group-open:rotate-90" />
                                                </summary>
                                                <div className="px-5 pb-5 pl-13">
                                                    <p className="text-zinc-600 font-medium" style={{ fontSize: '16px', lineHeight: 1.7 }}>{faq.a}</p>
                                                </div>
                                            </details>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Enquiry Form */}
                            <div id="enquiry-form" className="bg-white rounded-2xl border border-zinc-200 p-7 shadow-sm scroll-mt-24">
                                <h3 className="font-black text-zinc-900 mb-1" style={{ fontSize: '24px' }}>Get a Free Quote</h3>
                                <p className="text-zinc-500 mb-6 italic" style={{ fontSize: '16px' }}>Expect a response within 24 hours.</p>
                                <LeadForm businessName={business.business_name} businessId={business.id} referralCode={referralCode} />
                            </div>

                            {/* Refer & Earn */}
                            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-7 relative overflow-hidden">
                                <Zap className="absolute -bottom-8 -right-8 w-36 h-36 text-orange-300/30 rotate-12" />
                                <div className="relative z-10">
                                    <h3 className="font-black text-zinc-900 mb-2" style={{ fontSize: '24px' }}>Refer &amp; Earn</h3>
                                    <p className="text-zinc-700 mb-5" style={{ fontSize: '18px', lineHeight: 1.6 }}>Know someone who needs {business.trade_category} services? Refer {business.business_name} and earn a reward when the job closes.</p>
                                    <div className="mb-5">
                                        <EditableFee
                                            initialValue={business.referral_fee_cents || 1000}
                                            helperText="This reward updates live behind the modal so you can tune the offer with full context."
                                        />
                                    </div>
                                    <Link href={`/b/${slug}/refer`} className="w-full bg-[#FF6600] hover:bg-[#E65C00] text-white rounded-xl font-black border-none shadow-md shadow-orange-200 flex items-center justify-center gap-2" style={{ minHeight: '64px', fontSize: '18px' }}>Get Referral Link <Share2 className="w-5 h-5" /></Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </EditableProfile>
    );
}


