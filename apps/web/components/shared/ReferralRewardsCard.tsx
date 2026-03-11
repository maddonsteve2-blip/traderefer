import { Gift, Users, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReferralRewardsCardProps {
    rewardAmountDollars: number;
    progressToNext: number;
    milestoneSize: number;
    activeInvitees: number;
    milestonesCompleted: number;
    onInvite: () => void;
    onView: () => void;
}

export function ReferralRewardsCard({
    rewardAmountDollars,
    progressToNext,
    milestoneSize,
    activeInvitees,
    milestonesCompleted,
    onInvite,
    onView,
}: ReferralRewardsCardProps) {
    const pct = Math.min(100, (progressToNext / milestoneSize) * 100);
    const remaining = milestoneSize - progressToNext;

    return (
        <div className="bg-[#0F172A] rounded-2xl p-5 text-white relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-36 h-36 bg-orange-500/30 rounded-full" />
            <div className="absolute -right-2 -bottom-8 w-24 h-24 bg-orange-400/20 rounded-full" />
            <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Gift className="w-4 h-4 text-orange-400" />
                            <span className="text-orange-400 text-base font-black uppercase tracking-widest">Friend Rewards</span>
                        </div>
                        <h3 className="text-xl font-black leading-snug text-white">
                            Invite 5 friends,<br />
                            <span className="text-orange-400">earn ${rewardAmountDollars}</span>
                        </h3>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-black text-white">{progressToNext}<span className="text-zinc-300 text-xl font-bold">/{milestoneSize}</span></p>
                        <p className="text-base text-zinc-300 font-bold">active</p>
                    </div>
                </div>

                <div className="mb-4">
                    <div className="h-3.5 bg-zinc-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-700"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-2">
                        <p className="text-base font-bold text-zinc-300">
                            {activeInvitees > 0
                                ? `${activeInvitees} friend${activeInvitees !== 1 ? "s" : ""} active`
                                : "Invite your first friend!"}
                        </p>
                        <p className="text-base font-bold text-zinc-300">
                            {remaining > 0 ? `${remaining} more to go` : "🎉 Milestone reached!"}
                        </p>
                    </div>
                </div>

                {milestonesCompleted > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                        {Array.from({ length: milestonesCompleted }).map((_, i) => (
                            <div key={i} className="flex items-center gap-1 bg-orange-500/20 text-orange-300 text-xs font-bold px-2.5 py-1 rounded-full">
                                <Star className="w-3 h-3 fill-orange-400 text-orange-400" />
                                ${rewardAmountDollars} earned
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex gap-2">
                    <Button
                        onClick={onInvite}
                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-11 font-black text-lg"
                    >
                        <Users className="w-4 h-4 mr-1.5" />
                        Invite Friends
                    </Button>
                    <Button
                        variant="outline"
                        className="border-zinc-600 text-white hover:bg-zinc-700 hover:text-white rounded-xl h-11 px-4 font-bold text-lg bg-white/5"
                        onClick={onView}
                    >
                        View <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
