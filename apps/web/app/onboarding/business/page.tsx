"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Building2,
    MapPin,
    Phone,
    Briefcase,
    ChevronRight,
    ChevronLeft,
    CheckCircle2,
    Globe,
    Check,
    AlertCircle,
    Loader2,
    Mail,
    TrendingUp,
    Shield,
    Camera,
    Image as ImageIcon,
    X
} from "lucide-react";
import { Logo } from "@/components/Logo";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { WelcomeTour } from "@/components/onboarding/WelcomeTour";
import { ImageUpload } from "@/components/ImageUpload";
import { TRADE_CATEGORIES } from "@/lib/constants";

export default function BusinessOnboardingPage() {
    const [step, setStep] = useState(1);
    const [showTour, setShowTour] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const { getToken } = useAuth();
    const [formData, setFormData] = useState({
        business_name: "",
        trade_category: "Plumbing",
        description: "",
        suburb: "",
        state: "VIC",
        business_phone: "",
        business_email: "",
        website: "",
        slug: "",
        service_radius_km: 25,
        referral_fee_cents: 1000
    });
    const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [photoUrls, setPhotoUrls] = useState<string[]>([]);
    const [isUploadingMedia, setIsUploadingMedia] = useState(false);
    const router = useRouter();

    const checkSlug = async (val: string) => {
        if (!val) {
            setSlugStatus('idle');
            return;
        }
        setSlugStatus('checking');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/business/check-slug/${val}`);
            const data = await res.json();
            setSlugStatus(data.available ? 'available' : 'taken');
        } catch (err) {
            setSlugStatus('idle');
        }
    };

    const handleLogoUpload = (urls: string[]) => {
        if (urls.length > 0) {
            setLogoUrl(urls[urls.length - 1]);
        }
    };

    const handlePhotosUpload = (urls: string[]) => {
        setPhotoUrls(urls);
    };

    const handleNext = async () => {
        if (step === 1 && slugStatus === 'taken') {
            toast.error("This URL handle is already taken. Please choose another one.");
            return;
        }

        if (step < 4) {
            if (step === 3) {
                setIsLoading(true);
                try {
                    const token = await getToken();
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/business/onboarding`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            ...formData,
                            logo_url: logoUrl,
                            photo_urls: photoUrls
                        })
                    });

                    if (!res.ok) {
                        const errData = await res.json();
                        throw new Error(errData.detail || 'Onboarding failed');
                    }

                    setStep(4);
                } catch (err: any) {
                    toast.error(err.message);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setStep(step + 1);
            }
        } else if (step === 4) {
            router.push("/dashboard/business");
        }
    };

    if (showTour) {
        return <WelcomeTour type="business" onComplete={() => setShowTour(false)} />;
    }

    return (
        <main className="min-h-screen bg-white flex flex-col">
            {/* Simple Header */}
            <header className="p-6 flex justify-between items-center border-b border-zinc-100 bg-white sticky top-0 z-50">
                <Link href="/">
                    <Logo size="sm" />
                </Link>
                <Link href="/support" className="text-sm font-bold text-zinc-400 hover:text-zinc-900 transition-colors">
                    Contact Support
                </Link>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center py-20 px-4">
                <div className={`w-full transition-all duration-500 ${step === 3 ? 'max-w-4xl' : 'max-w-xl'}`}>
                    {/* Progress Bar */}
                    <div className="flex items-center gap-2 mb-12">
                        {[1, 2, 3, 4].map((s) => (
                            <div key={s} className="flex-1 h-1.5 rounded-full overflow-hidden bg-zinc-100">
                                <div className={`h-full transition-all duration-500 ${s <= step ? 'bg-orange-500' : 'bg-transparent'}`} />
                            </div>
                        ))}
                        <span className="ml-4 text-sm font-black text-zinc-400 uppercase tracking-widest whitespace-nowrap">Step {step} of 4</span>
                    </div>

                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {step === 1 ? (
                            <>
                                <div>
                                    <h1 className="text-4xl font-black text-zinc-900 mb-3 tracking-tight font-display">
                                        Tell us about your business
                                    </h1>
                                    <p className="text-lg text-zinc-500 font-medium leading-relaxed">
                                        These details will appear on your public profile and help match you with the right leads.
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-zinc-50 p-6 rounded-[32px] border border-zinc-100 space-y-6">
                                        <div>
                                            <label className="block text-sm font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <Building2 className="w-3.5 h-3.5" /> Business Name
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.business_name}
                                                onChange={(e) => {
                                                    const name = e.target.value;
                                                    setFormData(prev => {
                                                        const newData = { ...prev, business_name: name };
                                                        if (!slugManuallyEdited) {
                                                            const autoSlug = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
                                                            newData.slug = autoSlug;
                                                            checkSlug(autoSlug);
                                                        }
                                                        return newData;
                                                    });
                                                }}
                                                placeholder="e.g. Bob's Plumbing & Gas"
                                                className="w-full px-6 py-4 bg-white border border-zinc-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-lg font-medium placeholder:text-zinc-300"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <Globe className="w-3.5 h-3.5" /> Public Handle (Slug)
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={formData.slug}
                                                    onChange={(e) => {
                                                        const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
                                                        setSlugManuallyEdited(true);
                                                        setFormData({ ...formData, slug: val });
                                                        checkSlug(val);
                                                    }}
                                                    placeholder="your-business-handle"
                                                    className={`w-full px-6 py-4 bg-white border rounded-2xl focus:outline-none focus:ring-4 transition-all text-lg font-medium placeholder:text-zinc-300 ${slugStatus === 'available' ? 'border-green-200 focus:ring-green-500/10' :
                                                        slugStatus === 'taken' ? 'border-red-200 focus:ring-red-500/10' :
                                                            'border-zinc-200 focus:ring-orange-500/10'
                                                        }`}
                                                />
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                    {slugStatus === 'checking' && <Loader2 className="w-5 h-5 text-zinc-300 animate-spin" />}
                                                    {slugStatus === 'available' && <Check className="w-5 h-5 text-green-500" />}
                                                    {slugStatus === 'taken' && <AlertCircle className="w-5 h-5 text-red-500" />}
                                                </div>
                                            </div>
                                            <p className="mt-2 text-sm font-bold text-zinc-400 uppercase tracking-wider">
                                                Your profile will be at: <span className="text-zinc-900 lowercase">traderefer.au/b/{formData.slug || '...'}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <Briefcase className="w-3.5 h-3.5" /> Trade Category
                                            </label>
                                            <select
                                                value={formData.trade_category}
                                                onChange={(e) => setFormData({ ...formData, trade_category: e.target.value })}
                                                className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-lg font-medium appearance-none"
                                            >
                                                {TRADE_CATEGORIES.map((cat) => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                    <MapPin className="w-3.5 h-3.5" /> Base Suburb
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.suburb}
                                                    onChange={(e) => setFormData({ ...formData, suburb: e.target.value })}
                                                    placeholder="e.g. Highton"
                                                    className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-lg font-medium placeholder:text-zinc-300"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                    State
                                                </label>
                                                <select
                                                    value={formData.state}
                                                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                                    className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-lg font-medium appearance-none"
                                                >
                                                    <option value="VIC">VIC</option>
                                                    <option value="NSW">NSW</option>
                                                    <option value="QLD">QLD</option>
                                                    <option value="WA">WA</option>
                                                    <option value="SA">SA</option>
                                                    <option value="TAS">TAS</option>
                                                    <option value="ACT">ACT</option>
                                                    <option value="NT">NT</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <Mail className="w-3.5 h-3.5" /> Public Email
                                            </label>
                                            <input
                                                type="email"
                                                value={formData.business_email}
                                                onChange={(e) => setFormData({ ...formData, business_email: e.target.value })}
                                                placeholder="hi@business.com"
                                                className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-lg font-medium placeholder:text-zinc-300"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <Globe className="w-3.5 h-3.5" /> Website (Optional)
                                            </label>
                                            <input
                                                type="url"
                                                value={formData.website}
                                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                                placeholder="https://yourbusiness.com"
                                                className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-lg font-medium placeholder:text-zinc-300"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <Briefcase className="w-3.5 h-3.5" /> Short Description
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Briefly describe your business and services..."
                                            rows={3}
                                            className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-lg font-medium placeholder:text-zinc-300 resize-none"
                                        />
                                    </div>
                                </div>
                            </>
                        ) : step === 2 ? (
                            <>
                                <div>
                                    <h1 className="text-4xl font-black text-zinc-900 mb-3 tracking-tight font-display">
                                        Service Area & Fees
                                    </h1>
                                    <p className="text-lg text-zinc-500 font-medium leading-relaxed">
                                        Set your service radius and understand how lead unlocking works.
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <MapPin className="w-3.5 h-3.5" /> Service Radius (km)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.service_radius_km}
                                            onChange={(e) => setFormData({ ...formData, service_radius_km: parseInt(e.target.value) })}
                                            className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-lg font-medium"
                                        />
                                    </div>

                                    <div className="bg-white p-8 rounded-[32px] border border-zinc-100 shadow-sm space-y-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 flex items-center justify-center">
                                                <Logo size="sm" variant="icon-only" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-zinc-900">Referrer Reward</h3>
                                                <p className="text-sm text-zinc-500 font-medium">How much you&apos;ll pay the referrer for a successful job.</p>
                                            </div>
                                        </div>

                                        <div className="relative">
                                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-zinc-300">$</div>
                                            <input
                                                type="number"
                                                min="3"
                                                step="1"
                                                value={formData.referral_fee_cents / 100}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value) || 0;
                                                    setFormData({ ...formData, referral_fee_cents: Math.round(val * 100) });
                                                }}
                                                className="w-full pl-12 pr-6 py-6 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-3xl font-black text-zinc-900"
                                            />
                                            {formData.referral_fee_cents < 300 && (
                                                <div className="absolute -bottom-6 left-2 flex items-center gap-1 text-sm font-bold text-red-500 uppercase tracking-wider">
                                                    <AlertCircle className="w-3 h-3" /> Minimum reward is $3.00
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-4 pt-4">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-zinc-500 font-medium">Referrer Reward</span>
                                                <span className="text-zinc-900 font-black">${(formData.referral_fee_cents / 100).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-zinc-500 font-medium">Platform Fee (20%)</span>
                                                <span className="text-zinc-900 font-black">${(formData.referral_fee_cents * 0.2 / 100).toFixed(2)}</span>
                                            </div>
                                            <div className="pt-4 border-t border-zinc-100 flex justify-between items-center">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-zinc-900">Total Unlock Price</span>
                                                    <span className="text-base text-zinc-400 font-bold uppercase tracking-wider">Per Verified Lead</span>
                                                </div>
                                                <span className="text-3xl font-black text-orange-600 font-display">
                                                    ${(formData.referral_fee_cents * 1.2 / 100).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-orange-50 rounded-2xl border border-orange-100 flex gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                                            <Shield className="w-5 h-5 text-orange-500" />
                                        </div>
                                        <p className="text-sm text-orange-900/70 font-medium leading-relaxed">
                                            <strong className="text-orange-900 block mb-1">Fee Guarantee</strong>
                                            You only pay the unlock fee when you choose to see a customer&apos;s full contact details. Leads are pre-verified via SMS.
                                        </p>
                                    </div>
                                </div>
                            </>
                        ) : step === 3 ? (
                            <>
                                <div>
                                    <h1 className="text-4xl font-black text-zinc-900 mb-3 tracking-tight font-display">
                                        Business Showcase
                                    </h1>
                                    <p className="text-lg text-zinc-500 font-medium leading-relaxed">
                                        Upload your logo and work photos — the preview on the right shows how your profile will look.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                                    {/* ── Left: Upload Controls ── */}
                                    <div className="lg:col-span-2 space-y-6">
                                        {/* Logo Upload */}
                                        <div className="bg-zinc-50 p-6 rounded-[28px] border border-zinc-100 space-y-4">
                                            <label className="block text-sm font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                                <Camera className="w-3.5 h-3.5" /> Business Logo
                                            </label>
                                            <ImageUpload
                                                onUpload={handleLogoUpload}
                                                disabled={isUploadingMedia}
                                                maxFiles={1}
                                                folder="logos"
                                                hidePreview
                                            />
                                            <p className="text-xs text-zinc-400 font-medium">Square PNG or JPG, at least 200×200 px.</p>
                                        </div>

                                        {/* Gallery Upload */}
                                        <div className="bg-zinc-50 p-6 rounded-[28px] border border-zinc-100 space-y-4">
                                            <label className="block text-sm font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                                <ImageIcon className="w-3.5 h-3.5" /> Work Gallery
                                            </label>
                                            <ImageUpload
                                                onUpload={handlePhotosUpload}
                                                defaultValue={photoUrls}
                                                disabled={isUploadingMedia || photoUrls.length >= 5}
                                                maxFiles={5 - photoUrls.length}
                                                folder="gallery"
                                                hidePreview
                                            />
                                            <p className="text-xs text-zinc-400 font-medium">Up to 5 photos showing your best work.</p>
                                        </div>
                                    </div>

                                    {/* ── Right: Live Preview Card ── */}
                                    <div className="lg:col-span-3">
                                        <div className="sticky top-28 bg-white rounded-[28px] border border-zinc-200 shadow-lg overflow-hidden">
                                            {/* Fake browser chrome */}
                                            <div className="bg-zinc-900 px-5 py-3 flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                                                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                                                <span className="text-zinc-500 text-xs font-mono ml-3 truncate">traderefer.au/b/{formData.slug || '...'}</span>
                                            </div>

                                            <div className="p-8 space-y-6">
                                                {/* Logo + Name */}
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-16 rounded-full bg-zinc-100 border-2 border-white shadow-md overflow-hidden flex items-center justify-center shrink-0">
                                                        {logoUrl ? (
                                                            /* eslint-disable-next-line @next/next/no-img-element */
                                                            <img src={logoUrl} alt="Logo preview" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Building2 className="w-7 h-7 text-zinc-300" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="text-lg font-black text-zinc-900 leading-tight truncate">
                                                            {formData.business_name || 'Your Business Name'}
                                                        </h3>
                                                        <p className="text-sm text-zinc-500 font-medium truncate">
                                                            {formData.trade_category} · {formData.suburb || 'Suburb'}, {formData.state}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Description */}
                                                {formData.description ? (
                                                    <p className="text-sm text-zinc-600 leading-relaxed line-clamp-3">{formData.description}</p>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <div className="h-3 w-full bg-zinc-100 rounded-full" />
                                                        <div className="h-3 w-3/4 bg-zinc-100 rounded-full" />
                                                    </div>
                                                )}

                                                {/* Gallery */}
                                                <div>
                                                    <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">Work Gallery</p>
                                                    {photoUrls.length > 0 ? (
                                                        <div className="grid grid-cols-3 gap-2">
                                                            {photoUrls.map((url, i) => (
                                                                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-zinc-100 group">
                                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                    <img src={url} alt={`Work ${i + 1}`} className="w-full h-full object-cover" />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setPhotoUrls(prev => prev.filter((_, idx) => idx !== i))}
                                                                        className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-3 gap-2">
                                                            {[1, 2, 3].map((n) => (
                                                                <div key={n} className="aspect-square rounded-xl bg-zinc-50 border-2 border-dashed border-zinc-200 flex items-center justify-center">
                                                                    <ImageIcon className="w-5 h-5 text-zinc-200" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                                    </div>
                                    <h1 className="text-4xl font-black text-zinc-900 mb-3 tracking-tight font-display">
                                        Last piece of the puzzle
                                    </h1>
                                    <p className="text-lg text-zinc-500 font-medium leading-relaxed max-w-md mx-auto">
                                        Connect your Stripe account to securely handle lead payments. You&apos;re never charged unless you choose to unlock.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-zinc-50 rounded-3xl p-8 border border-zinc-100 flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-zinc-100 flex items-center justify-center font-black text-base text-zinc-400">
                                                STRIPE
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-zinc-900">Secure Payments</div>
                                                <div className="text-sm text-zinc-400 font-medium">Automatic billing, bank-level security.</div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Button variant="outline" className="rounded-full px-6 border-zinc-200 font-bold bg-white hover:bg-zinc-50 transition-all">
                                                Connect Now
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleNext()}
                                                className="text-zinc-400 hover:text-zinc-900 font-bold text-sm uppercase tracking-widest"
                                            >
                                                Skip for now (Demo Mode)
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="text-center text-base text-zinc-400 font-bold uppercase tracking-widest">
                                        Safe • Secure • Powered by Stripe
                                    </p>
                                </div>
                            </>
                        )}

                        <div className="pt-8 flex items-center gap-4">
                            {step > 1 && (
                                <Button
                                    variant="ghost"
                                    onClick={() => setStep(step - 1)}
                                    disabled={isLoading}
                                    className="rounded-full h-16 px-8 text-zinc-400 hover:text-zinc-900 font-bold"
                                >
                                    <ChevronLeft className="w-5 h-5 mr-2" /> Back
                                </Button>
                            )}
                            <Button
                                onClick={handleNext}
                                disabled={isLoading || (step === 2 && formData.referral_fee_cents < 300) || isUploadingMedia}
                                className="flex-1 bg-zinc-900 hover:bg-black text-white rounded-full h-16 text-xl font-black shadow-xl shadow-zinc-200"
                            >
                                {isLoading ? 'Completing...' : step === 4 ? 'Go to Dashboard' : 'Continue'} <ChevronRight className="ml-2 w-6 h-6" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="p-10 border-t border-zinc-50 text-center">
                <p className="text-zinc-300 text-sm font-bold uppercase tracking-[0.2em]">
                    2026 TradeRefer Pty Ltd
                </p>
            </footer>
        </main>
    );
}
