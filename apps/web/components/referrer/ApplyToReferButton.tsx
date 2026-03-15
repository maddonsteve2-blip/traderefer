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

    const apiUrl = "/api/backend";
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
                <Link href="/login" className="flex items-center justify-center gap-3 w-full bg-orange-600 hover:bg-orange-700 text-white rounded-full min-h-[64px] font-black transition-all shadow-xl shadow-orange-500/20 text-[21px]">
                    <LogIn className="w-6 h-6" /> Sign In to Apply
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
            <div className="space-y-4">
                <div className="flex items-center gap-3 px-5 py-4 bg-green-50 border-2 border-green-200 rounded-2xl">
                    <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
                    <span className="font-black text-green-700 leading-tight text-[19px]">You&apos;re an active referrer for {businessName}!</span>
                </div>
                {referralLink && (
                    <>
                        <div className="flex items-center gap-3 p-4 bg-white border-2 border-zinc-100 rounded-2xl shadow-sm">
                            <span className="flex-1 text-zinc-500 truncate font-bold text-[17px]">{referralLink}</span>
                            <button onClick={handleCopy} className={`p-2.5 rounded-xl shrink-0 transition-all ${copied ? "bg-green-100 text-green-700" : "bg-zinc-50 text-zinc-400 hover:text-orange-500"}`}>
                                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            </button>
                        </div>
                        <button onClick={handleCopy} className="w-full flex items-center justify-center gap-3 bg-orange-600 hover:bg-orange-700 text-white rounded-full min-h-[64px] font-black transition-all shadow-xl shadow-orange-500/20 text-[21px]">
                            {copied ? <><Check className="w-6 h-6" /> Link Copied!</> : <><Copy className="w-6 h-6" /> Copy Referral Link</>}
                        </button>
                    </>
                )}
                <Link href="/dashboard/referrer" className="flex items-center justify-center gap-2.5 w-full py-4 bg-zinc-50 hover:bg-zinc-100 border-2 border-zinc-200 rounded-2xl font-black text-zinc-600 transition-all text-[17px]">
                    Manage in Dashboard <ExternalLink className="w-5 h-5 opacity-50" />
                </Link>
            </div>
        );
    }

    if (status === "pending") {
        return (
            <div className="space-y-4">
                <div className="flex items-start gap-4 px-5 py-5 bg-amber-50 border-2 border-amber-200 rounded-2xl">
                    <Clock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-black text-amber-800 text-[19px]">Application submitted — awaiting review</p>
                        <p className="font-bold text-amber-600 mt-1 text-[17px]">
                            {businessName} will review your profile within 72 hours.
                        </p>
                    </div>
                </div>
                <Link href="/dashboard/referrer/applications" className="flex items-center justify-center gap-2.5 w-full py-4 bg-zinc-50 hover:bg-zinc-100 border-2 border-zinc-200 rounded-2xl font-black text-zinc-600 transition-all text-[17px]">
                    View All My Applications <ChevronRight className="w-5 h-5" />
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
                    <p className="font-bold text-zinc-500 text-[15px]">
                        {status === "rejected" ? "Your previous application wasn't approved." : "Your previous application expired."}{" "}
                        You can apply again.
                    </p>
                </div>
            )}

            {showIntro ? (
                <div className="space-y-4">
                    <textarea
                        rows={3}
                        maxLength={200}
                        placeholder={`Introduce yourself to ${businessName}... (optional)`}
                        value={intro}
                        onChange={e => setIntro(e.target.value)}
                        className="w-full px-5 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100 text-zinc-900 font-bold resize-none transition-all text-[19px] leading-[1.6]"
                    />
                    <p className="text-zinc-400 font-bold text-sm">{intro.length}/200 — optional</p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowIntro(false)}
                            className="flex-1 py-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-2xl font-black transition-all text-[19px]"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleApply}
                            disabled={applying}
                            className="flex-1 flex items-center justify-center gap-2.5 py-4 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white rounded-2xl font-black transition-all shadow-lg shadow-orange-100 text-[19px]"
                        >
                            {applying ? "Sending…" : <><Send className="w-5 h-5" /> Send Application</>}
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setShowIntro(true)}
                    className="w-full flex items-center justify-center gap-3 bg-orange-600 hover:bg-orange-700 text-white rounded-full min-h-[64px] font-black transition-all active:scale-95 shadow-xl shadow-orange-500/20 text-[21px]"
                >
                    Apply to Refer {businessName}
                    <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                </button>
            )}

            {!showIntro && (
                <p className="text-center font-bold text-zinc-400 text-[16px]">
                    {businessName} reviews applications within 72 hours
                </p>
            )}
        </div>
    );
}
