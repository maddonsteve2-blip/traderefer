"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState, useCallback } from "react";
import {
    Target, MapPin, Phone, Mail,
    Unlock, Loader2, ChevronRight, User, ArrowLeft
} from "lucide-react";
import { PinConfirmationModal } from "@/components/dashboard/PinConfirmationModal";
import { toast } from "sonner";

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
    UNLOCKED: "bg-blue-100 text-blue-700",
    ON_THE_WAY: "bg-blue-100 text-blue-700",
    CONFIRMED: "bg-emerald-100 text-emerald-700",
    CONFIRMED_SUCCESS: "bg-emerald-100 text-emerald-700",
    MEETING_VERIFIED: "bg-emerald-100 text-emerald-700",
    VALID_LEAD: "bg-emerald-100 text-emerald-700",
    PAYMENT_PENDING_CONFIRMATION: "bg-amber-100 text-amber-700",
};

function fmt(d: string) {
    return new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
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
                <div className="sticky top-0 bg-white border-b border-zinc-100 px-4 py-3 z-10">
                    <p className="font-black text-zinc-900" style={{ fontSize: 22 }}>
                        Leads
                        <span className="ml-2 font-bold text-zinc-400" style={{ fontSize: 19 }}>({leads.length})</span>
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16 flex-1">
                        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                    </div>
                ) : leads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center flex-1">
                        <Target className="w-10 h-10 text-zinc-200 mb-3" />
                        <p className="font-bold text-zinc-400" style={{ fontSize: 18 }}>No leads yet</p>
                        <p className="text-zinc-300 font-medium mt-1" style={{ fontSize: 16 }}>Leads sent by your referrers appear here</p>
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-100">
                        {leads.map(lead => {
                            const unlocked = isUnlocked(lead.status);
                            const isSelected = selectedId === lead.id;
                            return (
                                <button
                                    key={lead.id}
                                    onClick={() => setSelectedId(lead.id)}
                                    className={`w-full text-left px-4 py-4 transition-colors ${isSelected ? "bg-orange-50 border-l-4 border-orange-500" : "hover:bg-zinc-50 border-l-4 border-transparent"}`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-zinc-900 truncate" style={{ fontSize: 22 }}>
                                                {lead.customer_name}
                                            </p>
                                            <p className="text-zinc-400 font-medium truncate flex items-center gap-1.5 mt-1" style={{ fontSize: 19 }}>
                                                <MapPin className="w-4 h-4 shrink-0" />{lead.suburb}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                                            <span className={`px-2 py-0.5 rounded-lg font-bold ${STATUS_COLORS[lead.status.toUpperCase()] ?? "bg-zinc-100 text-zinc-600"}`} style={{ fontSize: 17 }}>
                                                {lead.status.replace(/_/g, " ")}
                                            </span>
                                            <span className="text-zinc-400 font-medium" style={{ fontSize: 18 }}>{fmt(lead.created_at)}</span>
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
                    <div className="flex flex-col items-center justify-center h-full text-center px-8">
                        <ChevronRight className="w-16 h-16 text-zinc-200 mb-4" />
                        <p className="font-black text-zinc-400" style={{ fontSize: 24 }}>Select a lead</p>
                        <p className="text-zinc-400 font-medium mt-1" style={{ fontSize: 20 }}>Click a lead on the left to view details</p>
                    </div>
                ) : (
                    <div className="max-w-lg mx-auto px-6 py-6 space-y-4">
                        <button
                            onClick={() => setSelectedId(null)}
                            className="md:hidden inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-900 font-bold"
                            style={{ fontSize: 19 }}
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to leads
                        </button>

                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="font-black text-zinc-900" style={{ fontSize: 32 }}>{selected.customer_name}</h2>
                                <p className="flex items-center gap-1.5 text-zinc-400 font-medium mt-1.5" style={{ fontSize: 21 }}>
                                    <MapPin className="w-5 h-5" />{selected.suburb}
                                </p>
                            </div>
                            <span className={`px-4 py-2 rounded-xl font-bold ${STATUS_COLORS[selected.status.toUpperCase()] ?? "bg-zinc-100 text-zinc-600"}`} style={{ fontSize: 20 }}>
                                {selected.status.replace(/_/g, " ")}
                            </span>
                        </div>

                        {/* Description */}
                        <div className="bg-white rounded-2xl border border-zinc-100 p-6">
                            <p className="font-bold text-zinc-500 uppercase tracking-wider mb-2" style={{ fontSize: 18 }}>Job Description</p>
                            <p className="font-medium text-zinc-700 leading-relaxed" style={{ fontSize: 22 }}>
                                {selected.description || "No description provided."}
                            </p>
                        </div>

                        {/* Contact details (if unlocked) */}
                        {isUnlocked(selected.status) ? (
                            <div className="bg-white rounded-2xl border border-zinc-100 p-6 space-y-4">
                                <p className="font-bold text-zinc-500 uppercase tracking-wider mb-1" style={{ fontSize: 18 }}>Contact Details</p>
                                {selected.phone && (
                                    <a href={`tel:${selected.phone}`} className="flex items-center gap-4 text-zinc-700 hover:text-orange-600 transition-colors">
                                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                                            <Phone className="w-5 h-5 text-orange-600" />
                                        </div>
                                        <span className="font-bold" style={{ fontSize: 22 }}>{selected.phone}</span>
                                    </a>
                                )}
                                {selected.email && (
                                    <a href={`mailto:${selected.email}`} className="flex items-center gap-4 text-zinc-700 hover:text-orange-600 transition-colors">
                                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                                            <Mail className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <span className="font-bold" style={{ fontSize: 22 }}>{selected.email}</span>
                                    </a>
                                )}
                            </div>
                        ) : (
                            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 text-center">
                                <Unlock className="w-10 h-10 text-orange-400 mx-auto mb-3" />
                                <p className="font-black text-zinc-900 mb-1" style={{ fontSize: 24 }}>Unlock to see contact details</p>
                                <p className="text-zinc-500 font-medium mb-4" style={{ fontSize: 21 }}>
                                    Fee: ${(selected.unlock_fee_cents / 100).toFixed(2)}
                                </p>
                                <button
                                    onClick={() => handleUnlock(selected.id)}
                                    disabled={unlocking === selected.id}
                                    className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black transition-all disabled:opacity-60"
                                    style={{ fontSize: 22 }}
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
                                    <p className="font-bold text-zinc-400" style={{ fontSize: 18 }}>Sent by</p>
                                    <p className="font-black text-zinc-900" style={{ fontSize: 22 }}>{selected.referrer_name}</p>
                                </div>
                            </div>
                        )}

                        <p className="text-zinc-400 font-medium text-center" style={{ fontSize: 18 }}>
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
