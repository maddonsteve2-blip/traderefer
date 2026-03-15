"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { ShieldCheck, TrendingUp, Briefcase, Star, Target, Users, Trophy, Crown, Award, X } from "lucide-react";
import Link from "next/link";

const PREZZEE_CARD_GIF = "https://files.poweredbyprezzee.com/products/7af951a6-2a13-004b-f0eb-a87382a5b2e7/8eff8e56-2718-4514-8e1a-15ca1eb22793/Prezzee_3D_-_AU_%281%29_452_280.gif";

const BADGE_META: Record<string, { icon: React.ElementType; color: string; bg: string; border: string }> = {
    verified:        { icon: ShieldCheck, color: "text-emerald-400", bg: "bg-emerald-900/40", border: "border-emerald-500/40" },
    first_link:      { icon: TrendingUp,  color: "text-sky-400",     bg: "bg-sky-900/40",     border: "border-sky-500/40" },
    lead_generator:  { icon: TrendingUp,  color: "text-blue-400",    bg: "bg-blue-900/40",    border: "border-blue-500/40" },
    networker:       { icon: Briefcase,   color: "text-teal-400",    bg: "bg-teal-900/40",    border: "border-teal-500/40" },
    rising_star:     { icon: Star,        color: "text-indigo-400",  bg: "bg-indigo-900/40",  border: "border-indigo-500/40" },
    lead_champion:   { icon: Target,      color: "text-violet-400",  bg: "bg-violet-900/40",  border: "border-violet-500/40" },
    power_networker: { icon: Users,       color: "text-green-400",   bg: "bg-green-900/40",   border: "border-green-500/40" },
    top_performer:   { icon: Trophy,      color: "text-orange-400",  bg: "bg-orange-900/40",  border: "border-orange-500/40" },
    elite:           { icon: Crown,       color: "text-amber-400",   bg: "bg-amber-900/40",   border: "border-amber-500/40" },
};

const PREZZEE_BADGES = new Set(["lead_generator", "lead_champion", "top_performer", "elite"]);

interface Badge {
    id: string;
    label: string;
    desc: string;
    earned: boolean;
    seen_in_app: boolean;
}

const SESSION_KEY = "tr_badge_modal_shown";

export function BadgeUnlockModal() {
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const [newBadges, setNewBadges] = useState<Badge[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [visible, setVisible] = useState(false);

    const fetchAndShow = useCallback(async () => {
        if (!isSignedIn) return;
        // Only show once per browser session
        if (sessionStorage.getItem(SESSION_KEY)) return;

        try {
            const token = await getToken();
            const res = await fetch("/api/backend/badges/mine", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return;
            const data = await res.json();
            const unseen = (data.badges as Badge[]).filter(b => b.earned && !b.seen_in_app);
            if (unseen.length === 0) return;

            setNewBadges(unseen);
            setCurrentIdx(0);
            setVisible(true);
            sessionStorage.setItem(SESSION_KEY, "1");

            // Mark seen server-side
            await fetch("/api/backend/badges/seen", {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch {
            // non-fatal
        }
    }, [isSignedIn, getToken]);

    useEffect(() => {
        if (isLoaded) fetchAndShow();
    }, [isLoaded, fetchAndShow]);

    if (!visible || newBadges.length === 0) return null;

    const badge = newBadges[currentIdx];
    const meta = BADGE_META[badge.id] ?? BADGE_META["verified"];
    const Icon = meta.icon;
    const isPrezzeeWorthy = PREZZEE_BADGES.has(badge.id);
    const isLast = currentIdx === newBadges.length - 1;

    const handleNext = () => {
        if (!isLast) {
            setCurrentIdx(i => i + 1);
        } else {
            setVisible(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="relative bg-[#0F172A] rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-white/10">

                {/* Dismiss */}
                <button
                    onClick={() => setVisible(false)}
                    className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                    <X className="w-4 h-4 text-white/60" />
                </button>

                {/* Prezzee card for milestone badges */}
                {isPrezzeeWorthy && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={PREZZEE_CARD_GIF}
                        alt="Prezzee"
                        className="absolute -right-6 -top-6 w-36 opacity-80 pointer-events-none"
                    />
                )}

                {/* Pulse ring behind icon */}
                <div className="flex flex-col items-center pt-10 pb-2 px-6 relative z-10">
                    <div className="relative mb-4">
                        <div className={`w-24 h-24 rounded-3xl ${meta.bg} border-2 ${meta.border} flex items-center justify-center animate-pulse`}>
                            <Icon className={`w-12 h-12 ${meta.color}`} />
                        </div>
                    </div>

                    <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">Badge Unlocked</p>
                    <h2 className="text-white font-black text-2xl text-center mb-1">{badge.label}</h2>
                    <p className="text-zinc-400 text-sm text-center mb-6 font-medium">{badge.desc}</p>

                    {/* Progress dots if multiple */}
                    {newBadges.length > 1 && (
                        <div className="flex gap-1.5 mb-4">
                            {newBadges.map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1.5 rounded-full transition-all ${i === currentIdx ? "w-5 bg-orange-500" : "w-1.5 bg-white/20"}`}
                                />
                            ))}
                        </div>
                    )}

                    {/* CTAs */}
                    <div className="w-full space-y-2 pb-6">
                        <button
                            onClick={handleNext}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black h-12 text-base transition-all active:scale-95"
                        >
                            {isLast ? "View My Profile" : `Next Badge (${currentIdx + 2}/${newBadges.length})`}
                        </button>
                        {isLast && (
                            <Link
                                href="/dashboard/referrer/profile"
                                onClick={() => setVisible(false)}
                                className="block w-full text-center text-zinc-400 hover:text-white text-sm font-semibold py-2 transition-colors"
                            >
                                View on my profile →
                            </Link>
                        )}
                    </div>
                </div>

                {/* Bottom brand strip */}
                <div className="bg-white/5 border-t border-white/10 px-6 py-3 text-center">
                    <p className="text-zinc-500 text-xs font-medium">
                        Badges appear on your public referrer profile
                    </p>
                </div>
            </div>
        </div>
    );
}
