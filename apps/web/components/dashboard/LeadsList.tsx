"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Users,
    MapPin,
    Unlock,
    Phone,
    MessageSquare,
    CheckCircle2,
    Zap,
    Loader2,
    Wallet,
    Clock,
    Gift,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PinConfirmationModal } from "./PinConfirmationModal";
import Link from "next/link";
import posthog from "posthog-js";
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

export function LeadsList({ initialLeads }: { initialLeads: Lead[] }) {
    const [leads, setLeads] = useState(initialLeads);
    const [isUnlocking, setIsUnlocking] = useState<string | null>(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
    const [showPinModal, setShowPinModal] = useState<string | null>(null);
    const [walletError, setWalletError] = useState<string | null>(null);

    const { userId, getToken } = useAuth();

    const handleUnlock = async (leadId: string) => {
        if (!userId) {
            toast.error("Please sign in to unlock leads");
            return;
        }

        const lead = leads.find(l => l.id === leadId);
        posthog.capture('lead_unlock_initiated', {
            lead_id: leadId,
            unlock_fee_cents: lead?.unlock_fee_cents,
            trade_type: lead?.trade_type,
            suburb: lead?.suburb,
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
                posthog.capture('lead_unlocked', {
                    lead_id: leadId,
                    payment_method: 'wallet',
                    unlock_fee_cents: lead?.unlock_fee_cents,
                });
                await refreshLead(leadId);
                window.dispatchEvent(new Event('wallet-updated'));
            }
        } catch (error) {
            posthog.captureException(error);
            toast.error((error as Error).message);
        } finally {
            setIsUnlocking(null);
        }
    };

    const handleOnTheWay = async (leadId: string) => {
        posthog.capture('lead_on_the_way', {
            lead_id: leadId,
        });
        setIsUpdatingStatus(leadId);
        try {
            const token = await getToken();
            const res = await fetch(`/api/backend/leads/${leadId}/on-the-way`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Failed to update status");
            }

            await refreshLead(leadId);
        } catch (error) {
            posthog.captureException(error);
            toast.error((error as Error).message);
        } finally {
            setIsUpdatingStatus(null);
        }
    };

    const refreshLead = async (leadId: string) => {
        const token = await getToken();
        const leadRes = await fetch(`/api/backend/leads/${leadId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const freshLead = await leadRes.json();

        setLeads(prev => prev.map(l => {
            if (l.id === leadId) {
                return {
                    ...l,
                    status: freshLead.status,
                    customer_name: freshLead.consumer_name,
                    phone: freshLead.consumer_phone,
                    email: freshLead.consumer_email,
                    address: freshLead.consumer_address,
                    suburb: freshLead.consumer_suburb || l.suburb,
                    description: freshLead.job_description || l.description
                };
            }
            return l;
        }));
    };

    const handlePinConfirmed = async (leadId: string) => {
        posthog.capture('lead_job_confirmed', {
            lead_id: leadId,
        });
        await refreshLead(leadId);
        setShowPinModal(null);
    };

    const UNLOCKED_STATUSES = ["UNLOCKED", "ON_THE_WAY", "MEETING_VERIFIED", "VALID_LEAD",
        "PAYMENT_PENDING_CONFIRMATION", "CONFIRMED_SUCCESS", "CONFIRMED"];
    const LOCKED_STATUSES = ["PENDING", "VERIFIED", "READY_FOR_BUSINESS", "SCREENING"];

    return (
        <>
            {walletError && (
                <div className="mb-6 p-5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-4">
                    <Wallet className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                    <div className="flex-1">
                        <p className="text-base font-bold text-red-700">{walletError}</p>
                        <Link href="/dashboard/business" className="text-base text-red-600 underline font-semibold mt-1 inline-block">
                            Top up wallet →
                        </Link>
                    </div>
                    <button onClick={() => setWalletError(null)} className="text-red-400 hover:text-red-600 text-lg leading-none">&times;</button>
                </div>
            )}

            {showPinModal && (
                <PinConfirmationModal
                    leadId={showPinModal}
                    onConfirmed={() => handlePinConfirmed(showPinModal)}
                    onClose={() => setShowPinModal(null)}
                />
            )}

            <div className="grid grid-cols-1 gap-6">
                {leads.map((lead) => (
                    <Card key={lead.id} className={`overflow-hidden transition-all hover:border-orange-400 group p-0`}>
                        <div className="p-8">
                            <div className="flex flex-col lg:flex-row gap-8">
                                <div className="flex-1">
                                    <div className="bg-white rounded-2xl border border-zinc-100 p-5 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center shrink-0">
                                            <Users className="w-5 h-5 text-zinc-500" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-zinc-400" style={{ fontSize: 17 }}>Sent by</p>
                                            <p className="font-black text-zinc-900" style={{ fontSize: 20 }}>{lead.referrer_name || 'Anonymous Referrer'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xl text-zinc-400 font-medium tracking-tight">
                                        <MapPin className="w-4 h-4" />
                                        {lead.suburb}
                                        <span>•</span>
                                        <Badge
                                            variant={
                                                ['CONFIRMED', 'CONFIRMED_SUCCESS'].includes(lead.status) ? 'success' :
                                                lead.status === 'ON_THE_WAY' ? 'info' :
                                                ['UNLOCKED', 'MEETING_VERIFIED', 'PAYMENT_PENDING_CONFIRMATION'].includes(lead.status) ? 'warning' : 'outline'
                                            }
                                            className="uppercase text-lg py-1 px-3"
                                        >
                                            {lead.status.replace(/_/g, ' ')}
                                        </Badge>
                                    </div>
                                    {UNLOCKED_STATUSES.includes(lead.status) ? (
                                        <div className="space-y-4 mb-4">
                                            <div className="p-5 bg-orange-50 rounded-2xl border border-orange-100">
                                                <div className="text-base font-bold text-orange-500 uppercase tracking-wider mb-1">Job Description</div>
                                                <p className="text-zinc-800 leading-relaxed font-medium text-xl">{lead.description}</p>
                                            </div>
                                            <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-100">
                                                <div className="text-base font-bold text-zinc-400 uppercase tracking-wider mb-2">Customer Location</div>
                                                <div className="flex items-center gap-2 text-zinc-700 font-bold text-xl">
                                                    <MapPin className="w-5 h-5 text-orange-500 flex-shrink-0" />
                                                    <span>{lead.address ? `${lead.address}, ${lead.suburb}` : lead.suburb}</span>
                                                </div>
                                            </div>
                                            {lead.phone && (
                                                <div className="flex flex-wrap gap-4 p-5 bg-zinc-50 rounded-2xl border border-zinc-100">
                                                    <div className="flex items-center gap-2 text-zinc-600">
                                                        <Phone className="w-5 h-5" />
                                                        <span className="font-bold text-xl">{lead.phone}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-zinc-600">
                                                        <MessageSquare className="w-5 h-5" />
                                                        <span className="font-bold text-xl">{lead.email}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-zinc-600 leading-relaxed mb-6 italic text-xl">
                                            &quot;{lead.description}&quot;
                                        </p>
                                    )}
                                </div>

                                <div className="w-full lg:w-72 flex flex-col justify-center gap-4 lg:border-l lg:pl-8 border-zinc-100">
                                    {LOCKED_STATUSES.includes(lead.status) && lead.status !== 'SCREENING' ? (
                                        <>
                                            <div className="text-center mb-2">
                                                <div className="text-xl text-zinc-400 font-bold uppercase tracking-wider mb-1">Unlock Fee</div>
                                                <div className="text-5xl font-black text-zinc-900 font-display transition-all hover:text-orange-600 cursor-default">
                                                    ${((lead.unlock_fee_cents || 3500) / 100).toFixed(2)}
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => handleUnlock(lead.id)}
                                                disabled={isUnlocking === lead.id}
                                                className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-full py-8 h-auto text-xl font-bold shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
                                            >
                                                {isUnlocking === lead.id ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Unlock className="w-5 h-5 mr-2" /> Unlock Details
                                                    </>
                                                )}
                                            </Button>
                                        </>
                                    ) : lead.status === 'SCREENING' ? (
                                        <div className="flex flex-col items-center gap-2 p-5 bg-zinc-50 rounded-3xl border border-zinc-100 text-center">
                                            <Clock className="w-10 h-10 text-zinc-400" />
                                            <div className="text-lg font-bold text-zinc-600">Screening in progress</div>
                                            <div className="text-base text-zinc-400">Verifying customer details via SMS</div>
                                        </div>
                                    ) : lead.status === 'UNLOCKED' ? (
                                        <Button
                                            onClick={() => handleOnTheWay(lead.id)}
                                            disabled={isUpdatingStatus === lead.id}
                                            className="w-full bg-zinc-900 hover:bg-black text-white rounded-full py-8 h-auto text-xl font-bold transition-all shadow-xl"
                                        >
                                            {isUpdatingStatus === lead.id ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <>
                                                    <Zap className="w-5 h-5 mr-2" /> I&apos;m on my way
                                                </>
                                            )}
                                        </Button>
                                    ) : lead.status === 'MEETING_VERIFIED' || lead.status === 'PAYMENT_PENDING_CONFIRMATION' ? (
                                        <div className="flex flex-col items-center gap-2 p-5 bg-amber-50 rounded-3xl border border-amber-100 text-center">
                                            <Clock className="w-10 h-10 text-amber-500" />
                                            <div className="text-lg font-bold text-amber-700">Awaiting confirmation</div>
                                            <div className="text-base text-zinc-600">Surveys sent to you and the customer</div>
                                        </div>
                                    ) : lead.status === 'ON_THE_WAY' ? (
                                        <Button
                                            onClick={() => setShowPinModal(lead.id)}
                                            className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full py-8 h-auto text-xl font-bold transition-all shadow-xl"
                                        >
                                            <CheckCircle2 className="w-5 h-5 mr-2" /> Confirm Job (PIN)
                                        </Button>
                                    ) : lead.status === 'CONFIRMED_SUCCESS' ? (
                                        <div className="flex flex-col items-center gap-2 p-5 bg-emerald-50 rounded-3xl border border-emerald-100 text-center">
                                            <Gift className="w-10 h-10 text-emerald-500" />
                                            <div className="text-xl font-bold text-emerald-700">Job Confirmed ✓</div>
                                            <div className="text-base font-medium text-emerald-600">Referrer gift card issued</div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 p-5 bg-emerald-50 rounded-3xl border border-emerald-100">
                                            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                                            <div className="text-xl font-bold text-emerald-700 capitalize">Job Confirmed</div>
                                            <div className="text-xl font-medium text-emerald-600 text-center">Referrer has been credited</div>
                                        </div>
                                    )}

                                    {!['CONFIRMED', 'CONFIRMED_SUCCESS'].includes(lead.status) && (
                                        <p className="text-lg text-zinc-400 text-center leading-tight px-4">
                                            {lead.status === 'ON_THE_WAY'
                                            ? 'Get the 4-digit PIN from the customer to confirm the job.'
                                            : lead.status === 'SCREENING'
                                            ? 'Verifying customer intent via SMS.'
                                            : 'Deducted from your wallet balance.'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </>
    );
}
