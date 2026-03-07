"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import {
    Copy, Check, Send, MessageSquare, Building2, Plus,
    ChevronRight, Zap, Mail, Share2, BadgeCheck, Users, TrendingUp, Loader2
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
        <div className="flex flex-col h-72">
            {/* Chat header */}
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 rounded-t-2xl">
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
            <div className="flex items-center gap-2 px-3 py-2.5 bg-white rounded-b-2xl border-t border-zinc-100">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                    placeholder="Type a message…"
                    className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-orange-400 font-medium text-zinc-900 placeholder-zinc-400"
                    style={{ fontSize: '16px' }}
                />
                <button
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all bg-orange-600 hover:bg-orange-700 disabled:bg-zinc-200 text-white disabled:text-zinc-400"
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
    const [selected, setSelected] = useState<TeamLink | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [tab, setTab] = useState<"sms" | "email" | "social">("sms");
    const [token, setToken] = useState<string>("");

    useEffect(() => {
        if (!isLoaded) return;
        (async () => {
            const t = await getToken() || "";
            setToken(t);
            const res = await fetch(`${API}/referrer/dashboard`, {
                headers: { Authorization: `Bearer ${t}` },
            });
            if (res.ok) {
                const data = await res.json();
                const l: TeamLink[] = data.active_links || [];
                setLinks(l);
                if (l.length > 0) setSelected(l[0]);
            }
            setLoading(false);
        })();
    }, [isLoaded, getToken]);

    const referralLink = selected ? `${BASE_URL}/b/${selected.slug}?ref=${selected.code}` : "";
    const feeDisplay = selected ? `$${((selected.referral_fee_cents * 0.8) / 100).toFixed(2)} per lead` : "";

    const handleCopy = () => {
        if (!referralLink) return;
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        toast.success("Referral link copied! 🚀");
        setTimeout(() => setCopied(false), 2500);
    };

    const swipeContent = {
        sms: selected
            ? `Hey! I highly recommend ${selected.name} for any ${selected.trade_category} work. They're verified pros. Use my personal link to book: ${referralLink}`
            : "",
        email: selected
            ? `Subject: "You need to check out ${selected.name}"\n\nHey,\n\nI wanted to share a local ${selected.trade_category} business I've been working with — ${selected.name}. They have a 5.0 trust score, are fully verified on TradeRefer, and do incredible work in ${selected.sub.split("•")[1]?.trim() || "the area"}.\n\nThey handle all things ${selected.trade_category.toLowerCase()} and their team is reliable, transparent, and professional. You can book directly through my personal referral link and they'll take great care of you:\n\n${referralLink}`
            : "",
        social: selected
            ? `⭐ Found the best ${selected.trade_category} crew around! ${selected.name} are verified, reliable, and seriously professional. Book through my personal link: ${referralLink} #${selected.trade_category.replace(/\s/g, "")} #TradeRefer`
            : "",
    };

    const handleCopySwipe = () => {
        navigator.clipboard.writeText(swipeContent[tab]);
        toast.success(`${tab.toUpperCase()} copy copied!`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-[3px] border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // ── EMPTY STATE ──────────────────────────────────────────────────────────
    if (links.length === 0) {
        return (
            <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Users className="w-10 h-10 text-orange-300" />
                </div>
                <h1 className="font-black text-zinc-900 mb-3" style={{ fontSize: '32px' }}>Build Your Team</h1>
                <p className="font-medium text-zinc-500 max-w-md mb-8" style={{ fontSize: '18px', lineHeight: 1.65 }}>
                    You don&apos;t have any approved referral partnerships yet. Apply to join a business&apos;s network to unlock your Mission Control.
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

    // ── MAIN LAYOUT ──────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-white">
            {/* ── MOBILE: Horizontal chip scroll ── */}
            <div className="md:hidden w-full overflow-x-auto bg-gray-50 border-b border-zinc-100 px-4 py-3 flex gap-2 shrink-0">
                {links.map(link => (
                    <button
                        key={link.slug}
                        onClick={() => setSelected(link)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl shrink-0 font-bold transition-all ${
                            selected?.slug === link.slug
                                ? "bg-zinc-900 text-white"
                                : "bg-white border border-zinc-200 text-zinc-700"
                        }`}
                        style={{ fontSize: '15px' }}
                    >
                        {link.logo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={link.logo_url} alt="" className="w-5 h-5 rounded-md object-cover" />
                        ) : (
                            <Building2 className="w-4 h-4 opacity-50" />
                        )}
                        {link.name}
                    </button>
                ))}
                <Link
                    href="/dashboard/referrer/businesses"
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl shrink-0 font-bold bg-orange-50 text-orange-600 border border-orange-200 whitespace-nowrap"
                    style={{ fontSize: '15px' }}
                >
                    <Plus className="w-4 h-4" /> Join Trade
                </Link>
            </div>

            {/* ── DESKTOP: Full-width 2-col layout ── */}
            <div className="flex w-full min-h-screen">

                {/* ── SIDEBAR (desktop only) ── */}
                <aside className="hidden md:flex flex-col w-[26%] min-h-screen bg-gray-50 shrink-0"
                    style={{ boxShadow: "4px 0 20px rgba(0,0,0,0.05)" }}>

                    {/* Sidebar header */}
                    <div className="px-5 pt-6 pb-4">
                        <p className="font-black uppercase tracking-widest text-zinc-400" style={{ fontSize: '13px' }}>My Trades Team</p>
                        <p className="font-black text-zinc-900 mt-0.5" style={{ fontSize: '22px' }}>{links.length} Partnership{links.length !== 1 ? "s" : ""}</p>
                    </div>

                    {/* Team cards */}
                    <div className="flex-1 overflow-y-auto px-3 space-y-2 pb-4">
                        {links.map(link => {
                            const isActive = selected?.slug === link.slug;
                            const initials = link.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
                            const myFee = `$${((link.referral_fee_cents * 0.8) / 100).toFixed(2)} per lead`;
                            return (
                                <button
                                    key={link.slug}
                                    onClick={() => setSelected(link)}
                                    className={`w-full text-left p-4 rounded-2xl transition-all ${
                                        isActive
                                            ? "bg-white shadow-lg shadow-zinc-100 ring-2 ring-orange-500/20"
                                            : "hover:bg-white hover:shadow-md hover:shadow-zinc-100"
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center font-black text-orange-600 shrink-0 overflow-hidden" style={{ fontSize: '15px' }}>
                                            {link.logo_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={link.logo_url} alt="" className="w-full h-full object-cover" />
                                            ) : initials}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <p className="font-black text-zinc-900 truncate leading-tight" style={{ fontSize: '17px' }}>{link.name}</p>
                                                {link.is_verified && <BadgeCheck className="w-4 h-4 text-orange-500 shrink-0" />}
                                            </div>
                                            <p className="font-medium text-zinc-500 truncate" style={{ fontSize: '15px' }}>{link.trade_category}</p>
                                            <span className="inline-block mt-1.5 px-2.5 py-1 bg-zinc-900 text-white font-black rounded-lg" style={{ fontSize: '13px' }}>
                                                {myFee}
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
                        })}
                    </div>

                    {/* Footer CTA */}
                    <div className="p-4 border-t border-zinc-100">
                        <Link
                            href="/dashboard/referrer/businesses"
                            className="flex items-center justify-center gap-2 w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-2xl transition-all active:scale-95 shadow-lg shadow-orange-200"
                            style={{ fontSize: '16px' }}
                        >
                            <Plus className="w-5 h-5" /> Join a New Trade Team
                        </Link>
                    </div>
                </aside>

                {/* ── MAIN STAGE ── */}
                <main className="flex-1 bg-white px-6 py-6 overflow-y-auto space-y-6">
                    {selected && (
                        <>
                            {/* Stage header */}
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="font-black text-zinc-900 leading-tight" style={{ fontSize: '28px' }}>{selected.name}</h1>
                                        {selected.is_verified && <BadgeCheck className="w-6 h-6 text-orange-500" />}
                                    </div>
                                    <p className="font-medium text-zinc-500 mt-0.5" style={{ fontSize: '17px' }}>{selected.sub}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2">
                                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                                        <span className="font-black text-zinc-900" style={{ fontSize: '15px' }}>{selected.leads} leads</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2">
                                        <Zap className="w-4 h-4 text-orange-500" />
                                        <span className="font-black text-zinc-900" style={{ fontSize: '15px' }}>${selected.earned.toFixed(0)} earned</span>
                                    </div>
                                </div>
                            </div>

                            {/* ── LINK VAULT ── */}
                            <div className="rounded-2xl overflow-hidden shadow-lg shadow-zinc-100">
                                <div className="bg-zinc-900 px-5 py-4">
                                    <p className="font-black text-zinc-400 uppercase tracking-widest" style={{ fontSize: '13px' }}>Your Referral Link</p>
                                    <p className="font-bold text-zinc-200 mt-0.5" style={{ fontSize: '15px' }}>Share this link — you earn {feeDisplay}</p>
                                </div>
                                <div className="bg-white px-5 py-5">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 font-mono text-zinc-600 truncate" style={{ fontSize: '16px' }}>
                                            {referralLink}
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleCopy}
                                        className="w-full flex items-center justify-center gap-3 h-14 rounded-2xl font-black text-white transition-all active:scale-[0.99] shadow-xl"
                                        style={{
                                            fontSize: '19px',
                                            background: copied ? "#16a34a" : "#FF7A00",
                                            boxShadow: copied ? "0 8px 24px rgba(22,163,74,0.25)" : "0 8px 24px rgba(255,122,0,0.35)"
                                        }}
                                    >
                                        {copied ? (
                                            <><Check className="w-5 h-5" /> Link Copied!</>
                                        ) : (
                                            <><Copy className="w-5 h-5" /> Copy Referral Link</>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* ── MARKETING SWIPE FILE ── */}
                            <div className="rounded-2xl overflow-hidden shadow-lg shadow-zinc-100">
                                <div className="bg-zinc-900 px-5 py-4">
                                    <p className="font-black text-zinc-400 uppercase tracking-widest" style={{ fontSize: '13px' }}>Marketing Swipe File</p>
                                    <p className="font-bold text-zinc-200 mt-0.5" style={{ fontSize: '15px' }}>Ready-to-send copy — tap, copy, share</p>
                                </div>
                                <div className="bg-white">
                                    {/* Tabs */}
                                    <div className="flex px-5 pt-4 gap-1">
                                        {([
                                            { key: "sms", icon: MessageSquare, label: "SMS" },
                                            { key: "email", icon: Mail, label: "Email" },
                                            { key: "social", icon: Share2, label: "Social" },
                                        ] as const).map(({ key, icon: Icon, label }) => (
                                            <button
                                                key={key}
                                                onClick={() => setTab(key)}
                                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all ${
                                                    tab === key
                                                        ? "bg-zinc-900 text-white"
                                                        : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                                                }`}
                                                style={{ fontSize: '17px' }}
                                            >
                                                <Icon className="w-4 h-4" />
                                                {label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Copy block */}
                                    <div className="px-5 pt-3 pb-5">
                                        <div
                                            className="bg-zinc-50 rounded-2xl p-4 font-medium text-zinc-700 leading-relaxed whitespace-pre-wrap cursor-text select-all"
                                            style={{ fontSize: '17px', lineHeight: 1.65 }}
                                        >
                                            {swipeContent[tab]}
                                        </div>
                                        <button
                                            onClick={handleCopySwipe}
                                            className="mt-3 flex items-center gap-2 px-5 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl transition-all"
                                            style={{ fontSize: '16px' }}
                                        >
                                            <Copy className="w-4 h-4" /> Copy {tab.toUpperCase()} Copy
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* ── COMMUNICATION ANCHOR ── */}
                            <div className="rounded-2xl overflow-hidden shadow-lg shadow-zinc-100">
                                <InlineChat
                                    key={selected.business_id}
                                    businessId={selected.business_id}
                                    businessName={selected.name.split(" ")[0]}
                                    token={token}
                                />
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}
