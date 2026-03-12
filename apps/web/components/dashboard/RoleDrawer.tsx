"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { X, ArrowRight, Target, DollarSign, Gift, Network, Zap, ArrowLeftRight } from "lucide-react";

const PREZZEE_CARD = "https://files.poweredbyprezzee.com/products/7af951a6-2a13-004b-f0eb-a87382a5b2e7/8eff8e56-2718-4514-8e1a-15ca1eb22793/Prezzee_3D_-_AU_%281%29_452_280.gif";
const PREZZEE_LOGO = "https://cdn.prod.website-files.com/67e0cab92cc4f35b3b006055/6808567053b358df8bfa79c3_Logo%20Consumer_Web.svg";

const CASES = {
    /** On referrer dash → pitch Business */
    business: {
        tabLabel: "BUSINESS MODE",
        eyebrow: "Business Command Centre",
        headline: "Do you own a Business?",
        sub: "Unlock your Business Command Centre.",
        features: [
            { icon: Target,  title: "Verified Leads",       desc: "Pre-screened leads from partners who vouch for every job." },
            { icon: Network, title: "Referral Force",        desc: "Approve and manage your own network of local referrers." },
            { icon: Zap,     title: "Zero-Admin Rewards",   desc: "Automatic rewards via Prezzee Smart Cards. No invoicing needed." },
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
        features: [
            { icon: DollarSign, title: "Earn Per Lead",     desc: "Collect $8+ per verified lead sent to trusted trade peers." },
            { icon: Gift,       title: "Prezzee Rewards",   desc: "Get paid instantly in Prezzee Smart Cards." },
            { icon: Network,    title: "335+ Brands",       desc: "Spend at Bunnings, Woolworths, Uber, and hundreds more." },
        ],
        cta: "Activate Referrer Mode",
        href: "/onboarding/referrer",
    },
};

/** Self-contained peeking drawer — mounts once, no external trigger needed. */
export function PeekingRoleDrawer() {
    const { isLoaded } = useUser();
    const { getToken } = useAuth();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [navH, setNavH] = useState(72);
    const [isMobile, setIsMobile] = useState(false);
    const [viewportReady, setViewportReady] = useState(false);
    const [authStatus, setAuthStatus] = useState<{ has_business: boolean; has_referrer: boolean } | null>(null);

    useEffect(() => {
        const update = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            setNavH(mobile ? 72 : 100);
            setViewportReady(true);
        };
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    // Fetch real roles from DB (Clerk metadata is NOT updated after onboarding)
    useEffect(() => {
        if (!isLoaded) return;
        getToken().then(token => {
            if (!token) return;
            fetch(`/api/backend/auth/status`, {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then(r => r.ok ? r.json() : null)
                .then(data => data && setAuthStatus({ has_business: data.has_business, has_referrer: data.has_referrer }))
                .catch(() => {});
        });
    }, [isLoaded, getToken, pathname]);

    const isBusinessDashboard = pathname?.startsWith("/dashboard/business");
    const isReferrerDashboard = pathname?.startsWith("/dashboard/referrer");

    const hasBusiness = authStatus?.has_business ?? false;
    const hasReferrer = authStatus?.has_referrer ?? false;
    const isDual      = hasBusiness && hasReferrer;

    // Dual-role: handle is a direct switch link, no drawer
    const dualSwitchHref = isDual
        ? isReferrerDashboard ? "/dashboard/business" : isBusinessDashboard ? "/dashboard/referrer" : null
        : null;
    const dualTabLabel = isDual
        ? isReferrerDashboard ? "BUSINESS MODE" : isBusinessDashboard ? "REFERRER MODE" : null
        : null;

    // Single-role: determine which pitch drawer to show
    let variant: "business" | "referrer" | null = null;
    if (!isDual && isReferrerDashboard && !hasBusiness) variant = "business";
    if (!isDual && isBusinessDashboard && !hasReferrer) variant = "referrer";

    const showHandle = viewportReady && !isMobile && (isDual ? !!dualSwitchHref : !!variant);

    // Animate drawer in after open state flips
    useEffect(() => {
        if (isOpen) {
            const t = requestAnimationFrame(() => setDrawerVisible(true));
            return () => cancelAnimationFrame(t);
        } else {
            setDrawerVisible(false);
        }
    }, [isOpen]);

    // Viewport push: reserve 48px on right for the handle
    useEffect(() => {
        if (!isLoaded || !showHandle || isMobile) return;
        if (!isOpen) {
            document.body.style.paddingRight = "3rem";
        } else {
            document.body.style.paddingRight = "";
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.body.style.paddingRight = "";
            document.body.style.overflow = "";
        };
    }, [isLoaded, showHandle, isOpen, isMobile]);

    const handleClose = () => {
        setDrawerVisible(false);
        setTimeout(() => setIsOpen(false), 280);
    };

    if (!isLoaded || !authStatus || !viewportReady || !showHandle) return null;

    const cfg = variant ? CASES[variant] : null;
    const tabLabel = isDual ? dualTabLabel! : cfg!.tabLabel;
    const handleTextClass = isBusinessDashboard ? "text-orange-500" : "text-slate-700";
    const handleHoverClass = isBusinessDashboard ? "hover:bg-orange-50" : "hover:bg-slate-50";

    return createPortal(
        <>
            {/* ── FULL-HEIGHT HANDLE (always visible) ── */}
            {!isOpen && (
                isDual ? (
                    /* Dual-role: direct switch link */
                    <Link
                        href={dualSwitchHref!}
                        aria-label={tabLabel}
                        className={`hidden md:flex fixed right-0 bottom-0 z-[9990] w-12 bg-white flex-col items-center justify-center gap-3 transition-colors ${handleHoverClass}`}
                        style={{
                            top: navH,
                            borderLeft: "4px solid #f97316",
                            boxShadow: "-4px 0 15px rgba(0,0,0,0.06)",
                        }}
                    >
                        <ArrowLeftRight className="w-4 h-4 text-orange-500 shrink-0" />
                        <span
                            className={`font-black uppercase tracking-widest select-none ${handleTextClass}`}
                            style={{
                                fontSize: 14,
                                writingMode: "vertical-rl",
                                textOrientation: "mixed",
                                transform: "rotate(180deg)",
                                letterSpacing: "0.14em",
                                lineHeight: 1,
                            }}
                        >
                            {tabLabel}
                        </span>
                    </Link>
                ) : (
                    /* Single-role: opens the pitch drawer */
                    <button
                        onClick={() => setIsOpen(true)}
                        aria-label={tabLabel}
                        className={`hidden md:flex fixed right-0 bottom-0 z-[9990] w-12 bg-white items-center justify-center cursor-pointer transition-colors ${handleHoverClass}`}
                        style={{
                            top: navH,
                            borderLeft: "4px solid #f97316",
                            boxShadow: "-4px 0 15px rgba(0,0,0,0.06)",
                        }}
                    >
                        <span
                            className={`font-black uppercase tracking-widest select-none ${handleTextClass}`}
                            style={{
                                fontSize: 18,
                                writingMode: "vertical-rl",
                                textOrientation: "mixed",
                                transform: "rotate(180deg)",
                                letterSpacing: "0.14em",
                                lineHeight: 1,
                            }}
                        >
                            {tabLabel}
                        </span>
                    </button>
                )
            )}

            {/* ── BACKDROP (only when open) ── */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[9991] bg-black/60 backdrop-blur-sm transition-opacity duration-300"
                    style={{ opacity: drawerVisible ? 1 : 0 }}
                    onClick={handleClose}
                />
            )}

            {/* ── FULL DRAWER (single-role only) ── */}
            {cfg && isOpen && (
                <div
                    className="fixed inset-y-0 right-0 z-[9999] w-full sm:w-[420px] lg:w-[450px] max-w-full bg-zinc-950 flex flex-col shadow-2xl transition-transform duration-300 ease-out"
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
                    <div className="px-8 pt-8 pb-5">
                        <p className="text-orange-400 font-black uppercase tracking-widest mb-1" style={{ fontSize: 16 }}>
                            {cfg.eyebrow}
                        </p>
                        <h2 className="font-black text-white leading-tight mb-1" style={{ fontSize: 28 }}>
                            {cfg.headline}
                        </h2>
                        <p className="text-zinc-400 font-medium leading-snug" style={{ fontSize: 20 }}>
                            {cfg.sub}
                        </p>
                    </div>

                    {/* Features */}
                    <div className="flex-1 px-8 pb-4 space-y-4">
                        {cfg.features.map(({ icon: FIcon, title, desc }) => (
                            <div key={title} className="flex items-start gap-5">
                                <div className="w-12 h-12 bg-white/8 border border-white/10 rounded-2xl flex items-center justify-center shrink-0">
                                    <FIcon className="w-6 h-6 text-orange-400" />
                                </div>
                                <div>
                                    <p className="font-black text-white leading-tight mb-1" style={{ fontSize: 22 }}>{title}</p>
                                    <p className="text-zinc-400 font-medium leading-relaxed" style={{ fontSize: 20 }}>{desc}</p>
                                </div>
                            </div>
                        ))}

                        {/* Prezzee Smart Card visual */}
                        <div className="rounded-2xl bg-[#0F172A] border border-white/10 overflow-hidden">
                            <div className="flex items-center justify-center py-3 px-4">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={PREZZEE_CARD}
                                    alt="Prezzee Smart Card"
                                    className="w-36 rounded-xl shadow-2xl"
                                />
                            </div>
                            <div className="px-4 pb-3 flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <p className="text-white font-semibold" style={{ fontSize: 17 }}>Powered by</p>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={PREZZEE_LOGO} alt="Prezzee" className="h-4 w-auto brightness-0 invert" />
                                </div>
                                <p className="text-orange-400 font-black" style={{ fontSize: 17 }}>335+ brands</p>
                            </div>
                        </div>
                    </div>

                    {/* CTA footer */}
                    <div className="px-8 py-5 border-t border-white/10">
                        <Link
                            href={cfg.href}
                            onClick={handleClose}
                            className="flex items-center justify-center gap-3 w-full bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black transition-all shadow-lg shadow-orange-500/30 active:scale-95"
                            style={{ height: 80, fontSize: 24 }}
                        >
                            {cfg.cta}
                            <ArrowRight className="w-6 h-6" />
                        </Link>
                        <button
                            onClick={handleClose}
                            className="w-full mt-5 text-zinc-500 hover:text-zinc-300 font-bold transition-colors"
                            style={{ fontSize: 18 }}
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
