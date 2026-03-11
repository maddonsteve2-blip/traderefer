"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { BusinessInviteDialog } from "@/components/business/BusinessInviteDialog";
import { ReferralRewardsCard } from "@/components/shared/ReferralRewardsCard";

const API = "/api/backend";

interface Progress {
    active_invitees: number;
    rewards_issued: number;
    next_milestone: number;
    progress_in_current: number;
    milestone_size: number;
    reward_amount_dollars: number;
}

export function BusinessReferralProgress() {
    const { getToken } = useAuth();
    const [progress, setProgress] = useState<Progress | null>(null);
    const [showInvite, setShowInvite] = useState(false);

    useEffect(() => {
        getToken().then(token => {
            fetch(`${API}/business/invitations/progress`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(r => r.ok ? r.json() : null)
                .then(data => { if (data) setProgress(data); })
                .catch(() => {});
        });
    }, []);

    if (!progress) return null;

    const { active_invitees, progress_in_current, milestone_size, rewards_issued, reward_amount_dollars } = progress;

    return (
        <>
            <ReferralRewardsCard
                rewardAmountDollars={reward_amount_dollars}
                progressToNext={progress_in_current}
                milestoneSize={milestone_size}
                activeInvitees={active_invitees}
                milestonesCompleted={rewards_issued}
                onInvite={() => setShowInvite(true)}
                onView={() => setShowInvite(true)}
            />

            <BusinessInviteDialog open={showInvite} onOpenChange={setShowInvite} />
        </>
    );
}
