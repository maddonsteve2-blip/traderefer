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
    Loader2
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { StripePaymentModal } from "./StripePaymentModal";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PinConfirmationModal } from "./PinConfirmationModal";

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
}

export function LeadsList({ initialLeads }: { initialLeads: Lead[] }) {
    const [leads, setLeads] = useState(initialLeads);
    const [isUnlocking, setIsUnlocking] = useState<string | null>(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
    const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
    const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
    const [showPinModal, setShowPinModal] = useState<string | null>(null);

    const { userId, getToken } = useAuth();

    const handleUnlock = async (leadId: string) => {
        if (!userId) {
            alert("Please sign in to unlock leads");
            return;
        }

        setIsUnlocking(leadId);

        try {
            const token = await getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/leads/${leadId}/unlock`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Failed to initiate unlock");
            }

            const data = await res.json();

            if (data.status === "UNLOCKED") {
                await refreshLead(leadId);
                window.dispatchEvent(new Event('wallet-updated'));
            } else if (data.status === "REQUIRES_PAYMENT" && data.client_secret && !data.client_secret.includes("mock")) {
                setStripeClientSecret(data.client_secret);
                setActiveLeadId(leadId);
            } else if (data.status === "REQUIRES_PAYMENT") {
                // Dev mode fallback — mock secret returned, treat as error
                alert("Stripe is not configured. Please set up Stripe keys to process payments.");
            }
        } catch (error) {
            alert((error as Error).message);
        } finally {
            setIsUnlocking(null);
        }
    };

    const handleOnTheWay = async (leadId: string) => {
        setIsUpdatingStatus(leadId);
        try {
            const token = await getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/leads/${leadId}/on-the-way`, {
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
            alert((error as Error).message);
        } finally {
            setIsUpdatingStatus(null);
        }
    };

    const refreshLead = async (leadId: string) => {
        const token = await getToken();
        const leadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/leads/${leadId}`, {
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

    const handlePaymentSuccess = async () => {
        if (activeLeadId) {
            await refreshLead(activeLeadId);
        }
        setStripeClientSecret(null);
        setActiveLeadId(null);
    };

    const handlePinConfirmed = async (leadId: string) => {
        await refreshLead(leadId);
        setShowPinModal(null);
    };

    return (
        <>
            {stripeClientSecret && (
                <StripePaymentModal
                    clientSecret={stripeClientSecret}
                    onSuccess={handlePaymentSuccess}
                    onCancel={() => {
                        setStripeClientSecret(null);
                        setActiveLeadId(null);
                    }}
                />
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
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`w-12 h-12 ${['PENDING', 'VERIFIED'].includes(lead.status) ? 'bg-orange-100/50' : 'bg-zinc-100'} rounded-2xl flex items-center justify-center`}>
                                            <Users className={['PENDING', 'VERIFIED'].includes(lead.status) ? 'text-orange-600' : 'text-zinc-400'} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-zinc-900">
                                                {['PENDING', 'VERIFIED'].includes(lead.status) ? `${lead.customer_name[0]}*** *****` : lead.customer_name}
                                            </h3>
                                            <div className="flex items-center gap-2 text-base text-zinc-400 font-medium tracking-tight">
                                                <MapPin className="w-3.5 h-3.5" />
                                                {lead.suburb}
                                                <span>•</span>
                                                <Badge
                                                    variant={
                                                        lead.status === 'CONFIRMED' ? 'success' :
                                                            lead.status === 'ON_THE_WAY' ? 'info' :
                                                                ['UNLOCKED'].includes(lead.status) ? 'warning' : 'outline'
                                                    }
                                                    className="uppercase text-sm"
                                                >
                                                    {lead.status.replace(/_/g, ' ')}
                                                </Badge>
                                            </div>
                                        </div>
                                        {['PENDING', 'VERIFIED'].includes(lead.status) && (
                                            <Badge className="ml-auto bg-orange-500 text-white border-none">NEW</Badge>
                                        )}
                                    </div>

                                    {['UNLOCKED', 'ON_THE_WAY', 'CONFIRMED'].includes(lead.status) ? (
                                        <div className="space-y-4 mb-4">
                                            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                                                <div className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-1">Job Description</div>
                                                <p className="text-zinc-800 leading-relaxed font-medium">{lead.description}</p>
                                            </div>
                                            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Customer Location</div>
                                                <div className="flex items-center gap-2 text-zinc-700 font-bold">
                                                    <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0" />
                                                    <span>{lead.address ? `${lead.address}, ${lead.suburb}` : lead.suburb}</span>
                                                </div>
                                            </div>
                                            {lead.phone && (
                                                <div className="flex flex-wrap gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                                    <div className="flex items-center gap-2 text-zinc-600">
                                                        <Phone className="w-4 h-4" />
                                                        <span className="font-bold">{lead.phone}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-zinc-600">
                                                        <MessageSquare className="w-4 h-4" />
                                                        <span className="font-bold">{lead.email}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-zinc-600 leading-relaxed mb-6 italic">
                                            &quot;{lead.description}&quot;
                                        </p>
                                    )}
                                </div>

                                <div className="w-full lg:w-72 flex flex-col justify-center gap-4 lg:border-l lg:pl-8 border-zinc-100">
                                    {['PENDING', 'VERIFIED'].includes(lead.status) ? (
                                        <>
                                            <div className="text-center mb-2">
                                                <div className="text-base text-zinc-400 font-bold uppercase tracking-wider mb-1">Unlock Fee</div>
                                                <div className="text-3xl font-black text-zinc-900 font-display transition-all hover:text-orange-600 cursor-default">
                                                    ${((lead.unlock_fee_cents || 3500) / 100).toFixed(2)}
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => handleUnlock(lead.id)}
                                                disabled={isUnlocking === lead.id}
                                                className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-full py-6 h-auto text-lg font-bold shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
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
                                    ) : lead.status === 'UNLOCKED' ? (
                                        <Button
                                            onClick={() => handleOnTheWay(lead.id)}
                                            disabled={isUpdatingStatus === lead.id}
                                            className="w-full bg-zinc-900 hover:bg-black text-white rounded-full py-6 h-auto text-lg font-bold transition-all shadow-xl"
                                        >
                                            {isUpdatingStatus === lead.id ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <>
                                                    <Zap className="w-5 h-5 mr-2" /> I&apos;m on my way
                                                </>
                                            )}
                                        </Button>
                                    ) : lead.status === 'ON_THE_WAY' ? (
                                        <Button
                                            onClick={() => setShowPinModal(lead.id)}
                                            className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full py-6 h-auto text-lg font-bold transition-all shadow-xl"
                                        >
                                            <CheckCircle2 className="w-5 h-5 mr-2" /> Confirm Job (PIN)
                                        </Button>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 p-4 bg-emerald-50 rounded-3xl border border-emerald-100">
                                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                            <div className="text-base font-bold text-emerald-700 capitalize">Job Confirmed</div>
                                            <div className="text-base font-medium text-emerald-600 text-center">Referrer has been credited</div>
                                        </div>
                                    )}

                                    {lead.status !== 'CONFIRMED' && (
                                        <p className="text-base text-zinc-400 text-center leading-tight px-4">
                                            {lead.status === 'ON_THE_WAY' ? 'Get the 4-digit PIN from the customer to confirm the job.' : 'Standard 20% platform markup applies.'}
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
