"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function BusinessDelistDialog({
    businessId,
    businessName
}: {
    businessId: string;
    businessName: string;
}) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        requester_name: "",
        requester_email: "",
        reason: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const res = await fetch(`${apiUrl}/business/${businessId}/delist`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error("Failed to submit delisting request");

            setSubmitted(true);
            toast.success("Removal request submitted.");
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
                    <button className="text-xs text-zinc-400 hover:text-zinc-600 underline">
                        Request Removal
                    </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <div className="py-12 text-center">
                        <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-8 h-8 text-zinc-600" />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 mb-2">Request Received</h3>
                        <p className="text-zinc-600">
                            We've received your request to remove <strong>{businessName}</strong> from our directory. We will verify the request and process it within 48 hours.
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
                <button className="text-xs text-zinc-400 hover:text-zinc-600 underline">
                    Request Removal
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Trash2 className="w-5 h-5 text-red-500" />
                            Remove {businessName}
                        </DialogTitle>
                        <DialogDescription>
                            Are you the owner or representative of this business? Use this form to request removal from our trade directory.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-6">
                        <div className="space-y-2">
                            <Label htmlFor="req_name">Your Name</Label>
                            <Input
                                id="req_name"
                                placeholder="Full Name"
                                value={formData.requester_name}
                                onChange={(e) => setFormData({ ...formData, requester_name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="req_email">Your Work Email</Label>
                            <Input
                                id="req_email"
                                type="email"
                                placeholder="email@business.com"
                                value={formData.requester_email}
                                onChange={(e) => setFormData({ ...formData, requester_email: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reason">Reason for Removal</Label>
                            <Textarea
                                id="reason"
                                placeholder="e.g. Business closed, I did not authorize this listing, etc."
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                required
                                className="min-h-[100px]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={loading}
                            variant="destructive"
                            className="w-full rounded-full font-bold"
                        >
                            {loading ? "Submitting..." : "Submit Removal Request"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
