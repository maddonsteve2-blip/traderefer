"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState, useCallback } from "react";
import {
    Target, MapPin, Phone, Mail,
    Unlock, Loader2, ChevronRight, User, ArrowLeft, Search,
    Lock as LockIcon
} from "lucide-react";
import { PinConfirmationModal } from "@/components/dashboard/PinConfirmationModal";
import { toast } from "sonner";
import { useLiveEvent } from "@/hooks/useLiveEvents";
import { EmptyState } from "@/components/ui/EmptyState";

interface Lead {
    id: string;
    customer_name: string;
    suburb: string;
    trade_type: string;
    description: string;
    status: string;
    created_at: string;
    unlock_fee_cents: number;
    referral_fee_snapshot_cents: number;
    platform_fee_cents: number;
    phone?: string;
    email?: string;
    address?: string;
    referrer_name?: string;
}

const STATUS_COLORS: Record<string, string> = {
    NEW: "bg-orange-100 text-orange-700",
    PENDING: "bg-orange-100 text-orange-700",
    VERIFIED: "bg-orange-100 text-orange-700",
    SCREENING: "bg-zinc-100 text-zinc-600",
    READY_FOR_BUSINESS: "bg-orange-100 text-orange-700",
    SCREENING_FAILED: "bg-red-100 text-red-700",
    UNLOCKED: "bg-blue-100 text-blue-700",
    ON_THE_WAY: "bg-blue-100 text-blue-700",
    CONFIRMED: "bg-emerald-100 text-emerald-700",
    CONFIRMED_SUCCESS: "bg-emerald-100 text-emerald-700",
    MEETING_VERIFIED: "bg-emerald-100 text-emerald-700",
    VALID_LEAD: "bg-emerald-100 text-emerald-700",
    PAYMENT_PENDING_CONFIRMATION: "bg-amber-100 text-amber-700",
};

const STATUS_LABELS: Record<string, string> = {
    NEW: "New Lead",
    PENDING: "New Lead",
    VERIFIED: "Ready to Unlock",
    SCREENING: "Under Review",
    READY_FOR_BUSINESS: "Ready to Unlock",
    SCREENING_FAILED: "Not a Match",
    UNLOCKED: "Unlocked",
    ON_THE_WAY: "On the Way",
    CONFIRMED: "Confirmed",
    CONFIRMED_SUCCESS: "Job Confirmed",
    MEETING_VERIFIED: "Meeting Verified",
    VALID_LEAD: "Valid Lead",
    PAYMENT_PENDING_CONFIRMATION: "Awaiting Confirmation",
    EXPIRED: "Expired",
    DISPUTED: "Under Review",
};

function formatStatus(status: string): string {
    return STATUS_LABELS[status.toUpperCase()] || status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function fmt(d: string) {
    if (!d) return "";
    try {
        const date = new Date(d.endsWith("Z") || d.includes("+") || d.includes("T") ? d : d + "Z");
        if (isNaN(date.getTime())) return "";
        return date.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
    } catch {
        return "";
    }
}

export function SalesLeadsPane() {
    const { getToken, isLoaded } = useAuth();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [unlocking, setUnlocking] = useState<string | null>(null);
    const [showPinModal, setShowPinModal] = useState<string | null>(null);
    const apiUrl = "/api/backend";

    const fetchLeads = useCallback(async () => {
        const token = await getToken();
        const businessRes = await fetch(`${apiUrl}/business/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (!businessRes.ok) { setLoading(false); return; }
        const biz = await businessRes.json();
        const res = await fetch(`${apiUrl}/business/${biz.id}/leads?limit=50`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setLeads(await res.json());
        setLoading(false);
    }, [getToken, apiUrl]);

    useEffect(() => { if (isLoaded) fetchLeads(); }, [isLoaded, fetchLeads]);

    // SSE: refresh leads when new lead arrives or one gets unlocked
    useLiveEvent("lead_new", () => { fetchLeads(); });
    useLiveEvent("lead_unlocked", () => { fetchLeads(); });

    const handleUnlock = async (leadId: string) => {
        setUnlocking(leadId);
        const token = await getToken();
        const res = await fetch(`${apiUrl}/leads/${leadId}/unlock`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });
        setUnlocking(null);
        if (res.ok) {
            toast.success("Lead unlocked!");
            fetchLeads();
        } else {
            const err = await res.json().catch(() => ({}));
            if (err.detail?.includes("PIN")) {
                setShowPinModal(leadId);
            } else {
                toast.error(err.detail || "Failed to unlock lead.");
            }
        }
    };

    const selected = leads.find(l => l.id === selectedId) ?? null;
    const isUnlocked = (status: string) =>
        ["UNLOCKED", "ON_THE_WAY", "CONFIRMED", "MEETING_VERIFIED", "VALID_LEAD", "PAYMENT_PENDING_CONFIRMATION", "CONFIRMED_SUCCESS"].includes(status.toUpperCase());

    return (
        <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* LEFT — leads list */}
            <div className={`${selected ? "hidden md:flex" : "flex"} w-full md:w-[340px] shrink-0 border-r border-zinc-200 overflow-y-auto bg-white flex-col`}>
                <div className="sticky top-0 bg-white border-b border-zinc-100 z-10">
                    <div className="px-5 py-4">
                        <p className="font-black text-zinc-900 text-2xl tracking-tight">
                            Leads
                            <span className="ml-2 font-bold text-zinc-300 text-xl">({leads.length})</span>
                        </p>
                    </div>
                    {/* Search Bar (Design Style) */}
                    <div className="px-5 pb-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input 
                                type="text" 
                                placeholder="Search leads or trades..." 
                                className="w-full h-[52px] bg-[#F4F4F5] rounded-[16px] pl-11 pr-4 text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16 flex-1">
                        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                    </div>
                ) : leads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-5 text-center flex-1">
                        <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
                            <Target className="w-8 h-8 text-zinc-200" />
                        </div>
                        <p className="font-black text-zinc-900 text-xl">No leads yet</p>
                        <p className="text-zinc-500 font-medium mt-1 text-[15px]">Leads sent by your referrers will appear here.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2 p-2">
                        {leads.map(lead => {
                            const unlocked = isUnlocked(lead.status);
                            const isSelected = selectedId === lead.id;
                            return (
                                <button
                                    key={lead.id}
                                    onClick={() => setSelectedId(lead.id)}
                                    className={`w-full text-left px-4 py-4 rounded-[20px] transition-all ${isSelected ? "bg-orange-50 border border-orange-100" : "hover:bg-zinc-50 border border-transparent"}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-base uppercase shrink-0 ${unlocked ? 'bg-zinc-100 text-zinc-400' : 'bg-zinc-100 text-zinc-300'}`}>
                                            {unlocked ? (lead.customer_name?.[0] || 'L') : <LockIcon className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-bold truncate text-[16px] ${unlocked ? 'text-zinc-900' : 'text-zinc-400 italic'}`}>
                                                {unlocked ? lead.customer_name : 'Locked Lead'}
                                            </p>
                                            <div className="flex items-center justify-between gap-1.5 mt-1">
                                                <p className="text-zinc-500 font-medium truncate flex items-center gap-1 text-[13px]">
                                                    <MapPin className="w-3.5 h-3.5" />{lead.suburb}
                                                </p>
                                                <span className={`shrink-0 px-2 py-0.5 rounded-full font-black text-[9px] uppercase tracking-widest ${STATUS_COLORS[lead.status.toUpperCase()] ?? "bg-zinc-100 text-zinc-600"}`}>
                                                    {formatStatus(lead.status)}
                                                </span>
                                            </div>
                                            <p className="text-zinc-400 font-bold text-[11px] uppercase tracking-tighter mt-0.5">{fmt(lead.created_at)}</p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* RIGHT — quick view */}
            <div className={`${selected ? "flex" : "hidden md:flex"} flex-1 min-h-0 flex-col overflow-y-auto bg-zinc-50`}>
                {!selected ? (
                    <EmptyState
                        icon={LockIcon}
                        iconColor="text-zinc-400"
                        iconBg="bg-zinc-100"
                        title="Select a lead to view details"
                        description="Leads marked 'Ready to Unlock' contain a customer's contact details. Top up your wallet to claim them — you only pay when you unlock."
                        primaryCTA={{ label: 'Top up wallet', href: '/dashboard/business/wallet' }}
                        secondaryCTA={{ label: 'Invite a referrer', href: '/dashboard/business/force?tab=partners' }}
                        tip="Leads expire after 7 days — unlock them before they're gone."
                        ghostRows={[
                            { widths: ['w-32', 'w-48'] },
                            { widths: ['w-24', 'w-36'] },
                        ]}
                        className="flex-1 items-center justify-center h-full"
                    />
                ) : (
                    <div className="max-w-lg mx-auto px-6 py-6 space-y-4">
                        <button
                            onClick={() => setSelectedId(null)}
                            className="md:hidden inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-900 font-bold text-lg"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to leads
                        </button>

                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="font-black text-zinc-900 text-3xl">
                                    {isUnlocked(selected.status) ? selected.customer_name : (
                                        <span className="flex items-center gap-2 text-zinc-400 italic"><LockIcon className="w-6 h-6" /> Locked Lead</span>
                                    )}
                                </h2>
                                <p className="flex items-center gap-1.5 text-zinc-400 font-medium mt-1.5 text-xl">
                                    <MapPin className="w-5 h-5" />{selected.suburb}
                                </p>
                            </div>
                            <span className={`px-4 py-2 rounded-xl font-bold ${STATUS_COLORS[selected.status.toUpperCase()] ?? "bg-zinc-100 text-zinc-600"} text-xl`}>
                                {formatStatus(selected.status)}
                            </span>
                        </div>

                        {/* Description */}
                        <div className="bg-white rounded-2xl border border-zinc-100 p-6">
                            <p className="font-bold text-zinc-500 uppercase tracking-wider mb-2 text-base">Job Description</p>
                            <p className="font-medium text-zinc-700 leading-relaxed text-xl">
                                {selected.description || "No description provided."}
                            </p>
                        </div>

                        {/* Contact details (if unlocked) */}
                        {isUnlocked(selected.status) ? (
                            <div className="bg-white rounded-2xl border border-zinc-100 p-6 space-y-4">
                                <p className="font-bold text-zinc-500 uppercase tracking-wider mb-1 text-base">Contact Details</p>
                                {selected.phone && (
                                    <a href={`tel:${selected.phone}`} className="flex items-center gap-4 text-zinc-700 hover:text-orange-600 transition-colors">
                                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                                            <Phone className="w-5 h-5 text-orange-600" />
                                        </div>
                                        <span className="font-bold text-xl">{selected.phone}</span>
                                    </a>
                                )}
                                {selected.email && (
                                    <a href={`mailto:${selected.email}`} className="flex items-center gap-4 text-zinc-700 hover:text-orange-600 transition-colors">
                                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                                            <Mail className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <span className="font-bold text-xl">{selected.email}</span>
                                    </a>
                                )}
                            </div>
                        ) : (
                            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 text-center">
                                <Unlock className="w-10 h-10 text-orange-400 mx-auto mb-3" />
                                <p className="font-black text-zinc-900 mb-1 text-2xl">Unlock to see contact details</p>
                                <p className="text-zinc-500 font-medium mb-4 text-xl">
                                    Fee: ${(selected.unlock_fee_cents / 100).toFixed(2)}
                                </p>
                                <button
                                    onClick={() => handleUnlock(selected.id)}
                                    disabled={unlocking === selected.id}
                                    className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black transition-all disabled:opacity-60 text-xl"
                                >
                                    {unlocking === selected.id ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : `Unlock Lead — $${(selected.unlock_fee_cents / 100).toFixed(2)}`}
                                </button>
                            </div>
                        )}

                        {/* Referrer info */}
                        {selected.referrer_name && (
                            <div className="bg-white rounded-2xl border border-zinc-100 p-6 flex items-center gap-4">
                                <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center shrink-0">
                                    <User className="w-6 h-6 text-zinc-500" />
                                </div>
                                <div>
                                    <p className="font-bold text-zinc-400 text-base">Sent by</p>
                                    <p className="font-black text-zinc-900 text-xl">{selected.referrer_name}</p>
                                </div>
                            </div>
                        )}

                        <p className="text-zinc-400 font-medium text-center text-base">
                            Received {fmt(selected.created_at)}
                        </p>
                    </div>
                )}
            </div>

            {showPinModal && (
                <PinConfirmationModal
                    leadId={showPinModal}
                    onClose={() => setShowPinModal(null)}
                    onConfirmed={() => { setShowPinModal(null); fetchLeads(); }}
                />
            )}
        </div>
    );
}
