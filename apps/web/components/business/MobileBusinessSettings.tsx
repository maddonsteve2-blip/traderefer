"use client";

import { Save, ChevronLeft, Building2, Shield, Loader2, Copy, ExternalLink, MapPin, Globe, Phone, Mail, BadgeCheck, Zap } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface MobileBusinessSettingsProps {
    formData: any;
    setFormData: (data: any) => void;
    saving: boolean;
    onSave: () => void;
    onVerifyABN: () => void;
    verifying: boolean;
    slugStatus: string;
    checkSlug: (slug: string) => void;
    isVerified: boolean;
}

export function MobileBusinessSettings({
    formData,
    setFormData,
    saving,
    onSave,
    onVerifyABN,
    verifying,
    slugStatus,
    checkSlug,
    isVerified
}: MobileBusinessSettingsProps) {

    const storefrontDisplayUrl = formData.slug ? `traderefer.com.au/b/${formData.slug}` : "traderefer.com.au/b/your-business";
    const storefrontHref = formData.slug ? `https://traderefer.com.au/b/${formData.slug}` : "https://traderefer.com.au/b/your-business";

    return (
        <div className="lg:hidden flex flex-col min-h-screen bg-white pb-32">
            <div className="pt-4 px-5 flex flex-col gap-6">
                {/* ── Header ── */}
                <div className="flex flex-col gap-1.5">
                    <h1 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight leading-none">Business Profile</h1>
                    <p className="text-base font-medium text-zinc-500 leading-relaxed">Configure how you appear to referrers.</p>
                </div>

                {/* ── Business Details Card ── */}
                <div className="bg-zinc-50 rounded-[32px] p-6 flex flex-col gap-6 border border-zinc-100 shadow-sm">
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">General Info</h3>
                    
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Building2 className="w-3 h-3" /> Business Name
                        </label>
                        <input 
                            value={formData.business_name}
                            onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                            className="w-full h-14 bg-white rounded-2xl px-5 text-lg font-bold text-zinc-900 border border-zinc-100 outline-none shadow-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-display"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">Category</label>
                            <input 
                                value={formData.trade_category}
                                onChange={(e) => setFormData({ ...formData, trade_category: e.target.value })}
                                className="w-full h-14 bg-white rounded-2xl px-5 text-base font-bold text-zinc-900 border border-zinc-100 outline-none shadow-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">Suburb</label>
                            <input 
                                value={formData.suburb}
                                onChange={(e) => setFormData({ ...formData, suburb: e.target.value })}
                                className="w-full h-14 bg-white rounded-2xl px-5 text-base font-bold text-zinc-900 border border-zinc-100 outline-none shadow-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* ── Pitch Section ── */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-xl font-black text-zinc-900 tracking-tight font-display">Your Pitch</h3>
                    <div className="flex flex-col gap-3">
                         <div className="flex flex-col gap-2">
                            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">Why Refer Us?</label>
                            <textarea 
                                value={formData.why_refer_us}
                                onChange={(e) => setFormData({ ...formData, why_refer_us: e.target.value })}
                                rows={4}
                                className="w-full bg-white rounded-3xl p-5 text-base font-medium text-zinc-900 border border-zinc-100 outline-none shadow-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all resize-none leading-relaxed"
                                placeholder="Tell referrers why your service is easy to recommend..."
                            />
                        </div>
                    </div>
                </div>

                {/* ── Fee Structure ── */}
                <div className="bg-zinc-900 rounded-[24px] p-6 text-white flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Referral Fee</h3>
                            <p className="text-[11px] text-zinc-500 font-bold">What you pay per won lead</p>
                        </div>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-orange-500 text-lg">$</span>
                            <input 
                                type="number"
                                value={formData.referral_fee_cents / 100}
                                onChange={(e) => setFormData({ ...formData, referral_fee_cents: Math.round(parseFloat(e.target.value) * 100) || 0 })}
                                className="w-24 h-12 bg-white/10 rounded-xl pl-7 pr-3 text-lg font-black text-white border-none outline-none text-right focus:bg-white/20"
                            />
                        </div>
                    </div>
                    
                    <div className="h-px bg-white/10 w-full" />
                    
                    <div className="grid grid-cols-2 gap-4">
                         <div className="flex flex-col gap-1">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase">Referrer Gets</p>
                            <p className="text-[20px] font-black text-white">${(formData.referral_fee_cents / 100).toFixed(2)}</p>
                         </div>
                         <div className="flex flex-col gap-1">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase">Total Price</p>
                            <p className="text-[20px] font-black text-orange-500">${(formData.referral_fee_cents * 1.2 / 100).toFixed(2)}</p>
                         </div>
                    </div>
                </div>

                {/* ── Slug & Link ── */}
                <div className="bg-zinc-50 rounded-[32px] p-6 flex flex-col gap-6 border border-zinc-100 shadow-sm">
                     <div className="flex flex-col gap-2">
                        <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                             <Globe className="w-3 h-3" /> Profile URL
                        </label>
                        <div className="flex items-center gap-2">
                            <input 
                                value={formData.slug}
                                onChange={(e) => {
                                    const val = e.target.value.toLowerCase().replace(/\s+/g, '-');
                                    setFormData({ ...formData, slug: val });
                                    checkSlug(val);
                                }}
                                className={`flex-1 h-14 bg-white rounded-2xl px-5 text-base font-bold text-zinc-900 border outline-none shadow-sm focus:ring-4 focus:ring-orange-500/10 transition-all ${slugStatus === 'taken' ? 'border-red-300 text-red-500' : 'border-zinc-100 focus:border-orange-500'}`}
                            />
                        </div>
                        <p className={`text-[11px] font-bold ${slugStatus === 'taken' ? 'text-red-500' : 'text-zinc-400'} ml-1 uppercase tracking-wider`}>
                            {slugStatus === 'taken' ? 'URL already taken' : 'traderefer.au/b/' + formData.slug}
                        </p>
                    </div>

                    <button 
                        onClick={() => {
                            navigator.clipboard.writeText(storefrontHref);
                            toast.success("URL copied!");
                        }}
                        className="w-full h-14 bg-white border border-zinc-200 rounded-2xl flex items-center justify-center gap-3 text-sm font-black text-zinc-900 active:scale-[0.98] transition-all uppercase tracking-widest shadow-sm hover:bg-zinc-50"
                    >
                        <Copy className="w-4 h-4 text-orange-500" />
                        Copy Preview Link
                    </button>
                </div>

                {/* ── Save Button (Floating-ish) ── */}
                <button 
                    onClick={onSave}
                    disabled={saving || slugStatus === 'taken'}
                    className="w-full h-14 bg-orange-500 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                    {saving ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Save className="w-5 h-5 text-white" />}
                    <span className="text-[15px] font-extrabold text-white">Save All Changes</span>
                </button>
            </div>
        </div>
    );
}
