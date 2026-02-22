"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Users,
    MapPin,
    CreditCard,
    ChevronRight,
    ChevronLeft,
    CheckCircle2,
    Rocket,
    Phone,
    User
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { WelcomeTour } from "@/components/onboarding/WelcomeTour";

export default function ReferrerOnboardingPage() {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [showTour, setShowTour] = useState(true);
    const [formData, setFormData] = useState({
        full_name: "",
        phone: "",
        profession: "Real Estate Agent",
        region: ""
    });
    const { getToken } = useAuth();
    const router = useRouter();

    const handleNext = async () => {
        if (step < 2) {
            setStep(step + 1);
        } else {
            setIsLoading(true);
            try {
                const token = await getToken();
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/referrer/onboarding`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Onboarding failed (${response.status}): ${errorText}`);
                }
                router.push("/dashboard/referrer");
            } catch (error) {
                console.error(error);
                alert("Failed to complete onboarding");
            } finally {
                setIsLoading(false);
            }
        }
    };

    if (showTour) {
        return <WelcomeTour type="referrer" onComplete={() => setShowTour(false)} />;
    }

    return (
        <main className="min-h-screen bg-white flex flex-col">
            {/* Simple Header */}
            <header className="p-6 flex justify-between items-center border-b border-zinc-100 bg-white sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
                        <Rocket className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-black text-xl tracking-tighter">TradeRefer Referrers</span>
                </div>
                <Link href="/support" className="text-sm font-bold text-zinc-400 hover:text-zinc-900 transition-colors">
                    Support
                </Link>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center py-20 px-4">
                <div className="w-full max-w-xl">
                    {/* Progress Bar */}
                    <div className="flex items-center gap-2 mb-12">
                        {[1, 2].map((s) => (
                            <div key={s} className="flex-1 h-1.5 rounded-full overflow-hidden bg-zinc-100">
                                <div className={`h-full transition-all duration-500 ${s <= step ? 'bg-orange-500' : 'bg-transparent'}`} />
                            </div>
                        ))}
                        <span className="ml-4 text-sm font-black text-zinc-400 uppercase tracking-widest whitespace-nowrap">Step {step} of 2</span>
                    </div>

                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {step === 1 ? (
                            <>
                                <div>
                                    <h1 className="text-4xl font-black text-zinc-900 mb-3 tracking-tight font-display">
                                        Ready to start earning commissions?
                                    </h1>
                                    <p className="text-lg text-zinc-500 font-medium leading-relaxed">
                                        Let's get your account set up so you can start recommending verified tradies and getting paid.
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <User className="w-3.5 h-3.5" /> Full Name
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.full_name}
                                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                            placeholder="e.g. Sarah Johnson"
                                            className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-lg font-medium placeholder:text-zinc-300"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <Phone className="w-3.5 h-3.5" /> Mobile Number
                                        </label>
                                        <input
                                            type="tel"
                                            required
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="e.g. 0412 000 000"
                                            className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-lg font-medium placeholder:text-zinc-300"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <Users className="w-3.5 h-3.5" /> Referral Source / Profession
                                        </label>
                                        <select
                                            value={formData.profession}
                                            onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                                            className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-lg font-medium appearance-none"
                                        >
                                            <option>Real Estate Agent</option>
                                            <option>Property Manager</option>
                                            <option>Mortgage Broker</option>
                                            <option>Professional Referrer</option>
                                            <option>Other / Shared Office</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <MapPin className="w-3.5 h-3.5" /> Primary Region
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.region}
                                            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                            placeholder="e.g. Geelong / Surf Coast"
                                            className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-lg font-medium placeholder:text-zinc-300"
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CreditCard className="w-10 h-10 text-green-600" />
                                    </div>
                                    <h1 className="text-4xl font-black text-zinc-900 mb-3 tracking-tight font-display">
                                        Payout Setup
                                    </h1>
                                    <p className="text-lg text-zinc-500 font-medium leading-relaxed max-w-md mx-auto">
                                        We use Stripe to ensure you get paid immediately once a lead is unlocked by a business partner.
                                    </p>
                                </div>

                                <div className="bg-zinc-50 rounded-3xl p-8 border border-zinc-100 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-zinc-100 flex items-center justify-center font-black text-base text-zinc-400">
                                            STRIPE
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-zinc-900">Secure Payouts</div>
                                            <div className="text-sm text-zinc-400 font-medium tracking-tight">Requires bank account or debit card</div>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="pt-8 flex items-center gap-4">
                            {step > 1 && (
                                <Button
                                    variant="ghost"
                                    onClick={() => setStep(step - 1)}
                                    className="rounded-full h-16 px-8 text-zinc-400 hover:text-zinc-900 font-bold"
                                >
                                    <ChevronLeft className="w-5 h-5 mr-2" /> Back
                                </Button>
                            )}
                            <Button
                                onClick={handleNext}
                                disabled={isLoading}
                                className="flex-1 bg-zinc-900 hover:bg-black text-white rounded-full h-16 text-xl font-black shadow-xl shadow-zinc-200"
                            >
                                {isLoading ? 'Completing...' : step === 2 ? 'Get Started' : 'Continue'} <ChevronRight className="ml-2 w-6 h-6" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="p-10 border-t border-zinc-50 text-center">
                <p className="text-zinc-300 text-xs font-bold uppercase tracking-[0.2em]">
                    © 2026 TradeRefer Pty Ltd
                </p>
            </footer>
        </main>
    );
}
