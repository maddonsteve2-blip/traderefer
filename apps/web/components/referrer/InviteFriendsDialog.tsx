"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    UserPlus, Send, CheckCircle, Loader2,
    Building2, Users, X, Plus, Gift, User
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";

const API = "/api/backend";

type InviteeType = "referrer" | "business";
interface Invitee {
    id: string;
    name: string;
    email: string;
    phone: string;
    type: InviteeType;
}

export function InviteFriendsDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { getToken } = useAuth();
    const [invitees, setInvitees] = useState<Invitee[]>([]);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const [form, setForm] = useState({ name: "", email: "", phone: "", type: "referrer" as InviteeType });
    const [formError, setFormError] = useState("");


    const addInvitee = () => {
        if (!form.name.trim()) { setFormError("Name is required"); return; }
        if (!form.email.trim() && !form.phone.trim()) { setFormError("Email or phone is required"); return; }
        setFormError("");
        setInvitees(prev => [...prev, { ...form, id: crypto.randomUUID() }]);
        setForm({ name: "", email: "", phone: "", type: "referrer" });
    };

    const removeInvitee = (id: string) => setInvitees(prev => prev.filter(i => i.id !== id));


    const sendInvitations = async () => {
        // Auto-add current form entry if filled (user might skip "Add to List")
        let finalInvitees = [...invitees];
        if (form.name.trim() && (form.email.trim() || form.phone.trim())) {
            finalInvitees.push({ ...form, id: crypto.randomUUID() });
            setInvitees(finalInvitees);
            setForm({ name: "", email: "", phone: "", type: "referrer" });
        }
        if (finalInvitees.length === 0) { toast.error("Enter a name and email or phone to invite"); return; }
        setSending(true);
        try {
            const token = await getToken();
            const res = await fetch(`${API}/invitations/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    invitees: finalInvitees.map(i => ({
                        name: i.name, email: i.email || null, phone: i.phone || null, type: i.type
                    })),
                    method: finalInvitees.some(i => i.email) ? "email" : "sms",
                })
            });
            if (!res.ok) {
                const errText = await res.text();
                console.error("Invitation send error:", errText);
                throw new Error(errText);
            }
            const data = await res.json();
            if (data.total > 0) {
                toast.success(`${data.total} invitation${data.total !== 1 ? "s" : ""} sent!`);
                setSent(true);
            } else if (data.errors?.length > 0) {
                toast.error(`Failed: ${data.errors[0]?.error || "Unknown error"}`);
            } else {
                toast.error("No invitations were sent. Please try again.");
            }
        } catch (e: any) {
            console.error("Invitation error:", e);
            toast.error(e?.message?.includes("404") ? "Referrer account not found. Try refreshing the page." : "Failed to send invitation. Please try again.");
        } finally {
            setSending(false);
        }
    };

    const handleClose = () => {
        onOpenChange(false);
        setTimeout(() => { setSent(false); setInvitees([]); }, 300);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden rounded-3xl border-0 shadow-2xl">
                {sent ? (
                    <div className="flex flex-col items-center justify-center py-12 px-8 text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-5 shadow-sm">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h3 className="font-black text-zinc-900 mb-2" style={{ fontSize: '28px' }}>
                            {invitees.length} Invitation{invitees.length !== 1 ? "s" : ""} Sent!
                        </h3>
                        <p className="text-zinc-500 font-bold mb-5" style={{ fontSize: '16px' }}>They'll get an email or SMS shortly.</p>

                        {/* Mini progress circles on success screen */}
                        <div className="flex items-center justify-center gap-1.5 mb-4">
                            {[0, 1, 2, 3, 4].map(i => (
                                <div key={i} className={`w-9 h-9 rounded-full flex items-center justify-center border-2 ${
                                    i < invitees.length
                                        ? "bg-orange-500 border-orange-400"
                                        : "bg-zinc-100 border-zinc-200 border-dashed"
                                }`}>
                                    {i < invitees.length
                                        ? <CheckCircle className="w-4 h-4 text-white" />
                                        : <span className="text-zinc-400 font-bold" style={{ fontSize: '12px' }}>{i + 1}</span>
                                    }
                                </div>
                            ))}
                            <div className="w-2 h-0.5 bg-zinc-200" />
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                                invitees.length >= 5
                                    ? "bg-green-500 border-green-400 shadow-md shadow-green-500/30"
                                    : "bg-zinc-100 border-zinc-200 border-dashed"
                            }`}>
                                <Gift className={`w-4 h-4 ${invitees.length >= 5 ? "text-white" : "text-zinc-400"}`} />
                            </div>
                        </div>

                        <div className="bg-orange-50 border-2 border-orange-100 rounded-[20px] px-6 py-4 mb-6 w-full">
                            {invitees.length >= 5 ? (
                                <>
                                    <p className="font-black text-green-700" style={{ fontSize: '17px' }}>� Amazing! You'll get your $25 gift card once they join!</p>
                                    <p className="text-green-600 font-bold mt-1" style={{ fontSize: '14px' }}>Track progress in your dashboard.</p>
                                </>
                            ) : (
                                <>
                                    <p className="font-black text-orange-800" style={{ fontSize: '17px' }}>🎁 {5 - invitees.length} more invite{5 - invitees.length !== 1 ? "s" : ""} to earn your $25 gift card!</p>
                                    <p className="text-orange-600 font-bold mt-1" style={{ fontSize: '14px' }}>Come back anytime to invite more friends.</p>
                                </>
                            )}
                        </div>
                        <Button onClick={handleClose} className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-full h-14 font-black shadow-xl shadow-orange-500/20 transition-all active:scale-95" style={{ fontSize: '20px' }}>Done</Button>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="bg-zinc-900 px-8 pt-8 pb-7">
                            <div className="flex items-center justify-between mb-1">
                                <DialogTitle className="text-white font-black" style={{ fontSize: '24px' }}>Invite Friends</DialogTitle>
                                <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-zinc-400 font-bold mb-5" style={{ fontSize: '15px' }}>Referrers or businesses — any mix counts!</p>

                            {/* 5-slot progress tracker */}
                            <div className="flex items-center justify-center gap-2">
                                {[0, 1, 2, 3, 4].map(i => {
                                    const inv = invitees[i];
                                    const filled = !!inv;
                                    return (
                                        <div key={i} className="flex items-center">
                                            <div className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                                filled
                                                    ? "bg-orange-500 border-orange-400 shadow-lg shadow-orange-500/30 scale-105"
                                                    : "bg-zinc-800 border-zinc-700 border-dashed"
                                            }`}>
                                                {filled ? (
                                                    inv.type === "business"
                                                        ? <Building2 className="w-5 h-5 text-white" />
                                                        : <User className="w-5 h-5 text-white" />
                                                ) : (
                                                    <span className="text-zinc-500 font-black" style={{ fontSize: '14px' }}>{i + 1}</span>
                                                )}
                                            </div>
                                            {i < 4 && (
                                                <div className={`w-3 h-0.5 ${filled && invitees[i + 1] ? "bg-orange-500" : "bg-zinc-700"} transition-colors`} />
                                            )}
                                        </div>
                                    );
                                })}
                                {/* Gift card reward */}
                                <div className="flex items-center">
                                    <div className="w-3 h-0.5 bg-zinc-700" />
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                        invitees.length >= 5
                                            ? "bg-green-500 border-green-400 shadow-lg shadow-green-500/40 scale-110 animate-pulse"
                                            : "bg-zinc-800 border-zinc-700 border-dashed"
                                    }`}>
                                        <Gift className={`w-5 h-5 ${invitees.length >= 5 ? "text-white" : "text-zinc-500"}`} />
                                    </div>
                                </div>
                            </div>
                            <p className="text-center mt-3 font-black text-orange-400" style={{ fontSize: '14px' }}>
                                {invitees.length >= 5
                                    ? "🎉 You've hit 5! Send to unlock your $25 gift card!"
                                    : `${invitees.length}/5 invited — ${5 - invitees.length} more to earn a $25 Prezzee gift card`}
                            </p>
                        </div>

                        <div className="px-8 py-6 space-y-6 max-h-[60vh] overflow-y-auto">

                            {/* Manual add form */}
                            <div className="space-y-4">
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setFormError(""); }}
                                        placeholder="Friend's name"
                                        className="w-full px-5 py-4 bg-zinc-50 border-2 border-zinc-100 rounded-2xl font-bold focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                                        style={{ fontSize: '18px' }}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setFormError(""); }}
                                            placeholder="Email (optional)"
                                            className="w-full px-5 py-4 bg-zinc-50 border-2 border-zinc-100 rounded-2xl font-bold focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                                            style={{ fontSize: '18px' }}
                                        />
                                        <input
                                            type="tel"
                                            value={form.phone}
                                            onChange={e => { setForm(f => ({ ...f, phone: e.target.value })); setFormError(""); }}
                                            placeholder="Phone (optional)"
                                            className="w-full px-5 py-4 bg-zinc-50 border-2 border-zinc-100 rounded-2xl font-bold focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                                            style={{ fontSize: '18px' }}
                                        />
                                    </div>

                                    {/* Type selector */}
                                    <div className="flex bg-zinc-100 rounded-2xl p-1.5">
                                        <button
                                            onClick={() => setForm(f => ({ ...f, type: "referrer" }))}
                                            className={`flex-1 font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${form.type === "referrer" ? "bg-white shadow text-zinc-900" : "text-zinc-400 hover:text-zinc-600"}`}
                                            style={{ fontSize: '15px' }}
                                        >
                                            <Users className="w-4 h-4" /> Referrer
                                        </button>
                                        <button
                                            onClick={() => setForm(f => ({ ...f, type: "business" }))}
                                            className={`flex-1 font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${form.type === "business" ? "bg-white shadow text-zinc-900" : "text-zinc-400 hover:text-zinc-600"}`}
                                            style={{ fontSize: '15px' }}
                                        >
                                            <Building2 className="w-4 h-4" /> Business
                                        </button>
                                    </div>

                                    {formError && <p className="text-red-500 font-black px-1" style={{ fontSize: '14px' }}>{formError}</p>}

                                    {invitees.length > 0 && invitees.length < 5 && (
                                        <Button onClick={addInvitee} variant="outline" className="w-full rounded-2xl border-2 border-orange-200 bg-orange-50 hover:bg-orange-100 h-14 font-black transition-all active:scale-95 text-orange-700" style={{ fontSize: '17px' }}>
                                            <Plus className="w-5 h-5 mr-1.5" /> Add #{invitees.length + 1} of 5
                                        </Button>
                                    )}
                                    {invitees.length >= 5 && (
                                        <Button onClick={addInvitee} variant="outline" className="w-full rounded-2xl border-2 border-zinc-200 h-14 font-black transition-all active:scale-95" style={{ fontSize: '17px' }}>
                                            <Plus className="w-5 h-5 mr-1.5" /> Add More
                                        </Button>
                                    )}
                                </div>

                            {/* Invitee list */}
                            {invitees.length > 0 && (
                                <div className="border-t-2 border-zinc-100 pt-6">
                                    <p className="font-black text-zinc-400 uppercase tracking-[0.15em] mb-4 px-1" style={{ fontSize: '12px' }}>Ready to Send ({invitees.length})</p>
                                    <div className="space-y-2.5">
                                        {invitees.map(inv => (
                                            <div key={inv.id} className="flex items-center justify-between bg-zinc-50 border-2 border-zinc-100/50 rounded-2xl px-5 py-4">
                                                <div>
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="font-black text-zinc-900" style={{ fontSize: '17px' }}>{inv.name}</span>
                                                        <Badge variant="outline" className={`font-black px-2 py-0.5 border-2 rounded-lg uppercase tracking-widest ${inv.type === "business" ? "border-blue-200 bg-blue-50 text-blue-700" : "border-orange-200 bg-orange-50 text-orange-700"}`} style={{ fontSize: '10px' }}>
                                                            {inv.type}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-zinc-400 font-bold mt-0.5" style={{ fontSize: '14px' }}>{inv.email || inv.phone}</p>
                                                </div>
                                                <button onClick={() => removeInvitee(inv.id)} className="text-zinc-300 hover:text-red-500 transition-colors p-1">
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-8 pb-8 pt-4 border-t-2 border-zinc-100">
                            <Button
                                onClick={sendInvitations}
                                disabled={sending || (invitees.length === 0 && !form.name.trim())}
                                className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-full h-16 font-black shadow-xl shadow-orange-500/20 transition-all active:scale-95"
                                style={{ fontSize: '20px' }}
                            >
                                {sending ? <Loader2 className="w-6 h-6 animate-spin mr-3" /> : <Send className="w-6 h-6 mr-3" />}
                                {sending ? "Sending..." : invitees.length > 0 ? `Send ${invitees.length} Invitation${invitees.length !== 1 ? "s" : ""}` : "Send Invitation"}
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
