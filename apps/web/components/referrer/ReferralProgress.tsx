"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { InviteFriendsDialog } from "@/components/referrer/InviteFriendsDialog";
import { ReferralRewardsCard } from "@/components/shared/ReferralRewardsCard";

const API = "/api/backend";

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

    const { active_invitees, progress_to_next, milestones_completed, reward_amount_dollars } = progress;

    return (
        <>
            <ReferralRewardsCard
                rewardAmountDollars={reward_amount_dollars}
                progressToNext={progress_to_next}
                milestoneSize={5}
                activeInvitees={active_invitees}
                milestonesCompleted={milestones_completed}
                onInvite={() => setShowInvite(true)}
                onView={() => setShowInvite(true)}
            />

            <InviteFriendsDialog open={showInvite} onOpenChange={setShowInvite} />
        </>
    );
}
