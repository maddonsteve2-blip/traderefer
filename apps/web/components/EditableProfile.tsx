"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { Pencil, Save, Loader2, X, Plus, Phone, Camera } from "lucide-react";
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
    address: string;
    service_radius_km: number;
    years_experience: string;
    business_phone: string;
    business_email: string;
    website: string;
    logo_url: string;
    cover_photo_url: string;
    photo_urls: string[];
    features: string[];
    services: string[];
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
    const [newService, setNewService] = useState("");

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
                        address: data.address || "",
                        service_radius_km: data.service_radius_km || 25,
                        years_experience: data.years_experience || "",
                        business_phone: data.business_phone || "",
                        business_email: data.business_email || "",
                        website: data.website || "",
                        logo_url: data.logo_url || "",
                        cover_photo_url: data.cover_photo_url || "",
                        photo_urls: data.photo_urls || [],
                        features: data.features || [],
                        services: data.services || [],
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

    const addService = () => {
        if (!newService.trim() || !fields) return;
        setFields({ ...fields, services: [...fields.services, newService.trim()] });
        setNewService("");
    };

    const inp = "w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all";
    const lbl = "block text-xs font-black text-zinc-400 uppercase tracking-widest mb-1.5";
    const secEdit = "bg-white rounded-2xl border-2 border-dashed border-orange-200 p-5 space-y-4";

    // Not the owner — just render the normal page
    if (!isOwner) return <>{children}</>;

    return (
        <>
            {/* Secondary owner bar — sits below the main site navbar (top-16) */}
            <div className="fixed top-16 left-0 right-0 z-40 bg-zinc-50 border-b border-zinc-200">
                <div className="container mx-auto px-4 h-10 flex items-center justify-between gap-4">
                    <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                        {editMode ? "Editing your profile" : "Viewing as owner"}
                    </span>
                    <div className="flex items-center gap-2">
                        {!editMode ? (
                            <button
                                onClick={() => setEditMode(true)}
                                className="flex items-center gap-1.5 h-7 px-4 text-xs font-black text-white bg-orange-500 hover:bg-orange-600 rounded-full shadow transition-all"
                            >
                                <Pencil className="w-3 h-3" /> Edit Profile
                            </button>
                        ) : (
                            <>
                                {hasChanges && (
                                    <span className="text-xs font-bold text-orange-500 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full hidden sm:block">
                                        Unsaved changes
                                    </span>
                                )}
                                <button
                                    onClick={handleCancel}
                                    className="h-7 px-3 text-xs font-bold text-zinc-500 hover:text-zinc-900 rounded-full border border-zinc-200 hover:bg-zinc-100 transition-all flex items-center gap-1"
                                >
                                    <X className="w-3 h-3" /> Discard
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving || !hasChanges}
                                    className="h-7 px-4 text-xs font-black text-white bg-orange-500 hover:bg-orange-600 rounded-full shadow disabled:opacity-40 transition-all flex items-center gap-1"
                                >
                                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Spacer: main navbar (h-16) + secondary owner bar (h-10) */}
            <div className="h-[104px]" />

            {/* Normal view */}
            {!editMode && children}

            {/* Edit mode — same 2-column layout as the real profile page */}
            {editMode && fields && (
                <div className="bg-zinc-50 min-h-screen">
                    <div className="bg-white border-b border-zinc-100 py-3">
                        <div className="container mx-auto px-4">
                            <p className="text-xs font-black text-orange-500 uppercase tracking-widest flex items-center gap-2">
                                <Pencil className="w-3 h-3" /> Editing: {fields.business_name}
                                <span className="text-zinc-300 font-medium normal-case tracking-normal">— click any field to change it</span>
                            </p>
                        </div>
                    </div>

                    <div className="container mx-auto px-4 py-8">
                        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 items-start">

                            {/* ── LEFT SIDEBAR (editable) ── */}
                            <div className="space-y-4 lg:sticky lg:top-[104px] self-start">

                                {/* Cover photo card */}
                                <div className={secEdit}>
                                    <p className="text-xs font-black text-orange-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <Camera className="w-3 h-3" /> Cover Photo
                                    </p>
                                    <div className="rounded-xl overflow-hidden h-28 bg-zinc-100">
                                        <ImageUpload
                                            defaultValue={fields.cover_photo_url ? [fields.cover_photo_url] : []}
                                            maxFiles={1}
                                            onUpload={(urls) => setFields({ ...fields, cover_photo_url: urls[0] || "" })}
                                        />
                                    </div>
                                    <p className="text-xs font-black text-orange-400 uppercase tracking-widest flex items-center gap-1.5 pt-1">
                                        <Camera className="w-3 h-3" /> Logo
                                    </p>
                                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-zinc-100">
                                        <ImageUpload
                                            defaultValue={fields.logo_url ? [fields.logo_url] : []}
                                            maxFiles={1}
                                            onUpload={(urls) => setFields({ ...fields, logo_url: urls[0] || "" })}
                                        />
                                    </div>
                                </div>

                                {/* Business identity */}
                                <div className={secEdit}>
                                    <div>
                                        <label className={lbl}>Business Name</label>
                                        <input type="text" value={fields.business_name} onChange={(e) => setFields({ ...fields, business_name: e.target.value })} className={inp} />
                                    </div>
                                    <div>
                                        <label className={lbl}>Trade Category</label>
                                        <select value={fields.trade_category} onChange={(e) => setFields({ ...fields, trade_category: e.target.value })} className={inp}>
                                            {TRADE_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={lbl}>Years Experience</label>
                                        <input type="text" value={fields.years_experience} onChange={(e) => setFields({ ...fields, years_experience: e.target.value })} placeholder="e.g. 10+ years" className={inp} />
                                    </div>
                                </div>

                                {/* Contact & location */}
                                <div className={secEdit}>
                                    <p className="text-xs font-black text-orange-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <Phone className="w-3 h-3" /> Contact &amp; Location
                                    </p>
                                    <div>
                                        <label className={lbl}>Phone</label>
                                        <input type="tel" value={fields.business_phone} onChange={(e) => setFields({ ...fields, business_phone: e.target.value })} className={inp} />
                                    </div>
                                    <div>
                                        <label className={lbl}>Email</label>
                                        <input type="email" value={fields.business_email} onChange={(e) => setFields({ ...fields, business_email: e.target.value })} className={inp} />
                                    </div>
                                    <div>
                                        <label className={lbl}>Website</label>
                                        <input type="url" value={fields.website} onChange={(e) => setFields({ ...fields, website: e.target.value })} placeholder="https://..." className={inp} />
                                    </div>
                                    <div>
                                        <label className={lbl}>Address</label>
                                        <input type="text" value={fields.address} onChange={(e) => setFields({ ...fields, address: e.target.value })} className={inp} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className={lbl}>Suburb</label>
                                            <input type="text" value={fields.suburb} onChange={(e) => setFields({ ...fields, suburb: e.target.value })} className={inp} />
                                        </div>
                                        <div>
                                            <label className={lbl}>State</label>
                                            <select value={fields.state} onChange={(e) => setFields({ ...fields, state: e.target.value })} className={inp}>
                                                {["VIC","NSW","QLD","WA","SA","TAS","ACT","NT"].map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={lbl}>ABN / ACN</label>
                                        <input type="text" value={fields.abn} onChange={(e) => setFields({ ...fields, abn: e.target.value })} placeholder="11-digit ABN" className={inp} />
                                    </div>
                                    <div>
                                        <label className={lbl}>Service Radius (km)</label>
                                        <input type="number" value={fields.service_radius_km} onChange={(e) => setFields({ ...fields, service_radius_km: parseInt(e.target.value) || 0 })} className={inp} />
                                    </div>
                                </div>
                            </div>

                            {/* ── MAIN CONTENT (editable) ── */}
                            <div className="space-y-6 min-w-0">

                                {/* About */}
                                <div className={secEdit}>
                                    <h2 className="text-xs font-black text-orange-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Pencil className="w-3 h-3" /> About the Business
                                    </h2>
                                    <textarea
                                        value={fields.description}
                                        onChange={(e) => setFields({ ...fields, description: e.target.value })}
                                        rows={5}
                                        placeholder="Describe your business, services, and what makes you stand out..."
                                        className={`${inp} resize-y leading-relaxed`}
                                    />
                                </div>

                                {/* Why Choose Us */}
                                <div className={secEdit}>
                                    <h2 className="text-xs font-black text-orange-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Pencil className="w-3 h-3" /> Why Choose Us
                                    </h2>
                                    <textarea
                                        value={fields.why_refer_us}
                                        onChange={(e) => setFields({ ...fields, why_refer_us: e.target.value })}
                                        rows={4}
                                        placeholder="Tell customers why they should choose you..."
                                        className={`${inp} resize-y leading-relaxed`}
                                    />
                                </div>

                                {/* Services */}
                                <div className={secEdit}>
                                    <h2 className="text-xs font-black text-orange-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Pencil className="w-3 h-3" /> Services Offered
                                    </h2>
                                    <div className="flex flex-wrap gap-2 min-h-[32px]">
                                        {fields.services.map((s, i) => (
                                            <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-sm font-bold text-zinc-700">
                                                {s}
                                                <button onClick={() => setFields({ ...fields, services: fields.services.filter((_, idx) => idx !== i) })} className="text-zinc-300 hover:text-red-500 transition-colors ml-1">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                        {fields.services.length === 0 && <span className="text-sm text-zinc-300 italic">No services added yet</span>}
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newService}
                                            onChange={(e) => setNewService(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && addService()}
                                            placeholder="Type a service and press Enter or Add"
                                            className={`${inp} flex-1`}
                                        />
                                        <button onClick={addService} className="h-9 px-3 bg-orange-500 text-white rounded-xl text-xs font-black flex items-center gap-1 hover:bg-orange-600 transition-all shrink-0">
                                            <Plus className="w-3.5 h-3.5" /> Add
                                        </button>
                                    </div>
                                </div>

                                {/* Service Highlights */}
                                <div className={secEdit}>
                                    <h2 className="text-xs font-black text-orange-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Pencil className="w-3 h-3" /> Service Highlights
                                    </h2>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {AVAILABLE_FEATURES.map((feature) => (
                                            <label key={feature} className={`flex items-center gap-2 p-2.5 rounded-xl border-2 cursor-pointer transition-all text-xs font-bold ${fields.features.includes(feature) ? "bg-orange-50 border-orange-400 text-orange-900" : "bg-white border-zinc-100 text-zinc-500 hover:border-zinc-200"}`}>
                                                <input type="checkbox" className="hidden" checked={fields.features.includes(feature)}
                                                    onChange={(e) => setFields({ ...fields, features: e.target.checked ? [...fields.features, feature] : fields.features.filter((f) => f !== feature) })}
                                                />
                                                <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${fields.features.includes(feature) ? "bg-orange-500 border-orange-500" : "bg-white border-zinc-300"}`}>
                                                    {fields.features.includes(feature) && (
                                                        <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                                {feature}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Project Gallery */}
                                <div className={secEdit}>
                                    <h2 className="text-xs font-black text-orange-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Camera className="w-3 h-3" /> Project Gallery
                                    </h2>
                                    <ImageUpload defaultValue={fields.photo_urls} maxFiles={20} onUpload={(urls) => setFields({ ...fields, photo_urls: urls })} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Floating save bar */}
                    {hasChanges && (
                        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white rounded-full px-6 py-3 shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-300">
                            <span className="text-sm font-bold text-zinc-300 hidden sm:block">Unsaved changes</span>
                            <button onClick={handleCancel} className="text-sm font-bold text-zinc-400 hover:text-white transition-colors">Discard</button>
                            <button onClick={handleSave} disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-5 py-2 rounded-full shadow-lg disabled:opacity-50 flex items-center gap-1.5 transition-all">
                                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                {saving ? "Saving..." : "Save"}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
