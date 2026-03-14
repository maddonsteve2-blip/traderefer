"use client";

import { useState } from "react";
import { 
    Dialog, 
    DialogClose,
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
    const joinUrl = `${baseUrl}/register?ref=${slug}&type=referrer`;
    const shareCopy = `Hey! I'm using TradeRefer to manage my trade referrals. Join as a referrer and earn commissions when you send quality leads my way. Sign up here:\n${joinUrl}`;
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
        navigator.clipboard.writeText(shareCopy);
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
            <DialogContent className="left-0 top-0 z-50 h-dvh w-screen translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-none border-none bg-white p-0 shadow-none data-[state=closed]:slide-out-to-left-0 data-[state=closed]:slide-out-to-top-0 data-[state=open]:slide-in-from-left-0 data-[state=open]:slide-in-from-top-0 sm:left-[50%] sm:top-[50%] sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:gap-4 sm:overflow-hidden sm:rounded-[32px] sm:shadow-2xl sm:data-[state=closed]:slide-out-to-left-1/2 sm:data-[state=closed]:slide-out-to-top-[48%] sm:data-[state=open]:slide-in-from-left-1/2 sm:data-[state=open]:slide-in-from-top-[48%]">
                <div className="flex h-full flex-col sm:max-h-[90vh]">
                    <div className="sticky top-0 z-10 border-b border-zinc-100 bg-white px-5 py-4 sm:hidden">
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Invite Referrers</p>
                                <p className="mt-1 text-[15px] font-bold text-zinc-900 truncate">{businessName}</p>
                            </div>
                            <DialogClose className="flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 text-zinc-500">
                                <X className="h-5 w-5" />
                                <span className="sr-only">Close</span>
                            </DialogClose>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-8 md:px-10">
                        <DialogHeader className="hidden sm:block">
                            <div className="mb-4 flex items-center gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-100 md:h-14 md:w-14">
                                    <Users className="h-6 w-6 text-orange-600 md:h-7 md:w-7" />
                                </div>
                                <div>
                                    <DialogTitle className="mb-1 font-display text-2xl font-black leading-none text-zinc-900 md:text-3xl">
                                        Invite Referrers
                                    </DialogTitle>
                                    <DialogDescription className="text-base font-medium leading-tight text-zinc-500 md:text-lg">
                                        Grow your trusted referral network
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="space-y-3 sm:space-y-6">
                            <div className="rounded-[20px] bg-zinc-900 px-4 py-3 text-white sm:hidden">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
                                        <Share2 className="h-4 w-4 text-orange-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-[15px] font-black tracking-tight leading-tight">Invite Referrers</h2>
                                        <p className="text-[11px] font-medium text-zinc-400 truncate">Share your link or invite contacts directly</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 sm:space-y-3">
                                <label className="ml-1 block text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400 sm:text-xs">
                                    Your Unique Invite Link
                                </label>
                                <div className="rounded-[18px] sm:rounded-[24px] border border-zinc-100 bg-zinc-50 p-2.5 sm:p-3 sm:rounded-2xl">
                                    <div className="break-all rounded-[14px] sm:rounded-[18px] bg-white px-3 py-2 sm:px-4 sm:py-3 font-mono text-[12px] sm:text-[13px] font-bold leading-snug sm:leading-relaxed text-zinc-600 sm:text-sm">
                                        {joinUrl}
                                    </div>
                                    <div className="mt-2 sm:mt-3 grid grid-cols-2 gap-2 sm:grid-cols-2">
                                        <Button
                                            onClick={handleCopy}
                                            className="h-10 sm:h-12 rounded-xl sm:rounded-2xl bg-orange-600 text-[11px] sm:text-[13px] font-black uppercase tracking-widest text-white hover:bg-orange-700"
                                        >
                                            {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
                                            {copied ? "Copied" : "Copy Link"}
                                        </Button>
                                        <Button
                                            onClick={() => navigator.clipboard.writeText(shareCopy).then(() => toast.success("Invite message copied!"))}
                                            variant="outline"
                                            className="h-10 sm:h-12 rounded-xl sm:rounded-2xl border-zinc-200 bg-white text-[11px] sm:text-[13px] font-black uppercase tracking-widest text-zinc-900 hover:bg-zinc-50"
                                        >
                                            <Mail className="mr-1.5 h-3.5 w-3.5 text-orange-500" />
                                            Copy Message
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 sm:space-y-3">
                                <label className="ml-1 block text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400 sm:text-xs">
                                    Quick Share
                                </label>
                                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                                    <button onClick={() => shareSocial('facebook')} className="flex flex-col items-center justify-center gap-1.5 rounded-[16px] sm:rounded-[24px] border border-zinc-100 bg-zinc-50 p-3 sm:p-4 transition-all hover:border-blue-200 hover:bg-blue-50 group sm:min-h-[96px] md:p-6">
                                        <Facebook className="h-5 w-5 sm:h-6 sm:w-6 text-zinc-400 group-hover:text-blue-600 md:h-7 md:w-7" />
                                        <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-blue-600">FB</span>
                                    </button>
                                    <button onClick={() => shareSocial('twitter')} className="flex flex-col items-center justify-center gap-1.5 rounded-[16px] sm:rounded-[24px] border border-zinc-100 bg-zinc-50 p-3 sm:p-4 transition-all hover:border-sky-200 hover:bg-sky-50 group sm:min-h-[96px] sm:rounded-2xl md:p-6">
                                        <Twitter className="h-5 w-5 sm:h-6 sm:w-6 text-zinc-400 group-hover:text-sky-500 md:h-7 md:w-7" />
                                        <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-sky-500">X</span>
                                    </button>
                                    <button onClick={() => shareSocial('linkedin')} className="flex flex-col items-center justify-center gap-1.5 rounded-[16px] sm:rounded-[24px] border border-zinc-100 bg-zinc-50 p-3 sm:p-4 transition-all hover:border-blue-200 hover:bg-blue-50 group sm:min-h-[96px] sm:rounded-2xl md:p-6">
                                        <Linkedin className="h-5 w-5 sm:h-6 sm:w-6 text-zinc-400 group-hover:text-blue-700 md:h-7 md:w-7" />
                                        <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-blue-700">In</span>
                                    </button>
                                    <button onClick={() => shareSocial('whatsapp')} className="flex flex-col items-center justify-center gap-1.5 rounded-[16px] sm:rounded-[24px] border border-zinc-100 bg-zinc-50 p-3 sm:p-4 transition-all hover:border-green-200 hover:bg-green-50 group sm:min-h-[96px] sm:rounded-2xl md:p-6">
                                        <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 text-zinc-400 group-hover:text-green-600 md:h-7 md:w-7" />
                                        <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-green-600">WA</span>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 sm:space-y-3">
                                <label className="ml-1 block text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400 sm:text-xs">
                                    <Mail className="mr-1 inline h-3 w-3 text-orange-500" /> Invite via Email
                                </label>
                                <textarea
                                    value={emails}
                                    onChange={(e) => setEmails(e.target.value)}
                                    placeholder="Enter emails separated by commas..."
                                    rows={2}
                                    className="w-full resize-none rounded-[16px] sm:rounded-[24px] border border-zinc-100 bg-zinc-50 p-3 sm:p-5 text-[14px] sm:text-[16px] font-medium text-zinc-900 placeholder:text-zinc-300 focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/10 sm:text-lg"
                                />
                                <Button
                                    onClick={handleSendEmails}
                                    disabled={sending || !emails.trim()}
                                    className="h-11 sm:h-14 w-full rounded-[14px] sm:rounded-[20px] bg-zinc-900 text-[13px] sm:text-[15px] font-black text-white shadow-xl shadow-zinc-200 hover:bg-black sm:h-16 sm:rounded-full sm:text-xl"
                                >
                                    {sending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-3 h-5 w-5" />}
                                    Send Invites
                                </Button>
                            </div>
                        </div>

                        <p className="mx-auto mt-4 sm:mt-6 max-w-[320px] text-center text-[11px] sm:text-[13px] font-medium leading-relaxed text-zinc-400 sm:mt-8 sm:text-sm">
                            Referrers who sign up via your link are automatically connected to your business.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
