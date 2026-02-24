"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    X,
    Mail,
    Copy,
    Check,
    Facebook,
    Twitter,
    Linkedin,
    Share2,
    Send,
    Users,
    Loader2
} from "lucide-react";
import { toast } from "sonner";

interface InviteReferrersDialogProps {
    open: boolean;
    onClose: () => void;
    businessName: string;
    slug: string;
}

export function InviteReferrersDialog({ open, onClose, businessName, slug }: InviteReferrersDialogProps) {
    const [emails, setEmails] = useState("");
    const [sending, setSending] = useState(false);
    const [copied, setCopied] = useState(false);

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://traderefer.au';
    const joinUrl = `${baseUrl}/join?ref=${slug}`;
    const shareText = `Hey! I'm using TradeRefer to manage my trade referrals. Join as a referrer and earn commissions when you send quality leads my way. Sign up here:`;

    const handleCopy = () => {
        navigator.clipboard.writeText(joinUrl);
        setCopied(true);
        toast.success("Invite link copied!");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSendEmails = async () => {
        const emailList = emails.split(/[,;\n]+/).map(e => e.trim()).filter(e => e.includes("@"));
        if (emailList.length === 0) {
            toast.error("Please enter at least one valid email address");
            return;
        }
        setSending(true);
        // For now, copy the invite link and show a message
        // In future, this could call an API to send actual emails
        navigator.clipboard.writeText(`${shareText}\n${joinUrl}`);
        toast.success(`Invite link copied! Send it to ${emailList.length} contact${emailList.length > 1 ? 's' : ''}`);
        setSending(false);
        setEmails("");
    };

    const shareSocial = (platform: string) => {
        const url = encodeURIComponent(joinUrl);
        const text = encodeURIComponent(`${shareText}`);

        let shareUrl = "";
        switch (platform) {
            case "facebook": shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`; break;
            case "twitter": shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`; break;
            case "linkedin": shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`; break;
            case "whatsapp": shareUrl = `https://wa.me/?text=${text}%20${url}`; break;
            default: handleCopy(); return;
        }
        window.open(shareUrl, "_blank", "width=600,height=400");
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-8 pb-0">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                                <Users className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-zinc-900 font-display">Invite Referrers</h2>
                                <p className="text-sm text-zinc-400 font-medium">Grow your referral network</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                            <X className="w-5 h-5 text-zinc-400" />
                        </button>
                    </div>
                </div>

                <div className="px-8 pb-8 space-y-6">
                    {/* Copy Link Section */}
                    <div>
                        <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">
                            Share Your Invite Link
                        </label>
                        <div className="flex items-center gap-2 p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
                            <div className="text-sm text-zinc-600 truncate flex-1 font-mono">
                                {joinUrl}
                            </div>
                            <Button
                                onClick={handleCopy}
                                variant="ghost"
                                size="sm"
                                className="shrink-0 rounded-xl h-9 px-3 text-orange-600 hover:bg-orange-50"
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                <span className="ml-1.5 text-xs font-bold">{copied ? 'Copied' : 'Copy'}</span>
                            </Button>
                        </div>
                    </div>

                    {/* Social Share */}
                    <div>
                        <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">
                            Share via Social
                        </label>
                        <div className="grid grid-cols-4 gap-3">
                            <button onClick={() => shareSocial('facebook')} className="flex flex-col items-center gap-2 p-4 bg-zinc-50 hover:bg-blue-50 rounded-2xl border border-zinc-100 hover:border-blue-200 transition-all group">
                                <Facebook className="w-5 h-5 text-zinc-400 group-hover:text-blue-600" />
                                <span className="text-xs font-bold text-zinc-400 group-hover:text-blue-600">Facebook</span>
                            </button>
                            <button onClick={() => shareSocial('twitter')} className="flex flex-col items-center gap-2 p-4 bg-zinc-50 hover:bg-sky-50 rounded-2xl border border-zinc-100 hover:border-sky-200 transition-all group">
                                <Twitter className="w-5 h-5 text-zinc-400 group-hover:text-sky-500" />
                                <span className="text-xs font-bold text-zinc-400 group-hover:text-sky-500">Twitter</span>
                            </button>
                            <button onClick={() => shareSocial('linkedin')} className="flex flex-col items-center gap-2 p-4 bg-zinc-50 hover:bg-blue-50 rounded-2xl border border-zinc-100 hover:border-blue-200 transition-all group">
                                <Linkedin className="w-5 h-5 text-zinc-400 group-hover:text-blue-700" />
                                <span className="text-xs font-bold text-zinc-400 group-hover:text-blue-700">LinkedIn</span>
                            </button>
                            <button onClick={() => shareSocial('whatsapp')} className="flex flex-col items-center gap-2 p-4 bg-zinc-50 hover:bg-green-50 rounded-2xl border border-zinc-100 hover:border-green-200 transition-all group">
                                <Share2 className="w-5 h-5 text-zinc-400 group-hover:text-green-600" />
                                <span className="text-xs font-bold text-zinc-400 group-hover:text-green-600">WhatsApp</span>
                            </button>
                        </div>
                    </div>

                    {/* Email Invite */}
                    <div>
                        <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">
                            <Mail className="w-3.5 h-3.5 inline mr-1.5" />
                            Invite by Email
                        </label>
                        <textarea
                            value={emails}
                            onChange={(e) => setEmails(e.target.value)}
                            placeholder="Enter email addresses separated by commas..."
                            rows={3}
                            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-sm font-medium placeholder:text-zinc-300 resize-none"
                        />
                        <Button
                            onClick={handleSendEmails}
                            disabled={sending || !emails.trim()}
                            className="w-full mt-3 bg-zinc-900 hover:bg-black text-white rounded-full h-12 font-bold shadow-lg shadow-zinc-200"
                        >
                            {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                            Send Invites
                        </Button>
                    </div>

                    <p className="text-xs text-zinc-400 text-center font-medium">
                        Referrers who sign up through your link will be connected to your business automatically.
                    </p>
                </div>
            </div>
        </div>
    );
}
