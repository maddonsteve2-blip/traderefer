"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, ChevronRight, Phone } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/Logo";

import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { WelcomeTour } from "@/components/onboarding/WelcomeTour";
import { toast } from "sonner";

export default function ReferrerOnboardingPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [showTour, setShowTour] = useState(true);
    const [formData, setFormData] = useState({
        phone: "",
        region: ""
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const { getToken } = useAuth();
    const { user } = useUser();
    const router = useRouter();

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.phone.trim()) newErrors.phone = "Mobile number is required";
        if (!formData.region.trim()) newErrors.region = "Primary region is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) {
            toast.error("Please fill in all required fields");
            return;
        }
        setIsLoading(true);
        try {
            const token = await getToken();
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/referrer/onboarding`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    full_name: user?.fullName || user?.firstName || "",
                    ...formData
                })
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
    };

    if (showTour) {
        return <WelcomeTour type="referrer" onComplete={() => setShowTour(false)} />;
    }

    return (
        <main className="min-h-screen bg-white flex flex-col">
            <header className="p-6 flex justify-between items-center border-b border-zinc-100 bg-white sticky top-0 z-50">
                <Link href="/">
                    <Logo size="sm" />
                </Link>
                <Link href="/support" className="text-sm font-bold text-zinc-400 hover:text-zinc-900 transition-colors">
                    Support
                </Link>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center py-20 px-4">
                <div className="w-full max-w-xl">
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div>
                            <h1 className="text-4xl font-black text-zinc-900 mb-3 tracking-tight font-display">
                                Ready to start earning commissions?
                            </h1>
                            <p className="text-lg text-zinc-500 font-medium leading-relaxed">
                                Let's get your account set up so you can start recommending verified tradies and getting paid.
                            </p>
                        </div>

                        {user?.firstName && (
                            <p className="text-sm text-zinc-400">Signed in as <span className="font-bold text-zinc-600">{user.fullName || user.firstName}</span></p>
                        )}

                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Phone className="w-3.5 h-3.5" /> Mobile Number
                                </label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={(e) => { setFormData({ ...formData, phone: e.target.value }); setErrors({ ...errors, phone: "" }); }}
                                    placeholder="e.g. 0412 000 000"
                                    className={`w-full px-6 py-4 bg-zinc-50 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-lg font-medium placeholder:text-zinc-300 ${errors.phone ? 'border-red-400' : 'border-zinc-100'}`}
                                />
                                {errors.phone && <p className="text-red-500 text-xs font-bold mt-1.5 ml-1">{errors.phone}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5" /> Primary Region
                                </label>
                                <input
                                    type="text"
                                    value={formData.region}
                                    onChange={(e) => { setFormData({ ...formData, region: e.target.value }); setErrors({ ...errors, region: "" }); }}
                                    placeholder="e.g. Geelong / Surf Coast"
                                    className={`w-full px-6 py-4 bg-zinc-50 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-lg font-medium placeholder:text-zinc-300 ${errors.region ? 'border-red-400' : 'border-zinc-100'}`}
                                />
                                {errors.region && <p className="text-red-500 text-xs font-bold mt-1.5 ml-1">{errors.region}</p>}
                            </div>
                        </div>

                        <div className="pt-8">
                            <Button
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className="w-full bg-zinc-900 hover:bg-black text-white rounded-full h-16 text-xl font-black shadow-xl shadow-zinc-200"
                            >
                                {isLoading ? 'Completing...' : 'Get Started'} <ChevronRight className="ml-2 w-6 h-6" />
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
