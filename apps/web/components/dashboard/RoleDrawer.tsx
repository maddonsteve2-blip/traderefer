"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
    X, Building2, Rocket, CheckCircle2, ArrowRight,
    Target, Users, Zap, DollarSign, Gift, Network
} from "lucide-react";

interface RoleDrawerProps {
    /** Which pitch to show */
    variant: "business" | "referrer";
    onClose: () => void;
}

const CASES = {
    /** Referrer → pitch Business registration */
    business: {
        eyebrow: "Business Command Centre",
        headline: "Unlock Your Business Command Centre",
        sub: "Turn your network into a high-performance sales force.",
        icon: Building2,
        iconBg: "bg-orange-500/20",
        iconColor: "text-orange-400",
        accentColor: "text-orange-400",
        features: [
            { icon: Target, title: "Verified Leads", desc: "Receive pre-vetted leads from partners you trust." },
            { icon: Network, title: "Build Your Network", desc: "Approve and manage your own custom referral force." },
            { icon: Zap, title: "Automated Admin", desc: "Zero-hassle payouts via the Prezzee rewards system." },
        ],
        cta: "Start Business Onboarding",
        href: "/onboarding/business",
    },
    /** Business → pitch Referrer activation */
    referrer: {
        eyebrow: "Partner Referrer Network",
        headline: "Monetize Your Network. Earn Rewards.",
        sub: "Turn your missed calls into profit with the Partner Network.",
        icon: Rocket,
        iconBg: "bg-orange-500/20",
        iconColor: "text-orange-400",
        accentColor: "text-orange-400",
        features: [
            { icon: DollarSign, title: "Monetize 'No' Calls", desc: "Refer jobs you can't service to verified peers." },
            { icon: Gift, title: "Instant Rewards", desc: "Collect $8+ per verified lead via Prezzee Smart Cards." },
            { icon: Users, title: "300+ Brands", desc: "Spend your rewards at Bunnings, Woolworths, Uber, and more." },
        ],
        cta: "Activate Referrer Mode",
        href: "/onboarding/referrer",
    },
};

export function RoleDrawer({ variant, onClose }: RoleDrawerProps) {
    const [visible, setVisible] = useState(false);
    const cfg = CASES[variant];
    const Icon = cfg.icon;

    // Trigger slide-in after mount
    useEffect(() => {
        const t = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(t);
    }, []);

    // Lock body scroll
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    const handleClose = () => {
        setVisible(false);
        setTimeout(onClose, 280);
    };

    return createPortal(
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm transition-opacity duration-300"
                style={{ opacity: visible ? 1 : 0 }}
                onClick={handleClose}
            />

            {/* Drawer */}
            <div
                className="fixed inset-y-0 right-0 z-[9999] w-full max-w-md bg-zinc-950 flex flex-col shadow-2xl transition-transform duration-300 ease-out"
                style={{ transform: visible ? "translateX(0)" : "translateX(100%)" }}
            >
                {/* Close */}
                <button
                    onClick={handleClose}
                    className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Header */}
                <div className="px-8 pt-12 pb-8 border-b border-white/10">
                    <div className={`w-16 h-16 ${cfg.iconBg} rounded-2xl flex items-center justify-center mb-6`}>
                        <Icon className={`w-8 h-8 ${cfg.iconColor}`} />
                    </div>
                    <p className={`text-xs font-black ${cfg.accentColor} uppercase tracking-widest mb-3`}>
                        {cfg.eyebrow}
                    </p>
                    <h2 className="text-[24px] font-black text-white leading-tight mb-3">
                        {cfg.headline}
                    </h2>
                    <p className="text-[18px] text-zinc-400 font-medium leading-snug">
                        {cfg.sub}
                    </p>
                </div>

                {/* Feature list */}
                <div className="flex-1 overflow-y-auto px-8 py-8 space-y-7">
                    {cfg.features.map(({ icon: FIcon, title, desc }) => (
                        <div key={title} className="flex items-start gap-5">
                            <div className="w-12 h-12 bg-white/8 border border-white/10 rounded-2xl flex items-center justify-center shrink-0">
                                <FIcon className="w-6 h-6 text-orange-400" />
                            </div>
                            <div>
                                <p className="text-[18px] font-black text-white leading-tight mb-1">{title}</p>
                                <p className="text-[15px] text-zinc-400 font-medium leading-relaxed">{desc}</p>
                            </div>
                        </div>
                    ))}

                    {/* Prezzee trust strip — referrer case only */}
                    {variant === "referrer" && (
                        <div className="mt-4 flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="https://cdn.prod.website-files.com/67e0cab92cc4f35b3b006055/6808567053b358df8bfa79c3_Logo%20Consumer_Web.svg"
                                alt="Prezzee"
                                className="h-4 w-auto brightness-0 invert opacity-60"
                            />
                            <p className="text-xs text-zinc-400 font-semibold">
                                Powered by Prezzee · Digital gift cards issued instantly
                            </p>
                        </div>
                    )}
                </div>

                {/* CTA footer */}
                <div className="px-8 py-8 border-t border-white/10">
                    <Link
                        href={cfg.href}
                        onClick={handleClose}
                        className="flex items-center justify-center gap-3 w-full h-16 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black transition-all shadow-lg shadow-orange-500/30 text-[18px]"
                    >
                        {cfg.cta}
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                    <button
                        onClick={handleClose}
                        className="w-full mt-4 text-zinc-500 hover:text-zinc-300 font-medium transition-colors text-sm"
                    >
                        Maybe later
                    </button>
                </div>
            </div>
        </>,
        document.body
    );
}
