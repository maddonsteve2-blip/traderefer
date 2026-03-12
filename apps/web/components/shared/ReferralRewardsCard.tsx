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
        <div className="bg-[#0F172A] rounded-2xl p-6 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute -right-6 -top-6 w-36 h-36 bg-orange-500/30 rounded-full" />
            <div className="absolute -right-2 -bottom-8 w-24 h-24 bg-orange-400/20 rounded-full" />
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                        <Gift className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white">Prezzee Rewards</h3>
                        <p className="text-zinc-400 font-medium text-lg">Earn $25 for every 5 active friends you invite.</p>
                    </div>
                </div>

                <div className="bg-white/5 rounded-2xl p-5 mb-5 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-zinc-400 font-bold uppercase tracking-widest" style={{ fontSize: 15 }}>Progress</span>
                        <span className="text-orange-400 font-black" style={{ fontSize: 18 }}>{progressToNext}/{milestoneSize}</span>
                    </div>
                    <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-1000"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                        <p className="text-zinc-500 font-bold uppercase tracking-widest mb-1" style={{ fontSize: 13 }}>Invited</p>
                        <p className="text-2xl font-black text-white">{activeInvitees}</p>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                        <p className="text-zinc-500 font-bold uppercase tracking-widest mb-1" style={{ fontSize: 13 }}>Earned</p>
                        <p className="text-2xl font-black text-orange-400">${milestonesCompleted * rewardAmountDollars}</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        onClick={onInvite}
                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-14 font-black text-xl active:scale-95 transition-all shadow-lg"
                    >
                        <Users className="w-5 h-5 mr-1.5" />
                        Invite Friends
                    </Button>
                    <Button
                        variant="outline"
                        className="border-zinc-600 text-white hover:bg-zinc-700 hover:text-white rounded-xl h-14 px-4 font-bold text-xl bg-white/5 active:scale-95 transition-all"
                        onClick={onView}
                    >
                        View <ChevronRight className="w-5 h-5 ml-1" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
