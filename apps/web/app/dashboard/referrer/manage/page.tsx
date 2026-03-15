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
import { PageTransition } from "@/components/ui/PageTransition";

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

const API = "/api/backend";
const BASE_URL = typeof window !== "undefined" ? window.location.origin : "https://traderefer.au";

// ─── Inline Mini Chat ─────────────────────────────────────────────────────────

function InlineChat({ businessId, businessName, token }: { businessId: string; businessName: string; token: string }) {
    const [convId, setConvId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const bottomRef = useRef<HTMLDivElement>(null);

    const authHeaders = useCallback(
        (includeJson = false): HeadersInit => ({
            Authorization: `Bearer ${token}`,
            ...(includeJson ? { "Content-Type": "application/json" } : {}),
        }),
        [token]
    );

    const loadMessages = useCallback(
        async (conversationId: string) => {
            const response = await fetch(`${API}/messages/conversations/${conversationId}`, {
                headers: authHeaders(),
            }).catch(() => null);

            if (!response?.ok) return;

            const data = await response.json();
            setMessages(Array.isArray(data.messages) ? data.messages : []);
            setTimeout(() => {
                bottomRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 50);
        },
        [authHeaders]
    );

    useEffect(() => {
        let cancelled = false;

        const initializeConversation = async () => {
            setLoading(true);
            setMessages([]);
            setConvId(null);

            const response = await fetch(`${API}/messages/conversations/start-with-business/${businessId}`, {
                method: "POST",
                headers: authHeaders(),
            }).catch(() => null);

            if (!response?.ok || cancelled) {
                if (!cancelled) {
                    setLoading(false);
                }
                return;
            }

            const data = await response.json();
            const conversationId = data.conversation_id as string;

            if (cancelled) return;

            setConvId(conversationId);
            await loadMessages(conversationId);

            if (!cancelled) {
                setLoading(false);
            }
        };

        void initializeConversation();

        return () => {
            cancelled = true;
        };
    }, [authHeaders, businessId, loadMessages]);

    useEffect(() => {
        if (!convId) return;

        const intervalId = setInterval(() => {
            void loadMessages(convId);
        }, 6000);

        return () => {
            clearInterval(intervalId);
        };
    }, [convId, loadMessages]);

    const handleSend = async () => {
        if (!input.trim() || !convId) return;

        const text = input.trim();
        setInput("");
        setSending(true);

        await fetch(`${API}/messages/conversations/${convId}`, {
            method: "POST",
            headers: authHeaders(true),
            body: JSON.stringify({ body: text }),
        });

        await loadMessages(convId);
        setSending(false);
    };

    return (
        <div className="flex h-full flex-col">
            <div className="flex-none flex items-center justify-between rounded-t-2xl bg-[#1a1a1a] px-5 py-4">
                <div className="flex items-center gap-2.5">
                    <MessageSquare className="h-5 w-5 text-orange-400" />
                    <span className="text-lg font-black text-white">Chat with {businessName}</span>
                </div>
                <Link
                    href="/dashboard/referrer/messages"
                    className="flex items-center gap-1 text-sm font-bold text-zinc-400 transition-colors hover:text-orange-400"
                >
                    Full view <ChevronRight className="h-4 w-4" />
                </Link>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto bg-zinc-50 px-4 py-3">
                {loading ? (
                    <div className="flex h-full items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-zinc-300" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                        <MessageSquare className="mb-2 h-8 w-8 text-zinc-200" />
                        <p className="text-sm font-bold text-zinc-400">No messages yet</p>
                        <p className="mt-0.5 text-xs font-medium text-zinc-300">Ask a question or introduce yourself!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const bubbleClassName = msg.is_mine
                            ? "bg-zinc-900 text-white rounded-br-md"
                            : "rounded-bl-md border border-zinc-100 bg-white text-zinc-800 shadow-sm";

                        return (
                            <div key={msg.id} className={`flex ${msg.is_mine ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-base font-medium leading-snug ${bubbleClassName}`}>
                                    {msg.body}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            <div className="flex-none flex items-center gap-3 rounded-b-2xl border-t border-gray-300 bg-gray-100 px-3 py-3">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            void handleSend();
                        }
                    }}
                    placeholder="Type a message…"
                    className="flex-1 rounded-xl border border-gray-400 bg-white px-4 py-2.5 text-lg font-semibold text-zinc-900 shadow-sm placeholder-gray-600 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                />
                <button
                    onClick={() => {
                        void handleSend();
                    }}
                    disabled={!input.trim() || sending}
                    className="h-11 w-11 shrink-0 rounded-xl text-white shadow-md transition-all disabled:bg-zinc-200 disabled:text-zinc-400"
                    style={{ background: input.trim() && !sending ? "#FF7A00" : undefined }}
                >
                    <span className="flex items-center justify-center">
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </span>
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

        let cancelled = false;

        const loadData = async () => {
            try {
                const t = (await getToken()) || "";
                if (cancelled) return;

                setToken(t);

                const requestHeaders: HeadersInit = {
                    Authorization: `Bearer ${t}`,
                };

                const [dashRes, appsRes] = await Promise.all([
                    fetch(`${API}/referrer/dashboard`, { headers: requestHeaders }),
                    fetch(`${API}/applications/my-applications`, { headers: requestHeaders }),
                ]);

                if (cancelled) return;

                const dashData = dashRes.ok ? await dashRes.json() : null;
                const l: TeamLink[] = dashData?.links || dashData?.active_links || [];
                const allApps = appsRes.ok ? (await appsRes.json()).applications || [] : [];
                const pending: PendingApp[] = (Array.isArray(allApps) ? allApps : [])
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
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void loadData();

        return () => {
            cancelled = true;
        };
    }, [isLoaded, getToken]);

    useEffect(() => {
        if (loading) return;

        const approvedMatch = (targetBusinessSlug && Array.isArray(links))
            ? links.find((link) => link.slug === targetBusinessSlug)
            : null;
        if (approvedMatch) {
            setSelected({ type: "approved", link: approvedMatch });
            return;
        }

        const pendingMatch = (targetBusinessSlug && Array.isArray(pendingApps))
            ? pendingApps.find((app) => app.business_slug === targetBusinessSlug)
            : null;
        if (pendingMatch) {
            setSelected({ type: "pending", app: pendingMatch });
            return;
        }

        if (Array.isArray(links) && links.length > 0) {
            setSelected((current) => {
                if (current?.type === "approved" && links.some((link) => link.slug === current.link.slug)) {
                    return current;
                }
                return { type: "approved", link: links[0] };
            });
            return;
        }

        if (Array.isArray(pendingApps) && pendingApps.length > 0) {
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
        navigator.clipboard.writeText(swipeContent[tab as keyof typeof swipeContent]);
        toast.success(`${tab.toUpperCase()} copy copied!`);
    };

    const totalCount = links.length + pendingApps.length;

    if (loading) {
        return (
            <PageTransition className="min-h-screen bg-zinc-50">
                <div className="p-6 space-y-4 max-w-4xl mx-auto pt-10">
                    <div className="h-7 w-32 bg-zinc-200 rounded-xl animate-pulse" />
                    <div className="h-4 w-56 bg-zinc-100 rounded-lg animate-pulse" />
                    <div className="space-y-3 pt-2">
                        {[1,2,3].map(i => (
                            <div key={i} className="bg-white rounded-2xl border border-zinc-200 p-4 flex items-center gap-4">
                                <div className="w-12 h-12 bg-zinc-100 rounded-2xl animate-pulse shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-5 w-40 bg-zinc-100 rounded-lg animate-pulse" />
                                    <div className="h-3 w-28 bg-zinc-50 rounded animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </PageTransition>
        );
    }

    function MobileTeamView() {
        return (
            <div className="lg:hidden min-h-screen bg-zinc-50 pb-32">
                <div className="px-5 pt-4 flex flex-col gap-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-[28px] font-extrabold text-zinc-900 leading-tight">My Team</h1>
                            <p className="mt-1 text-sm font-medium text-zinc-500">Manage active partnerships and keep an eye on reviews in progress.</p>
                        </div>
                        <Link
                            href="/dashboard/referrer/businesses"
                            className="inline-flex items-center gap-1.5 rounded-2xl border border-orange-200 bg-orange-50 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-orange-600"
                        >
                            Join Trade <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-white border border-zinc-200 p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Active Team</p>
                            <p className="mt-1 text-2xl font-black text-zinc-900">{links.length}</p>
                        </div>
                        <div className="rounded-2xl bg-white border border-zinc-200 p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Pending Review</p>
                            <p className="mt-1 text-2xl font-black text-amber-600">{pendingApps.length}</p>
                        </div>
                    </div>

                    {links.length > 0 && (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-zinc-900">Active businesses</h2>
                                <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400">{links.length} live</span>
                            </div>
                            {links.map((link) => (
                                <Link
                                    key={link.slug}
                                    href={`/dashboard/referrer/manage?business=${link.slug}`}
                                    className="rounded-[24px] border border-zinc-200 bg-white p-4 shadow-sm"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center overflow-hidden shrink-0 font-black text-orange-600 text-lg">
                                            {link.logo_url ? <img src={link.logo_url} alt="" className="w-full h-full object-cover" /> : link.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-base font-black text-zinc-900 truncate">{link.name}</p>
                                                {link.is_verified && <BadgeCheck className="w-4 h-4 text-orange-500 shrink-0" />}
                                            </div>
                                            <p className="mt-1 text-[13px] font-medium text-zinc-500">{link.trade_category}</p>
                                            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                                                <div className="rounded-xl bg-zinc-50 px-2 py-2">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Leads</p>
                                                    <p className="mt-1 text-sm font-black text-zinc-900">{link.leads}</p>
                                                </div>
                                                <div className="rounded-xl bg-zinc-50 px-2 py-2">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Earned</p>
                                                    <p className="mt-1 text-sm font-black text-emerald-600">${link.earned.toFixed(0)}</p>
                                                </div>
                                                <div className="rounded-xl bg-zinc-50 px-2 py-2">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Fee</p>
                                                    <p className="mt-1 text-sm font-black text-orange-600">${((link.referral_fee_cents * 0.8) / 100).toFixed(0)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {pendingApps.length > 0 && (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-zinc-900">Pending applications</h2>
                                <Link href="/dashboard/referrer/applications" className="text-[11px] font-black uppercase tracking-widest text-orange-600">Open all</Link>
                            </div>
                            {pendingApps.map((app) => (
                                <Link
                                    key={app.id}
                                    href="/dashboard/referrer/applications"
                                    className="rounded-[24px] border border-amber-200 bg-white p-4 shadow-sm"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center overflow-hidden shrink-0 font-black text-amber-600 text-lg">
                                            {app.business_logo ? <img src={app.business_logo} alt="" className="w-full h-full object-cover" /> : app.business_name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-base font-black text-zinc-900 truncate">{app.business_name}</p>
                                            <p className="mt-1 text-[13px] font-medium text-zinc-500">{app.trade_category} · {app.suburb}</p>
                                            <div className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-amber-700">
                                                <Clock className="h-3.5 w-3.5" /> Awaiting Review
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {totalCount === 0 && (
                        <div className="rounded-[28px] border border-dashed border-zinc-200 bg-white p-8 text-center">
                            <div className="w-16 h-16 bg-orange-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                <Users className="w-8 h-8 text-orange-300" />
                            </div>
                            <h2 className="text-xl font-black text-zinc-900">My Team</h2>
                            <p className="mt-2 text-sm font-medium text-zinc-500">Apply to your first business to start building your partnerships.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (totalCount === 0) {
        return (
            <>
                <MobileTeamView />
                <div className="hidden lg:flex min-h-screen bg-zinc-50 flex-col items-center justify-center px-6 py-16 text-center">
                    <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Users className="w-10 h-10 text-orange-300" />
                    </div>
                    <h1 className="font-black text-zinc-900 mb-3 text-3xl">My Team</h1>
                    <p className="font-medium text-zinc-500 max-w-md mb-8 text-lg leading-relaxed">
                        You don't have any referral partnerships yet. Apply to join a business's network to get started.
                    </p>
                    <Link
                        href="/dashboard/referrer/businesses"
                        className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-black px-8 py-4 rounded-2xl transition-all active:scale-95 shadow-xl shadow-orange-200 text-lg"
                    >
                        Find Your First Business <ChevronRight className="w-5 h-5" />
                    </Link>
                </div>
            </>
        );
    }

    const ApprovedCard = ({ link }: { link: TeamLink }) => {
        const isActive = selected?.type === "approved" && selected.link.slug === link.slug;
        const initials = link.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
        return (
            <button
                onClick={() => setSelected({ type: "approved", link })}
                className={`w-full text-left p-4 rounded-2xl transition-all ${isActive ? "bg-white shadow-lg shadow-zinc-100 ring-2 ring-orange-500/20" : "hover:bg-white hover:shadow-md hover:shadow-zinc-100"}`}
            >
                <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center font-black text-orange-600 shrink-0 overflow-hidden text-lg">
                        {link.logo_url ? <img src={link.logo_url} alt="" className="w-full h-full object-cover" /> : initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                            <p className="font-black text-zinc-900 truncate leading-tight text-xl">{link.name}</p>
                            {link.is_verified && <BadgeCheck className="w-4 h-4 text-orange-500 shrink-0" />}
                        </div>
                        <p className="font-bold text-zinc-500 truncate mt-0.5 text-base">{link.trade_category}</p>
                        <span className="inline-block mt-2 px-3 py-1.5 bg-orange-100 text-orange-700 font-black rounded-lg text-xs">
                            ${((link.referral_fee_cents * 0.8) / 100).toFixed(2)} per lead
                        </span>
                    </div>
                </div>
                {isActive && (
                    <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-zinc-100">
                        <div className="text-center">
                            <p className="font-black text-zinc-900 text-xl">{link.leads}</p>
                            <p className="font-black text-zinc-400 uppercase tracking-widest text-[10px]">Leads</p>
                        </div>
                        <div className="text-center">
                            <p className="font-black text-emerald-600 text-xl">${link.earned.toFixed(0)}</p>
                            <p className="font-black text-zinc-400 uppercase tracking-widest text-[10px]">Earned</p>
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
                    <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center font-black text-amber-600 shrink-0 overflow-hidden text-lg">
                        {app.business_logo ? <img src={app.business_logo} alt="" className="w-full h-full object-cover" /> : initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-black text-zinc-900 truncate leading-tight text-xl">{app.business_name}</p>
                        <p className="font-bold text-zinc-500 truncate mt-0.5 text-base">{app.trade_category}</p>
                        <div className="flex items-center justify-between mt-2">
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-700 font-black rounded-lg text-[13px]">
                                <Clock className="w-3.5 h-3.5" /> Awaiting Review
                            </span>
                            {app.referral_fee_cents > 0 && (
                                <span className="font-black text-orange-600 text-sm">
                                    ${((app.referral_fee_cents * 0.8) / 100).toFixed(2)}/lead
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </button>
        );
    };

    return (
        <PageTransition>
            <MobileTeamView />
            <div className="hidden lg:flex min-h-[100dvh] flex-col bg-white lg:h-screen lg:overflow-hidden">
                <div className="md:hidden shrink-0 w-full overflow-x-auto bg-gray-50 px-4 py-3 flex gap-2">
                    {links.map(link => (
                        <button
                            key={link.slug}
                            onClick={() => setSelected({ type: "approved", link })}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl shrink-0 font-bold transition-all ${selected?.type === "approved" && selected.link.slug === link.slug ? "bg-orange-600 text-white" : "bg-white border border-zinc-200 text-zinc-700"} text-sm`}
                        >
                            {link.logo_url ? <img src={link.logo_url} alt="" className="w-5 h-5 rounded-md object-cover" /> : <Building2 className="w-4 h-4 opacity-50" />}
                            {link.name}
                        </button>
                    ))}
                    {pendingApps.map(app => (
                        <button
                            key={app.id}
                            onClick={() => setSelected({ type: "pending", app })}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl shrink-0 font-bold transition-all ${selected?.type === "pending" && selected.app.id === app.id ? "bg-amber-600 text-white" : "bg-amber-50 border border-amber-200 text-amber-700"} text-sm`}
                        >
                            <Clock className="w-4 h-4" /> {app.business_name}
                        </button>
                    ))}
                    <Link href="/dashboard/referrer/businesses" className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl shrink-0 font-bold bg-orange-50 text-orange-600 border border-orange-200 whitespace-nowrap text-sm">
                        <Plus className="w-4 h-4" /> Join Trade
                    </Link>
                </div>

                <div className="flex-1 flex min-h-0 flex-col md:flex-row lg:overflow-hidden">

                    {/* ── SIDEBAR ── */}
                    <aside className="hidden md:flex flex-col w-[26%] bg-gray-50 shrink-0 overflow-hidden" style={{ boxShadow: "4px 0 20px rgba(0,0,0,0.05)", scrollbarGutter: "stable" }}>
                        <div className="px-5 pt-6 pb-3">
                            <p className="font-black uppercase tracking-widest text-zinc-400 text-[10px]">My Partnerships</p>
                            <p className="font-black text-zinc-900 mt-0.5 text-xl">{totalCount} Business{totalCount !== 1 ? "es" : ""}</p>
                        </div>

                        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1" style={{ scrollbarGutter: "stable" }}>
                            {/* ── Active Team section ── */}
                            {links.length > 0 && (
                                <>
                                    <p className="font-black uppercase tracking-widest text-zinc-400 px-3 pt-3 pb-1.5 text-[10px]">
                                        My Active Team ({links.length})
                                    </p>
                                    {links.map(link => <ApprovedCard key={link.slug} link={link} />)}
                                </>
                            )}

                            {/* ── Pending section ── */}
                            {pendingApps.length > 0 && (
                                <>
                                    <p className="font-black uppercase tracking-widest text-amber-500 px-3 pt-5 pb-1.5 text-[10px]">
                                        Pending Review ({pendingApps.length})
                                    </p>
                                    {pendingApps.map(app => <PendingCard key={app.id} app={app} />)}
                                </>
                            )}
                        </div>

                        <div className="p-4 border-t border-zinc-100">
                            <Link href="/dashboard/referrer/businesses" className="flex items-center justify-center gap-2 w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-2xl transition-all active:scale-95 shadow-lg shadow-orange-200 text-base">
                                <Plus className="w-5 h-5" /> Join a New Trade Team
                            </Link>
                        </div>
                    </aside>

                    {/* ── MAIN STAGE ── */}
                    <main className="flex-1 flex flex-col min-h-0 bg-white md:overflow-hidden">

                        {/* ══ APPROVED WORKSTATION ══ */}
                        {approvedSelected && (() => {
                            const link = approvedSelected;
                            return (
                                <div className="flex flex-col flex-1 min-h-0">
                                    <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-6 py-4 md:py-6 space-y-5" style={{ scrollbarGutter: "stable" }}>
                                        <div className="flex items-center justify-between flex-wrap gap-3">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <h1 className="font-black text-zinc-900 leading-tight text-3xl">{link.name}</h1>
                                                    {link.is_verified && <BadgeCheck className="w-7 h-7 text-orange-500" />}
                                                </div>
                                                <p className="font-bold text-zinc-500 mt-1 text-xl">{link.sub}</p>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3">
                                                <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 shadow-sm">
                                                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                                                    <span className="font-black text-zinc-900 text-base">{link.leads} leads</span>
                                                </div>
                                                <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 shadow-sm">
                                                    <Zap className="w-5 h-5 text-orange-500" />
                                                    <span className="font-black text-zinc-900 text-base">${link.earned.toFixed(0)} earned</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl overflow-hidden shadow-lg shadow-zinc-100">
                                            <div className="bg-orange-600 px-6 py-5">
                                                <p className="font-black text-orange-200 uppercase tracking-widest text-sm">Your Referral Link</p>
                                                <p className="font-bold text-zinc-200 mt-1 text-base">Your link — you earn {feeDisplay}</p>
                                            </div>
                                            <div className="bg-white px-6 py-6">
                                                <div className="w-full overflow-x-auto bg-zinc-50 border border-zinc-200 rounded-xl px-5 py-4 font-mono text-zinc-600 whitespace-nowrap mb-5 text-lg">
                                                    {referralLink}
                                                </div>
                                                <button onClick={handleCopy} className="w-full flex items-center justify-center gap-3 h-16 rounded-2xl font-black text-white transition-all active:scale-[0.99] shadow-xl shadow-orange-500/30 text-2xl" style={{ background: copied ? "#16a34a" : "#FF7A00" }}>
                                                    {copied ? <><Check className="w-6 h-6" /> Link Copied!</> : <><Copy className="w-6 h-6" /> Copy Referral Link</>}
                                                </button>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                                    <Link href={referralLink} target="_blank" className="flex items-center justify-center gap-2.5 px-6 py-4 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl font-black text-zinc-700 transition-all text-base">
                                                        <Share2 className="w-5 h-5" /> Open Public Link
                                                    </Link>
                                                    <Link href={leadFormLink} target="_blank" className="flex items-center justify-center gap-2.5 px-6 py-4 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl font-black text-orange-700 transition-all text-base">
                                                        <Send className="w-5 h-5" /> Submit Lead / Job
                                                    </Link>
                                                    <Link href={referrerBusinessPageLink} className="flex items-center justify-center gap-2.5 px-6 py-4 bg-orange-600 hover:bg-orange-700 rounded-xl font-black text-white transition-all text-base">
                                                        <Building2 className="w-5 h-5" /> Referral Page
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl overflow-hidden shadow-lg shadow-zinc-100">
                                            <div className="bg-orange-600 px-6 py-5">
                                                <p className="font-black text-orange-200 uppercase tracking-widest text-sm">Marketing Swipe File</p>
                                                <p className="font-bold text-zinc-200 mt-1 text-base">Ready-to-send copy — tap, copy, share</p>
                                            </div>
                                            <div className="bg-white">
                                                <div className="flex overflow-x-auto px-6 pt-5 gap-2">
                                                    {([{ key: "sms", icon: MessageSquare, label: "SMS" }, { key: "email", icon: Mail, label: "Email" }, { key: "social", icon: Share2, label: "Social" }] as const).map(({ key, icon: Icon, label }) => (
                                                        <button key={key} onClick={() => setTab(key)} className={`flex shrink-0 items-center gap-2.5 px-6 py-3 rounded-xl font-black transition-all ${tab === key ? "bg-orange-600 text-white" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"} text-lg`} >
                                                            <Icon className="w-5 h-5" />{label}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="px-6 pt-4 pb-6">
                                                    <div className="bg-zinc-50 rounded-2xl p-6 font-bold text-zinc-700 leading-relaxed whitespace-pre-wrap cursor-text select-all border border-zinc-100 text-lg">
                                                        {swipeContent[tab as keyof typeof swipeContent]}
                                                    </div>
                                                    <button onClick={handleCopySwipe} className="mt-4 flex items-center gap-2.5 px-7 py-4 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl transition-all shadow-lg active:scale-95 text-lg">
                                                        <Copy className="w-5 h-5" /> Copy {tab.toUpperCase()} Copy
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
                                                    <p className="font-black text-white uppercase tracking-widest text-[10px]">Application Status</p>
                                                </div>
                                                <h1 className="font-black text-white leading-tight text-2xl">
                                                    Your application to join {app.business_name} is being reviewed
                                                </h1>
                                                <p className="font-medium text-amber-100 mt-1 text-base">
                                                    Applied {appliedDate} · Businesses respond within 72 hours
                                                </p>
                                            </div>
                                            <div className="bg-white px-6 py-4">
                                                <div className="flex flex-wrap gap-3">
                                                    <div className="flex-1 min-w-[120px] bg-zinc-50 rounded-2xl px-4 py-3 text-center">
                                                        <p className="font-black text-zinc-500 uppercase tracking-widest text-[10px]">TRADE</p>
                                                        <p className="font-black text-zinc-800 mt-1 text-lg">{app.trade_category}</p>
                                                    </div>
                                                    <div className="flex-1 min-w-[120px] bg-zinc-50 rounded-2xl px-4 py-3 text-center">
                                                        <p className="font-black text-zinc-500 uppercase tracking-widest text-[10px]">LOCATION</p>
                                                        <p className="font-black text-zinc-800 mt-1 text-lg">{app.suburb}</p>
                                                    </div>
                                                    <div className="flex-1 min-w-[120px] bg-orange-50 rounded-2xl px-4 py-3 text-center">
                                                        <p className="font-black text-orange-500 uppercase tracking-widest text-[10px]">POTENTIAL REWARD</p>
                                                        {potentialFee ? (
                                                            <p className="font-black text-orange-600 mt-1 text-2xl">{potentialFee}</p>
                                                        ) : (
                                                            <p className="font-black text-orange-400 mt-1 text-base">Set by business</p>
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
                                                <p className="font-black text-zinc-700 text-base">While you wait…</p>
                                            </div>
                                            <ul className="space-y-2">
                                                {[
                                                    "Complete your referrer profile to boost your approval chance",
                                                    "Messaging will unlock as soon as the business approves you",
                                                    "Apply to other businesses in the meantime",
                                                ].map((tip, i) => (
                                                    <li key={i} className="flex items-start gap-2 font-medium text-zinc-600 text-base">
                                                        <span className="w-5 h-5 rounded-full bg-zinc-200 text-zinc-500 font-black flex items-center justify-center shrink-0 mt-0.5 text-[10px]">{i + 1}</span>
                                                        {tip}
                                                    </li>
                                                ))}
                                            </ul>
                                            <div className="flex flex-wrap gap-3 mt-4">
                                                <Link href="/dashboard/referrer/profile" className="flex items-center gap-2 px-5 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-all text-base">
                                                    Edit My Profile <ChevronRight className="w-4 h-4" />
                                                </Link>
                                                <Link href="/dashboard/referrer/businesses" className="flex items-center gap-2 px-5 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-bold rounded-xl transition-all text-base">
                                                    Find More Businesses
                                                </Link>
                                            </div>
                                        </div>
                                    </div>

                                    {/* BOTTOM: Locked chat input — always pinned, flex-none */}
                                    <div className="shrink-0 px-4 md:px-6 pb-4 md:pb-5 pt-3">
                                        <div className="rounded-2xl overflow-hidden shadow-lg shadow-zinc-100">
                                            <div className="bg-orange-600 px-5 py-4 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <MessageSquare className="w-4 h-4 text-white/70" />
                                                    <span className="font-black text-white text-base">Chat with {app.business_name.split(" ")[0]}</span>
                                                </div>
                                                <span className="px-3 py-1 bg-amber-500 text-white font-black rounded-lg text-[10px]">Awaiting Approval</span>
                                            </div>
                                            <div className="bg-zinc-50 flex items-center gap-4 px-5 py-4 border-b border-zinc-100">
                                                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                                                    <Clock className="w-5 h-5 text-amber-500" />
                                                </div>
                                                <p className="font-medium text-zinc-600 text-base leading-relaxed">
                                                    Messaging unlocks once <strong className="text-zinc-800">{app.business_name}</strong> approves your application.
                                                </p>
                                            </div>
                                            <div className="bg-gray-100 flex items-center gap-3 px-3 py-3 border-t border-gray-300 opacity-50 pointer-events-none">
                                                <div className="flex-1 bg-white border border-gray-400 rounded-xl px-4 py-2.5 font-semibold text-gray-400 text-lg">
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
        </PageTransition>
    );
}
