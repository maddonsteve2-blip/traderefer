"use client";

import Link from "next/link";
import { useState } from "react";
import { Users, UserPlus, ChevronRight, Shield, ArrowRight, Mail, Plus, Loader2, Check, Send, Copy } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";

interface Recommendation {
    business_name: string;
    slug: string;
    trade_category: string;
    suburb: string;
    logo_url: string | null;
    is_verified: boolean;
}

interface Invite {
    invite_name: string;
    invite_email: string;
    invite_trade: string | null;
    invite_code: string;
    status: string;
}

interface MobileNetworkDashboardProps {
    given: Recommendation[];
    received: Recommendation[];
    invites: Invite[];
    onRefresh: () => void;
}

export function MobileNetworkDashboard({ given, received, invites, onRefresh }: MobileNetworkDashboardProps) {
    const { getToken } = useAuth();
    const [activeTab, setActiveTab] = useState<"partners" | "invite">("partners");

    // Invite form state
    const [invName, setInvName] = useState("");
    const [invEmail, setInvEmail] = useState("");
    const [invTrade, setInvTrade] = useState("");
    const [invSending, setInvSending] = useState(false);
    const [lastInviteUrl, setLastInviteUrl] = useState("");

    const handleInvite = async () => {
        if (!invName.trim() || !invEmail.trim()) { toast.error("Name and email required"); return; }
        setInvSending(true);
        try {
            const token = await getToken();
            const res = await fetch("/api/backend/business/network/invite", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ invite_email: invEmail, invite_name: invName, invite_trade: invTrade || null }),
            });
            if (res.ok) {
                const data = await res.json();
                setLastInviteUrl(data.invite_url);
                toast.success(`Invite created for ${invName}`);
                setInvName(""); setInvEmail(""); setInvTrade("");
                onRefresh();
            } else {
                toast.error("Failed to create invite");
            }
        } catch { toast.error("Error"); }
        finally { setInvSending(false); }
    };

    const allPartners = [...given, ...received];

    return (
        <div className="lg:hidden flex flex-col">

            {/* ── Stats Strip ── */}
            <div className="flex gap-2 px-4 pt-3 pb-2">
                <div className="flex-1 bg-zinc-50 rounded-2xl p-3 flex flex-col gap-0.5">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Partners</span>
                    <span className="text-[22px] font-black text-zinc-900 leading-none">{allPartners.length}</span>
                </div>
                <div className="flex-1 bg-zinc-50 rounded-2xl p-3 flex flex-col gap-0.5">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Invites</span>
                    <span className="text-[22px] font-black text-zinc-900 leading-none">{invites.length}</span>
                </div>
            </div>

            {/* ── Tab Switcher ── */}
            <div className="flex gap-1 mx-4 mb-3 bg-zinc-100 rounded-2xl p-1">
                <button
                    onClick={() => setActiveTab("partners")}
                    className={`flex-1 py-2 rounded-xl text-[13px] font-black transition-all ${activeTab === "partners" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"}`}
                >
                    Partners ({allPartners.length})
                </button>
                <button
                    onClick={() => setActiveTab("invite")}
                    className={`flex-1 py-2 rounded-xl text-[13px] font-black transition-all ${activeTab === "invite" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"}`}
                >
                    Invite
                </button>
            </div>

            {/* ── Partners Tab ── */}
            {activeTab === "partners" && (
                <div className="px-4 flex flex-col gap-2">
                    {allPartners.length === 0 ? (
                        <div className="py-12 flex flex-col items-center gap-3 text-center">
                            <div className="w-14 h-14 bg-zinc-100 rounded-full flex items-center justify-center">
                                <Users className="w-6 h-6 text-zinc-300" />
                            </div>
                            <p className="font-black text-zinc-900 text-[15px]">No partners yet</p>
                            <p className="text-[13px] text-zinc-500">Invite your trusted trades to build your network.</p>
                            <button
                                onClick={() => setActiveTab("invite")}
                                className="mt-1 h-10 px-5 bg-orange-600 hover:bg-orange-700 text-white rounded-full text-[12px] font-black uppercase tracking-widest transition-colors"
                            >
                                Invite Now
                            </button>
                        </div>
                    ) : (
                        allPartners.map((r) => (
                            <Link
                                key={r.slug}
                                href={`/b/${r.slug}`}
                                className="bg-white border border-zinc-100 rounded-2xl p-3.5 flex items-center gap-3"
                            >
                                <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center font-black text-zinc-500 uppercase text-sm shrink-0">
                                    {r.logo_url
                                        ? <img src={r.logo_url} className="w-full h-full rounded-full object-cover" alt="" />
                                        : r.business_name?.[0]
                                    }
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-zinc-900 text-[14px] truncate">{r.business_name}</p>
                                    <p className="text-[12px] text-zinc-500 truncate">{r.trade_category} · {r.suburb}</p>
                                </div>
                                {r.is_verified && <Shield className="w-4 h-4 text-blue-500 shrink-0" />}
                                <ChevronRight className="w-4 h-4 text-zinc-300 shrink-0" />
                            </Link>
                        ))
                    )}
                </div>
            )}

            {/* ── Invite Tab ── */}
            {activeTab === "invite" && (
                <div className="px-4 flex flex-col gap-3">
                    <div className="bg-zinc-900 rounded-2xl p-4 flex flex-col gap-3">
                        <div>
                            <p className="text-[14px] font-black text-white">Invite a Tradie</p>
                            <p className="text-[12px] text-zinc-400 mt-0.5">Create a personal invite link for a trade partner.</p>
                        </div>
                        <input
                            placeholder="Their business name"
                            value={invName}
                            onChange={e => setInvName(e.target.value)}
                            className="h-[44px] bg-white/10 border border-white/10 rounded-xl px-3.5 text-[14px] font-medium text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                        />
                        <input
                            placeholder="Their email"
                            value={invEmail}
                            onChange={e => setInvEmail(e.target.value)}
                            type="email"
                            className="h-[44px] bg-white/10 border border-white/10 rounded-xl px-3.5 text-[14px] font-medium text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                        />
                        <input
                            placeholder="Their trade (e.g. Plumber)"
                            value={invTrade}
                            onChange={e => setInvTrade(e.target.value)}
                            className="h-[44px] bg-white/10 border border-white/10 rounded-xl px-3.5 text-[14px] font-medium text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                        />
                        <button
                            onClick={handleInvite}
                            disabled={invSending}
                            className="h-[48px] bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-xl font-black text-[13px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                        >
                            {invSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                            Create Invite Link
                        </button>

                        {lastInviteUrl && (
                            <div className="flex items-center gap-2 bg-white/10 rounded-xl p-3">
                                <p className="text-[11px] text-zinc-300 truncate flex-1">{lastInviteUrl}</p>
                                <button
                                    onClick={() => { navigator.clipboard.writeText(lastInviteUrl); toast.success("Copied!"); }}
                                    className="text-white shrink-0"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Sent Invites */}
                    {invites.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <p className="text-[12px] font-black text-zinc-500 uppercase tracking-widest">Sent Invites</p>
                            {invites.map(inv => (
                                <div key={inv.invite_code} className="bg-white border border-zinc-100 rounded-2xl p-3.5 flex items-center gap-3">
                                    <div className="w-9 h-9 bg-zinc-100 rounded-full flex items-center justify-center font-black text-zinc-500 text-sm shrink-0 uppercase">
                                        {inv.invite_name?.[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-zinc-900 text-[14px] truncate">{inv.invite_name}</p>
                                        <p className="text-[12px] text-zinc-500 truncate">{inv.invite_email}</p>
                                    </div>
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${inv.status === "accepted" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                                        {inv.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
