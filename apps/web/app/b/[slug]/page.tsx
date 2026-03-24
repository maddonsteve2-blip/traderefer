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
    CheckCircle2,
    UserPlus,
    CheckCircle,
    ImageIcon,
    MessageSquareQuote,
    Sparkles,
    Users,
    ThumbsUp,
    HeartHandshake,
    Search,
    Camera,
    Hammer,
    Wrench,
    Brush,
    Droplets,
    Trees,
    HomeIcon,
    Building2,
    Sun,
    PenTool,
    PartyPopper,
    ScissorsSquare,
    Waves,
    Lock,
    Layers3,
    HardHat,
    Pickaxe,
    CalendarDays,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BusinessLogo } from "@/components/BusinessLogo";
import { proxyLogoUrl } from "@/lib/logo";
import { JOB_TYPES, TRADE_FAQ_BANK } from "@/lib/constants";
import { getPostcode } from "@/lib/postcodes";

const LeadForm = dynamic(() => import("@/components/LeadForm").then((mod) => mod.LeadForm), {
    loading: () => <div className="min-h-[480px] rounded-2xl bg-zinc-50 border border-zinc-100 animate-pulse" />,
});

const ReviewSection = dynamic(() => import("@/components/ReviewSection").then((mod) => mod.ReviewSection), {
    loading: () => <div className="min-h-[320px] rounded-2xl bg-white border border-zinc-200 animate-pulse" />,
});

const BusinessDelistDialog = dynamic(() => import("@/components/BusinessDelistDialog").then((mod) => mod.BusinessDelistDialog));

const ScrollNavButtons = dynamic(() => import("@/components/ScrollNavButtons").then((mod) => mod.ScrollNavButtons), {
    loading: () => <div className="h-10" />,
});

const EnrichTrigger = dynamic(() => import("@/components/EnrichTrigger").then((mod) => mod.EnrichTrigger));

export const revalidate = 3600; // Cache for 1 hour, ISR revalidation

function toTitleCase(value: string) {
    return value
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

function uniqueNonEmpty(values: Array<string | null | undefined>) {
    return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)));
}

function getLocationLabel(business: any) {
    return uniqueNonEmpty([business.suburb, business.city, business.state]).join(", ");
}

function getSlugSuffix(slug: string) {
    const slugParts = String(slug || "").toLowerCase().split("-").filter(Boolean);
    const lastPart = slugParts[slugParts.length - 1] || "";
    return /^[a-z0-9]{5}$/i.test(lastPart) ? lastPart : "";
}

function cleanBusinessName(value: string, slug: string) {
    const slugSuffix = getSlugSuffix(slug);
    const words = String(value || "").trim().split(/\s+/).filter(Boolean);
    const lastWord = words[words.length - 1] || "";
    const normalizedLastWord = lastWord.toLowerCase().replace(/[^a-z0-9]/g, "");
    const looksLikeHash = /^[a-z0-9]{5}$/i.test(normalizedLastWord) && (/\d/i.test(normalizedLastWord) || !/[aeiou]/i.test(normalizedLastWord));

    if ((slugSuffix && normalizedLastWord === slugSuffix) || looksLikeHash) {
        words.pop();
    }

    return words.join(" ").replace(/\s+/g, " ").trim();
}

function getPrimaryLocation(business: any) {
    return String(business.city || business.suburb || business.state || "your area").trim();
}

function getSecondaryLocation(business: any) {
    const suburb = String(business.suburb || "").trim();
    const city = String(business.city || "").trim();
    return suburb && suburb.toLowerCase() !== city.toLowerCase() ? suburb : "";
}

function getReviewLabel(reviewCount: number) {
    return reviewCount === 1 ? "Review" : "Reviews";
}

function deriveServiceLabel(business: any, slug: string) {
    const locationTokens = uniqueNonEmpty([business.suburb, business.city, business.state])
        .flatMap((part) => part.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
    const slugParts = slug.toLowerCase().split("-").filter(Boolean);
    const trimmedSlugParts = getSlugSuffix(slug)
        ? slugParts.slice(0, -1)
        : slugParts;
    const serviceTokens = trimmedSlugParts.filter((part) => !locationTokens.includes(part));
    const slugService = toTitleCase(serviceTokens.join(" ").trim());
    const businessName = cleanBusinessName(String(business.business_name || "").trim(), slug);
    const tradeCategory = String(business.trade_category || "Tradie").trim();

    if (slugService.length >= 5) return slugService;

    const businessNameTokens = businessName
        .split(/[^a-z0-9]+/i)
        .filter(Boolean)
        .map((token) => token.toLowerCase());
    const tradeTokens = tradeCategory
        .split(/[^a-z0-9]+/i)
        .filter(Boolean)
        .map((token) => token.toLowerCase());
    const filteredBusinessName = businessName
        .split(/\s+/)
        .filter((token) => {
            const normalized = token.toLowerCase().replace(/[^a-z0-9]/g, "");
            return normalized && !locationTokens.includes(normalized);
        })
        .join(" ")
        .trim();

    const businessNameLooksLikeService = businessNameTokens.some((token) => tradeTokens.includes(token));
    if (businessNameLooksLikeService && filteredBusinessName.length >= 5) return filteredBusinessName;

    return tradeCategory;
}

function deriveServiceHighlights(business: any) {
    const explicitServices = Array.isArray(business.services) ? business.services.filter(Boolean) : [];
    if (explicitServices.length > 0) return explicitServices.slice(0, 3);

    const jobTypes = JOB_TYPES[String(business.trade_category || "")] || [];
    return jobTypes.slice(0, 3).map((job) => toTitleCase(job));
}

function buildSeoContent(business: any, slug: string, hasRating: boolean, rating: number, reviewCount: number) {
    const locationLabel = getLocationLabel(business) || "your area";
    const suburb = String(business.suburb || business.city || locationLabel || "your area").trim();
    const primaryLocation = getPrimaryLocation(business);
    const secondaryLocation = getSecondaryLocation(business);
    const localArea = uniqueNonEmpty([secondaryLocation || suburb, primaryLocation]).join(", ") || locationLabel;
    const serviceLabel = deriveServiceLabel(business, slug);
    const tradeCategory = String(business.trade_category || "Tradie").trim();
    const serviceHighlights = deriveServiceHighlights(business);
    const serviceList = serviceHighlights.length > 0 ? serviceHighlights.join(", ") : tradeCategory.toLowerCase();
    const reviewLabel = getReviewLabel(reviewCount);
    const ratingSentence = hasRating ? ` With a ${rating.toFixed(1)} star rating from ${reviewCount} ${reviewLabel.toLowerCase()},` : "";
    const yearsExperience = Number(business.years_experience || 0);
    const rawName = String(business.business_name || "").trim();
    const cleanName = cleanBusinessName(rawName, slug) || rawName;
    const titleLocation = `${cleanName} ${primaryLocation}${secondaryLocation ? ` — ${secondaryLocation}` : ""}`.trim();
    const titleProof = hasRating ? `${reviewCount} ${reviewLabel}, ${rating.toFixed(1)}★` : tradeCategory;
    const title = `${titleLocation} | ${titleProof} | TradeRefer`;
    const description = [
        `${cleanName} offers ${tradeCategory.toLowerCase()} services in ${localArea}.`,
        yearsExperience > 0 ? `${yearsExperience} years experience.` : "",
        hasRating ? `${reviewCount} verified ${reviewLabel.toLowerCase()} (${rating.toFixed(1)}★).` : "",
        `See photos, read reviews and request a free quote on TradeRefer.`,
        business.is_verified ? "ABN verified." : "",
    ].filter(Boolean).join(" ");
    const heading = `${cleanName} in ${suburb}`;
    const intro = `Looking for ${serviceLabel.toLowerCase()} in ${suburb}? ${cleanName} helps customers in ${locationLabel} compare options, review completed work, and request free quotes for ${serviceList.toLowerCase()}.`;
    const aboutFallback = `${cleanName} is a local ${tradeCategory.toLowerCase()} business serving ${locationLabel}.${ratingSentence} TradeRefer visitors can compare their services, see project examples, and request a free quote for jobs such as ${serviceList.toLowerCase()}.`;

    return {
        title,
        description,
        heading,
        intro,
        aboutFallback,
    };
}

async function getBusiness(slug: string) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const res = await fetch(`${apiUrl}/businesses/${slug}`, {
        next: { revalidate: 60 }
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

function formatPublicValue(value: unknown) {
    return String(value || "").trim();
}

function buildBusinessProfilePath(slug: string, referralCode?: string) {
    const query = referralCode ? `?ref=${encodeURIComponent(referralCode)}` : "";
    return `/b/${slug}${query}`;
}

function formatCurrencyFromCents(cents: number) {
    return new Intl.NumberFormat("en-AU", {
        style: "currency",
        currency: "AUD",
        maximumFractionDigits: 0,
    }).format(Math.max(0, Number(cents || 0)) / 100);
}

function PublicContactField({
    icon,
    label,
    value,
    href,
}: {
    icon: ReactNode;
    label: string;
    value?: string | null;
    href?: string | null;
}) {
    const displayValue = formatPublicValue(value);
    if (!displayValue) return null;

    return (
        <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-center text-zinc-400 shrink-0">
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest leading-none mb-0.5">{label}</p>
                {href ? (
                    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noopener noreferrer" : undefined} className="font-bold text-zinc-700 break-words hover:text-orange-600" style={{ fontSize: '16px' }}>
                        {displayValue}
                    </a>
                ) : (
                    <p className="font-bold text-zinc-700 break-words" style={{ fontSize: '16px' }}>{displayValue}</p>
                )}
            </div>
        </div>
    );
}

function PublicServices({ services = [], specialties = [] as string[] }: { services?: string[]; specialties?: string[] }) {
    const items = Array.from(new Set([...(services || []), ...(specialties || [])].map((item) => String(item || "").trim()).filter(Boolean)));
    if (items.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2">
            {items.map((item) => (
                <div key={item} className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg font-black text-zinc-700 flex items-center gap-2" style={{ fontSize: '16px' }}>
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full shrink-0" />
                    {item}
                </div>
            ))}
        </div>
    );
}

function PublicGallery({ images = [], businessName }: { images?: string[]; businessName: string }) {
    const validImages = (images || []).map((image) => String(image || "").trim()).filter(Boolean);
    if (validImages.length === 0) return null;

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {validImages.map((image, index) => (
                <div key={`${image}-${index}`} className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 aspect-[4/3]">
                    <img src={image} alt={`${businessName} project ${index + 1}`} className="w-full h-full object-cover" loading="lazy" />
                </div>
            ))}
        </div>
    );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const business = await getBusiness(slug);
    if (!business) return { title: 'Business Not Found | TradeRefer' };

    const canonicalSlug = String(business.slug || slug).trim() || slug;
    const rating = parseFloat(String(business.avg_rating));
    const reviewCount = parseInt(String(business.total_reviews), 10);
    const hasRating = !isNaN(rating) && rating > 0 && reviewCount > 0;
    const { title, description } = buildSeoContent(business, canonicalSlug, hasRating, rating, reviewCount);
    const url = `https://traderefer.au/b/${canonicalSlug}`;
    const imageUrl = business.logo_url || business.cover_photo_url || (Array.isArray(business.photo_urls) ? business.photo_urls[0] : null) || null;

    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: {
            title,
            description,
            url,
            type: 'website',
            siteName: 'TradeRefer',
            ...(imageUrl ? { images: [{ url: imageUrl, width: 1200, height: 630, alt: business.business_name }] } : {}),
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            ...(imageUrl ? { images: [imageUrl] } : {}),
        },
    };
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
    const userId = null; // Public page - no auth on this route
    const business = await getBusiness(slug);

    if (!business) {
        notFound();
    }

    const canonicalSlug = String(business.slug || slug).trim() || slug;
    if (canonicalSlug !== slug) {
        redirect(buildBusinessProfilePath(canonicalSlug, referralCode));
    }

    const [projects, googleReviews, deals] = await Promise.all([
        getProjects(canonicalSlug),
        getGoogleReviews(canonicalSlug),
        getDeals(canonicalSlug),
    ]);

    // Enrich this business with Google Places photos if needed (client-side trigger)
    const photoCount = Array.isArray(business.photo_urls) ? business.photo_urls.length : 0;
    const needsEnrich = photoCount < 3 && !business.enriched_at ? [{
        id: business.id, business_name: business.business_name,
        suburb: business.suburb, state: business.state, slug: canonicalSlug,
    }] : [];

    const safeProjects = Array.isArray(projects) ? projects : [];
    const featuredProject = safeProjects.find((p: any) => p.is_featured);
    const otherProjects = safeProjects.filter((p: any) => p !== featuredProject);

    // Hide claim banners if the authenticated user owns this business
    const isOwner = !!(userId && business.clerk_user_id && userId === business.clerk_user_id);

    // Compute derived stats
    const memberSinceYear = business.created_at ? new Date(business.created_at).getFullYear() : null;
    const jobsCompleted = business.total_leads_unlocked || 0;

    const allFeatures = business.features?.length > 0 ? business.features
        : business.business_highlights?.length > 0 ? business.business_highlights
            : [];
    const hasYearsExperience = !!(business.years_experience && String(business.years_experience).trim() && Number(business.years_experience) > 0);
    const hasServices = !!(business.services?.length > 0 || business.specialties?.length > 0);
    const hasGallery = !!(business.photo_urls?.length > 0);

    const trustScore = business.trust_score ? (business.trust_score / 20).toFixed(1) : "5.0";
    const googleRating = business.avg_rating || null;
    const reviewCount = business.total_reviews || 0;

    // Schema Markup
    const parsedRating = parseFloat(String(googleRating));
    const parsedReviewCount = parseInt(String(reviewCount), 10);
    const hasValidRating = !isNaN(parsedRating) && parsedRating > 0 && parsedReviewCount > 0;
    const seoContent = buildSeoContent(business, canonicalSlug, hasValidRating, parsedRating, parsedReviewCount);

    const ratingQualifier = (hasValidRating && parsedRating >= 4.0) ? "highly-rated" : "local";
    const cityContext = (business.city && business.city.toLowerCase() !== (business.suburb || '').toLowerCase())
        ? `the wider ${business.city} region`
        : 'the local area';
    const aboutFallback = business.description || `${seoContent.aboutFallback} ${business.business_name} is a ${ratingQualifier} ${business.trade_category} specialist serving ${business.suburb} and ${cityContext}.${hasValidRating ? ` With a ${parsedRating.toFixed(1)} star rating from ${parsedReviewCount} local reviews,` : ''} They are recognized for their reliability, quality craftsmanship, and exceptional customer service.`;

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
        "description": aboutFallback,
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
        <>
        {needsEnrich.length > 0 && <EnrichTrigger businesses={needsEnrich} />}
            <main className="min-h-screen bg-zinc-50">
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
                {faqJsonLd && (
                    <script
                        type="application/ld+json"
                        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
                    />
                )}

                {/* ── BREADCRUMBS ── */}
                <div className="bg-white border-b border-zinc-100 pt-20 md:pt-28 pb-3">
                    <div className="container mx-auto px-4">
                        <nav className="flex items-center gap-1.5 text-sm text-zinc-500">
                            <Link href="/" className="hover:text-zinc-800 transition-colors">Home</Link>
                            <ChevronRight className="w-3.5 h-3.5 text-zinc-300" />
                            {business.state && business.suburb && business.trade_category ? (
                                <Link
                                    href={`/local/${business.state.toLowerCase()}/${business.suburb.toLowerCase().replace(/\s+/g, '-')}/${business.suburb.toLowerCase().replace(/\s+/g, '-')}/${business.trade_category.toLowerCase().replace(/\s+/g, '-')}`}
                                    className="hover:text-zinc-800 transition-colors"
                                >
                                    {business.trade_category} in {business.suburb}
                                </Link>
                            ) : (
                                <Link href="/businesses" className="hover:text-zinc-800 transition-colors">Directory</Link>
                            )}
                            <ChevronRight className="w-3.5 h-3.5 text-zinc-300" />
                            <span className="text-zinc-900 font-semibold">{business.business_name}</span>
                        </nav>
                    </div>
                </div>

                {/* ── HERO ── */}
                <div className="bg-white py-5 border-b border-zinc-100">
                    <div className="container mx-auto px-4">
                        <h1 className="text-3xl font-black text-zinc-900 leading-tight">{seoContent.heading}</h1>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            {business.trade_category && (
                                <span className="px-3 py-1 bg-zinc-100 text-zinc-600 rounded-full text-sm font-semibold border border-zinc-200">{business.trade_category}</span>
                            )}
                            {business.is_verified && (
                                <span className="flex items-center gap-1.5 px-3 py-1 bg-orange-500 text-white rounded-full text-sm font-semibold">
                                    <ShieldCheck className="w-3 h-3" /> Verified
                                </span>
                            )}
                            {hasValidRating && (
                                <div className="flex items-center gap-1.5">
                                    <div className="flex items-center gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(parsedRating) ? 'fill-orange-400 text-orange-400' : 'fill-zinc-200 text-zinc-200'}`} />
                                        ))}
                                    </div>
                                    <span className="text-sm font-bold text-zinc-700">{parsedRating.toFixed(1)} <span className="font-medium text-zinc-400">({parsedReviewCount})</span></span>
                                </div>
                            )}
                            {business.suburb && (
                                <span className="flex items-center gap-1 text-sm text-zinc-500 font-medium">
                                    <MapPin className="w-3.5 h-3.5 text-orange-500" /> {business.suburb}{business.state ? `, ${business.state}` : ''}
                                </span>
                            )}
                        </div>
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
                                            <img
                                                src={business.cover_photo_url}
                                                alt={`${business.business_name} cover`}
                                                className="w-full h-full object-cover"
                                                loading="eager"
                                                fetchPriority="high"
                                                decoding="async"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-gradient-to-br from-orange-100 via-amber-50 to-zinc-100" />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
                                        {/* Claim CTA overlay for unclaimed businesses with no cover photo */}
                                        {business.is_claimed === false && !isOwner && !business.cover_photo_url && (
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
                                        <BusinessLogo
                                            logoUrl={business.logo_url}
                                            name={business.business_name}
                                            photoUrls={business.photo_urls}
                                            size="sm"
                                            bgColor={business.logo_bg_color}
                                            imageLoading="eager"
                                            fetchPriority="high"
                                            skipAnalysis={true}
                                        />
                                    </div>
                                </div>

                                {/* Business info */}
                                <div className="pt-10 px-5 pb-5 space-y-3">
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-3 py-1.5 bg-zinc-100 text-zinc-600 rounded-full font-black uppercase tracking-widest border border-zinc-200 inline-flex" style={{ fontSize: '16px' }}>
                                            {business.trade_category}
                                        </span>
                                        {business.is_verified && (
                                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF6600] text-white rounded-full font-black uppercase tracking-widest" style={{ fontSize: '16px' }}>
                                                <ShieldCheck className="w-3.5 h-3.5" /> Verified
                                            </span>
                                        )}
                                    </div>

                                    <h2 className="text-xl font-black text-zinc-900 leading-tight">{business.business_name}</h2>

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
                                        <div className="flex items-center min-w-0">
                                            <span className="font-bold text-zinc-600" style={{ fontSize: '16px' }}>{business.suburb}</span>
                                            {business.state && <span>,&nbsp;</span>}
                                            <span className="font-bold text-zinc-600" style={{ fontSize: '16px' }}>{business.state}</span>
                                        </div>
                                    </div>

                                    {memberSinceYear && (
                                        <div className="flex items-center gap-2 font-medium text-zinc-500" style={{ fontSize: '16px' }}>
                                            <Clock className="w-4 h-4 shrink-0" />
                                            Member since {memberSinceYear}
                                        </div>
                                    )}

                                    {hasYearsExperience && (
                                        <div className="flex items-center gap-2 font-medium text-zinc-500" style={{ fontSize: '16px' }}>
                                            <Award className="w-4 h-4 text-[#FF6600] shrink-0" />
                                            <span className="font-medium text-zinc-500" style={{ fontSize: '16px' }}>{business.years_experience}</span>
                                            <span>experience</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* CTA Buttons */}
                            <div className="space-y-2">
                                {business.is_claimed === false && !isOwner && (
                                    <Link data-claim-banner href={`/claim/${slug}`} className="w-full bg-[#FF6600] hover:bg-[#E65C00] text-white rounded-xl font-black border-none shadow-md shadow-orange-200 transition-all active:scale-95 flex items-center justify-center mb-2" style={{ minHeight: '64px', fontSize: '18px' }}>Claim This Business</Link>
                                )}
                                <Link href="#enquiry-form" className="w-full bg-[#FF6600] hover:bg-[#E65C00] text-white rounded-xl font-black border-none shadow-md shadow-orange-200 transition-all active:scale-95 flex items-center justify-center" style={{ minHeight: '64px', fontSize: '18px' }}>Get a Free Quote</Link>
                                <Link href={`/dashboard/referrer/refer/${slug}`} className="w-full bg-white border-2 border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-xl font-black shadow-sm flex items-center justify-center gap-2" style={{ minHeight: '64px', fontSize: '16px' }}>Refer &amp; Earn <ArrowRight className="w-4 h-4" /></Link>
                            </div>

                            {/* Contact details */}
                            <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-4">
                                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest pb-2 mb-1 border-b border-zinc-100">Contact &amp; Location</h3>
                                <PublicContactField label="Phone" value={business.business_phone} href={business.business_phone ? `tel:${business.business_phone}` : null} icon={<Phone className="w-4 h-4" />} />
                                {!!business.address && (
                                    <div className="flex items-start gap-3">
                                        <div className="w-9 h-9 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-center text-zinc-400 shrink-0">
                                            <MapPin className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest leading-none mb-0.5">Address</p>
                                            <p className="font-bold text-zinc-700 leading-snug whitespace-pre-line" style={{ fontSize: '16px' }}>{business.address}</p>
                                        </div>
                                    </div>
                                )}
                                <PublicContactField label="Website" value={business.website} href={business.website} icon={<Globe className="w-4 h-4" />} />
                                <PublicContactField label="Email" value={business.business_email} href={business.business_email ? `mailto:${business.business_email}` : null} icon={<Mail className="w-4 h-4" />} />
                                <PublicContactField label="ABN" value={business.abn} icon={<Briefcase className="w-4 h-4" />} />
                            </div>

                            {/* Licence Number */}
                            {business.licence_number && (
                                <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-3">
                                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest pb-2 mb-1 border-b border-zinc-100 flex items-center gap-2">
                                        <BadgeCheck className="w-4 h-4 text-orange-500" /> Licences
                                    </h3>
                                    <div className="flex items-start gap-3">
                                        <div className="w-9 h-9 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-center text-orange-500 shrink-0">
                                            <BadgeCheck className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest leading-none mb-0.5">Trade Licence</p>
                                            <p className="font-bold text-zinc-700" style={{ fontSize: '16px' }}>{business.licence_number}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Ways to Pay */}
                            {business.payment_methods?.length > 0 && (
                                <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-3">
                                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest pb-2 mb-1 border-b border-zinc-100 flex items-center gap-2">
                                        <CreditCard className="w-4 h-4 text-orange-500" /> Ways to Pay
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
                                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest pb-2 mb-1 border-b border-zinc-100">Follow Us</h3>
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
                                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest px-5 pt-5 pb-2">Location</h3>
                                    <iframe
                                        title={`${business.business_name} location`}
                                        width="100%"
                                        height="200"
                                        style={{ border: 0 }}
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                        src={`https://maps.google.com/maps?q=${encodeURIComponent((business.address ? business.address + ', ' : '') + (business.suburb || '') + (business.state ? ', ' + business.state : '') + ', Australia')}&output=embed`}
                                    />
                                </div>
                            )}

                            {/* Claim banner (sidebar) — hidden for owners via data-claim-banner */}
                            {business.is_claimed === false && !isOwner && (
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
                                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest pb-2 mb-1 border-b border-zinc-100 flex items-center gap-2">
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
                            <div className="flex flex-wrap items-center gap-4 bg-orange-50 border border-orange-200 rounded-2xl px-5 py-3.5">
                                <div className="flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-orange-600" />
                                    <span className="font-semibold text-orange-800 text-sm">No lead fees</span>
                                </div>
                                <div className="w-1 h-1 bg-orange-300 rounded-full" />
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-orange-600" />
                                    <span className="font-semibold text-orange-800 text-sm">Pay only when you win</span>
                                </div>
                                {business.is_verified && (
                                    <>
                                        <div className="w-1 h-1 bg-orange-300 rounded-full" />
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-5 h-5 text-orange-600" />
                                            <span className="font-semibold text-orange-800 text-sm">ABN verified</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Scroll nav buttons */}
                            <ScrollNavButtons
                                hasServices={!!(business.services?.length > 0 || business.specialties?.length > 0)}
                                hasGallery={!!(business.photo_urls?.length > 0)}
                                hasReviews={googleReviews.length > 0}
                            />

                            {/* About */}
                            <section id="about" className="bg-white rounded-2xl border border-zinc-200 p-7 shadow-sm scroll-mt-24">
                                <h2 className="text-sm font-bold text-zinc-700 uppercase tracking-wider mb-5 pl-3 border-l-2 border-orange-500">
                                    About the Business
                                </h2>
                                <p className="text-zinc-700 font-medium whitespace-pre-line leading-relaxed mb-5" style={{ fontSize: '17px', lineHeight: 1.75 }}>
                                    {seoContent.intro}
                                </p>
                                <p className="text-zinc-700 font-medium whitespace-pre-line leading-relaxed" style={{ fontSize: '17px', lineHeight: 1.75 }}>
                                    {business.description || aboutFallback}
                                </p>
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
                            {hasServices && (
                                <section id="services" className="bg-white rounded-2xl border border-zinc-200 p-7 shadow-sm scroll-mt-24">
                                    <h2 className="text-sm font-bold text-zinc-700 uppercase tracking-wider mb-5 pl-3 border-l-2 border-orange-500">
                                        Expertise &amp; Services
                                    </h2>
                                    <PublicServices services={business.services || []} specialties={business.specialties || []} />
                                </section>
                            )}

                            {/* Project Gallery */}
                            {hasGallery && (
                                <section id="gallery" className="bg-white rounded-2xl border border-zinc-200 p-7 shadow-sm scroll-mt-24">
                                    <h2 className="text-sm font-bold text-zinc-700 uppercase tracking-wider mb-5 pl-3 border-l-2 border-orange-500 flex items-center justify-between">
                                        <span>Project Gallery</span>
                                        <span className="font-medium text-zinc-400 normal-case tracking-normal text-xs">{business.trade_category}</span>
                                    </h2>
                                    <PublicGallery images={business.photo_urls || []} businessName={business.business_name} />
                                </section>
                            )}

                            {/* Trust & Reliability */}
                            <section className="bg-white rounded-2xl border border-zinc-200 p-7 shadow-sm">
                                <h2 className="text-sm font-bold text-zinc-700 uppercase tracking-wider mb-5 pl-3 border-l-2 border-orange-500">
                                    Trust &amp; Reliability
                                </h2>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-5 bg-zinc-50 rounded-xl border border-zinc-100">
                                        <p className="text-3xl font-black text-zinc-900">{trustScore}</p>
                                        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mt-1">TradeRefer Score</p>
                                    </div>
                                    <div className="text-center p-5 bg-zinc-50 rounded-xl border border-zinc-100 flex flex-col items-center justify-center">
                                        <div className="flex items-center text-orange-400 mb-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`w-4 h-4 ${i < Math.floor(googleRating || 5) ? 'fill-current' : 'opacity-30'}`} />
                                            ))}
                                        </div>
                                        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mt-1">Rating</p>
                                        {reviewCount > 0 && <p className="text-zinc-400 mt-0.5 text-sm">{reviewCount} reviews</p>}
                                    </div>
                                    <div className="text-center p-5 bg-zinc-50 rounded-xl border border-zinc-100">
                                        <p className="text-3xl font-black text-zinc-900">{jobsCompleted}</p>
                                        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mt-1">Connections</p>
                                    </div>
                                </div>
                            </section>

                            {/* Reviews */}
                            {googleReviews.length > 0 && (
                                <ReviewSection
                                    reviews={googleReviews}
                                    avgRating={googleRating}
                                    totalReviews={reviewCount}
                                    businessName={business.business_name}
                                    businessSlug={slug}
                                />
                            )}

                            {/* Trade FAQs */}
                            {TRADE_FAQ_BANK[business.trade_category]?.length > 0 && (
                                <section className="bg-white rounded-2xl border border-zinc-200 p-7 shadow-sm">
                                    <h2 className="text-sm font-bold text-zinc-700 uppercase tracking-wider mb-3 pl-3 border-l-2 border-orange-500">
                                        Frequently Asked Questions
                                    </h2>
                                    <p className="text-xs text-zinc-400 mb-5">General {business.trade_category} questions for {business.suburb || 'your area'}</p>
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
                                        <div className="inline-flex items-center gap-3 rounded-2xl border border-orange-200 bg-white px-5 py-4 shadow-sm">
                                            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Referral reward</span>
                                            <span className="text-2xl font-black text-zinc-900">{formatCurrencyFromCents(business.referral_fee_cents || 1000)}</span>
                                        </div>
                                    </div>
                                    <Link href={`/b/${slug}/refer`} className="w-full bg-[#FF6600] hover:bg-[#E65C00] text-white rounded-xl font-black border-none shadow-md shadow-orange-200 flex items-center justify-center gap-2" style={{ minHeight: '64px', fontSize: '18px' }}>Apply to Refer <ArrowRight className="w-5 h-5" /></Link>
                                </div>
                            </div>

                            {/* Browse More — internal linking for SEO */}
                            {business.suburb && business.trade_category && (() => {
                                const stateSlug = (business.state || 'nsw').toLowerCase();
                                const suburbSlug = business.suburb.toLowerCase().replace(/\s+/g, '-');
                                const citySlug = (business.city || business.suburb).toLowerCase().replace(/\s+/g, '-');
                                const tradeSlug = business.trade_category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                                const postcode = getPostcode(suburbSlug, stateSlug);
                                const suburbWithPostcode = postcode ? `${suburbSlug}-${postcode}` : suburbSlug;
                                
                                return (
                                    <nav className="bg-zinc-50 rounded-2xl border border-zinc-100 p-6">
                                        <h3 className="font-bold text-zinc-500 text-xs uppercase tracking-widest mb-3">Browse More</h3>
                                        <div className="flex flex-wrap gap-2">
                                            <Link href={`/local/${stateSlug}/${citySlug}/${suburbWithPostcode}/${tradeSlug}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-sm font-bold text-zinc-600 hover:border-orange-400 hover:text-orange-600 transition-colors">
                                                <MapPin className="w-3 h-3" /> {business.trade_category} in {business.suburb}
                                            </Link>
                                            <Link href={`/local/${stateSlug}/${citySlug}/${suburbWithPostcode}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-sm font-bold text-zinc-600 hover:border-orange-400 hover:text-orange-600 transition-colors">
                                                <MapPin className="w-3 h-3" /> All Trades in {business.suburb}
                                            </Link>
                                            <Link href={`/local/${stateSlug}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-sm font-bold text-zinc-600 hover:border-orange-400 hover:text-orange-600 transition-colors">
                                                <MapPin className="w-3 h-3" /> {(business.state || 'NSW').toUpperCase()} Directory
                                            </Link>
                                        </div>
                                    </nav>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}


