"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
    User,
    Save,
    Image as ImageIcon,
    X,
    ChevronLeft,
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
            <div className="min-h-[100dvh] bg-zinc-50">
                <div className="min-h-screen flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-[100dvh] bg-[#fafafa]">
                <div className="max-w-[1024px] mx-auto px-4 md:px-6 lg:px-0 py-6 md:py-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 md:mb-12">
                        <div className="space-y-3">
                            <Link href="/dashboard/business" className="flex items-center gap-1.5 text-sm md:text-lg font-semibold text-zinc-400 hover:text-zinc-800 transition-colors group w-fit mb-2">
                                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:-translate-x-0.5" /> Back to Dashboard
                            </Link>
                            <h1 className="text-zinc-900 text-3xl md:text-6xl font-black font-display tracking-tight">Public Profile</h1>
                            <p className="text-zinc-500 text-base md:text-2xl font-medium leading-relaxed">Manage how your business appears to customers and referrers.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                            <Button
                                asChild
                                variant="outline"
                                className="rounded-full h-12 md:h-14 px-6 md:px-8 border-zinc-200 text-zinc-600 font-bold hover:bg-zinc-50 w-full md:w-auto text-base md:text-xl"
                            >
                                <Link href={`/b/${biz?.slug}`} target="_blank" className="flex items-center gap-2">
                                    <ExternalLink className="w-5 h-5" /> View Live
                                </Link>
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex min-w-[160px] md:min-w-[180px] items-center justify-center rounded-full h-12 md:h-14 px-8 md:px-10 bg-orange-500 text-white text-base md:text-xl font-bold shadow-lg shadow-orange-500/30 hover:scale-[1.02] active:scale-95 transition-all w-full md:w-auto"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                                {saving ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-6 md:space-y-8">
                        {/* Identity Section */}
                        <section className="bg-white border border-zinc-200 rounded-[24px] md:rounded-[32px] p-6 md:p-10 shadow-sm">
                            <div className="flex items-center gap-4 mb-6 md:mb-8 border-b border-zinc-100 pb-6">
                                <div className="size-10 md:size-12 rounded-xl md:rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
                                    <User className="w-5 h-5 md:w-6 md:h-6" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-xl md:text-4xl font-bold text-zinc-900 truncate">Identity</h2>
                                    <p className="text-sm md:text-xl text-zinc-500 font-medium truncate">Your business name and brand logo</p>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                                <div {...getLogoProps()} className="relative group cursor-pointer shrink-0">
                                    <input {...getLogoInputProps()} />
                                    <div className="w-28 h-28 md:w-40 md:h-40 bg-zinc-50 rounded-[32px] md:rounded-[40px] border-2 border-dashed border-zinc-200 flex items-center justify-center overflow-hidden relative transition-colors group-hover:border-orange-500 group-hover:bg-orange-50">
                                        {uploadingLogo ? (
                                            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                                        ) : formData.logo_url ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img src={formData.logo_url} alt="Logo" className="w-full h-full object-cover" />
                                        ) : (
                                            <ImageIcon className="w-10 h-10 text-zinc-300 group-hover:text-orange-400" />
                                        )}
                                    </div>
                                    <div className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[32px] md:rounded-[40px] font-bold text-xs md:text-base pointer-events-none">
                                        {uploadingLogo ? "Uploading..." : "Change Logo"}
                                    </div>
                                </div>
                                <div className="flex-1 space-y-5 w-full">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-xs md:text-sm font-black uppercase tracking-wider text-zinc-400 ml-1 block">Business Name</label>
                                            <input
                                                type="text"
                                                className="w-full bg-zinc-50 border-none rounded-xl px-4 py-3.5 text-zinc-900 font-bold focus:ring-2 focus:ring-orange-500/20 placeholder-zinc-300 text-lg md:text-xl"
                                                value={formData.business_name}
                                                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs md:text-sm font-black uppercase tracking-wider text-zinc-400 ml-1 block">Public Handle (Slug)</label>
                                            <div className="flex items-center bg-zinc-50 rounded-xl px-4 py-3.5">
                                                <span className="text-zinc-400 mr-1 text-base md:text-lg">/b/</span>
                                                <input
                                                    type="text"
                                                    className="bg-transparent border-none p-0 text-zinc-900 font-bold focus:ring-0 w-full text-lg md:text-xl"
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
                                            <label className="text-xs md:text-sm font-black uppercase tracking-wider text-zinc-400 ml-1 block">Trade Category</label>
                                            <select
                                                className="w-full bg-zinc-50 border-none rounded-xl px-4 py-3.5 text-zinc-900 font-bold focus:ring-2 focus:ring-orange-500/20 text-lg md:text-xl"
                                                value={formData.trade_category}
                                                onChange={(e) => setFormData({ ...formData, trade_category: e.target.value })}
                                            >
                                                {TRADE_CATEGORIES.map((cat) => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs md:text-sm font-black uppercase tracking-wider text-zinc-400 ml-1 block">Website URL</label>
                                            <input
                                                type="url"
                                                className="w-full bg-zinc-50 border-none rounded-xl px-4 py-3.5 text-zinc-900 font-bold focus:ring-2 focus:ring-orange-500/20 placeholder-zinc-300 text-lg md:text-xl"
                                                value={formData.website}
                                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                                placeholder="https://yourbusiness.com"
                                            />
                                        </div>
                                        <div className="space-y-1.5 sm:col-span-2 md:col-span-1">
                                            <label className="text-xs md:text-sm font-black uppercase tracking-wider text-zinc-400 ml-1 block">Business Phone</label>
                                            <input
                                                type="tel"
                                                className="w-full bg-zinc-50 border-none rounded-xl px-4 py-3.5 text-zinc-900 font-bold focus:ring-2 focus:ring-orange-500/20 placeholder-zinc-300 text-lg md:text-xl"
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
                        <section className="bg-white border border-zinc-200 rounded-[24px] md:rounded-[32px] p-6 md:p-10 shadow-sm">
                            <div className="flex items-center gap-4 mb-6 md:mb-8 border-b border-zinc-100 pb-6">
                                <div className="size-10 md:size-12 rounded-xl md:rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-600">
                                    <MapPin className="w-5 h-5 md:w-6 md:h-6" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-xl md:text-4xl font-bold text-zinc-900 truncate">Service Area</h2>
                                    <p className="text-sm md:text-xl text-zinc-500 font-medium truncate">Where do you provide your services?</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-xs md:text-sm font-black uppercase tracking-wider text-zinc-400 ml-1 block">Address & Location</label>
                                    <AddressAutocomplete
                                        addressValue={formData.address}
                                        suburbValue={formData.suburb}
                                        stateValue={formData.state}
                                        onAddressSelect={(address, suburb, state, postcode) => {
                                            setFormData(prev => ({ ...prev, address, suburb, state, postcode: postcode || prev.postcode }));
                                        }}
                                        placeholder="Search for your address..."
                                        className="w-full bg-zinc-50 border-none rounded-xl px-4 py-3.5 text-zinc-900 font-bold focus:ring-2 focus:ring-orange-500/20 text-lg md:text-xl transition-all"
                                    />
                                    {formData.address && formData.suburb && (
                                        <p className="text-xs md:text-base font-bold text-zinc-400 ml-1">
                                            Currently: <span className="text-zinc-600 font-black">{formData.address}, {formData.suburb} {formData.state}</span>
                                        </p>
                                    )}
                                </div>
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-xs md:text-sm font-black uppercase tracking-wider text-zinc-400 ml-1 block">Service Radius</label>
                                    <div className="relative flex items-center">
                                        <input
                                            type="number"
                                            className="w-full bg-zinc-50 border-none rounded-xl px-4 py-3.5 text-zinc-900 font-bold focus:ring-2 focus:ring-orange-500/20 text-lg md:text-xl"
                                            value={formData.service_radius_km}
                                            onChange={(e) => setFormData({ ...formData, service_radius_km: parseInt(e.target.value) || 0 })}
                                        />
                                        <span className="absolute right-4 text-zinc-400 font-black text-sm md:text-lg">km</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* About Section */}
                        <section className="bg-white border border-zinc-200 rounded-[24px] md:rounded-[32px] p-6 md:p-10 shadow-sm">
                            <div className="flex items-center gap-4 mb-6 md:mb-8 border-b border-zinc-100 pb-6">
                                <div className="size-10 md:size-12 rounded-xl md:rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                                    <Shield className="w-5 h-5 md:w-6 md:h-6" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-xl md:text-4xl font-bold text-zinc-900 truncate">About Business</h2>
                                    <p className="text-sm md:text-xl text-zinc-500 font-medium truncate">Describe your services and expertise</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs md:text-sm font-black uppercase tracking-wider text-zinc-400 ml-1 block">Description</label>
                                <textarea
                                    className="w-full bg-zinc-50 border-none rounded-2xl p-6 md:p-8 text-zinc-900 font-medium focus:ring-2 focus:ring-orange-500/20 placeholder-zinc-300 min-h-[180px] md:min-h-[220px] text-lg md:text-2xl leading-relaxed resize-none"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Tell potential referrers and customers about your trade business..."
                                />
                            </div>
                        </section>

                        {/* Work Gallery Section (photo_urls from onboarding) */}
                        <section className="bg-white border border-zinc-200 rounded-[24px] md:rounded-[32px] p-6 md:p-10 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8 border-b border-zinc-100 pb-6">
                                <div className="flex items-center gap-4">
                                    <div className="size-10 md:size-12 rounded-xl md:rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                                        <ImageIcon className="w-5 h-5 md:w-6 md:h-6" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-xl md:text-4xl font-bold text-zinc-900 truncate">Work Gallery</h2>
                                        <p className="text-sm md:text-xl text-zinc-500 font-medium truncate">Showcase your best completed jobs</p>
                                    </div>
                                </div>
                            </div>

                            <div {...getGalleryProps()} className="mb-6 border-2 border-dashed border-zinc-200 rounded-2xl p-6 md:p-10 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-all">
                                <input {...getGalleryInputProps()} />
                                {uploadingGallery ? (
                                    <div className="flex items-center justify-center gap-2 text-orange-500">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span className="font-bold">Uploading...</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <FileUp className="w-8 h-8 md:w-10 md:h-10 text-zinc-200" />
                                        <span className="text-base md:text-lg font-black text-zinc-500">Add Photos</span>
                                        <span className="text-xs md:text-sm text-zinc-400 font-medium">PNG, JPG or WEBP (Max 10MB)</span>
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
                        <section className="bg-white border border-zinc-200 rounded-[24px] md:rounded-[32px] p-6 md:p-10 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8 border-b border-zinc-100 pb-6">
                                <div className="flex items-center gap-4">
                                    <div className="size-10 md:size-14 rounded-xl md:rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600">
                                        <ImageIcon className="w-5 h-5 md:w-7 md:h-7" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl md:text-4xl font-bold text-zinc-900">Finished Projects</h2>
                                        <p className="text-sm md:text-xl text-zinc-500 font-medium">Showcase complete jobs with titles and descriptions</p>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => {
                                        setEditingProject(null);
                                        setIsProjectDialogOpen(true);
                                    }}
                                    className="rounded-full bg-zinc-900 text-white hover:bg-black font-bold h-12 md:h-14 px-6 md:px-8 flex items-center gap-2 text-base md:text-xl w-full sm:w-auto"
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
                                            <div className="p-6 space-y-2">
                                                <h4 className="font-bold text-zinc-900 line-clamp-1 text-xl">{project.title}</h4>
                                                <p className="text-base text-zinc-500 line-clamp-2">{project.description || "No description provided."}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Service Features Section */}
                        <section className="bg-white border border-zinc-200 rounded-[24px] md:rounded-[32px] p-6 md:p-10 shadow-sm">
                            <div className="flex items-center gap-4 mb-6 md:mb-8 border-b border-zinc-100 pb-6">
                                <div className="size-10 md:size-14 rounded-xl md:rounded-2xl bg-green-100 flex items-center justify-center text-green-600">
                                    <CheckCircle2 className="w-5 h-5 md:w-7 md:h-7" />
                                </div>
                                <div>
                                    <h2 className="text-xl md:text-4xl font-bold text-zinc-900">Service Highlights</h2>
                                    <p className="text-sm md:text-xl text-zinc-500 font-medium">Select features that help you stand out</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                {AVAILABLE_FEATURES.map((feature) => (
                                    <label
                                        key={feature}
                                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${formData.features.includes(feature)
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
                                        <span className="font-bold text-base md:text-lg">{feature}</span>
                                    </label>
                                ))}
                            </div>
                        </section>

                        {/* Tips Sidebar/Footer */}
                        <div className="p-6 md:p-8 bg-zinc-900 rounded-[28px] md:rounded-[40px] text-white relative overflow-hidden group">
                            <div className="absolute -right-10 -bottom-10 size-40 bg-orange-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                            <div className="relative z-10">
                                <h3 className="text-xl md:text-3xl font-bold mb-3 md:mb-4 font-display">Pro Tip: Complete Profiles Convert Better</h3>
                                <p className="text-zinc-400 text-base md:text-2xl leading-relaxed max-w-2xl">
                                    Businesses with a high-quality logo, at least 5 job photos, and a detailed description receive <span className="text-orange-400 font-bold">250% more enquiries</span> through TradeRefer.
                                </p>
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
                                <label className="text-base font-bold uppercase tracking-wider text-zinc-400 ml-1 block mb-2">Project Title</label>
                                <input
                                    name="title"
                                    defaultValue={editingProject?.title}
                                    required
                                    className="w-full bg-zinc-50 border-none rounded-xl px-4 py-3.5 text-zinc-900 font-medium focus:ring-2 focus:ring-orange-500/20 text-xl"
                                    placeholder="e.g. Victorian House Rewire"
                                />
                            </div>
                            <div>
                                <label className="text-base font-bold uppercase tracking-wider text-zinc-400 ml-1 block mb-2">Description</label>
                                <textarea
                                    name="description"
                                    defaultValue={editingProject?.description}
                                    className="w-full bg-zinc-50 border-none rounded-xl px-4 py-3.5 text-zinc-900 font-medium focus:ring-2 focus:ring-orange-500/20 min-h-[100px] text-xl"
                                    placeholder="Briefly describe the scope of work..."
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-base font-bold uppercase tracking-wider text-zinc-400 ml-1 block">Project Photos</label>
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
