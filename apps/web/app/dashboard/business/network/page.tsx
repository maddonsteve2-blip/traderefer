"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import {
    Users, Plus, Send, Loader2, Check, Shield, ExternalLink,
    Search, Mail, UserPlus, ArrowRight, Copy, Link as LinkIcon
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Recommendation {
    business_name: string;
    slug: string;
    trade_category: string;
    suburb: string;
    logo_url: string | null;
    is_verified: boolean;
    message: string | null;
    created_at: string;
}

interface Invite {
    invite_name: string;
    invite_email: string;
    invite_trade: string | null;
    invite_code: string;
    status: string;
    created_at: string;
}

export default function BusinessNetworkPage() {
    const { getToken } = useAuth();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    const [given, setGiven] = useState<Recommendation[]>([]);
    const [received, setReceived] = useState<Recommendation[]>([]);
    const [invites, setInvites] = useState<Invite[]>([]);
    const [loading, setLoading] = useState(true);

    // Recommend form
    const [recSlug, setRecSlug] = useState("");
    const [recMessage, setRecMessage] = useState("");
    const [recSending, setRecSending] = useState(false);

    // Invite form
    const [invName, setInvName] = useState("");
    const [invEmail, setInvEmail] = useState("");
    const [invTrade, setInvTrade] = useState("");
    const [invSending, setInvSending] = useState(false);
    const [lastInviteUrl, setLastInviteUrl] = useState("");

    const [tab, setTab] = useState<"network" | "invite">("network");

    const fetchData = useCallback(async () => {
        try {
            const token = await getToken();
            const headers = { Authorization: `Bearer ${token}` };
            const [recRes, invRes] = await Promise.all([
                fetch(`${apiUrl}/business/network/recommendations`, { headers }),
                fetch(`${apiUrl}/business/network/invites`, { headers }),
            ]);
            if (recRes.ok) {
                const data = await recRes.json();
                setGiven(data.given || []);
                setReceived(data.received || []);
            }
            if (invRes.ok) {
                setInvites(await invRes.json());
            }
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, [apiUrl, getToken]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleRecommend = async () => {
        if (!recSlug.trim()) { toast.error("Enter business slug"); return; }
        setRecSending(true);
        try {
            const token = await getToken();
            const res = await fetch(`${apiUrl}/business/network/recommend`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ to_business_slug: recSlug, message: recMessage || null }),
            });
            if (res.ok) {
                toast.success("Business recommended!");
                setRecSlug(""); setRecMessage("");
                fetchData();
            } else {
                const err = await res.json();
                toast.error(err.detail || "Failed");
            }
        } catch { toast.error("Error"); }
        finally { setRecSending(false); }
    };

    const handleInvite = async () => {
        if (!invName.trim() || !invEmail.trim()) { toast.error("Name and email required"); return; }
        setInvSending(true);
        try {
            const token = await getToken();
            const res = await fetch(`${apiUrl}/business/network/invite`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ invite_email: invEmail, invite_name: invName, invite_trade: invTrade || null }),
            });
            if (res.ok) {
                const data = await res.json();
                setLastInviteUrl(data.invite_url);
                toast.success(`Invite created for ${invName}`);
                setInvName(""); setInvEmail(""); setInvTrade("");
                fetchData();
            } else {
                toast.error("Failed to create invite");
            }
        } catch { toast.error("Error"); }
        finally { setInvSending(false); }
    };

    const copyInviteUrl = () => {
        navigator.clipboard.writeText(lastInviteUrl);
        toast.success("Invite link copied!");
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto py-16 px-4">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-zinc-100 rounded w-64" />
                    <div className="h-40 bg-zinc-50 rounded-2xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">
            <div>
                <h1 className="text-3xl font-black text-zinc-900 tracking-tight">My Network</h1>
                <p className="text-zinc-500 mt-1">Recommend other tradies and grow together. When you recommend a business, it shows on their profile as social proof.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                <button onClick={() => setTab("network")} className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${tab === "network" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"}`}>
                    <Users className="w-4 h-4 inline mr-1.5" /> My Network ({given.length + received.length})
                </button>
                <button onClick={() => setTab("invite")} className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${tab === "invite" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"}`}>
                    <UserPlus className="w-4 h-4 inline mr-1.5" /> Invite a Business ({invites.length})
                </button>
            </div>

            {tab === "network" && (
                <div className="space-y-8">
                    {/* Recommend a business form */}
                    <div className="bg-white border border-zinc-200 rounded-2xl p-6">
                        <h3 className="font-bold text-zinc-900 mb-4 flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Recommend a Business
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <input
                                placeholder="Business slug (e.g. daves-plumbing)"
                                value={recSlug}
                                onChange={e => setRecSlug(e.target.value)}
                                className="px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                            />
                            <input
                                placeholder="Why do you recommend them? (optional)"
                                value={recMessage}
                                onChange={e => setRecMessage(e.target.value)}
                                className="px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                            />
                            <Button
                                onClick={handleRecommend}
                                disabled={recSending}
                                className="bg-zinc-900 hover:bg-black text-white rounded-xl font-bold"
                            >
                                {recSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-1.5" />}
                                Recommend
                            </Button>
                        </div>
                    </div>

                    {/* Businesses I recommended */}
                    {given.length > 0 && (
                        <div>
                            <h3 className="font-bold text-zinc-900 mb-3 flex items-center gap-2">
                                <ArrowRight className="w-4 h-4 text-green-500" /> I Recommend ({given.length})
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {given.map(r => (
                                    <BizCard key={r.slug} biz={r} badge="Recommended by you" badgeColor="bg-green-50 text-green-700" />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Businesses that recommended me */}
                    {received.length > 0 && (
                        <div>
                            <h3 className="font-bold text-zinc-900 mb-3 flex items-center gap-2">
                                <Shield className="w-4 h-4 text-blue-500" /> Recommended By ({received.length})
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {received.map(r => (
                                    <BizCard key={r.slug} biz={r} badge="Recommends you" badgeColor="bg-blue-50 text-blue-700" />
                                ))}
                            </div>
                        </div>
                    )}

                    {given.length === 0 && received.length === 0 && (
                        <div className="text-center py-16 text-zinc-400">
                            <Users className="w-12 h-12 mx-auto mb-3 text-zinc-200" />
                            <p className="font-bold text-lg">No recommendations yet</p>
                            <p className="text-sm mt-1">Know a great sparky or tiler? Recommend them above.</p>
                        </div>
                    )}
                </div>
            )}

            {tab === "invite" && (
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
                        <h3 className="text-xl font-bold mb-2">Invite a Tradie to TradeRefer</h3>
                        <p className="text-orange-100 text-sm mb-5">Know a great tradie who isn't on the platform yet? Invite them and you'll be automatically connected as recommended businesses.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input placeholder="Their business name" value={invName} onChange={e => setInvName(e.target.value)}
                                className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-sm font-medium text-white placeholder-orange-200 focus:outline-none focus:ring-2 focus:ring-white/30" />
                            <input placeholder="Their email" value={invEmail} onChange={e => setInvEmail(e.target.value)} type="email"
                                className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-sm font-medium text-white placeholder-orange-200 focus:outline-none focus:ring-2 focus:ring-white/30" />
                            <input placeholder="Their trade (e.g. Plumber)" value={invTrade} onChange={e => setInvTrade(e.target.value)}
                                className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-sm font-medium text-white placeholder-orange-200 focus:outline-none focus:ring-2 focus:ring-white/30" />
                            <Button onClick={handleInvite} disabled={invSending}
                                className="bg-white text-orange-600 hover:bg-orange-50 rounded-xl font-bold">
                                {invSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4 mr-1.5" />}
                                Create Invite Link
                            </Button>
                        </div>

                        {lastInviteUrl && (
                            <div className="mt-4 flex items-center gap-2 bg-white/10 rounded-xl p-3">
                                <LinkIcon className="w-4 h-4 text-orange-200 flex-shrink-0" />
                                <span className="text-sm font-medium text-orange-100 truncate flex-1">{lastInviteUrl}</span>
                                <button onClick={copyInviteUrl} className="text-white hover:text-orange-200 transition-colors">
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {invites.length > 0 && (
                        <div>
                            <h3 className="font-bold text-zinc-900 mb-3">Sent Invites</h3>
                            <div className="space-y-2">
                                {invites.map(inv => (
                                    <div key={inv.invite_code} className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                                        <div>
                                            <div className="font-bold text-zinc-900 text-sm">{inv.invite_name}</div>
                                            <div className="text-xs text-zinc-400">{inv.invite_email} · {inv.invite_trade || "Any trade"}</div>
                                        </div>
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                                            inv.status === "accepted" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
                                        }`}>
                                            {inv.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function BizCard({ biz, badge, badgeColor }: { biz: Recommendation; badge: string; badgeColor: string }) {
    return (
        <Link href={`/b/${biz.slug}`} className="block group">
            <div className="bg-white rounded-2xl border border-zinc-200 p-4 hover:shadow-md hover:border-orange-200 transition-all">
                <div className="flex items-center gap-3">
                    {biz.logo_url ? (
                        <img src={biz.logo_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
                    ) : (
                        <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 font-black text-sm">
                            {biz.business_name.charAt(0)}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-zinc-900 text-sm truncate group-hover:text-orange-600 transition-colors">
                            {biz.business_name}
                        </div>
                        <div className="text-xs text-zinc-400">{biz.trade_category} · {biz.suburb}</div>
                    </div>
                    {biz.is_verified && <Shield className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                </div>
                {biz.message && (
                    <p className="text-xs text-zinc-500 mt-2 italic">"{biz.message}"</p>
                )}
                <div className="mt-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
                </div>
            </div>
        </Link>
    );
}
