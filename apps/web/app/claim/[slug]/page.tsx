"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { AlertCircle, ArrowRight, CheckCircle2, ChevronLeft, Loader2, Mail, Phone, RefreshCcw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

type Business = {
    id: string;
    slug: string;
    business_name: string;
    business_phone?: string | null;
    business_email?: string | null;
    address?: string | null;
    suburb?: string | null;
    state?: string | null;
    is_claimed?: boolean | null;
    claim_status?: string | null;
};

type VerificationMethod = "phone" | "email";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function maskEmail(value: string) {
    const [local, domain] = value.split("@");
    if (!local || !domain) return value;
    if (local.length <= 2) return `${local[0] || ""}***@${domain}`;
    return `${local.slice(0, 2)}***@${domain}`;
}

function maskPhone(value: string) {
    const digits = value.replace(/\D/g, "");
    if (digits.length < 4) return value;
    return `•••• ••• ${digits.slice(-3)}`;
}

function ClaimPageContent({ slug }: { slug: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [business, setBusiness] = useState<Business | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [method, setMethod] = useState<VerificationMethod | null>(null);
    const [code, setCode] = useState("");
    const [sending, setSending] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [codeSent, setCodeSent] = useState(false);
    const manualSubmitted = searchParams.get("manual") === "submitted";

    useEffect(() => {
        let ignore = false;
        const load = async () => {
            setLoading(true);
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
                    const hasPhone = !!data.business_phone;
                    const hasEmail = !!data.business_email;
                    if (hasPhone && !hasEmail) setMethod("phone");
                    if (!hasPhone && hasEmail) setMethod("email");
                }
            } catch (err) {
                if (!ignore) setError((err as Error).message || "Could not load this business");
            } finally {
                if (!ignore) setLoading(false);
            }
        };
        load();
        return () => {
            ignore = true;
        };
    }, [slug]);

    const availableMethods = useMemo(() => {
        if (!business) return [] as VerificationMethod[];
        const methods: VerificationMethod[] = [];
        if (business.business_phone) methods.push("phone");
        if (business.business_email) methods.push("email");
        return methods;
    }, [business]);

    const startVerification = async (selectedMethod: VerificationMethod) => {
        if (!business) return;
        setSending(true);
        setError(null);
        setCode("");
        try {
            const endpoint = selectedMethod === "phone"
                ? `${API}/business/${business.id}/claim/send-phone-otp`
                : `${API}/business/${business.id}/claim/send-email-code`;
            const res = await fetch(endpoint, { method: "POST" });
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.detail || "Could not send verification code");
            }
            setMethod(selectedMethod);
            setCodeSent(true);
            toast.success(selectedMethod === "phone" ? "Code sent to the business phone" : "Code sent to the business email");
        } catch (err) {
            const message = (err as Error).message || "Could not start verification";
            setError(message);
            toast.error(message);
        } finally {
            setSending(false);
        }
    };

    const handleVerify = async () => {
        if (!business || !method || code.trim().length < 6) return;
        setVerifying(true);
        setError(null);
        try {
            const endpoint = method === "phone"
                ? `${API}/business/${business.id}/claim/verify-phone-otp`
                : `${API}/business/${business.id}/claim/verify-email-code`;
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: code.trim() }),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok || !data?.claim_verification_token) {
                throw new Error(data?.detail || "Verification failed");
            }
            toast.success("Business verified. Continue to claim your profile.");
            router.push(`/onboarding/business?claim=${business.id}&slug=${business.slug}&claim_token=${encodeURIComponent(data.claim_verification_token)}`);
        } catch (err) {
            const message = (err as Error).message || "Verification failed";
            setError(message);
            toast.error(message);
        } finally {
            setVerifying(false);
        }
    };

    const manualHref = business
        ? `/contact/business-verification?businessId=${business.id}&slug=${business.slug}&businessName=${encodeURIComponent(business.business_name)}`
        : "/contact/business-verification";

    return (
        <main className="min-h-screen bg-zinc-50 py-10 px-4 md:px-6">
            <div className="max-w-5xl mx-auto">
                <header className="flex items-center justify-between mb-8">
                    <Link href="/">
                        <Logo size="sm" />
                    </Link>
                    <Link href={`/b/${slug}`} className="text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors inline-flex items-center gap-2">
                        <ChevronLeft className="w-4 h-4" /> Back to profile
                    </Link>
                </header>

                <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
                    <div className="bg-white rounded-[36px] border border-zinc-200 shadow-xl shadow-zinc-200/40 p-8 md:p-10">
                        {loading ? (
                            <div className="py-20 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                            </div>
                        ) : error ? (
                            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 font-bold flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <div>
                                    <p>{error}</p>
                                    <Link href="/contact" className="inline-flex mt-3 text-red-700 underline underline-offset-4">Contact support</Link>
                                </div>
                            </div>
                        ) : business?.is_claimed ? (
                            <div className="space-y-6">
                                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
                                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black text-zinc-900 font-display tracking-tight">This business is already claimed</h1>
                                    <p className="mt-3 text-zinc-500 font-medium leading-relaxed">If you believe you should manage this profile, submit a manual verification request and our team will review your paperwork.</p>
                                </div>
                                <Link href={manualHref} className="inline-flex items-center gap-2 text-orange-600 font-black hover:underline">
                                    Start manual verification <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        ) : business ? (
                            <div className="space-y-8">
                                {manualSubmitted && (
                                    <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 shrink-0" /> Your paperwork has been submitted. Our team has been notified and will review your documents.
                                    </div>
                                )}
                                <div className="space-y-4">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-sm font-black uppercase tracking-widest">
                                        <ShieldCheck className="w-4 h-4" /> Business verification
                                    </div>
                                    <div>
                                        <h1 className="text-4xl font-black text-zinc-900 font-display tracking-tight">Claim {business.business_name}</h1>
                                        <p className="mt-3 text-lg text-zinc-500 font-medium leading-relaxed">
                                            Verify that you control this business contact point before you update the profile and start managing referrals.
                                        </p>
                                    </div>
                                </div>

                                {availableMethods.length === 0 ? (
                                    <div className="rounded-[28px] border border-zinc-200 bg-zinc-50 p-6 space-y-4">
                                        <h2 className="text-xl font-black text-zinc-900">No email or phone on file</h2>
                                        <p className="text-zinc-600 font-medium leading-relaxed">We can still verify your ownership manually. Submit one government photo ID and one business document showing the business name and address.</p>
                                        <Link href={manualHref} className="inline-flex items-center gap-2 text-orange-600 font-black hover:underline">
                                            Submit paperwork instead <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                ) : !codeSent ? (
                                    <div className="space-y-4">
                                        <h2 className="text-xl font-black text-zinc-900">{availableMethods.length > 1 ? "Choose how to verify" : "Start verification"}</h2>
                                        <div className="grid gap-4">
                                            {business.business_phone && availableMethods.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => startVerification("phone")}
                                                    disabled={sending}
                                                    className="text-left rounded-[28px] border border-zinc-200 bg-zinc-50 hover:bg-white hover:border-orange-300 transition-all p-6 flex items-start gap-4"
                                                >
                                                    <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center shrink-0">
                                                        <Phone className="w-5 h-5 text-orange-500" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-black text-zinc-900 text-lg">Verify by business phone</p>
                                                        <p className="text-zinc-500 font-medium mt-1">Send a 6-digit code to {maskPhone(business.business_phone)}</p>
                                                    </div>
                                                    {sending && method === "phone" ? <Loader2 className="w-5 h-5 animate-spin text-orange-500" /> : <ArrowRight className="w-5 h-5 text-zinc-400" />}
                                                </button>
                                            )}
                                            {business.business_email && availableMethods.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => startVerification("email")}
                                                    disabled={sending}
                                                    className="text-left rounded-[28px] border border-zinc-200 bg-zinc-50 hover:bg-white hover:border-orange-300 transition-all p-6 flex items-start gap-4"
                                                >
                                                    <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center shrink-0">
                                                        <Mail className="w-5 h-5 text-orange-500" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-black text-zinc-900 text-lg">Verify by business email</p>
                                                        <p className="text-zinc-500 font-medium mt-1">Send a 6-digit code to {maskEmail(business.business_email)}</p>
                                                    </div>
                                                    {sending && method === "email" ? <Loader2 className="w-5 h-5 animate-spin text-orange-500" /> : <ArrowRight className="w-5 h-5 text-zinc-400" />}
                                                </button>
                                            )}
                                            {availableMethods.length === 1 && method && (
                                                <div className="rounded-[28px] border border-zinc-200 bg-zinc-50 p-6 space-y-4">
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center shrink-0">
                                                            {method === "phone" ? <Phone className="w-5 h-5 text-orange-500" /> : <Mail className="w-5 h-5 text-orange-500" />}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-zinc-900 text-lg">{method === "phone" ? "Verify by business phone" : "Verify by business email"}</p>
                                                            <p className="text-zinc-500 font-medium mt-1">
                                                                {method === "phone" && business.business_phone ? `We’ll send a code to ${maskPhone(business.business_phone)}.` : null}
                                                                {method === "email" && business.business_email ? `We’ll send a code to ${maskEmail(business.business_email)}.` : null}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        onClick={() => startVerification(method)}
                                                        disabled={sending}
                                                        className="h-14 px-6 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black"
                                                    >
                                                        {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send verification code"}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <h2 className="text-xl font-black text-zinc-900">Enter your 6-digit code</h2>
                                                <p className="text-zinc-500 font-medium mt-1">
                                                    {method === "phone" && business.business_phone ? `We sent a code to ${maskPhone(business.business_phone)}.` : null}
                                                    {method === "email" && business.business_email ? `We sent a code to ${maskEmail(business.business_email)}.` : null}
                                                </p>
                                            </div>
                                            {availableMethods.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setCodeSent(false);
                                                        setMethod(null);
                                                        setCode("");
                                                        setError(null);
                                                    }}
                                                    className="text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors"
                                                >
                                                    Change method
                                                </button>
                                            )}
                                        </div>

                                        {error && (
                                            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                                            </div>
                                        )}

                                        <div className="flex gap-3">
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={6}
                                                value={code}
                                                onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                                                placeholder="6-digit code"
                                                className="flex-1 h-16 px-6 rounded-2xl border border-zinc-200 bg-zinc-50 text-lg font-black tracking-[0.35em] placeholder:tracking-normal focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500"
                                            />
                                            <Button onClick={handleVerify} disabled={verifying || code.length < 6} className="h-16 px-8 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black">
                                                {verifying ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify"}
                                            </Button>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-zinc-500">
                                            <button type="button" onClick={() => method && startVerification(method)} disabled={sending} className="inline-flex items-center gap-2 hover:text-zinc-900 transition-colors">
                                                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />} Resend code
                                            </button>
                                            <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full" />
                                            <Link href={manualHref} className="hover:text-zinc-900 transition-colors">Having trouble? Submit paperwork</Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>

                    <aside className="space-y-6">
                        <div className="bg-zinc-900 text-white rounded-[32px] p-8">
                            <h2 className="text-xl font-black font-display">What you’ll need</h2>
                            <div className="mt-5 space-y-4 text-sm font-medium text-zinc-300">
                                <div>
                                    <p className="font-black text-white">Instant verification</p>
                                    <p className="mt-1">Use the business email or business phone already listed on this profile.</p>
                                </div>
                                <div>
                                    <p className="font-black text-white">Manual fallback</p>
                                    <p className="mt-1">Submit one government photo ID and one business document if you can’t access the listed contact points.</p>
                                </div>
                                <div>
                                    <p className="font-black text-white">After verification</p>
                                    <p className="mt-1">You’ll continue straight into profile setup to review details and start managing the listing.</p>
                                </div>
                            </div>
                        </div>

                        {business && (
                            <div className="bg-white rounded-[32px] border border-zinc-200 p-8 shadow-lg shadow-zinc-200/30">
                                <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Business on file</p>
                                <h3 className="mt-3 text-2xl font-black text-zinc-900">{business.business_name}</h3>
                                <div className="mt-4 space-y-2 text-sm font-medium text-zinc-600">
                                    {business.address && <p>{business.address}</p>}
                                    {!business.address && business.suburb && <p>{business.suburb}{business.state ? `, ${business.state}` : ""}</p>}
                                    {business.business_phone && <p>Phone: {maskPhone(business.business_phone)}</p>}
                                    {business.business_email && <p>Email: {maskEmail(business.business_email)}</p>}
                                </div>
                            </div>
                        )}
                    </aside>
                </div>
            </div>
        </main>
    );
}

function ClaimSlugPageContent() {
    const { slug } = useParams<{ slug: string }>();

    if (!slug) {
        return <main className="min-h-screen bg-zinc-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></main>;
    }

    return <ClaimPageContent slug={slug} />;
}

export default function ClaimSlugPage() {
    return (
        <Suspense fallback={<main className="min-h-screen bg-zinc-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></main>}>
            <ClaimSlugPageContent />
        </Suspense>
    );
}
