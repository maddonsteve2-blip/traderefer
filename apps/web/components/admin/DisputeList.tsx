"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShieldAlert, CheckCircle2 } from "lucide-react";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";

interface Dispute {
    id: string;
    business: string;
    reason: string;
    date: string;
    status: string;
}

export function DisputeList({ initialDisputes }: { initialDisputes: Dispute[] }) {
    const [disputes, setDisputes] = useState(initialDisputes);

    const [disputeToResolve, setDisputeToResolve] = useState<string | null>(null);

    const resolveDispute = () => {
        if (!disputeToResolve) return;
        setDisputes(prev => prev.filter(d => d.id !== disputeToResolve));
        setDisputeToResolve(null);
        // In real app, we would post to API
    };

    return (
        <div className="space-y-4">
            {disputes.map((dispute) => (
                <div key={dispute.id} className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100 flex items-center justify-between gap-6 hover:border-orange-200 transition-all group animate-in slide-in-from-left-2 duration-300">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-zinc-100">
                            <ShieldAlert className="w-5 h-5 text-zinc-400 group-hover:text-orange-500 transition-colors" />
                        </div>
                        <div>
                            <div className="text-base font-bold text-zinc-900">{dispute.business}</div>
                            <div className="text-sm text-orange-600 font-bold uppercase tracking-tighter">{dispute.reason}</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <div className="text-base font-bold text-zinc-400 uppercase tracking-widest">Received</div>
                            <div className="text-sm font-bold text-zinc-900">{dispute.date}</div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => setDisputeToResolve(dispute.id)}
                                size="sm"
                                className="bg-orange-600 text-white rounded-full hover:bg-orange-700 px-4 flex items-center gap-2"
                            >
                                <CheckCircle2 className="w-4 h-4" /> Resolve
                            </Button>
                        </div>
                    </div>
                </div>
            ))}
            {disputes.length === 0 && (
                <div className="text-center py-12 bg-zinc-50 rounded-3xl border border-dashed border-zinc-200">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h4 className="text-lg font-bold text-zinc-900">All caught up!</h4>
                    <p className="text-sm text-zinc-500">No open disputes requiring action.</p>
                </div>
            )}

            <ConfirmationDialog
                open={!!disputeToResolve}
                onOpenChange={(open) => !open && setDisputeToResolve(null)}
                onConfirm={resolveDispute}
                title="Resolve Dispute?"
                description="This will clear the dispute and notify the relevant parties. Are you sure you want to proceed?"
                confirmText="Resolve"
                cancelText="Cancel"
                variant="warning"
            />
        </div>
    );
}
