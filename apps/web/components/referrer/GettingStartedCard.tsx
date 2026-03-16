"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { CheckCircle, Circle, Rocket } from "lucide-react";
import { motion } from "framer-motion";

interface Step {
    label: string;
    done: boolean;
    href: string;
}

export function GettingStartedCard() {
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const [steps, setSteps] = useState<Step[] | null>(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined" && localStorage.getItem("tr_getting_started_dismissed")) {
            setDismissed(true);
        }
    }, []);

    useEffect(() => {
        if (!isLoaded || !isSignedIn || dismissed) return;
        (async () => {
            try {
                const token = await getToken();
                const [meRes, statsRes] = await Promise.all([
                    fetch("/api/backend/referrer/me", { headers: { Authorization: `Bearer ${token}` } }),
                    fetch("/api/backend/referrer/stats", { headers: { Authorization: `Bearer ${token}` } }),
                ]);
                const me = meRes.ok ? await meRes.json() : {};
                const stats = statsRes.ok ? await statsRes.json() : {};

                const hasProfile = !!(me.profile_bio || me.tagline || me.profile_photo_url);
                const hasPartner = (stats.total_referrals ?? 0) > 0 || (me.businesses_linked ?? 0) > 0;
                const hasReferral = (stats.total_referrals ?? 0) > 0;

                setSteps([
                    { label: "Complete your profile", done: hasProfile, href: "/dashboard/referrer/profile" },
                    { label: "Apply to a business's network", done: hasPartner, href: "/dashboard/referrer/businesses" },
                    { label: "Send your first referral", done: hasReferral, href: "/dashboard/referrer/applications" },
                ]);
            } catch {}
        })();
    }, [isLoaded, isSignedIn, getToken, dismissed]);

    if (dismissed || !steps) return null;

    const allDone = steps.every(s => s.done);
    if (allDone) return null;

    const doneCount = steps.filter(s => s.done).length;

    return (
        <motion.div
            className="bg-gradient-to-br from-orange-50 via-amber-50 to-white border border-orange-200 rounded-2xl p-6 shadow-sm"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 border border-orange-200 rounded-xl flex items-center justify-center">
                        <Rocket className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                        <p className="font-black text-zinc-900 text-lg leading-tight">3 steps to your first earn</p>
                        <p className="text-sm text-zinc-400 font-medium">{doneCount}/3 complete</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setDismissed(true);
                        localStorage.setItem("tr_getting_started_dismissed", "1");
                    }}
                    className="text-xs font-bold text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                    Dismiss
                </button>
            </div>
            <motion.div
                className="space-y-3"
                initial="hidden"
                animate="visible"
                variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.15 } } }}
            >
                {steps.map((step, i) => (
                    <motion.div
                        key={`motion-${i}`}
                        variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } }}
                    >
                    <Link
                        key={i}
                        href={step.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                            step.done
                                ? "bg-green-50 border border-green-100"
                                : "bg-white border border-zinc-100 hover:border-orange-200 hover:shadow-sm"
                        }`}
                    >
                        {step.done ? (
                            <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                        ) : (
                            <Circle className="w-5 h-5 text-zinc-300 shrink-0" />
                        )}
                        <span className={`font-bold text-base ${step.done ? "text-green-700 line-through" : "text-zinc-700"}`}>
                            {step.label}
                        </span>
                    </Link>
                    </motion.div>
                ))}
            </motion.div>
        </motion.div>
    );
}
