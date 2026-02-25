"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { Pencil, Save, Loader2, X, Eye } from "lucide-react";
import { TRADE_CATEGORIES } from "@/lib/constants";
import { ImageUpload } from "@/components/ImageUpload";

interface EditableProfileProps {
    businessSlug: string;
    children: React.ReactNode;
}

interface EditableFields {
    business_name: string;
    trade_category: string;
    description: string;
    why_refer_us: string;
    suburb: string;
    state: string;
    service_radius_km: number;
    business_phone: string;
    business_email: string;
    website: string;
    logo_url: string;
    cover_photo_url: string;
    photo_urls: string[];
    features: string[];
    slug: string;
    abn: string;
}

const AVAILABLE_FEATURES = [
    "Locally Owned",
    "Verified Reviews",
    "Flexible Hours",
    "TradeRefer Trusted",
    "24/7 Emergency",
    "Licensed & Insured",
    "Free Quotes",
    "Senior Discounts"
];

export function EditableProfile({ businessSlug, children }: EditableProfileProps) {
    const { getToken, isSignedIn, isLoaded } = useAuth();
    const [isOwner, setIsOwner] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [fields, setFields] = useState<EditableFields | null>(null);
    const [originalFields, setOriginalFields] = useState<EditableFields | null>(null);

    const checkOwnership = useCallback(async () => {
        if (!isSignedIn) return;
        try {
            const token = await getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/business/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                if (data.slug === businessSlug) {
                    setIsOwner(true);
                    const f: EditableFields = {
                        business_name: data.business_name || "",
                        trade_category: data.trade_category || "",
                        description: data.description || "",
                        why_refer_us: data.why_refer_us || "",
                        suburb: data.suburb || "",
                        state: data.state || "VIC",
                        service_radius_km: data.service_radius_km || 25,
                        business_phone: data.business_phone || "",
                        business_email: data.business_email || "",
                        website: data.website || "",
                        logo_url: data.logo_url || "",
                        cover_photo_url: data.cover_photo_url || "",
                        photo_urls: data.photo_urls || [],
                        features: data.features || [],
                        slug: data.slug || "",
                        abn: data.abn || "",
                    };
                    setFields(f);
                    setOriginalFields(f);
                }
            }
        } catch {
            // Not owner or error
        }
    }, [isSignedIn, getToken, businessSlug]);

    useEffect(() => {
        if (isLoaded) checkOwnership();
    }, [isLoaded, checkOwnership]);

    const handleSave = async () => {
        if (!fields) return;
        setSaving(true);
        try {
            const token = await getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/business/update`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(fields),
            });
            if (res.ok) {
                toast.success("Profile updated! Changes are live.");
                setOriginalFields({ ...fields });
                setEditMode(false);
                // Soft reload to reflect changes in SSR content
                window.location.reload();
            } else {
                const err = await res.json();
                toast.error(err.detail || "Failed to save changes.");
            }
        } catch {
            toast.error("Connection issue. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (originalFields) setFields({ ...originalFields });
        setEditMode(false);
    };

    const hasChanges =
        fields && originalFields && JSON.stringify(fields) !== JSON.stringify(originalFields);

    // Not the owner — just render the normal page
    if (!isOwner) return <>{children}</>;

    return (
        <>
            {/* Owner Edit Toggle Bar — always visible to owner */}
            <div className="fixed top-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-xl border-b border-zinc-200 shadow-lg shadow-zinc-200/50">
                <div className="container mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-zinc-500">
                            {editMode ? "Editing your profile" : "Viewing as owner"}
                        </span>
                        {editMode && hasChanges && (
                            <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                                Unsaved changes
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Sliding Toggle */}
                        <button
                            onClick={() => {
                                if (editMode) {
                                    handleCancel();
                                } else {
                                    setEditMode(true);
                                }
                            }}
                            className="relative flex items-center gap-2.5 group"
                            aria-label="Toggle edit mode"
                        >
                            <span className={`text-sm font-bold transition-colors ${editMode ? "text-orange-600" : "text-zinc-400"}`}>
                                {editMode ? "Editing" : "View"}
                            </span>
                            <div className={`relative w-14 h-7 rounded-full transition-all duration-300 ${editMode ? "bg-orange-500 shadow-lg shadow-orange-500/30" : "bg-zinc-200"}`}>
                                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 flex items-center justify-center ${editMode ? "left-[30px]" : "left-0.5"}`}>
                                    {editMode ? (
                                        <Pencil className="w-3 h-3 text-orange-500" />
                                    ) : (
                                        <Eye className="w-3 h-3 text-zinc-400" />
                                    )}
                                </div>
                            </div>
                        </button>

                        {/* Save / Cancel Buttons */}
                        {editMode && (
                            <div className="flex items-center gap-2 ml-2">
                                <button
                                    onClick={handleCancel}
                                    className="h-9 px-4 text-sm font-bold text-zinc-500 hover:text-zinc-900 rounded-full border border-zinc-200 hover:bg-zinc-50 transition-all flex items-center gap-1.5"
                                >
                                    <X className="w-3.5 h-3.5" /> Discard
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving || !hasChanges}
                                    className="h-9 px-5 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-full shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 hover:scale-[1.02] active:scale-95"
                                >
                                    {saving ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <Save className="w-3.5 h-3.5" />
                                    )}
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Spacer for fixed bar */}
            <div className="h-14" />

            {/* When not editing, show normal content */}
            {!editMode && children}

            {/* When editing, show editable version */}
            {editMode && fields && (
                <main className="min-h-screen bg-white">
                    {/* Hero Section (editable) */}
                    <div className="bg-zinc-900 pt-16 pb-16 relative overflow-hidden">
                        {fields.cover_photo_url ? (
                            <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={fields.cover_photo_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/80 to-zinc-900/40" />
                            </>
                        ) : (
                            <div className="absolute top-0 right-0 w-1/3 h-full bg-orange-500/10 blur-[120px] rounded-full" />
                        )}
                        <div className="container mx-auto px-4 relative z-10">
                            <div className="flex flex-col md:flex-row items-start gap-8">
                                {/* Logo */}
                                <div className="w-32 h-32 md:w-40 md:h-40 rounded-[40px] overflow-hidden border-2 border-dashed border-orange-500/50 bg-zinc-800 flex-shrink-0">
                                    <ImageUpload
                                        defaultValue={fields.logo_url ? [fields.logo_url] : []}
                                        maxFiles={1}
                                        onUpload={(urls) => setFields({ ...fields, logo_url: urls[0] || "" })}
                                    />
                                </div>

                                <div className="flex-1 space-y-4 w-full">
                                    {/* Business Name */}
                                    <div>
                                        <label className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-1 block">Business Name</label>
                                        <input
                                            type="text"
                                            value={fields.business_name}
                                            onChange={(e) => setFields({ ...fields, business_name: e.target.value })}
                                            className="w-full bg-white/10 border border-orange-500/30 rounded-2xl px-5 py-3 text-2xl md:text-4xl font-black text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/40 font-display"
                                        />
                                    </div>

                                    {/* Trade Category */}
                                    <div className="flex flex-wrap gap-4">
                                        <div className="flex-1 min-w-[200px]">
                                            <label className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-1 block">Trade Category</label>
                                            <select
                                                value={fields.trade_category}
                                                onChange={(e) => setFields({ ...fields, trade_category: e.target.value })}
                                                className="w-full bg-white/10 border border-orange-500/30 rounded-xl px-4 py-2.5 text-white font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/40 appearance-none"
                                            >
                                                {TRADE_CATEGORIES.map((cat) => (
                                                    <option key={cat} value={cat} className="text-zinc-900">{cat}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Location row */}
                                    <div className="flex flex-wrap gap-4">
                                        <div className="flex-1 min-w-[140px]">
                                            <label className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-1 block">Suburb</label>
                                            <input
                                                type="text"
                                                value={fields.suburb}
                                                onChange={(e) => setFields({ ...fields, suburb: e.target.value })}
                                                className="w-full bg-white/10 border border-orange-500/30 rounded-xl px-4 py-2.5 text-white font-medium placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                                            />
                                        </div>
                                        <div className="w-28">
                                            <label className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-1 block">State</label>
                                            <select
                                                value={fields.state}
                                                onChange={(e) => setFields({ ...fields, state: e.target.value })}
                                                className="w-full bg-white/10 border border-orange-500/30 rounded-xl px-4 py-2.5 text-white font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/40 appearance-none"
                                            >
                                                {["VIC","NSW","QLD","WA","SA","TAS","ACT","NT"].map(s => (
                                                    <option key={s} value={s} className="text-zinc-900">{s}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="w-32">
                                            <label className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-1 block">Radius (km)</label>
                                            <input
                                                type="number"
                                                value={fields.service_radius_km}
                                                onChange={(e) => setFields({ ...fields, service_radius_km: parseInt(e.target.value) || 0 })}
                                                className="w-full bg-white/10 border border-orange-500/30 rounded-xl px-4 py-2.5 text-white font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                                            />
                                        </div>
                                    </div>

                                    {/* Website */}
                                    <div>
                                        <label className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-1 block">Website</label>
                                        <input
                                            type="url"
                                            value={fields.website}
                                            onChange={(e) => setFields({ ...fields, website: e.target.value })}
                                            placeholder="https://yourbusiness.com"
                                            className="w-full bg-white/10 border border-orange-500/30 rounded-xl px-4 py-2.5 text-white font-medium placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Cover Photo */}
                            <div className="mt-8">
                                <label className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-2 block">Cover / Banner Photo</label>
                                <ImageUpload
                                    defaultValue={fields.cover_photo_url ? [fields.cover_photo_url] : []}
                                    maxFiles={1}
                                    onUpload={(urls) => setFields({ ...fields, cover_photo_url: urls[0] || "" })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Content sections */}
                    <div className="container mx-auto px-4 py-16">
                        <div className="max-w-3xl space-y-10">
                            {/* Contact Info */}
                            <section className="bg-white border-2 border-orange-200 rounded-[32px] p-8 space-y-5">
                                <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                                    <Pencil className="w-4 h-4 text-orange-500" /> Contact Information
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block">Phone</label>
                                        <input
                                            type="tel"
                                            value={fields.business_phone}
                                            onChange={(e) => setFields({ ...fields, business_phone: e.target.value })}
                                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block">Email</label>
                                        <input
                                            type="email"
                                            value={fields.business_email}
                                            onChange={(e) => setFields({ ...fields, business_email: e.target.value })}
                                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Description */}
                            <section className="bg-white border-2 border-orange-200 rounded-[32px] p-8 space-y-4">
                                <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                                    <Pencil className="w-4 h-4 text-orange-500" /> About Us
                                </h2>
                                <textarea
                                    value={fields.description}
                                    onChange={(e) => setFields({ ...fields, description: e.target.value })}
                                    rows={6}
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-lg font-medium leading-relaxed focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-y"
                                    placeholder="Describe your business, services, and what makes you stand out..."
                                />
                            </section>

                            {/* Why Refer Us */}
                            <section className="bg-white border-2 border-orange-200 rounded-[32px] p-8 space-y-4">
                                <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                                    <Pencil className="w-4 h-4 text-orange-500" /> Why Choose Us
                                </h2>
                                <textarea
                                    value={fields.why_refer_us}
                                    onChange={(e) => setFields({ ...fields, why_refer_us: e.target.value })}
                                    rows={4}
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-lg font-medium leading-relaxed focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-y"
                                    placeholder="Tell referrers and customers why they should choose you..."
                                />
                            </section>

                            {/* Features */}
                            <section className="bg-white border-2 border-orange-200 rounded-[32px] p-8 space-y-4">
                                <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                                    <Pencil className="w-4 h-4 text-orange-500" /> Service Highlights
                                </h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {AVAILABLE_FEATURES.map((feature) => (
                                        <label
                                            key={feature}
                                            className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all text-sm font-bold ${
                                                fields.features.includes(feature)
                                                    ? "bg-orange-50 border-orange-500 text-orange-900"
                                                    : "bg-zinc-50 border-transparent text-zinc-500 hover:bg-zinc-100"
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={fields.features.includes(feature)}
                                                onChange={(e) => {
                                                    setFields({
                                                        ...fields,
                                                        features: e.target.checked
                                                            ? [...fields.features, feature]
                                                            : fields.features.filter((f) => f !== feature),
                                                    });
                                                }}
                                            />
                                            <div
                                                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                                    fields.features.includes(feature)
                                                        ? "bg-orange-500 border-orange-500"
                                                        : "bg-white border-zinc-300"
                                                }`}
                                            >
                                                {fields.features.includes(feature) && (
                                                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                            {feature}
                                        </label>
                                    ))}
                                </div>
                            </section>

                            {/* Work Gallery */}
                            <section className="bg-white border-2 border-orange-200 rounded-[32px] p-8 space-y-4">
                                <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                                    <Pencil className="w-4 h-4 text-orange-500" /> Work Gallery Photos
                                </h2>
                                <ImageUpload
                                    defaultValue={fields.photo_urls}
                                    maxFiles={20}
                                    onUpload={(urls) => setFields({ ...fields, photo_urls: urls })}
                                />
                            </section>

                            {/* ABN */}
                            <section className="bg-white border-2 border-orange-200 rounded-[32px] p-8 space-y-4">
                                <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                                    <Pencil className="w-4 h-4 text-orange-500" /> ABN / ACN
                                </h2>
                                <input
                                    type="text"
                                    value={fields.abn}
                                    onChange={(e) => setFields({ ...fields, abn: e.target.value })}
                                    placeholder="11-digit ABN or 9-digit ACN"
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                />
                            </section>
                        </div>
                    </div>

                    {/* Floating Save Bar (mobile-friendly) */}
                    {hasChanges && (
                        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-zinc-900 text-white rounded-full px-6 py-3 shadow-2xl shadow-zinc-900/50 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-300">
                            <span className="text-sm font-bold text-zinc-300">You have unsaved changes</span>
                            <button
                                onClick={handleCancel}
                                className="text-sm font-bold text-zinc-400 hover:text-white transition-colors"
                            >
                                Discard
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-5 py-2 rounded-full shadow-lg shadow-orange-500/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                            >
                                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                {saving ? "Saving..." : "Save"}
                            </button>
                        </div>
                    )}
                </main>
            )}
        </>
    );
}
