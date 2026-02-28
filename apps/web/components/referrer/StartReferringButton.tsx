"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Copy, Check, ExternalLink, LogIn, Plus } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface StartReferringButtonProps {
    slug: string;
    businessName: string;
}

export function StartReferringButton({ slug, businessName }: StartReferringButtonProps) {
    const { isSignedIn, getToken } = useAuth();
    const [copied, setCopied] = useState(false);
    const [linking, setLinking] = useState(false);
    const [referralLink, setReferralLink] = useState<string | null>(null);

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://traderefer.au';

    const handleStartReferring = async () => {
        if (!isSignedIn) return;

        setLinking(true);
        try {
            const token = await getToken();
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

            // Try to create a referral link for this business
            const res = await fetch(`${apiUrl}/referrer/links`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ business_slug: slug })
            });

            if (res.ok) {
                const data = await res.json();
                const link = `${baseUrl}/b/${slug}?ref=${data.code || data.referral_code || data.id}`;
                setReferralLink(link);
                toast.success(`You're now referring ${businessName}!`);
            } else {
                // If link already exists, try to fetch existing
                const existingRes = await fetch(`${apiUrl}/referrer/links`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (existingRes.ok) {
                    const links = await existingRes.json();
                    const match = links.find?.((l: any) => l.slug === slug || l.business_slug === slug);
                    if (match) {
                        const link = `${baseUrl}/b/${slug}?ref=${match.code || match.referral_code || match.id}`;
                        setReferralLink(link);
                        toast.info("You already have a referral link for this business!");
                    } else {
                        toast.error("Couldn't create referral link. Please try again.");
                    }
                }
            }
        } catch (err) {
            console.error("Failed to create referral link:", err);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLinking(false);
        }
    };

    const handleCopy = () => {
        if (!referralLink) return;
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        toast.success("Referral link copied!");
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isSignedIn) {
        return (
            <div className="space-y-6">
                <Button asChild className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-full h-16 text-lg font-black shadow-xl shadow-zinc-200/50 transition-all active:scale-95">
                    <Link href="/login" className="flex items-center justify-center gap-3">
                        <LogIn className="w-6 h-6" /> Sign In to Start Referring
                    </Link>
                </Button>
                <p className="text-base text-zinc-500 text-center font-medium px-4 leading-[1.6]">
                    Join our network of referrers to unlock exclusive rewards and track your earnings.
                </p>
            </div>
        );
    }

    if (referralLink) {
        return (
            <div className="space-y-6">
                <div className="group relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl blur opacity-10 group-hover:opacity-25 transition duration-1000"></div>
                    <div className="relative flex items-center gap-4 p-5 bg-white rounded-2xl border border-zinc-200 shadow-sm">
                        <div className="w-12 h-12 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400 group-hover:text-orange-500 transition-colors shrink-0">
                            <ExternalLink className="w-6 h-6" />
                        </div>
                        <div className="text-base text-zinc-600 truncate flex-1 font-bold tracking-tight">{referralLink}</div>
                        <button
                            onClick={handleCopy}
                            className={`p-3 rounded-xl transition-all shrink-0 ${copied ? 'bg-green-50 text-green-600' : 'bg-zinc-50 text-zinc-400 hover:text-orange-500 hover:bg-orange-50'}`}
                        >
                            {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <Button onClick={handleCopy} className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-full h-16 text-lg font-black shadow-xl shadow-zinc-200/50 transition-all active:scale-95 group">
                        {copied ? (
                            <div className="flex items-center gap-3 text-green-400">
                                <Check className="w-6 h-6" /> Copied to Clipboard
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Copy className="w-6 h-6 group-hover:scale-110 transition-transform" /> Copy Referral Link
                            </div>
                        )}
                    </Button>
                    <Link href="/dashboard/referrer" className="w-full">
                        <Button variant="outline" className="w-full rounded-full h-14 text-base font-bold border-zinc-200 hover:bg-zinc-50 text-zinc-600 transition-all">
                            Manage in Referrer Dashboard <ExternalLink className="w-5 h-5 ml-2 opacity-50" />
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <Button
            onClick={handleStartReferring}
            disabled={linking}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-full h-16 text-lg font-black shadow-xl shadow-zinc-200/50 transition-all active:scale-95 group overflow-hidden"
        >
            {linking ? (
                <div className="flex items-center gap-4">
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Setting up...
                </div>
            ) : (
                <div className="flex items-center justify-center gap-3 relative z-10">
                    <p>Start Referring {businessName}</p>
                    <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-white/5 to-orange-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </Button>
    );
}

