"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function BusinessClaimDialog({
    businessId,
    businessName
}: {
    businessId: string;
    businessName: string;
}) {
    const [mounted, setMounted] = useState(false);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        claimer_name: "",
        claimer_email: "",
        claimer_phone: "",
        proof_url: "",
    });

    useEffect(() => { setMounted(true); }, []);

    if (!mounted) {
        return (
            <Button className="bg-white text-orange-600 hover:bg-zinc-100 font-bold rounded-full px-6">
                Claim This Business
            </Button>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const res = await fetch(`${apiUrl}/business/${businessId}/claim`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error("Failed to submit claim request");

            setSubmitted(true);
            toast.success("Claim request submitted successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button className="bg-white text-orange-600 hover:bg-zinc-100 font-bold rounded-full px-6">
                        Claim This Business
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <div className="py-12 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 mb-2">Request Submitted</h3>
                        <p className="text-zinc-600">
                            We've received your claim request for <strong>{businessName}</strong>. Our team will verify your details and contact you via email shortly.
                        </p>
                        <Button onClick={() => setOpen(false)} className="mt-8 bg-zinc-900 hover:bg-black text-white px-8 rounded-full">
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-white text-orange-600 hover:bg-zinc-100 font-bold rounded-full px-6">
                    Claim This Business
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-orange-500" />
                            Claim {businessName}
                        </DialogTitle>
                        <DialogDescription>
                            Verify your ownership to manage this profile and start receiving referrals.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Your Name</Label>
                            <Input
                                id="name"
                                placeholder="Full Name"
                                value={formData.claimer_name}
                                onChange={(e) => setFormData({ ...formData, claimer_name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Business Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="email@business.com"
                                value={formData.claimer_email}
                                onChange={(e) => setFormData({ ...formData, claimer_email: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="0400 000 000"
                                value={formData.claimer_phone}
                                onChange={(e) => setFormData({ ...formData, claimer_phone: e.target.value })}
                            />
                        </div>
                        <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                            <p className="text-xs text-zinc-500 flex gap-2">
                                <AlertCircle className="w-4 h-4 text-zinc-400 shrink-0" />
                                Our team will verify your ABN and contact details before transferring ownership.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-full font-bold"
                        >
                            {loading ? "Submitting..." : "Submit Claim Request"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
