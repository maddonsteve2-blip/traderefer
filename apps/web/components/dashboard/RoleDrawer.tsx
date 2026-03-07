"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { X, Building2, Rocket, ArrowRight, Target, DollarSign, Gift, Network, Zap } from "lucide-react";

const PREZZEE_CARD = "https://files.poweredbyprezzee.com/products/7af951a6-2a13-004b-f0eb-a87382a5b2e7/8eff8e56-2718-4514-8e1a-15ca1eb22793/Prezzee_3D_-_AU_%281%29_452_280.gif";
const PREZZEE_LOGO = "https://cdn.prod.website-files.com/67e0cab92cc4f35b3b006055/6808567053b358df8bfa79c3_Logo%20Consumer_Web.svg";

const CASES = {
    /** On referrer dash → pitch Business */
    business: {
        tabLabel: "BUSINESS MODE",
        eyebrow: "Business Command Centre",
        headline: "Do you own a Business?",
        sub: "Unlock your Business Command Centre.",
        icon: Building2,
        features: [
            { icon: Target,  title: "Verified Leads",       desc: "Receive pre-screened leads from partners who vouch for every job." },
            { icon: Network, title: "Referral Force",        desc: "Approve and manage your own custom network of local referrers." },
            { icon: Zap,     title: "Zero-Admin Rewards",   desc: "Referral fees are automatically fulfilled via Prezzee Smart Cards — no manual payments or invoicing required." },
        ],
        cta: "Start Business Onboarding",
        href: "/onboarding/business",
    },
    /** On business dash → pitch Referrer */
    referrer: {
        tabLabel: "REFERRER MODE",
        eyebrow: "Partner Referrer Network",
        headline: "Want to Monetize Your Network?",
        sub: "Turn your 'No' calls into instant profit.",
        icon: Rocket,
        features: [
            { icon: DollarSign, title: "Earn Per Lead",     desc: "Collect $8+ per verified lead sent to your trusted trade peers." },
            { icon: Gift,       title: "Prezzee Rewards",   desc: "Get paid instantly in Prezzee Smart Cards." },
            { icon: Network,    title: "335+ Brands",       desc: "Spend your earnings at Bunnings, Woolworths, Uber, and hundreds more." },
        ],
        cta: "Activate Referrer Mode",
        href: "/onboarding/referrer",
    },
};

/** Self-contained peeking drawer — mounts once, no external trigger needed. */
export function PeekingRoleDrawer() {
    const { user, isLoaded } = useUser();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [drawerVisible, setDrawerVisible] = useState(false);

    const isBusinessDashboard = pathname?.startsWith("/dashboard/business");
    const isReferrerDashboard = pathname?.startsWith("/dashboard/referrer");

    const roles = (user?.publicMetadata?.roles as string[] | undefined) ?? [];
    const role  = user?.publicMetadata?.role as string | undefined;
    const effectiveRoles = roles.length > 0 ? roles : role ? [role] : [];
    const isDual       = effectiveRoles.includes("referrer") && effectiveRoles.includes("business");
    const hasBusiness  = effectiveRoles.includes("business");
    const hasReferrer  = effectiveRoles.includes("referrer");

    // Determine which pitch to show
    let variant: "business" | "referrer" | null = null;
    if (isReferrerDashboard && !hasBusiness) variant = "business";
    if (isBusinessDashboard && !hasReferrer) variant = "referrer";

    // Animate drawer in after open state flips
    useEffect(() => {
        if (isOpen) {
            const t = requestAnimationFrame(() => setDrawerVisible(true));
            return () => cancelAnimationFrame(t);
        } else {
            setDrawerVisible(false);
        }
    }, [isOpen]);

    // Lock scroll when open
    useEffect(() => {
        if (isOpen) document.body.style.overflow = "hidden";
        else        document.body.style.overflow = "";
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    const handleClose = () => {
        setDrawerVisible(false);
        setTimeout(() => setIsOpen(false), 280);
    };

    if (!isLoaded || isDual || !variant) return null;

    const cfg = CASES[variant];
    const Icon = cfg.icon;

    return createPortal(
        <>
            {/* ── PEEK HANDLE (always visible) ── */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed right-0 top-1/2 -translate-y-1/2 z-[9990] flex items-center justify-center"
                    style={{ width: 40, height: 120 }}
                    aria-label={cfg.tabLabel}
                >
                    {/* Tab body */}
                    <div className="relative w-full h-full bg-white rounded-l-2xl border-l-4 border-orange-500 shadow-xl overflow-hidden flex items-center justify-center"
                        style={{ boxShadow: "0 0 20px 2px rgba(249,115,22,0.18), -4px 0 16px 0 rgba(0,0,0,0.10)" }}>
                        {/* Pulse glow on the left border */}
                        <span className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 animate-pulse" />
                        {/* Rotated label */}
                        <span
                            className="text-zinc-800 font-black tracking-widest select-none"
                            style={{
                                fontSize: 10,
                                writingMode: "vertical-rl",
                                textOrientation: "mixed",
                                transform: "rotate(180deg)",
                                letterSpacing: "0.12em",
                            }}
                        >
                            {cfg.tabLabel}
                        </span>
                    </div>
                </button>
            )}

            {/* ── BACKDROP (only when open) ── */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[9991] bg-black/60 backdrop-blur-sm transition-opacity duration-300"
                    style={{ opacity: drawerVisible ? 1 : 0 }}
                    onClick={handleClose}
                />
            )}

            {/* ── FULL DRAWER ── */}
            {isOpen && (
                <div
                    className="fixed inset-y-0 right-0 z-[9999] w-[450px] max-w-full bg-zinc-950 flex flex-col shadow-2xl transition-transform duration-300 ease-out"
                    style={{ transform: drawerVisible ? "translateX(0)" : "translateX(100%)" }}
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
                        <div className="w-16 h-16 bg-orange-500/20 rounded-2xl flex items-center justify-center mb-6">
                            <Icon className="w-8 h-8 text-orange-400" />
                        </div>
                        <p className="text-orange-400 font-black uppercase tracking-widest mb-3" style={{ fontSize: 11 }}>
                            {cfg.eyebrow}
                        </p>
                        <h2 className="font-black text-white leading-tight mb-3" style={{ fontSize: 24 }}>
                            {cfg.headline}
                        </h2>
                        <p className="text-zinc-400 font-medium leading-snug" style={{ fontSize: 18 }}>
                            {cfg.sub}
                        </p>
                    </div>

                    {/* Features */}
                    <div className="flex-1 overflow-y-auto px-8 py-8 space-y-7">
                        {cfg.features.map(({ icon: FIcon, title, desc }) => (
                            <div key={title} className="flex items-start gap-5">
                                <div className="w-12 h-12 bg-white/8 border border-white/10 rounded-2xl flex items-center justify-center shrink-0">
                                    <FIcon className="w-6 h-6 text-orange-400" />
                                </div>
                                <div>
                                    <p className="font-black text-white leading-tight mb-1" style={{ fontSize: 18 }}>{title}</p>
                                    <p className="text-zinc-400 font-medium leading-relaxed" style={{ fontSize: 16 }}>{desc}</p>
                                </div>
                            </div>
                        ))}

                        {/* Prezzee Smart Card visual */}
                        <div className="rounded-2xl bg-[#0F172A] border border-white/10 overflow-hidden">
                            <div className="relative flex items-center justify-center py-5 px-4">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={PREZZEE_CARD}
                                    alt="Prezzee Smart Card"
                                    className="w-44 rounded-xl shadow-2xl"
                                />
                            </div>
                            <div className="px-5 pb-5 flex items-center justify-between">
                                <div>
                                    <p className="text-white font-black" style={{ fontSize: 16 }}>Powered by</p>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={PREZZEE_LOGO} alt="Prezzee" className="h-4 w-auto brightness-0 invert mt-1" />
                                </div>
                                <div className="text-right">
                                    <p className="text-orange-400 font-black" style={{ fontSize: 16 }}>335+ brands</p>
                                    <p className="text-zinc-400 font-medium" style={{ fontSize: 13 }}>Bunnings · Woolworths · Uber</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CTA footer */}
                    <div className="px-8 py-8 border-t border-white/10">
                        <Link
                            href={cfg.href}
                            onClick={handleClose}
                            className="flex items-center justify-center gap-3 w-full bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black transition-all shadow-lg shadow-orange-500/30"
                            style={{ height: 64, fontSize: 18 }}
                        >
                            {cfg.cta}
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <button
                            onClick={handleClose}
                            className="w-full mt-4 text-zinc-500 hover:text-zinc-300 font-medium transition-colors"
                            style={{ fontSize: 14 }}
                        >
                            Maybe later
                        </button>
                    </div>
                </div>
            )}
        </>,
        document.body
    );
}

/** @deprecated Use PeekingRoleDrawer instead */
export function RoleDrawer({ variant, onClose }: { variant: "business" | "referrer"; onClose: () => void }) {
    return <PeekingRoleDrawer />;
}
