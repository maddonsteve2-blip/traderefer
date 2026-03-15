'use client';

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState } from 'react';
import { MessagesView } from '@/components/dashboard/MessagesView';
import { MobileBusinessMessages } from '@/components/business/MobileBusinessMessages';
import { useAuth } from '@clerk/nextjs';
import { Megaphone, Send, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { PageTransition } from '@/components/ui/PageTransition';

function BroadcastBar() {
    const { getToken } = useAuth();
    const [open, setOpen] = useState(false);
    const [msg, setMsg] = useState('');
    const [sending, setSending] = useState(false);

    const send = async () => {
        if (!msg.trim()) return;
        setSending(true);
        try {
            const token = await getToken();
            const res = await fetch('/api/backend/business/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ message: msg }),
            });
            if (res.ok) {
                toast.success('Broadcast sent to all connected referrers!');
                setMsg('');
                setOpen(false);
            } else {
                toast.error('Failed to send broadcast');
            }
        } catch {
            toast.error('Error sending broadcast');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="shrink-0 border-b border-zinc-200 bg-white">
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
                <div>
                    <h1 className="text-2xl font-black text-zinc-900">Messages</h1>
                    <p className="text-sm font-medium text-zinc-500 mt-0.5">Chat with referrers in your network.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setOpen(o => !o)}
                        className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-full px-4 py-2 text-sm transition-all shadow-sm shadow-orange-200"
                    >
                        <Megaphone className="w-3.5 h-3.5" /> Broadcast to all referrers
                        {open ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
                    </button>
                </div>
            </div>
            {open && (
                <div className="px-6 pb-4 space-y-2">
                    <p className="text-xs font-medium text-zinc-400">Send one message to <span className="text-zinc-600 font-bold">all connected referrers</span> at once — great for announcing new services, certifications, or seasonal availability.</p>
                    <div className="flex items-end gap-3">
                        <textarea
                            rows={2}
                            className="flex-1 bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-zinc-900 font-medium text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 outline-none resize-none"
                            placeholder="e.g. We just got certified for gas fitting — let your referrer network know!"
                            value={msg}
                            onChange={e => setMsg(e.target.value)}
                        />
                        <button
                            onClick={send}
                            disabled={sending || !msg.trim()}
                            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white font-black rounded-2xl px-5 py-3 text-sm transition-all shrink-0"
                        >
                            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Send
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function BusinessMessagesPage() {
    const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

    useEffect(() => {
        const update = () => setIsDesktop(window.innerWidth >= 1024);
        update();
        const mq = window.matchMedia('(min-width: 1024px)');
        mq.addEventListener('change', e => setIsDesktop(e.matches));
        return () => mq.removeEventListener('change', e => setIsDesktop(e.matches));
    }, []);

    if (isDesktop === null) {
        return (
            <div className="min-h-screen bg-zinc-50 p-6">
                <div className="space-y-3 max-w-3xl mx-auto pt-6">
                    <div className="h-7 w-32 bg-zinc-200 rounded-xl animate-pulse" />
                    <div className="h-14 bg-white rounded-2xl border border-zinc-200 animate-pulse" />
                    <div className="h-14 bg-white rounded-2xl border border-zinc-200 animate-pulse" />
                    <div className="h-14 bg-white rounded-2xl border border-zinc-200 animate-pulse" />
                </div>
            </div>
        );
    }

    if (!isDesktop) {
        return <MobileBusinessMessages />;
    }

    return (
        <PageTransition className="flex flex-col bg-zinc-50 h-screen overflow-hidden">
            <BroadcastBar />
            <div className="flex flex-1 min-h-0">
                <Suspense fallback={<div className="flex-1 p-6 space-y-3"><div className="h-14 bg-white rounded-2xl border border-zinc-200 animate-pulse" /><div className="h-14 bg-white rounded-2xl border border-zinc-200 animate-pulse" /><div className="h-14 bg-white rounded-2xl border border-zinc-200 animate-pulse" /></div>}>
                    <MessagesView role="business" />
                </Suspense>
            </div>
        </PageTransition>
    );
}
