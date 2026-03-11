"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import {
    Copy, Check, Send, MessageSquare, Building2, Plus,
    ChevronRight, Zap, Mail, Share2, BadgeCheck, Users, TrendingUp,
    Loader2, Clock, AlertCircle
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamLink {
    name: string;
    sub: string;
    trade_category: string;
    slug: string;
    code: string;
    logo_url: string | null;
    referral_fee_cents: number;
    is_verified: boolean;
    business_id: string;
    clicks: number;
    leads: number;
    earned: number;
}

interface PendingApp {
    id: string;
    business_id: string;
    business_name: string;
    business_slug: string;
    business_logo: string | null;
    trade_category: string;
    suburb: string;
    referral_fee_cents: number;
    applied_at: string;
}

type SelectedItem =
    | { type: "approved"; link: TeamLink }
    | { type: "pending"; app: PendingApp };

interface Message {
    id: string;
    sender_type: string;
    body: string;
    is_mine: boolean;
    created_at: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const BASE_URL = typeof window !== "undefined" ? window.location.origin : "https://traderefer.au";

// ─── Inline Mini Chat ─────────────────────────────────────────────────────────

function InlineChat({ businessId, businessName, token }: { businessId: string; businessName: string; token: string }) {
    const [convId, setConvId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const bottomRef = useRef<HTMLDivElement>(null);

    const loadMessages = useCallback(async (cid: string) => {
        const res = await fetch(`${API}/messages/conversations/${cid}`, {
            headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null);
        if (!res?.ok) return;
        const data = await res.json();
        setMessages(data.messages || []);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }, [token]);

    useEffect(() => {
        setLoading(true);
        setMessages([]);
        setConvId(null);
        (async () => {
            const res = await fetch(`${API}/messages/conversations/start-with-business/${businessId}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            }).catch(() => null);
            if (!res?.ok) { setLoading(false); return; }
            const data = await res.json();
            setConvId(data.conversation_id);
            await loadMessages(data.conversation_id);
            setLoading(false);
        })();
    }, [businessId, token, loadMessages]);

    // Poll every 6s
    useEffect(() => {
        if (!convId) return;
        const t = setInterval(() => loadMessages(convId), 6000);
        return () => clearInterval(t);
    }, [convId, loadMessages]);

    const handleSend = async () => {
        if (!input.trim() || !convId) return;
        const text = input.trim();
        setInput("");
        setSending(true);
        await fetch(`${API}/messages/conversations/${convId}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ body: text }),
        });
        await loadMessages(convId);
        setSending(false);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Chat header */}
            <div className="flex-none flex items-center justify-between px-4 py-3 bg-[#1a1a1a] rounded-t-2xl">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-orange-400" />
                    <span className="font-black text-white" style={{ fontSize: '16px' }}>Chat with {businessName}</span>
                </div>
                <Link
                    href="/dashboard/referrer/messages"
                    className="text-zinc-400 hover:text-orange-400 font-bold transition-colors flex items-center gap-1"
                    style={{ fontSize: '13px' }}
                >
                    Full view <ChevronRight className="w-3 h-3" />
                </Link>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-zinc-50">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-5 h-5 text-zinc-300 animate-spin" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <MessageSquare className="w-8 h-8 text-zinc-200 mb-2" />
                        <p className="font-bold text-zinc-400" style={{ fontSize: '15px' }}>No messages yet</p>
                        <p className="font-medium text-zinc-300 mt-0.5" style={{ fontSize: '14px' }}>Ask a question or introduce yourself!</p>
                    </div>
                ) : (
                    messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.is_mine ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl font-medium leading-snug ${
                                msg.is_mine
                                    ? "bg-zinc-900 text-white rounded-br-md"
                                    : "bg-white text-zinc-800 border border-zinc-100 rounded-bl-md shadow-sm"
                            }`} style={{ fontSize: '16px' }}>
                                {msg.body}
                            </div>
                        </div>
                    ))
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex-none flex items-center gap-3 px-3 py-3 bg-gray-100 rounded-b-2xl border-t border-gray-300">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                    placeholder="Type a message…"
                    className="flex-1 bg-white border border-gray-400 rounded-xl px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 font-semibold text-zinc-900 placeholder-gray-600 shadow-sm"
                    style={{ fontSize: '18px' }}
                />
                <button
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:bg-zinc-200 text-white disabled:text-zinc-400 shadow-md"
                    style={{ background: input.trim() && !sending ? '#FF7A00' : undefined }}
                >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReferrerManagePage() {
    const { getToken, isLoaded } = useAuth();
    const [links, setLinks] = useState<TeamLink[]>([]);
    const [pendingApps, setPendingApps] = useState<PendingApp[]>([]);
    const [selected, setSelected] = useState<SelectedItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [tab, setTab] = useState<"sms" | "email" | "social">("sms");
    const [token, setToken] = useState<string>("");
    const [targetBusinessSlug, setTargetBusinessSlug] = useState("");

    useEffect(() => {
        if (typeof window === "undefined") return;
        const params = new URLSearchParams(window.location.search);
        setTargetBusinessSlug(params.get("business") || "");
    }, []);

    useEffect(() => {
        if (!isLoaded) return;
        (async () => {
            const t = await getToken() || "";
            setToken(t);
            const [dashRes, appsRes] = await Promise.all([
                fetch(`${API}/referrer/dashboard`, { headers: { Authorization: `Bearer ${t}` } }),
                fetch(`${API}/applications/my-applications`, { headers: { Authorization: `Bearer ${t}` } }),
            ]);
            const dashData = dashRes.ok ? await dashRes.json() : null;
            const l: TeamLink[] = dashData?.links || dashData?.active_links || [];
            const allApps = appsRes.ok ? (await appsRes.json()).applications || [] : [];
            const pending: PendingApp[] = allApps
                .filter((a: { status: string }) => a.status === "pending")
                .map((a: { id: string; business_id: string; business_name: string; business_slug: string; business_logo: string | null; trade_category: string; suburb: string; referral_fee_cents: number; applied_at: string }) => ({
                    id: a.id,
                    business_id: a.business_id,
                    business_name: a.business_name,
                    business_slug: a.business_slug,
                    business_logo: a.business_logo,
                    trade_category: a.trade_category,
                    suburb: a.suburb,
                    referral_fee_cents: a.referral_fee_cents,
                    applied_at: a.applied_at,
                }));
            setLinks(l);
            setPendingApps(pending);
            setLoading(false);
        })();
    }, [isLoaded, getToken]);

    useEffect(() => {
        if (loading) return;

        const approvedMatch = targetBusinessSlug
            ? links.find((link) => link.slug === targetBusinessSlug)
            : null;
        if (approvedMatch) {
            setSelected({ type: "approved", link: approvedMatch });
            return;
        }

        const pendingMatch = targetBusinessSlug
            ? pendingApps.find((app) => app.business_slug === targetBusinessSlug)
            : null;
        if (pendingMatch) {
            setSelected({ type: "pending", app: pendingMatch });
            return;
        }

        if (links.length > 0) {
            setSelected((current) => {
                if (current?.type === "approved" && links.some((link) => link.slug === current.link.slug)) {
                    return current;
                }
                return { type: "approved", link: links[0] };
            });
            return;
        }

        if (pendingApps.length > 0) {
            setSelected((current) => {
                if (current?.type === "pending" && pendingApps.some((app) => app.id === current.app.id)) {
                    return current;
                }
                return { type: "pending", app: pendingApps[0] };
            });
        }
    }, [loading, targetBusinessSlug, links, pendingApps]);

    useEffect(() => {
        setCopied(false);
    }, [selected]);

    const approvedSelected = selected?.type === "approved" ? selected.link : null;
    const pendingSelected = selected?.type === "pending" ? selected.app : null;
    const activeLink = selected?.type === "approved" ? selected.link : null;
    const referralLink = activeLink ? `${BASE_URL}/b/${activeLink.slug}?ref=${activeLink.code}` : "";
    const feeDisplay = activeLink ? `$${((activeLink.referral_fee_cents * 0.8) / 100).toFixed(2)} per lead` : "";
    const leadFormLink = activeLink ? `${referralLink}#enquiry-form` : "";
    const referrerBusinessPageLink = activeLink ? `/dashboard/referrer/refer/${activeLink.slug}` : "";

    const handleCopy = () => {
        if (!referralLink) return;
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        toast.success("Referral link copied! ");
        setTimeout(() => setCopied(false), 2500);
    };

    // swipeContent only applies for approved links
    const swipeContent = {
        sms: activeLink
            ? `Hey! I highly recommend ${activeLink.name} for any ${activeLink.trade_category} work. They're verified pros. Use my personal link to book: ${referralLink}`
            : "",
        email: activeLink
            ? `Subject: "You need to check out ${activeLink.name}"\n\nHey,\n\nI wanted to share a local ${activeLink.trade_category} business I've been working with — ${activeLink.name}. They have a 5.0 trust score, are fully verified on TradeRefer, and do incredible work in ${activeLink.sub.split("•")[1]?.trim() || "the area"}.\n\nThey handle all things ${activeLink.trade_category.toLowerCase()} and their team is reliable, transparent, and professional. You can book directly through my personal referral link and they'll take great care of you:\n\n${referralLink}`
            : "",
        social: activeLink
            ? `Found the best ${activeLink.trade_category} crew around! ${activeLink.name} are verified, reliable, and seriously professional. Book through my personal link: ${referralLink} #${activeLink.trade_category.replace(/\s/g, "")} #TradeRefer`
            : "",
    };

    const handleCopySwipe = () => {
        navigator.clipboard.writeText(swipeContent[tab]);
        toast.success(`${tab.toUpperCase()} copy copied!`);
    };

    const totalCount = links.length + pendingApps.length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-[3px] border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // ── TRUE EMPTY STATE (no approved AND no pending) ────────────────────────
    if (totalCount === 0) {
        return (
            <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Users className="w-10 h-10 text-orange-300" />
                </div>
                <h1 className="font-black text-zinc-900 mb-3" style={{ fontSize: '32px' }}>Build Your Team</h1>
                <p className="font-medium text-zinc-500 max-w-md mb-8" style={{ fontSize: '18px', lineHeight: 1.65 }}>
                    You don't have any referral partnerships yet. Apply to join a business's network to unlock your Command Centre.
                </p>
                <Link
                    href="/dashboard/referrer/businesses"
                    className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-black px-8 py-4 rounded-2xl transition-all active:scale-95 shadow-xl shadow-orange-200"
                    style={{ fontSize: '18px' }}
                >
                    Find Your First Business <ChevronRight className="w-5 h-5" />
                </Link>
            </div>
        );
    }

    // ── SIDEBAR CARD helpers ─────────────────────────────────────────────────
    const ApprovedCard = ({ link }: { link: TeamLink }) => {
        const isActive = selected?.type === "approved" && selected.link.slug === link.slug;
        const initials = link.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
        return (
            <button
                onClick={() => setSelected({ type: "approved", link })}
                className={`w-full text-left p-4 rounded-2xl transition-all ${isActive ? "bg-white shadow-lg shadow-zinc-100 ring-2 ring-orange-500/20" : "hover:bg-white hover:shadow-md hover:shadow-zinc-100"}`}
            >
                <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center font-black text-orange-600 shrink-0 overflow-hidden" style={{ fontSize: '15px' }}>
                        {link.logo_url ? <img src={link.logo_url} alt="" className="w-full h-full object-cover" /> : initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                            <p className="font-black text-zinc-900 truncate leading-tight" style={{ fontSize: '17px' }}>{link.name}</p>
                            {link.is_verified && <BadgeCheck className="w-4 h-4 text-orange-500 shrink-0" />}
                        </div>
                        <p className="font-medium text-zinc-500 truncate" style={{ fontSize: '15px' }}>{link.trade_category}</p>
                        <span className="inline-block mt-1.5 px-2.5 py-1 bg-zinc-900 text-white font-black rounded-lg" style={{ fontSize: '13px' }}>
                            ${((link.referral_fee_cents * 0.8) / 100).toFixed(2)} per lead
                        </span>
                    </div>
                </div>
                {isActive && (
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-zinc-100">
                        <div className="text-center">
                            <p className="font-black text-zinc-900" style={{ fontSize: '18px' }}>{link.leads}</p>
                            <p className="font-bold text-zinc-400 uppercase tracking-wide" style={{ fontSize: '11px' }}>Leads</p>
                        </div>
                        <div className="text-center">
                            <p className="font-black text-emerald-600" style={{ fontSize: '18px' }}>${link.earned.toFixed(0)}</p>
                            <p className="font-bold text-zinc-400 uppercase tracking-wide" style={{ fontSize: '11px' }}>Earned</p>
                        </div>
                    </div>
                )}
            </button>
        );
    };

    const PendingCard = ({ app }: { app: PendingApp }) => {
        const isActive = selected?.type === "pending" && selected.app.id === app.id;
        const initials = app.business_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
        return (
            <button
                onClick={() => setSelected({ type: "pending", app })}
                className={`w-full text-left p-4 rounded-2xl transition-all ${isActive ? "bg-white shadow-lg shadow-zinc-100 ring-2 ring-amber-400/30" : "hover:bg-white hover:shadow-md hover:shadow-zinc-100"}`}
            >
                <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center font-black text-amber-600 shrink-0 overflow-hidden" style={{ fontSize: '15px' }}>
                        {app.business_logo ? <img src={app.business_logo} alt="" className="w-full h-full object-cover" /> : initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-black text-zinc-900 truncate leading-tight" style={{ fontSize: '17px' }}>{app.business_name}</p>
                        <p className="font-medium text-zinc-500 truncate" style={{ fontSize: '15px' }}>{app.trade_category}</p>
                        <div className="flex items-center justify-between mt-1.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 font-black rounded-lg" style={{ fontSize: '12px' }}>
                                <Clock className="w-3 h-3" /> Awaiting Review
                            </span>
                            {app.referral_fee_cents > 0 && (
                                <span className="font-black text-orange-600" style={{ fontSize: '13px' }}>
                                    ${((app.referral_fee_cents * 0.8) / 100).toFixed(2)}/lead
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </button>
        );
    };

    // ── MAIN LAYOUT ──────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 top-[72px] md:top-[100px] lg:right-12 flex flex-col overflow-hidden bg-white">
            {/* ── MOBILE: Horizontal chip scroll ── */}
            <div className="md:hidden shrink-0 w-full overflow-x-auto bg-gray-50 px-4 py-3 flex gap-2">
                {links.map(link => (
                    <button
                        key={link.slug}
                        onClick={() => setSelected({ type: "approved", link })}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl shrink-0 font-bold transition-all ${selected?.type === "approved" && selected.link.slug === link.slug ? "bg-zinc-900 text-white" : "bg-white border border-zinc-200 text-zinc-700"}`}
                        style={{ fontSize: '15px' }}
                    >
                        {link.logo_url ? <img src={link.logo_url} alt="" className="w-5 h-5 rounded-md object-cover" /> : <Building2 className="w-4 h-4 opacity-50" />}
                        {link.name}
                    </button>
                ))}
                {pendingApps.map(app => (
                    <button
                        key={app.id}
                        onClick={() => setSelected({ type: "pending", app })}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl shrink-0 font-bold transition-all ${selected?.type === "pending" && selected.app.id === app.id ? "bg-amber-600 text-white" : "bg-amber-50 border border-amber-200 text-amber-700"}`}
                        style={{ fontSize: '15px' }}
                    >
                        <Clock className="w-4 h-4" /> {app.business_name}
                    </button>
                ))}
                <Link href="/dashboard/referrer/businesses" className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl shrink-0 font-bold bg-orange-50 text-orange-600 border border-orange-200 whitespace-nowrap" style={{ fontSize: '15px' }}>
                    <Plus className="w-4 h-4" /> Join Trade
                </Link>
            </div>

            {/* ── DESKTOP: Full-width 2-col layout ── */}
            <div className="flex-1 flex min-h-0 overflow-hidden flex-col md:flex-row">

                {/* ── SIDEBAR ── */}
                <aside className="hidden md:flex flex-col w-[26%] bg-gray-50 shrink-0 overflow-hidden" style={{ boxShadow: "4px 0 20px rgba(0,0,0,0.05)", scrollbarGutter: "stable" }}>
                    <div className="px-5 pt-6 pb-3">
                        <p className="font-black uppercase tracking-widest text-zinc-400" style={{ fontSize: '13px' }}>Command Centre</p>
                        <p className="font-black text-zinc-900 mt-0.5" style={{ fontSize: '22px' }}>{totalCount} Business{totalCount !== 1 ? "es" : ""}</p>
                    </div>

                    <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1" style={{ scrollbarGutter: "stable" }}>
                        {/* ── Active Team section ── */}
                        {links.length > 0 && (
                            <>
                                <p className="font-black uppercase tracking-widest text-zinc-400 px-2 pt-2 pb-1" style={{ fontSize: '11px' }}>
                                    My Active Team ({links.length})
                                </p>
                                {links.map(link => <ApprovedCard key={link.slug} link={link} />)}
                            </>
                        )}

                        {/* ── Pending section ── */}
                        {pendingApps.length > 0 && (
                            <>
                                <p className="font-black uppercase tracking-widest text-amber-500 px-2 pt-4 pb-1" style={{ fontSize: '11px' }}>
                                    Pending Review ({pendingApps.length})
                                </p>
                                {pendingApps.map(app => <PendingCard key={app.id} app={app} />)}
                            </>
                        )}
                    </div>

                    <div className="p-4 border-t border-zinc-100">
                        <Link href="/dashboard/referrer/businesses" className="flex items-center justify-center gap-2 w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-2xl transition-all active:scale-95 shadow-lg shadow-orange-200" style={{ fontSize: '16px' }}>
                            <Plus className="w-5 h-5" /> Join a New Trade Team
                        </Link>
                    </div>
                </aside>

                {/* ── MAIN STAGE ── */}
                <main className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white">

                    {/* ══ APPROVED WORKSTATION ══ */}
                    {approvedSelected && (() => {
                        const link = approvedSelected;
                        return (
                            <div className="flex flex-col flex-1 min-h-0">
                                <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-6 py-4 md:py-6 space-y-5" style={{ scrollbarGutter: "stable" }}>
                                    <div className="flex items-center justify-between flex-wrap gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <h1 className="font-black text-zinc-900 leading-tight" style={{ fontSize: '28px' }}>{link.name}</h1>
                                                {link.is_verified && <BadgeCheck className="w-6 h-6 text-orange-500" />}
                                            </div>
                                            <p className="font-medium text-zinc-500 mt-0.5" style={{ fontSize: '17px' }}>{link.sub}</p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2">
                                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                                                <span className="font-black text-zinc-900" style={{ fontSize: '15px' }}>{link.leads} leads</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2">
                                                <Zap className="w-4 h-4 text-orange-500" />
                                                <span className="font-black text-zinc-900" style={{ fontSize: '15px' }}>${link.earned.toFixed(0)} earned</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl overflow-hidden shadow-lg shadow-zinc-100">
                                        <div className="bg-zinc-900 px-5 py-4">
                                            <p className="font-black text-zinc-400 uppercase tracking-widest" style={{ fontSize: '13px' }}>Your Referral Link</p>
                                            <p className="font-bold text-zinc-200 mt-0.5" style={{ fontSize: '15px' }}>Share this link — you earn {feeDisplay}</p>
                                        </div>
                                        <div className="bg-white px-5 py-5">
                                            <div className="w-full overflow-x-auto bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 font-mono text-zinc-600 whitespace-nowrap mb-4" style={{ fontSize: '16px' }}>
                                                {referralLink}
                                            </div>
                                            <button onClick={handleCopy} className="w-full flex items-center justify-center gap-3 h-14 rounded-2xl font-black text-white transition-all active:scale-[0.99]" style={{ fontSize: '19px', background: copied ? "#16a34a" : "#FF7A00", boxShadow: copied ? "0 8px 24px rgba(22,163,74,0.25)" : "0 8px 24px rgba(255,122,0,0.35)" }}>
                                                {copied ? <><Check className="w-5 h-5" /> Link Copied!</> : <><Copy className="w-5 h-5" /> Copy Referral Link</>}
                                            </button>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                                                <Link href={referralLink} target="_blank" className="flex items-center justify-center gap-2 px-5 py-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl font-bold text-zinc-700 transition-all" style={{ fontSize: '15px' }}>
                                                    <Share2 className="w-4 h-4" /> Open Public Link
                                                </Link>
                                                <Link href={leadFormLink} target="_blank" className="flex items-center justify-center gap-2 px-5 py-3 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl font-bold text-orange-700 transition-all" style={{ fontSize: '15px' }}>
                                                    <Send className="w-4 h-4" /> Submit Lead / Job
                                                </Link>
                                                <Link href={referrerBusinessPageLink} className="flex items-center justify-center gap-2 px-5 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl font-bold text-white transition-all" style={{ fontSize: '15px' }}>
                                                    <Building2 className="w-4 h-4" /> Referral Page
                                                </Link>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl overflow-hidden shadow-lg shadow-zinc-100">
                                        <div className="bg-zinc-900 px-5 py-4">
                                            <p className="font-black text-zinc-400 uppercase tracking-widest" style={{ fontSize: '13px' }}>Marketing Swipe File</p>
                                            <p className="font-bold text-zinc-200 mt-0.5" style={{ fontSize: '15px' }}>Ready-to-send copy — tap, copy, share</p>
                                        </div>
                                        <div className="bg-white">
                                            <div className="flex overflow-x-auto px-5 pt-4 gap-1">
                                                {([{ key: "sms", icon: MessageSquare, label: "SMS" }, { key: "email", icon: Mail, label: "Email" }, { key: "social", icon: Share2, label: "Social" }] as const).map(({ key, icon: Icon, label }) => (
                                                    <button key={key} onClick={() => setTab(key)} className={`flex shrink-0 items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all ${tab === key ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"}`} style={{ fontSize: '17px' }}>
                                                        <Icon className="w-4 h-4" />{label}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="px-5 pt-3 pb-5">
                                                <div className="bg-zinc-50 rounded-2xl p-4 font-medium text-zinc-700 leading-relaxed whitespace-pre-wrap cursor-text select-all" style={{ fontSize: '17px', lineHeight: 1.65 }}>
                                                    {swipeContent[tab]}
                                                </div>
                                                <button onClick={handleCopySwipe} className="mt-3 flex items-center gap-2 px-5 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl transition-all" style={{ fontSize: '16px' }}>
                                                    <Copy className="w-4 h-4" /> Copy {tab.toUpperCase()} Copy
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Inline Chat — pinned to bottom */}
                                <div className="shrink-0 px-4 md:px-6 pb-4 md:pb-5 pt-0 bg-white">
                                    <div className="rounded-2xl overflow-hidden flex flex-col shadow-lg shadow-zinc-100" style={{ height: '220px' }}>
                                        <InlineChat key={link.business_id} businessId={link.business_id} businessName={link.name.split(" ")[0]} token={token} />
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* ══ PENDING / WAITING ROOM WORKSTATION ══ */}
                    {pendingSelected && (() => {
                        const app = pendingSelected;
                        const feeCents = app.referral_fee_cents ?? 0;
                        const potentialFee = feeCents > 0 ? `$${((feeCents * 0.8) / 100).toFixed(2)}` : null;
                        const appliedDate = new Date(app.applied_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
                        return (
                            <div className="flex flex-col flex-1 min-h-0">

                                {/* TOP: Status Hero — always visible, flex-none */}
                                <div className="shrink-0 px-4 md:px-6 pt-4 md:pt-6 pb-3">
                                    <div className="rounded-2xl overflow-hidden shadow-lg shadow-zinc-100">
                                        <div className="bg-amber-500 px-6 py-5">
                                            <div className="flex items-center gap-3 mb-1">
                                                <Clock className="w-6 h-6 text-white" />
                                                <p className="font-black text-white uppercase tracking-widest" style={{ fontSize: '13px' }}>Application Status</p>
                                            </div>
                                            <h1 className="font-black text-white leading-tight" style={{ fontSize: '26px' }}>
                                                Your application to join {app.business_name} is being reviewed
                                            </h1>
                                            <p className="font-medium text-amber-100 mt-1" style={{ fontSize: '16px' }}>
                                                Applied {appliedDate} · Businesses respond within 72 hours
                                            </p>
                                        </div>
                                        <div className="bg-white px-6 py-4">
                                            <div className="flex flex-wrap gap-3">
                                                <div className="flex-1 min-w-[120px] bg-zinc-50 rounded-2xl px-4 py-3 text-center">
                                                    <p className="font-black text-zinc-500 uppercase tracking-widest" style={{ fontSize: '11px' }}>TRADE</p>
                                                    <p className="font-black text-zinc-800 mt-1" style={{ fontSize: '18px' }}>{app.trade_category}</p>
                                                </div>
                                                <div className="flex-1 min-w-[120px] bg-zinc-50 rounded-2xl px-4 py-3 text-center">
                                                    <p className="font-black text-zinc-500 uppercase tracking-widest" style={{ fontSize: '11px' }}>LOCATION</p>
                                                    <p className="font-black text-zinc-800 mt-1" style={{ fontSize: '18px' }}>{app.suburb}</p>
                                                </div>
                                                <div className="flex-1 min-w-[120px] bg-orange-50 rounded-2xl px-4 py-3 text-center">
                                                    <p className="font-black text-orange-500 uppercase tracking-widest" style={{ fontSize: '11px' }}>POTENTIAL REWARD</p>
                                                    {potentialFee ? (
                                                        <p className="font-black text-orange-600 mt-1" style={{ fontSize: '24px' }}>{potentialFee}</p>
                                                    ) : (
                                                        <p className="font-black text-orange-400 mt-1" style={{ fontSize: '16px' }}>Set by business</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* MIDDLE: Tips — flex-1, only area that scrolls */}
                                <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-6 py-3" style={{ scrollbarGutter: "stable" }}>
                                    <div className="rounded-2xl bg-zinc-50 px-6 py-5 shadow-lg shadow-zinc-100">
                                        <div className="flex items-center gap-2 mb-3">
                                            <AlertCircle className="w-5 h-5 text-zinc-400" />
                                            <p className="font-black text-zinc-700" style={{ fontSize: '17px' }}>While you wait…</p>
                                        </div>
                                        <ul className="space-y-2">
                                            {[
                                                "Complete your referrer profile to boost your approval chance",
                                                "Messaging will unlock as soon as the business approves you",
                                                "Apply to other businesses in the meantime",
                                            ].map((tip, i) => (
                                                <li key={i} className="flex items-start gap-2 font-medium text-zinc-600" style={{ fontSize: '16px' }}>
                                                    <span className="w-5 h-5 rounded-full bg-zinc-200 text-zinc-500 font-black flex items-center justify-center shrink-0 mt-0.5" style={{ fontSize: '12px' }}>{i + 1}</span>
                                                    {tip}
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="flex flex-wrap gap-3 mt-4">
                                            <Link href="/dashboard/referrer/profile" className="flex items-center gap-2 px-5 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl transition-all" style={{ fontSize: '16px' }}>
                                                Edit My Profile <ChevronRight className="w-4 h-4" />
                                            </Link>
                                            <Link href="/dashboard/referrer/businesses" className="flex items-center gap-2 px-5 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-bold rounded-xl transition-all" style={{ fontSize: '16px' }}>
                                                Find More Businesses
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                {/* BOTTOM: Locked chat input — always pinned, flex-none */}
                                <div className="shrink-0 px-4 md:px-6 pb-4 md:pb-5 pt-3">
                                    <div className="rounded-2xl overflow-hidden shadow-lg shadow-zinc-100">
                                        <div className="bg-zinc-900 px-5 py-4 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <MessageSquare className="w-4 h-4 text-orange-400" />
                                                <span className="font-black text-white" style={{ fontSize: '16px' }}>Chat with {app.business_name.split(" ")[0]}</span>
                                            </div>
                                            <span className="px-3 py-1 bg-amber-500 text-white font-black rounded-lg" style={{ fontSize: '12px' }}>Awaiting Approval</span>
                                        </div>
                                        <div className="bg-zinc-50 flex items-center gap-4 px-5 py-4 border-b border-zinc-100">
                                            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                                                <Clock className="w-5 h-5 text-amber-500" />
                                            </div>
                                            <p className="font-medium text-zinc-600" style={{ fontSize: '16px', lineHeight: 1.5 }}>
                                                Messaging unlocks once <strong className="text-zinc-800">{app.business_name}</strong> approves your application.
                                            </p>
                                        </div>
                                        <div className="bg-gray-100 flex items-center gap-3 px-3 py-3 border-t border-gray-300 opacity-50 pointer-events-none">
                                            <div className="flex-1 bg-white border border-gray-400 rounded-xl px-4 py-2.5 font-semibold text-gray-400" style={{ fontSize: '18px' }}>
                                                Available after approval…
                                            </div>
                                            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-zinc-300">
                                                <Send className="w-4 h-4 text-zinc-400" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        );
                    })()}
                </main>
            </div>
        </div>
    );
}
