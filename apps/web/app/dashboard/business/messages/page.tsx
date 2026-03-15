'use client';

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState } from 'react';
import { MessagesView } from '@/components/dashboard/MessagesView';
import { MobileBusinessMessages } from '@/components/business/MobileBusinessMessages';
import { useAuth } from '@clerk/nextjs';
import { Megaphone, Send, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

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
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-6 py-3 hover:bg-zinc-50 transition-colors"
            >
                <span className="flex items-center gap-2 font-black text-zinc-700 text-sm uppercase tracking-widest">
                    <Megaphone className="w-4 h-4 text-orange-500" /> Broadcast to all referrers
                </span>
                {open ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
            </button>
            {open && (
                <div className="px-6 pb-4 flex items-end gap-3">
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
            <div className="flex items-center justify-center h-screen bg-zinc-50">
                <div className="w-10 h-10 border-[3px] border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!isDesktop) {
        return <MobileBusinessMessages />;
    }

    return (
        <div className="flex flex-col bg-zinc-50 h-screen overflow-hidden">
            <BroadcastBar />
            <div className="flex flex-1 min-h-0">
                <Suspense fallback={<div className="flex items-center justify-center h-[600px] w-full"><div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" /></div>}>
                    <MessagesView role="business" />
                </Suspense>
            </div>
        </div>
    );
}
