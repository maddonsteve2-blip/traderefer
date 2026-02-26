"use client";

import { useState, useRef, useEffect } from "react";
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
    Pencil,
    Send,
    Bot,
    User
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { getSuburbs } from "@/lib/locations";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { WelcomeTour } from "@/components/onboarding/WelcomeTour";
import { ImageUpload } from "@/components/ImageUpload";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { TRADE_CATEGORIES } from "@/lib/constants";
import { completeOnboarding } from "@/app/onboarding/_actions";

type ChatMessage = {
    role: "user" | "assistant";
    content: string;
};

export default function BusinessOnboardingPage() {
    const TOTAL_STEPS = 6;
    const [step, setStep] = useState(1);
    const [showTour, setShowTour] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const { getToken } = useAuth();
    const { user } = useUser();
    const router = useRouter();

    const [formData, setFormData] = useState({
        business_name: "",
        trade_category: "Plumbing",
        description: "",
        suburb: "",
        address: "",
        state: "VIC",
        postcode: "",
        business_phone: "",
        business_email: "",
        website: "",
        slug: "",
        service_radius_km: 25,
        referral_fee_cents: 1000,
        listing_visibility: "public",
        years_experience: "",
        specialty: "",
        highlights: [] as string[],
        why_refer_us: "",
        services: [] as string[],
        features: [] as string[],
        abn: "",
    });
    const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(null);
    const [photoUrls, setPhotoUrls] = useState<string[]>([]);
    const [isUploadingMedia, setIsUploadingMedia] = useState(false);
    const [editingDescription, setEditingDescription] = useState(false);
    const [editingWhyRefer, setEditingWhyRefer] = useState(false);

    // Chat state
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [isChatting, setIsChatting] = useState(false);
    const [chatDone, setChatDone] = useState(false);
    const [profileOptions, setProfileOptions] = useState<any[]>([]);
    const [selectedProfileIndex, setSelectedProfileIndex] = useState(-1);
    const [profileLocked, setProfileLocked] = useState(false);
    const [tweakInput, setTweakInput] = useState("");
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Strip markdown from AI messages
    const stripMarkdown = (text: string): string => {
        return text
            .replace(/#{1,6}\s+/g, '')       // headings
            .replace(/\*\*(.+?)\*\*/g, '$1') // bold
            .replace(/\*(.+?)\*/g, '$1')     // italic
            .replace(/__(.+?)__/g, '$1')      // bold alt
            .replace(/_(.+?)_/g, '$1')        // italic alt
            .replace(/^[\s]*[-•]\s+/gm, '• ') // normalize bullets to plain dot
            .replace(/^[\s]*\d+\.\s+/gm, '')  // numbered lists
            .replace(/```[\s\S]*?```/g, '')   // code blocks
            .replace(/`(.+?)`/g, '$1')        // inline code
            .trim();
    };

    // Parse suggestion chips from AI messages
    const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
    const parseSuggestions = (text: string): { message: string; suggestions: string[] } => {
        const sugIdx = text.indexOf('Suggestions:');
        if (sugIdx === -1) return { message: text, suggestions: [] };
        const msgPart = text.substring(0, sugIdx).trim();
        const sugPart = text.substring(sugIdx + 'Suggestions:'.length).trim();
        const suggestions = sugPart.split(/[•\-\n,]/).map(s => s.trim().replace(/^"|"$/g, '').replace(/^\d+\.\s*/, '')).filter(s => s.length > 0 && s.length < 80);
        return { message: msgPart, suggestions: suggestions.slice(0, 20) };
    };

    // Suburb search state
    // We now use Google Places Autocomplete so local suburb filtering logic is unused
    const [suburbSearch, setSuburbSearch] = useState("");
    const [showSuburbs, setShowSuburbs] = useState(false);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages, isChatting]);

    // Start chat when entering step 2
    useEffect(() => {
        if (step === 2 && chatMessages.length === 0) {
            startChat();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step]);

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

    // Chat functions
    const startChat = async () => {
        setIsChatting(true);
        try {
            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [],
                    business_name: formData.business_name,
                    trade_category: formData.trade_category,
                    suburb: formData.suburb,
                    address: formData.address,
                }),
            });
            if (!res.ok) throw new Error("Chat failed");
            const data = await res.json();
            setChatMessages([{ role: "assistant", content: data.message }]);
        } catch (err) {
            console.error("Chat start error:", err);
            setChatMessages([{ role: "assistant", content: `G'day! I'm here to help build your ${formData.trade_category} profile. How long have you been in business?` }]);
        } finally {
            setIsChatting(false);
        }
    };

    const sendChatMessage = async () => {
        if (!chatInput.trim() || isChatting) return;

        const userMsg: ChatMessage = { role: "user", content: chatInput.trim() };
        const updatedMessages = [...chatMessages, userMsg];
        setChatMessages(updatedMessages);
        setChatInput("");
        setSelectedSuggestions(new Set());
        setIsChatting(true);

        try {
            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: updatedMessages,
                    business_name: formData.business_name,
                    trade_category: formData.trade_category,
                    suburb: formData.suburb,
                }),
            });
            if (!res.ok) throw new Error("Chat failed");
            const data = await res.json();
            const assistantMsg: ChatMessage = { role: "assistant", content: data.message };
            setChatMessages([...updatedMessages, assistantMsg]);

            // Check if conversation is done
            if (data.message.toLowerCase().includes("i've got everything i need")) {
                setChatDone(true);
            }
        } catch (err) {
            console.error("Chat error:", err);
            toast.error("Chat failed — try again");
        } finally {
            setIsChatting(false);
        }
    };

    // AI profile generation from conversation
    const generateProfile = async (extraInstruction?: string) => {
        setIsGenerating(true);
        try {
            const conversationSummary = chatMessages
                .map(m => `${m.role === "user" ? "Business Owner" : "Assistant"}: ${m.content}`)
                .join("\n");

            const appendedSummary = extraInstruction
                ? `${conversationSummary}\n\nAdditional change request from business owner: ${extraInstruction}`
                : conversationSummary;

            const res = await fetch("/api/ai/generate-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    conversation: [
                        {
                            role: "system",
                            content: `You are a profile writer for TradeRefer, an Australian trades referral platform. You write compelling business profiles based on chat conversations. Use EVERY piece of information from the conversation. Do not leave anything out. Write in Australian English. No markdown.`
                        },
                        {
                            role: "user",
                            content: `Based on this conversation with the owner of "${formData.business_name}" (a ${formData.trade_category} business in ${formData.suburb}, VIC), generate THREE distinct profile options.

CONVERSATION:
${appendedSummary}

IMPORTANT: Use ALL information from the conversation. Include every service mentioned, every highlight, every detail about their experience, service area, guarantees, and specialties. Do not summarise or skip anything.

Each profile should have a different writing style:
- Option 1: Professional and confident
- Option 2: Friendly and approachable  
- Option 3: Bold and punchy

Respond with ONLY a JSON object (no markdown, no code fences):
{
  "profiles": [
    {
      "description": "3-4 sentences about the business. First person plural (we/our). Mention years of experience, location, what they do, and what makes them special. Use ALL details from the chat.",
      "why_refer_us": "2-3 sentences convincing referrers to send leads. Mention guarantees, response times, customer satisfaction, and any unique selling points discussed.",
      "services": ["list EVERY service mentioned in the chat - aim for 6-10 services"],
      "features": ["list ALL highlights/selling points mentioned - aim for 5-8 items like 'Free Quotes', '100% Satisfaction Guarantee', 'Licensed & Insured', 'Same Day Response', etc."],
      "years_experience": "exactly as discussed e.g. '5 years' or '10+ years'",
      "specialty": "their main specialty as discussed"
    },
    { ...option 2 different style... },
    { ...option 3 different style... }
  ]
}`
                        }
                    ],
                }),
            });

            if (!res.ok) throw new Error("Profile generation failed");

            const data = await res.json();

            if (data.error) throw new Error(data.error);

            // Normalize profiles array
            let profiles = data.profiles || (data.raw ? [] : data.description ? [data] : []);

            // Ensure at least 3 options by duplicating the first if necessary
            if (profiles.length === 1) profiles = [profiles[0], profiles[0], profiles[0]];
            if (profiles.length === 2) profiles = [profiles[0], profiles[1], profiles[0]];

            if (!profiles.length) {
                toast.error("AI returned an unexpected format. You can edit the fields manually.");
            }

            setProfileOptions(profiles);
            const chosen = profiles[0] || {};
            setSelectedProfileIndex(0);

            setFormData(prev => ({
                ...prev,
                description: chosen.description || prev.description,
                why_refer_us: chosen.why_refer_us || prev.why_refer_us,
                services: chosen.services || prev.services,
                features: chosen.features || prev.features,
                years_experience: chosen.years_experience || prev.years_experience,
                specialty: chosen.specialty || prev.specialty,
            }));
        } catch (err) {
            console.error("AI generation error:", err);
            toast.error("Profile generation failed. You can fill in the details manually.");
        } finally {
            setIsGenerating(false);
        }
    };

    const applyProfileSelection = (index: number) => {
        const chosen = profileOptions[index] || {};
        setSelectedProfileIndex(index);
        setFormData(prev => ({
            ...prev,
            description: chosen.description || prev.description,
            why_refer_us: chosen.why_refer_us || prev.why_refer_us,
            services: chosen.services || prev.services,
            features: chosen.features || prev.features,
            years_experience: chosen.years_experience || prev.years_experience,
            specialty: chosen.specialty || prev.specialty,
        }));
    };

    const handleNext = async () => {
        // Step 2 → Step 3: trigger AI generation from chat
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
                        cover_photo_url: coverPhotoUrl,
                        photo_urls: photoUrls,
                        business_highlights: formData.highlights,
                        specialties: formData.specialty ? [formData.specialty] : [],
                        abn: formData.abn || undefined,
                    })
                });
                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.detail || 'Onboarding failed');
                }

                // Set Clerk publicMetadata so middleware knows onboarding is done
                const clerkRes = await completeOnboarding("business");
                if (clerkRes.error) {
                    throw new Error(clerkRes.error);
                }

                // Force session token refresh so middleware sees updated claims
                await user?.reload();

                // Redirect to dashboard
                router.push("/dashboard/business");
            } catch (err: any) {
                toast.error(err.message);
            } finally {
                setIsLoading(false);
            }
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

            <div className={`flex-1 flex flex-col items-center ${step === 2 ? 'justify-start py-4' : 'justify-center py-20'} px-4`}>
                <div className={`w-full transition-all duration-500 ${step === 5 ? 'max-w-4xl' : step === 2 ? 'max-w-2xl' : 'max-w-xl'} ${step === 2 ? 'flex flex-col flex-1 min-h-0' : ''}`}>
                    {/* Progress Bar */}
                    <div className={`flex items-center gap-2 ${step === 2 ? 'mb-3' : 'mb-12'}`}>
                        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
                            <div key={s} className="flex-1 h-1.5 rounded-full overflow-hidden bg-zinc-100">
                                <div className={`h-full transition-all duration-500 ${s <= step ? 'bg-orange-500' : 'bg-transparent'}`} />
                            </div>
                        ))}
                        <span className="ml-4 text-sm font-black text-zinc-400 uppercase tracking-widest whitespace-nowrap">Step {step} of {TOTAL_STEPS}</span>
                    </div>

                    <div className={`animate-in fade-in slide-in-from-bottom-4 duration-700 ${step === 2 ? 'flex flex-col flex-1 min-h-0 space-y-3' : 'space-y-8'}`}>

                        {/* ═══════════════════════════════════════════════ */}
                        {/* STEP 1: ESSENTIALS                             */}
                        {/* ═══════════════════════════════════════════════ */}
                        {step === 1 && (
                            <>
                                <div>
                                    <h1 className="text-4xl font-black text-zinc-900 mb-3 tracking-tight font-display">Tell us about your business</h1>
                                    <p className="text-lg text-zinc-500 font-medium leading-relaxed">The basics — our AI assistant will chat with you to build the rest.</p>
                                </div>
                                <div className="space-y-6">
                                    <div className="bg-zinc-50 p-6 rounded-[32px] border border-zinc-100 space-y-6">
                                        {/* Business name */}
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

                                        {/* Slug */}
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

                                        {/* ABN / ACN */}
                                        <div>
                                            <label className="block text-sm font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <Shield className="w-3.5 h-3.5" /> ABN / ACN (Optional)
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.abn}
                                                onChange={(e) => setFormData({ ...formData, abn: e.target.value })}
                                                placeholder="11-digit ABN or 9-digit ACN"
                                                className="w-full px-6 py-4 bg-white border border-zinc-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-lg font-medium"
                                            />
                                            <p className="mt-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">Optional — helps us verify your business</p>
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
                                                <MapPin className="w-3.5 h-3.5" /> Address & Location
                                            </label>
                                            <AddressAutocomplete
                                                addressValue={formData.address}
                                                suburbValue={formData.suburb}
                                                stateValue={formData.state}
                                                onAddressSelect={(address, suburb, state, postcode) => {
                                                    setFormData(prev => ({ ...prev, address, suburb, state, postcode: postcode || prev.postcode }));
                                                }}
                                                placeholder="Search for your address in Australia..."
                                                className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-lg font-medium placeholder:text-zinc-300"
                                            />
                                            {formData.address && formData.suburb && (
                                                <p className="mt-2 text-sm font-medium text-zinc-500">
                                                    Selected: <span className="text-zinc-900">{formData.address}, {formData.suburb} {formData.state}</span>
                                                </p>
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
                        {/* STEP 2: AI CHAT                                */}
                        {/* ═══════════════════════════════════════════════ */}
                        {step === 2 && (
                            <>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-400 rounded-xl flex items-center justify-center shrink-0">
                                        <Sparkles className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-xl font-black text-zinc-900 tracking-tight font-display">Chat with your AI assistant</h1>
                                    </div>
                                </div>

                                {/* Chat Container */}
                                <div className="bg-zinc-50 rounded-[20px] border border-zinc-100 overflow-hidden flex flex-col flex-1 min-h-0">
                                    {/* Messages */}
                                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 min-h-[200px]">
                                        {chatMessages.map((msg, i) => {
                                            const isAssistant = msg.role === 'assistant';
                                            const parsed = isAssistant ? parseSuggestions(msg.content) : { message: msg.content, suggestions: [] };
                                            const displayText = isAssistant ? stripMarkdown(parsed.message) : parsed.message;
                                            const suggestions = parsed.suggestions;
                                            const isLastAssistant = isAssistant && i === chatMessages.length - 1;
                                            return (
                                                <div key={i} className="space-y-2">
                                                    <div className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isAssistant ? 'bg-gradient-to-br from-orange-500 to-amber-400' : 'bg-zinc-900'}`}>
                                                            {isAssistant ? (
                                                                <Bot className="w-4 h-4 text-white" />
                                                            ) : (
                                                                <User className="w-4 h-4 text-white" />
                                                            )}
                                                        </div>
                                                        <div className={`max-w-[80%] px-5 py-3 rounded-2xl text-sm leading-relaxed ${isAssistant ? 'bg-white border border-zinc-200 text-zinc-700' : 'bg-zinc-900 text-white'}`}>
                                                            {displayText}
                                                        </div>
                                                    </div>
                                                    {isLastAssistant && suggestions.length > 0 && !chatDone && (
                                                        <div className="ml-11 space-y-2">
                                                            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Tap to add — select as many as you like</p>
                                                            <div className="grid grid-cols-2 gap-1.5">
                                                                {suggestions.map((s, si) => {
                                                                    const isSelected = selectedSuggestions.has(s);
                                                                    return (
                                                                        <button
                                                                            key={si}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setSelectedSuggestions(prev => {
                                                                                    const next = new Set(prev);
                                                                                    if (next.has(s)) { next.delete(s); } else { next.add(s); }
                                                                                    setChatInput(Array.from(next).join(', '));
                                                                                    return next;
                                                                                });
                                                                            }}
                                                                            className={`px-3 py-1.5 rounded-full text-xs font-medium truncate transition-colors ${isSelected ? 'bg-orange-500 text-white border border-orange-500' : 'bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100'}`}
                                                                        >
                                                                            {isSelected && <span className="mr-1">✓</span>}{s}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {isChatting && (
                                            <div className="flex gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shrink-0">
                                                    <Bot className="w-4 h-4 text-white" />
                                                </div>
                                                <div className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl">
                                                    <div className="flex gap-1.5">
                                                        <div className="w-2 h-2 bg-zinc-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                        <div className="w-2 h-2 bg-zinc-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                        <div className="w-2 h-2 bg-zinc-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div ref={chatEndRef} />
                                    </div>

                                    {/* Input */}
                                    <div className="border-t border-zinc-200 p-4 bg-white">
                                        <form onSubmit={(e) => { e.preventDefault(); sendChatMessage(); }} className="flex gap-3">
                                            <input
                                                type="text"
                                                value={chatInput}
                                                onChange={(e) => setChatInput(e.target.value)}
                                                placeholder={chatDone ? "You can ask more or say 'generate'" : "Type your answer..."}
                                                disabled={isChatting}
                                                className="flex-1 px-5 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 text-sm font-medium placeholder:text-zinc-300 disabled:opacity-50"
                                                autoFocus
                                            />
                                            <Button
                                                type="submit"
                                                disabled={!chatInput.trim() || isChatting}
                                                className="bg-zinc-900 hover:bg-black text-white rounded-2xl px-5 h-[46px] shadow-sm"
                                            >
                                                <Send className="w-4 h-4" />
                                            </Button>
                                        </form>
                                    </div>

                                    {/* Done indicator */}
                                    {chatDone && (
                                        <div className="border-t border-green-200 p-4 bg-green-50 flex items-center gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                                            <p className="text-sm font-medium text-green-800">Ready to generate. You can still ask more before generating.</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* ═══════════════════════════════════════════════ */}
                        {/* STEP 3: AI PREVIEW                             */}
                        {/* ═══════════════════════════════════════════════ */}
                        {step === 3 && (
                            <>
                                {isGenerating ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                                        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center">
                                            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                                        </div>
                                        <p className="text-lg font-bold text-zinc-500">AI is writing your profile options...</p>
                                        <p className="text-sm text-zinc-400">Creating 3 versions — usually takes 10-15 seconds</p>
                                    </div>
                                ) : !profileLocked ? (
                                    /* ── PHASE 1: Pick from 3 options ── */
                                    <>
                                        <div>
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-400 rounded-2xl flex items-center justify-center">
                                                    <Sparkles className="w-5 h-5 text-white" />
                                                </div>
                                                <h1 className="text-3xl font-black text-zinc-900 tracking-tight font-display">Pick your favourite profile</h1>
                                            </div>
                                            <p className="text-base text-zinc-500 font-medium leading-relaxed">We wrote 3 versions based on your chat. Pick the one that sounds most like you.</p>
                                        </div>

                                        {profileOptions.length > 0 && (
                                            <div className="space-y-4">
                                                {profileOptions.map((opt, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => { applyProfileSelection(idx); }}
                                                        className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${selectedProfileIndex === idx ? 'border-orange-500 bg-orange-50 shadow-lg shadow-orange-100' : 'border-zinc-200 bg-white hover:border-orange-200 hover:shadow-md'}`}
                                                    >
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-lg font-black ${selectedProfileIndex === idx ? 'border-orange-500 bg-orange-500 text-white' : 'border-zinc-200 text-zinc-400'}`}>
                                                                {idx + 1}
                                                            </div>
                                                            <div className="text-base font-bold text-zinc-900">Option {idx + 1}</div>
                                                            {selectedProfileIndex === idx && <CheckCircle2 className="w-5 h-5 text-orange-500 ml-auto" />}
                                                        </div>
                                                        <p className="text-sm text-zinc-600 leading-relaxed mb-3">{opt.description || 'No description'}</p>
                                                        {opt.features && opt.features.length > 0 && (
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {opt.features.slice(0, 4).map((f: string, fi: number) => (
                                                                    <span key={fi} className="px-2.5 py-1 bg-zinc-100 rounded-full text-xs font-medium text-zinc-600">{f}</span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        <p className="text-sm text-zinc-400 text-center">None of these right? <button type="button" onClick={() => generateProfile()} className="text-orange-500 font-bold hover:underline">Generate 3 new options</button></p>
                                    </>
                                ) : (
                                    /* ── PHASE 2: Edit locked-in profile ── */
                                    <>
                                        <div>
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-400 rounded-2xl flex items-center justify-center">
                                                    <CheckCircle2 className="w-5 h-5 text-white" />
                                                </div>
                                                <h1 className="text-3xl font-black text-zinc-900 tracking-tight font-display">Fine-tune your profile</h1>
                                            </div>
                                            <p className="text-base text-zinc-500 font-medium leading-relaxed">Edit any section directly, or ask AI to tweak it for you.</p>
                                        </div>

                                        <div className="space-y-5">
                                            {/* About Us */}
                                            <div className="bg-zinc-50 p-5 rounded-[24px] border border-zinc-100">
                                                <label className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-2 block">About Us</label>
                                                <textarea
                                                    value={formData.description}
                                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                    rows={4}
                                                    className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 text-sm font-medium resize-none leading-relaxed"
                                                />
                                            </div>

                                            {/* Why Refer Us */}
                                            <div className="bg-zinc-50 p-5 rounded-[24px] border border-zinc-100">
                                                <label className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-2 block">Why Refer Us</label>
                                                <textarea
                                                    value={formData.why_refer_us}
                                                    onChange={(e) => setFormData({ ...formData, why_refer_us: e.target.value })}
                                                    rows={3}
                                                    className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 text-sm font-medium resize-none leading-relaxed"
                                                />
                                            </div>

                                            {/* Services */}
                                            <div className="bg-zinc-50 p-5 rounded-[24px] border border-zinc-100">
                                                <label className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-2 block">Services We Provide</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {formData.services.map((s, i) => (
                                                        <span key={i} className="px-3 py-1.5 bg-white border border-zinc-200 rounded-full text-sm font-medium text-zinc-700 flex items-center gap-1.5">
                                                            {s}
                                                            <button type="button" onClick={() => setFormData(prev => ({ ...prev, services: prev.services.filter((_, idx) => idx !== i) }))} className="text-zinc-300 hover:text-red-500"><X className="w-3 h-3" /></button>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Features / Highlights */}
                                            <div className="bg-zinc-50 p-5 rounded-[24px] border border-zinc-100">
                                                <label className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-2 block">Business Highlights</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {formData.features.map((f, i) => (
                                                        <span key={i} className="px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-full text-sm font-bold text-orange-700 flex items-center gap-1.5">
                                                            {f}
                                                            <button type="button" onClick={() => setFormData(prev => ({ ...prev, features: prev.features.filter((_, idx) => idx !== i) }))} className="text-orange-300 hover:text-red-500"><X className="w-3 h-3" /></button>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* AI Tweak */}
                                            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <Sparkles className="w-4 h-4 text-orange-500" />
                                                    <div className="text-sm font-bold text-orange-900">Want AI to rewrite something?</div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={tweakInput}
                                                        onChange={(e) => setTweakInput(e.target.value)}
                                                        placeholder="e.g. Make the about us more casual"
                                                        className="flex-1 px-4 py-2.5 bg-white border border-orange-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 text-sm"
                                                    />
                                                    <Button
                                                        type="button"
                                                        onClick={async () => {
                                                            if (!tweakInput.trim()) return;
                                                            setIsGenerating(true);
                                                            try {
                                                                const res = await fetch("/api/ai/generate-profile", {
                                                                    method: "POST",
                                                                    headers: { "Content-Type": "application/json" },
                                                                    body: JSON.stringify({
                                                                        conversation: [
                                                                            {
                                                                                role: "system",
                                                                                content: `You are a profile editor. You receive an existing business profile and a tweak request. Apply ONLY the requested tweak. Do NOT rewrite from scratch. Do NOT generate multiple options. Return exactly ONE JSON object with the tweaked profile. No markdown. No code fences. No explanation. Just the JSON.`
                                                                            },
                                                                            {
                                                                                role: "user",
                                                                                content: `Here is the current profile:

description: ${JSON.stringify(formData.description)}
why_refer_us: ${JSON.stringify(formData.why_refer_us)}
services: ${JSON.stringify(formData.services)}
features: ${JSON.stringify(formData.features)}

Tweak requested: "${tweakInput.trim()}"

Return ONLY this JSON (no wrapping, no "profiles" array, just one flat object):
{"description":"...","why_refer_us":"...","services":["..."],"features":["..."]}`
                                                                            }
                                                                        ],
                                                                    }),
                                                                });
                                                                if (!res.ok) throw new Error("Failed");
                                                                const data = await res.json();
                                                                // Handle both flat object and nested profiles array
                                                                const profile = data.profiles?.[0] || data;
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    description: profile.description || prev.description,
                                                                    why_refer_us: profile.why_refer_us || prev.why_refer_us,
                                                                    services: profile.services || prev.services,
                                                                    features: profile.features || prev.features,
                                                                }));
                                                                setTweakInput("");
                                                                toast.success("Profile tweaked!");
                                                            } catch { toast.error("AI tweak failed — edit manually instead"); }
                                                            finally { setIsGenerating(false); }
                                                        }}
                                                        disabled={isGenerating || !tweakInput.trim()}
                                                        className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-4 text-sm font-bold"
                                                    >
                                                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-3.5 h-3.5 mr-1" /> Tweak</>}
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Start over */}
                                            <button
                                                type="button"
                                                onClick={() => { setProfileLocked(false); setSelectedProfileIndex(-1); generateProfile(); }}
                                                className="w-full py-2 text-sm font-bold text-zinc-400 hover:text-orange-500 flex items-center justify-center gap-2 transition-colors"
                                            >
                                                <Sparkles className="w-3.5 h-3.5" /> Start over — generate 3 new options
                                            </button>
                                        </div>
                                    </>
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
                                        {/* Cover Photo */}
                                        <div className="bg-zinc-50 p-6 rounded-[28px] border border-zinc-100 space-y-4">
                                            <label className="block text-sm font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                                <ImageIcon className="w-3.5 h-3.5" /> Cover Photo (Banner)
                                            </label>
                                            {coverPhotoUrl ? (
                                                <div className="relative rounded-xl overflow-hidden aspect-[3/1] bg-zinc-100">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={coverPhotoUrl} alt="Cover" className="w-full h-full object-cover" />
                                                    <button type="button" onClick={() => setCoverPhotoUrl(null)} className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500 text-white rounded-full transition-colors">
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <ImageUpload onUpload={(urls: string[]) => { if (urls.length > 0) setCoverPhotoUrl(urls[0]); }} disabled={isUploadingMedia} maxFiles={1} folder="covers" hidePreview />
                                            )}
                                            <p className="text-xs text-zinc-400 font-medium">Wide landscape image for your profile header. Recommended 1200x400 px.</p>
                                        </div>
                                        {/* Logo */}
                                        <div className="bg-zinc-50 p-6 rounded-[28px] border border-zinc-100 space-y-4">
                                            <label className="block text-sm font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                                <Camera className="w-3.5 h-3.5" /> Business Logo
                                            </label>
                                            <ImageUpload onUpload={handleLogoUpload} disabled={isUploadingMedia} maxFiles={1} folder="logos" hidePreview />
                                            <p className="text-xs text-zinc-400 font-medium">Square PNG or JPG, at least 200x200 px.</p>
                                        </div>
                                        {/* Work Gallery */}
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
                        <div className={`${step === 2 ? 'pt-3' : 'pt-8'} flex items-center gap-4`}>
                            {step > 1 && step < 6 && (
                                <Button variant="ghost" onClick={() => {
                                    if (step === 2) {
                                        setChatMessages([]);
                                        setChatInput("");
                                        setChatDone(false);
                                        setSelectedSuggestions(new Set());
                                    }
                                    if (step === 3) {
                                        setProfileOptions([]);
                                        setSelectedProfileIndex(-1);
                                        setProfileLocked(false);
                                        setTweakInput("");
                                    }
                                    setStep(step - 1);
                                }} disabled={isLoading || isGenerating} className="rounded-full h-16 px-8 text-zinc-400 hover:text-zinc-900 font-bold">
                                    <ChevronLeft className="w-5 h-5 mr-2" /> Back
                                </Button>
                            )}
                            {step === 2 ? (
                                <Button
                                    onClick={handleNext}
                                    disabled={isGenerating}
                                    className="flex-1 bg-zinc-900 hover:bg-black text-white rounded-full h-16 text-xl font-black shadow-xl shadow-zinc-200"
                                >
                                    {isGenerating ? (
                                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating profile...</>
                                    ) : (
                                        <><Sparkles className="w-5 h-5 mr-2" /> Generate My Profile <ChevronRight className="ml-2 w-6 h-6" /></>
                                    )}
                                </Button>
                            ) : step === 3 && !profileLocked ? (
                                <Button
                                    onClick={() => { if (selectedProfileIndex >= 0) setProfileLocked(true); }}
                                    disabled={isGenerating || selectedProfileIndex < 0}
                                    className="flex-1 bg-zinc-900 hover:bg-black text-white rounded-full h-16 text-xl font-black shadow-xl shadow-zinc-200"
                                >
                                    <CheckCircle2 className="w-5 h-5 mr-2" /> Lock In This Profile <ChevronRight className="ml-2 w-6 h-6" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleNext}
                                    disabled={isLoading || isGenerating || (step === 4 && formData.referral_fee_cents < 300) || isUploadingMedia}
                                    className="flex-1 bg-zinc-900 hover:bg-black text-white rounded-full h-16 text-xl font-black shadow-xl shadow-zinc-200"
                                >
                                    {isLoading ? 'Completing...' : step === 6 ? 'Go to Dashboard' : 'Continue'} <ChevronRight className="ml-2 w-6 h-6" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {step !== 2 && (
                <footer className="p-10 border-t border-zinc-50 text-center">
                    <p className="text-zinc-300 text-sm font-bold uppercase tracking-[0.2em]">2026 TradeRefer Pty Ltd</p>
                </footer>
            )}
        </main>
    );
}
