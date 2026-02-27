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

                    {/* Logo + name row */}
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
                            {/* Breadcrumb */}
                            <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1.5">
                                <Link href="/businesses" className="hover:text-zinc-600 transition-colors">Directory</Link>
                                <span>/</span>
                                <span>{business.trade_category}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="px-2.5 py-0.5 bg-zinc-100 text-zinc-600 rounded text-xs font-bold uppercase tracking-wider">{business.trade_category}</span>
                                {business.is_verified && (
                                    <span className="flex items-center gap-1 px-2.5 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-bold">
                                        <BadgeCheck className="w-3 h-3" /> Verified
                                    </span>
                                )}
                                {trustScore && (
                                    <span className="flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-xs font-bold">
                                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {trustScore}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-2xl md:text-3xl font-black text-zinc-900 leading-tight">{business.business_name}</h1>
                            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-zinc-500">
                                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{business.suburb}{business.state ? `, ${business.state}` : ''}</span>
                                {business.service_radius_km && <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" />{business.service_radius_km}km radius</span>}
                                {business.years_experience && <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" />{business.years_experience}</span>}
                                {business.avg_response_minutes != null && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />Responds in {business.avg_response_minutes < 60 ? `< ${business.avg_response_minutes} min` : `< ${Math.ceil(business.avg_response_minutes / 60)} hrs`}</span>}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 pb-1">
                            <Button asChild variant="outline" className="rounded-lg border-zinc-200 font-semibold text-zinc-700 hover:border-zinc-400 hover:text-zinc-900 h-10 px-4 text-sm">
                                <Link href={`/b/${slug}/refer`}>Refer This Business</Link>
                            </Button>
                            <BookNowButton />
                        </div>
                    </div>

                    {/* Feature badge strip */}
                    {(allFeatures.length > 0 || business.specialties?.length > 0) && (
                        <div className="flex flex-wrap items-center gap-2 pb-3 border-t border-zinc-100 pt-3">
                            {allFeatures.map((f: string) => (
                                <span key={f} className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-50 border border-zinc-200 rounded-full text-xs font-semibold text-zinc-600">
                                    <CheckCircle2 className="w-3 h-3 text-green-500" /> {f}
                                </span>
                            ))}
                            {business.specialties?.map((s: string) => (
                                <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-50 border border-zinc-200 rounded-full text-xs font-semibold text-zinc-600">
                                    <Wrench className="w-3 h-3" /> {s}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── BODY ── */}
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* ── MAIN COLUMN ── */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* About */}
                        <section className="bg-white rounded-2xl border border-zinc-200 p-6">
                            <h2 className="text-base font-black text-zinc-900 mb-3">About {business.business_name}</h2>
                            <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap">
                                {business.description || `${business.business_name} is a premier ${business.trade_category} service provider in ${business.suburb}. We pride ourselves on quality workmanship and reliable service.`}
                            </p>
                        </section>

                        {/* Why Choose Us */}
                        {business.why_refer_us && (
                            <section className="bg-white rounded-2xl border border-zinc-200 p-6">
                                <h2 className="text-base font-black text-zinc-900 mb-3">Why Choose {business.business_name}</h2>
                                <p className="text-sm text-zinc-600 leading-relaxed">{business.why_refer_us}</p>
                            </section>
                        )}

                        {/* Services */}
                        {business.services && business.services.length > 0 && (
                            <section className="bg-white rounded-2xl border border-zinc-200 p-6">
                                <h2 className="text-base font-black text-zinc-900 mb-4">Services We Provide</h2>
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

                        {/* Work Gallery */}
                        {business.photo_urls && business.photo_urls.length > 0 && (
                            <section className="bg-white rounded-2xl border border-zinc-200 p-6">
                                <h2 className="text-base font-black text-zinc-900 mb-4">Our Work</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                                    {business.photo_urls.map((url: string, i: number) => (
                                        <div key={i} className="aspect-square rounded-xl overflow-hidden bg-zinc-100 group">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={url} alt={`${business.business_name} work photo ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Projects */}
                        {projects.length > 0 && (
                            <section className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
                                <h2 className="text-base font-black text-zinc-900">Recent Projects</h2>

                                {featuredProject && (
                                    <div className="relative overflow-hidden rounded-xl bg-zinc-900 text-white min-h-[260px] flex flex-col justify-end p-6">
                                        <div className="absolute inset-0">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={featuredProject.cover_photo_url || featuredProject.photo_urls?.[0] || 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=1000&auto=format&fit=crop'} alt={featuredProject.title} className="w-full h-full object-cover opacity-50" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                        </div>
                                        <div className="relative z-10">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                                                <Star className="w-3 h-3 fill-current" /> Featured
                                            </span>
                                            <h3 className="text-lg font-black mb-1">{featuredProject.title}</h3>
                                            <p className="text-zinc-300 text-sm leading-relaxed max-w-lg">{featuredProject.description}</p>
                                        </div>
                                    </div>
                                )}

                                {otherProjects.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {otherProjects.map((project: any) => (
                                            <div key={project.id} className="group bg-zinc-50 rounded-xl border border-zinc-100 overflow-hidden hover:border-zinc-300 transition-all">
                                                <div className="aspect-[16/9] overflow-hidden bg-zinc-200">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={project.cover_photo_url || project.photo_urls?.[0] || 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=1000&auto=format&fit=crop'} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                </div>
                                                <div className="p-4">
                                                    <h4 className="font-bold text-zinc-900 text-sm mb-1 line-clamp-1">{project.title}</h4>
                                                    <p className="text-xs text-zinc-500 line-clamp-2">{project.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        )}
                    </div>

                    {/* ── SIDEBAR ── */}
                    <div className="space-y-4 lg:sticky lg:top-24 self-start">

                        {/* Enquiry form */}
                        <div id="enquiry-form" className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm scroll-mt-24">
                            <div className="px-5 py-4 border-b border-zinc-100">
                                <h3 className="text-base font-black text-zinc-900">Get Your Free Quote</h3>
                                <p className="text-xs text-zinc-400 mt-0.5">Fast response · No obligation</p>
                            </div>
                            <div className="p-5">
                                <LeadForm businessName={business.business_name} businessId={business.id} referralCode={referralCode} />
                            </div>
                        </div>

                        {/* Business details */}
                        <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-3">
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Business Details</p>
                            <div className="space-y-2.5">
                                <div className="flex items-start gap-2.5">
                                    <MapPin className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
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
                                {business.avg_response_minutes != null && (
                                    <div className="flex items-center gap-2.5">
                                        <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
                                        <p className="text-sm text-zinc-700">Responds in {business.avg_response_minutes < 60 ? `< ${business.avg_response_minutes} min` : `< ${Math.ceil(business.avg_response_minutes / 60)} hrs`}</p>
                                    </div>
                                )}
                                {memberSinceYear && (
                                    <div className="flex items-center gap-2.5">
                                        <Calendar className="w-4 h-4 text-zinc-400 shrink-0" />
                                        <p className="text-sm text-zinc-500">Member since {memberSinceYear}</p>
                                    </div>
                                )}
                                {jobsCompleted > 0 && (
                                    <div className="flex items-center gap-2.5">
                                        <Zap className="w-4 h-4 text-zinc-400 shrink-0" />
                                        <p className="text-sm text-zinc-700">{jobsCompleted} jobs via TradeRefer</p>
                                    </div>
                                )}
                            </div>

                            {(business.business_phone || business.business_email || business.website) && (
                                <div className="pt-3 border-t border-zinc-100 space-y-2">
                                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Contact</p>
                                    {business.business_phone && (
                                        <a href={`tel:${business.business_phone}`} className="flex items-center gap-2.5 text-sm text-zinc-700 hover:text-zinc-900 transition-colors">
                                            <Phone className="w-4 h-4 text-zinc-400 shrink-0" />{business.business_phone}
                                        </a>
                                    )}
                                    {business.business_email && (
                                        <a href={`mailto:${business.business_email}`} className="flex items-center gap-2.5 text-sm text-zinc-700 hover:text-zinc-900 transition-colors">
                                            <Mail className="w-4 h-4 text-zinc-400 shrink-0" /><span className="break-all">{business.business_email}</span>
                                        </a>
                                    )}
                                    {business.website && (
                                        <a href={business.website.startsWith('http') ? business.website : `https://${business.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-zinc-700 hover:text-zinc-900 transition-colors">
                                            <Globe className="w-4 h-4 text-zinc-400 shrink-0" />Visit Website
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Refer CTA */}
                        <div className="bg-zinc-900 rounded-2xl p-5 text-white">
                            <h4 className="font-bold text-sm mb-1">Know someone who needs this?</h4>
                            <p className="text-zinc-400 text-xs mb-3 leading-relaxed">Refer {business.business_name} and earn a reward when the job is confirmed.</p>
                            <Button asChild className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold h-9 text-sm shadow-lg shadow-orange-500/20">
                                <Link href={`/b/${slug}/refer`}>Refer & Earn <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link>
                            </Button>
                        </div>

                        {/* Share */}
                        <div className="bg-white rounded-2xl border border-zinc-200 p-4">
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Share Profile</p>
                            <div className="flex gap-2">
                                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://traderefer.au/b/${slug}`)}`} target="_blank" rel="noopener noreferrer" className="flex-1 h-9 flex items-center justify-center bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg transition-colors text-zinc-500">
                                    <Facebook className="w-4 h-4" />
                                </a>
                                <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`https://traderefer.au/b/${slug}`)}&text=${encodeURIComponent(`Check out ${business.business_name}!`)}`} target="_blank" rel="noopener noreferrer" className="flex-1 h-9 flex items-center justify-center bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg transition-colors text-zinc-500">
                                    <Twitter className="w-4 h-4" />
                                </a>
                                <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://traderefer.au/b/${slug}`)}`} target="_blank" rel="noopener noreferrer" className="flex-1 h-9 flex items-center justify-center bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg transition-colors text-zinc-500">
                                    <Linkedin className="w-4 h-4" />
                                </a>
                                <button className="flex-1 h-9 flex items-center justify-center bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg transition-colors text-zinc-500">
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
