"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, Info, MapPin, Phone, MessageSquare, Unlock, Zap, CheckCircle2, Gift, Wallet, Clock, XCircle, ArrowRight, Users } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PinConfirmationModal } from "@/components/dashboard/PinConfirmationModal";
import { WalletWidget } from "@/components/dashboard/WalletWidget";
import Link from "next/link";
import { toast } from "sonner";
import posthog from "posthog-js";

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
    phone?: string;
    email?: string;
    address?: string;
    referrer_name?: string;
}

export function MobileBusinessLeads() {
    const { getToken, userId } = useAuth();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [isUnlocking, setIsUnlocking] = useState<string | null>(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
    const [showPinModal, setShowPinModal] = useState<string | null>(null);
    const [walletError, setWalletError] = useState<string | null>(null);
    const [walletBalance, setWalletBalance] = useState(0);

    const fetchLeads = async () => {
        try {
            const token = await getToken();
            const meRes = await fetch(`/api/backend/business/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!meRes.ok) { setLoading(false); return; }
            const meData = await meRes.json();
            setWalletBalance(meData.wallet_balance_cents || 0);
            
            const res = await fetch(`/api/backend/business/${meData.id}/leads?limit=50`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const leadsData = Array.isArray(data) ? data : (data?.leads && Array.isArray(data.leads) ? data.leads : []);
                setLeads(leadsData);
            }
        } catch (error) {
            console.error("Error fetching leads:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleUnlock = async (leadId: string) => {
        if (!userId) {
            toast.error("Please sign in to unlock leads");
            return;
        }

        const lead = leads.find(l => l.id === leadId);
        posthog.capture('lead_unlock_initiated', {
            lead_id: leadId,
            unlock_fee_cents: lead?.unlock_fee_cents,
        });

        setIsUnlocking(leadId);
        setWalletError(null);

        try {
            const token = await getToken();
            const res = await fetch(`/api/backend/leads/${leadId}/unlock`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.status === 402) {
                const err = await res.json();
                setWalletError(err.detail || "Insufficient wallet balance.");
                return;
            }

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Failed to unlock lead");
            }

            const data = await res.json();
            if (data.status === "UNLOCKED") {
                toast.success("Lead unlocked successfully!");
                await fetchLeads();
                window.dispatchEvent(new Event('wallet-updated'));
            }
        } catch (error) {
            toast.error((error as Error).message);
        } finally {
            setIsUnlocking(null);
        }
    };

    const handleOnTheWay = async (leadId: string) => {
        setIsUpdatingStatus(leadId);
        try {
            const token = await getToken();
            const res = await fetch(`/api/backend/leads/${leadId}/on-the-way`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error("Failed to update status");
            await fetchLeads();
            toast.success("Status updated — customer notified.");
        } catch (error) {
            toast.error((error as Error).message);
        } finally {
            setIsUpdatingStatus(null);
        }
    };

    const handlePinConfirmed = async (leadId: string) => {
        await fetchLeads();
        setShowPinModal(null);
        toast.success("Job confirmed! Referral payment released.");
    };

    if (loading) {
        return (
            <div className="lg:hidden h-40 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-orange-500 animate-spin" />
            </div>
        );
    }

    const filteredLeads = leads.filter(l => {
        const matchesSearch = 
            l.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
            l.description.toLowerCase().includes(search.toLowerCase()) ||
            l.suburb.toLowerCase().includes(search.toLowerCase());

        const matchesFilter = (() => {
            if (filter === "new") return ["PENDING", "VERIFIED", "READY_FOR_BUSINESS"].includes(l.status);
            if (filter === "unlocked") return ["UNLOCKED", "ON_THE_WAY", "MEETING_VERIFIED"].includes(l.status);
            if (filter === "won") return ["CONFIRMED", "CONFIRMED_SUCCESS"].includes(l.status);
            return true;
        })();

        return matchesSearch && matchesFilter;
    });

    const UNLOCKED_STATUSES = ["UNLOCKED", "ON_THE_WAY", "MEETING_VERIFIED", "VALID_LEAD", "CONFIRMED_SUCCESS", "CONFIRMED"];
    const LOCKED_STATUSES = ["PENDING", "VERIFIED", "READY_FOR_BUSINESS", "SCREENING"];

    return (
        <div className="lg:hidden flex flex-col min-h-screen bg-zinc-50 pb-32">
            <div className="pt-4 px-4 flex flex-col gap-6">
                
                {/* ── Header ── */}
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-1.5">
                        <h1 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight leading-none font-display">Leads</h1>
                        <p className="text-base font-medium text-zinc-500 leading-relaxed">Manage lead unlocks, customer contact, and job progression.</p>
                    </div>
                    
                    {/* ── Search Box ── */}
                    <div className="bg-white rounded-2xl p-5 flex items-center gap-4 border border-zinc-100 shadow-sm focus-within:ring-4 focus-within:ring-orange-500/10 focus-within:border-orange-500 transition-all">
                        <Search className="w-5 h-5 text-zinc-400" />
                        <input 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search leads..."
                            className="bg-transparent border-none outline-none text-lg font-bold text-zinc-900 placeholder-zinc-300 w-full"
                        />
                    </div>
                </div>

                {/* ── Wallet Warning ── */}
                {walletError && (
                    <div className="bg-red-50 border border-red-200 rounded-[24px] p-5 flex flex-col gap-3">
                        <div className="flex items-center gap-3 text-red-600">
                            <XCircle className="w-5 h-5 shrink-0" />
                            <p className="font-bold">{walletError}</p>
                        </div>
                        <div className="flex justify-center">
                            <WalletWidget currentBalance={walletBalance} />
                        </div>
                    </div>
                )}

                {/* ── Filters ── */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-2 -mx-1 px-1">
                    {["all", "new", "unlocked", "won"].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-6 h-12 rounded-2xl text-xs font-black transition-all whitespace-nowrap uppercase tracking-[0.15em] border ${
                                filter === f 
                                    ? "bg-zinc-900 text-white border-zinc-900 shadow-lg shadow-zinc-200" 
                                    : "bg-white text-zinc-400 border-zinc-100"
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* ── Leads List ── */}
                <div className="flex flex-col gap-4 pb-6">
                    {filteredLeads.map((lead) => {
                        const isUnlocked = UNLOCKED_STATUSES.includes(lead.status);
                        const isLocked = LOCKED_STATUSES.includes(lead.status) && lead.status !== 'SCREENING';
                        
                        return (
                            <div key={lead.id} className="bg-white border border-zinc-200 rounded-[32px] overflow-hidden shadow-sm">
                                <div className="p-6 space-y-5">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center">
                                                <Users className="w-5 h-5 text-zinc-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Sent by</p>
                                                <p className="text-base font-bold text-zinc-900">{lead.referrer_name || 'Anonymous'}</p>
                                            </div>
                                        </div>
                                        <Badge 
                                            variant={isUnlocked ? (['CONFIRMED', 'CONFIRMED_SUCCESS'].includes(lead.status) ? 'success' : 'warning') : 'outline'}
                                            className="uppercase font-black tracking-widest text-[10px]"
                                        >
                                            {formatStatus(lead.status)}
                                        </Badge>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-zinc-500 font-bold">
                                            <MapPin className="w-4 h-4 text-orange-500" />
                                            <p className="text-base">{lead.suburb}</p>
                                        </div>
                                        {isUnlocked ? (
                                            <div className="bg-zinc-50 rounded-2xl p-4 space-y-3">
                                                <p className="text-zinc-600 font-medium text-lg italic leading-relaxed">
                                                    "{lead.description}"
                                                </p>
                                                {lead.address && (
                                                    <div className="flex items-start gap-2 pt-3 border-t border-zinc-200">
                                                        <MapPin className="w-4 h-4 text-zinc-400 mt-1" />
                                                        <p className="text-zinc-900 font-bold">{lead.address}</p>
                                                    </div>
                                                )}
                                                {lead.phone && (
                                                    <div className="flex flex-wrap gap-4 pt-2">
                                                        <div className="flex items-center gap-2 text-zinc-900 font-black">
                                                            <Phone className="w-4 h-4 text-orange-500" />
                                                            {lead.phone}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-zinc-900 font-black">
                                                            <MessageSquare className="w-4 h-4 text-orange-500" />
                                                            Contact
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="bg-zinc-50 border border-dashed border-zinc-200 rounded-2xl p-4">
                                                <p className="text-zinc-500 font-medium text-lg italic">
                                                    "{lead.description}"
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* ── Actions ── */}
                                    <div className="pt-2">
                                        {isLocked ? (
                                            <Button 
                                                onClick={() => handleUnlock(lead.id)}
                                                disabled={isUnlocking === lead.id}
                                                className="w-full h-16 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black text-xl shadow-lg shadow-orange-500/20"
                                            >
                                                {isUnlocking === lead.id ? (
                                                    <Loader2 className="w-6 h-6 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Unlock className="w-5 h-5 mr-3" /> 
                                                        Unlock for ${((lead.unlock_fee_cents || 3500) / 100).toFixed(0)}
                                                    </>
                                                )}
                                            </Button>
                                        ) : lead.status === "UNLOCKED" ? (
                                            <Button
                                                onClick={() => handleOnTheWay(lead.id)}
                                                disabled={isUpdatingStatus === lead.id}
                                                className="w-full h-16 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black text-xl"
                                            >
                                                {isUpdatingStatus === lead.id ? (
                                                    <Loader2 className="w-6 h-6 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Zap className="w-5 h-5 mr-3 text-orange-500" />
                                                        I'm on my way
                                                    </>
                                                )}
                                            </Button>
                                        ) : lead.status === "ON_THE_WAY" ? (
                                            <Button
                                                onClick={() => setShowPinModal(lead.id)}
                                                className="w-full h-16 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-xl shadow-lg shadow-orange-500/20"
                                            >
                                                <CheckCircle2 className="w-5 h-5 mr-3" />
                                                Confirm Job (PIN)
                                            </Button>
                                        ) : lead.status === "CONFIRMED_SUCCESS" || lead.status === "CONFIRMED" ? (
                                            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-center gap-3">
                                                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                                                    <Gift className="w-5 h-5 text-white" />
                                                </div>
                                                <p className="text-emerald-700 font-black text-lg">Job Confirmed & Paid</p>
                                            </div>
                                        ) : lead.status === "SCREENING" ? (
                                            <div className="bg-zinc-100 rounded-2xl p-4 flex flex-col items-center gap-1">
                                                <Clock className="w-6 h-6 text-zinc-400" />
                                                <p className="text-zinc-500 font-black text-sm uppercase tracking-widest">Verifying Intent...</p>
                                            </div>
                                        ) : null}
                                    </div>
                                    
                                    <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Referral Reward</p>
                                            <Info className="w-3.5 h-3.5 text-zinc-300" />
                                        </div>
                                        <p className="text-lg font-black text-zinc-900">
                                            ${((lead.referral_fee_snapshot_cents || 0) / 100).toFixed(0)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {filteredLeads.length === 0 && (
                        <div className="py-24 flex flex-col items-center justify-center text-zinc-300 gap-4 bg-zinc-100/50 rounded-[40px] border border-dashed border-zinc-200">
                            <Search className="w-12 h-12 opacity-10" />
                            <div className="text-center">
                                <p className="font-black text-lg text-zinc-400">No leads found</p>
                                <p className="text-sm font-medium">Try a different filter or search term</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showPinModal && (
                <PinConfirmationModal 
                    leadId={showPinModal!}
                    onConfirmed={() => handlePinConfirmed(showPinModal!)}
                    onClose={() => setShowPinModal(null)}
                />
            )}
        </div>
    );
}
