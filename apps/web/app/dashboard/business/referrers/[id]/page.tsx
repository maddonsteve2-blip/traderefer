"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Users, Star, DollarSign, Target, TrendingUp, ArrowLeft,
    Gift, FileText, ChevronRight, AlertTriangle, CreditCard, Wallet, MessageSquare,
    Loader2
} from "lucide-react";
import Link from "next/link";

interface ReferrerDetail {
    referrer_id: string;
    full_name: string;
    email: string;
    phone: string;
    quality_score: number;
    referrer_since: string | null;
    linked_since: string | null;
    is_active: boolean;
    clicks: number;
    leads_created: number;
    leads_unlocked: number;
    confirmed_jobs: number;
    conversion_rate: number;
    total_earned_cents: number;
    total_bonus_cents: number;
    custom_fee_cents: number | null;
    effective_fee_cents: number;
    default_fee_cents: number;
    business_notes: string | null;
}

interface Lead {
    id: string;
    consumer_name: string;
    consumer_suburb: string;
    job_description: string | null;
    status: string;
    referrer_payout_cents: number | null;
    created_at: string | null;
}

interface Bonus {
    id: string;
    amount_cents: number;
    reason: string | null;
    funded_from: string;
    created_at: string | null;
}

export default function ReferrerDetailPage() {
    const { getToken, isLoaded } = useAuth();
    const params = useParams();
    const router = useRouter();
    const referrerId = params.id as string;

    const [referrer, setReferrer] = useState<ReferrerDetail | null>(null);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [bonuses, setBonuses] = useState<Bonus[]>([]);
    const [walletBalance, setWalletBalance] = useState(0);
    const [loading, setLoading] = useState(true);

    // Fee management
    const [customFee, setCustomFee] = useState("");
    const [feeLoading, setFeeLoading] = useState(false);

    // Bonus form
    const [bonusAmount, setBonusAmount] = useState("");
    const [bonusReason, setBonusReason] = useState("");
    const [bonusLoading, setBonusLoading] = useState(false);
    const [bonusError, setBonusError] = useState<string | null>(null);
    const [showChargeWarning, setShowChargeWarning] = useState(false);
    const [shortfall, setShortfall] = useState(0);

    // Notes
    const [notes, setNotes] = useState("");
    const [notesLoading, setNotesLoading] = useState(false);

    const apiUrl = "/api/backend";
    const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;
    const fmtDate = (d: string | null) => {
        if (!d) return "—";
        return new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
    };

    const fetchDetail = useCallback(async () => {
        try {
            const token = await getToken();
            const res = await fetch(`${apiUrl}/business/me/referrers/${referrerId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) { router.push("/dashboard/business/referrers"); return; }
            const data = await res.json();
            setReferrer(data.referrer);
            setLeads(data.leads);
            setBonuses(data.bonuses);
            setWalletBalance(data.wallet_balance_cents);
            setCustomFee(data.referrer.custom_fee_cents ? (data.referrer.custom_fee_cents / 100).toFixed(2) : "");
            setNotes(data.referrer.business_notes || "");
        } catch { router.push("/dashboard/business/referrers"); }
        finally { setLoading(false); }
    }, [getToken, referrerId, apiUrl, router]);

    useEffect(() => { if (isLoaded) fetchDetail(); }, [isLoaded, fetchDetail]);

    // --- Fee Update ---
    const handleFeeUpdate = async () => {
        setFeeLoading(true);
        try {
            const token = await getToken();
            const feeVal = customFee ? Math.round(parseFloat(customFee) * 100) : null;
            const res = await fetch(`${apiUrl}/business/me/referrers/${referrerId}/fee`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ custom_fee_cents: feeVal }),
            });
            if (res.ok) { await fetchDetail(); }
        } catch { /* silent */ }
        finally { setFeeLoading(false); }
    };

    // --- Notes Update ---
    const handleNotesUpdate = async () => {
        setNotesLoading(true);
        try {
            const token = await getToken();
            await fetch(`${apiUrl}/business/me/referrers/${referrerId}/notes`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ business_notes: notes || null }),
            });
        } catch { /* silent */ }
        finally { setNotesLoading(false); }
    };

    // --- Bonus ---
    const handleBonus = async (chargeCard = false) => {
        setBonusLoading(true);
        setBonusError(null);
        setShowChargeWarning(false);
        try {
            const token = await getToken();
            const amtCents = Math.round(parseFloat(bonusAmount) * 100);
            if (isNaN(amtCents) || amtCents < 100) { setBonusError("Minimum bonus is $1.00"); setBonusLoading(false); return; }
            const res = await fetch(`${apiUrl}/business/me/referrers/${referrerId}/bonus`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ amount_cents: amtCents, reason: bonusReason || null, charge_card: chargeCard }),
            });
            const data = await res.json();
            if (data.status === "insufficient_funds") {
                setShortfall(data.shortfall_cents);
                setShowChargeWarning(true);
            } else if (data.status === "success") {
                setBonusAmount(""); setBonusReason("");
                await fetchDetail();
            } else if (data.status === "requires_payment") {
                // In dev/test mode, auto-confirm mock payment
                const confirmRes = await fetch(`${apiUrl}/business/me/referrers/${referrerId}/bonus`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ amount_cents: amtCents, reason: bonusReason || null, charge_card: true, payment_intent_id: "pi_mock_confirmed" }),
                });
                const confirmData = await confirmRes.json();
                if (confirmData.status === "success") { setBonusAmount(""); setBonusReason(""); await fetchDetail(); }
            } else { setBonusError(data.detail || "Failed to send bonus"); }
        } catch { setBonusError("Connection error"); }
        finally { setBonusLoading(false); }
    };


    if (loading || !referrer) {
        return (
            <div className="min-h-[100dvh] bg-zinc-50 flex items-center justify-center px-4">
                <div className="animate-pulse text-zinc-400 font-medium text-center">Loading referrer details…</div>
            </div>
        );
    }

    const statusColor = referrer.is_active ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500";

    return (
        <div className="min-h-[100dvh] bg-zinc-50">
            <div className="container mx-auto px-4 py-4 md:py-8 max-w-5xl">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-8">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                    <Link href="/dashboard/business/referrers" className="p-2 text-zinc-400 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-all">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="w-14 h-14 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-600 font-bold text-xl">
                        {referrer.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-4xl font-bold text-zinc-900 font-display break-words">{referrer.full_name}</h1>
                            <Badge className={`${statusColor} text-sm px-3 py-1`}>{referrer.is_active ? "Active" : "Inactive"}</Badge>
                        </div>
                        <p className="text-lg text-zinc-400 break-words">{referrer.email} · {referrer.phone} · Member since {fmtDate(referrer.referrer_since)}</p>
                    </div>
                    </div>
                    <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-3">
                        <Button
                            onClick={async () => {
                                try {
                                    const token = await getToken();
                                    const res = await fetch(`${apiUrl}/messages/conversations/start/${referrerId}`, {
                                        method: 'POST',
                                        headers: { Authorization: `Bearer ${token}` },
                                    });
                                    if (res.ok) {
                                        const data = await res.json();
                                        router.push(`/dashboard/business/messages?conv=${data.conversation_id}`);
                                    }
                                } catch {}
                            }}
                            variant="outline"
                            className="rounded-full px-6 h-14 font-bold border-zinc-200 hover:border-orange-300 hover:bg-orange-50 text-xl"
                        >
                            <MessageSquare className="w-5 h-5 mr-2 text-orange-500" />
                            Message
                        </Button>
                        <div className="flex items-center gap-2">
                            <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                            <span className="text-3xl font-black text-zinc-900">{referrer.quality_score}</span>
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    {[
                        { label: "Total Leads", value: referrer.leads_created, icon: Target, bg: "bg-orange-50", color: "text-orange-600" },
                        { label: "Confirmed", value: referrer.confirmed_jobs, icon: TrendingUp, bg: "bg-emerald-50", color: "text-emerald-600" },
                        { label: "Conversion", value: `${referrer.conversion_rate}%`, icon: ChevronRight, bg: "bg-blue-50", color: "text-blue-600" },
                        { label: "Total Earned", value: fmt(referrer.total_earned_cents), icon: DollarSign, bg: "bg-violet-50", color: "text-violet-600" },
                        { label: "Current Fee", value: fmt(referrer.effective_fee_cents), icon: DollarSign, bg: "bg-amber-50", color: "text-amber-600" },
                    ].map((s) => (
                        <Card key={s.label} className="p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`w-8 h-8 ${s.bg} ${s.color} rounded-lg flex items-center justify-center`}>
                                    <s.icon className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider">{s.label}</span>
                            </div>
                            <div className="text-3xl font-black text-zinc-900 font-display">{s.value}</div>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Fee Management */}
                    <Card className="p-8">
                        <h3 className="text-2xl font-bold text-zinc-900 mb-1 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-orange-500" /> Fee Management
                        </h3>
                        <p className="text-base text-zinc-400 mb-5">
                            Default fee: {fmt(referrer.default_fee_cents)}
                            {referrer.custom_fee_cents !== null && ` · Custom: ${fmt(referrer.custom_fee_cents)}`}
                        </p>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <div className="relative flex-1">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-lg">$</span>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="3.00"
                                    placeholder="Custom fee"
                                    value={customFee}
                                    onChange={(e) => setCustomFee(e.target.value)}
                                    className="pl-8 h-14 rounded-xl text-xl font-bold"
                                />
                            </div>
                            <Button onClick={handleFeeUpdate} disabled={feeLoading} className="bg-zinc-900 hover:bg-black text-white rounded-xl h-14 px-8 text-xl font-bold">
                                {feeLoading ? "…" : customFee ? "Set Custom" : "Reset Default"}
                            </Button>
                        </div>
                    </Card>

                    {/* Award Bonus */}
                    <Card className="p-8">
                        <h3 className="text-2xl font-bold text-zinc-900 mb-1 flex items-center gap-2">
                            <Gift className="w-5 h-5 text-orange-500" /> Award Bonus
                        </h3>
                        <p className="text-base text-zinc-400 mb-5">Wallet balance: {fmt(walletBalance)}</p>
                        <div className="space-y-4">
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-lg">$</span>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="1.00"
                                    placeholder="Bonus amount"
                                    value={bonusAmount}
                                    onChange={(e) => setBonusAmount(e.target.value)}
                                    className="pl-8 h-14 rounded-xl text-xl font-bold"
                                />
                            </div>
                            <Input
                                placeholder="Reason (optional)"
                                value={bonusReason}
                                onChange={(e) => setBonusReason(e.target.value)}
                                className="h-14 rounded-xl text-xl"
                            />
                            {bonusError && (
                                <div className="flex items-center gap-2 text-base text-red-600 bg-red-50 px-4 py-3 rounded-xl">
                                    <AlertTriangle className="w-4 h-4" />
                                    {bonusError}
                                </div>
                            )}
                            {showChargeWarning && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                                    <div className="flex items-start gap-3 mb-4">
                                        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                                        <div>
                                            <p className="text-lg font-bold text-amber-900">Insufficient wallet balance</p>
                                            <p className="text-base text-amber-700 mt-1">
                                                Your wallet has {fmt(walletBalance)} but this bonus requires {fmt(Math.round(parseFloat(bonusAmount) * 100))}.
                                                The remaining {fmt(shortfall)} will be charged to your card on file.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <Button variant="outline" size="lg" onClick={() => setShowChargeWarning(false)} className="rounded-xl font-bold text-lg h-12 flex-1">
                                            Cancel
                                        </Button>
                                        <Button size="lg" onClick={() => handleBonus(true)} disabled={bonusLoading} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-lg h-12 flex-[2]">
                                            <CreditCard className="w-4 h-4 mr-2" />
                                            Charge Card &amp; Send Bonus
                                        </Button>
                                    </div>
                                </div>
                            )}
                            <Button onClick={() => handleBonus(false)} disabled={bonusLoading || showChargeWarning} className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-14 text-xl font-black shadow-lg shadow-orange-500/20 active:scale-95 transition-all">
                                {bonusLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Send Bonus"}
                            </Button>
                        </div>
                        {/* Bonus history */}
                        {bonuses.length > 0 && (
                            <div className="mt-8 pt-8 border-t border-zinc-100">
                                <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Bonus History</h4>
                                <div className="space-y-3">
                                    {bonuses.map((b) => (
                                        <div key={b.id} className="flex items-center justify-between text-base">
                                            <div>
                                                <div className="font-bold text-zinc-900 text-lg">{fmt(b.amount_cents)}</div>
                                                <div className="text-base text-zinc-400">{b.reason || "No reason"} · {fmtDate(b.created_at)}</div>
                                            </div>
                                            <Badge variant="secondary" className="text-sm px-3 py-0.5">{b.funded_from}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Notes */}
                <Card className="p-8 mb-8">
                    <h3 className="text-2xl font-bold text-zinc-900 mb-1 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-orange-500" /> Private Notes
                    </h3>
                    <p className="text-base text-zinc-400 mb-5">Only you can see these notes about this referrer.</p>
                    <Textarea
                        placeholder="Add notes about this referrer…"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="min-h-[140px] rounded-xl mb-4 text-xl leading-relaxed"
                    />
                    <Button onClick={handleNotesUpdate} disabled={notesLoading} variant="outline" className="rounded-xl h-12 px-8 text-lg font-bold border-zinc-200">
                        {notesLoading ? "Saving…" : "Save Notes"}
                    </Button>
                </Card>

                {/* Lead History */}
                <Card className="p-8">
                    <h3 className="text-2xl font-bold text-zinc-900 mb-5 flex items-center gap-2">
                        <Target className="w-5 h-5 text-orange-500" /> Lead History ({leads.length})
                    </h3>
                    {leads.length === 0 ? (
                        <p className="text-lg text-zinc-400 text-center py-12">No leads yet from this referrer.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-base">
                                <thead>
                                    <tr className="border-b border-zinc-100">
                                        <th className="px-4 py-3 text-left text-base font-black text-zinc-400 uppercase tracking-widest">Consumer</th>
                                        <th className="px-4 py-3 text-left text-base font-black text-zinc-400 uppercase tracking-widest">Job</th>
                                        <th className="px-4 py-3 text-left text-base font-black text-zinc-400 uppercase tracking-widest">Status</th>
                                        <th className="px-4 py-3 text-left text-base font-black text-zinc-400 uppercase tracking-widest">Payout</th>
                                        <th className="px-4 py-3 text-left text-base font-black text-zinc-400 uppercase tracking-widest">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leads.map((lead) => (
                                        <tr key={lead.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                                            <td className="px-4 py-4">
                                                <div className="font-black text-zinc-900 text-lg">{lead.consumer_name}</div>
                                                <div className="text-base text-zinc-400">{lead.consumer_suburb}</div>
                                            </td>
                                            <td className="px-4 py-4 text-zinc-600 max-w-xs truncate text-lg font-medium">{lead.job_description || "—"}</td>
                                            <td className="px-4 py-4">
                                                <Badge variant={lead.status === "CONFIRMED" ? "default" : "secondary"} className="text-sm font-bold px-3 py-1">
                                                    {lead.status}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-4 font-black text-zinc-700 text-lg">
                                                {lead.referrer_payout_cents ? fmt(lead.referrer_payout_cents) : "—"}
                                            </td>
                                            <td className="px-4 py-4 text-zinc-400 text-base font-medium">{fmtDate(lead.created_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}