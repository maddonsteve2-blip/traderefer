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
    Shield,
    Camera,
    Image as ImageIcon,
    X,
    Eye,
    EyeOff,
    Sparkles,
    Search,
    Pencil
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { getSuburbs } from "@/lib/locations";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { WelcomeTour } from "@/components/onboarding/WelcomeTour";
import { ImageUpload } from "@/components/ImageUpload";
import { TRADE_CATEGORIES } from "@/lib/constants";

// AI Q&A options
const YEARS_OPTIONS = ["Less than 1 year", "1-3 years", "3-5 years", "5-10 years", "10-20 years", "20+ years"];

const HIGHLIGHT_OPTIONS = [
    "Licensed & Insured",
    "Free Quotes",
    "Emergency Available",
    "Same-Day Service",
    "Family Owned",
    "Eco-Friendly",
    "Warranty on Work",
    "After-Hours Available",
    "Senior Discounts",
    "Locally Owned",
    "Fast Response Time",
    "Quality Materials",
];

export default function BusinessOnboardingPage() {
    const TOTAL_STEPS = 6;
    const [step, setStep] = useState(1);
    const [showTour, setShowTour] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
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
        referral_fee_cents: 1000,
        listing_visibility: "public",
        // AI-generated fields
        years_experience: "",
        specialty: "",
        highlights: [] as string[],
        why_refer_us: "",
        services: [] as string[],
        features: [] as string[],
    });
    const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [photoUrls, setPhotoUrls] = useState<string[]>([]);
    const [isUploadingMedia, setIsUploadingMedia] = useState(false);
    const [editingDescription, setEditingDescription] = useState(false);
    const [editingWhyRefer, setEditingWhyRefer] = useState(false);

    // Suburb search state
    const [suburbSearch, setSuburbSearch] = useState("");
    const [showSuburbs, setShowSuburbs] = useState(false);
    const allSuburbs = getSuburbs();
    const filteredSuburbs = suburbSearch
        ? allSuburbs.filter(s => s.toLowerCase().includes(suburbSearch.toLowerCase()))
        : allSuburbs;

    const router = useRouter();

    const checkSlug = async (val: string) => {
        if (!val) { setSlugStatus('idle'); return; }
        setSlugStatus('checking');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/business/check-slug/${val}`);
            const data = await res.json();
            setSlugStatus(data.available ? 'available' : 'taken');
        } catch { setSlugStatus('idle'); }
    };

    const handleLogoUpload = (urls: string[]) => {
        if (urls.length > 0) setLogoUrl(urls[urls.length - 1]);
    };

    const handlePhotosUpload = (urls: string[]) => {
        setPhotoUrls(urls);
    };

    const toggleHighlight = (h: string) => {
        setFormData(prev => ({
            ...prev,
            highlights: prev.highlights.includes(h)
                ? prev.highlights.filter(x => x !== h)
                : [...prev.highlights, h]
        }));
    };

    // AI profile generation
    const generateProfile = async () => {
        setIsGenerating(true);
        try {
            const res = await fetch("/api/ai/generate-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    business_name: formData.business_name,
                    trade_category: formData.trade_category,
                    suburb: formData.suburb,
                    years_experience: formData.years_experience,
                    specialty: formData.specialty,
                    highlights: formData.highlights,
                }),
            });

            if (!res.ok) throw new Error("AI generation failed");

            const data = await res.json();
            setFormData(prev => ({
                ...prev,
                description: data.description || prev.description,
                why_refer_us: data.why_refer_us || prev.why_refer_us,
                services: data.services || prev.services,
                features: data.features || prev.features,
            }));
        } catch (err) {
            console.error("AI generation error:", err);
            toast.error("AI generation failed. You can fill in the description manually.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleNext = async () => {
        // Step 2 → Step 3: trigger AI generation
        if (step === 2) {
            await generateProfile();
            setStep(3);
            return;
        }

        // Step 5: submit to API
        if (step === 5) {
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
                        photo_urls: photoUrls,
                        business_highlights: formData.highlights,
                        specialties: formData.specialty ? [formData.specialty] : [],
                    })
                });
                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.detail || 'Onboarding failed');
                }
                setStep(6);
            } catch (err: any) {
                toast.error(err.message);
            } finally {
                setIsLoading(false);
            }
            return;
        }

        // Step 6: go to dashboard
        if (step === 6) {
            router.push("/dashboard/business");
            return;
        }

        // Default: next step
        if (step < TOTAL_STEPS) setStep(step + 1);
    };

    if (showTour) {
        return <WelcomeTour type="business" onComplete={() => setShowTour(false)} />;
    }

    return (
        <main className="min-h-screen bg-white flex flex-col">
            <header className="p-6 flex justify-between items-center border-b border-zinc-100 bg-white sticky top-0 z-50">
                <Link href="/"><Logo size="sm" /></Link>
                <Link href="/support" className="text-sm font-bold text-zinc-400 hover:text-zinc-900 transition-colors">Contact Support</Link>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center py-20 px-4">
                <div className={`w-full transition-all duration-500 ${step === 5 ? 'max-w-4xl' : 'max-w-xl'}`}>
                    {/* Progress Bar */}
                    <div className="flex items-center gap-2 mb-12">
                        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
                            <div key={s} className="flex-1 h-1.5 rounded-full overflow-hidden bg-zinc-100">
                                <div className={`h-full transition-all duration-500 ${s <= step ? 'bg-orange-500' : 'bg-transparent'}`} />
                            </div>
                        ))}
                        <span className="ml-4 text-sm font-black text-zinc-400 uppercase tracking-widest whitespace-nowrap">Step {step} of {TOTAL_STEPS}</span>
                    </div>

                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                        {/* ═══════════════════════════════════════════════ */}
                        {/* STEP 1: ESSENTIALS                             */}
                        {/* ═══════════════════════════════════════════════ */}
                        {step === 1 && (
                            <>
                                <div>
                                    <h1 className="text-4xl font-black text-zinc-900 mb-3 tracking-tight font-display">Tell us about your business</h1>
                                    <p className="text-lg text-zinc-500 font-medium leading-relaxed">The basics — we'll use AI to build the rest of your profile.</p>
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
                                                    className={`w-full px-6 py-4 bg-white border rounded-2xl focus:outline-none focus:ring-4 transition-all text-lg font-medium placeholder:text-zinc-300 ${slugStatus === 'available' ? 'border-green-200 focus:ring-green-500/10' : slugStatus === 'taken' ? 'border-red-200 focus:ring-red-500/10' : 'border-zinc-200 focus:ring-orange-500/10'}`}
                                                />
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                    {slugStatus === 'checking' && <Loader2 className="w-5 h-5 text-zinc-300 animate-spin" />}
                                                    {slugStatus === 'available' && <Check className="w-5 h-5 text-green-500" />}
                                                    {slugStatus === 'taken' && <AlertCircle className="w-5 h-5 text-red-500" />}
                                                </div>
                                            </div>
                                            <p className="mt-2 text-sm font-bold text-zinc-400 uppercase tracking-wider">
                                                Your profile: <span className="text-zinc-900 lowercase">traderefer.au/b/{formData.slug || '...'}</span>
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
                                        <div className="relative">
                                            <label className="block text-sm font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <MapPin className="w-3.5 h-3.5" /> Base Suburb
                                            </label>
                                            {formData.suburb ? (
                                                <div className="flex items-center justify-between w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl">
                                                    <span className="text-lg font-medium text-zinc-900">{formData.suburb}, VIC</span>
                                                    <button type="button" onClick={() => { setFormData({ ...formData, suburb: "" }); setSuburbSearch(""); setShowSuburbs(true); }} className="text-sm font-bold text-orange-500 hover:underline">Change</button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="relative">
                                                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300" />
                                                        <input type="text" value={suburbSearch} onFocus={() => setShowSuburbs(true)} onChange={(e) => { setSuburbSearch(e.target.value); setShowSuburbs(true); }} placeholder="Search Geelong suburbs..." className="w-full pl-14 pr-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-lg font-medium placeholder:text-zinc-300" />
                                                    </div>
                                                    {showSuburbs && (
                                                        <div className="absolute z-20 left-0 right-0 mt-2 bg-white border border-zinc-200 rounded-2xl shadow-xl max-h-64 overflow-y-auto">
                                                            {filteredSuburbs.length === 0 ? (
                                                                <div className="px-6 py-4 text-zinc-400 text-sm">No suburbs found</div>
                                                            ) : filteredSuburbs.map(suburb => (
                                                                <button key={suburb} type="button" onClick={() => { setFormData({ ...formData, suburb }); setSuburbSearch(""); setShowSuburbs(false); }} className="w-full text-left px-6 py-3 hover:bg-orange-50 text-zinc-700 font-medium transition-colors first:rounded-t-2xl last:rounded-b-2xl">{suburb}</button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <Phone className="w-3.5 h-3.5" /> Business Phone
                                            </label>
                                            <input type="tel" value={formData.business_phone} onChange={(e) => setFormData({ ...formData, business_phone: e.target.value })} placeholder="e.g. 0412 000 000" className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-lg font-medium placeholder:text-zinc-300" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <Mail className="w-3.5 h-3.5" /> Public Email
                                            </label>
                                            <input type="email" value={formData.business_email} onChange={(e) => setFormData({ ...formData, business_email: e.target.value })} placeholder="hi@business.com" className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-lg font-medium placeholder:text-zinc-300" />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ═══════════════════════════════════════════════ */}
                        {/* STEP 2: AI Q&A                                 */}
                        {/* ═══════════════════════════════════════════════ */}
                        {step === 2 && (
                            <>
                                <div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-400 rounded-2xl flex items-center justify-center">
                                            <Sparkles className="w-5 h-5 text-white" />
                                        </div>
                                        <h1 className="text-4xl font-black text-zinc-900 tracking-tight font-display">Tell us a bit more</h1>
                                    </div>
                                    <p className="text-lg text-zinc-500 font-medium leading-relaxed">Quick questions so AI can write your profile. Just tap to answer.</p>
                                </div>

                                <div className="space-y-8">
                                    {/* Years */}
                                    <div>
                                        <label className="block text-sm font-black text-zinc-400 uppercase tracking-widest mb-4">How long have you been in business?</label>
                                        <div className="flex flex-wrap gap-2">
                                            {YEARS_OPTIONS.map(y => (
                                                <button
                                                    key={y}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, years_experience: y })}
                                                    className={`px-5 py-3 rounded-full text-sm font-bold transition-all ${formData.years_experience === y ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                                                >
                                                    {y}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Specialty */}
                                    <div>
                                        <label className="block text-sm font-black text-zinc-400 uppercase tracking-widest mb-4">What&apos;s your specialty or focus?</label>
                                        <input
                                            type="text"
                                            value={formData.specialty}
                                            onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                                            placeholder={`e.g. Hot water systems, Gas fitting, Bathroom renos...`}
                                            className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-lg font-medium placeholder:text-zinc-300"
                                        />
                                    </div>

                                    {/* Highlights */}
                                    <div>
                                        <label className="block text-sm font-black text-zinc-400 uppercase tracking-widest mb-4">What makes you stand out? <span className="text-zinc-300 normal-case">(pick all that apply)</span></label>
                                        <div className="flex flex-wrap gap-2">
                                            {HIGHLIGHT_OPTIONS.map(h => (
                                                <button
                                                    key={h}
                                                    type="button"
                                                    onClick={() => toggleHighlight(h)}
                                                    className={`px-4 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-1.5 ${formData.highlights.includes(h) ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                                                >
                                                    {formData.highlights.includes(h) && <Check className="w-3.5 h-3.5" />}
                                                    {h}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ═══════════════════════════════════════════════ */}
                        {/* STEP 3: AI PREVIEW                             */}
                        {/* ═══════════════════════════════════════════════ */}
                        {step === 3 && (
                            <>
                                <div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-400 rounded-2xl flex items-center justify-center">
                                            <Sparkles className="w-5 h-5 text-white" />
                                        </div>
                                        <h1 className="text-4xl font-black text-zinc-900 tracking-tight font-display">Your AI-generated profile</h1>
                                    </div>
                                    <p className="text-lg text-zinc-500 font-medium leading-relaxed">Here&apos;s what we came up with. Edit anything you&apos;d like to change.</p>
                                </div>

                                {isGenerating ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                                        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center">
                                            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                                        </div>
                                        <p className="text-lg font-bold text-zinc-500">AI is writing your profile...</p>
                                        <p className="text-sm text-zinc-400">This usually takes 5-10 seconds</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* About Us */}
                                        <div className="bg-zinc-50 p-6 rounded-[28px] border border-zinc-100">
                                            <div className="flex items-center justify-between mb-3">
                                                <label className="text-sm font-black text-zinc-400 uppercase tracking-widest">About Us</label>
                                                <button type="button" onClick={() => setEditingDescription(!editingDescription)} className="text-sm font-bold text-orange-500 flex items-center gap-1 hover:underline">
                                                    <Pencil className="w-3.5 h-3.5" /> {editingDescription ? 'Done' : 'Edit'}
                                                </button>
                                            </div>
                                            {editingDescription ? (
                                                <textarea
                                                    value={formData.description}
                                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                    rows={4}
                                                    className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 text-base font-medium resize-none"
                                                />
                                            ) : (
                                                <p className="text-base text-zinc-700 leading-relaxed">{formData.description || "No description generated"}</p>
                                            )}
                                        </div>

                                        {/* Why Refer Us */}
                                        <div className="bg-zinc-50 p-6 rounded-[28px] border border-zinc-100">
                                            <div className="flex items-center justify-between mb-3">
                                                <label className="text-sm font-black text-zinc-400 uppercase tracking-widest">Why Refer Us</label>
                                                <button type="button" onClick={() => setEditingWhyRefer(!editingWhyRefer)} className="text-sm font-bold text-orange-500 flex items-center gap-1 hover:underline">
                                                    <Pencil className="w-3.5 h-3.5" /> {editingWhyRefer ? 'Done' : 'Edit'}
                                                </button>
                                            </div>
                                            {editingWhyRefer ? (
                                                <textarea
                                                    value={formData.why_refer_us}
                                                    onChange={(e) => setFormData({ ...formData, why_refer_us: e.target.value })}
                                                    rows={3}
                                                    className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 text-base font-medium resize-none"
                                                />
                                            ) : (
                                                <p className="text-base text-zinc-700 leading-relaxed">{formData.why_refer_us || "No pitch generated"}</p>
                                            )}
                                        </div>

                                        {/* Services */}
                                        <div className="bg-zinc-50 p-6 rounded-[28px] border border-zinc-100">
                                            <label className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-3 block">Services We Provide</label>
                                            <div className="flex flex-wrap gap-2">
                                                {formData.services.map((s, i) => (
                                                    <span key={i} className="px-4 py-2 bg-white border border-zinc-200 rounded-full text-sm font-medium text-zinc-700 flex items-center gap-2">
                                                        {s}
                                                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, services: prev.services.filter((_, idx) => idx !== i) }))} className="text-zinc-300 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Features / Highlights */}
                                        <div className="bg-zinc-50 p-6 rounded-[28px] border border-zinc-100">
                                            <label className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-3 block">Business Highlights</label>
                                            <div className="flex flex-wrap gap-2">
                                                {formData.features.map((f, i) => (
                                                    <span key={i} className="px-4 py-2 bg-orange-50 border border-orange-200 rounded-full text-sm font-bold text-orange-700">{f}</span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Regenerate */}
                                        <button
                                            type="button"
                                            onClick={generateProfile}
                                            disabled={isGenerating}
                                            className="w-full py-3 text-sm font-bold text-orange-500 hover:text-orange-600 flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <Sparkles className="w-4 h-4" /> Regenerate with AI
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        {/* ═══════════════════════════════════════════════ */}
                        {/* STEP 4: FEES & VISIBILITY                      */}
                        {/* ═══════════════════════════════════════════════ */}
                        {step === 4 && (
                            <>
                                <div>
                                    <h1 className="text-4xl font-black text-zinc-900 mb-3 tracking-tight font-display">Service Area & Fees</h1>
                                    <p className="text-lg text-zinc-500 font-medium leading-relaxed">Set your service radius and understand how lead unlocking works.</p>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <MapPin className="w-3.5 h-3.5" /> Service Radius (km)
                                        </label>
                                        <input type="number" value={formData.service_radius_km} onChange={(e) => setFormData({ ...formData, service_radius_km: parseInt(e.target.value) })} className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-lg font-medium" />
                                    </div>

                                    <div className="bg-white p-8 rounded-[32px] border border-zinc-100 shadow-sm space-y-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 flex items-center justify-center"><Logo size="sm" variant="icon-only" /></div>
                                            <div>
                                                <h3 className="font-bold text-zinc-900">Referrer Reward</h3>
                                                <p className="text-sm text-zinc-500 font-medium">How much you&apos;ll pay the referrer for a successful job.</p>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-zinc-300">$</div>
                                            <input
                                                type="number" min="3" step="1"
                                                value={formData.referral_fee_cents / 100}
                                                onChange={(e) => { const val = parseFloat(e.target.value) || 0; setFormData({ ...formData, referral_fee_cents: Math.round(val * 100) }); }}
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
                                                <span className="text-3xl font-black text-orange-600 font-display">${(formData.referral_fee_cents * 1.2 / 100).toFixed(2)}</span>
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

                                    <div className="bg-white p-8 rounded-[32px] border border-zinc-100 shadow-sm space-y-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center">
                                                {formData.listing_visibility === 'public' ? <Eye className="w-5 h-5 text-green-600" /> : <EyeOff className="w-5 h-5 text-zinc-500" />}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-zinc-900">Listing Visibility</h3>
                                                <p className="text-sm text-zinc-500 font-medium">Choose who can find your business.</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button type="button" onClick={() => setFormData({ ...formData, listing_visibility: 'public' })} className={`p-5 rounded-2xl border-2 text-left transition-all ${formData.listing_visibility === 'public' ? 'border-green-500 bg-green-50' : 'border-zinc-100 bg-zinc-50 hover:border-zinc-200'}`}>
                                                <Eye className={`w-5 h-5 mb-2 ${formData.listing_visibility === 'public' ? 'text-green-600' : 'text-zinc-400'}`} />
                                                <div className="text-sm font-bold text-zinc-900">Public</div>
                                                <p className="text-sm text-zinc-500 mt-1">Listed in the directory. Any referrer can find and refer you.</p>
                                            </button>
                                            <button type="button" onClick={() => setFormData({ ...formData, listing_visibility: 'private' })} className={`p-5 rounded-2xl border-2 text-left transition-all ${formData.listing_visibility === 'private' ? 'border-orange-500 bg-orange-50' : 'border-zinc-100 bg-zinc-50 hover:border-zinc-200'}`}>
                                                <EyeOff className={`w-5 h-5 mb-2 ${formData.listing_visibility === 'private' ? 'text-orange-600' : 'text-zinc-400'}`} />
                                                <div className="text-sm font-bold text-zinc-900">Private (Invite Only)</div>
                                                <p className="text-sm text-zinc-500 mt-1">Hidden from directory. Only people with your direct link can refer you.</p>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ═══════════════════════════════════════════════ */}
                        {/* STEP 5: PHOTOS                                 */}
                        {/* ═══════════════════════════════════════════════ */}
                        {step === 5 && (
                            <>
                                <div>
                                    <h1 className="text-4xl font-black text-zinc-900 mb-3 tracking-tight font-display">Business Showcase</h1>
                                    <p className="text-lg text-zinc-500 font-medium leading-relaxed">Upload your logo and work photos — the preview shows how your profile will look.</p>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="bg-zinc-50 p-6 rounded-[28px] border border-zinc-100 space-y-4">
                                            <label className="block text-sm font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                                <Camera className="w-3.5 h-3.5" /> Business Logo
                                            </label>
                                            <ImageUpload onUpload={handleLogoUpload} disabled={isUploadingMedia} maxFiles={1} folder="logos" hidePreview />
                                            <p className="text-xs text-zinc-400 font-medium">Square PNG or JPG, at least 200x200 px.</p>
                                        </div>
                                        <div className="bg-zinc-50 p-6 rounded-[28px] border border-zinc-100 space-y-4">
                                            <label className="block text-sm font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                                <ImageIcon className="w-3.5 h-3.5" /> Work Gallery
                                            </label>
                                            <ImageUpload onUpload={handlePhotosUpload} defaultValue={photoUrls} disabled={isUploadingMedia || photoUrls.length >= 5} maxFiles={5 - photoUrls.length} folder="gallery" hidePreview />
                                            <p className="text-xs text-zinc-400 font-medium">Up to 5 photos showing your best work.</p>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-3">
                                        <div className="sticky top-28 bg-white rounded-[28px] border border-zinc-200 shadow-lg overflow-hidden">
                                            <div className="bg-zinc-900 px-5 py-3 flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                                                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                                                <span className="text-zinc-500 text-xs font-mono ml-3 truncate">traderefer.au/b/{formData.slug || '...'}</span>
                                            </div>
                                            <div className="p-8 space-y-6">
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
                                                        <h3 className="text-lg font-black text-zinc-900 leading-tight truncate">{formData.business_name || 'Your Business Name'}</h3>
                                                        <p className="text-sm text-zinc-500 font-medium truncate">{formData.trade_category} · {formData.suburb || 'Suburb'}, {formData.state}</p>
                                                    </div>
                                                </div>
                                                {formData.description ? (
                                                    <p className="text-sm text-zinc-600 leading-relaxed line-clamp-3">{formData.description}</p>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <div className="h-3 w-full bg-zinc-100 rounded-full" />
                                                        <div className="h-3 w-3/4 bg-zinc-100 rounded-full" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">Work Gallery</p>
                                                    {photoUrls.length > 0 ? (
                                                        <div className="grid grid-cols-3 gap-2">
                                                            {photoUrls.map((url, i) => (
                                                                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-zinc-100 group">
                                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                    <img src={url} alt={`Work ${i + 1}`} className="w-full h-full object-cover" />
                                                                    <button type="button" onClick={() => setPhotoUrls(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-10">
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
                        )}

                        {/* ═══════════════════════════════════════════════ */}
                        {/* STEP 6: SUCCESS                                */}
                        {/* ═══════════════════════════════════════════════ */}
                        {step === 6 && (
                            <>
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                                    </div>
                                    <h1 className="text-4xl font-black text-zinc-900 mb-3 tracking-tight font-display">You&apos;re all set!</h1>
                                    <p className="text-lg text-zinc-500 font-medium leading-relaxed max-w-md mx-auto">Your AI-powered business profile is live. Time to start receiving quality referrals.</p>
                                </div>
                            </>
                        )}

                        {/* ═══════════════════════════════════════════════ */}
                        {/* NAVIGATION BUTTONS                             */}
                        {/* ═══════════════════════════════════════════════ */}
                        <div className="pt-8 flex items-center gap-4">
                            {step > 1 && step < 6 && (
                                <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={isLoading || isGenerating} className="rounded-full h-16 px-8 text-zinc-400 hover:text-zinc-900 font-bold">
                                    <ChevronLeft className="w-5 h-5 mr-2" /> Back
                                </Button>
                            )}
                            <Button
                                onClick={handleNext}
                                disabled={isLoading || isGenerating || (step === 4 && formData.referral_fee_cents < 300) || isUploadingMedia}
                                className="flex-1 bg-zinc-900 hover:bg-black text-white rounded-full h-16 text-xl font-black shadow-xl shadow-zinc-200"
                            >
                                {isLoading ? 'Completing...' : isGenerating ? (
                                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating profile...</>
                                ) : step === 6 ? 'Go to Dashboard' : step === 2 ? (
                                    <><Sparkles className="w-5 h-5 mr-2" /> Generate My Profile</>
                                ) : 'Continue'} {!isGenerating && !isLoading && <ChevronRight className="ml-2 w-6 h-6" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="p-10 border-t border-zinc-50 text-center">
                <p className="text-zinc-300 text-sm font-bold uppercase tracking-[0.2em]">2026 TradeRefer Pty Ltd</p>
            </footer>
        </main>
    );
}
