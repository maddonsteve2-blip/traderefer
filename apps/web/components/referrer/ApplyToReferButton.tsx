"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Copy, Check, ExternalLink, LogIn, Plus, Clock, Send, ChevronRight, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Props {
    slug: string;
    businessName: string;
    businessId?: string;
}

type Status = "loading" | "none" | "pending" | "linked" | "rejected" | "expired";

export function ApplyToReferButton({ slug, businessName }: Props) {
    const { isSignedIn, getToken } = useAuth();
    const [status, setStatus] = useState<Status>("loading");
    const [linkCode, setLinkCode] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [intro, setIntro] = useState("");
    const [showIntro, setShowIntro] = useState(false);
    const [applying, setApplying] = useState(false);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://traderefer.au";

    useEffect(() => {
        if (!isSignedIn) { setStatus("none"); return; }
        (async () => {
            const token = await getToken();
            const res = await fetch(`${apiUrl}/applications/status/${slug}`, {
                headers: { Authorization: `Bearer ${token}` },
            }).catch(() => null);
            if (!res || !res.ok) { setStatus("none"); return; }
            const data = await res.json();
            if (data.status === "linked") {
                setStatus("linked");
                setLinkCode(data.link_code || null);
            } else if (data.status === "pending") {
                setStatus("pending");
            } else if (data.status === "rejected") {
                setStatus("rejected");
            } else if (data.status === "expired") {
                setStatus("expired");
            } else {
                setStatus("none");
            }
        })();
    }, [isSignedIn, getToken, apiUrl, slug]);

    const handleApply = async () => {
        setApplying(true);
        const token = await getToken();
        const res = await fetch(`${apiUrl}/applications/apply/${slug}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ message: intro.trim() || null }),
        });
        setApplying(false);
        if (res.ok) {
            setStatus("pending");
            setShowIntro(false);
            toast.success("Application sent! The business will review it within 72 hours.");
        } else {
            const err = await res.json().catch(() => ({}));
            if (err.detail === "already_linked") { setStatus("linked"); return; }
            if (err.detail === "already_applied") { setStatus("pending"); return; }
            toast.error("Something went wrong. Please try again.");
        }
    };

    const handleCopy = () => {
        if (!linkCode) return;
        const link = `${baseUrl}/b/${slug}?ref=${linkCode}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        toast.success("Referral link copied!");
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isSignedIn) {
        return (
            <div className="space-y-4">
                <Link href="/login" className="flex items-center justify-center gap-3 w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-full min-h-[56px] font-black transition-all" style={{ fontSize: '18px' }}>
                    <LogIn className="w-5 h-5" /> Sign In to Apply
                </Link>
            </div>
        );
    }

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center h-14">
                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (status === "linked") {
        const referralLink = linkCode ? `${baseUrl}/b/${slug}?ref=${linkCode}` : null;
        return (
            <div className="space-y-3">
                <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                    <span className="font-bold text-green-700" style={{ fontSize: '16px' }}>You&apos;re an active referrer for {businessName}!</span>
                </div>
                {referralLink && (
                    <>
                        <div className="flex items-center gap-2 p-3 bg-white border border-zinc-200 rounded-xl">
                            <span className="flex-1 text-zinc-500 truncate font-medium" style={{ fontSize: '15px' }}>{referralLink}</span>
                            <button onClick={handleCopy} className={`p-2 rounded-lg shrink-0 transition-all ${copied ? "bg-green-50 text-green-600" : "bg-zinc-50 text-zinc-400 hover:text-orange-500"}`}>
                                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            </button>
                        </div>
                        <button onClick={handleCopy} className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full min-h-[56px] font-black transition-all" style={{ fontSize: '18px' }}>
                            {copied ? <><Check className="w-5 h-5" /> Copied!</> : <><Copy className="w-5 h-5" /> Copy Referral Link</>}
                        </button>
                    </>
                )}
                <Link href="/dashboard/referrer" className="flex items-center justify-center gap-2 w-full py-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl font-bold text-zinc-600 transition-all" style={{ fontSize: '16px' }}>
                    Manage in Dashboard <ExternalLink className="w-4 h-4 opacity-50" />
                </Link>
            </div>
        );
    }

    if (status === "pending") {
        return (
            <div className="space-y-3">
                <div className="flex items-start gap-3 px-4 py-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-black text-amber-800" style={{ fontSize: '16px' }}>Application submitted — awaiting review</p>
                        <p className="font-medium text-amber-600 mt-0.5" style={{ fontSize: '15px' }}>
                            {businessName} will review your profile within 72 hours.
                        </p>
                    </div>
                </div>
                <Link href="/dashboard/referrer/applications" className="flex items-center justify-center gap-2 w-full py-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl font-bold text-zinc-600 transition-all" style={{ fontSize: '16px' }}>
                    View All My Applications <ChevronRight className="w-4 h-4" />
                </Link>
            </div>
        );
    }

    // none / rejected / expired — show apply button
    const canReapply = status === "rejected" || status === "expired";

    return (
        <div className="space-y-3">
            {canReapply && (
                <div className="px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                    <p className="font-bold text-zinc-500" style={{ fontSize: '15px' }}>
                        {status === "rejected" ? "Your previous application wasn't approved." : "Your previous application expired."}{" "}
                        You can apply again.
                    </p>
                </div>
            )}

            {showIntro ? (
                <div className="space-y-3">
                    <textarea
                        rows={3}
                        maxLength={200}
                        placeholder={`Introduce yourself to ${businessName}... (optional)`}
                        value={intro}
                        onChange={e => setIntro(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-orange-500 text-zinc-900 font-medium resize-none"
                        style={{ fontSize: '16px' }}
                    />
                    <p className="text-zinc-400 text-xs">{intro.length}/200 — optional</p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowIntro(false)}
                            className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl font-bold transition-all"
                            style={{ fontSize: '16px' }}
                        >
                            Back
                        </button>
                        <button
                            onClick={handleApply}
                            disabled={applying}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white rounded-xl font-bold transition-all"
                            style={{ fontSize: '16px' }}
                        >
                            {applying ? "Sending…" : <><Send className="w-4 h-4" /> Send Application</>}
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setShowIntro(true)}
                    className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full min-h-[56px] font-black transition-all active:scale-95"
                    style={{ fontSize: '18px' }}
                >
                    Apply to Refer {businessName}
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                </button>
            )}

            {!showIntro && (
                <p className="text-center font-medium text-zinc-400" style={{ fontSize: '14px' }}>
                    {businessName} reviews applications within 72 hours
                </p>
            )}
        </div>
    );
}
