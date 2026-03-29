"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { BusinessInviteDialog } from "@/components/business/BusinessInviteDialog";
import { ReferralRewardsCard } from "@/components/shared/ReferralRewardsCard";

const API = "/api/backend";

interface Progress {
    active_invitees: number;
    total_invited: number;
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

    const fetchProgress = useCallback(() => {
        getToken().then(token => {
            fetch(`${API}/business/invitations/progress`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(r => r.ok ? r.json() : null)
                .then(data => { if (data) setProgress(data); })
                .catch(() => {});
        });
    }, [getToken]);

    useEffect(() => { fetchProgress(); }, [fetchProgress]);

    const handleDialogChange = useCallback((open: boolean) => {
        setShowInvite(open);
        if (!open) fetchProgress();
    }, [fetchProgress]);

    if (!progress) return null;

    const { active_invitees, total_invited, progress_in_current, milestone_size, rewards_issued, reward_amount_dollars } = progress;

    return (
        <>
            <ReferralRewardsCard
                rewardAmountDollars={reward_amount_dollars}
                progressToNext={progress_in_current}
                milestoneSize={milestone_size}
                activeInvitees={active_invitees}
                totalInvited={total_invited || 0}
                milestonesCompleted={rewards_issued}
                onInvite={() => setShowInvite(true)}
                onView={() => setShowInvite(true)}
            />

            <BusinessInviteDialog open={showInvite} onOpenChange={handleDialogChange} />
        </>
    );
}
