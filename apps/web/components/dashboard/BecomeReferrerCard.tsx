"use client";

import { Rocket, ArrowRight } from "lucide-react";
import { BecomeReferrerDialog } from "./BecomeReferrerDialog";

export function BecomeReferrerCard() {
    return (
        <BecomeReferrerDialog>
            <div className="group flex items-center justify-between p-6 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-2xl hover:border-orange-300 hover:shadow-md hover:shadow-orange-100 transition-all cursor-pointer">
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Rocket className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                        <p className="font-black text-zinc-900" style={{ fontSize: '16px' }}>Become a Referrer</p>
                        <p className="text-zinc-500 font-medium" style={{ fontSize: '14px' }}>
                            Earn referral fees from your existing network — at zero cost.
                        </p>
                    </div>
                </div>
                <ArrowRight className="w-5 h-5 text-orange-400 shrink-0 group-hover:translate-x-1 transition-transform" />
            </div>
        </BecomeReferrerDialog>
    );
}
