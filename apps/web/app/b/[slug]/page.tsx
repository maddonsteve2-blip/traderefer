import { Button } from "@/components/ui/button";
import {
    Shield,
    Star,
    MapPin,
    Phone,
    Mail,
    Globe,
    ChevronLeft,
    ChevronRight,
    Facebook,
    Twitter,
    Linkedin,
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
    TrendingUp
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LeadForm } from "@/components/LeadForm";
import { BookNowButton } from "@/components/BookNowButton";
import { EditableProfile } from "@/components/EditableProfile";

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
    const business = await getBusiness(slug);
    const projects = await getProjects(slug);

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

    const trustScore = business.trust_score ? (business.trust_score / 20).toFixed(1) : null;

    return (
        <EditableProfile businessSlug={slug}>
        <main className="min-h-screen bg-zinc-50">

            {/* ── HERO COVER ─────────────────────────────────────── */}
            {business.cover_photo_url && (
                <div className="w-full h-52 md:h-72 relative overflow-hidden bg-zinc-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={business.cover_photo_url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/60 to-transparent" />
                </div>
            )}

            {/* ── PROFILE HEADER ─────────────────────────────────── */}
            <div className={`bg-white border-b border-zinc-200 ${business.cover_photo_url ? "-mt-16 relative z-10" : "pt-20 border-t"}`}>
                <div className="container mx-auto px-4 pt-0 pb-6">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 pt-4 pb-4 text-sm">
                        <Link href="/businesses" className="text-zinc-400 hover:text-orange-500 font-medium transition-colors">Directory</Link>
                        <span className="text-zinc-300">/</span>
                        <span className="text-zinc-400 font-medium">{business.trade_category}</span>
                        <span className="text-zinc-300">/</span>
                        <span className="text-zinc-600 font-semibold truncate">{business.business_name}</span>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end gap-6">
                        {/* Logo */}
                        <div className={`w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-white border-4 border-white shadow-xl overflow-hidden shrink-0 flex items-center justify-center ${business.cover_photo_url ? "-mt-12" : ""}`}>
                            {business.logo_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={business.logo_url} alt={business.business_name} className="w-full h-full object-contain" />
                            ) : (
                                <span className="text-3xl font-black text-orange-500">{business.business_name[0]}</span>
                            )}
                        </div>

                        {/* Name + meta */}
                        <div className="flex-1 min-w-0 pb-2">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-black uppercase tracking-widest">
                                    {business.trade_category}
                                </span>
                                {business.is_verified && (
                                    <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                        <BadgeCheck className="w-3.5 h-3.5" /> Verified
                                    </span>
                                )}
                                {trustScore && (
                                    <span className="flex items-center gap-1 px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-bold border border-yellow-200">
                                        <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" /> {trustScore} Trust Score
                                    </span>
                                )}
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight font-display leading-tight">
                                {business.business_name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-zinc-500 font-medium">
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4 text-orange-500" />
                                    {business.suburb}{business.state ? `, ${business.state}` : ''}
                                </span>
                                {business.service_radius_km && (
                                    <span className="flex items-center gap-1.5">
                                        <TrendingUp className="w-4 h-4 text-zinc-400" />
                                        {business.service_radius_km}km radius
                                    </span>
                                )}
                                {business.years_experience && (
                                    <span className="flex items-center gap-1.5">
                                        <Award className="w-4 h-4 text-amber-500" />
                                        {business.years_experience}
                                    </span>
                                )}
                                {business.avg_response_minutes != null && (
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4 text-blue-500" />
                                        Responds in {business.avg_response_minutes < 60 ? `< ${business.avg_response_minutes} min` : `< ${Math.ceil(business.avg_response_minutes / 60)} hrs`}
                                    </span>
                                )}
                                {business.website && (
                                    <a href={business.website.startsWith('http') ? business.website : `https://${business.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-orange-600 transition-colors">
                                        <Globe className="w-4 h-4 text-blue-500" /> Website
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* CTAs */}
                        <div className="flex items-center gap-3 shrink-0 pb-2">
                            <Button asChild variant="outline" className="rounded-full border-zinc-200 font-bold text-zinc-700 hover:border-orange-300 hover:text-orange-600 h-11 px-5">
                                <Link href={`/b/${slug}/refer`}>Refer This Business</Link>
                            </Button>
                            <BookNowButton />
                        </div>
                    </div>
                </div>

                {/* ── TRUST BADGE STRIP ── */}
                {(allFeatures.length > 0 || business.specialties?.length > 0) && (
                    <div className="border-t border-zinc-100 bg-zinc-50/70">
                        <div className="container mx-auto px-4 py-3">
                            <div className="flex flex-wrap items-center gap-2">
                                {allFeatures.map((f: string) => (
                                    <span key={f} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200 rounded-full text-xs font-bold text-zinc-600 shadow-sm">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> {f}
                                    </span>
                                ))}
                                {business.specialties?.map((s: string) => (
                                    <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-orange-200 rounded-full text-xs font-bold text-orange-700 shadow-sm">
                                        <Wrench className="w-3.5 h-3.5" /> {s}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── MAIN CONTENT ───────────────────────────────────── */}
            <div className="container mx-auto px-4 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* ── LEFT / MAIN COLUMN ── */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* About Us */}
                        <section className="bg-white rounded-3xl border border-zinc-200 p-8 shadow-sm">
                            <h2 className="text-xl font-black text-zinc-900 mb-4 flex items-center gap-3">
                                <span className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
                                    <Briefcase className="w-4 h-4 text-orange-600" />
                                </span>
                                About {business.business_name}
                            </h2>
                            <p className="text-base text-zinc-600 leading-relaxed whitespace-pre-wrap">
                                {business.description || `${business.business_name} is a premier ${business.trade_category} service provider in ${business.suburb}. We pride ourselves on quality workmanship and reliable service.`}
                            </p>
                        </section>

                        {/* Why Choose Us */}
                        {business.why_refer_us && (
                            <section className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-3xl p-8 shadow-lg shadow-orange-200">
                                <h2 className="text-xl font-black text-white mb-3 flex items-center gap-3">
                                    <span className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                                        <Star className="w-4 h-4 text-white" />
                                    </span>
                                    Why Choose {business.business_name}
                                </h2>
                                <p className="text-orange-50 leading-relaxed text-base font-medium">{business.why_refer_us}</p>
                            </section>
                        )}

                        {/* Services */}
                        {business.services && business.services.length > 0 && (
                            <section className="bg-white rounded-3xl border border-zinc-200 p-8 shadow-sm">
                                <h2 className="text-xl font-black text-zinc-900 mb-5 flex items-center gap-3">
                                    <span className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                                        <Wrench className="w-4 h-4 text-blue-600" />
                                    </span>
                                    Services We Provide
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {business.services.map((service: string) => (
                                        <div key={service} className="flex items-center gap-3 px-4 py-3 bg-zinc-50 rounded-xl border border-zinc-100 hover:bg-orange-50 hover:border-orange-200 transition-all group">
                                            <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center shrink-0 group-hover:bg-orange-500 transition-colors">
                                                <CheckCircle2 className="w-3 h-3 text-orange-500 group-hover:text-white transition-colors" />
                                            </div>
                                            <span className="text-sm font-semibold text-zinc-700 group-hover:text-zinc-900">{service}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Work Gallery */}
                        {business.photo_urls && business.photo_urls.length > 0 && (
                            <section className="bg-white rounded-3xl border border-zinc-200 p-8 shadow-sm">
                                <h2 className="text-xl font-black text-zinc-900 mb-5 flex items-center gap-3">
                                    <span className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                                        <ImageIcon className="w-4 h-4 text-amber-600" />
                                    </span>
                                    Our Work
                                </h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {business.photo_urls.map((url: string, i: number) => (
                                        <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-zinc-100 group">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={url}
                                                alt={`${business.business_name} work photo ${i + 1}`}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Projects */}
                        {projects.length > 0 && (
                            <section className="space-y-6">
                                <h2 className="text-xl font-black text-zinc-900 flex items-center gap-3">
                                    <span className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
                                        <ImageIcon className="w-4 h-4 text-purple-600" />
                                    </span>
                                    Recent Projects
                                </h2>

                                {featuredProject && (
                                    <div className="group relative overflow-hidden rounded-3xl bg-zinc-900 text-white min-h-[320px] flex flex-col justify-end p-7 shadow-xl">
                                        <div className="absolute inset-0">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={featuredProject.cover_photo_url || featuredProject.photo_urls?.[0] || 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=1000&auto=format&fit=crop'}
                                                alt={featuredProject.title}
                                                className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                                        </div>
                                        <div className="relative z-10">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500 rounded-full text-xs font-black uppercase tracking-widest mb-3">
                                                <Star className="w-3 h-3 fill-current" /> Featured
                                            </span>
                                            <h3 className="text-2xl font-black font-display mb-1">{featuredProject.title}</h3>
                                            <p className="text-zinc-300 text-sm leading-relaxed max-w-lg">{featuredProject.description}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {otherProjects.map((project: any) => (
                                        <div key={project.id} className="group bg-white rounded-3xl border border-zinc-100 overflow-hidden shadow-sm hover:shadow-lg hover:border-orange-100 transition-all duration-300">
                                            <div className="aspect-[16/9] relative overflow-hidden bg-zinc-100">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={project.cover_photo_url || project.photo_urls?.[0] || 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=1000&auto=format&fit=crop'}
                                                    alt={project.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            </div>
                                            <div className="p-5">
                                                <h4 className="font-black text-zinc-900 group-hover:text-orange-600 transition-colors mb-1 line-clamp-1">{project.title}</h4>
                                                <p className="text-sm text-zinc-500 line-clamp-2 leading-relaxed">{project.description}</p>
                                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100">
                                                    <span className="text-xs font-bold text-zinc-400">{project.photo_urls?.length || 0} photos</span>
                                                    <ChevronRight className="w-4 h-4 text-orange-500 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* ── RIGHT SIDEBAR ── */}
                    <div className="space-y-5">

                        {/* Enquiry Card — sticky */}
                        <div id="enquiry-form" className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-lg shadow-zinc-200/50 lg:sticky lg:top-24 scroll-mt-24">
                            <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-5">
                                <h3 className="text-lg font-black text-white">Get Your Free Quote</h3>
                                <p className="text-orange-100 text-sm mt-0.5">Fast response · No obligation</p>
                            </div>
                            <div className="p-6">
                                <LeadForm
                                    businessName={business.business_name}
                                    businessId={business.id}
                                    referralCode={referralCode}
                                />
                            </div>
                        </div>

                        {/* Business Info Card */}
                        <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-sm space-y-4">
                            <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Business Details</h4>

                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold text-zinc-800">{business.suburb}{business.state ? `, ${business.state}` : ''}</p>
                                        <p className="text-xs text-zinc-400">{business.service_radius_km}km service radius</p>
                                    </div>
                                </div>
                                {business.years_experience && (
                                    <div className="flex items-center gap-3">
                                        <Award className="w-4 h-4 text-amber-500 shrink-0" />
                                        <p className="text-sm font-bold text-zinc-800">{business.years_experience} experience</p>
                                    </div>
                                )}
                                {business.avg_response_minutes != null && (
                                    <div className="flex items-center gap-3">
                                        <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                                        <p className="text-sm font-bold text-zinc-800">
                                            Responds {business.avg_response_minutes < 60 ? `in < ${business.avg_response_minutes} min` : `in < ${Math.ceil(business.avg_response_minutes / 60)} hrs`}
                                        </p>
                                    </div>
                                )}
                                {memberSinceYear && (
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-4 h-4 text-zinc-400 shrink-0" />
                                        <p className="text-sm font-medium text-zinc-600">Member since {memberSinceYear}</p>
                                    </div>
                                )}
                                {jobsCompleted > 0 && (
                                    <div className="flex items-center gap-3">
                                        <Zap className="w-4 h-4 text-green-500 shrink-0" />
                                        <p className="text-sm font-bold text-zinc-800">{jobsCompleted} jobs completed via TradeRefer</p>
                                    </div>
                                )}
                            </div>

                            {/* Contact */}
                            {(business.business_phone || business.business_email || business.website) && (
                                <div className="pt-3 border-t border-zinc-100 space-y-2.5">
                                    <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Contact</p>
                                    {business.business_phone && (
                                        <a href={`tel:${business.business_phone}`} className="flex items-center gap-3 text-sm font-semibold text-zinc-700 hover:text-orange-600 transition-colors">
                                            <Phone className="w-4 h-4 text-orange-500 shrink-0" />
                                            {business.business_phone}
                                        </a>
                                    )}
                                    {business.business_email && (
                                        <a href={`mailto:${business.business_email}`} className="flex items-center gap-3 text-sm font-semibold text-zinc-700 hover:text-orange-600 transition-colors">
                                            <Mail className="w-4 h-4 text-orange-500 shrink-0" />
                                            <span className="break-all">{business.business_email}</span>
                                        </a>
                                    )}
                                    {business.website && (
                                        <a href={business.website.startsWith('http') ? business.website : `https://${business.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm font-semibold text-zinc-700 hover:text-orange-600 transition-colors">
                                            <Globe className="w-4 h-4 text-orange-500 shrink-0" />
                                            Visit Website
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Refer CTA */}
                        <div className="bg-zinc-900 rounded-3xl p-6 text-white">
                            <div className="w-10 h-10 bg-orange-500/20 rounded-2xl flex items-center justify-center mb-4">
                                <Users className="w-5 h-5 text-orange-400" />
                            </div>
                            <h4 className="font-black text-lg mb-1">Know someone who needs this?</h4>
                            <p className="text-zinc-400 text-sm mb-4 leading-relaxed">Refer {business.business_name} and earn a reward when the job is confirmed.</p>
                            <Button asChild className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full font-bold h-11 shadow-lg shadow-orange-500/30">
                                <Link href={`/b/${slug}/refer`}>Refer & Earn <ArrowRight className="w-4 h-4 ml-1" /></Link>
                            </Button>
                        </div>

                        {/* Share */}
                        <div className="bg-white rounded-3xl border border-zinc-200 p-5 shadow-sm">
                            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">Share Profile</p>
                            <div className="flex gap-2">
                                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://traderefer.au/b/${slug}`)}`} target="_blank" rel="noopener noreferrer"
                                    className="flex-1 h-10 flex items-center justify-center bg-zinc-50 hover:bg-blue-50 border border-zinc-200 hover:border-blue-300 rounded-xl transition-colors text-zinc-500 hover:text-blue-600">
                                    <Facebook className="w-4 h-4" />
                                </a>
                                <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`https://traderefer.au/b/${slug}`)}&text=${encodeURIComponent(`Need a verified ${business.trade_category}? Check out ${business.business_name}!`)}`} target="_blank" rel="noopener noreferrer"
                                    className="flex-1 h-10 flex items-center justify-center bg-zinc-50 hover:bg-sky-50 border border-zinc-200 hover:border-sky-300 rounded-xl transition-colors text-zinc-500 hover:text-sky-600">
                                    <Twitter className="w-4 h-4" />
                                </a>
                                <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://traderefer.au/b/${slug}`)}`} target="_blank" rel="noopener noreferrer"
                                    className="flex-1 h-10 flex items-center justify-center bg-zinc-50 hover:bg-blue-50 border border-zinc-200 hover:border-blue-300 rounded-xl transition-colors text-zinc-500 hover:text-blue-700">
                                    <Linkedin className="w-4 h-4" />
                                </a>
                                <button className="flex-1 h-10 flex items-center justify-center bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl transition-colors text-zinc-500">
                                    <Share2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </main>
        </EditableProfile>
    );
}
