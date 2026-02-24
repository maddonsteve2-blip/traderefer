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
};

export function NotificationBell() {
    const { getToken, isSignedIn } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
                    setUnreadCount(data.count);
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
            if (res.ok) setNotifications(await res.json());
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
            setUnreadCount(prev => Math.max(0, prev - 1));
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch {}
    };

    if (!isSignedIn) return null;

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={handleOpen}
                className="relative p-2 text-zinc-500 hover:text-zinc-900 transition-colors"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-zinc-200 z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
                        <h3 className="font-bold text-zinc-900">Notifications</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="text-xs font-bold text-orange-500 hover:text-orange-600"
                                >
                                    Mark all read
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell className="w-8 h-8 text-zinc-200 mx-auto mb-2" />
                                <p className="text-sm text-zinc-400">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    className={`px-4 py-3 border-b border-zinc-50 hover:bg-zinc-50 transition-colors cursor-pointer ${
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
                                    <div className="flex items-start gap-3">
                                        <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                                            !n.is_read ? (TYPE_COLORS[n.type] || "bg-zinc-400") : "bg-transparent"
                                        }`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-zinc-900 leading-tight">{n.title}</div>
                                            {n.body && (
                                                <p className="text-sm text-zinc-500 mt-0.5 line-clamp-2">{n.body}</p>
                                            )}
                                            <div className="text-xs text-zinc-400 mt-1">{timeAgo(n.created_at)}</div>
                                        </div>
                                        {n.link && <ExternalLink className="w-3.5 h-3.5 text-zinc-300 shrink-0 mt-1" />}
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
