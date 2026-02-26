"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
    Settings,
    User,
    Save,
    ExternalLink,
    Shield,
    CreditCard,
    Check,
    Loader2,
    CheckCircle2,
    ChevronLeft,
    TrendingUp,
    Clock
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { StripeConnectButton } from "@/components/dashboard/StripeConnectButton";

export default function BusinessSettingsPage() {
    const { getToken, isLoaded } = useAuth();
    const [biz, setBiz] = useState<{ is_verified: boolean; abn: string; slug: string; business_name: string; stripe_account_id: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
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
        response_sla_minutes: null
    });
    const [verifying, setVerifying] = useState(false);

    const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

    const fetchBusiness = useCallback(async () => {
        try {
            const token = await getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/business/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
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
                    response_sla_minutes: data.response_sla_minutes || null
                });
            }
        } catch (err) {
            console.error("Failed to fetch business:", err);
            toast.error("Cloud not load your profile settings.");
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    useEffect(() => {
        if (isLoaded) fetchBusiness();
    }, [isLoaded, fetchBusiness]);

    const checkSlug = async (val: string) => {
        if (!val || val === biz?.slug) {
            setSlugStatus('idle');
            return;
        }
        setSlugStatus('checking');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/business/check-slug/${val}`);
            const data = await res.json();
            setSlugStatus(data.available ? 'available' : 'taken');
        } catch {
            setSlugStatus('idle');
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = await getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/business/update`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/business/verify-abn`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ abn: formData.abn })
            });

            const data = await res.json();
            if (res.ok && data.verified) {
                toast.success(data.message);
                fetchBusiness(); // Refresh to show verified badge
            } else {
                toast.error(data.message || "ABN verification failed.");
            }
        } catch {
            toast.error("Check lookup failed. Please try again later.");
        } finally {
            setVerifying(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 pt-16">
            <div className="max-w-[1024px] mx-auto px-6 lg:px-0 py-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div className="space-y-2">
                        <Link href="/dashboard/business" className="flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-orange-500 transition-colors mb-2">
                            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
                        </Link>
                        <h1 className="text-zinc-900 text-4xl font-extrabold tracking-tight">Business Settings</h1>
                        <p className="text-zinc-500 text-lg">Manage your business profile, referral fees, and verification status.</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            onClick={handleSave}
                            disabled={saving || slugStatus === 'taken'}
                            className="flex min-w-[160px] items-center justify-center rounded-full h-12 px-8 bg-orange-500 text-white text-sm font-bold shadow-lg shadow-orange-500/30 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            {saving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Card 1: Business Profile */}
                    <section className="bg-white border border-zinc-200 rounded-[32px] p-8 md:p-10 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="size-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500">
                                <User className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-zinc-900">Business Profile</h2>
                                <p className="text-sm text-zinc-500 font-medium">Public information about your company</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-base font-bold uppercase tracking-wider text-zinc-400 ml-1">Business Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-zinc-50 border-none rounded-xl px-4 py-3.5 text-zinc-900 font-medium focus:ring-2 focus:ring-orange-500/20 placeholder-zinc-300"
                                    value={formData.business_name}
                                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-base font-bold uppercase tracking-wider text-zinc-400 ml-1">Account Phone</label>
                                <input
                                    type="tel"
                                    className="w-full bg-zinc-50 border-none rounded-xl px-4 py-3.5 text-zinc-900 font-medium focus:ring-2 focus:ring-orange-500/20"
                                    value={formData.business_phone}
                                    onChange={(e) => setFormData({ ...formData, business_phone: e.target.value })}
                                    placeholder="0400 000 000"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-base font-bold uppercase tracking-wider text-zinc-400 ml-1">Account Email</label>
                                <input
                                    type="email"
                                    className="w-full bg-zinc-50 border-none rounded-xl px-4 py-3.5 text-zinc-900 font-medium focus:ring-2 focus:ring-orange-500/20"
                                    value={formData.business_email}
                                    onChange={(e) => setFormData({ ...formData, business_email: e.target.value })}
                                    placeholder="info@business.com"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Card: Why Refer Us (Referrer Pitch) */}
                    <section className="bg-white border border-zinc-200 rounded-[32px] p-8 md:p-10 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="size-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-500">
                                <User className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-zinc-900">Why Refer Us</h2>
                                <p className="text-sm text-zinc-500 font-medium">Your pitch to referrers — tell them why they should recommend you</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-base font-bold uppercase tracking-wider text-zinc-400 ml-1">Referrer Pitch</label>
                            <textarea
                                rows={4}
                                className="w-full bg-zinc-50 border-none rounded-xl px-4 py-3.5 text-zinc-900 font-medium focus:ring-2 focus:ring-purple-500/20 placeholder-zinc-300 resize-none"
                                value={formData.why_refer_us}
                                onChange={(e) => setFormData({ ...formData, why_refer_us: e.target.value })}
                                placeholder="e.g. We respond to every lead within 2 hours, always show up on time, and our customers love us. Referrers earn $15 per qualified lead — the easiest money you'll make!"
                            />
                            <p className="text-sm text-zinc-400 ml-1">This appears on your referrer partner page to convince referrers to promote you.</p>
                        </div>
                    </section>

                    {/* Card 2: Referral Fee Settings */}
                    <section className="bg-white border border-zinc-200 rounded-[32px] p-8 md:p-10 shadow-sm overflow-hidden relative">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="size-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-zinc-900">Referral Fee Settings</h2>
                                <p className="text-sm text-zinc-500 font-medium">Control the cost of new leads</p>
                            </div>
                        </div>
                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-base font-bold uppercase tracking-wider text-zinc-400 ml-1">Base Referral Fee (Click to Edit)</label>
                                <div className="relative flex items-center max-w-xs">
                                    <span className="absolute left-4 text-2xl font-black text-zinc-900 pointer-events-none">$</span>
                                    <input
                                        type="number"
                                        min="3"
                                        step="1"
                                        className="w-full bg-white border-2 border-orange-200 rounded-2xl pl-10 pr-4 py-6 text-4xl font-black text-zinc-900 focus:ring-4 focus:ring-orange-500/30 focus:border-orange-500 hover:border-orange-300 transition-all cursor-text"
                                        value={formData.referral_fee_cents / 100}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value) || 0;
                                            setFormData({ ...formData, referral_fee_cents: Math.round(val * 100) });
                                        }}
                                        placeholder="10.00"
                                    />
                                </div>
                                <p className="text-base text-zinc-600 ml-1 font-semibold">&#128161; Click the amount above to change your referral fee</p>

                                <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-xl mt-3">
                                    <p className="text-base text-orange-900 font-bold leading-relaxed">
                                        &#128176; <span className="font-black">For Quality Leads:</span> We recommend setting your referral fee at <span className="font-black">$10 or higher</span> to encourage referrers to actively promote your business and send you high-quality leads.
                                    </p>
                                </div>

                                {formData.referral_fee_cents < 300 && (
                                    <p className="text-base text-red-500 mt-1 font-bold ml-1">&#9888;&#65039; Minimum reward is $3.00</p>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                                    <p className="text-base font-extrabold uppercase tracking-[0.1em] text-zinc-400 mb-2">Referrer Reward</p>
                                    <p className="text-2xl font-bold text-zinc-900">${(formData.referral_fee_cents / 100).toFixed(2)}</p>
                                    <p className="text-base text-zinc-500 mt-1">80% of total fee</p>
                                </div>
                                <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                                    <p className="text-base font-extrabold uppercase tracking-[0.1em] text-zinc-400 mb-2">Platform Fee (20%)</p>
                                    <p className="text-2xl font-bold text-zinc-900">${(formData.referral_fee_cents * 0.2 / 100).toFixed(2)}</p>
                                    <p className="text-base text-zinc-500 mt-1">Processing & insurance</p>
                                </div>
                                <div className="bg-orange-500 p-6 rounded-2xl shadow-xl shadow-orange-500/20 text-white relative overflow-hidden">
                                    <div className="relative z-10">
                                        <p className="text-base font-extrabold uppercase tracking-[0.1em] text-white/80 mb-2">Total Unlock Price</p>
                                        <p className="text-2xl font-black text-white">${(formData.referral_fee_cents * 1.2 / 100).toFixed(2)}</p>
                                        <p className="text-base text-white/80 mt-1">Tax included</p>
                                    </div>
                                    <div className="absolute -right-4 -bottom-4 size-20 bg-white/10 rounded-full blur-2xl"></div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Card: Response SLA */}
                    <section className="bg-white border border-zinc-200 rounded-[32px] p-8 md:p-10 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="size-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-zinc-900">Response Time Target</h2>
                                <p className="text-sm text-zinc-500 font-medium">Set your target response time for new leads — displayed on your referrer partner page</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    { label: "30 min", value: 30 },
                                    { label: "1 hour", value: 60 },
                                    { label: "2 hours", value: 120 },
                                    { label: "4 hours", value: 240 },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setFormData({ ...formData, response_sla_minutes: opt.value })}
                                        className={`p-4 rounded-xl border-2 text-center font-bold transition-all ${formData.response_sla_minutes === opt.value
                                                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                                : "border-zinc-200 text-zinc-600 hover:border-emerald-300"
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                            {formData.response_sla_minutes && (
                                <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                                    <p className="text-sm font-bold text-emerald-800">
                                        Referrers will see: "Responds in &lt; {formData.response_sla_minutes < 60 ? `${formData.response_sla_minutes} min` : `${formData.response_sla_minutes / 60} hour${formData.response_sla_minutes > 60 ? 's' : ''}`}"
                                    </p>
                                    <button
                                        onClick={() => setFormData({ ...formData, response_sla_minutes: null })}
                                        className="text-xs font-bold text-emerald-600 hover:text-emerald-800 underline"
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}
                            <p className="text-sm text-zinc-400 ml-1">Setting a response time target builds trust with referrers and earns you a speed badge on your directory listing.</p>
                        </div>
                    </section>

                    {/* Card 3: ABN Verification */}
                    <section className="bg-white border border-zinc-200 rounded-[32px] p-8 md:p-10 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-zinc-900">ABN Verification</h2>
                                    <p className="text-sm text-zinc-500 font-medium">Verify your Australian Business Number</p>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch gap-3 md:min-w-[480px]">
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        placeholder="11 222 333 444"
                                        className="w-full bg-zinc-50 border-none rounded-xl px-4 py-4 text-zinc-900 font-mono tracking-widest focus:ring-2 focus:ring-blue-600/20 placeholder-zinc-300"
                                        value={formData.abn}
                                        onChange={(e) => setFormData({ ...formData, abn: e.target.value.replace(/\s/g, '') })}
                                    />
                                </div>
                                <button
                                    onClick={handleVerifyABN}
                                    disabled={verifying || !formData.abn || formData.abn.length < 11}
                                    className="bg-blue-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
                                >
                                    {verifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                                    {verifying ? "Verifying..." : "Verify ABN"}
                                </button>
                            </div>
                        </div>
                        {biz?.is_verified && (
                            <div className="mt-8 pt-8 border-t border-zinc-100 flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-blue-500" />
                                <div>
                                    <p className="text-base font-bold text-zinc-900">Verified</p>
                                    <p className="text-base text-zinc-500 font-mono">{biz.abn}</p>
                                </div>
                            </div>
                        )}
                        <div className="mt-8 pt-8 border-t border-zinc-100 flex items-start gap-3">
                            <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5" />
                            <p className="text-base text-zinc-500 leading-relaxed">Verification ensures your business is compliant with Australian trade regulations. Verified businesses receive a badge and higher priority in referral rankings.</p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
