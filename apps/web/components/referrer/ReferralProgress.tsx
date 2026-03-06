"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Gift, Users, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InviteFriendsDialog } from "@/components/referrer/InviteFriendsDialog";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Progress {
    active_invitees: number;
    milestones_completed: number;
    next_milestone_at: number;
    progress_to_next: number;
    rewards_earned: { milestone: number; reward_amount_cents: number; issued_at: string }[];
    reward_amount_dollars: number;
}

export function ReferralProgress() {
    const { getToken } = useAuth();
    const [progress, setProgress] = useState<Progress | null>(null);
    const [showInvite, setShowInvite] = useState(false);

    useEffect(() => {
        getToken().then(token => {
            fetch(`${API}/invitations/progress`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(r => r.ok ? r.json() : null)
                .then(data => { if (data) setProgress(data); })
                .catch(() => {});
        });
    }, []);

    if (!progress) return null;

    const { active_invitees, next_milestone_at, progress_to_next, milestones_completed, reward_amount_dollars } = progress;
    const pct = Math.min(100, (progress_to_next / 5) * 100);
    const remaining = 5 - progress_to_next;

    return (
        <>
            <div className="bg-[#0F172A] rounded-2xl p-5 text-white relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Gift className="w-4 h-4 text-orange-400" />
                                <span className="text-orange-400 text-base font-black uppercase tracking-widest">Friend Rewards</span>
                            </div>
                            <h3 className="text-xl font-black leading-snug text-white">
                                Invite 5 friends,<br />
                                <span className="text-orange-400">earn ${reward_amount_dollars}</span>
                            </h3>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-black text-white">{progress_to_next}<span className="text-zinc-300 text-xl font-bold">/5</span></p>
                            <p className="text-base text-zinc-300 font-bold">active</p>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-4">
                        <div className="h-3.5 bg-zinc-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-700"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-2">
                            <p className="text-base font-bold text-zinc-300">
                                {active_invitees > 0
                                    ? `${active_invitees} friend${active_invitees !== 1 ? "s" : ""} active`
                                    : "Invite your first friend!"}
                            </p>
                            <p className="text-base font-bold text-zinc-300">
                                {remaining > 0 ? `${remaining} more to go` : "🎉 Milestone reached!"}
                            </p>
                        </div>
                    </div>

                    {/* Past milestones */}
                    {milestones_completed > 0 && (
                        <div className="flex items-center gap-2 mb-4">
                            {Array.from({ length: milestones_completed }).map((_, i) => (
                                <div key={i} className="flex items-center gap-1 bg-orange-500/20 text-orange-300 text-xs font-bold px-2.5 py-1 rounded-full">
                                    <Star className="w-3 h-3 fill-orange-400 text-orange-400" />
                                    ${reward_amount_dollars} earned
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button
                            onClick={() => setShowInvite(true)}
                            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-11 font-black text-lg"
                        >
                            <Users className="w-4 h-4 mr-1.5" />
                            Invite Friends
                        </Button>
                        <Button
                            variant="outline"
                            className="border-zinc-600 text-white hover:bg-zinc-700 hover:text-white rounded-xl h-11 px-4 font-bold text-lg bg-white/5"
                            onClick={() => setShowInvite(true)}
                        >
                            View <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>
            </div>

            <InviteFriendsDialog open={showInvite} onOpenChange={setShowInvite} />
        </>
    );
}
