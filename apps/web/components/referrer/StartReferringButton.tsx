"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Copy, Check, ExternalLink, LogIn } from "lucide-react";
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
            <div className="space-y-3">
                <Button asChild className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full h-12 font-bold shadow-lg shadow-orange-500/20">
                    <Link href="/login">
                        <LogIn className="w-4 h-4 mr-2" /> Sign In to Start Referring
                    </Link>
                </Button>
                <p className="text-sm text-zinc-400 text-center">
                    Create a free account to get your unique referral link
                </p>
            </div>
        );
    }

    if (referralLink) {
        return (
            <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                    <div className="text-sm text-zinc-600 truncate flex-1 font-mono">{referralLink}</div>
                    <button
                        onClick={handleCopy}
                        className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors shrink-0"
                    >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                </div>
                <Button onClick={handleCopy} className="w-full bg-green-600 hover:bg-green-700 text-white rounded-full h-12 font-bold">
                    {copied ? "Copied!" : "Copy Your Referral Link"}
                </Button>
                <Button asChild variant="outline" className="w-full rounded-full h-10 font-medium border-zinc-200">
                    <Link href="/dashboard/referrer">
                        Go to Dashboard <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <Button
            onClick={handleStartReferring}
            disabled={linking}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full h-12 font-bold shadow-lg shadow-orange-500/20"
        >
            {linking ? "Setting up..." : `Start Referring ${businessName}`}
        </Button>
    );
}
