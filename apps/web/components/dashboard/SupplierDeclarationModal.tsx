"use client";

import { useState } from "react";
import { X, ShieldCheck, Building2, User } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";

interface SupplierDeclarationModalProps {
    onClose: () => void;
    onComplete: () => void;
    referrerName?: string;
    referrerAddress?: { street?: string; suburb?: string; state?: string; postcode?: string };
}

const REASONS = [
    { value: "private", label: "I'm a private individual (not running a business)" },
    { value: "hobby", label: "This is a hobby, not a business" },
    { value: "not_enterprise", label: "I don't carry on an enterprise in Australia" },
];

export function SupplierDeclarationModal({ onClose, onComplete, referrerName, referrerAddress }: SupplierDeclarationModalProps) {
    const [mode, setMode] = useState<"abn" | "declaration">("declaration");
    const [abn, setAbn] = useState("");
    const [dob, setDob] = useState("");
    const [reason, setReason] = useState("");
    const [accepted, setAccepted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { getToken } = useAuth();

    const addressLine = referrerAddress
        ? [referrerAddress.street, referrerAddress.suburb, referrerAddress.state, referrerAddress.postcode].filter(Boolean).join(", ")
        : "";

    const handleSubmit = async () => {
        if (submitting) return;

        if (mode === "abn") {
            const clean = abn.replace(/\s/g, "");
            if (!clean || clean.length !== 11 || !/^\d+$/.test(clean)) {
                toast.error("Please enter a valid 11-digit ABN");
                return;
            }
        } else {
            if (!dob) { toast.error("Please enter your date of birth"); return; }
            if (!reason) { toast.error("Please select a reason"); return; }
            if (!accepted) { toast.error("You must accept the declaration"); return; }
        }

        setSubmitting(true);
        try {
            const token = await getToken();
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api/backend";
            const body = mode === "abn"
                ? { abn: abn.replace(/\s/g, "") }
                : { date_of_birth: dob, reason, declaration_accepted: accepted };

            const res = await fetch(`${apiUrl}/referrer/supplier-statement`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Failed to save");
            }

            onComplete();
        } catch (err: any) {
            toast.error(err.message || "Something went wrong");
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-blue-600" />
                        <h2 className="font-black text-zinc-900 text-lg">Tax Declaration</h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 transition-colors text-zinc-400 hover:text-zinc-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-5">
                    {/* Explainer */}
                    <p className="text-zinc-600 text-sm font-medium leading-relaxed">
                        Australian tax law requires either an ABN or a brief declaration for payouts over $75.
                        This takes about 10 seconds — most fields are pre-filled.
                    </p>

                    {/* Mode toggle */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setMode("abn")}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                                mode === "abn"
                                    ? "bg-zinc-900 text-white"
                                    : "bg-zinc-50 text-zinc-500 border border-zinc-200 hover:border-zinc-300"
                            }`}
                        >
                            <Building2 className="w-4 h-4" /> I have an ABN
                        </button>
                        <button
                            onClick={() => setMode("declaration")}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                                mode === "declaration"
                                    ? "bg-zinc-900 text-white"
                                    : "bg-zinc-50 text-zinc-500 border border-zinc-200 hover:border-zinc-300"
                            }`}
                        >
                            <User className="w-4 h-4" /> No ABN
                        </button>
                    </div>

                    {mode === "abn" ? (
                        /* ABN mode */
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                                    Australian Business Number (ABN)
                                </label>
                                <input
                                    type="text"
                                    value={abn}
                                    onChange={(e) => setAbn(e.target.value.replace(/[^\d\s]/g, ""))}
                                    placeholder="XX XXX XXX XXX"
                                    maxLength={14}
                                    className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                />
                                <p className="text-xs text-zinc-400 mt-1">11 digits. This unlocks claims up to $300.</p>
                            </div>
                        </div>
                    ) : (
                        /* Declaration mode */
                        <div className="space-y-4">
                            {/* Pre-filled fields (read-only) */}
                            {referrerName && (
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Full Name</label>
                                    <div className="px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl text-base font-medium text-zinc-700">
                                        {referrerName}
                                    </div>
                                </div>
                            )}
                            {addressLine && (
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Address</label>
                                    <div className="px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl text-base font-medium text-zinc-700">
                                        {addressLine}
                                    </div>
                                </div>
                            )}

                            {/* Date of birth */}
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                                    Date of Birth
                                </label>
                                <input
                                    type="date"
                                    value={dob}
                                    onChange={(e) => setDob(e.target.value)}
                                    max={new Date().toISOString().split("T")[0]}
                                    className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                />
                            </div>

                            {/* Reason */}
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                                    Reason for not quoting an ABN
                                </label>
                                <select
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                                >
                                    <option value="">Select a reason...</option>
                                    {REASONS.map((r) => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Declaration checkbox */}
                            <label className="flex items-start gap-3 p-4 bg-zinc-50 border border-zinc-200 rounded-xl cursor-pointer hover:bg-zinc-100 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={accepted}
                                    onChange={(e) => setAccepted(e.target.checked)}
                                    className="mt-1 w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-xs text-zinc-600 leading-relaxed">
                                    I declare that the information I have given is true and correct. I am not required to quote
                                    an ABN for this supply under the <em>A New Tax System (Australian Business Number) Act 1999</em>.
                                    I understand that giving false or misleading information is a serious offence.
                                </span>
                            </label>
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-base transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20 active:scale-[0.98]"
                    >
                        {submitting ? "Saving..." : mode === "abn" ? "Save ABN" : "Submit Declaration"}
                    </button>

                    <p className="text-center text-xs text-zinc-400 font-medium">
                        This information is stored securely and only used for ATO compliance purposes.
                    </p>
                </div>
            </div>
        </div>
    );
}
