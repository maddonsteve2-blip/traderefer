"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
    User,
    Save,
    Image as ImageIcon,
    X,
    Loader2,
    CheckCircle2,
    Shield,
    MapPin,
    ExternalLink,
    FileUp,
    Plus,
    Trash2,
    Pencil
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import Link from "next/link";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ImageUpload";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { TRADE_CATEGORIES } from "@/lib/constants";
import { PageTransition } from "@/components/ui/PageTransition";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";

export default function BusinessProfileManagementPage() {
    const { getToken, isLoaded } = useAuth();
    const [biz, setBiz] = useState<{ slug: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingGallery, setUploadingGallery] = useState(false);
    const [saving, setSaving] = useState(false);
    const apiBase = "/api/backend";

    // Form state
    const [formData, setFormData] = useState({
        business_name: "",
        trade_category: "",
        description: "",
        website: "",
        logo_url: "",
        address: "",
        suburb: "",
        state: "VIC",
        postcode: "",
        slug: "",
        service_radius_km: 25,
        business_phone: "",
        photo_urls: [] as string[],
        features: [] as string[]
    });

    // New Projects state
    const [projects, setProjects] = useState<any[]>([]);
    const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<any>(null);
    const [projectSaving, setProjectSaving] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

    const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

    const checkSlug = async (val: string) => {
        if (!val || val === biz?.slug) {
            setSlugStatus('idle');
            return;
        }
        setSlugStatus('checking');
        try {
            const res = await fetch(`${apiBase}/business/check-slug/${val}`);
            const data = await res.json();
            setSlugStatus(data.available ? 'available' : 'taken');
        } catch {
            setSlugStatus('idle');
        }
    };

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

    const fetchBusiness = useCallback(async () => {
        try {
            const token = await getToken();
            const res = await fetch(`${apiBase}/business/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setBiz(data);
                setFormData({
                    business_name: data.business_name || "",
                    trade_category: data.trade_category || "",
                    description: data.description || "",
                    website: data.website || "",
                    logo_url: data.logo_url || "",
                    address: data.address || "",
                    suburb: data.suburb || "",
                    state: data.state || "VIC",
                    postcode: data.postcode || "",
                    slug: data.slug || "",
                    service_radius_km: data.service_radius_km || 25,
                    business_phone: data.business_phone || "",
                    photo_urls: data.photo_urls || [],
                    features: data.features || []
                });
            }
        } catch (err) {
            console.error("Failed to fetch business:", err);
            toast.error("Could not load your profile.");
        } finally {
            setLoading(false);
        }
    }, [getToken, apiBase]);

    const fetchProjects = useCallback(async () => {
        try {
            const token = await getToken();
            const res = await fetch(`${apiBase}/business/me/projects`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProjects(data);
            }
        } catch (err) {
            console.error("Failed to fetch projects:", err);
        }
    }, [getToken, apiBase]);

    useEffect(() => {
        if (isLoaded) {
            fetchBusiness();
            fetchProjects();
        }
    }, [isLoaded, fetchBusiness, fetchProjects]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = await getToken();
            const res = await fetch(`${apiBase}/business/update`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                toast.success("Public profile updated successfully!");
                fetchBusiness();
            } else {
                const errData = await res.json();
                toast.error(errData.detail || "Failed to save changes.");
            }
        } catch {
            toast.error("Connectivity issue. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (file: File, folder: string) => {
        const token = await getToken();
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);

        const res = await fetch(`${apiBase}/media/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Upload failed");
        }

        const data = await res.json();
        return data.url;
    };

    const { getRootProps: getLogoProps, getInputProps: getLogoInputProps } = useDropzone({
        accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
        maxSize: 5 * 1024 * 1024,
        multiple: false,
        onDrop: async (acceptedFiles) => {
            if (acceptedFiles.length === 0) return;
            setUploadingLogo(true);
            try {
                const url = await handleFileUpload(acceptedFiles[0], "logos");
                setFormData(prev => ({ ...prev, logo_url: url }));
                toast.success("Logo uploaded!");
            } catch (err) {
                toast.error("Failed to upload logo: " + (err as Error).message);
            } finally {
                setUploadingLogo(false);
            }
        },
        onDropRejected: () => toast.error("File must be an image under 5MB")
    });

    const { getRootProps: getGalleryProps, getInputProps: getGalleryInputProps } = useDropzone({
        accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
        maxSize: 5 * 1024 * 1024,
        multiple: true,
        onDrop: async (acceptedFiles) => {
            if (acceptedFiles.length === 0) return;
            setUploadingGallery(true);
            try {
                const uploadPromises = acceptedFiles.map(file => handleFileUpload(file, "gallery"));
                const urls = await Promise.all(uploadPromises);
                setFormData(prev => ({ ...prev, photo_urls: [...prev.photo_urls, ...urls] }));
                toast.success(`${urls.length} photo(s) uploaded!`);
            } catch (err) {
                toast.error("Failed to upload photos: " + (err as Error).message);
            } finally {
                setUploadingGallery(false);
            }
        },
        onDropRejected: () => toast.error("Files must be images under 5MB")
    });

    const removePhoto = (index: number) => {
        setFormData(prev => ({
            ...prev,
            photo_urls: prev.photo_urls.filter((_, i) => i !== index)
        }));
    };

    const handleDeleteProject = (projectId: string) => {
        setProjectToDelete(projectId);
        setIsDeleteDialogOpen(true);
    };

    const confirmDeleteProject = async () => {
        if (!projectToDelete) return;
        try {
            const token = await getToken();
            const res = await fetch(`${apiBase}/business/me/projects/${projectToDelete}`, {
                method: "DELETE",
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success("Project deleted");
                fetchProjects();
            }
        } catch (err) {
            toast.error("Failed to delete project");
        } finally {
            setIsDeleteDialogOpen(false);
            setProjectToDelete(null);
        }
    };

    if (loading) {
        return (
            <PageTransition className="min-h-[100dvh] bg-zinc-50">
                <div className="p-6 space-y-5 max-w-3xl mx-auto pt-10">
                    <div className="h-7 w-40 bg-zinc-200 rounded-xl animate-pulse" />
                    <div className="bg-white rounded-2xl border border-zinc-200 p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-20 h-20 bg-zinc-100 rounded-2xl animate-pulse" />
                            <div className="space-y-2 flex-1">
                                <div className="h-5 w-48 bg-zinc-100 rounded-lg animate-pulse" />
                                <div className="h-4 w-32 bg-zinc-50 rounded-lg animate-pulse" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            {[1,2,3].map(i => (
                                <div key={i} className="space-y-2">
                                    <div className="h-3 w-20 bg-zinc-100 rounded animate-pulse" />
                                    <div className="h-10 bg-zinc-50 rounded-xl animate-pulse" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </PageTransition>
        );
    }

    return (
        <>
            <div className="min-h-[100dvh] bg-zinc-50 lg:h-screen lg:overflow-hidden lg:flex lg:flex-col">

                {/* ── DESKTOP HEADER ── */}
                <div className="hidden lg:flex items-center justify-between px-6 pt-5 pb-0 shrink-0">
                    <div>
                        <h1 className="text-2xl font-black text-zinc-900">Public Profile</h1>
                        <p className="text-sm font-medium text-zinc-500 mt-0.5">Manage how your business appears to customers and referrers.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button asChild variant="outline" className="rounded-xl h-9 px-4 border-zinc-200 text-zinc-600 font-bold text-sm">
                            <Link href={`/b/${biz?.slug}`} target="_blank" className="flex items-center gap-2">
                                <ExternalLink className="w-4 h-4" /> View Live
                            </Link>
                        </Button>
                        <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-xl h-9 px-5 bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 active:scale-95 transition-all">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {saving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>

                {/* ── TWO-COLUMN BODY ── */}
                <div className="flex flex-1 overflow-hidden">

                    {/* ── LEFT SIDEBAR — profile preview (desktop only) ── */}
                    <div id="tour-biz-profile-preview" className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 border-r border-zinc-200 bg-white overflow-y-auto">
                        <div className="p-5 border-b border-zinc-100">
                            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Profile Preview</p>
                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 rounded-2xl bg-zinc-100 flex items-center justify-center overflow-hidden mb-3 border border-zinc-200 shrink-0">
                                    {formData.logo_url
                                        ? <img src={formData.logo_url} alt="Logo" className="w-full h-full object-cover" />
                                        : <User className="w-8 h-8 text-zinc-300" />}
                                </div>
                                <h3 className="font-black text-zinc-900 text-sm leading-tight">{formData.business_name || "Your Business Name"}</h3>
                                {formData.trade_category && (
                                    <span className="mt-1.5 inline-block bg-orange-50 text-orange-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-orange-100">{formData.trade_category}</span>
                                )}
                                {formData.suburb && (
                                    <p className="flex items-center justify-center gap-1 text-zinc-400 font-medium text-xs mt-2">
                                        <MapPin className="w-3 h-3" />{formData.suburb}{formData.state ? `, ${formData.state}` : ""}
                                    </p>
                                )}
                            </div>
                        </div>

                        {formData.features.length > 0 && (
                            <div className="p-5 border-b border-zinc-100">
                                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Highlights</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {formData.features.map(f => (
                                        <span key={f} className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 text-[11px] font-bold px-2 py-1 rounded-lg border border-orange-100">{f}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="p-5">
                            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Profile Strength</p>
                            <div className="space-y-2.5">
                                {[
                                    { label: "Logo uploaded", done: !!formData.logo_url },
                                    { label: "Description (50+ chars)", done: formData.description.length > 50 },
                                    { label: "Gallery (3+ photos)", done: formData.photo_urls.length >= 3 },
                                    { label: "Service area set", done: !!formData.suburb },
                                    { label: "Phone number", done: !!formData.business_phone },
                                ].map(item => (
                                    <div key={item.label} className="flex items-center gap-2">
                                        <CheckCircle2 className={`w-4 h-4 shrink-0 ${item.done ? "text-green-500" : "text-zinc-200"}`} />
                                        <span className={`text-xs font-medium ${item.done ? "text-zinc-700" : "text-zinc-400"}`}>{item.label}</span>
                                    </div>
                                ))}
                            </div>
                            {biz?.slug && (
                                <Link href={`/b/${biz.slug}`} target="_blank" className="mt-5 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-all">
                                    <ExternalLink className="w-3.5 h-3.5" /> View Live Profile
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* ── MAIN CONTENT (scrollable) ── */}
                    <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 lg:py-5">

                        {/* Mobile header */}
                        <div className="lg:hidden mb-5">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h1 className="text-2xl font-black text-zinc-900">Public Profile</h1>
                                    <p className="text-sm font-medium text-zinc-500 mt-0.5">Manage your business listing.</p>
                                </div>
                                <Button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 rounded-xl h-9 px-4 bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 shrink-0">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save
                                </Button>
                            </div>
                            {biz?.slug && (
                                <Button asChild variant="outline" className="w-full rounded-xl h-10 border-zinc-200 text-sm font-bold">
                                    <Link href={`/b/${biz.slug}`} target="_blank" className="flex items-center gap-2 justify-center">
                                        <ExternalLink className="w-4 h-4" /> View Live Profile
                                    </Link>
                                </Button>
                            )}
                        </div>

                    <div className="space-y-4">
                        {/* Identity Section */}
                        <section className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
                            <div className="flex items-center gap-4 mb-4 border-b border-zinc-100 pb-4">
                                <div className="size-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                                    <User className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-base font-bold text-zinc-900 truncate">Identity</h2>
                                    <p className="text-sm text-zinc-600 font-medium truncate">Your business name and brand logo</p>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                                <div {...getLogoProps()} className="relative group cursor-pointer shrink-0">
                                    <input {...getLogoInputProps()} />
                                    <div className="w-24 h-24 bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200 flex items-center justify-center overflow-hidden relative transition-colors group-hover:border-orange-500 group-hover:bg-orange-50">
                                        {uploadingLogo ? (
                                            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                                        ) : formData.logo_url ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img src={formData.logo_url} alt="Logo" className="w-full h-full object-cover" />
                                        ) : (
                                            <ImageIcon className="w-10 h-10 text-zinc-300 group-hover:text-orange-400" />
                                        )}
                                    </div>
                                    <div className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl font-bold text-xs pointer-events-none">
                                        {uploadingLogo ? "Uploading..." : "Change Logo"}
                                    </div>
                                </div>
                                <div className="flex-1 space-y-5 w-full">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-zinc-700 ml-1 block">Business Name</label>
                                            <input
                                                type="text"
                                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 placeholder-zinc-300 text-sm"
                                                value={formData.business_name}
                                                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-zinc-700 ml-1 block">Profile URL</label>
                                            <p className="text-xs text-zinc-500 font-medium ml-1 mb-1">Your public address: traderefer.au/b/[your-handle]</p>
                                            <div className="flex items-center bg-zinc-50 rounded-xl px-4 py-3.5">
                                                <span className="text-zinc-400 mr-1 text-sm">/b/</span>
                                                <input
                                                    type="text"
                                                    className="bg-transparent border-none p-0 text-zinc-900 font-medium focus:ring-0 w-full text-sm"
                                                    value={formData.slug}
                                                    onChange={(e) => {
                                                        const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
                                                        setFormData({ ...formData, slug: val });
                                                        checkSlug(val);
                                                    }}
                                                />
                                                {slugStatus === 'checking' && <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />}
                                                {slugStatus === 'available' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                                {slugStatus === 'taken' && <X className="w-4 h-4 text-red-500" />}
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-zinc-700 ml-1 block">Trade Category</label>
                                            <select
                                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 text-sm"
                                                value={formData.trade_category}
                                                onChange={(e) => setFormData({ ...formData, trade_category: e.target.value })}
                                            >
                                                {TRADE_CATEGORIES.map((cat) => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-zinc-700 ml-1 block">Website URL</label>
                                            <input
                                                type="url"
                                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 placeholder-zinc-300 text-sm"
                                                value={formData.website}
                                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                                placeholder="https://yourbusiness.com"
                                            />
                                        </div>
                                        <div className="space-y-1.5 sm:col-span-2 md:col-span-1">
                                            <label className="text-sm font-medium text-zinc-700 ml-1 block">Business Phone</label>
                                            <input
                                                type="tel"
                                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 placeholder-zinc-300 text-sm"
                                                value={formData.business_phone}
                                                onChange={(e) => setFormData({ ...formData, business_phone: e.target.value })}
                                                placeholder="0400 000 000"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Service Area Section */}
                        <section className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
                            <div className="flex items-center gap-4 mb-4 border-b border-zinc-100 pb-4">
                                <div className="size-9 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-600">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-base font-bold text-zinc-900 truncate">Service Area</h2>
                                    <p className="text-sm text-zinc-600 font-medium truncate">Where do you provide your services?</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-sm font-medium text-zinc-700 ml-1 block">Address & Location</label>
                                    <AddressAutocomplete
                                        addressValue={formData.address}
                                        suburbValue={formData.suburb}
                                        stateValue={formData.state}
                                        onAddressSelect={(address, suburb, state, postcode) => {
                                            setFormData(prev => ({ ...prev, address, suburb, state, postcode: postcode || prev.postcode }));
                                        }}
                                        placeholder="Search for your address..."
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 text-sm transition-all"
                                    />
                                    {formData.address && formData.suburb && (
                                        <p className="text-xs font-medium text-zinc-600 ml-1">
                                            Currently: <span className="text-zinc-600 font-black">{formData.address}, {formData.suburb} {formData.state}</span>
                                        </p>
                                    )}
                                </div>
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-sm font-medium text-zinc-700 ml-1 block">Service Radius</label>
                                    <div className="relative flex items-center">
                                        <input
                                            type="number"
                                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 text-sm"
                                            value={formData.service_radius_km}
                                            onChange={(e) => setFormData({ ...formData, service_radius_km: parseInt(e.target.value) || 0 })}
                                        />
                                        <span className="absolute right-4 text-zinc-400 font-black text-sm md:text-lg">km</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* About Section */}
                        <section className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
                            <div className="flex items-center gap-4 mb-4 border-b border-zinc-100 pb-4">
                                <div className="size-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-base font-bold text-zinc-900 truncate">About Business</h2>
                                    <p className="text-sm text-zinc-600 font-medium truncate">Describe your services and expertise</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700 ml-1 block">Description</label>
                                <textarea
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 placeholder-zinc-300 text-sm min-h-[120px] leading-relaxed resize-none"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Tell potential referrers and customers about your trade business..."
                                />
                            </div>
                        </section>

                        {/* Work Gallery Section (photo_urls from onboarding) */}
                        <section className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-zinc-100 pb-4">
                                <div className="flex items-center gap-4">
                                    <div className="size-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                                        <ImageIcon className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-base font-bold text-zinc-900 truncate">Work Gallery</h2>
                                        <p className="text-sm text-zinc-600 font-medium truncate">Showcase your best completed jobs</p>
                                    </div>
                                </div>
                            </div>

                            <div {...getGalleryProps()} className="mb-4 border-2 border-dashed border-zinc-200 rounded-2xl p-5 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-all">
                                <input {...getGalleryInputProps()} />
                                {uploadingGallery ? (
                                    <div className="flex items-center justify-center gap-2 text-orange-500">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span className="font-bold">Uploading...</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <FileUp className="w-8 h-8 text-zinc-200" />
                                        <span className="text-sm font-bold text-zinc-500">Add Photos</span>
                                        <span className="text-xs text-zinc-400 font-medium">PNG, JPG or WEBP (Max 10MB)</span>
                                    </div>
                                )}
                            </div>

                            {formData.photo_urls.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                                    {formData.photo_urls.map((url, index) => (
                                        <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border border-zinc-100 group bg-zinc-50">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={url} alt={`Work photo ${index + 1}`} className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removePhoto(index)}
                                                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500 text-white rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 md:py-12 bg-zinc-50 rounded-[24px] border border-dashed border-zinc-100">
                                    <ImageIcon className="w-8 h-8 text-zinc-200 mx-auto mb-3" />
                                    <p className="text-zinc-400 font-bold text-sm tracking-widest uppercase">No gallery photos</p>
                                </div>
                            )}
                        </section>

                        {/* Finished Projects Section */}
                        <section className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-zinc-100 pb-4">
                                <div className="flex items-center gap-4">
                                    <div className="size-9 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                                        <ImageIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-zinc-900">Finished Projects</h2>
                                        <p className="text-sm text-zinc-600 font-medium">Showcase complete jobs with titles and descriptions</p>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => {
                                        setEditingProject(null);
                                        setIsProjectDialogOpen(true);
                                    }}
                                    className="rounded-xl bg-orange-600 text-white hover:bg-orange-700 font-bold h-9 px-4 flex items-center gap-2 text-sm w-full sm:w-auto"
                                >
                                    <Plus className="w-5 h-5" /> Add Project
                                </Button>
                            </div>

                            {projects.length === 0 ? (
                                <div className="text-center py-12 bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-100">
                                    <div className="size-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
                                        <ImageIcon className="w-8 h-8 text-zinc-300" />
                                    </div>
                                    <h3 className="text-lg font-bold text-zinc-900 mb-1">No projects yet</h3>
                                    <p className="text-zinc-500 max-w-xs mx-auto">Add your first project to showcase your work to potential customers.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {projects.map((project) => (
                                        <div key={project.id} className="group bg-zinc-50 rounded-3xl overflow-hidden border border-zinc-100 hover:border-orange-200 transition-all">
                                            <div className="aspect-[4/3] relative overflow-hidden">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={project.cover_photo_url || project.photo_urls?.[0] || 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=1000&auto=format&fit=crop'}
                                                    alt={project.title}
                                                    className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                                                />
                                                {project.is_featured && (
                                                    <div className="absolute top-3 left-3 bg-orange-500 text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full">
                                                        Featured
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingProject(project);
                                                            setIsProjectDialogOpen(true);
                                                        }}
                                                        className="bg-white/20 hover:bg-white/40 backdrop-blur-md p-3 rounded-full text-white transition-all transform hover:scale-110"
                                                    >
                                                        <Pencil className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteProject(project.id)}
                                                        className="bg-red-500/20 hover:bg-red-500/40 backdrop-blur-md p-3 rounded-full text-white transition-all transform hover:scale-110"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="p-4 space-y-1">
                                                <h4 className="font-bold text-zinc-900 line-clamp-1 text-sm">{project.title}</h4>
                                                <p className="text-xs text-zinc-500 line-clamp-2">{project.description || "No description provided."}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Service Features Section */}
                        <section className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
                            <div className="flex items-center gap-4 mb-4 border-b border-zinc-100 pb-4">
                                <div className="size-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-zinc-900">Service Highlights</h2>
                                    <p className="text-sm text-zinc-600 font-medium">Select features that help you stand out</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                {AVAILABLE_FEATURES.map((feature) => (
                                    <label
                                        key={feature}
                                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${formData.features.includes(feature)
                                            ? 'bg-orange-50 border-orange-500 text-orange-900 shadow-sm'
                                            : 'bg-zinc-50 border-transparent text-zinc-600 hover:bg-zinc-100'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={formData.features.includes(feature)}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                setFormData(prev => ({
                                                    ...prev,
                                                    features: checked
                                                        ? [...prev.features, feature]
                                                        : prev.features.filter(f => f !== feature)
                                                }));
                                            }}
                                        />
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${formData.features.includes(feature)
                                            ? 'bg-orange-500 border-orange-500 text-white'
                                            : 'bg-white border-zinc-200'
                                            }`}>
                                            {formData.features.includes(feature) && <CheckCircle2 className="w-4 h-4" />}
                                        </div>
                                        <span className="font-bold text-sm">{feature}</span>
                                    </label>
                                ))}
                            </div>
                        </section>

                        {/* Tips Sidebar/Footer */}
                        <div className="p-5 bg-zinc-900 rounded-2xl text-white relative overflow-hidden group">
                            <div className="absolute -right-10 -bottom-10 size-40 bg-orange-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                            <div className="relative z-10">
                                <h3 className="text-base font-bold mb-2">Pro Tip: Complete Profiles Convert Better</h3>
                                <p className="text-zinc-300 text-sm leading-relaxed">
                                    Businesses with a high-quality logo, at least 5 job photos, and a detailed description receive <span className="text-orange-400 font-bold">250% more enquiries</span> through TradeRefer.
                                </p>
                            </div>
                        </div>
                    </div>
                    </div>
                </div>
            </div>

            {/* Project Management Dialog */}
            <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
                <DialogContent className="max-w-2xl bg-white rounded-[32px] p-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="p-8 pb-0">
                        <DialogTitle className="text-4xl font-black font-display tracking-tight text-zinc-900">
                            {editingProject?.id ? "Edit Project" : "New Project"}
                        </DialogTitle>
                        <DialogDescription className="text-zinc-500 font-medium text-lg">
                            {editingProject?.id ? "Update your project details and gallery." : "Add a new completed job to your public gallery."}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={async (e) => {
                        e.preventDefault();
                        setProjectSaving(true);
                        const fd = new FormData(e.currentTarget);
                        const payload = {
                            title: fd.get('title'),
                            description: fd.get('description'),
                            is_featured: fd.get('is_featured') === 'on',
                            cover_photo_url: editingProject?.cover_photo_url || (editingProject?.photo_urls?.[0] || null),
                            photo_urls: editingProject?.photo_urls || []
                        };

                        try {
                            const token = await getToken();
                            const url = editingProject?.id
                                ? `${apiBase}/business/me/projects/${editingProject.id}`
                                : `${apiBase}/business/me/projects`;

                            const res = await fetch(url, {
                                method: editingProject?.id ? "PATCH" : "POST",
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(payload)
                            });

                            if (res.ok) {
                                toast.success(editingProject?.id ? "Project updated" : "Project created");
                                setIsProjectDialogOpen(false);
                                fetchProjects();
                            } else {
                                toast.error("Failed to save project");
                            }
                        } catch {
                            toast.error("Connectivity issue");
                        } finally {
                            setProjectSaving(false);
                        }
                    }} className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-zinc-700 ml-1 block mb-1.5">Project Title</label>
                                <input
                                    name="title"
                                    defaultValue={editingProject?.title}
                                    required
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 text-sm"
                                    placeholder="e.g. Victorian House Rewire"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-zinc-700 ml-1 block mb-1.5">Description</label>
                                <textarea
                                    name="description"
                                    defaultValue={editingProject?.description}
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 min-h-[100px] text-sm"
                                    placeholder="Briefly describe the scope of work..."
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-sm font-semibold text-zinc-700 ml-1 block">Project Photos</label>
                                <ImageUpload
                                    defaultValue={editingProject?.photo_urls || []}
                                    maxFiles={10}
                                    onUpload={(urls) => {
                                        setEditingProject((prev: any) => ({ ...prev, photo_urls: urls }));
                                    }}
                                />
                            </div>

                            <label className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-50 cursor-pointer hover:bg-zinc-100 transition-colors">
                                <input
                                    type="checkbox"
                                    name="is_featured"
                                    defaultChecked={editingProject?.is_featured}
                                    className="w-5 h-5 rounded-md border-zinc-300 text-orange-500 focus:ring-orange-500"
                                />
                                <span className="font-bold text-zinc-700 text-lg">Feature this project at the top</span>
                            </label>
                        </div>

                        <DialogFooter className="pt-4 flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsProjectDialogOpen(false)}
                                className="flex-1 rounded-full h-12 font-bold border-zinc-200 text-lg"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={projectSaving}
                                className="flex-[2] rounded-full h-12 bg-orange-500 text-white font-bold shadow-lg shadow-orange-500/30 hover:scale-[1.02] active:scale-95 transition-all text-lg"
                            >
                                {projectSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                {editingProject?.id ? "Update Project" : "Create Project"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmationDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="Delete Project?"
                description="Are you sure you want to delete this project? This action cannot be undone."
                confirmText="Delete Project"
                cancelText="Cancel"
                variant="destructive"
                onConfirm={confirmDeleteProject}
            />
        </>
    );
}
