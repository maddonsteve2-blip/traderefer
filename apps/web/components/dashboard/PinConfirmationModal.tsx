"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

interface PinConfirmationModalProps {
    leadId: string;
    onConfirmed: () => void;
    onClose: () => void;
}

export function PinConfirmationModal({ leadId, onConfirmed, onClose }: PinConfirmationModalProps) {
    const [pin, setPin] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { getToken } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (pin.length !== 4) {
            setError("PIN must be 4 digits");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const token = await getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/leads/${leadId}/confirm-pin`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ pin })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Invalid PIN. Please try again.");
            }

            onConfirmed();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md rounded-[32px] border-none shadow-2xl">
                <DialogHeader>
                    <div className="w-16 h-16 bg-orange-100 rounded-3xl flex items-center justify-center mb-4 mx-auto">
                        <CheckCircle2 className="w-8 h-8 text-orange-600" />
                    </div>
                    <DialogTitle className="text-2xl font-black text-center text-zinc-900 font-display">
                        Confirm Job Completion
                    </DialogTitle>
                    <DialogDescription className="text-center text-zinc-500 font-medium">
                        Enter the 4-digit PIN provided by the customer to confirm the job is complete and release the referral payment.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="pin" className="block text-sm font-black text-zinc-400 uppercase tracking-widest mb-4">
                            4-Digit Customer PIN
                        </Label>
                        <Input
                            id="pin"
                            type="text"
                            inputMode="numeric"
                            maxLength={4}
                            placeholder="0000"
                            value={pin}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, "");
                                if (val.length <= 4) setPin(val);
                            }}
                            className="text-center text-4xl font-black tracking-[1em] h-20 rounded-2xl border-zinc-200 focus:border-orange-500 focus:ring-orange-500/20 transition-all font-display"
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-500 bg-red-50 p-4 rounded-xl text-sm font-bold border border-red-100 animate-in shake-in">
                            <XCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <DialogFooter className="sm:justify-center">
                        <Button
                            type="submit"
                            disabled={pin.length !== 4 || isSubmitting}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-full py-6 h-auto text-lg font-bold shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                "Confirm & Finish"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
