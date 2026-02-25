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
    Wrench
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

    return (
        <EditableProfile businessSlug={slug}>
        <main className="min-h-screen bg-white">
            {/* Premium Header/Hero */}
            <div className="bg-zinc-900 pt-24 pb-16 relative overflow-hidden">
                {business.cover_photo_url ? (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={business.cover_photo_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/80 to-zinc-900/40" />
                    </>
                ) : (
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-orange-500/10 blur-[120px] rounded-full" />
                )}
                <div className="container mx-auto px-4 relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                        <Link href="/businesses" className="inline-flex items-center gap-2 text-zinc-500 hover:text-orange-400 transition-colors group">
                            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-sm font-bold">Directory</span>
                        </Link>
                        <span className="text-zinc-700">·</span>
                        <Link href={`/b/${slug}/refer`} className="inline-flex items-center gap-2 text-zinc-500 hover:text-orange-400 transition-colors">
                            <span className="text-sm font-bold">Refer This Business</span>
                        </Link>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="w-32 h-32 md:w-40 md:h-40 bg-zinc-800 rounded-[40px] border border-zinc-700 flex items-center justify-center text-4xl font-black text-orange-500 shadow-2xl overflow-hidden relative">
                            {business.logo_url ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                    src={business.logo_url}
                                    alt={business.business_name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                business.business_name[0]
                            )}
                        </div>
                        <div className="text-center md:text-left flex-1">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                                <span className="px-4 py-1.5 bg-orange-500/10 text-orange-400 rounded-full text-sm font-bold uppercase tracking-widest border border-orange-500/20">
                                    {business.trade_category}
                                </span>
                                {business.is_verified && (
                                    <span className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-500/10 text-blue-400 rounded-full text-sm font-bold border border-blue-500/20">
                                        <Shield className="w-3.5 h-3.5" /> Verified Business
                                    </span>
                                )}
                                {(business.trusted_by_referrers > 0 || business.trusted_by_businesses > 0) && (
                                    <span className="flex items-center gap-1.5 px-4 py-1.5 bg-green-500/10 text-green-400 rounded-full text-sm font-bold border border-green-500/20">
                                        <Users className="w-3.5 h-3.5" /> Trusted by {business.trusted_by_referrers + business.trusted_by_businesses}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-white mb-4 font-display">
                                {business.business_name}
                            </h1>
                            <Link href="/businesses" className="inline-flex items-center gap-2 text-zinc-500 hover:text-orange-600 mb-10 transition-colors group">
                                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                <span className="text-sm font-bold">Back to Directory</span>
                            </Link>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-zinc-400 font-medium">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-orange-500" />
                                    {business.suburb}, {business.state}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                    {business.trust_score / 20} / 5.0 Trust Score
                                </div>
                                {business.website && (
                                    <div className="flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-blue-500" />
                                        <a href={business.website.startsWith('http') ? business.website : `https://${business.website}`} target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">
                                            Visit Website
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 w-full md:w-auto">
                            <BookNowButton />
                        </div>
                    </div>
                </div>
            </div>

            {/* Badges Bar — Service Seeking inspired */}
            <div className="border-b border-zinc-100 bg-white">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex flex-wrap items-center gap-3">
                        {business.years_experience && (
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full text-sm font-bold text-amber-700">
                                <Award className="w-4 h-4" /> {business.years_experience}
                            </span>
                        )}
                        {business.avg_response_minutes != null && (
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-sm font-bold text-blue-700">
                                <Clock className="w-4 h-4" /> Responds in {business.avg_response_minutes < 60 ? `< ${business.avg_response_minutes} min` : `< ${Math.ceil(business.avg_response_minutes / 60)} hrs`}
                            </span>
                        )}
                        {business.is_verified && (
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full text-sm font-bold text-green-700">
                                <Shield className="w-4 h-4" /> ABN Verified
                            </span>
                        )}
                        {(business.trusted_by_referrers > 0 || business.trusted_by_businesses > 0) && (
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-full text-sm font-bold text-purple-700">
                                <Users className="w-4 h-4" /> Trusted by {business.trusted_by_referrers + business.trusted_by_businesses}
                            </span>
                        )}
                        {business.specialties && business.specialties.length > 0 && business.specialties.map((s: string) => (
                            <span key={s} className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-full text-sm font-bold text-orange-700">
                                <Wrench className="w-4 h-4" /> {s}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Profile Content */}
            <div className="container mx-auto px-4 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 space-y-12">
                        {/* About Us */}
                        <section>
                            <h2 className="text-2xl font-bold text-zinc-900 mb-6 font-display flex items-center gap-3">
                                <span className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center text-sm">01</span>
                                About Us
                            </h2>
                            <p className="text-lg text-zinc-600 leading-relaxed max-w-3xl whitespace-pre-wrap">
                                {business.description || `${business.business_name} is a premier ${business.trade_category} service provider in ${business.suburb}. We pride ourselves on quality workmanship and reliable service.`}
                            </p>
                        </section>

                        {/* Why Refer Us */}
                        {business.why_refer_us && (
                            <section className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-[32px] p-8 md:p-10 border border-orange-100">
                                <h2 className="text-2xl font-bold text-zinc-900 mb-4 font-display flex items-center gap-3">
                                    <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-sm text-orange-600">
                                        <Star className="w-4 h-4" />
                                    </span>
                                    Why Choose {business.business_name}
                                </h2>
                                <p className="text-lg text-zinc-700 leading-relaxed font-medium">{business.why_refer_us}</p>
                            </section>
                        )}

                        {/* Services We Provide */}
                        {business.services && business.services.length > 0 && (
                            <section>
                                <h2 className="text-2xl font-bold text-zinc-900 mb-6 font-display flex items-center gap-3">
                                    <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-sm text-orange-600">
                                        <Briefcase className="w-4 h-4" />
                                    </span>
                                    Services We Provide
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {business.services.map((service: string) => (
                                        <div key={service} className="flex items-center gap-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all">
                                            <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0" />
                                            <span className="font-medium text-zinc-800">{service}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Business Highlights */}
                        <section className="bg-zinc-50 rounded-[40px] p-8 md:p-12 border border-zinc-100">
                            <h2 className="text-2xl font-bold text-zinc-900 mb-8 font-display">Why Choose Us</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {(business.features && business.features.length > 0 ? business.features :
                                    business.business_highlights && business.business_highlights.length > 0 ? business.business_highlights :
                                    ["Locally Owned", "Verified Reviews", "Flexible Hours", "TradeRefer Trusted"]
                                ).map((feature: string) => (
                                    <div key={feature} className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
                                        <CheckCircle2 className="w-6 h-6 text-green-500 mb-3" />
                                        <h4 className="font-bold text-zinc-900">{feature}</h4>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Business Photo Gallery (photo_urls from onboarding) */}
                        {business.photo_urls && business.photo_urls.length > 0 && (
                            <section>
                                <h2 className="text-2xl font-bold text-zinc-900 mb-6 font-display flex items-center gap-3">
                                    <span className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-sm text-amber-600">
                                        <ImageIcon className="w-4 h-4" />
                                    </span>
                                    Our Work
                                </h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {business.photo_urls.map((url: string, i: number) => (
                                        <div key={i} className="aspect-square rounded-3xl overflow-hidden border border-zinc-100 shadow-sm group relative bg-zinc-50">
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

                        {/* Projects Gallery Section */}
                        {projects.length > 0 && (
                            <section className="space-y-12">
                                <h2 className="text-3xl font-black text-zinc-900 font-display flex items-center gap-4">
                                    <span className="w-10 h-10 bg-purple-500/10 text-purple-600 rounded-2xl flex items-center justify-center text-lg shadow-sm">
                                        <ImageIcon className="w-5 h-5 outline-none" />
                                    </span>
                                    Our Recent Projects
                                </h2>

                                {/* Featured Project */}
                                {featuredProject && (
                                    <div className="group relative overflow-hidden rounded-[32px] sm:rounded-[48px] bg-zinc-900 text-white min-h-[400px] md:min-h-[500px] flex flex-col justify-end p-6 md:p-12 shadow-2xl transition-all hover:scale-[1.01] border border-white/5">
                                        <div className="absolute inset-0 z-0">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={featuredProject.cover_photo_url || featuredProject.photo_urls?.[0] || 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=1000&auto=format&fit=crop'}
                                                alt={featuredProject.title}
                                                className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                                        </div>

                                        <div className="relative z-10 space-y-4 max-w-2xl">
                                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-500 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-500/30 mb-2">
                                                <Star className="w-3.5 h-3.5 fill-current" /> Featured Project
                                            </div>
                                            <h3 className="text-4xl md:text-5xl font-black font-display leading-tight">{featuredProject.title}</h3>
                                            <p className="text-lg text-zinc-300 leading-relaxed max-w-xl">{featuredProject.description}</p>

                                            <div className="flex flex-wrap gap-3 pt-4">
                                                {featuredProject.photo_urls?.slice(0, 4).map((url: string, i: number) => (
                                                    <div key={i} className="w-20 h-20 rounded-2xl overflow-hidden border border-white/20 shadow-lg relative group/thumb">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={url} alt="work snippet" className="w-full h-full object-cover opacity-80 group-hover/thumb:opacity-100 transition-opacity" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Other Projects Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {otherProjects.map((project: any) => (
                                        <div key={project.id} className="group flex flex-col bg-white rounded-[40px] border border-zinc-100 overflow-hidden shadow-sm hover:shadow-xl hover:border-orange-100 transition-all duration-500">
                                            <div className="aspect-[16/10] relative overflow-hidden">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={project.cover_photo_url || project.photo_urls?.[0] || 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=1000&auto=format&fit=crop'}
                                                    alt={project.title}
                                                    className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-110 duration-700"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500" />
                                            </div>
                                            <div className="p-8 space-y-3 flex-1 flex flex-col">
                                                <h4 className="text-2xl font-black text-zinc-900 group-hover:text-orange-600 transition-colors line-clamp-1">{project.title}</h4>
                                                <p className="text-zinc-500 line-clamp-2 leading-relaxed flex-1">{project.description}</p>

                                                <div className="flex items-center gap-2 pt-6">
                                                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{project.photo_urls?.length || 0} Photos</span>
                                                    <div className="h-px flex-1 bg-zinc-100" />
                                                    <ChevronRight className="w-5 h-5 text-orange-500 group-hover:translate-x-2 transition-transform" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    <div className="space-y-6">
                        {/* Enquiry Form — sticky sidebar */}
                        <div id="enquiry-form" className="bg-white rounded-[40px] border border-zinc-200 p-8 shadow-lg shadow-zinc-200/50 lg:sticky lg:top-24 scroll-mt-24">
                            <h3 className="text-xl font-bold text-zinc-900 mb-6 font-display">Get Your Free Quote</h3>
                            <LeadForm
                                businessName={business.business_name}
                                businessId={business.id}
                                referralCode={referralCode}
                            />
                        </div>

                        {/* Service Area */}
                        <div className="p-6 bg-zinc-900 rounded-[32px] text-white">
                            <div className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3">Service Area</div>
                            <div className="text-xl font-bold mb-1">{business.suburb}{business.state ? `, ${business.state}` : ''}</div>
                            <p className="text-zinc-400 text-base">{business.service_radius_km}km surrounding radius</p>
                            {business.years_experience && (
                                <div className="mt-4 pt-4 border-t border-zinc-700">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Award className="w-4 h-4 text-amber-400" />
                                        <span className="text-zinc-300 font-medium">{business.years_experience} experience</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Contact Info */}
                        {(business.business_phone || business.business_email || business.website) && (
                            <div className="bg-white rounded-[32px] border border-zinc-200 p-6 space-y-4">
                                <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Contact</div>
                                {business.business_phone && (
                                    <a href={`tel:${business.business_phone}`} className="flex items-center gap-3 text-zinc-700 hover:text-orange-600 transition-colors">
                                        <Phone className="w-4 h-4 text-orange-500" />
                                        <span className="font-medium">{business.business_phone}</span>
                                    </a>
                                )}
                                {business.business_email && (
                                    <a href={`mailto:${business.business_email}`} className="flex items-center gap-3 text-zinc-700 hover:text-orange-600 transition-colors">
                                        <Mail className="w-4 h-4 text-orange-500" />
                                        <span className="font-medium text-sm break-all">{business.business_email}</span>
                                    </a>
                                )}
                                {business.website && (
                                    <a href={business.website.startsWith('http') ? business.website : `https://${business.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-zinc-700 hover:text-orange-600 transition-colors">
                                        <Globe className="w-4 h-4 text-orange-500" />
                                        <span className="font-medium text-sm">Visit Website</span>
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Share */}
                        <div className="bg-zinc-50 rounded-[40px] p-8 text-center border border-zinc-100">
                            <h4 className="font-bold text-zinc-900 mb-4 font-display">Share this Profile</h4>
                            <div className="flex justify-center gap-2">
                                <Button asChild variant="outline" size="icon" className="rounded-full w-12 h-12 bg-white border-zinc-200 text-zinc-600 hover:text-orange-500 hover:border-orange-200 shadow-sm transition-all hover:scale-110">
                                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://traderefer.au/b/${slug}`)}`} target="_blank" rel="noopener noreferrer">
                                        <Facebook className="w-5 h-5" />
                                    </a>
                                </Button>
                                <Button asChild variant="outline" size="icon" className="rounded-full w-12 h-12 bg-white border-zinc-200 text-zinc-600 hover:text-orange-500 hover:border-orange-200 shadow-sm transition-all hover:scale-110">
                                    <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`https://traderefer.au/b/${slug}`)}&text=${encodeURIComponent(`Need a verified ${business.trade_category}? Check out ${business.business_name}!`)}`} target="_blank" rel="noopener noreferrer">
                                        <Twitter className="w-5 h-5" />
                                    </a>
                                </Button>
                                <Button asChild variant="outline" size="icon" className="rounded-full w-12 h-12 bg-white border-zinc-200 text-zinc-600 hover:text-orange-500 hover:border-orange-200 shadow-sm transition-all hover:scale-110">
                                    <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://traderefer.au/b/${slug}`)}`} target="_blank" rel="noopener noreferrer">
                                        <Linkedin className="w-5 h-5" />
                                    </a>
                                </Button>
                                <Button variant="outline" size="icon" className="rounded-full w-12 h-12 bg-white border-zinc-200 text-zinc-600 hover:text-orange-500 hover:border-orange-200 shadow-sm transition-all hover:scale-110">
                                    <Share2 className="w-5 h-5" />
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
