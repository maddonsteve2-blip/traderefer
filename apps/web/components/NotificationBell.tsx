"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { Bell, Check, ExternalLink, X } from "lucide-react";
import Link from "next/link";

interface Notification {
    id: string;
    type: string;
    title: string;
    body: string | null;
    link: string | null;
    is_read: boolean;
    created_at: string;
}

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

const TYPE_COLORS: Record<string, string> = {
    lead_accepted: "bg-green-500",
    tier_unlock: "bg-purple-500",
    new_campaign: "bg-orange-500",
    fee_change: "bg-blue-500",
    new_business: "bg-emerald-500",
    nudge: "bg-amber-500",
    general: "bg-zinc-500",
    new_application: "bg-blue-500",
    application_approved: "bg-green-500",
    application_rejected: "bg-red-500",
    application_expired: "bg-zinc-500",
    application_reminder: "bg-amber-500",
    new_message: "bg-orange-500",
};

export function NotificationBell() {
    const { getToken, isSignedIn } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    const lastCountRef = useRef(0);
    const ref = useRef<HTMLDivElement>(null);

    const apiUrl = "/api/backend";

    useEffect(() => {
        if (!isSignedIn) return;
        const fetchCount = async () => {
            try {
                const token = await getToken();
                const res = await fetch(`${apiUrl}/api/notifications/unread-count`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    const newCount = data.count;
                    
                    if (newCount > lastCountRef.current) {
                        // To decide which sound to play, we need to know the type of the latest notification
                        const notifyRes = await fetch(`${apiUrl}/api/notifications?limit=1`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        if (notifyRes.ok) {
                            const latestArr = await notifyRes.json();
                            const latest = Array.isArray(latestArr) ? latestArr[0] : null;
                            
                            // Choose sound based on type
                            const soundFile = latest?.type === 'new_message' ? '/sounds/message.mp3' : '/sounds/notification.mp3';
                            
                            try {
                                const audio = new Audio(soundFile);
                                audio.play().catch(() => {});
                            } catch {}
                        }
                    }
                    
                    setUnreadCount(newCount);
                    lastCountRef.current = newCount;
                }
            } catch {}
        };
        fetchCount();
        const interval = setInterval(fetchCount, 30000);
        return () => clearInterval(interval);
    }, [isSignedIn, getToken, apiUrl]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = await getToken();
            const res = await fetch(`${apiUrl}/api/notifications`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                const safeData = Array.isArray(data) ? data : [];
                setNotifications(safeData);
                if (safeData.length > 0) {
                    lastCountRef.current = safeData.filter((n: any) => !n.is_read).length;
                }
            }
        } catch {}
    };

    const handleOpen = () => {
        if (!open) fetchNotifications();
        setOpen(!open);
    };

    const markAllRead = async () => {
        try {
            const token = await getToken();
            await fetch(`${apiUrl}/api/notifications/read-all`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
            });
            setUnreadCount(0);
            lastCountRef.current = 0;
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch {}
    };

    const markRead = async (id: string) => {
        try {
            const token = await getToken();
            await fetch(`${apiUrl}/api/notifications/${id}/read`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
            });
            setUnreadCount(prev => {
                const next = Math.max(0, prev - 1);
                lastCountRef.current = next;
                return next;
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch {}
    };

    if (!isSignedIn) return null;

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={handleOpen}
                className="relative p-2.5 text-zinc-500 hover:text-zinc-900 transition-all active:scale-95"
                aria-label="Notifications"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 w-5 h-5 bg-indigo-600 text-white font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm text-[10px]">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-zinc-200 z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
                        <h3 className="font-black text-zinc-900" style={{ fontSize: '18px' }}>Notifications</h3>
                        <div className="flex items-center gap-3">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="font-black text-orange-600 hover:text-orange-700 underline underline-offset-4"
                                    style={{ fontSize: '14px' }}
                                >
                                    Mark all read
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Bell className="w-8 h-8 text-zinc-200" />
                                </div>
                                <p className="font-bold text-zinc-400" style={{ fontSize: '17px' }}>No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    className={`px-5 py-4 border-b border-zinc-50 hover:bg-zinc-50 transition-colors cursor-pointer ${
                                        !n.is_read ? "bg-orange-50/50" : ""
                                    }`}
                                    onClick={() => {
                                        if (!n.is_read) markRead(n.id);
                                        if (n.link) {
                                            setOpen(false);
                                            window.location.href = n.link;
                                        }
                                    }}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`w-2.5 h-2.5 rounded-full mt-2.5 shrink-0 ${
                                            !n.is_read ? (TYPE_COLORS[n.type] || "bg-zinc-400") : "bg-transparent"
                                        }`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-black text-zinc-900 leading-tight" style={{ fontSize: '16px' }}>{n.title}</div>
                                            {n.body && (
                                                <p className="text-zinc-500 font-bold mt-1 line-clamp-2" style={{ fontSize: '15px' }}>{n.body}</p>
                                            )}
                                            <div className="text-zinc-400 font-bold mt-1.5" style={{ fontSize: '13px' }}>{timeAgo(n.created_at)}</div>
                                        </div>
                                        {n.link && <ExternalLink className="w-4 h-4 text-zinc-300 shrink-0 mt-1" />}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
