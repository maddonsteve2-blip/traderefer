"use client";

import { useState, useRef } from "react";
import { Copy, Check, MessageSquare, Mail, Phone, Facebook, Twitter, Instagram, Share2, QrCode, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import QRCode from "react-qr-code";

interface Deal {
    title: string;
    discount_text?: string;
}

interface ReferrerShareKitProps {
    businessName: string;
    tradeCategory: string;
    suburb: string;
    slug: string;
    commission: number;
    deals?: Deal[];
}

export function ReferrerShareKit({ businessName, tradeCategory, suburb, slug, commission, deals = [] }: ReferrerShareKitProps) {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [showQR, setShowQR] = useState(false);
    const qrRef = useRef<HTMLDivElement>(null);
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://traderefer.au';
    const referralUrl = `${baseUrl}/b/${slug}`;

    const dealLine = deals.length > 0 ? `\n🎁 Current deal: ${deals[0].discount_text || deals[0].title}` : '';
    const shareText = `Need a ${tradeCategory.toLowerCase()}? Check out ${businessName} in ${suburb} — verified and highly rated. Get a free quote here:`;

    const messages = [
        {
            label: "SMS / Text",
            icon: Phone,
            text: `Hey! Need a ${tradeCategory.toLowerCase()}? I know a great one in ${suburb} — ${businessName}. They're verified and highly rated.${dealLine}\nGet a free quote here: ${referralUrl}`
        },
        {
            label: "WhatsApp",
            icon: MessageSquare,
            text: `👋 Looking for a reliable ${tradeCategory.toLowerCase()}? Check out *${businessName}* in ${suburb}. Licensed, verified, and trusted by the community.${dealLine}\n\nGet a free quote: ${referralUrl}`
        },
        {
            label: "Email",
            icon: Mail,
            text: `Hi,\n\nI wanted to recommend ${businessName} — a verified ${tradeCategory.toLowerCase()} in ${suburb}. They come highly rated and offer free quotes.${deals.length > 0 ? `\n\nCurrent offer: ${deals[0].discount_text || deals[0].title}` : ''}\n\nYou can check them out and book here: ${referralUrl}\n\nHope this helps!`
        }
    ];

    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        toast.success("Message copied! Paste it anywhere.");
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const shareButtons = [
        {
            label: "WhatsApp",
            icon: MessageSquare,
            color: "bg-green-600 hover:bg-green-700",
            onClick: () => {
                const text = encodeURIComponent(messages[1].text);
                window.open(`https://wa.me/?text=${text}`, '_blank');
            }
        },
        {
            label: "Facebook",
            icon: Facebook,
            color: "bg-blue-600 hover:bg-blue-700",
            onClick: () => {
                const url = encodeURIComponent(referralUrl);
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${encodeURIComponent(shareText)}`, '_blank', 'width=600,height=400');
            }
        },
        {
            label: "X.com",
            icon: Twitter,
            color: "bg-zinc-900 hover:bg-black",
            onClick: () => {
                const text = encodeURIComponent(`${shareText} ${referralUrl}`);
                window.open(`https://x.com/intent/tweet?text=${text}`, '_blank', 'width=600,height=400');
            }
        },
        {
            label: "Instagram",
            icon: Instagram,
            color: "bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600",
            onClick: () => {
                navigator.clipboard.writeText(`${shareText} ${referralUrl}`);
                toast.success("Caption copied! Paste it in your Instagram story or post.");
            }
        },
        {
            label: "Email",
            icon: Mail,
            color: "bg-zinc-600 hover:bg-zinc-700",
            onClick: () => {
                const subject = encodeURIComponent(`Check out ${businessName} — great ${tradeCategory.toLowerCase()} in ${suburb}`);
                const body = encodeURIComponent(messages[2].text);
                window.open(`mailto:?subject=${subject}&body=${body}`);
            }
        }
    ];

    return (
        <div className="space-y-4">
            {/* Quick Share Buttons */}
            <div>
                <div className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Share Instantly</div>
                <div className="grid grid-cols-2 gap-2">
                    {shareButtons.map((btn) => (
                        <button
                            key={btn.label}
                            onClick={btn.onClick}
                            className={`${btn.color} text-white rounded-xl px-3 py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md`}
                        >
                            <btn.icon className="w-4 h-4" />
                            {btn.label}
                        </button>
                    ))}
                    <button
                        onClick={() => {
                            if (navigator.share) {
                                navigator.share({
                                    title: `${businessName} — ${tradeCategory}`,
                                    text: shareText,
                                    url: referralUrl
                                });
                            } else {
                                navigator.clipboard.writeText(`${shareText} ${referralUrl}`);
                                toast.success("Link copied!");
                            }
                        }}
                        className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-3 py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md"
                    >
                        <Share2 className="w-4 h-4" />
                        More
                    </button>
                </div>
            </div>

            {/* Pre-written Messages */}
            <div>
                <div className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Copy & Paste Messages</div>
                <div className="space-y-3">
                    {messages.map((msg, i) => (
                        <div key={msg.label} className="group">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-sm font-bold text-zinc-500 flex items-center gap-1.5">
                                    <msg.icon className="w-3.5 h-3.5" /> {msg.label}
                                </span>
                                <button
                                    onClick={() => handleCopy(msg.text, i)}
                                    className="text-sm font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1 transition-colors"
                                >
                                    {copiedIndex === i ? (
                                        <><Check className="w-3.5 h-3.5" /> Copied</>
                                    ) : (
                                        <><Copy className="w-3.5 h-3.5" /> Copy</>
                                    )}
                                </button>
                            </div>
                            <div
                                onClick={() => handleCopy(msg.text, i)}
                                className="p-3 bg-zinc-50 rounded-xl text-sm text-zinc-600 leading-relaxed cursor-pointer hover:bg-orange-50 hover:border-orange-200 border border-zinc-100 transition-all line-clamp-3"
                            >
                                {msg.text}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* QR Code */}
            <div>
                <div className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">In-Person Referral</div>
                <button
                    onClick={() => setShowQR(!showQR)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-600 transition-colors"
                >
                    <QrCode className="w-4 h-4" />
                    {showQR ? 'Hide QR Code' : 'Show QR Code'}
                </button>
                {showQR && (
                    <div className="mt-3 flex flex-col items-center gap-3 p-6 bg-white border border-zinc-200 rounded-xl">
                        <div ref={qrRef} className="bg-white p-3 rounded-xl">
                            <QRCode value={referralUrl} size={160} />
                        </div>
                        <p className="text-sm text-zinc-500 text-center">Show this to anyone who needs a {tradeCategory.toLowerCase()}</p>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(referralUrl);
                                toast.success("Link copied!");
                            }}
                            className="text-sm font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1"
                        >
                            <Copy className="w-3.5 h-3.5" /> Copy Link
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
