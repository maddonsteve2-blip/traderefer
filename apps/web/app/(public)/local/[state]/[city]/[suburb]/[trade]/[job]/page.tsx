import { sql } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { MapPin, Star, ShieldCheck, ChevronRight, CheckCircle2, Users, ArrowRight, DollarSign, FileText, Wrench } from "lucide-react";
import Link from "next/link";
import { BusinessLogo } from "@/components/BusinessLogo";
import { Metadata } from "next";
import { TRADE_COST_GUIDE, TRADE_FAQ_BANK, STATE_LICENSING, JOB_TYPES, TRADE_NOUNS, jobToSlug, normalizeTradeName } from "@/lib/constants";
import { notFound, permanentRedirect } from "next/navigation";
import { parseSuburbSlug, getCanonicalSuburbSlug, getDisplayPostcode, getPostcode } from "@/lib/postcodes";
import { retiredTradeSlugTarget } from "@/lib/trade-redirects";
import { getCanonicalCitySlug } from "@/lib/suburb-cities";
import { buildOgImageUrl } from "@/lib/og-image";
import { directoryRobots } from "@/lib/seo/index-policy";
import { getJobMaterials, getJobQuestions } from "@/lib/materials";
import { JobMaterialsCard } from "@/components/JobMaterialsCard";
import { jobCostGuide } from "@/lib/job-costs";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ state: string; city: string; suburb: string; trade: string; job: string }>;
}

function formatSlug(slug: string) {
    if (!slug) return "";
    try { slug = decodeURIComponent(slug); } catch { /* already decoded */ }
    const { suburb: cleanSlug } = parseSuburbSlug(slug);
    return cleanSlug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function slugify(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function getTradeDisplayName(tradeSlugOrName: string) {
    const slug = slugify(tradeSlugOrName);
    return Object.keys(TRADE_NOUNS).find((name) => slugify(name) === slug) || formatSlug(tradeSlugOrName);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { trade, suburb, city, state, job } = await params;
    const canonicalSuburb = getCanonicalSuburbSlug(suburb, state);
    const tradeName = getTradeDisplayName(trade);
    const suburbName = formatSlug(canonicalSuburb);
    const cityName = formatSlug(city);
    const stateUpper = state.toUpperCase();
    const jobName = formatSlug(job);
    const tradeKey = normalizeTradeName(tradeName);
    const tradeCost = TRADE_COST_GUIDE[tradeKey] || TRADE_COST_GUIDE[tradeName];
    const cost = jobCostGuide(job, tradeCost);
    const businesses = await getBusinesses(state, city, trade, canonicalSuburb);
    const count = businesses.length;
    const postcode = getDisplayPostcode(canonicalSuburb, state);
    const suburbWithPostcode = postcode ? `${suburbName} ${postcode}` : suburbName;
    const cityDisplay = suburbName.toLowerCase() === cityName.toLowerCase() ? "" : `, ${cityName}`;
    const canonicalUrl = `https://traderefer.au/local/${state}/${getCanonicalCitySlug(state, suburb) ?? city}/${canonicalSuburb}/${retiredTradeSlugTarget(trade) ?? trade}/${job}`;
    const ogImageUrl = buildOgImageUrl({
        template: "job",
        title: `${jobName} in ${suburbWithPostcode}`,
        subtitle: `Compare ${count > 0 ? count : "available"} local specialists in ${suburbName}${cityDisplay} ${stateUpper}. ABN and referral signals where available, with quote-ready paths.`,
        eyebrow: "Local job guide",
        badge: `${stateUpper} service page`,
        stat1: count > 0 ? `${count} specialists` : "Available specialists",
        stat2: cost ? `$${cost.low}-${cost.high}${cost.unit}` : tradeName,
        stat3: "Free quotes",
    });

    return {
        title: `${jobName} in ${suburbWithPostcode} | TradeRefer`,
        description: `Compare ${count > 0 ? count : 'available'} ${jobName.toLowerCase()} specialists in ${suburbName}${cityDisplay} ${stateUpper}.${cost ? ` Typical cost $${cost.low}–$${cost.high}${cost.unit}.` : ''} ABN and referral signals where available. Get free quotes today.`,
        robots: directoryRobots({ page: "localJob", businessCount: count }),
        alternates: { canonical: canonicalUrl },
        openGraph: {
            title: `${jobName} in ${suburbWithPostcode} | TradeRefer`,
            description: `${count > 0 ? count : 'Available'} local ${jobName.toLowerCase()} specialists in ${suburbWithPostcode}. Compare ratings, pricing and referrals.`,
            url: canonicalUrl,
            siteName: "TradeRefer",
            type: "website",
            images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `${jobName} in ${suburbWithPostcode}` }],
        },
        twitter: {
            card: "summary_large_image",
            title: `${jobName} in ${suburbWithPostcode} | TradeRefer`,
            description: `${count > 0 ? count : 'Available'} local ${jobName.toLowerCase()} specialists in ${suburbWithPostcode}. Compare ratings, pricing and referrals.`,
            images: [ogImageUrl],
        },
    };
}

async function getBusinesses(state: string, city: string, trade: string, suburb: string) {
    try {
        // For job-type pages, search by the parent trade category, not the specific job type
        // e.g., search for "Drainage" businesses, not "Surface Drainage Systems"
        const stateCode = state.toUpperCase();
        const cityName = formatSlug(city);
        const tradeName = getTradeDisplayName(trade);
        const tradeSlug = slugify(tradeName);
        const suburbName = formatSlug(suburb);
        const results = await sql`
            SELECT b.*,
                COUNT(r.id) as referral_count,
                COALESCE(b.trust_score, 0) as trust_score
            FROM businesses b
            LEFT JOIN referral_links r ON r.business_id = b.id
            WHERE b.status = 'active'
              AND (b.listing_visibility = 'public' OR b.listing_visibility IS NULL)
              AND UPPER(b.state) = ${stateCode}
              AND LOWER(b.city) = LOWER(${cityName})
              AND TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(b.trade_category), '[^a-z0-9]+', '-', 'g')) = ${tradeSlug}
              AND LOWER(b.suburb) = LOWER(${suburbName})
            GROUP BY b.id
            ORDER BY b.trust_score DESC, referral_count DESC
            LIMIT 8
        `;
        return results;
    } catch {
        return [];
    }
}

async function getNearbySuburbs(state: string, city: string, currentSuburb: string, trade: string) {
    try {
        const stateCode = state.toUpperCase();
        const tradeName = getTradeDisplayName(trade);
        const tradeSlug = slugify(tradeName);
        const cityName = formatSlug(city);
        const results = await sql`
            SELECT DISTINCT suburb FROM businesses
            WHERE status = 'active'
              AND (listing_visibility = 'public' OR listing_visibility IS NULL)
              AND UPPER(state) = ${stateCode}
              AND LOWER(city) = LOWER(${cityName})
              AND TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(trade_category), '[^a-z0-9]+', '-', 'g')) = ${tradeSlug}
              AND LOWER(suburb) != LOWER(${formatSlug(currentSuburb)})
            ORDER BY suburb ASC
            LIMIT 6
        `;
        return results.map((r: any) => r.suburb).filter(Boolean);
    } catch {
        return [];
    }
}

export default async function JobTypePage({ params }: PageProps) {
    const { trade, suburb, city, state, job } = await params;
    const { postcode: urlPostcode, suburb: bareSuburb } = parseSuburbSlug(suburb);
    const normalizedSuburb = urlPostcode ? `${bareSuburb}-${urlPostcode}` : bareSuburb;
    const canonicalSuburb = getCanonicalSuburbSlug(suburb, state);
    const canonicalCity = getCanonicalCitySlug(state, bareSuburb) ?? city;
    const canonicalTrade = retiredTradeSlugTarget(trade) ?? trade;
    if (canonicalSuburb !== normalizedSuburb || canonicalCity !== city || canonicalTrade !== trade) {
        permanentRedirect(`/local/${state}/${canonicalCity}/${canonicalSuburb}/${canonicalTrade}/${job}`);
    }

    const tradeName = getTradeDisplayName(trade);
    const suburbName = formatSlug(canonicalSuburb);
    const cityName = formatSlug(city);
    const jobName = formatSlug(job);
    const stateName = state.toUpperCase();

    const [businesses, nearbySuburbs, jobMaterials, jobQuestions] = await Promise.all([
        getBusinesses(state, city, trade, canonicalSuburb),
        getNearbySuburbs(state, city, canonicalSuburb, trade),
        getJobMaterials(job),
        getJobQuestions(job),
    ]);

    const avgRating = businesses.length > 0
        ? (businesses.reduce((acc: number, biz: any) => acc + ((biz.trust_score || 0) / 20), 0) / businesses.length).toFixed(1)
        : "4.8";

    const tradeKey = normalizeTradeName(tradeName);

    // Junk-slug guard: the job catalogue is fully programmatic, so any job
    // slug outside JOB_TYPES for this trade (or any unknown trade) would
    // render fabricated content under an infinite URL space — 404 instead.
    const catalogueJobs = JOB_TYPES[tradeKey] || JOB_TYPES[tradeName] || [];
    if (!catalogueJobs.some((j) => jobToSlug(j) === job)) notFound();
    if (businesses.length === 0 && getPostcode(bareSuburb, state) === null) {
        // Suburb missing from the postcode dataset: real if ANY active
        // business (any trade) lives there, junk otherwise.
        const suburbRows = await sql<{ x: number }[]>`
            SELECT 1 AS x FROM businesses
            WHERE status = 'active'
              AND UPPER(state) = ${state.toUpperCase()}
              AND LOWER(suburb) = LOWER(${suburbName})
            LIMIT 1
        `;
        if (suburbRows.length === 0) notFound();
    }

    const tradeCost = TRADE_COST_GUIDE[tradeKey] || TRADE_COST_GUIDE[tradeName];
    const cost = jobCostGuide(job, tradeCost);
    const faqs = TRADE_FAQ_BANK[tradeKey] || TRADE_FAQ_BANK[tradeName] || [];
    const licenceText = STATE_LICENSING[tradeKey]?.[stateName] || STATE_LICENSING[tradeName]?.[stateName] || null;
    const relatedJobs = (JOB_TYPES[tradeKey] || JOB_TYPES[tradeName] || [])
        .filter(j => jobToSlug(j) !== job);
    const broaderTradeHref = `/local/${state}/${city}/${canonicalSuburb}/${trade}`;

    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://traderefer.au" },
            { "@type": "ListItem", "position": 2, "name": "Directory", "item": "https://traderefer.au/local" },
            { "@type": "ListItem", "position": 3, "name": stateName, "item": `https://traderefer.au/local/${state}` },
            { "@type": "ListItem", "position": 4, "name": cityName, "item": `https://traderefer.au/local/${state}/${city}` },
            { "@type": "ListItem", "position": 5, "name": suburbName, "item": `https://traderefer.au/local/${state}/${city}/${canonicalSuburb}` },
            { "@type": "ListItem", "position": 6, "name": tradeName, "item": `https://traderefer.au/local/${state}/${city}/${canonicalSuburb}/${trade}` },
            { "@type": "ListItem", "position": 7, "name": `${jobName} in ${suburbName}` },
        ]
    };

    const serviceJsonLd = {
        "@context": "https://schema.org",
        "@type": "Service",
        "name": `${jobName} in ${suburbName}`,
        "serviceType": jobName,
        "provider": { "@type": "Organization", "name": "TradeRefer", "url": "https://traderefer.au" },
        "areaServed": {
            "@type": "City",
            "name": suburbName,
            "containedInPlace": { "@type": "AdministrativeArea", "name": stateName }
        },
        ...(cost ? {
            "offers": {
                "@type": "AggregateOffer",
                "lowPrice": cost.low.toString(),
                "highPrice": cost.high.toString(),
                "priceCurrency": "AUD"
            }
        } : {})
    };

    // Job-specific Q&As (real Google PAA questions, in-house answers) lead;
    // generic trade FAQs fill the remainder.
    // Stopwords are stripped before comparing so paraphrases collapse:
    // "What time of year should I lay turf?" and "What's the best time of
    // year to lay turf in Australia?" normalise to the same content tokens.
    const FAQ_STOPWORDS = new Set(["what", "whats", "is", "are", "the", "a", "an", "of", "in", "on", "for", "to", "i", "my", "you", "your", "it", "do", "does", "should", "can", "how", "much", "best", "australia"]);
    const normQ = (t: string) => t.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim()
        .split(/\s+/).filter((w) => w && !FAQ_STOPWORDS.has(w)).join(" ");
    const authoredFaqs = jobQuestions.map((q) => ({ q: q.question, a: q.answer }));
    const authoredNorms = authoredFaqs.map((f) => normQ(f.q));
    const overlaps = (a: string, b: string) => {
        if (!a || !b) return false; // empty normalisation must never match-all
        if (a.includes(b) || b.includes(a)) return true;
        const wa = new Set(a.split(" ")), wb = new Set(b.split(" "));
        const shared = [...wa].filter((w) => wb.has(w)).length;
        return shared / Math.min(wa.size, wb.size) >= 0.7;
    };
    const faqEntries = [
        ...authoredFaqs,
        ...faqs.filter((f) => !authoredNorms.some((an) => overlaps(an, normQ(f.q)))),
    ].slice(0, 8);
    const faqJsonLd = faqEntries.length > 0 ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqEntries.map(faq => ({
            "@type": "Question",
            "name": faq.q,
            "acceptedAnswer": { "@type": "Answer", "text": faq.a }
        }))
    } : null;

    return (
        <>
        <main className="min-h-screen bg-white">
            {/* Schema */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
            {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}

            {/* Hero */}
            <div className="bg-zinc-900 pt-32 pb-20 relative overflow-hidden text-white">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                </div>
                <div className="container mx-auto px-4 relative z-10">
                    {/* Breadcrumb */}
                    <nav className="flex flex-wrap items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest mb-8">
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href={`/local/${state}`} className="hover:text-white transition-colors">{stateName}</Link>
                        <ChevronRight className="w-3 h-3" />
                        {cityName.toLowerCase() !== suburbName.toLowerCase() && (<>
                        <Link href={`/local/${state}/${city}`} className="hover:text-white transition-colors">{cityName}</Link>
                        <ChevronRight className="w-3 h-3" />
                        </>)}
                        <Link href={`/local/${state}/${city}/${canonicalSuburb}`} className="hover:text-white transition-colors">{suburbName}</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href={`/local/${state}/${city}/${canonicalSuburb}/${trade}`} className="hover:text-white transition-colors">{tradeName}</Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-orange-400">{jobName}</span>
                    </nav>

                    <div className="grid lg:grid-cols-[1fr_400px] gap-12 items-start">
                        <div className="max-w-3xl">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="text-sm font-black text-orange-400 uppercase tracking-widest">{tradeName} Specialist Service</span>
                                <span className="hidden sm:block flex-1 max-w-[160px] h-px bg-orange-400/40" aria-hidden="true" />
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight text-white">
                                <span className="text-orange-500">{jobName}</span> in {suburbName}{suburbName.toLowerCase() === cityName.toLowerCase() ? "" : `, ${cityName}`}
                            </h1>
                            <p className="text-xl text-zinc-300 mb-6 leading-relaxed">
                                Compare {jobName.toLowerCase()} specialists in {suburbName} using ABN, profile, public review, and referral signals where available.
                                {cost && ` Typical ${tradeName.toLowerCase()} rates in ${stateName} range from $${cost.low}–$${cost.high}${cost.unit}.`}
                            </p>
                            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4">
                                <Button asChild size="lg" className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold h-auto min-h-14 px-8 text-lg border-none w-full sm:w-auto whitespace-normal">
                                    <Link href={`/register?type=homeowner&job=${job}&suburb=${canonicalSuburb}`}>Request a Free {jobName} Quote</Link>
                                </Button>
                                <Button asChild variant="outline" size="lg" className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl font-bold h-14 px-8 text-lg w-full sm:w-auto">
                                    <Link href={businesses.length > 0 ? "#businesses" : broaderTradeHref}>See {businesses.length > 0 ? businesses.length : ''} Local Specialists</Link>
                                </Button>
                                <Link href="/register?type=business" className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/25 px-6 h-14 text-base font-bold text-white hover:bg-white/10 transition-colors w-full sm:w-auto">
                                    {tradeName} business? List it free →
                                </Link>
                            </div>
                        </div>
                        <aside className="hidden lg:block bg-white/5 border border-white/10 rounded-2xl p-8">
                            <p className="text-sm font-black text-orange-400 uppercase tracking-widest mb-3">Free quotes</p>
                            <h2 className="text-2xl font-black text-white mb-4 leading-snug">Get 2–3 quotes for {jobName.toLowerCase()}</h2>
                            {cost && (
                                <p className="text-lg text-zinc-300 mb-5">
                                    Typical range in {stateName}: <span className="font-black text-white">${cost.low}–${cost.high}{cost.unit}</span>
                                </p>
                            )}
                            <ul className="space-y-3 mb-6 text-base text-zinc-300">
                                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-orange-400 shrink-0" />ABN-checked local specialists</li>
                                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-orange-400 shrink-0" />Free, no obligation</li>
                                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-orange-400 shrink-0" />Takes about a minute</li>
                            </ul>
                            <Button asChild size="lg" className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold h-14 text-lg border-none">
                                <Link href={`/register?type=homeowner&job=${job}&suburb=${canonicalSuburb}`}>Start your quote request</Link>
                            </Button>
                        </aside>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 pt-16 pb-32 lg:pb-16">
                <div className="max-w-7xl mx-auto space-y-16">

                    {/* Business Listings */}
                    <section id="businesses">
                        <h2 className="text-2xl font-black text-zinc-900 mb-6">
                            {businesses.length > 0
                                ? `${businesses.length} Checked ${jobName} Specialists in ${suburbName}`
                                : `${jobName} Specialists Serving ${suburbName}`}
                        </h2>

                        {businesses.length > 0 ? (
                            <div className="space-y-4">
                                {businesses.map((biz: any, i: number) => {
                                    const rating = ((biz.trust_score || 0) / 20).toFixed(1);
                                    return (
                                        <Link key={biz.id} href={`/b/${biz.slug}`} className="group block">
                                            <div className="bg-white rounded-2xl border border-zinc-200 hover:border-orange-500 hover:shadow-lg transition-all duration-300 p-6">
                                                <div className="flex flex-col sm:flex-row items-start gap-4">
                                                    <BusinessLogo logoUrl={biz.logo_url || null} name={biz.business_name || "?"} size="md" photoUrls={biz.photo_urls} bgColor={biz.logo_bg_color} />
                                                    <div className="flex-1 min-w-0 w-full">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div>
                                                                <h3 className="font-black text-zinc-900 group-hover:text-orange-600 transition-colors text-xl leading-tight">
                                                                    {biz.business_name}
                                                                </h3>
                                                                <p className="text-base text-zinc-600 mt-0.5 flex items-center gap-1.5">
                                                                    <MapPin className="w-4 h-4" />
                                                                    {biz.suburb}{biz.city && String(biz.city).toLowerCase() !== String(biz.suburb).toLowerCase() ? `, ${biz.city}` : ""}
                                                                </p>
                                                            </div>
                                                            {i === 0 && (
                                                                <span className="shrink-0 bg-orange-100 text-orange-700 text-xs font-black px-2.5 py-1 rounded-full">
                                                                    #1 Ranked
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-4 mt-3 text-base text-zinc-600 font-medium">
                                                            {parseInt(biz.total_reviews) > 0 && (
                                                                <span className="flex items-center gap-1">
                                                                    <Star className="w-3 h-3 fill-orange-400 text-orange-400" />
                                                                    {parseFloat(biz.avg_rating).toFixed(1)} ({biz.total_reviews})
                                                                </span>
                                                            )}
                                                            {biz.referral_count > 0 && (
                                                                <span className="flex items-center gap-1">
                                                                    <Users className="w-3 h-3 text-blue-400" />
                                                                    {biz.referral_count} referral{biz.referral_count !== 1 ? 's' : ''}
                                                                </span>
                                                            )}
                                                            <span className="flex items-center gap-1" title="Business number verified as active">
                                                                <ShieldCheck className="w-3 h-3 text-green-400" />
                                                                ABN checked
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span className="shrink-0 mt-3 sm:mt-1 inline-flex items-center gap-1 text-base font-bold text-orange-600">View profile<ArrowRight className="w-4 h-4" /></span>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-zinc-50 rounded-3xl border border-dashed border-zinc-200 p-12 text-center">
                                <Wrench className="w-10 h-10 text-zinc-300 mx-auto mb-4" />
                                <h3 className="text-lg font-black text-zinc-600 mb-2">No listings yet in {suburbName}</h3>
                                <p className="text-zinc-600 text-base mb-6 max-w-xl mx-auto">No specialists listed in {suburbName} yet. Get quotes from {tradeName.toLowerCase()} businesses across {cityName} instead.</p>
                                <div className="flex flex-col sm:flex-row justify-center gap-3">
                                    <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold border-none">
                                        <Link href={`/register?type=homeowner&job=${job}&suburb=${canonicalSuburb}`}>Request a Free Quote</Link>
                                    </Button>
                                    <Button asChild variant="outline" className="rounded-xl font-bold">
                                        <Link href={`/local/${state}/${city}`}>Browse trades across {cityName}</Link>
                                    </Button>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Pricing */}
                    {cost && (
                        <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-10">
                            <h2 className="text-2xl font-black text-zinc-900 mb-2 flex items-center gap-2">
                                <DollarSign className="w-6 h-6 text-orange-500" />
                                How Much Does {jobName} Cost in {suburbName}?
                            </h2>
                            <p className="text-zinc-600 mb-6 text-base max-w-prose">
                                The following cost estimates are based on industry averages for {tradeName.toLowerCase()} work in {stateName}. Actual prices will vary based on the scope of work, materials required, and access. Always get 2–3 written quotes before proceeding.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                                    <p className="text-xs font-black text-zinc-400 uppercase tracking-wider mb-1">Typical Range</p>
                                    <p className="text-2xl font-black text-zinc-900">${cost.low}–${cost.high}</p>
                                    <p className="text-sm text-zinc-600">{cost.unit}</p>
                                </div>
                                <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                                    <p className="text-xs font-black text-zinc-400 uppercase tracking-wider mb-1">Emergency Rate</p>
                                    <p className="text-2xl font-black text-zinc-900">${Math.round(cost.high * 1.5)}</p>
                                    <p className="text-sm text-zinc-600">After-hours / urgent</p>
                                </div>
                                <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                                    <p className="text-xs font-black text-zinc-400 uppercase tracking-wider mb-1">Free Quotes</p>
                                    <p className="text-2xl font-black text-zinc-900">2–3</p>
                                    <p className="text-sm text-zinc-600">Always get multiple</p>
                                </div>
                            </div>
                            <p className="text-sm text-zinc-500">Price estimates only. Confirm scope, timing, and final cost with your chosen tradie before work begins.</p>
                        </section>
                    )}

                    {/* Inline quote CTA (post-cost readers are highest intent) */}
                    <section className="rounded-3xl bg-zinc-900 p-8 flex flex-wrap items-center justify-between gap-4">
                        <p className="text-xl font-black text-white m-0">Ready for exact prices? Get 2–3 free quotes for {jobName.toLowerCase()}.</p>
                        <Button asChild size="lg" className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold h-12 px-6 text-base border-none">
                            <Link href={`/register?type=homeowner&job=${job}&suburb=${canonicalSuburb}`}>Get Free Quotes</Link>
                        </Button>
                    </section>

                    {/* Materials */}
                    {jobMaterials.length > 0 && (
                        <JobMaterialsCard
                            jobName={jobName}
                            tradeNoun={TRADE_NOUNS[normalizeTradeName(tradeName)] || TRADE_NOUNS[tradeName] || `${tradeName}s`}
                            materials={jobMaterials}
                        />
                    )}

                    {/* Licensing */}
                    {licenceText && (
                        <section className="bg-blue-50 border border-blue-100 rounded-3xl p-6 flex gap-4">
                            <FileText className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-black text-zinc-900 mb-1">{tradeName} Licensing Requirements in {stateName}</h3>
                                <p className="text-base text-zinc-600 leading-relaxed max-w-prose">{licenceText}</p>
                            </div>
                        </section>
                    )}

                    {/* Related Jobs */}
                    {relatedJobs.length > 0 && (
                        <section className="bg-white rounded-3xl border border-zinc-200 p-8">
                            <h2 className="text-xl font-black text-zinc-900 mb-2">Other {tradeName} Services in {suburbName}</h2>
                            <p className="text-base text-zinc-600 mb-6">Also looking for related {tradeName.toLowerCase()} work in {suburbName}?</p>
                            <div className="flex flex-wrap gap-2">
                                {relatedJobs.map((j) => (
                                    <Link
                                        key={j}
                                        href={`/local/${state}/${city}/${canonicalSuburb}/${trade}/${jobToSlug(j)}`}
                                        className="capitalize inline-flex items-center px-3 py-1.5 bg-zinc-50 border border-zinc-100 rounded-full text-base font-bold text-zinc-600 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700 transition-colors"
                                    >
                                        {j}
                                    </Link>
                                ))}
                            </div>
                            <p className="mt-5 text-base">
                                <Link href="/costs" className="font-bold text-orange-600 hover:text-orange-700 transition-colors">
                                    See what every trade job costs in Australia →
                                </Link>
                            </p>
                        </section>
                    )}

                    {/* FAQ */}
                    {faqEntries.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-black text-zinc-900 mb-8">
                                Frequently Asked Questions About {jobName} in {suburbName}
                            </h2>
                            <div className="space-y-4">
                                {faqEntries.map((faq, i) => (
                                    <div key={i} className="bg-white rounded-2xl border border-zinc-200 p-6">
                                        <h3 className="font-bold text-zinc-900 mb-2 text-lg">{faq.q}</h3>
                                        <p className="text-base text-zinc-600 leading-relaxed max-w-prose">{faq.a}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Nearby Suburbs */}
                    {nearbySuburbs.length > 0 && (
                        <section className="bg-white rounded-3xl border border-zinc-200 p-8">
                            <h2 className="text-xl font-black text-zinc-900 mb-6 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-orange-500" />
                                {jobName} in Nearby Suburbs
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {nearbySuburbs.map((s: string) => (
                                    <Link
                                        key={s}
                                        href={`/local/${state}/${city}/${getCanonicalSuburbSlug(slugify(s), state)}/${trade}/${job}`}
                                        className="flex items-center justify-between px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl text-sm font-bold text-zinc-600 hover:bg-zinc-100 hover:text-orange-600 transition-colors"
                                    >
                                        <span>{s}</span>
                                        <ArrowRight className="w-3 h-3 text-zinc-300" />
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Back to Trade */}
                    <div className="pt-4 flex flex-wrap gap-3">
                        <Link
                            href={`/local/${state}/${city}/${canonicalSuburb}/${trade}`}
                            className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-orange-600 transition-colors"
                        >
                            <ChevronRight className="w-4 h-4 rotate-180" />
                            All {tradeName} in {suburbName}
                        </Link>
                        <span className="text-zinc-300">·</span>
                        <Link
                            href={`/local/${state}/${city}/${canonicalSuburb}`}
                            className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-orange-600 transition-colors"
                        >
                            All Trades in {suburbName}
                        </Link>
                    </div>
                </div>
            </div>

        <div className="fixed bottom-0 inset-x-0 z-40 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-white/95 backdrop-blur border-t border-zinc-200 lg:hidden">
            <Button asChild size="lg" className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold h-auto min-h-13 text-base border-none whitespace-normal">
                <Link href={`/register?type=homeowner&job=${job}&suburb=${canonicalSuburb}`}>Get Free {jobName} Quotes</Link>
            </Button>
        </div>
        </main>
        </>
    );
}
