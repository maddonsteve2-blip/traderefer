"use client";

import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, ChevronRight, Phone, CheckCircle, Loader2, User, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { completeOnboarding } from "@/app/onboarding/_actions";
import posthog from "posthog-js";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const STEPS = ["Details", "Verify", "Address"];

// Inner component uses useSearchParams — must be inside Suspense
function ReferrerOnboardingInner() {
    const { getToken } = useAuth();
    const { user } = useUser();
    const router = useRouter();
    const searchParams = useSearchParams();
    const inviteCode = searchParams.get("invite") || "";

    const [step, setStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [otpCode, setOtpCode] = useState("");
    const [otpError, setOtpError] = useState("");

    const [phone, setPhone] = useState("");
    const [phoneError, setPhoneError] = useState("");

    const [address, setAddress] = useState({
        street: "",
        suburb: "",
        state: "VIC",
        postcode: ""
    });
    const [addressError, setAddressError] = useState("");
    const [isCheckingProfile, setIsCheckingProfile] = useState(true);

    // Auto-skip verification if already a verified business
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const token = await getToken();
                if (!token) {
                    setIsCheckingProfile(false);
                    return;
                }

                // Check roles
                const statusRes = await fetch(`${API}/auth/status`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!statusRes.ok) throw new Error();
                const statusData = await statusRes.json();

                if (statusData.has_business) {
                    const bizRes = await fetch(`${API}/business/me`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (bizRes.ok) {
                        const bizData = await bizRes.json();
                        
                        // 1. Mobile Check
                        const verifiedPhone = bizData.owner_phone || bizData.business_phone;
                        if (verifiedPhone) {
                            setPhone(verifiedPhone);
                            setOtpVerified(true);
                            setStep(1); // Brief jump to show progress
                        }

                        // 2. Address Check
                        if (bizData.suburb) {
                            setAddress({
                                street: bizData.address || "",
                                suburb: bizData.suburb,
                                state: bizData.state || "VIC",
                                postcode: bizData.postcode || ""
                            });
                        }

                        // Determine final jump step
                        setTimeout(() => {
                            if (verifiedPhone && bizData.suburb) {
                                setStep(2); // Go to final address step (already filled)
                                toast.info("Reusing your verified business details.");
                            } else if (verifiedPhone) {
                                setStep(2);
                                toast.info("Reusing your verified business mobile.");
                            }
                        }, 100);
                    }
                }
            } catch (e) {
                console.error("Profile check failed:", e);
            } finally {
                setIsCheckingProfile(false);
            }
        };

        checkStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getToken]);

    const handleSendOTP = async () => {
        if (!phone.trim()) { setPhoneError("Mobile number is required"); return; }
        setIsLoading(true);
        setPhoneError("");
        try {
            const res = await fetch(`${API}/referrer/otp/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone }),
            });
            if (!res.ok) throw new Error(await res.text());
            setOtpSent(true);
            setStep(1);
            toast.success("Verification code sent!");
        } catch (e) {
            toast.error("Failed to send code. Check the number and try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (otpCode.length !== 6) { setOtpError("Enter the 6-digit code"); return; }
        setIsLoading(true);
        setOtpError("");
        try {
            const res = await fetch(`${API}/referrer/otp/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone, code: otpCode }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Incorrect code");
            }
            setOtpVerified(true);
            setStep(2);
            toast.success("Phone verified!");
        } catch (e: any) {
            setOtpError(e.message || "Incorrect code. Try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleComplete = async () => {
        if (!address.suburb) { setAddressError("Please select your address"); return; }
        setIsLoading(true);
        setAddressError("");
        try {
            const token = await getToken();
            const res = await fetch(`${API}/referrer/onboarding`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    full_name: user?.fullName || user?.firstName || "",
                    phone,
                    street_address: address.street,
                    suburb: address.suburb,
                    state: address.state,
                    postcode: address.postcode,
                    phone_verified: otpVerified,
                    invite_code: inviteCode || null,
                }),
            });
            if (!res.ok) throw new Error(await res.text());

            const clerkRes = await completeOnboarding("referrer");
            if (clerkRes.error) throw new Error(clerkRes.error);

            posthog.capture("referrer_onboarding_completed", { suburb: address.suburb });
            await user?.reload();
            router.push("/dashboard/referrer?welcome=1");
        } catch (e) {
            console.error(e);
            toast.error("Failed to complete setup. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isCheckingProfile) {
        return (
            <main className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
                    <p className="text-zinc-600 font-medium">Checking profile details…</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-white flex flex-col">
            <header className="p-4 md:p-6 flex justify-between items-center border-b border-zinc-100 bg-white sticky top-0 z-50">
                <Link href="/"><Logo size="sm" /></Link>
                <Link href="/support" className="text-sm font-bold text-zinc-400 hover:text-zinc-900 transition-colors">Support</Link>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center py-8 md:py-16 px-4">
                <div className="w-full max-w-lg">
                    {/* Step indicator - Minimal Lines */}
                    <div className="flex gap-1.5 mb-6 md:mb-10 w-full max-w-[200px] mx-auto md:mx-0">
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                                    i <= step ? "bg-orange-500" : "bg-zinc-100"
                                }`}
                            />
                        ))}
                    </div>


                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

                        {/* STEP 0: Name + Phone */}
                        {step === 0 && (
                            <div className="space-y-6 md:space-y-8">
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-black text-zinc-900 mb-2 md:mb-3 tracking-tight font-display">
                                        Ready to start earning?
                                    </h1>
                                    <p className="text-zinc-500 font-medium leading-relaxed">
                                        Refer tradies to customers and earn Prezzee gift cards. Let's set up your account.
                                    </p>
                                </div>

                                {/* Prezzee "What you'll earn" strip */}
                                <div className="rounded-3xl bg-[#EAF4FF] border border-blue-100 p-4 md:p-5 flex items-center gap-4 md:gap-5">
                                    <div className="shrink-0 hidden sm:block">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src="https://files.poweredbyprezzee.com/products/7af951a6-2a13-004b-f0eb-a87382a5b2e7/8eff8e56-2718-4514-8e1a-15ca1eb22793/Prezzee_3D_-_AU_%281%29_452_280.gif"
                                            alt="Prezzee Smart Card"
                                            className="w-28 rounded-xl shadow-md"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold text-zinc-400">Rewards by</span>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src="/images/prezzee/prezzee-logo.svg"
                                                alt="Prezzee"
                                                className="h-4 w-auto"
                                            />
                                        </div>
                                        <p className="font-black text-zinc-900 text-base leading-tight mb-1">
                                            Invite 5 → earn a <span className="text-[#FF6600]">$25 Smart Card</span>
                                        </p>
                                        <p className="text-zinc-500 font-medium text-xs leading-relaxed mb-3">
                                            Spend at Woolworths, Bunnings, Uber, Netflix + 400 more. Issued automatically.
                                        </p>
                                        <a href="/rewards" className="text-xs font-black text-[#FF6600] hover:underline flex items-center gap-1">
                                            See all 335 brands →
                                        </a>
                                    </div>
                                </div>

                                {inviteCode && (
                                    <div className="bg-orange-50 border border-orange-200 rounded-2xl px-5 py-4 flex items-center gap-3">
                                        <CheckCircle className="w-5 h-5 text-orange-500 shrink-0" />
                                        <p className="text-sm font-bold text-orange-800">You were invited! You'll both earn rewards when you become active.</p>
                                    </div>
                                )}

                                <div className="space-y-4 md:space-y-5">
                                    <div>
                                        <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-2 md:mb-3 flex items-center gap-2">
                                            <User className="w-3.5 h-3.5" /> Your Name
                                        </label>
                                        <div className="w-full px-5 py-3 md:px-6 md:py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-lg font-medium text-zinc-700">
                                            {user?.fullName || user?.firstName || "Loading..."}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-2 md:mb-3 flex items-center gap-2">
                                            <Phone className="w-3.5 h-3.5" /> Mobile Number
                                        </label>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => { setPhone(e.target.value); setPhoneError(""); }}
                                            placeholder="e.g. 0412 000 000"
                                            className={`w-full px-5 py-3 md:px-6 md:py-4 bg-zinc-50 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-lg font-medium placeholder:text-zinc-300 ${phoneError ? "border-red-400" : "border-zinc-100"}`}
                                        />
                                        {phoneError && <p className="text-red-500 text-xs font-bold mt-1.5 ml-1">{phoneError}</p>}
                                    </div>
                                </div>

                                <Button onClick={handleSendOTP} disabled={isLoading} className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-full h-13 md:h-14 text-lg font-black shadow-xl shadow-orange-500/20">
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                                    Send Verification Code <ChevronRight className="ml-2 w-5 h-5" />
                                </Button>
                            </div>
                        )}

                        {/* STEP 1: OTP Verify */}
                        {step === 1 && (
                            <div className="space-y-6 md:space-y-8">
                                <div>
                                    <div className="w-12 h-12 md:w-14 md:h-14 bg-orange-100 rounded-2xl flex items-center justify-center mb-4 md:mb-6">
                                        <ShieldCheck className="w-6 h-6 md:w-7 md:h-7 text-orange-600" />
                                    </div>
                                    <h1 className="text-2xl md:text-3xl font-black text-zinc-900 mb-2 md:mb-3 tracking-tight font-display">
                                        Verify your number
                                    </h1>
                                    <p className="text-zinc-500 font-medium leading-relaxed">
                                        We sent a 6-digit code to <span className="font-bold text-zinc-900">{phone}</span>.
                                    </p>
                                </div>

                                <div>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        value={otpCode}
                                        onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, "")); setOtpError(""); }}
                                        placeholder="_ _ _ _ _ _"
                                        className={`w-full px-6 py-4 md:py-5 bg-zinc-50 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-2xl md:text-3xl font-black tracking-[0.5em] text-center placeholder:text-zinc-200 placeholder:tracking-widest ${otpError ? "border-red-400" : "border-zinc-100"}`}
                                    />
                                    {otpError && <p className="text-red-500 text-xs font-bold mt-2 text-center">{otpError}</p>}
                                </div>

                                <Button onClick={handleVerifyOTP} disabled={isLoading || otpCode.length !== 6} className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-full h-13 md:h-14 text-lg font-black shadow-xl shadow-orange-500/20">
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                                    Verify Code <ChevronRight className="ml-2 w-5 h-5" />
                                </Button>

                                <button
                                    type="button"
                                    onClick={() => { setStep(0); setOtpSent(false); setOtpCode(""); setOtpError(""); }}
                                    className="w-full text-center text-sm font-bold text-zinc-400 hover:text-zinc-900 transition-colors"
                                >
                                    Wrong number? Go back
                                </button>

                                <button
                                    type="button"
                                    onClick={handleSendOTP}
                                    className="w-full text-center text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors"
                                >
                                    Resend code
                                </button>
                            </div>
                        )}

                        {/* STEP 2: Address */}
                        {step === 2 && (
                            <div className="space-y-6 md:space-y-8">
                                <div>
                                    <div className="w-12 h-12 md:w-14 md:h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-4 md:mb-6">
                                        <MapPin className="w-6 h-6 md:w-7 md:h-7 text-green-600" />
                                    </div>
                                    <h1 className="text-2xl md:text-3xl font-black text-zinc-900 mb-2 md:mb-3 tracking-tight font-display">
                                        Your location
                                    </h1>
                                    <p className="text-zinc-500 font-medium leading-relaxed">
                                        We'll use this to show you businesses and leads in your area.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-2 md:mb-3 flex items-center gap-2">
                                        <MapPin className="w-3.5 h-3.5" /> Home Address
                                    </label>
                                    <AddressAutocomplete
                                        addressValue={address.street}
                                        suburbValue={address.suburb}
                                        stateValue={address.state}
                                        onAddressSelect={(street, suburb, state, postcode) => {
                                            setAddress({ street, suburb, state: state || "VIC", postcode: postcode || "" });
                                            setAddressError("");
                                        }}
                                        className={`w-full px-5 py-3 md:px-6 md:py-4 bg-zinc-50 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-lg font-medium placeholder:text-zinc-300 ${addressError ? "border-red-400" : "border-zinc-100"}`}
                                        placeholder="Search your address..."
                                    />
                                    {address.suburb && (
                                        <p className="text-xs text-green-600 font-bold mt-2 ml-1 flex items-center gap-1">
                                            <CheckCircle className="w-3.5 h-3.5" /> {address.suburb}, {address.state} {address.postcode}
                                        </p>
                                    )}
                                    {addressError && <p className="text-red-500 text-xs font-bold mt-1.5 ml-1">{addressError}</p>}
                                </div>

                                <Button onClick={handleComplete} disabled={isLoading || !address.suburb} className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-full h-13 md:h-14 text-lg font-black shadow-xl shadow-orange-500/20">
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                                    Complete Setup <ChevronRight className="ml-2 w-5 h-5" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="pb-10" />
        </main>
    );
}

export default function ReferrerOnboardingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-300" />
            </div>
        }>
            <ReferrerOnboardingInner />
        </Suspense>
    );
}
