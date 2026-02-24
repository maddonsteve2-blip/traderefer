"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Search,
    Link as LinkIcon,
    DollarSign,
    ShieldCheck,
    Lock,
    TrendingUp,
    ChevronRight,
    ArrowRight,
    Rocket
} from "lucide-react";
import { Logo } from "@/components/Logo";


interface WelcomeTourProps {
    type: "business" | "referrer";
    onComplete: () => void;
}

export function WelcomeTour({ type, onComplete }: WelcomeTourProps) {
    const [step, setStep] = useState(0);

    const referrerSteps = [
        {
            title: "Discover Partners",
            desc: "Browse our directory of vetted, high-performing local tradies you can trust.",
            icon: Search,
            color: "text-orange-500",
            bg: "bg-orange-500/10"
        },
        {
            title: "Share & Track",
            desc: "Use your unique referral link to recommend tradies. Track every click and lead in real-time.",
            icon: LinkIcon,
            color: "text-blue-500",
            bg: "bg-blue-500/10"
        },
        {
            title: "Earn Cash",
            desc: "Get paid instantly as soon as a business unlocks your lead. No points—just cash.",
            icon: DollarSign,
            color: "text-green-500",
            bg: "bg-green-500/10"
        }
    ];

    const businessSteps = [
        {
            title: "Get Quality Leads",
            desc: "Receive exclusive leads from local referrers. Every lead is pre-verified via phone OTP.",
            icon: ShieldCheck,
            color: "text-orange-500",
            bg: "bg-orange-500/10"
        },
        {
            title: "Total Control",
            desc: "Preview job details for free. Pay a small, transparent fee only when you're ready to see contact info.",
            icon: Lock,
            color: "text-blue-500",
            bg: "bg-blue-500/10"
        },
        {
            title: "Scale Faster",
            desc: "Close more work through the power of trusted word-of-mouth. Let the community work for you.",
            icon: TrendingUp,
            color: "text-green-500",
            bg: "bg-green-500/10"
        }
    ];

    const steps = type === "referrer" ? referrerSteps : businessSteps;
    const currentStep = steps[step];

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            onComplete();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-zinc-900 flex items-center justify-center p-6 lg:p-12 overflow-hidden">
            {/* Decorative Glows */}
            <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[120px]" />
            <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]" />

            <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center relative z-10">
                <div className="space-y-8 order-2 lg:order-1">
                    <div className="flex items-center gap-3">
                        <Logo size="sm" variant="orange" />
                    </div>

                    <div key={step} className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both">
                        <div className="inline-flex px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-black text-orange-500 uppercase tracking-widest">
                            Step {step + 1} of 3
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-white leading-tight font-display tracking-tight">
                            {currentStep.title}
                        </h2>
                        <p className="text-xl text-zinc-400 font-medium leading-relaxed max-w-md">
                            {currentStep.desc}
                        </p>
                    </div>

                    <div className="pt-8 flex items-center gap-4">
                        <Button
                            onClick={handleNext}
                            className="group bg-orange-500 hover:bg-orange-600 text-white rounded-full h-16 px-10 text-xl font-black shadow-xl shadow-orange-500/20 transition-all active:scale-[0.98]"
                        >
                            {step === steps.length - 1 ? 'Get Started' : 'Next Step'}
                            <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </Button>

                        {step < steps.length - 1 && (
                            <button
                                onClick={onComplete}
                                className="text-zinc-500 hover:text-white text-sm font-bold transition-colors px-6"
                            >
                                Skip Tour
                            </button>
                        )}
                    </div>
                </div>

                <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
                    <div key={`icon-${step}`} className={`w-64 h-64 lg:w-96 lg:h-96 ${currentStep.bg} rounded-[60px] lg:rounded-[100px] flex items-center justify-center relative animate-in zoom-in-75 duration-1000 fill-mode-both delay-150 group`}>
                        <div className="absolute inset-0 bg-white/5 rounded-inherit border border-white/10 transform rotate-6 group-hover:rotate-12 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-white/5 rounded-inherit border border-white/10 transform -rotate-3 group-hover:-rotate-6 transition-transform duration-700" />
                        <currentStep.icon className={`w-32 h-32 lg:w-48 lg:h-48 ${currentStep.color} relative z-10 drop-shadow-2xl`} />
                    </div>
                </div>
            </div>

            {/* Progress Dots Center Bottom */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-4">
                {steps.map((_, i) => (
                    <div
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? 'w-12 bg-orange-500' : 'w-3 bg-zinc-800'}`}
                    />
                ))}
            </div>
        </div>
    );
}
