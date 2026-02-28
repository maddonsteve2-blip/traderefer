"use client";

import { useState, useRef } from "react";
import { Copy, Check, MessageSquare, Mail, Phone, Facebook, Twitter, Instagram, Share2, QrCode, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import QRCode from "react-qr-code";
import posthog from "posthog-js";

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
        const channelNames = ['sms', 'whatsapp', 'email'];
        posthog.capture('referral_message_copied', {
            channel: channelNames[index] || 'unknown',
            business_slug: slug,
            business_name: businessName,
        });
        toast.success("Message copied! Paste it anywhere.");
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const shareButtons = [
        {
            label: "WhatsApp",
            icon: MessageSquare,
            color: "bg-green-600 hover:bg-green-700",
            onClick: () => {
                posthog.capture('referral_link_shared', { channel: 'whatsapp', business_slug: slug, business_name: businessName });
                const text = encodeURIComponent(messages[1].text);
                window.open(`https://wa.me/?text=${text}`, '_blank');
            }
        },
        {
            label: "Facebook",
            icon: Facebook,
            color: "bg-blue-600 hover:bg-blue-700",
            onClick: () => {
                posthog.capture('referral_link_shared', { channel: 'facebook', business_slug: slug, business_name: businessName });
                const url = encodeURIComponent(referralUrl);
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${encodeURIComponent(shareText)}`, '_blank', 'width=600,height=400');
            }
        },
        {
            label: "X.com",
            icon: Twitter,
            color: "bg-zinc-900 hover:bg-black",
            onClick: () => {
                posthog.capture('referral_link_shared', { channel: 'twitter', business_slug: slug, business_name: businessName });
                const text = encodeURIComponent(`${shareText} ${referralUrl}`);
                window.open(`https://x.com/intent/tweet?text=${text}`, '_blank', 'width=600,height=400');
            }
        },
        {
            label: "Instagram",
            icon: Instagram,
            color: "bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600",
            onClick: () => {
                posthog.capture('referral_link_shared', { channel: 'instagram', business_slug: slug, business_name: businessName });
                navigator.clipboard.writeText(`${shareText} ${referralUrl}`);
                toast.success("Caption copied! Paste it in your Instagram story or post.");
            }
        },
        {
            label: "Email",
            icon: Mail,
            color: "bg-zinc-600 hover:bg-zinc-700",
            onClick: () => {
                posthog.capture('referral_link_shared', { channel: 'email', business_slug: slug, business_name: businessName });
                const subject = encodeURIComponent(`Check out ${businessName} — great ${tradeCategory.toLowerCase()} in ${suburb}`);
                const body = encodeURIComponent(messages[2].text);
                window.open(`mailto:?subject=${subject}&body=${body}`);
            }
        }
    ];

    return (
        <div className="space-y-8">
            {/* Quick Share Buttons */}
            <div className="space-y-6">
                <p className="text-sm font-black text-zinc-400 uppercase tracking-[0.2em] px-1">Share Instantly</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {shareButtons.map((btn) => (
                        <button
                            key={btn.label}
                            onClick={btn.onClick}
                            className="flex items-center justify-center gap-4 px-6 py-5 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-[24px] text-base font-bold text-zinc-900 transition-all active:scale-[0.98] shadow-sm group"
                        >
                            <btn.icon className="w-6 h-6 shrink-0 transition-transform group-hover:scale-110" />
                            {btn.label}
                        </button>
                    ))}
                    <button
                        onClick={() => {
                            posthog.capture('referral_link_shared', { channel: 'native_share', business_slug: slug, business_name: businessName });
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
                        className="flex items-center justify-center gap-4 px-6 py-5 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-[24px] text-base font-bold text-zinc-900 transition-all active:scale-[0.98] shadow-sm group"
                    >
                        <Share2 className="w-6 h-6 shrink-0 transition-transform group-hover:scale-110" />
                        System Share
                    </button>
                </div>
            </div>

            {/* Pre-written Messages */}
            <div className="space-y-6">
                <p className="text-sm font-black text-zinc-400 uppercase tracking-[0.2em] px-1">Ready-to-use Messaging</p>
                <div className="space-y-8">
                    {messages.map((msg, i) => (
                        <div key={msg.label} className="group relative">
                            <div className="absolute -inset-1 bg-zinc-900 rounded-[32px] blur opacity-0 group-hover:opacity-[0.05] transition duration-500"></div>
                            <div className="relative rounded-[32px] border border-zinc-200 bg-white overflow-hidden transition-all group-hover:border-zinc-300 group-hover:shadow-lg">
                                <div className="flex items-center justify-between px-8 py-5 bg-zinc-50 border-b border-zinc-100">
                                    <span className="text-xs font-black text-zinc-500 flex items-center gap-3 uppercase tracking-widest">
                                        <msg.icon className="w-5 h-5" /> {msg.label}
                                    </span>
                                    <button
                                        onClick={() => handleCopy(msg.text, i)}
                                        className={`text-xs font-black uppercase tracking-[0.1em] flex items-center gap-2.5 transition-all ${copiedIndex === i ? 'text-green-600' : 'text-zinc-500 hover:text-orange-600'}`}
                                    >
                                        {copiedIndex === i ? (
                                            <><Check className="w-5 h-5" /> Copied</>
                                        ) : (
                                            <><Copy className="w-5 h-5 transition-transform group-hover:scale-110" /> Copy Text</>
                                        )}
                                    </button>
                                </div>
                                <div
                                    onClick={() => handleCopy(msg.text, i)}
                                    className="p-10 text-lg text-zinc-800 font-medium leading-[1.7] cursor-pointer hover:bg-zinc-50/50 transition-colors whitespace-pre-wrap font-sans"
                                >
                                    {msg.text}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* QR Code */}
            <div className="space-y-6">
                <p className="text-sm font-black text-zinc-400 uppercase tracking-[0.2em] px-1">Direct Referral (QR)</p>
                <button
                    onClick={() => {
                        if (!showQR) {
                            posthog.capture('referral_qr_code_shown', { business_slug: slug, business_name: businessName });
                        }
                        setShowQR(!showQR);
                    }}
                    className="w-full flex items-center justify-center gap-4 px-8 py-6 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-[28px] text-lg font-black text-zinc-900 transition-all active:scale-[0.98] shadow-sm"
                >
                    <QrCode className="w-6 h-6" />
                    {showQR ? 'Hide QR Code' : 'Generate Referral QR'}
                </button>
                {showQR && (
                    <div className="mt-8 flex flex-col items-center gap-8 p-12 bg-white border border-zinc-200 rounded-[40px] shadow-2xl animate-in fade-in zoom-in-95 duration-500 text-center">
                        <div ref={qrRef} className="bg-white p-10 rounded-[40px] border border-zinc-100 shadow-2xl shadow-zinc-200/50">
                            <QRCode value={referralUrl} size={240} />
                        </div>
                        <div className="space-y-3">
                            <p className="text-xl text-zinc-900 font-black">Scan to Refer</p>
                            <p className="text-base text-zinc-500 font-medium leading-relaxed max-w-[280px]">Have your friend scan this to go directly to {businessName}.</p>
                        </div>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(referralUrl);
                                toast.success("Link copied!");
                            }}
                            className="px-10 py-4 rounded-full bg-zinc-900 text-base font-black text-white hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200/50"
                        >
                            Copy Direct Link
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
