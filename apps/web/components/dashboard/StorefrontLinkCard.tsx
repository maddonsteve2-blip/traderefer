"use client";

import { useState } from "react";
import { Copy, Facebook, Twitter, Linkedin, Share2, Link as LinkIcon, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";

interface StorefrontLinkCardProps {
    slug: string;
    businessName: string;
}

export function StorefrontLinkCard({ slug, businessName }: StorefrontLinkCardProps) {
    const [copied, setCopied] = useState(false);
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const storefrontUrl = `${baseUrl}/b/${slug}`;

    const handleCopy = () => {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(storefrontUrl);
            setCopied(true);
            toast.success("Link copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const shareSocial = (platform: string) => {
        const url = encodeURIComponent(storefrontUrl);
        const text = encodeURIComponent(`Check out ${businessName} on TradeRefer!`);

        let shareUrl = "";
        switch (platform) {
            case "facebook": shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`; break;
            case "twitter": shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`; break;
            case "linkedin": shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`; break;
            default: handleCopy(); return;
        }
        window.open(shareUrl, "_blank", "width=600,height=400");
    };

    return (
        <div className="bg-zinc-900 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl group">
            <LinkIcon className="absolute -right-8 -bottom-8 w-40 h-40 text-orange-500/10 rotate-12 group-hover:scale-110 transition-transform duration-500" />
            <h3 className="text-xl font-bold mb-4 relative z-10 font-display">Your Storefront</h3>
            <p className="text-zinc-400 text-sm mb-6 relative z-10 leading-relaxed font-medium">
                This is your public booking page. Share this link with customers and referrers.
            </p>

            <div className="flex items-center gap-2 p-3 bg-zinc-800 rounded-2xl mb-6 border border-zinc-700 relative z-10 transition-all hover:bg-zinc-700/50">
                <div className="text-base text-zinc-300 truncate flex-1 font-mono tracking-tight">
                    traderefer.com/b/{slug}
                </div>
                <Button
                    onClick={handleCopy}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
                >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
            </div>

            <div className="space-y-4 relative z-10">
                <Button asChild className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full font-bold shadow-lg shadow-orange-500/30 h-12 flex items-center gap-2">
                    <Link href={`/b/${slug}`} target="_blank">
                        View Storefront <ExternalLink className="w-4 h-4" />
                    </Link>
                </Button>

                <div className="flex justify-center gap-2 pt-2 border-t border-white/10 mt-4">
                    <Button onClick={() => shareSocial('facebook')} variant="ghost" size="icon" className="w-10 h-10 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-all">
                        <Facebook className="w-4 h-4" />
                    </Button>
                    <Button onClick={() => shareSocial('twitter')} variant="ghost" size="icon" className="w-10 h-10 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-all">
                        <Twitter className="w-4 h-4" />
                    </Button>
                    <Button onClick={() => shareSocial('linkedin')} variant="ghost" size="icon" className="w-10 h-10 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-all">
                        <Linkedin className="w-4 h-4" />
                    </Button>
                    <Button onClick={() => handleCopy()} variant="ghost" size="icon" className="w-10 h-10 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-all">
                        <Share2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
