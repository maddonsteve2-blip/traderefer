"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { ShieldCheck, TrendingUp, Briefcase, Star, Target, Users, Trophy, Crown, Award, ChevronRight, Medal } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const ICON_MAP: Record<string, React.ElementType> = {
    verified: ShieldCheck, first_link: TrendingUp, lead_generator: TrendingUp,
    networker: Briefcase, rising_star: Star, lead_champion: Target,
    power_networker: Users, top_performer: Trophy, elite: Crown,
};
const COLOR_MAP: Record<string, string> = {
    verified: "text-emerald-500", first_link: "text-sky-500", lead_generator: "text-blue-500",
    networker: "text-teal-500", rising_star: "text-indigo-500", lead_champion: "text-violet-500",
    power_networker: "text-green-500", top_performer: "text-orange-500", elite: "text-amber-500",
};
const BG_MAP: Record<string, string> = {
    verified: "bg-emerald-50 border-emerald-200", first_link: "bg-sky-50 border-sky-200",
    lead_generator: "bg-blue-50 border-blue-200", networker: "bg-teal-50 border-teal-200",
    rising_star: "bg-indigo-50 border-indigo-200", lead_champion: "bg-violet-50 border-violet-200",
    power_networker: "bg-green-50 border-green-200", top_performer: "bg-orange-50 border-orange-200",
    elite: "bg-amber-50 border-amber-200",
};

interface Badge { id: string; label: string; desc: string; earned: boolean; seen_in_app: boolean }

export function AchievementsWidget() {
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const [badges, setBadges] = useState<Badge[]>([]);
    const [newCount, setNewCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoaded || !isSignedIn) return;
        (async () => {
            try {
                const token = await getToken();
                const res = await fetch("/api/backend/badges/mine", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) return;
                const data = await res.json();
                setBadges(data.badges);
                setNewCount(data.new_count);
            } catch { /* non-fatal */ }
            finally { setLoading(false); }
        })();
    }, [isLoaded, isSignedIn, getToken]);

    if (loading) return null;

    const earned = badges.filter(b => b.earned);
    const nextBadge = badges.find(b => !b.earned);
    const total = badges.length;
    const pct = total > 0 ? Math.round((earned.length / total) * 100) : 0;

    return (
        <div className="bg-white rounded-[24px] border border-zinc-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Medal className="w-5 h-5 text-orange-500" />
                    <h3 className="font-black text-zinc-900 text-base">Achievements</h3>
                    {newCount > 0 && (
                        <span className="bg-orange-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                            {newCount} new
                        </span>
                    )}
                </div>
                <Link href="/dashboard/referrer/profile" className="text-orange-500 hover:text-orange-600">
                    <ChevronRight className="w-4 h-4" />
                </Link>
            </div>

            {/* Progress bar */}
            <div className="px-5 mb-4">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-zinc-500">{earned.length}/{total} badges earned</span>
                    <span className="text-xs font-black text-orange-500">{pct}%</span>
                </div>
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                    />
                </div>
            </div>

            {/* Earned badges grid */}
            {earned.length > 0 && (
                <div className="px-5 mb-3">
                    <div className="flex flex-wrap gap-1.5">
                        {earned.map(b => {
                            const Icon = ICON_MAP[b.id] ?? Medal;
                            const color = COLOR_MAP[b.id] ?? "text-zinc-500";
                            const bg = BG_MAP[b.id] ?? "bg-zinc-50 border-zinc-200";
                            return (
                                <span
                                    key={b.id}
                                    title={b.desc}
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border ${bg}`}
                                >
                                    <Icon className={`w-3 h-3 ${color}`} /> {b.label}
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Next badge to unlock */}
            {nextBadge && (
                <div className="mx-5 mb-5 bg-zinc-50 border border-dashed border-zinc-200 rounded-2xl px-4 py-3">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Next to unlock</p>
                    <div className="flex items-center gap-2">
                        {(() => {
                            const Icon = ICON_MAP[nextBadge.id] ?? Medal;
                            return <Icon className="w-4 h-4 text-zinc-400" />;
                        })()}
                        <div>
                            <p className="text-xs font-bold text-zinc-600">{nextBadge.label}</p>
                            <p className="text-[10px] text-zinc-400 font-medium">{nextBadge.desc}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
