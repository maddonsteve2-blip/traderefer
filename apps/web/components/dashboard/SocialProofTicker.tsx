"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";

interface FeedEvent { text: string; badge_id: string; earned_at: string }

// Fallback events while loading or if no data
const FALLBACK_EVENTS: FeedEvent[] = [
    { text: "A referrer in Sydney just unlocked Lead Champion", badge_id: "lead_champion", earned_at: "" },
    { text: "A referrer in Melbourne just confirmed their 5th lead", badge_id: "lead_champion", earned_at: "" },
    { text: "A referrer in Brisbane just earned their first Prezzee reward", badge_id: "lead_generator", earned_at: "" },
    { text: "A referrer in Perth just became a Top Performer", badge_id: "top_performer", earned_at: "" },
];

export function SocialProofTicker() {
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const [events, setEvents] = useState<FeedEvent[]>(FALLBACK_EVENTS);
    const [idx, setIdx] = useState(0);
    const [fading, setFading] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Fetch real events
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
            } catch { /* non-fatal, keep fallbacks */ }
        })();
    }, [isLoaded, isSignedIn, getToken]);

    // Rotate every 4 seconds
    useEffect(() => {
        if (events.length <= 1) return;
        intervalRef.current = setInterval(() => {
            setFading(true);
            setTimeout(() => {
                setIdx(i => (i + 1) % events.length);
                setFading(false);
            }, 300);
        }, 4000);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [events]);

    const current = events[idx];
    if (!current) return null;

    return (
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-orange-50 border border-orange-100 rounded-2xl overflow-hidden">
            <div className="shrink-0 w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            </div>
            <p
                className={`text-xs font-semibold text-orange-700 leading-snug transition-opacity duration-300 ${fading ? "opacity-0" : "opacity-100"}`}
            >
                🎉 {current.text}
            </p>
        </div>
    );
}
