"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { Flame } from "lucide-react";
import { useLiveEvent } from "@/hooks/useLiveEvents";

interface FeedEvent { emoji: string; text: string; type: string; ts: string }

const TYPE_STYLES: Record<string, { bg: string; border: string; glow: string; text: string; dot: string }> = {
    prezzee:        { bg: "bg-gradient-to-r from-green-500/10 to-emerald-500/10", border: "border-green-400/40", glow: "shadow-green-500/10", text: "text-green-800", dot: "bg-green-500" },
    lead_confirmed: { bg: "bg-gradient-to-r from-amber-500/10 to-orange-500/10",  border: "border-amber-400/40",  glow: "shadow-amber-500/10",  text: "text-amber-800", dot: "bg-amber-500" },
    badge:          { bg: "bg-gradient-to-r from-violet-500/10 to-purple-500/10",  border: "border-violet-400/40", glow: "shadow-violet-500/10", text: "text-violet-800", dot: "bg-violet-500" },
    signup:         { bg: "bg-gradient-to-r from-sky-500/10 to-blue-500/10",       border: "border-sky-400/40",    glow: "shadow-sky-500/10",    text: "text-sky-800", dot: "bg-sky-500" },
    partnership:    { bg: "bg-gradient-to-r from-orange-500/10 to-red-500/10",     border: "border-orange-400/40", glow: "shadow-orange-500/10", text: "text-orange-800", dot: "bg-orange-500" },
};
const DEFAULT_STYLE = TYPE_STYLES.signup;

export function SocialProofTicker() {
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const [events, setEvents] = useState<FeedEvent[]>([]);
    const [idx, setIdx] = useState(0);
    const [fading, setFading] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!isLoaded || !isSignedIn) return;
        (async () => {
            try {
                const token = await getToken();
                const res = await fetch("/api/backend/badges/social-feed", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) return;
                const data = await res.json();
                if (data.events && data.events.length > 0) {
                    setEvents(data.events);
                    setIdx(0);
                }
            } catch { /* non-fatal */ }
        })();
    }, [isLoaded, isSignedIn, getToken]);

    // SSE: inject live events into the ticker as they happen
    const SSE_TYPE_MAP: Record<string, { emoji: string; textFn: (p: Record<string, unknown>) => string; type: string }> = {
        badge_earned:   { emoji: "🎖️", textFn: (p) => `A referrer just unlocked ${p.label || "a new badge"}!`, type: "badge" },
        earning_update: { emoji: "💰", textFn: () => "A referrer just got a lead confirmed and earned!", type: "lead_confirmed" },
        lead_new:       { emoji: "🚀", textFn: (p) => `A new lead just came in from ${p.suburb || "Australia"}!`, type: "signup" },
    };

    const injectEvent = useCallback((sseType: string, payload: Record<string, unknown>) => {
        const mapping = SSE_TYPE_MAP[sseType];
        if (!mapping) return;
        const newEvent: FeedEvent = {
            emoji: mapping.emoji,
            text: mapping.textFn(payload),
            type: mapping.type,
            ts: new Date().toISOString(),
        };
        setEvents(prev => [newEvent, ...prev].slice(0, 20));
        // Jump to the new event immediately
        setIdx(0);
    }, []);

    useLiveEvent("badge_earned", (e) => injectEvent("badge_earned", e.payload));
    useLiveEvent("earning_update", (e) => injectEvent("earning_update", e.payload));
    useLiveEvent("lead_new", (e) => injectEvent("lead_new", e.payload));

    useEffect(() => {
        if (events.length <= 1) return;
        intervalRef.current = setInterval(() => {
            setFading(true);
            setTimeout(() => {
                setIdx(i => (i + 1) % events.length);
                setFading(false);
            }, 400);
        }, 5000);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [events]);

    // No real data? Show nothing.
    if (events.length === 0) return null;

    const current = events[idx];
    const style = TYPE_STYLES[current.type] ?? DEFAULT_STYLE;

    return (
        <div className={`relative flex items-center gap-3 px-5 py-4 rounded-2xl border ${style.bg} ${style.border} shadow-lg ${style.glow} overflow-hidden`}>
            {/* Animated live dot */}
            <div className="relative shrink-0">
                <span className={`block w-2.5 h-2.5 rounded-full ${style.dot}`} />
                <span className={`absolute inset-0 w-2.5 h-2.5 rounded-full ${style.dot} animate-ping opacity-75`} />
            </div>

            {/* Live badge */}
            <span className="shrink-0 bg-white/80 border border-zinc-200/80 text-zinc-500 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md">
                Live
            </span>

            {/* Event text */}
            <p className={`text-sm font-bold ${style.text} leading-snug transition-all duration-400 ${fading ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"}`}>
                <span className="text-base mr-1">{current.emoji}</span>
                {current.text}
            </p>

            {/* Right side flame */}
            <Flame className="ml-auto shrink-0 w-5 h-5 text-orange-400 opacity-60" />
        </div>
    );
}
