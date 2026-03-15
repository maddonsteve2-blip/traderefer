"use client";

import { ChangeEvent, Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight, ChevronLeft, FileText, Loader2, Mail, ShieldCheck, UploadCloud } from "lucide-react";
import { toast } from "sonner";

type Business = {
    id: string;
    slug: string;
    business_name: string;
    address?: string | null;
    suburb?: string | null;
    state?: string | null;
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const ACCEPTED_TYPES = ".pdf,.png,.jpg,.jpeg,.webp";
const MAX_FILE_MB = 10;

function FilePicker({
    label,
    hint,
    required,
    file,
    onChange,
}: {
    label: string;
    hint: string;
    required?: boolean;
    file: File | null;
    onChange: (file: File | null) => void;
}) {
    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const nextFile = event.target.files?.[0] || null;
        onChange(nextFile);
    };

    return (
        <label className="block rounded-[28px] border border-dashed border-zinc-300 bg-zinc-50 hover:bg-white hover:border-orange-300 transition-all cursor-pointer p-6">
            <input type="file" accept={ACCEPTED_TYPES} className="hidden" onChange={handleFileChange} />
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center shrink-0">
                    <UploadCloud className="w-5 h-5 text-orange-500" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="font-black text-zinc-900 text-lg">
                        {label} {required ? <span className="text-orange-500">*</span> : null}
                    </p>
                    <p className="text-sm text-zinc-500 font-medium mt-1">{hint}</p>
                    <div className="mt-4 rounded-2xl bg-white border border-zinc-200 px-4 py-3 text-sm font-bold text-zinc-700 truncate">
                        {file ? file.name : "Choose file"}
                    </div>
                </div>
            </div>
        </label>
    );
}

function ManualBusinessVerificationContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialBusinessId = searchParams.get("businessId") || "";
    const slug = searchParams.get("slug") || "";
    const businessNameParam = searchParams.get("businessName") || "";

    const [business, setBusiness] = useState<Business | null>(
        initialBusinessId
            ? {
                id: initialBusinessId,
                slug,
                business_name: businessNameParam,
            }
            : null
    );
    const [loadingBusiness, setLoadingBusiness] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [claimerName, setClaimerName] = useState("");
    const [claimerEmail, setClaimerEmail] = useState("");
    const [claimerPhone, setClaimerPhone] = useState("");
    const [businessAddress, setBusinessAddress] = useState("");
    const [verificationReason, setVerificationReason] = useState("");
    const [governmentId, setGovernmentId] = useState<File | null>(null);
    const [businessDocument, setBusinessDocument] = useState<File | null>(null);
    const [supportingDocument, setSupportingDocument] = useState<File | null>(null);

    useEffect(() => {
        if (businessAddress || !business) return;
        const fallbackAddress = business.address || [business.suburb, business.state].filter(Boolean).join(", ");
        if (fallbackAddress) {
            setBusinessAddress(fallbackAddress);
        }
    }, [business, businessAddress]);

    useEffect(() => {
        if (initialBusinessId || !slug) return;
        let ignore = false;
        const loadBusiness = async () => {
            setLoadingBusiness(true);
            setError(null);
            try {
                const res = await fetch(`${API}/businesses/${slug}`);
                if (!res.ok) {
                    const data = await res.json().catch(() => null);
                    throw new Error(data?.detail || "Business not found");
                }
                const data = await res.json();
                if (!ignore) {
                    setBusiness(data);
                }
            } catch (err) {
                if (!ignore) {
                    setError((err as Error).message || "Could not load business details");
                }
            } finally {
                if (!ignore) {
                    setLoadingBusiness(false);
                }
            }
        };
        loadBusiness();
        return () => {
            ignore = true;
        };
    }, [initialBusinessId, slug]);

    const backHref = useMemo(() => {
        if (slug) return `/claim/${slug}`;
        if (business?.slug) return `/claim/${business.slug}`;
        return "/contact";
    }, [business?.slug, slug]);

    const validateFile = (file: File | null, label: string) => {
        if (!file) return `${label} is required`;
        const extension = file.name.split(".").pop()?.toLowerCase() || "";
        if (!["pdf", "png", "jpg", "jpeg", "webp"].includes(extension)) {
            return `${label} must be a PDF, PNG, JPG, JPEG, or WEBP file`;
        }
        if (file.size > MAX_FILE_MB * 1024 * 1024) {
            return `${label} must be ${MAX_FILE_MB}MB or smaller`;
        }
        return null;
    };

    const handleSubmit = async () => {
        const businessId = business?.id || initialBusinessId;
        if (!businessId) {
            toast.error("Missing business details. Please return to the claim page and try again.");
            return;
        }
        if (!claimerName.trim()) return toast.error("Your full name is required");
        if (!claimerEmail.trim()) return toast.error("Email is required");
        if (!businessAddress.trim()) return toast.error("Business address is required");
        if (!verificationReason.trim()) return toast.error("Tell us why you should manage this business");

        const governmentIdError = validateFile(governmentId, "Government photo ID");
        if (governmentIdError) return toast.error(governmentIdError);
        const businessDocumentError = validateFile(businessDocument, "Business document");
        if (businessDocumentError) return toast.error(businessDocumentError);
        const supportingDocumentError = supportingDocument ? validateFile(supportingDocument, "Supporting document") : null;
        if (supportingDocumentError) return toast.error(supportingDocumentError);

        setSubmitting(true);
        setError(null);

        try {
            const form = new FormData();
            form.append("claimer_name", claimerName.trim());
            form.append("claimer_email", claimerEmail.trim());
            if (claimerPhone.trim()) form.append("claimer_phone", claimerPhone.trim());
            form.append("business_address", businessAddress.trim());
            form.append("verification_reason", verificationReason.trim());
            form.append("government_id", governmentId as File);
            form.append("business_document", businessDocument as File);
            if (supportingDocument) form.append("supporting_document", supportingDocument);

            const res = await fetch(`${API}/business/${businessId}/claim/manual-review`, {
                method: "POST",
                body: form,
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) {
                throw new Error(data?.detail || "Could not submit manual verification");
            }

            toast.success("Manual verification submitted. Our team has been notified.");
            router.push(`/claim/${business?.slug || slug}?manual=submitted`);
        } catch (err) {
            const message = (err as Error).message || "Could not submit manual verification";
            setError(message);
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-zinc-50 py-10 px-4 md:px-6">
            <div className="max-w-6xl mx-auto">
                <header className="flex items-center justify-between mb-8">
                    <Link href="/">
                        <Logo size="sm" />
                    </Link>
                    <Link href={backHref} className="text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors inline-flex items-center gap-2">
                        <ChevronLeft className="w-4 h-4" /> Back
                    </Link>
                </header>

                <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-6 items-start">
                    <div className="bg-white rounded-[36px] border border-zinc-200 shadow-xl shadow-zinc-200/40 p-8 md:p-10 space-y-8">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-sm font-black uppercase tracking-widest">
                                <ShieldCheck className="w-4 h-4" /> Manual business verification
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-zinc-900 font-display tracking-tight">Upload your verification paperwork</h1>
                                <p className="mt-3 text-lg text-zinc-500 font-medium leading-relaxed">
                                    Submit one government photo ID and one business document. We’ll review your claim manually and email you once it’s been assessed.
                                </p>
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                            </div>
                        )}

                        <div className="grid md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-black text-zinc-400 uppercase tracking-widest mb-3">Your full name</label>
                                <input value={claimerName} onChange={(e) => setClaimerName(e.target.value)} className="w-full h-14 px-5 rounded-2xl border border-zinc-200 bg-zinc-50 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 font-medium" placeholder="Jane Smith" />
                            </div>
                            <div>
                                <label className="block text-sm font-black text-zinc-400 uppercase tracking-widest mb-3">Email address</label>
                                <input type="email" value={claimerEmail} onChange={(e) => setClaimerEmail(e.target.value)} className="w-full h-14 px-5 rounded-2xl border border-zinc-200 bg-zinc-50 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 font-medium" placeholder="jane@business.com.au" />
                            </div>
                            <div>
                                <label className="block text-sm font-black text-zinc-400 uppercase tracking-widest mb-3">Phone number</label>
                                <input value={claimerPhone} onChange={(e) => setClaimerPhone(e.target.value)} className="w-full h-14 px-5 rounded-2xl border border-zinc-200 bg-zinc-50 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 font-medium" placeholder="Optional" />
                            </div>
                            <div>
                                <label className="block text-sm font-black text-zinc-400 uppercase tracking-widest mb-3">Business address</label>
                                <input value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} className="w-full h-14 px-5 rounded-2xl border border-zinc-200 bg-zinc-50 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 font-medium" placeholder="Trading address" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-black text-zinc-400 uppercase tracking-widest mb-3">Why should you manage this business?</label>
                            <textarea
                                rows={5}
                                value={verificationReason}
                                onChange={(e) => setVerificationReason(e.target.value)}
                                className="w-full p-5 rounded-[24px] border border-zinc-200 bg-zinc-50 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 font-medium resize-none"
                                placeholder="Tell us your role, how you’re connected to the business, and anything else that helps our review team verify ownership."
                            />
                        </div>

                        <div className="space-y-4">
                            <FilePicker label="Government photo ID" hint="Driver licence, passport, or other government-issued photo ID. PDF or image, up to 10MB." required file={governmentId} onChange={setGovernmentId} />
                            <FilePicker label="Business document" hint="Utility bill, ABN document, registration extract, lease, or similar document showing the business name/address. PDF or image, up to 10MB." required file={businessDocument} onChange={setBusinessDocument} />
                            <FilePicker label="Supporting document" hint="Optional extra evidence if you have it, such as a council permit or company extract." file={supportingDocument} onChange={setSupportingDocument} />
                        </div>

                        <Button onClick={handleSubmit} disabled={submitting || loadingBusiness} className="w-full h-16 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-lg font-black shadow-xl shadow-orange-500/20">
                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit verification for review"}
                        </Button>
                    </div>

                    <aside className="space-y-6">
                        <div className="bg-zinc-900 text-white rounded-[32px] p-8">
                            <h2 className="text-xl font-black font-display">What happens next</h2>
                            <div className="mt-5 space-y-4 text-sm font-medium text-zinc-300">
                                <div>
                                    <p className="font-black text-white">1. Review queue</p>
                                    <p className="mt-1">Your submission is emailed to our internal admin team for review.</p>
                                </div>
                                <div>
                                    <p className="font-black text-white">2. Business checks</p>
                                    <p className="mt-1">We compare your documents against the business listing and any existing claim status.</p>
                                </div>
                                <div>
                                    <p className="font-black text-white">3. Claim follow-up</p>
                                    <p className="mt-1">If approved, we’ll tell you how to finish claiming and managing the profile.</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[32px] border border-zinc-200 p-8 shadow-lg shadow-zinc-200/30 space-y-4">
                            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Claim target</p>
                            {loadingBusiness ? (
                                <div className="py-8 flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                                </div>
                            ) : business ? (
                                <>
                                    <h3 className="text-2xl font-black text-zinc-900">{business.business_name || businessNameParam || "Selected business"}</h3>
                                    <p className="text-sm text-zinc-600 font-medium">{business.address || [business.suburb, business.state].filter(Boolean).join(", ") || "Address not provided"}</p>
                                    <Link href={business.slug ? `/b/${business.slug}` : "/contact"} className="inline-flex items-center gap-2 text-orange-600 font-black hover:underline">
                                        View public profile <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </>
                            ) : (
                                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800 text-sm font-bold flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    Open this page from a business claim flow so we can attach your submission to the correct business.
                                </div>
                            )}
                        </div>

                        <div className="bg-orange-50 border border-orange-200 rounded-[32px] p-8">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white border border-orange-200 flex items-center justify-center shrink-0">
                                    <FileText className="w-5 h-5 text-orange-500" />
                                </div>
                                <div>
                                    <p className="font-black text-zinc-900">Accepted files</p>
                                    <p className="mt-1 text-sm font-medium text-zinc-600">PDF, PNG, JPG, JPEG, and WEBP. Maximum {MAX_FILE_MB}MB per file.</p>
                                    <p className="mt-3 text-sm font-medium text-zinc-600 inline-flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-orange-500" /> Need help? Contact support@traderefer.au
                                    </p>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </main>
    );
}

export default function ManualBusinessVerificationPage() {
    return (
        <Suspense fallback={<main className="min-h-screen bg-zinc-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></main>}>
            <ManualBusinessVerificationContent />
        </Suspense>
    );
}
