"use client";

import { useState } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription 
} from "@/components/ui/dialog";
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
    Loader2,
    MessageCircle
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
        // Link copying simulation for now
        navigator.clipboard.writeText(`${shareText}\n${joinUrl}`);
        toast.success(`Invite link copied! Send it to ${emailList.length} contact${emailList.length > 1 ? 's' : ''}`);
        setSending(false);
        setEmails("");
        onClose();
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

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg p-0 bg-white rounded-[32px] overflow-hidden border-none shadow-2xl">
                <div className="p-6 md:p-10 space-y-8">
                    <DialogHeader>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 md:w-14 md:h-14 bg-orange-100 rounded-2xl flex items-center justify-center shrink-0">
                                <Users className="w-6 h-6 md:w-7 md:h-7 text-orange-600" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl md:text-3xl font-black text-zinc-900 font-display leading-none mb-1">
                                    Invite Referrers
                                </DialogTitle>
                                <DialogDescription className="text-base md:text-lg text-zinc-500 font-medium leading-tight">
                                    Grow your trusted referral network
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Copy Link Section */}
                        <div className="space-y-3">
                            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest block ml-1">
                                Your Unique Invite Link
                            </label>
                            <div className="flex items-center gap-2 p-2 bg-zinc-50 rounded-2xl border border-zinc-100 group">
                                <div className="flex-1 px-3 py-2 text-base text-zinc-600 font-mono font-bold truncate">
                                    {joinUrl}
                                </div>
                                <Button
                                    onClick={handleCopy}
                                    variant="ghost"
                                    className="h-12 px-6 rounded-xl bg-white shadow-sm border border-zinc-100 text-orange-600 hover:text-orange-700 hover:bg-orange-50 font-black uppercase text-xs tracking-widest"
                                >
                                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                                    {copied ? 'Copied' : 'Copy'}
                                </Button>
                            </div>
                        </div>

                        {/* Social Share grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <button onClick={() => shareSocial('facebook')} className="flex flex-col items-center gap-2 p-4 md:p-6 bg-zinc-50 rounded-2xl border border-zinc-100 hover:bg-blue-50 hover:border-blue-200 transition-all group">
                                <Facebook className="w-6 h-6 md:w-7 md:h-7 text-zinc-400 group-hover:text-blue-600" />
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest group-hover:text-blue-600">FB</span>
                            </button>
                            <button onClick={() => shareSocial('twitter')} className="flex flex-col items-center gap-2 p-4 md:p-6 bg-zinc-50 rounded-2xl border border-zinc-100 hover:bg-sky-50 hover:border-sky-200 transition-all group">
                                <Twitter className="w-6 h-6 md:w-7 md:h-7 text-zinc-400 group-hover:text-sky-500" />
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest group-hover:text-sky-500">X</span>
                            </button>
                            <button onClick={() => shareSocial('linkedin')} className="flex flex-col items-center gap-2 p-4 md:p-6 bg-zinc-50 rounded-2xl border border-zinc-100 hover:bg-blue-50 hover:border-blue-200 transition-all group">
                                <Linkedin className="w-6 h-6 md:w-7 md:h-7 text-zinc-400 group-hover:text-blue-700" />
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest group-hover:text-blue-700">LinkedIn</span>
                            </button>
                            <button onClick={() => shareSocial('whatsapp')} className="flex flex-col items-center gap-2 p-4 md:p-6 bg-zinc-50 rounded-2xl border border-zinc-100 hover:bg-green-50 hover:border-green-200 transition-all group">
                                <MessageCircle className="w-6 h-6 md:w-7 md:h-7 text-zinc-400 group-hover:text-green-600" />
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest group-hover:text-green-600">WA</span>
                            </button>
                        </div>

                        {/* Email box */}
                        <div className="space-y-3">
                            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest block ml-1">
                                <Mail className="w-3 h-3 inline mr-1 text-orange-500" /> Invite via Email
                            </label>
                            <textarea
                                value={emails}
                                onChange={(e) => setEmails(e.target.value)}
                                placeholder="Enter emails separated by commas..."
                                rows={2}
                                className="w-full p-5 bg-zinc-50 border border-zinc-100 rounded-[24px] focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-lg font-medium placeholder:text-zinc-300 resize-none"
                            />
                            <Button
                                onClick={handleSendEmails}
                                disabled={sending || !emails.trim()}
                                className="w-full h-16 bg-zinc-900 hover:bg-black text-white rounded-full font-black text-xl shadow-xl shadow-zinc-200"
                            >
                                {sending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-5 h-5 mr-3" />}
                                Send Invites
                            </Button>
                        </div>
                    </div>

                    <p className="text-sm text-zinc-400 text-center font-medium leading-relaxed max-w-[280px] mx-auto">
                        Referrers who sign up via your link are automatically connected to your business.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
