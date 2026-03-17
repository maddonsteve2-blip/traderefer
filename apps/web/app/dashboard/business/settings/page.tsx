"use client";



import { useEffect, useState, useCallback } from "react";

import { useAuth } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

import {

    Building2,

    Shield,

    Loader2,

    CheckCircle2,

    ChevronLeft,

    TrendingUp,

    Clock,

    Eye,

    MapPin,

    Globe,

    Phone,

    Mail,

    Save,

    BadgeCheck,

    Copy,

    ExternalLink

} from "lucide-react";

import Link from "next/link";

import { toast } from "sonner";

import {

    DashboardAccentCard,

    DashboardCard,

    DashboardDarkCard,

    DashboardEyebrow,

    DashboardGrid,

    DashboardMutedCard,

    DashboardPage,

    DashboardPanel,

    DashboardPanelBody,

    DashboardSection,

    DashboardSectionDescription,

    DashboardSectionHeader,

    DashboardSectionTitle,

    DashboardStickyFooter,

} from "@/components/dashboard/RedesignPrimitives";

import { MobileBusinessSettings } from "@/components/business/MobileBusinessSettings";

import { PageTransition } from "@/components/ui/PageTransition";



export default function BusinessSettingsPage() {

    const { getToken, isLoaded } = useAuth();

    const [biz, setBiz] = useState<{ is_verified: boolean; abn: string; slug: string; business_name: string; stripe_account_id: string } | null>(null);

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);

    const apiBase = "/api/backend";



    const [formData, setFormData] = useState<{

        business_name: string;

        trade_category: string;

        description: string;

        suburb: string;

        address: string;

        service_radius_km: number;

        slug: string;

        business_phone: string;

        business_email: string;

        website: string;

        abn: string;

        referral_fee_cents: number;

        why_refer_us: string;

        response_sla_minutes: number | null;

    }>({

        business_name: "",

        trade_category: "",

        description: "",

        suburb: "",

        address: "",

        service_radius_km: 25,

        slug: "",

        business_phone: "",

        business_email: "",

        website: "",

        abn: "",

        referral_fee_cents: 1000,

        why_refer_us: "",

        response_sla_minutes: null,

    });

    const [verifying, setVerifying] = useState(false);



    const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

    const labelClass = "text-sm font-semibold text-zinc-700";

    const inputClass = "w-full h-10 bg-white border border-zinc-200 rounded-xl px-4 text-zinc-900 font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 outline-none placeholder-zinc-300 text-sm";

    const textareaClass = "w-full min-h-[120px] bg-white border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 outline-none placeholder-zinc-300 resize-none text-sm";

    const responseTimeOptions: Array<{ label: string; value: number }> = [

        { label: "30 min", value: 30 },

        { label: "1 hour", value: 60 },

        { label: "2 hours", value: 120 },

        { label: "4 hours", value: 240 },

    ];



    const fetchBusiness = useCallback(async () => {

        try {

            const token = await getToken();

            const res = await fetch(`${apiBase}/business/me`, {

                headers: { Authorization: `Bearer ${token}` },

            });



            if (res.ok) {

                const data = await res.json();

                setBiz(data);

                setFormData({

                    business_name: data.business_name || "",

                    trade_category: data.trade_category || "",

                    description: data.description || "",

                    suburb: data.suburb || "",

                    address: data.address || "",

                    service_radius_km: data.service_radius_km || 25,

                    slug: data.slug || "",

                    business_phone: data.business_phone || "",

                    business_email: data.business_email || "",

                    website: data.website || "",

                    abn: data.abn || "",

                    referral_fee_cents: data.referral_fee_cents || 1000,

                    why_refer_us: data.why_refer_us || "",

                    response_sla_minutes: data.response_sla_minutes || null,

                });

            }

        } catch (err) {

            console.error("Failed to fetch business:", err);

            toast.error("Could not load your profile settings.");

        } finally {

            setLoading(false);

        }

    }, [getToken, apiBase]);



    useEffect(() => {

        if (isLoaded) fetchBusiness();

    }, [isLoaded, fetchBusiness]);



    const checkSlug = async (val: string) => {

        if (!val || val === biz?.slug) {

            setSlugStatus("idle");

            return;

        }

        setSlugStatus("checking");

        try {

            const res = await fetch(`${apiBase}/business/check-slug/${val}`);

            const data = await res.json();

            setSlugStatus(data.available ? "available" : "taken");

        } catch {

            setSlugStatus("idle");

        }

    };



    const handleSave = async () => {

        setSaving(true);

        try {

            const token = await getToken();

            const res = await fetch(`${apiBase}/business/update`, {

                method: "PATCH",

                headers: {

                    Authorization: `Bearer ${token}`,

                    "Content-Type": "application/json",

                },

                body: JSON.stringify(formData),

            });



            if (res.ok) {

                toast.success("Profile updated successfully!");

                fetchBusiness();

            } else {

                const err = await res.json();

                toast.error(err.detail || "Failed to save changes.");

            }

        } catch {

            toast.error("Connectivity issue. Please try again.");

        } finally {

            setSaving(false);

        }

    };



    const handleVerifyABN = async () => {

        if (!formData.abn) {

            toast.error("Please enter an ABN first.");

            return;

        }



        setVerifying(true);

        try {

            const token = await getToken();

            const res = await fetch(`${apiBase}/business/verify-abn`, {

                method: "POST",

                headers: {

                    Authorization: `Bearer ${token}`,

                    "Content-Type": "application/json",

                },

                body: JSON.stringify({ abn: formData.abn }),

            });



            const data = await res.json();

            if (res.ok && data.verified) {

                toast.success(data.message);

                fetchBusiness();

            } else {

                toast.error(data.message || "ABN verification failed.");

            }

        } catch {

            toast.error("Check lookup failed. Please try again later.");

        } finally {

            setVerifying(false);

        }

    };



    const handleCopyStorefrontUrl = async () => {

        try {

            await navigator.clipboard.writeText(storefrontHref);

            toast.success("Profile URL copied");

        } catch {

            toast.error("Could not copy profile URL");

        }

    };



    if (loading) {

        return (

            <PageTransition className="min-h-screen bg-zinc-50">

                <div className="p-6 space-y-5 max-w-3xl mx-auto pt-10">

                    <div className="h-7 w-32 bg-zinc-200 rounded-xl animate-pulse" />

                    <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">

                        {[1,2,3,4].map(i => (

                            <div key={i} className="space-y-2">

                                <div className="h-3 w-20 bg-zinc-100 rounded animate-pulse" />

                                <div className="h-10 bg-zinc-50 rounded-xl animate-pulse" />

                            </div>

                        ))}

                    </div>

                </div>

            </PageTransition>

        );

    }



    const responseTimeLabel = formData.response_sla_minutes

        ? formData.response_sla_minutes < 60

            ? `${formData.response_sla_minutes} min`

            : `${formData.response_sla_minutes / 60} hour${formData.response_sla_minutes > 60 ? "s" : ""}`

        : "Fast replies";



    const storefrontDisplayUrl = formData.slug ? `traderefer.au/b/${formData.slug}` : "traderefer.au/b/your-business";

    const storefrontHref = formData.slug ? `https://traderefer.au/b/${formData.slug}` : "https://traderefer.au/b/your-business";



    return (

        <DashboardPage className="overflow-hidden p-0 lg:p-4">

            <MobileBusinessSettings 

                formData={formData}

                setFormData={setFormData}

                saving={saving}

                onSave={handleSave}

                onVerifyABN={handleVerifyABN}

                verifying={verifying}

                slugStatus={slugStatus}

                checkSlug={checkSlug}

                isVerified={biz?.is_verified || false}

            />



            <div className="hidden lg:block">



            <DashboardGrid>

                <DashboardPanel className="w-full xl:w-[40%] min-h-0 xl:rounded-r-none xl:border-r xl:border-l-0 xl:border-t-0 xl:border-b-0">

                    <DashboardPanelBody className="flex-1 overflow-y-auto xl:pr-8 xl:pl-0">

                        <div className="space-y-6">

                            <div className="space-y-3">

                                <div className="flex items-center gap-2 text-base font-semibold text-zinc-400">

                                    <Link href="/dashboard/business" className="hover:text-zinc-800 transition-colors">Dashboard</Link>

                                    <span>/</span>

                                    <span className="text-zinc-700">Settings</span>

                                </div>

                                <div className="flex items-center gap-3">

                                    <Building2 className="w-5 h-5 text-orange-500" />

                                    <h1 className="text-2xl font-black text-zinc-900">Settings</h1>

                                </div>

                                <p className="text-sm font-medium text-zinc-500 mt-0.5">Manage your referral fees, profile visibility, and business details.</p>

                            </div>



                            <DashboardSection>

                                <div className="space-y-3">

                                    <label className={labelClass}>Business Name</label>

                                    <input

                                        type="text"

                                        className={inputClass}

                                        value={formData.business_name}

                                        onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}

                                        placeholder="TradeRefer Plumbing Co"

                                    />

                                </div>



                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

                                    <div className="space-y-3">

                                        <label className={labelClass}>Trade Category</label>

                                        <input

                                            type="text"

                                            className={inputClass}

                                            value={formData.trade_category}

                                            onChange={(e) => setFormData({ ...formData, trade_category: e.target.value })}

                                            placeholder="Plumbing"

                                        />

                                    </div>

                                    <div className="space-y-3">

                                        <label className={labelClass}>Suburb</label>

                                        <input

                                            type="text"

                                            className={inputClass}

                                            value={formData.suburb}

                                            onChange={(e) => setFormData({ ...formData, suburb: e.target.value })}

                                            placeholder="Brisbane"

                                        />

                                    </div>

                                </div>



                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

                                    <div className="space-y-3">

                                        <label className={labelClass}>Business Phone</label>

                                        <input

                                            type="tel"

                                            className={inputClass}

                                            value={formData.business_phone}

                                            onChange={(e) => setFormData({ ...formData, business_phone: e.target.value })}

                                            placeholder="0400 000 000"

                                        />

                                    </div>

                                    <div className="space-y-3">

                                        <label className={labelClass}>Business Email</label>

                                        <input

                                            type="email"

                                            className={inputClass}

                                            value={formData.business_email}

                                            onChange={(e) => setFormData({ ...formData, business_email: e.target.value })}

                                            placeholder="hello@business.com.au"

                                        />

                                    </div>

                                </div>



                                <div className="space-y-3">

                                    <label className={labelClass}>Website</label>

                                    <input

                                        type="url"

                                        className={inputClass}

                                        value={formData.website}

                                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}

                                        placeholder="https://yourbusiness.com.au"

                                    />

                                </div>



                                <div className="space-y-3">

                                    <label className={labelClass}>Profile Link</label>

                                    <input

                                        type="text"

                                        className={`${inputClass} ${slugStatus === "taken" ? "border-red-300 focus:border-red-400 focus:ring-red-500/20" : ""}`}

                                        value={formData.slug}

                                        onChange={(e) => {

                                            const value = e.target.value.trim().toLowerCase().replace(/\s+/g, "-");

                                            setFormData({ ...formData, slug: value });

                                            checkSlug(value);

                                        }}

                                        placeholder="trade-refer-plumbing"

                                    />

                                    <p className={`text-xs font-medium ${slugStatus === "taken" ? "text-red-500" : slugStatus === "available" ? "text-emerald-600" : "text-zinc-400"}`}>

                                        {slugStatus === "taken"

                                            ? "This profile URL is already taken."

                                            : slugStatus === "available"

                                                ? "This profile URL is available."

                                                : "Your profile URL updates live as you type."}

                                    </p>

                                    <div className="space-y-2">

                                        <p className="text-sm font-semibold text-zinc-700">Live URL</p>

                                        <div className="flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50/70 px-4 py-2.5">

                                            <a

                                                href={storefrontHref}

                                                target="_blank"

                                                rel="noopener noreferrer"

                                                className="flex-1 min-w-0 flex items-center gap-1.5 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors truncate"

                                            >

                                                <span className="truncate">{storefrontDisplayUrl}</span>

                                                <ExternalLink className="w-5 h-5 shrink-0" />

                                            </a>

                                            <button

                                                type="button"

                                                onClick={handleCopyStorefrontUrl}

                                                className="shrink-0 text-zinc-400 hover:text-zinc-700 transition-colors"

                                                aria-label="Copy profile URL"

                                            >

                                                <Copy className="w-4 h-4" />

                                            </button>

                                        </div>

                                    </div>

                                </div>

                            </DashboardSection>



                            <DashboardSection>

                                <DashboardSectionHeader>

                                    <DashboardSectionTitle>Why Referrers Should Choose You</DashboardSectionTitle>

                                    <DashboardSectionDescription>Shape the story referrers see when comparing businesses in the catalog.</DashboardSectionDescription>

                                </DashboardSectionHeader>



                                <div className="space-y-3">

                                    <label className={labelClass}>Business Description</label>

                                    <textarea

                                        rows={4}

                                        className={textareaClass}

                                        value={formData.description}

                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}

                                        placeholder="Tell referrers what makes your business credible, trusted, and easy to recommend."

                                    />

                                </div>



                                <div className="space-y-3">

                                    <label className={labelClass}>Referrer Pitch</label>

                                    <textarea

                                        rows={5}

                                        className={textareaClass}

                                        value={formData.why_refer_us}

                                        onChange={(e) => setFormData({ ...formData, why_refer_us: e.target.value })}

                                        placeholder="e.g. We answer fast, turn up on time, and give referrers confidence every step of the way."

                                    />

                                </div>



                                <div className="space-y-3">

                                    <label className={labelClass}>Address</label>

                                    <textarea

                                        rows={3}

                                        className={textareaClass}

                                        value={formData.address}

                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}

                                        placeholder="Street address or service HQ"

                                    />

                                </div>

                            </DashboardSection>



                            <DashboardSection>

                                <DashboardSectionHeader>

                                    <DashboardSectionTitle>Referral Fee Settings</DashboardSectionTitle>

                                    <DashboardSectionDescription>Set the commercial signal that makes your profile feel premium to referrers.</DashboardSectionDescription>

                                </DashboardSectionHeader>



                                <DashboardAccentCard className="space-y-4 p-6">

                                    <label className={labelClass}>Base Referral Fee</label>

                                    <div className="relative w-full max-w-[220px]">

                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-zinc-500 text-base">$</span>

                                        <input

                                            type="number"

                                            min="3"

                                            step="1"

                                            className="w-full h-12 rounded-xl border-2 border-orange-300 bg-white pl-9 pr-4 font-black text-zinc-900 outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-2xl"

                                            value={formData.referral_fee_cents / 100}

                                            onChange={(e) => {

                                                const val = parseFloat(e.target.value) || 0;

                                                setFormData({ ...formData, referral_fee_cents: Math.round(val * 100) });

                                            }}

                                        />

                                    </div>

                                    <p className="text-sm text-zinc-600 font-medium">Referrers notice stronger offers quickly. $10+ usually feels like a serious, high-intent partnership.</p>

                                </DashboardAccentCard>



                                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

                                    <DashboardMutedCard className="rounded-xl p-4">

                                        <p className="text-xs font-bold text-zinc-400 mb-1">Referrer Reward</p>

                                        <p className="font-black text-zinc-900 text-2xl">${(formData.referral_fee_cents / 100).toFixed(2)}</p>

                                    </DashboardMutedCard>

                                    <DashboardMutedCard className="rounded-xl p-4">

                                        <p className="text-xs font-bold text-zinc-400 mb-1">Platform Fee</p>

                                        <p className="font-black text-zinc-900 text-2xl">${(formData.referral_fee_cents * 0.2 / 100).toFixed(2)}</p>

                                    </DashboardMutedCard>

                                    <DashboardDarkCard className="rounded-xl p-4 shadow-lg shadow-zinc-900/10">

                                        <p className="text-xs font-bold text-white/60 mb-1">Total Unlock Price</p>

                                        <p className="font-black text-white text-2xl">${(formData.referral_fee_cents * 1.2 / 100).toFixed(2)}</p>

                                    </DashboardDarkCard>

                                </div>

                            </DashboardSection>



                            <DashboardSection>

                                <DashboardSectionHeader>

                                    <DashboardSectionTitle>How You Operate</DashboardSectionTitle>

                                    <DashboardSectionDescription>These cues tell referrers how quickly and confidently you operate.</DashboardSectionDescription>

                                </DashboardSectionHeader>



                                <div className="space-y-3">

                                    <label className={labelClass}>Response Time Target</label>

                                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">

                                        {responseTimeOptions.map((opt) => (

                                            <button

                                                key={opt.value}

                                                type="button"

                                                onClick={() => setFormData({ ...formData, response_sla_minutes: opt.value })}

                                                className={`h-10 rounded-xl border-2 text-center font-semibold transition-all text-sm ${formData.response_sla_minutes === opt.value

                                                    ? "border-orange-500 bg-orange-50 text-orange-700 shadow-md"

                                                    : "border-zinc-200 bg-white text-zinc-600 hover:border-orange-300"

                                                }`}

                                            >

                                                {opt.label}

                                            </button>

                                        ))}

                                    </div>

                                </div>



                                <div className="space-y-3">

                                    <label className={labelClass}>ABN Verification</label>

                                    <div className="flex flex-col xl:flex-row items-stretch gap-4">

                                        <input

                                            type="text"

                                            placeholder="11 222 333 444"

                                            className={`${inputClass} font-mono tracking-widest`}

                                            value={formData.abn}

                                            onChange={(e) => setFormData({ ...formData, abn: e.target.value.replace(/\s/g, "") })}

                                        />

                                        <Button

                                            onClick={handleVerifyABN}

                                            disabled={verifying || !formData.abn || formData.abn.length < 11}

                                            className="h-10 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm"

                                        >

                                            {verifying ? <Loader2 className="w-6 h-6 animate-spin" /> : <Shield className="w-6 h-6" />}

                                            {verifying ? "Verifying..." : "Start ABN Verification"}

                                        </Button>

                                    </div>

                                    {biz?.is_verified && (

                                        <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm ml-1">

                                            <BadgeCheck className="w-4 h-4" /> Verified business identity on file

                                        </div>

                                    )}

                                </div>

                            </DashboardSection>

                        </div>

                    </DashboardPanelBody>



                    <DashboardStickyFooter className="shrink-0 xl:pr-8 xl:pl-0">

                        <Button

                            onClick={handleSave}

                            disabled={saving || slugStatus === "taken"}

                            className="ml-auto flex w-auto px-6 h-10 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm transition-all"

                        >

                            {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}

                            {saving ? "Saving Changes..." : "Save Changes"}

                        </Button>

                    </DashboardStickyFooter>

                </DashboardPanel>



                <DashboardPanel className="w-full xl:w-[60%] min-h-[460px] xl:h-full bg-gray-50 flex items-center justify-center xl:rounded-l-none xl:border-l xl:border-r-0 xl:border-t-0 xl:border-b-0">

                    <div className="w-full h-full flex flex-col px-4 md:px-6 xl:px-8 py-4 md:py-6">

                        <div className="flex items-center gap-2 mb-4 shrink-0">

                            <Eye className="w-4 h-4 text-zinc-400" />

                            <span className="font-bold text-zinc-400 text-sm">Partner&rsquo;s View</span>

                        </div>



                        <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden">

                            <div className="w-full max-w-[820px] origin-top xl:origin-center scale-100 md:scale-[0.92] xl:scale-[0.9] 2xl:scale-[0.96] rounded-[28px] border border-gray-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] overflow-hidden">

                                <div className="border-b border-gray-100 px-7 py-6 bg-gradient-to-br from-white via-white to-orange-50">

                                    <div className="flex flex-col lg:flex-row items-start justify-between gap-6">

                                        <div className="space-y-3">

                                            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700 font-bold text-sm uppercase tracking-[0.14em]">

                                                <CheckCircle2 className="w-3.5 h-3.5" /> Trusted by Referrers

                                            </div>

                                            <div className="space-y-2">

                                                <h2 className="font-black text-zinc-900 leading-none text-3xl">

                                                    {formData.business_name || biz?.business_name || "Your Business Name"}

                                                </h2>

                                                <div className="flex items-center gap-3 flex-wrap text-base text-zinc-500 font-medium">

                                                    {(formData.trade_category || formData.suburb) && (

                                                        <span className="inline-flex items-center gap-1.5">

                                                            <MapPin className="w-4 h-4" />

                                                            {[formData.trade_category, formData.suburb].filter(Boolean).join(" · ")}

                                                        </span>

                                                    )}

                                                    {formData.website && (

                                                        <span className="inline-flex items-center gap-1.5">

                                                            <Globe className="w-4 h-4" /> {formData.website.replace(/^https?:\/\//, "")}

                                                        </span>

                                                    )}

                                                </div>

                                            </div>

                                            <p className="max-w-2xl text-zinc-600 font-medium leading-7 text-lg">

                                                {formData.why_refer_us || formData.description || "Add your business pitch on the left and it will render here as your live profile summary."}

                                            </p>

                                        </div>



                                        <div className="w-full lg:w-[210px] shrink-0 rounded-[24px] bg-zinc-900 text-white p-5">

                                                        <p className="text-sm font-bold text-white/60 mb-3">Referral Fee</p>

                                            <p className="font-black text-white leading-none text-3xl">${(formData.referral_fee_cents / 100).toFixed(0)}</p>

                                            <p className="text-base text-white/70 font-medium mt-3">What referrers see before they unlock and promote your business.</p>

                                        </div>

                                    </div>

                                </div>



                                <div className="grid grid-cols-1 md:grid-cols-3 border-b border-gray-100">

                                    <div className="px-7 py-5 bg-white border-b md:border-b-0 md:border-r border-gray-100">

                                        <Clock className="w-4 h-4 text-emerald-400 mb-4" />

                                        <p className="font-black text-zinc-900 leading-none text-3xl">{responseTimeLabel}</p>

                                        <p className="mt-3 text-sm font-bold text-zinc-400">Response Promise</p>

                                    </div>

                                    <div className="px-7 py-5 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-100">

                                        <TrendingUp className="w-4 h-4 text-orange-400 mb-4" />

                                        <p className="font-black text-zinc-900 leading-none text-3xl">${(formData.referral_fee_cents * 1.2 / 100).toFixed(2)}</p>

                                        <p className="mt-3 text-sm font-bold text-zinc-400">Lead Unlock Price</p>

                                    </div>

                                    <div className="px-7 py-5 bg-white">

                                        <Shield className="w-4 h-4 text-blue-400 mb-4" />

                                        <div className="mt-1">

                                            {biz?.is_verified

                                                ? <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full">Verified</span>

                                                : <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">Pending</span>}

                                        </div>

                                        <p className="mt-2 text-sm font-bold text-zinc-400">ABN Status</p>

                                    </div>

                                </div>



                                <div className="px-7 py-6 space-y-5">

                                    <div>

                                        <p className="font-black text-zinc-900 mb-3 text-base">Why This Business Converts</p>

                                        <p className="text-zinc-600 leading-7 font-medium text-lg">

                                            {formData.description || "Describe your service quality, reliability, and why referrers can trust you with their reputation."}

                                        </p>

                                    </div>



                                    <DashboardCard className="rounded-none border-x-0 border-b-0 border-t border-gray-100 px-7 py-6 shadow-none">

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                                            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 space-y-4">

                                                <div className="flex items-center gap-2 text-zinc-400 text-sm font-bold">

                                    <Mail className="w-4 h-4" /> Contact

                                </div>

                                                <div className="space-y-3 text-base text-zinc-600 font-medium">

                                                    <div className="inline-flex items-center gap-2 w-full"><Phone className="w-4 h-4 text-zinc-400" /> {formData.business_phone || "Add phone number"}</div>

                                                    <div className="inline-flex items-center gap-2 w-full"><Mail className="w-4 h-4 text-zinc-400" /> {formData.business_email || "Add email address"}</div>

                                                </div>

                                            </div>

                                            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 space-y-4">

                                                <div className="flex items-center gap-2 text-zinc-400 text-sm font-bold">

                                    <MapPin className="w-4 h-4" /> Coverage

                                </div>

                                                <div className="space-y-3 text-base text-zinc-600 font-medium">

                                                    <div className="inline-flex items-center gap-2 w-full"><MapPin className="w-4 h-4 text-zinc-400" /> {formData.suburb || "Add service suburb"}</div>

                                                    <div className="inline-flex items-center gap-2 w-full"><Building2 className="w-4 h-4 text-zinc-400" /> {formData.address || "Add business address"}</div>

                                                </div>

                                            </div>

                                        </div>

                                    </DashboardCard>

                                </div>

                            </div>

                        </div>

                    </div>

                </DashboardPanel>

            </DashboardGrid>

            </div>

        </DashboardPage>

    );

}

