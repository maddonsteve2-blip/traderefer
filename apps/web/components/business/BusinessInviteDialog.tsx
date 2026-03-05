"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    UserPlus, Send, CheckCircle, Loader2,
    Building2, Users, X, Plus, Contact
} from "lucide-react";
import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type InviteeType = "referrer" | "business";

interface Invitee {
    id: string;
    name: string;
    email: string;
    phone: string;
    type: InviteeType;
}

interface BusinessInviteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function BusinessInviteDialog({ open, onOpenChange }: BusinessInviteDialogProps) {
    const { getToken } = useAuth();
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState<"add" | "google">("add");
    const [invitees, setInvitees] = useState<Invitee[]>([]);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const [form, setForm] = useState({ name: "", email: "", phone: "", type: "referrer" as InviteeType });
    const [formError, setFormError] = useState("");

    const [googleContacts, setGoogleContacts] = useState<any[]>([]);
    const [loadingContacts, setLoadingContacts] = useState(false);
    const [contactsLoaded, setContactsLoaded] = useState(false);

    const addInvitee = () => {
        if (!form.name.trim()) { setFormError("Name is required"); return; }
        if (!form.email.trim() && !form.phone.trim()) { setFormError("Email or phone required"); return; }
        setFormError("");
        setInvitees(prev => [...prev, { ...form, id: crypto.randomUUID() }]);
        setForm({ name: "", email: "", phone: "", type: "referrer" });
    };

    const removeInvitee = (id: string) => setInvitees(prev => prev.filter(i => i.id !== id));

    const loadGoogleContacts = async () => {
        setLoadingContacts(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const googleTokens = await (user as any)?.getOauthAccessToken("oauth_google");
            const googleToken = googleTokens?.[0]?.token;

            if (!googleToken) {
                toast.error("Please sign in with Google to import contacts.");
                setContactsLoaded(false);
                return;
            }

            const token = await getToken();
            const res = await fetch(`${API}/business/invitations/google-contacts`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "X-Google-Token": googleToken,
                }
            });
            if (!res.ok) throw new Error("Could not load contacts");
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setGoogleContacts(data.contacts || []);
            setContactsLoaded(true);
        } catch {
            toast.error("Google Contacts not available. Please add contacts manually.");
            setContactsLoaded(false);
        } finally {
            setLoadingContacts(false);
        }
    };

    const addFromGoogle = (contact: any) => {
        if (invitees.find(i => i.email === contact.email && contact.email)) return;
        setInvitees(prev => [...prev, {
            id: crypto.randomUUID(),
            name: contact.name,
            email: contact.email || "",
            phone: contact.phone || "",
            type: "business",
        }]);
    };

    const sendInvitations = async () => {
        if (invitees.length === 0) { toast.error("Add at least one person to invite"); return; }
        setSending(true);
        try {
            const token = await getToken();
            const res = await fetch(`${API}/business/invitations/send`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    invitees: invitees.map(({ name, email, phone, type }) => ({ name, email, phone, type })),
                    method: "email",
                }),
            });
            if (!res.ok) throw new Error("Failed to send invitations");
            const data = await res.json();
            toast.success(`${data.sent} invitation${data.sent !== 1 ? "s" : ""} sent!`);
            setSent(true);
            setTimeout(() => { setSent(false); setInvitees([]); onOpenChange(false); }, 2000);
        } catch {
            toast.error("Failed to send invitations. Try again.");
        } finally {
            setSending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg p-0 overflow-hidden rounded-[32px] border-0 shadow-2xl max-h-[90vh] flex flex-col">
                <DialogHeader className="px-8 pt-8 pb-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-orange-100 rounded-2xl flex items-center justify-center">
                            <UserPlus className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black text-zinc-900 font-display">Invite &amp; Earn</DialogTitle>
                            <p className="text-sm text-zinc-400 font-medium">5 active invitees = $25 Prezzee gift card</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 p-1 bg-zinc-100 rounded-2xl mt-5">
                        <button
                            onClick={() => setActiveTab("add")}
                            className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all ${activeTab === "add" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-400 hover:text-zinc-600"}`}
                        >
                            <Plus className="w-3.5 h-3.5 inline mr-1.5" />Add Manually
                        </button>
                        <button
                            onClick={() => { setActiveTab("google"); if (!contactsLoaded) loadGoogleContacts(); }}
                            className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all ${activeTab === "google" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-400 hover:text-zinc-600"}`}
                        >
                            <Contact className="w-3.5 h-3.5 inline mr-1.5" />Google Contacts
                        </button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-5">
                    {activeTab === "add" && (
                        <div className="space-y-3">
                            {/* Type toggle */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setForm(f => ({ ...f, type: "referrer" }))}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border transition-all ${form.type === "referrer" ? "bg-orange-50 border-orange-300 text-orange-700" : "bg-zinc-50 border-zinc-200 text-zinc-500 hover:border-zinc-300"}`}
                                >
                                    <Users className="w-3.5 h-3.5" /> Referrer
                                </button>
                                <button
                                    onClick={() => setForm(f => ({ ...f, type: "business" }))}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border transition-all ${form.type === "business" ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-zinc-50 border-zinc-200 text-zinc-500 hover:border-zinc-300"}`}
                                >
                                    <Building2 className="w-3.5 h-3.5" /> Business
                                </button>
                            </div>
                            <p className="text-xs text-zinc-400 font-medium">
                                {form.type === "referrer"
                                    ? "Invite someone to earn gift cards by referring customers to tradies."
                                    : "Invite a tradie or business to join TradeRefer and get leads."}
                            </p>

                            <input
                                type="text"
                                placeholder="Name"
                                value={form.name}
                                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                                className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-sm font-medium placeholder:text-zinc-300"
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                value={form.email}
                                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                                className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-sm font-medium placeholder:text-zinc-300"
                            />
                            <input
                                type="tel"
                                placeholder="Mobile (for SMS invite)"
                                value={form.phone}
                                onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                                className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-sm font-medium placeholder:text-zinc-300"
                            />
                            {formError && <p className="text-xs text-red-500 font-bold">{formError}</p>}
                            <Button
                                onClick={addInvitee}
                                variant="outline"
                                className="w-full rounded-full border-orange-200 text-orange-600 hover:bg-orange-50 h-11 font-bold"
                            >
                                <Plus className="w-4 h-4 mr-1.5" /> Add to List
                            </Button>
                        </div>
                    )}

                    {activeTab === "google" && (
                        <div className="space-y-3">
                            {loadingContacts ? (
                                <div className="flex flex-col items-center py-10 gap-3">
                                    <Loader2 className="w-8 h-8 animate-spin text-zinc-300" />
                                    <p className="text-sm text-zinc-400">Loading contacts…</p>
                                </div>
                            ) : contactsLoaded ? (
                                <>
                                    <p className="text-xs text-zinc-400 font-medium">{googleContacts.length} contacts loaded. Tap to add.</p>
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {googleContacts.map((c, i) => {
                                            const alreadyAdded = invitees.some(inv => inv.email === c.email && c.email);
                                            return (
                                                <div key={i} className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${alreadyAdded ? 'bg-green-50 border-green-200' : 'bg-zinc-50 border-zinc-100 hover:border-orange-200 hover:bg-orange-50'}`}>
                                                    <div>
                                                        <p className="text-sm font-bold text-zinc-900">{c.name}</p>
                                                        <p className="text-xs text-zinc-400">{c.email || c.phone}</p>
                                                    </div>
                                                    {alreadyAdded ? (
                                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                                    ) : (
                                                        <button onClick={() => addFromGoogle(c)} className="p-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-colors">
                                                            <Plus className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-10">
                                    <Contact className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
                                    <p className="text-sm text-zinc-400 font-medium mb-4">Sign in with Google to import your contacts</p>
                                    <Button onClick={loadGoogleContacts} variant="outline" className="rounded-full border-zinc-200 text-zinc-600">
                                        Load Google Contacts
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Invite list */}
                    {invitees.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Ready to send ({invitees.length})</p>
                            {invitees.map((inv) => (
                                <div key={inv.id} className="flex items-center gap-3 p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${inv.type === "referrer" ? "bg-orange-100" : "bg-blue-100"}`}>
                                        {inv.type === "referrer" ? <Users className="w-3.5 h-3.5 text-orange-600" /> : <Building2 className="w-3.5 h-3.5 text-blue-600" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-zinc-900 truncate">{inv.name}</p>
                                        <p className="text-xs text-zinc-400 truncate">{inv.email || inv.phone}</p>
                                    </div>
                                    <Badge variant="secondary" className="text-xs shrink-0 capitalize">{inv.type}</Badge>
                                    <button onClick={() => removeInvitee(inv.id)} className="p-1 hover:bg-zinc-200 rounded-lg transition-colors">
                                        <X className="w-3.5 h-3.5 text-zinc-400" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Send button */}
                    <Button
                        onClick={sendInvitations}
                        disabled={sending || sent || invitees.length === 0}
                        className="w-full bg-zinc-900 hover:bg-black text-white rounded-full h-12 font-bold shadow-lg shadow-zinc-200 flex items-center justify-center gap-2"
                    >
                        {sent ? (
                            <><CheckCircle className="w-4 h-4" /> Sent!</>
                        ) : sending ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                        ) : (
                            <><Send className="w-4 h-4" /> Send {invitees.length > 0 ? `${invitees.length} ` : ""}Invitation{invitees.length !== 1 ? "s" : ""}</>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
