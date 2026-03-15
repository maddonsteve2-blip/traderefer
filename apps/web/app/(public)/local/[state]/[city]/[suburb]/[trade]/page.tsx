import { sql } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { MapPin, Star, ShieldCheck, ChevronRight, CheckCircle2, Award, Users, ArrowRight, Shield, TrendingUp, Info, DollarSign, FileText, Wrench, ExternalLink, BadgeCheck, Clock, Phone, Search, Camera, Zap } from "lucide-react";
import Link from "next/link";
import { BusinessLogo } from "@/components/BusinessLogo";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { TRADE_COST_GUIDE, TRADE_FAQ_BANK, STATE_LICENSING, STATE_AUTHORITY_LINKS, SUBURB_CONTEXT, JOB_TYPES, jobToSlug, generateLocalizedIntro, normalizeTradeName } from "@/lib/constants";
import { parseSuburbSlug, getPostcode } from "@/lib/postcodes";
import { generateFallbackDescription } from "@/lib/business-utils";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ state: string; city: string; suburb: string; trade: string }>;
}

function formatSlug(slug: string) {
    if (!slug) return "";
    try { slug = decodeURIComponent(slug); } catch { /* already decoded */ }
    // Strip postcode suffix if present (e.g. "parramatta-2150" → "Parramatta")
    const { suburb: cleanSlug } = parseSuburbSlug(slug);
    return cleanSlug
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

// Extract Australian 4-digit postcode from a Google Places formatted address
// e.g. "123 Main St, Parramatta NSW 2150, Australia" → "2150"
function extractPostcode(address: string | null | undefined): string | null {
    if (!address) return null;
    const match = address.match(/\b([A-Z]{2,3})\s+(\d{4})\b/);
    return match ? match[2] : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { trade, suburb, city, state } = await params;
    const tradeName = formatSlug(trade);
    const suburbName = formatSlug(suburb);
    const cityName = formatSlug(city);
    const stateUpper = state.toUpperCase();
    const tradeKey = normalizeTradeName(tradeName);
    const cost = TRADE_COST_GUIDE[tradeKey] || TRADE_COST_GUIDE[tradeName];
    const priceStr = cost ? ` | $${cost.low}\u2013$${cost.high}${cost.unit}` : "";

    const businesses = await getBusinesses(trade, suburb);
    const count = businesses.length;
    const topBiz = businesses[0];
    const postcode = businesses.map((b: any) => extractPostcode(b.address)).find(Boolean) || null;
    const suburbWithPostcode = postcode ? `${suburbName} ${postcode}` : suburbName;
    const avgRating = count > 0
        ? (businesses.reduce((acc: number, biz: any) => acc + (parseFloat(biz.avg_rating) || 0), 0) / count).toFixed(1)
        : "4.8";
    const totalReviews = businesses.reduce((acc: number, biz: any) => acc + (parseInt(biz.total_reviews) || 0), 0);
    const topBizStr = topBiz && topBiz.avg_rating ? ` Top rated: ${topBiz.business_name} (${parseFloat(topBiz.avg_rating).toFixed(1)}\u2605).` : "";

    return {
        title: `${tradeName} in ${suburbWithPostcode}, ${cityName}${priceStr} | TradeRefer`,
        description: `Find ${count > 0 ? count : 'verified'} ${tradeName.toLowerCase()} in ${suburbWithPostcode}, ${cityName} ${stateUpper}.${topBizStr} ${totalReviews > 0 ? totalReviews + ' reviews.' : ''} Get free quotes from ABN-verified locals today.`,
        robots: count === 0 ? { index: false, follow: true } : { index: true, follow: true },
        openGraph: {
            title: `${tradeName} in ${suburbWithPostcode}, ${cityName} | TradeRefer`,
            description: `${count > 0 ? count : 'Verified'} local ${tradeName.toLowerCase()} in ${suburbWithPostcode}. Compare ratings, pricing and referrals.`,
        },
    };
}

async function getBusinesses(trade: string, suburb: string) {
    try {
        const tradeName = formatSlug(trade);
        const suburbName = formatSlug(suburb);

        const businesses = await sql`
            SELECT b.*, 
                   (SELECT COUNT(*) FROM referral_links rl WHERE rl.business_id = b.id) as trusted_count
            FROM businesses b 
            WHERE b.status = 'active' 
              AND (b.listing_visibility = 'public' OR b.listing_visibility IS NULL)
              AND (b.trade_category ILIKE ${'%' + tradeName + '%'} OR b.trade_category ILIKE ${'%' + trade + '%'})
              AND (b.suburb ILIKE ${'%' + suburbName + '%'} OR b.suburb ILIKE ${'%' + suburb + '%'})
            ORDER BY b.is_verified DESC, b.listing_rank DESC
            LIMIT 50
        `;
        return businesses;
    } catch (error) {
        console.error("Database error:", error);
        return [];
    }
}

async function getRelatedTrades(suburb: string, currentTrade: string) {
    const suburbName = formatSlug(suburb);
    const trades = await sql`
        SELECT DISTINCT trade_category 
        FROM businesses 
        WHERE suburb ILIKE ${'%' + suburbName + '%'} 
          AND trade_category != ${currentTrade}
          AND status = 'active'
        LIMIT 6
    `;
    return trades;
}

async function getNearbySuburbs(city: string, suburb: string, currentTrade: string) {
    const cityName = formatSlug(city);
    const suburbName = formatSlug(suburb);
    const suburbs = await sql`
        SELECT DISTINCT suburb 
        FROM businesses 
        WHERE city ILIKE ${'%' + cityName + '%'} 
          AND suburb != ${suburbName}
          AND trade_category ILIKE ${'%' + currentTrade + '%'}
          AND status = 'active'
        LIMIT 12
    `;
    return suburbs;
}

async function logEmptyPage(state: string, city: string, suburb: string, trade: string) {
    try {
        await sql`
            INSERT INTO fill_queue (state, city, suburb, trade)
            VALUES (${state.toLowerCase()}, ${city.toLowerCase()}, ${suburb.toLowerCase()}, ${trade.toLowerCase()})
            ON CONFLICT (state, suburb, trade) DO NOTHING
        `;
    } catch { /* never block rendering */ }
}

async function getCityReferralCount(city: string): Promise<number> {
    try {
        const cityName = formatSlug(city);
        const result = await sql`
            SELECT COUNT(*) as count FROM referral_links rl
            JOIN businesses b ON rl.business_id = b.id
            WHERE b.city ILIKE ${'%' + cityName + '%'}
              AND rl.created_at > NOW() - INTERVAL '30 days'
        `;
        return parseInt(result[0]?.count ?? '0', 10);
    } catch {
        return 0;
    }
}

export default async function TradeLocationPage({ params }: PageProps) {
    const { trade, suburb, city, state } = await params;
    const tradeName = formatSlug(trade);
    const suburbName = formatSlug(suburb);
    const cityName = formatSlug(city);
    const stateName = state.toUpperCase();

    // If URL has no postcode but we know it, 301 redirect to postcode URL
    const { postcode: urlPostcode, suburb: bareSuburb } = parseSuburbSlug(suburb);
    if (!urlPostcode) {
        const knownPostcode = getPostcode(bareSuburb, state);
        if (knownPostcode) {
            redirect(`/local/${state}/${city}/${bareSuburb}-${knownPostcode}/${trade}`);
        }
    }

    const [businesses, relatedTrades, nearbySuburbs, cityReferralCount] = await Promise.all([
        getBusinesses(trade, suburb),
        getRelatedTrades(suburb, tradeName),
        getNearbySuburbs(city, suburb, tradeName),
        getCityReferralCount(city),
    ]);

    if (businesses.length === 0) {
        logEmptyPage(state, city, suburb, trade); // fire-and-forget, never awaited
    }

    const avgRating = businesses.length > 0
        ? (businesses.reduce((acc: number, biz: any) => acc + (parseFloat(biz.avg_rating) || 0), 0) / businesses.length).toFixed(1)
        : null;
    const totalReviews = businesses.reduce((acc: number, biz: any) => acc + (parseInt(biz.total_reviews) || 0), 0);

    // Use postcode from URL first, then extract from business addresses, then lookup
    const postcode = urlPostcode || businesses.map((b: any) => extractPostcode(b.address)).find(Boolean) || getPostcode(bareSuburb, state);
    const suburbWithPostcode = postcode ? `${suburbName} ${postcode}` : suburbName;

    const tradeKey = normalizeTradeName(tradeName);
    const cost = TRADE_COST_GUIDE[tradeKey] || TRADE_COST_GUIDE[tradeName];
    const faqs = TRADE_FAQ_BANK[tradeKey] || TRADE_FAQ_BANK[tradeName] || [];
    const licenceText = STATE_LICENSING[tradeKey]?.[stateName] || STATE_LICENSING[tradeName]?.[stateName] || null;
    const relatedJobs = (JOB_TYPES[tradeKey] || JOB_TYPES[tradeName])?.slice(0, 6) || [];
    const localizedIntro = generateLocalizedIntro(tradeName, suburbName, cityName, stateName, businesses.length, avgRating || "0", totalReviews);

    const availabilityLabel = businesses.length >= 5 ? "High" : businesses.length >= 2 ? "Moderate" : "Limited";
    const availabilityColor = businesses.length >= 5 ? "text-green-600" : businesses.length >= 2 ? "text-yellow-600" : "text-red-500";
    const authorityLink = STATE_AUTHORITY_LINKS[stateName];
    const suburbCtxKey = suburbName.toLowerCase().replace(/\s+/g, "-");
    const suburbCtx = SUBURB_CONTEXT[suburbCtxKey];
    const tradeNote = suburbCtx?.tradeNotes?.[tradeKey] ?? suburbCtx?.tradeNotes?.[tradeName] ?? null;

    const breadcrumbs = [
        { name: stateName, href: `/local/${state}` },
        { name: cityName, href: `/local/${state}/${city}` },
        { name: suburbWithPostcode, href: `/local/${state}/${city}/${suburb}` },
        { name: tradeName, href: "#" }
    ];

    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://traderefer.au" },
            { "@type": "ListItem", "position": 2, "name": "Directory", "item": "https://traderefer.au/local" },
            { "@type": "ListItem", "position": 3, "name": stateName, "item": `https://traderefer.au/local/${state}` },
            { "@type": "ListItem", "position": 4, "name": cityName, "item": `https://traderefer.au/local/${state}/${city}` },
            { "@type": "ListItem", "position": 5, "name": suburbWithPostcode, "item": `https://traderefer.au/local/${state}/${city}/${suburb}` },
            { "@type": "ListItem", "position": 6, "name": `${tradeName} in ${suburbWithPostcode}` },
        ]
    };

    const serviceJsonLd = {
        "@context": "https://schema.org",
        "@type": "Service",
        "name": `${tradeName} in ${suburbWithPostcode}`,
        "serviceType": tradeName,
        "areaServed": {
            "@type": "City",
            "name": suburbName,
            ...(postcode ? { "postalCode": postcode } : {}),
            "containedInPlace": { "@type": "AdministrativeArea", "name": stateName }
        },
        ...(cost ? {
            "offers": {
                "@type": "AggregateOffer",
                "lowPrice": cost.low.toString(),
                "highPrice": cost.high.toString(),
                "priceCurrency": "AUD",
                "priceSpecification": {
                    "@type": "UnitPriceSpecification",
                    "price": `${cost.low}–${cost.high}`,
                    "priceCurrency": "AUD",
                    "unitText": cost.unit
                }
            }
        } : {})
    };

    const faqJsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
            "@type": "Question",
            "name": faq.q,
            "acceptedAnswer": { "@type": "Answer", "text": faq.a }
        }))
    };

    const localBusinessJsonLd = businesses.length > 0 && totalReviews > 0 ? {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": `${tradeName} in ${suburbWithPostcode} — TradeRefer`,
        "description": `Find verified ${tradeName.toLowerCase()} in ${suburbWithPostcode}, ${cityName}. ABN-checked, community-ranked.`,
        "url": `https://traderefer.au/local/${state}/${city}/${suburb}/${trade}`,
        "address": {
            "@type": "PostalAddress",
            "addressLocality": suburbName,
            "addressRegion": stateName,
            ...(postcode ? { "postalCode": postcode } : {}),
            "addressCountry": "AU"
        },
        "areaServed": { "@type": "City", "name": suburbName, ...(postcode ? { "postalCode": postcode } : {}), "containedInPlace": { "@type": "AdministrativeArea", "name": stateName } },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": avgRating,
            "reviewCount": totalReviews,
            "bestRating": "5",
            "worstRating": "1"
        }
    } : null;

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": `Top ${tradeName} in ${suburbWithPostcode}`,
        "description": `List of highest rated and verified ${tradeName} in the ${suburbWithPostcode} area.`,
        "numberOfItems": businesses.length,
        "itemListElement": businesses.map((biz: any, i: number) => ({
            "@type": "ListItem",
            "position": i + 1,
            "url": `https://traderefer.au/b/${biz.slug}`,
            "name": biz.business_name,
            "item": {
                "@type": "LocalBusiness",
                "name": biz.business_name,
                "url": `https://traderefer.au/b/${biz.slug}`,
                ...(biz.business_phone ? { "telephone": biz.business_phone } : {}),
                "address": {
                    "@type": "PostalAddress",
                    "addressLocality": biz.suburb || suburbName,
                    "addressRegion": stateName,
                    ...(postcode ? { "postalCode": postcode } : {}),
                    "addressCountry": "AU"
                },
                ...(parseFloat(biz.avg_rating) > 0 && parseInt(biz.total_reviews) > 0 ? {
                    "aggregateRating": {
                        "@type": "AggregateRating",
                        "ratingValue": parseFloat(biz.avg_rating).toFixed(1),
                        "reviewCount": parseInt(biz.total_reviews),
                        "bestRating": "5",
                        "worstRating": "1"
                    }
                } : {}),
                ...(biz.logo_url ? { "image": biz.logo_url } : {}),
            }
        }))
    };

    return (
        <>
        <main className="min-h-screen bg-white">
            {/* ── ALL JSON-LD SCHEMA ── */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            {localBusinessJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }} />}

            {/* ── BREADCRUMBS ── */}
            <div className="bg-gray-100 border-b border-gray-200" style={{ paddingTop: '108px', paddingBottom: '12px' }}>
                <div className="container mx-auto px-4">
                    <nav className="flex items-center flex-wrap gap-2 font-bold text-gray-500 uppercase tracking-widest" style={{ fontSize: '16px' }}>
                        <Link href="/" className="hover:text-[#FF6600] transition-colors">Home</Link>
                        <ChevronRight className="w-3 h-3" />
                        {breadcrumbs.map((bc, i) => (
                            <div key={i} className="flex items-center gap-2">
                                {i > 0 && <ChevronRight className="w-3 h-3" />}
                                {bc.href !== "#" ? (
                                    <Link href={bc.href} className="hover:text-[#FF6600] transition-colors">{bc.name}</Link>
                                ) : (
                                    <span className="text-[#FF6600]">{bc.name}</span>
                                )}
                            </div>
                        ))}
                    </nav>
                </div>
            </div>

            {/* ── HERO SECTION ── */}
            <div className="bg-[#FCFCFC] pb-20 pt-12 relative overflow-hidden border-b border-gray-200">
                <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: 'url(\'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=2670&auto=format&fit=crop\')' }} />
                <div className="absolute inset-0 z-0 bg-[#FCFCFC]/82" />
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl">
                        <h1 className="text-[42px] md:text-7xl lg:text-[80px] font-black mb-6 leading-[1.1] text-[#1A1A1A] font-display">
                            <span className="text-[#FF6600]">{tradeName}</span> in {suburbWithPostcode}, {cityName}
                        </h1>
                        <p className="text-gray-700 mb-6 max-w-2xl" style={{ fontSize: '20px', lineHeight: 1.7 }}>
                            {localizedIntro}
                        </p>
                        {cost && (
                            <div className="inline-flex items-center gap-2 bg-white border-2 border-gray-200 rounded-xl px-5 py-3 mb-6 font-bold text-[#1A1A1A]" style={{ fontSize: '18px' }}>
                                <DollarSign className="w-5 h-5 text-[#FF6600]" />
                                Typical cost: ${cost.low}–${cost.high}{cost.unit}
                            </div>
                        )}
                        <div className="flex flex-wrap gap-4">
                            <Link href="#businesses"
                                className="inline-flex items-center justify-center gap-2 bg-[#FF6600] hover:bg-[#E65C00] text-white font-black rounded-xl px-8 transition-all hover:scale-105 active:scale-95 font-cta"
                                style={{ minHeight: '64px', fontSize: '20px' }}
                            >
                                View Top {businesses.length > 0 ? businesses.length : ''} Trades
                            </Link>
                            <Link href="/register?type=business"
                                className="inline-flex items-center justify-center gap-2 bg-white border-2 border-gray-200 hover:border-[#FF6600] text-[#1A1A1A] font-black rounded-xl px-8 transition-all"
                                style={{ minHeight: '64px', fontSize: '20px' }}
                            >
                                List Your Business
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── VERIFICATION PROCESS BAR ── */}
            <div className="bg-white border-b border-zinc-100 py-5">
                <div className="container mx-auto px-4">
                    <div className="flex flex-wrap items-center justify-between gap-6">
                        <p className="font-black text-zinc-400 uppercase tracking-widest hidden sm:block" style={{ fontSize: '16px' }}>How We Verify</p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 shrink-0">
                                <BadgeCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-black text-zinc-900" style={{ fontSize: '16px' }}>Step 1 — ABN Check</p>
                                <p className="text-zinc-500" style={{ fontSize: '16px' }}>Verified via Australian Business Register</p>
                            </div>
                        </div>
                        <div className="hidden sm:block w-px h-8 bg-zinc-100" />
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-black text-zinc-900" style={{ fontSize: '16px' }}>Step 2 — Licence Check</p>
                                <p className="text-zinc-500" style={{ fontSize: '16px' }}>State trade licence confirmed</p>
                            </div>
                        </div>
                        <div className="hidden sm:block w-px h-8 bg-zinc-100" />
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600 shrink-0">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-black text-zinc-900" style={{ fontSize: '16px' }}>Step 3 — Community Referrals</p>
                                <p className="text-zinc-500" style={{ fontSize: '16px' }}>Ranked by peer-verified trust links</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── PAY ONLY WHEN YOU WIN BANNER ── */}
            <div className="bg-gradient-to-r from-orange-50 via-white to-orange-50 border-b border-orange-100 py-4">
                <div className="container mx-auto px-4">
                    <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <Zap className="w-4 h-4 text-green-600" />
                            </div>
                            <p className="font-black text-zinc-900" style={{ fontSize: '16px' }}>No lead fees — ever</p>
                        </div>
                        <div className="hidden sm:block w-1.5 h-1.5 bg-zinc-300 rounded-full" />
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Shield className="w-4 h-4 text-blue-600" />
                            </div>
                            <p className="font-black text-zinc-900" style={{ fontSize: '16px' }}>Pay only when you win the job</p>
                        </div>
                        <div className="hidden sm:block w-1.5 h-1.5 bg-zinc-300 rounded-full" />
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4 text-orange-600" />
                            </div>
                            <p className="font-black text-zinc-900" style={{ fontSize: '16px' }}>100% ABN-verified businesses</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── MAIN CONTENT ── */}
            <div className="bg-[#FCFCFC] py-20" id="businesses">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col lg:flex-row gap-12">

                        {/* ── RESULTS LISTING ── */}
                        <div className="lg:col-span-2 flex-1 space-y-8">
                            {/* ── SEARCH / FILTER BAR ── */}
                            <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-sm">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                                        <input
                                            type="text"
                                            readOnly
                                            value={`${tradeName} in ${suburbName}, ${cityName}`}
                                            className="w-full h-12 pl-12 pr-4 rounded-xl bg-zinc-50 border border-zinc-200 font-bold text-zinc-700 cursor-default"
                                            style={{ fontSize: '16px' }}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                                        {relatedTrades.slice(0, 3).map((rt: any) => (
                                            <Link
                                                key={rt.slug}
                                                href={`/local/${state}/${city}/${suburb}/${rt.slug}`}
                                                className="inline-flex items-center gap-1.5 px-4 h-12 bg-zinc-50 border-2 border-zinc-300 rounded-xl font-bold text-zinc-700 hover:border-orange-400 hover:text-orange-600 transition-colors whitespace-nowrap shrink-0"
                                                style={{ fontSize: '14px' }}
                                            >
                                                <Wrench className="w-3.5 h-3.5" />
                                                {rt.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* ── AGGREGATED REVIEW STARS BANNER ── */}
                            {totalReviews > 10 && (
                                <div className="flex flex-wrap items-center gap-4 bg-orange-50 border border-orange-100 rounded-2xl px-6 py-4">
                                    <div className="flex items-center gap-1.5">
                                        {[1,2,3,4,5].map(s => {
                                            const rating = parseFloat(avgRating || '0');
                                            const fillPercentage = Math.max(0, Math.min(100, (rating - s + 1) * 100));
                                            return (
                                                <div key={s} className="relative w-5 h-5">
                                                    <Star className="w-5 h-5 text-orange-200 absolute" />
                                                    <div style={{ width: `${fillPercentage}%`, overflow: 'hidden' }} className="absolute">
                                                        <Star className="w-5 h-5 fill-orange-400 text-orange-400" />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <p className="text-zinc-800 font-bold text-lg">{avgRating} average</p>
                                    <p className="text-zinc-500 font-medium">across <span className="font-bold text-zinc-700">{totalReviews.toLocaleString()} verified reviews</span> from {suburbName} {tradeName.toLowerCase()} businesses</p>
                                </div>
                            )}

                            {/* ── SERVICE SUB-TYPE QUICK FILTERS ── */}
                            {relatedJobs.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    <span className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-zinc-900 text-white rounded-full font-bold" style={{ fontSize: '14px' }}>
                                        <Search className="w-3.5 h-3.5" /> All {tradeName}
                                    </span>
                                    {relatedJobs.map((job) => (
                                        <Link
                                            key={job}
                                            href={`/local/${state}/${city}/${suburb}/${trade}/${jobToSlug(job)}`}
                                            className="inline-flex items-center px-4 py-2.5 bg-white border-2 border-zinc-300 rounded-full font-bold text-zinc-700 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50 transition-all" style={{ fontSize: '14px' }}
                                        >
                                            {job.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                        </Link>
                                    ))}
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black text-zinc-900">
                                    {businesses.length} {tradeName} Businesses Found
                                </h2>
                                <div className="text-zinc-500 font-medium" style={{ fontSize: '16px' }}>
                                    Sorted by Trust Score
                                </div>
                            </div>

                            {/* ── BUSINESS OWNER BANNER ── */}
                            {businesses.some((b: any) => b.is_claimed === false) && (
                                <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                                            <ShieldCheck className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-black text-zinc-900 text-lg mb-1">Are you a {tradeName.toLowerCase()} in {suburbName}?</p>
                                            <p className="text-zinc-600" style={{ fontSize: '15px' }}>Claim your free listing to manage your profile, respond to reviews, and connect with customers.</p>
                                        </div>
                                    </div>
                                    <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold h-12 px-6 border-none whitespace-nowrap">
                                        <Link href="/register?type=business">Claim Your Listing →</Link>
                                    </Button>
                                </div>
                            )}

                            {businesses.length === 0 ? (
                                <div className="bg-white rounded-3xl border border-zinc-200 p-12 text-center">
                                    <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <MapPin className="w-10 h-10 text-zinc-300" />
                                    </div>
                                    <h3 className="text-2xl font-black text-zinc-900 mb-2">No {tradeName} listed in {suburbName} yet</h3>
                                    <p className="text-zinc-500 max-w-md mx-auto mb-8 text-lg">
                                        Be the first local expert to join our network and reach customers in {suburbName}.
                                    </p>
                                    <Button asChild size="lg" className="bg-zinc-900 hover:bg-black text-white rounded-xl font-bold px-8">
                                        <Link href="/register?type=business">Create Your Free Profile</Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-6">
                                    {businesses.map((biz: any, index: number) => (
                                        <div key={biz.id} className="bg-white rounded-3xl border border-zinc-200 overflow-hidden hover:shadow-2xl hover:border-zinc-300 transition-all duration-500 group relative">
                                            {index === 0 && (
                                                <div className="absolute top-0 right-0 bg-zinc-900 text-white px-4 py-1.5 rounded-bl-2xl font-black uppercase tracking-widest z-10" style={{ fontSize: '16px' }}>
                                                    Top Rated
                                                </div>
                                            )}
                                            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start">
                                                <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-2xl flex items-center justify-center overflow-hidden border border-zinc-100 shadow-xl shrink-0">
                                                    <BusinessLogo logoUrl={biz.logo_url} name={biz.business_name} photoUrls={biz.photo_urls} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                                        <span className="px-3 py-1.5 bg-zinc-100 text-zinc-600 rounded-full font-black uppercase tracking-wider" style={{ fontSize: '16px' }}>{biz.trade_category}</span>
                                                        {biz.is_verified && (
                                                            <span className="verified-pulse flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-full font-black uppercase" style={{ fontSize: '16px' }}>
                                                                <ShieldCheck className="w-4 h-4" /> Verified
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h3 className="text-2xl md:text-3xl font-black text-zinc-900 mb-2 group-hover:text-orange-600 transition-colors">
                                                        {biz.business_name}
                                                    </h3>
                                                    <p className="text-zinc-500 text-lg mb-4 line-clamp-2" style={{lineHeight: '1.6'}}>
                                                        {biz.description || generateFallbackDescription(biz)}
                                                    </p>

                                                    {/* Photo thumbnails */}
                                                    {biz.photo_urls?.length > 0 && (
                                                        <div className="flex items-center gap-2 mb-5">
                                                            {biz.photo_urls.slice(0, 4).map((url: string, i: number) => (
                                                                <Link key={i} href={`/b/${biz.slug}`} className="relative w-20 h-20 rounded-xl overflow-hidden border border-zinc-100 shrink-0 hover:border-orange-300 transition-colors">
                                                                    <img src={url} alt={`${biz.business_name} work ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                                                                </Link>
                                                            ))}
                                                            {biz.photo_urls.length > 4 && (
                                                                <Link href={`/b/${biz.slug}`} className="w-20 h-20 rounded-xl bg-zinc-100 border border-zinc-200 flex flex-col items-center justify-center shrink-0 hover:border-orange-300 transition-colors">
                                                                    <Camera className="w-4 h-4 text-zinc-400 mb-0.5" />
                                                                    <span className="text-xs font-bold text-zinc-500">+{biz.photo_urls.length - 4}</span>
                                                                </Link>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="flex flex-wrap items-center gap-6 text-zinc-600 font-bold mb-8" style={{ fontSize: '16px' }}>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 bg-zinc-100 rounded flex items-center justify-center text-zinc-400">
                                                                <MapPin className="w-3.5 h-3.5" />
                                                            </div>
                                                            {biz.suburb}
                                                        </div>
                                                        {biz.business_phone && (
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 bg-zinc-100 rounded flex items-center justify-center text-zinc-400">
                                                                    <Phone className="w-3.5 h-3.5" />
                                                                </div>
                                                                <a href={`tel:${biz.business_phone}`} className="hover:text-[#FF6600] transition-colors">{biz.business_phone}</a>
                                                            </div>
                                                        )}
                                                        {parseFloat(biz.avg_rating) > 0 && (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 bg-zinc-100 rounded flex items-center justify-center text-zinc-400">
                                                                <Star className="w-3.5 h-3.5 fill-orange-400 text-orange-400" />
                                                            </div>
                                                            {parseFloat(biz.avg_rating).toFixed(1)} ★{parseInt(biz.total_reviews) > 0 ? ` (${biz.total_reviews} reviews)` : ''}
                                                        </div>
                                                        )}
                                                        {parseInt(biz.trusted_count) > 0 && (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 bg-zinc-100 rounded flex items-center justify-center text-zinc-400">
                                                                <Users className="w-3.5 h-3.5" />
                                                            </div>
                                                            {biz.trusted_count} Trusted Links
                                                        </div>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <Button asChild size="lg" className="bg-[#FF6600] hover:bg-[#E65C00] text-white rounded-xl font-bold h-14 px-6 border-none">
                                                            <Link href={`/b/${biz.slug}`}>View Profile</Link>
                                                        </Button>
                                                        <Button asChild variant="outline" size="lg" className="border-2 border-zinc-300 hover:bg-zinc-50 hover:border-zinc-400 rounded-xl font-bold h-14 px-6">
                                                            <Link href={`/b/${biz.slug}#enquiry-form`}>Request Quote</Link>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* ── COMPARISON BLOCK ── */}
                            {businesses.length > 0 && (
                                <section className="bg-zinc-900 rounded-3xl p-8 md:p-10 text-white">
                                    <h2 className="font-black mb-6 text-center" style={{ fontSize: '28px' }}>Why TradeRefer vs. Traditional Lead Sites?</h2>
                                    <div className="overflow-x-auto">
                                        <table className="w-full" style={{ fontSize: '16px' }}>
                                            <thead>
                                                <tr className="border-b border-white/10">
                                                    <th className="text-left py-3 pr-6 font-black text-zinc-400 uppercase tracking-wider" style={{ fontSize: '16px' }}>Feature</th>
                                                    <th className="text-center py-3 px-4 font-black text-orange-400 uppercase tracking-wider" style={{ fontSize: '16px' }}>TradeRefer</th>
                                                    <th className="text-center py-3 pl-4 font-black text-zinc-400 uppercase tracking-wider" style={{ fontSize: '16px' }}>Lead Sites</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {[
                                                    ["Cost model", "20% success fee only", "$21–$80 per lead (win or lose)"],
                                                    ["Verification", "ABN + licence checked", "Self-reported"],
                                                    ["Rankings", "Community referrals", "Paid placement"],
                                                    ["Risk", "Zero upfront cost", "High waste if job not won"],
                                                ].map(([feature, ours, theirs]) => (
                                                    <tr key={feature}>
                                                        <td className="py-3 pr-6 text-zinc-400 font-medium">{feature}</td>
                                                        <td className="py-3 px-4 text-center">
                                                            <span className="inline-flex items-center gap-1.5 text-green-400 font-bold"><CheckCircle2 className="w-4 h-4" />{ours}</span>
                                                        </td>
                                                        <td className="py-3 pl-4 text-center text-zinc-500">{theirs}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            )}

                            {/* ── FEATURED REVIEWS SECTION ── */}
                            {(() => {
                                const reviewSnippets = businesses
                                    .filter((b: any) => parseFloat(b.avg_rating) >= 4.0 && parseInt(b.total_reviews) > 0)
                                    .slice(0, 3)
                                    .map((b: any) => ({
                                        name: b.business_name,
                                        slug: b.slug,
                                        rating: parseFloat(b.avg_rating).toFixed(1),
                                        reviews: parseInt(b.total_reviews),
                                        suburb: b.suburb,
                                    }));
                                return reviewSnippets.length > 0 ? (
                                    <section className="bg-gradient-to-br from-orange-50 to-white rounded-3xl border border-orange-100 p-8 md:p-10">
                                        <h2 className="text-2xl font-black text-zinc-900 mb-2 flex items-center gap-2">
                                            <Award className="w-6 h-6 text-orange-500" />
                                            Top Rated {tradeName} in {suburbName}
                                        </h2>
                                        <p className="text-zinc-500 mb-6" style={{ fontSize: '16px' }}>Highest rated by Google reviews from real customers</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            {reviewSnippets.map((r: any, i: number) => (
                                                <Link key={r.slug} href={`/b/${r.slug}`} className="bg-white rounded-2xl border border-zinc-100 p-5 hover:shadow-lg hover:border-orange-200 transition-all group">
                                                    <div className="flex items-center gap-1 mb-2">
                                                        {[1,2,3,4,5].map(s => {
                                                            const rating = parseFloat(r.rating);
                                                            const fillPercentage = Math.max(0, Math.min(100, (rating - s + 1) * 100));
                                                            return (
                                                                <div key={s} className="relative w-4 h-4">
                                                                    <Star className="w-4 h-4 text-zinc-200 absolute" />
                                                                    <div style={{ width: `${fillPercentage}%`, overflow: 'hidden' }} className="absolute">
                                                                        <Star className="w-4 h-4 fill-orange-400 text-orange-400" />
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    <p className="font-black text-zinc-900 group-hover:text-orange-600 transition-colors mb-1" style={{ fontSize: '16px' }}>{r.name}</p>
                                                    <p className="text-zinc-500 text-sm">{r.rating} ★ from {r.reviews} reviews</p>
                                                </Link>
                                            ))}
                                        </div>
                                    </section>
                                ) : null;
                            })()}

                            {/* ── SEO CONTENT SECTION ── */}
                            <div className="mt-20 space-y-12">

                                {/* Pricing Section */}
                                {cost && (
                                    <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                                        <h2 className="text-2xl font-black text-zinc-900 mb-2 flex items-center gap-2">
                                            <DollarSign className="w-6 h-6 text-orange-500" />
                                            How Much Do {tradeName} Cost in {suburbName}?
                                        </h2>
                                        <p className="text-lg text-zinc-500 mb-6" style={{lineHeight: '1.6'}}>Pricing data based on Australian industry averages for {stateName}.</p>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                                                <p className="font-black text-zinc-600 uppercase tracking-wider mb-1" style={{ fontSize: '13px' }}>Typical Range</p>
                                                <p className="text-2xl font-black text-zinc-900">${cost.low}–${cost.high}</p>
                                                <p className="text-zinc-500" style={{ fontSize: '16px' }}>{cost.unit}</p>
                                            </div>
                                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                                                <p className="font-black text-zinc-600 uppercase tracking-wider mb-1" style={{ fontSize: '13px' }}>Emergency Rate</p>
                                                <p className="text-2xl font-black text-zinc-900">${Math.round(cost.high * 1.5)}</p>
                                                <p className="text-zinc-500" style={{ fontSize: '16px' }}>After-hours callout</p>
                                            </div>
                                            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                                                <p className="font-black text-zinc-600 uppercase tracking-wider mb-1" style={{ fontSize: '13px' }}>Get Quotes</p>
                                                <p className="text-2xl font-black text-zinc-900">{businesses.length > 0 ? businesses.length : "Free"}</p>
                                                <p className="text-zinc-500" style={{ fontSize: '16px' }}>{businesses.length > 0 ? "local providers" : "no obligation"}</p>
                                            </div>
                                        </div>
                                        <p className="text-zinc-400 mt-4" style={{ fontSize: '16px' }}>Prices are estimates only. Always get 2–3 written quotes before proceeding with any work.</p>
                                    </section>
                                )}

                                {/* Regional Climate / Local Specialist Block */}
                                {tradeNote && (
                                    <section className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex gap-4">
                                        <MapPin className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                                        <div>
                                            <h3 className="font-black text-zinc-900 mb-1">Local Conditions for {tradeName} in {suburbName}</h3>
                                            <p className="text-lg text-zinc-700 leading-relaxed" style={{lineHeight: '1.6'}}>{tradeNote}</p>
                                        </div>
                                    </section>
                                )}

                                {/* Licensing Info */}
                                {licenceText && (
                                    <section className="bg-blue-50 border border-blue-100 rounded-3xl p-6 flex gap-4">
                                        <FileText className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" />
                                        <div>
                                            <h3 className="font-black text-zinc-900 mb-1">{tradeName} Licensing Requirements in {stateName}</h3>
                                            <p className="text-lg text-zinc-600 leading-relaxed" style={{lineHeight: '1.6'}}>{licenceText}</p>
                                            {authorityLink && (
                                                <a href={authorityLink.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-3 text-blue-600 font-bold hover:underline" style={{ fontSize: '16px' }}>
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                    Verify on {authorityLink.name}
                                                </a>
                                            )}
                                        </div>
                                    </section>
                                )}

                                {/* How to Choose */}
                                <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                                    <h2 className="text-2xl font-black text-zinc-900 mb-6">How Do I Find a Reliable {tradeName} in {suburbName}?</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { title: "Verify Licence & Insurance", body: `Confirm they hold the correct ${stateName} trade licence and carry public liability insurance. All TradeRefer businesses have ABN verification.` },
                                            { title: "Read Community Referrals", body: `Look beyond star ratings. TradeRefer shows verified peer referrals from real ${suburbName} residents — not anonymous reviews.` },
                                            { title: "Get 2–3 Written Quotes", body: `Always compare quotes for any job over $500. A written quote protects you and clarifies exactly what's included in the scope.` },
                                            { title: "Choose Local Knowledge", body: `A ${tradeName.toLowerCase()} who works regularly in ${suburbName} understands local council requirements, suppliers, and common property issues.` },
                                        ].map((item, i) => (
                                            <div key={i} className="p-5 bg-zinc-50 rounded-2xl border border-zinc-100">
                                                <h4 className="font-bold text-zinc-900 mb-2 flex items-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                    {item.title}
                                                </h4>
                                                <p className="text-base text-zinc-500 leading-relaxed" style={{lineHeight: '1.6'}}>{item.body}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Related Job Types */}
                                {relatedJobs.length > 0 && (
                                    <section className="bg-white rounded-3xl border border-zinc-200 p-8">
                                        <h2 className="text-xl font-black text-zinc-900 mb-2 flex items-center gap-2">
                                            <Wrench className="w-5 h-5 text-orange-500" />
                                            Specific {tradeName} Services in {suburbName}
                                        </h2>
                                        <p className="text-lg text-zinc-500 mb-6">Looking for a specific type of {tradeName.toLowerCase()} work? Browse by service:</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {relatedJobs.map((job) => (
                                                <Link
                                                    key={job}
                                                    href={`/local/${state}/${city}/${suburb}/${trade}/${jobToSlug(job)}`}
                                                    className="flex items-center justify-between px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl text-sm font-bold text-zinc-600 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700 transition-colors"
                                                >
                                                    <span className="capitalize">{job}</span>
                                                    <ArrowRight className="w-4 h-4 text-zinc-300" />
                                                </Link>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Trade-Specific FAQ */}
                                <section>
                                    <h2 className="text-2xl font-black text-zinc-900 mb-8">What Do People Ask About {tradeName} in {suburbName}?</h2>
                                    <div className="space-y-4">
                                        {faqs.map((faq, i) => (
                                            <div key={i} className="bg-white rounded-2xl border border-zinc-200 p-6">
                                                <h3 className="font-bold text-zinc-900 mb-2">{faq.q}</h3>
                                                <p className="text-lg text-zinc-500 leading-relaxed" style={{lineHeight: '1.6'}}>{faq.a}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        </div>

                        {/* ── SIDEBAR ── */}
                        <div className="lg:w-96 space-y-6">

                            {/* Market Summary Card (Safe for Google) */}
                            <div className="bg-white rounded-3xl border border-zinc-200 p-8 shadow-sm">
                                <h3 className="text-lg font-black text-zinc-900 mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-orange-500" />
                                    {suburbName} Market Insights
                                </h3>
                                <div className="space-y-4 text-sm text-zinc-600">
                                    {avgRating && (
                                    <div className="flex justify-between items-center py-2 border-b border-zinc-50">
                                        <span>Avg Google Rating</span>
                                        <span className="font-bold text-zinc-900 text-base">{avgRating} ★</span>
                                    </div>
                                    )}
                                    {totalReviews > 0 && (
                                        <div className="flex justify-between items-center py-2 border-b border-zinc-50">
                                            <span>Total Reviews</span>
                                            <span className="font-bold text-zinc-900 text-base">{totalReviews.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center py-2 border-b border-zinc-50">
                                        <span>Verified Providers</span>
                                        <span className="font-bold text-zinc-900 text-base">{businesses.length}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-zinc-50">
                                        <span>Availability</span>
                                        <span className={`font-bold text-base ${availabilityColor}`}>{availabilityLabel}</span>
                                    </div>
                                    <div className="pt-2">
                                        <p className="leading-relaxed">
                                            {businesses.length > 0
                                                ? <>Currently there are {businesses.length} trusted <span className="font-bold text-zinc-800">{tradeName.toLowerCase()}</span> listed in <span className="font-bold text-zinc-800">{suburbName}</span>. Our directory prioritizes businesses based on community verified links and historical performance.</>
                                                : <>Be the first <span className="font-bold text-zinc-800">{tradeName.toLowerCase()}</span> to list in <span className="font-bold text-zinc-800">{suburbName}</span>. TradeRefer prioritizes businesses based on community referrals and ABN verification.</>
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Location Map */}
                            <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm">
                                <h3 className="text-lg font-black text-zinc-900 px-8 pt-6 pb-3 flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-orange-500" />
                                    {suburbName}, {cityName}
                                </h3>
                                <iframe
                                    title={`${suburbName} ${tradeName} location map`}
                                    width="100%"
                                    height="220"
                                    style={{ border: 0 }}
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    src={`https://maps.google.com/maps?q=${encodeURIComponent(suburbName + ', ' + cityName + ', ' + stateName + ', Australia')}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                                />
                            </div>

                            {/* Geographic Urgency */}
                            {cityReferralCount > 0 && (
                                <div className="bg-green-50 border border-green-100 rounded-3xl p-6 flex gap-3">
                                    <Clock className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-black text-zinc-900">{cityReferralCount.toLocaleString()} referrals matched in {cityName}</p>
                                        <p className="text-xs text-zinc-500 mt-0.5">in the last 30 days — active network</p>
                                    </div>
                                </div>
                            )}

                            {/* Trade Editor Bio */}
                            <div className="bg-white border border-zinc-200 rounded-3xl p-6">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 shrink-0">
                                        <BadgeCheck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-zinc-900">Verified by TradeRefer</p>
                                        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">Market insights on this page are reviewed by our Verification Team — ABN, licence, and community referral checks since 2024.</p>
                                        <Link href="/about" className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-orange-600 hover:underline">
                                            How we verify <ArrowRight className="w-3 h-3" />
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Trusted Shield */}
                            <div className="bg-zinc-900 rounded-3xl p-8 text-white relative overflow-hidden">
                                <Shield className="absolute -top-12 -right-12 w-48 h-48 text-white/5 rotate-12" />
                                <div className="relative z-10">
                                    <h3 className="text-2xl font-black mb-4">The Promise</h3>
                                    <ul className="space-y-4 mb-8">
                                        <li className="flex gap-3 text-sm">
                                            <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0" />
                                            <span>We only list businesses with active ABNs confirmed via ABR.</span>
                                        </li>
                                        <li className="flex gap-3 text-sm">
                                            <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0" />
                                            <span>Rankings based on community trust, never paid ads.</span>
                                        </li>
                                        <li className="flex gap-3 text-sm">
                                            <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0" />
                                            <span>Direct messaging and transparent quote requests.</span>
                                        </li>
                                    </ul>
                                    <Button asChild size="lg" className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold h-12 border-none">
                                        <Link href="/about">How It Works <ArrowRight className="w-4 h-4 ml-2" /></Link>
                                    </Button>
                                </div>
                            </div>

                            {/* Internal Discovery Cluster 1: Related Trades */}
                            {relatedTrades.length > 0 && (
                                <div className="bg-white rounded-3xl border border-zinc-200 p-8 shadow-sm">
                                    <h4 className="font-black text-zinc-900 mb-6 flex items-center gap-2">
                                        <Info className="w-4 h-4 text-zinc-400" />
                                        Other Professional Trades in {suburbName}
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {relatedTrades.map((t: any) => (
                                            <Link
                                                key={t.trade_category}
                                                href={`/local/${state}/${city}/${suburb}/${t.trade_category.toLowerCase().replace(/\s+/g, '-')}`}
                                                className="px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors text-center"
                                            >
                                                {formatSlug(t.trade_category)}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Internal Discovery Cluster 2: Nearby Locations */}
                            {nearbySuburbs.length > 0 && (
                                <div className="bg-white rounded-3xl border border-zinc-200 p-8 shadow-sm">
                                    <h4 className="font-black text-zinc-900 mb-6 flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-zinc-400" />
                                        {tradeName} in Nearby Suburbs
                                    </h4>
                                    <div className="grid grid-cols-1 gap-2">
                                        {nearbySuburbs.map((s: any) => {
                                            const nSlug = s.suburb.toLowerCase().replace(/\s+/g, '-');
                                            const nPc = getPostcode(nSlug, state);
                                            return (
                                            <Link
                                                key={s.suburb}
                                                href={`/local/${state}/${city}/${nSlug}${nPc ? `-${nPc}` : ''}/${trade}`}
                                                className="flex items-center justify-between px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors"
                                            >
                                                <span>{formatSlug(s.suburb)}{nPc ? ` ${nPc}` : ''}</span>
                                                <ChevronRight className="w-4 h-4 text-zinc-300" />
                                            </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* CTA */}
                            <div className="bg-orange-500 rounded-3xl p-8 text-white text-center">
                                <h3 className="text-xl font-black mb-2">Are you a {tradeName}?</h3>
                                <p className="text-white/80 text-sm mb-6">Build your trust score and grow your business with referrals that actually close in {suburbName}.</p>
                                <Button asChild size="lg" className="bg-white text-orange-600 hover:bg-zinc-100 rounded-xl font-bold px-8 h-12 w-full shadow-lg shadow-black/10 border-none">
                                    <Link href="/register?type=business">Apply to Join</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        {/* Spacer for sticky CTA */}
        {businesses.length > 0 && <div className="h-20" />}
        </main>

        {/* ── STICKY GET QUOTES CTA BAR ── */}
        {businesses.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-zinc-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] py-3 px-4 md:px-6">
                <div className="container mx-auto flex items-center justify-between gap-4">
                    <div className="hidden sm:block">
                        <p className="font-black text-zinc-900" style={{ fontSize: '16px' }}>{businesses.length} verified {tradeName.toLowerCase()} in {suburbName}</p>
                        <p className="text-zinc-500 text-sm">ABN-checked · Pay only when you win</p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Button asChild size="lg" className="bg-[#FF6600] hover:bg-[#E65C00] text-white rounded-xl font-bold h-12 px-6 border-none flex-1 sm:flex-initial">
                            <Link href={`/b/${businesses[0]?.slug}#enquiry-form`}>Get a Quote</Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="border-2 border-zinc-300 hover:bg-zinc-50 rounded-xl font-bold h-12 px-6 hidden sm:flex">
                            <Link href="/register?type=business">List Your Business</Link>
                        </Button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}

