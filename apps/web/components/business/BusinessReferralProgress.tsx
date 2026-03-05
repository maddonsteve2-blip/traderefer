"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Gift, Users, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Progress {
    active_invitees: number;
    rewards_issued: number;
    next_milestone: number;
    progress_in_current: number;
    milestone_size: number;
    reward_amount_dollars: number;
}

interface BusinessReferralProgressProps {
    onInviteClick?: () => void;
}

export function BusinessReferralProgress({ onInviteClick }: BusinessReferralProgressProps) {
    const { getToken } = useAuth();
    const [progress, setProgress] = useState<Progress | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const token = await getToken();
                const res = await fetch(`${API}/business/invitations/progress`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) return;
                const data = await res.json();
                if (!cancelled) setProgress(data);
            } catch {}
            finally { if (!cancelled) setLoading(false); }
        })();
        return () => { cancelled = true; };
    }, [getToken]);

    if (loading) {
        return (
            <div className="bg-white rounded-[28px] border border-zinc-100 p-8 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-300" />
            </div>
        );
    }

    if (!progress) return null;

    const { progress_in_current, milestone_size, reward_amount_dollars, rewards_issued, active_invitees } = progress;
    const pct = Math.round((progress_in_current / milestone_size) * 100);
    const remaining = milestone_size - progress_in_current;

    return (
        <div className="bg-white rounded-[28px] border border-zinc-100 p-8 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
                            <Gift className="w-4 h-4 text-orange-600" />
                        </div>
                        <h3 className="text-lg font-black text-zinc-900 font-display">Grow &amp; Earn</h3>
                    </div>
                    <p className="text-sm text-zinc-500 font-medium">
                        Invite {remaining > 0 ? `${remaining} more` : "more"} active member{remaining !== 1 ? "s" : ""} to earn a <strong className="text-zinc-700">${reward_amount_dollars} Prezzee gift card</strong>
                    </p>
                </div>
                {rewards_issued > 0 && (
                    <div className="text-right shrink-0">
                        <div className="text-2xl font-black text-orange-500">{rewards_issued}</div>
                        <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Earned</div>
                    </div>
                )}
            </div>

            {/* Progress bar */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Progress</span>
                    <span className="text-xs font-bold text-zinc-600">{progress_in_current} / {milestone_size} active</span>
                </div>
                <div className="h-3 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-700"
                        style={{ width: `${Math.max(pct, progress_in_current > 0 ? 4 : 0)}%` }}
                    />
                </div>
                <div className="flex justify-between mt-1.5">
                    <span className="text-xs text-zinc-400">{active_invitees} total active</span>
                    <span className="text-xs font-bold text-orange-500">${reward_amount_dollars} gift card at {milestone_size}</span>
                </div>
            </div>

            {/* Milestones */}
            <div className="flex gap-3 mb-6">
                {Array.from({ length: 3 }, (_, i) => {
                    const milestone = (rewards_issued + i + 1) * milestone_size;
                    const earned = i < rewards_issued;
                    const isCurrent = i === 0;
                    return (
                        <div
                            key={i}
                            className={`flex-1 p-3 rounded-2xl text-center border transition-all ${earned ? 'bg-green-50 border-green-200' : isCurrent ? 'bg-orange-50 border-orange-200' : 'bg-zinc-50 border-zinc-100'}`}
                        >
                            <div className={`text-lg font-black ${earned ? 'text-green-600' : isCurrent ? 'text-orange-500' : 'text-zinc-300'}`}>
                                {earned ? '✓' : `$${reward_amount_dollars}`}
                            </div>
                            <div className="text-xs font-bold text-zinc-400 mt-0.5">{milestone} active</div>
                        </div>
                    );
                })}
            </div>

            <Button
                onClick={onInviteClick}
                className="w-full bg-zinc-900 hover:bg-black text-white rounded-full h-11 font-bold shadow-md shadow-zinc-200 flex items-center justify-center gap-2"
            >
                <Users className="w-4 h-4" />
                Invite &amp; Earn
                <ChevronRight className="w-4 h-4" />
            </Button>
        </div>
    );
}
