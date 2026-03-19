"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, Building2, FileText, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { SupplierDeclarationModal } from "./SupplierDeclarationModal";

interface ComplianceData {
    has_abn: boolean;
    has_supplier_statement: boolean;
    can_claim_over_75: boolean;
    abn: string | null;
    declared_at: string | null;
}

export function TaxDetailsSection() {
    const [compliance, setCompliance] = useState<ComplianceData | null>(null);
    const [expanded, setExpanded] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const { getToken } = useAuth();
    const apiUrl = "/api/backend";

    const fetchCompliance = async () => {
        try {
            const token = await getToken();
            const res = await fetch(`${apiUrl}/referrer/compliance-status`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) setCompliance(await res.json());
        } catch {}
    };

    useEffect(() => { fetchCompliance(); }, []);

    const handleDelete = async () => {
        if (!confirm("Remove your tax declaration? You'll need to complete it again for payouts over $74.99.")) return;
        setDeleting(true);
        try {
            const token = await getToken();
            await fetch(`${apiUrl}/referrer/supplier-statement`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Declaration removed");
            fetchCompliance();
        } catch {
            toast.error("Failed to remove");
        }
        setDeleting(false);
    };

    const handleModalComplete = () => {
        setShowModal(false);
        fetchCompliance();
        toast.success("Tax details saved!");
    };

    if (!compliance) return null;

    const hasAnything = compliance.has_abn || compliance.has_supplier_statement;

    return (
        <div className="space-y-2">
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center justify-between w-full text-left"
            >
                <label className="block font-bold text-zinc-600 text-xs cursor-pointer">
                    Tax Details
                </label>
                {expanded ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
            </button>

            {/* Summary line always visible */}
            <div className={`flex items-center gap-2 text-sm font-bold ${hasAnything ? "text-green-600" : "text-zinc-400"}`}>
                <ShieldCheck className="w-4 h-4" />
                <span>
                    {compliance.has_abn
                        ? `ABN on file (${compliance.abn})`
                        : compliance.has_supplier_statement
                        ? `Declaration on file (${compliance.declared_at ? new Date(compliance.declared_at).toLocaleDateString("en-AU") : ""})`
                        : "Not required for claims under $75"}
                </span>
            </div>

            {expanded && (
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-4">
                    <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                        Australian tax law requires an ABN or declaration for payouts over $75.
                        Claims under $74.99 don't need this. Add your ABN to unlock $300 claims.
                    </p>

                    {hasAnything ? (
                        <div className="space-y-3">
                            {compliance.has_abn && (
                                <div className="flex items-center gap-3 bg-white border border-zinc-100 rounded-xl p-3">
                                    <Building2 className="w-5 h-5 text-blue-500" />
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-zinc-700">ABN</p>
                                        <p className="text-sm font-black text-zinc-900">{compliance.abn}</p>
                                    </div>
                                </div>
                            )}
                            {compliance.has_supplier_statement && (
                                <div className="flex items-center gap-3 bg-white border border-zinc-100 rounded-xl p-3">
                                    <FileText className="w-5 h-5 text-green-500" />
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-zinc-700">Supplier Declaration</p>
                                        <p className="text-sm font-medium text-zinc-600">
                                            Completed {compliance.declared_at ? new Date(compliance.declared_at).toLocaleDateString("en-AU") : ""}
                                        </p>
                                    </div>
                                </div>
                            )}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="flex-1 text-xs font-bold text-blue-600 hover:text-blue-700 py-2 px-3 bg-blue-50 rounded-lg transition-colors"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="flex items-center justify-center gap-1 text-xs font-bold text-red-500 hover:text-red-600 py-2 px-3 bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    <Trash2 className="w-3 h-3" /> Remove
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowModal(true)}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all"
                        >
                            Add ABN or Declaration
                        </button>
                    )}
                </div>
            )}

            {showModal && (
                <SupplierDeclarationModal
                    onClose={() => setShowModal(false)}
                    onComplete={handleModalComplete}
                />
            )}
        </div>
    );
}
