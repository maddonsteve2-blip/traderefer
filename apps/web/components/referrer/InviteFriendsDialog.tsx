"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    UserPlus, Send, CheckCircle, Loader2,
    Building2, Users, X, Plus
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
        if (invitees.length === 0) { toast.error("Add at least one person to invite"); return; }
        setSending(true);
        try {
            const token = await getToken();
            const res = await fetch(`${API}/invitations/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    invitees: invitees.map(i => ({
                        name: i.name, email: i.email || null, phone: i.phone || null, type: i.type
                    })),
                    method: invitees.some(i => i.email) ? "email" : "sms",
                })
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            toast.success(`${data.total} invitation${data.total !== 1 ? "s" : ""} sent!`);
            setSent(true);
        } catch (e) {
            toast.error("Failed to send some invitations. Please try again.");
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
                    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-black text-zinc-900 mb-2">Invitations Sent!</h3>
                        <p className="text-zinc-500 mb-2">Your friends will receive an invite email or SMS.</p>
                        <div className="bg-orange-50 border border-orange-200 rounded-2xl px-5 py-4 mt-4 mb-8 w-full">
                            <p className="text-sm font-bold text-orange-800">🎁 Earn $25 when 5 friends join!</p>
                            <p className="text-xs text-orange-600 mt-1">Track progress in your dashboard.</p>
                        </div>
                        <Button onClick={handleClose} className="w-full bg-zinc-900 text-white rounded-full h-12 font-black">Done</Button>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="bg-zinc-900 px-6 pt-6 pb-5">
                            <div className="flex items-center justify-between mb-1">
                                <DialogTitle className="text-white text-xl font-black">Invite Friends</DialogTitle>
                                <button onClick={handleClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-zinc-400 text-sm">Invite friends to join as referrers or businesses. Earn a $25 gift card when 5 become active.</p>

                            {/* Incentive pills */}
                            <div className="flex gap-2 mt-4">
                                <div className="bg-orange-500/20 text-orange-300 text-xs font-bold px-3 py-1 rounded-full">🎁 5 friends = $25 gift card</div>
                                <div className="bg-zinc-700 text-zinc-300 text-xs font-bold px-3 py-1 rounded-full">Email + SMS</div>
                            </div>
                        </div>

                        <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">

                            {/* Manual add form */}
                            <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setFormError(""); }}
                                        placeholder="Friend's name"
                                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl text-sm font-medium focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setFormError(""); }}
                                            placeholder="Email (optional)"
                                            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl text-sm font-medium focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                                        />
                                        <input
                                            type="tel"
                                            value={form.phone}
                                            onChange={e => { setForm(f => ({ ...f, phone: e.target.value })); setFormError(""); }}
                                            placeholder="Phone (optional)"
                                            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl text-sm font-medium focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                                        />
                                    </div>

                                    {/* Type selector */}
                                    <div className="flex bg-zinc-100 rounded-xl p-1">
                                        <button
                                            onClick={() => setForm(f => ({ ...f, type: "referrer" }))}
                                            className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${form.type === "referrer" ? "bg-white shadow text-zinc-900" : "text-zinc-400"}`}
                                        >
                                            <Users className="w-3.5 h-3.5" /> Referrer
                                        </button>
                                        <button
                                            onClick={() => setForm(f => ({ ...f, type: "business" }))}
                                            className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${form.type === "business" ? "bg-white shadow text-zinc-900" : "text-zinc-400"}`}
                                        >
                                            <Building2 className="w-3.5 h-3.5" /> Business
                                        </button>
                                    </div>

                                    {formError && <p className="text-red-500 text-xs font-bold">{formError}</p>}

                                    <Button onClick={addInvitee} variant="outline" className="w-full rounded-xl border-zinc-200 h-10 text-sm font-bold">
                                        <Plus className="w-4 h-4 mr-1" /> Add to List
                                    </Button>
                                </div>

                            {/* Invitee list */}
                            {invitees.length > 0 && (
                                <div className="border-t border-zinc-100 pt-4">
                                    <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">Ready to Send ({invitees.length})</p>
                                    <div className="space-y-2">
                                        {invitees.map(inv => (
                                            <div key={inv.id} className="flex items-center justify-between bg-zinc-50 rounded-xl px-3 py-2.5">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-zinc-900">{inv.name}</span>
                                                        <Badge variant="outline" className={`text-[10px] font-bold px-1.5 py-0 ${inv.type === "business" ? "border-blue-200 text-blue-600" : "border-orange-200 text-orange-600"}`}>
                                                            {inv.type}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-zinc-400">{inv.email || inv.phone}</p>
                                                </div>
                                                <button onClick={() => removeInvitee(inv.id)} className="text-zinc-300 hover:text-red-400 transition-colors">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 pb-6 pt-2 border-t border-zinc-100">
                            <Button
                                onClick={sendInvitations}
                                disabled={sending || invitees.length === 0}
                                className="w-full bg-zinc-900 hover:bg-black text-white rounded-full h-12 font-black"
                            >
                                {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                                {sending ? "Sending..." : `Send ${invitees.length > 0 ? invitees.length : ""} Invitation${invitees.length !== 1 ? "s" : ""}`}
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
