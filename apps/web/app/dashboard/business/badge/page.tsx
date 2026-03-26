"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import {
    Copy, Check, ChevronLeft, ExternalLink, Code2, Loader2,
    Shield, Star, Award, Sparkles, Link as LinkIcon, Download
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    DashboardPage,
    DashboardEyebrow,
    DashboardTitle,
    DashboardSubtitle,
    DashboardCard,
    DashboardAccentCard,
    DashboardDarkCard,
    DashboardSection,
    DashboardSectionHeader,
    DashboardSectionTitle,
    DashboardSectionDescription,
} from "@/components/dashboard/RedesignPrimitives";

interface BusinessData {
    slug: string;
    business_name: string;
    referral_fee_cents: number | null;
    avg_rating: number | null;
    total_reviews: number;
    logo_url: string | null;
    trade_category: string | null;
    suburb: string | null;
    is_verified: boolean;
}

type BadgeStyle = "trust" | "minimal" | "profile";

const BADGE_STYLES: { id: BadgeStyle; label: string; description: string; icon: React.ReactNode }[] = [
    {
        id: "trust",
        label: "Trust Badge",
        description: "Eye-catching badge with referral reward. Best for sidebars and footers.",
        icon: <Shield className="w-4 h-4" />,
    },
    {
        id: "minimal",
        label: "Minimal Link",
        description: "Subtle text link. Blends naturally into any page.",
        icon: <LinkIcon className="w-4 h-4" />,
    },
    {
        id: "profile",
        label: "Profile Card",
        description: "Full card with logo, reviews and reward. Best for partner pages.",
        icon: <Award className="w-4 h-4" />,
    },
];

function formatFee(cents: number | null): string {
    if (!cents) return "$50";
    return `$${Math.round(cents / 100)}`;
}

function generateBadgeHtml(style: BadgeStyle, business: BusinessData): string {
    const fee = formatFee(business.referral_fee_cents);
    const referUrl = `https://traderefer.au/b/${business.slug}/refer`;
    const name = business.business_name || "My Business";
    const rating = business.avg_rating ? business.avg_rating.toFixed(1) : "5.0";
    const reviews = business.total_reviews || 0;
    const logoUrl = business.logo_url || "";

    if (style === "trust") {
        return `<!-- TradeRefer Partner Badge -->
<a href="${referUrl}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:12px;padding:14px 20px;background:#ffffff;border:2px solid #f97316;border-radius:12px;text-decoration:none;font-family:system-ui,-apple-system,sans-serif;box-shadow:0 2px 12px rgba(249,115,22,0.15);">
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
  <div style="border-right:1px solid #e4e4e7;padding-right:12px;">
    <div style="font-weight:800;color:#18181b;font-size:14px;line-height:1.2;">Verified Partner</div>
    <div style="font-size:12px;font-weight:600;color:#71717a;line-height:1.2;margin-top:2px;">TradeRefer</div>
  </div>
  <div>
    <div style="font-size:11px;font-weight:700;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.08em;line-height:1.2;">Refer &amp; Earn</div>
    <div style="font-size:18px;font-weight:900;color:#f97316;line-height:1.2;">${fee}</div>
  </div>
</a>
<!-- End TradeRefer Badge -->`;
    }

    if (style === "minimal") {
        return `<!-- TradeRefer Partner Badge -->
<a href="${referUrl}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;padding:10px 18px;background:#fef3c7;border:1px solid #fbbf24;border-radius:8px;color:#92400e;text-decoration:none;font-family:system-ui,-apple-system,sans-serif;font-weight:700;font-size:14px;transition:background 0.2s;">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b" xmlns="http://www.w3.org/2000/svg"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
  Proud partner of TradeRefer &mdash; Refer a customer, earn ${fee} &rarr;
</a>
<!-- End TradeRefer Badge -->`;
    }

    // profile card
    const stars = "★★★★★".slice(0, Math.round(Number(rating)));
    const emptyStars = "★★★★★".slice(Math.round(Number(rating)));
    return `<!-- TradeRefer Partner Badge -->
<div style="max-width:300px;padding:20px;background:#ffffff;border:2px solid #e4e4e7;border-radius:16px;font-family:system-ui,-apple-system,sans-serif;">
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
    ${logoUrl ? `<img src="${logoUrl}" alt="${name}" style="width:48px;height:48px;border-radius:10px;object-fit:cover;border:1px solid #e4e4e7;">` : `<div style="width:48px;height:48px;border-radius:10px;background:#f97316;display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:18px;">${name.charAt(0)}</div>`}
    <div>
      <div style="font-weight:800;color:#18181b;font-size:16px;line-height:1.2;">${name}</div>
      <div style="font-size:12px;color:#71717a;margin-top:2px;">Find us on TradeRefer</div>
    </div>
  </div>
  ${reviews > 0 ? `<div style="display:flex;align-items:center;gap:6px;margin-bottom:14px;">
    <span style="color:#f59e0b;font-size:16px;">${stars}</span><span style="color:#d1d5db;font-size:16px;">${emptyStars}</span>
    <span style="font-size:14px;font-weight:700;color:#18181b;">${rating}</span>
    <span style="font-size:12px;color:#71717a;">(${reviews} reviews)</span>
  </div>` : ""}
  <div style="padding:12px 16px;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;margin-bottom:14px;">
    <div style="font-size:11px;font-weight:800;color:#c2410c;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">Referral Reward</div>
    <div style="font-size:26px;font-weight:900;color:#18181b;line-height:1;">${fee}</div>
    <div style="font-size:12px;color:#92400e;margin-top:4px;">per customer you refer</div>
  </div>
  <a href="${referUrl}" target="_blank" rel="noopener" style="display:block;text-align:center;padding:12px;background:#f97316;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:800;font-size:15px;">Become a Referrer &rarr;</a>
</div>
<!-- End TradeRefer Badge -->`;
}

function TrustBadgePreview({ fee }: { fee: string }) {
    return (
        <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="inline-flex items-center gap-3 px-5 py-3.5 bg-white border-2 border-orange-500 rounded-xl no-underline shadow-lg shadow-orange-100 select-none cursor-default"
            style={{ fontFamily: "system-ui, sans-serif" }}
        >
            <Shield className="w-5 h-5 text-orange-500 shrink-0" />
            <div className="border-r border-zinc-200 pr-3">
                <div className="font-extrabold text-zinc-900 text-sm leading-tight">Verified Partner</div>
                <div className="text-xs font-semibold text-zinc-400 leading-tight mt-0.5">TradeRefer</div>
            </div>
            <div>
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-tight">Refer &amp; Earn</div>
                <div className="text-lg font-black text-orange-500 leading-tight">{fee}</div>
            </div>
        </a>
    );
}

function MinimalBadgePreview({ fee }: { fee: string }) {
    return (
        <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-300 rounded-lg no-underline cursor-default select-none"
            style={{ fontFamily: "system-ui, sans-serif" }}
        >
            <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
            <span className="text-sm font-bold text-amber-900">
                Proud partner of TradeRefer — Refer a customer, earn {fee} →
            </span>
        </a>
    );
}

function ProfileCardPreview({ business, fee }: { business: BusinessData; fee: string }) {
    const rating = business.avg_rating ? business.avg_rating.toFixed(1) : "5.0";
    const reviews = business.total_reviews || 0;
    const name = business.business_name || "My Business";

    return (
        <div
            className="w-[300px] p-5 bg-white border-2 border-zinc-200 rounded-2xl select-none"
            style={{ fontFamily: "system-ui, sans-serif" }}
        >
            <div className="flex items-center gap-3 mb-4">
                {business.logo_url ? (
                    <img src={business.logo_url} alt={name} className="w-12 h-12 rounded-xl object-cover border border-zinc-200" />
                ) : (
                    <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center text-white font-black text-xl shrink-0">
                        {name.charAt(0)}
                    </div>
                )}
                <div>
                    <div className="font-extrabold text-zinc-900 text-base leading-tight">{name}</div>
                    <div className="text-xs text-zinc-400 mt-0.5">Find us on TradeRefer</div>
                </div>
            </div>
            {reviews > 0 && (
                <div className="flex items-center gap-1.5 mb-4">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < Math.round(Number(rating)) ? "fill-amber-400 text-amber-400" : "fill-zinc-200 text-zinc-200"}`} />
                    ))}
                    <span className="text-sm font-bold text-zinc-900">{rating}</span>
                    <span className="text-xs text-zinc-400">({reviews})</span>
                </div>
            )}
            <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl mb-4">
                <div className="text-[10px] font-black text-orange-700 uppercase tracking-wider mb-1">Referral Reward</div>
                <div className="text-2xl font-black text-zinc-900 leading-none">{fee}</div>
                <div className="text-xs text-orange-700 mt-1">per customer you refer</div>
            </div>
            <div className="block text-center py-3 bg-orange-500 text-white rounded-xl font-bold text-sm">
                Become a Referrer →
            </div>
        </div>
    );
}

export default function BadgeGeneratorPage() {
    const { getToken } = useAuth();
    const [business, setBusiness] = useState<BusinessData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedStyle, setSelectedStyle] = useState<BadgeStyle>("trust");
    const [copied, setCopied] = useState(false);

    const fetchBusiness = useCallback(async () => {
        try {
            const token = await getToken();
            const res = await fetch("/api/backend/business/dashboard", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setBusiness(data.business);
        } catch {
            toast.error("Failed to load business data");
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    useEffect(() => { fetchBusiness(); }, [fetchBusiness]);

    const badgeHtml = business ? generateBadgeHtml(selectedStyle, business) : "";
    const fee = formatFee(business?.referral_fee_cents ?? null);

    const handleCopy = () => {
        if (!badgeHtml) return;
        navigator.clipboard.writeText(badgeHtml);
        setCopied(true);
        toast.success("Badge code copied to clipboard!");
        setTimeout(() => setCopied(false), 2500);
    };

    const handleDownload = () => {
        if (!badgeHtml) return;
        const blob = new Blob([badgeHtml], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `traderefer-badge-${selectedStyle}.html`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Badge code downloaded!");
    };

    if (loading) {
        return (
            <DashboardPage className="pt-20 flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </DashboardPage>
        );
    }

    if (!business) {
        return (
            <DashboardPage className="pt-20">
                <div className="max-w-lg mx-auto text-center py-20">
                    <p className="text-zinc-500 font-medium">Business profile not found.</p>
                    <Link href="/dashboard/business" className="text-orange-500 font-bold mt-2 inline-block">← Back to dashboard</Link>
                </div>
            </DashboardPage>
        );
    }

    return (
        <DashboardPage className="pt-20 pb-16">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center gap-4 pt-4">
                    <Link href="/dashboard/business" className="flex items-center gap-1.5 text-sm font-bold text-zinc-400 hover:text-zinc-900 transition-colors">
                        <ChevronLeft className="w-4 h-4" /> Dashboard
                    </Link>
                </div>

                <div className="space-y-2">
                    <DashboardEyebrow>Partner Badge</DashboardEyebrow>
                    <DashboardTitle>Add Your TradeRefer Badge</DashboardTitle>
                    <DashboardSubtitle>
                        Add this badge to your website to let visitors become referrers — and earn {fee} every time they send you a customer.
                    </DashboardSubtitle>
                </div>

                {/* No referral fee warning */}
                {!business.referral_fee_cents && (
                    <DashboardAccentCard>
                        <div className="flex items-start gap-3">
                            <Sparkles className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-zinc-900 text-sm">Set your referral reward to get the most from your badge</p>
                                <p className="text-sm text-zinc-500 mt-1">
                                    You haven&apos;t set a referral price yet. Businesses with a reward shown on the badge get 3× more referrer signups.{" "}
                                    <Link href="/dashboard/business/settings" className="text-orange-600 font-bold hover:underline">
                                        Set it now →
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </DashboardAccentCard>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Left: Style selector + code */}
                    <div className="space-y-4">

                        {/* Style Selector */}
                        <DashboardSection>
                            <DashboardSectionHeader>
                                <DashboardSectionTitle>Choose a style</DashboardSectionTitle>
                                <DashboardSectionDescription>All styles link directly to your referrer signup page.</DashboardSectionDescription>
                            </DashboardSectionHeader>
                            <div className="space-y-2 mt-3">
                                {BADGE_STYLES.map((style) => (
                                    <button
                                        key={style.id}
                                        onClick={() => setSelectedStyle(style.id)}
                                        className={`w-full text-left flex items-start gap-3 p-4 rounded-2xl border-2 transition-all ${
                                            selectedStyle === style.id
                                                ? "border-orange-500 bg-orange-50/50"
                                                : "border-zinc-200 bg-white hover:border-zinc-300"
                                        }`}
                                    >
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                            selectedStyle === style.id ? "bg-orange-500 text-white" : "bg-zinc-100 text-zinc-500"
                                        }`}>
                                            {style.icon}
                                        </div>
                                        <div>
                                            <p className={`font-bold text-sm ${selectedStyle === style.id ? "text-orange-600" : "text-zinc-900"}`}>
                                                {style.label}
                                            </p>
                                            <p className="text-xs text-zinc-500 mt-0.5">{style.description}</p>
                                        </div>
                                        {selectedStyle === style.id && (
                                            <Check className="w-4 h-4 text-orange-500 ml-auto shrink-0 mt-1" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </DashboardSection>

                        {/* Badge Code */}
                        <DashboardSection>
                            <DashboardSectionHeader>
                                <DashboardSectionTitle>Your badge code</DashboardSectionTitle>
                                <DashboardSectionDescription>Paste this HTML anywhere on your website.</DashboardSectionDescription>
                            </DashboardSectionHeader>
                            <div className="mt-3 rounded-2xl border border-zinc-200 bg-zinc-950 overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800">
                                    <div className="flex items-center gap-2">
                                        <Code2 className="w-4 h-4 text-zinc-400" />
                                        <span className="text-xs font-bold text-zinc-400">HTML</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleDownload}
                                            className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-zinc-200 transition-colors"
                                        >
                                            <Download className="w-3.5 h-3.5" /> Download
                                        </button>
                                        <button
                                            onClick={handleCopy}
                                            className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${copied ? "text-green-400" : "text-zinc-400 hover:text-zinc-200"}`}
                                        >
                                            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                            {copied ? "Copied!" : "Copy"}
                                        </button>
                                    </div>
                                </div>
                                <pre className="p-4 text-xs text-zinc-300 overflow-x-auto leading-relaxed whitespace-pre-wrap break-all">
                                    {badgeHtml}
                                </pre>
                            </div>
                            <Button
                                onClick={handleCopy}
                                className="w-full mt-3 h-12 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-base shadow-lg shadow-orange-500/20"
                            >
                                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                                {copied ? "Copied to Clipboard!" : "Copy Badge Code"}
                            </Button>
                        </DashboardSection>

                    </div>

                    {/* Right: Preview + instructions */}
                    <div className="space-y-4">

                        {/* Live Preview */}
                        <DashboardSection>
                            <DashboardSectionHeader>
                                <DashboardSectionTitle>Preview</DashboardSectionTitle>
                                <DashboardSectionDescription>This is exactly how your badge will look.</DashboardSectionDescription>
                            </DashboardSectionHeader>
                            <div className="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 flex items-center justify-center min-h-[180px]">
                                {selectedStyle === "trust" && <TrustBadgePreview fee={fee} />}
                                {selectedStyle === "minimal" && <MinimalBadgePreview fee={fee} />}
                                {selectedStyle === "profile" && <ProfileCardPreview business={business} fee={fee} />}
                            </div>
                        </DashboardSection>

                        {/* Installation Guide */}
                        <DashboardSection>
                            <DashboardSectionHeader>
                                <DashboardSectionTitle>Where to add it</DashboardSectionTitle>
                                <DashboardSectionDescription>The more visible your badge, the more referrers you&apos;ll get.</DashboardSectionDescription>
                            </DashboardSectionHeader>
                            <div className="mt-3 space-y-2">
                                {[
                                    {
                                        location: "Website footer",
                                        tip: "Best placement — every page shows it to all visitors.",
                                        recommended: true,
                                    },
                                    {
                                        location: "Contact page",
                                        tip: "Visitors on this page are already engaged with your business.",
                                        recommended: true,
                                    },
                                    {
                                        location: "Partners page",
                                        tip: "Ideal for the Profile Card style — shows full credibility.",
                                        recommended: false,
                                    },
                                    {
                                        location: "Blog / news posts",
                                        tip: "Good for generating referrers from content readers.",
                                        recommended: false,
                                    },
                                ].map((item) => (
                                    <div key={item.location} className="flex items-start gap-3 p-3 rounded-xl bg-white border border-zinc-100">
                                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${item.recommended ? "bg-orange-500" : "bg-zinc-300"}`} />
                                        <div>
                                            <p className="text-sm font-bold text-zinc-900">
                                                {item.location}
                                                {item.recommended && (
                                                    <span className="ml-2 text-[10px] font-black text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                                                        Recommended
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-xs text-zinc-500 mt-0.5">{item.tip}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </DashboardSection>

                        {/* Referral page link */}
                        <DashboardDarkCard>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-1">Your Referrer Signup Page</p>
                                    <p className="text-sm font-bold text-white break-all">
                                        traderefer.au/b/{business.slug}/refer
                                    </p>
                                    <p className="text-xs text-zinc-400 mt-2">This is where the badge links to. Share this URL directly too.</p>
                                </div>
                                <Link
                                    href={`/b/${business.slug}/refer`}
                                    target="_blank"
                                    className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-orange-300 transition-colors mt-1"
                                >
                                    Preview <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </DashboardDarkCard>

                    </div>
                </div>

                {/* How it works */}
                <DashboardCard className="mt-2">
                    <h3 className="text-base font-black text-zinc-900 mb-4">How the badge works</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            {
                                step: "1",
                                title: "Visitor sees the badge",
                                body: "Someone visits your website, sees your TradeRefer partner badge in the footer or contact page.",
                            },
                            {
                                step: "2",
                                title: "They click and sign up as a referrer",
                                body: `They're taken to your TradeRefer profile where they see they can earn ${fee} for every customer they send you.`,
                            },
                            {
                                step: "3",
                                title: "You get more customers",
                                body: "Every time they refer someone who becomes a customer, you pay them and gain a new client. No monthly fees.",
                            },
                        ].map((item) => (
                            <div key={item.step} className="flex items-start gap-3">
                                <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                                    {item.step}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-zinc-900">{item.title}</p>
                                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{item.body}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </DashboardCard>

            </div>
        </DashboardPage>
    );
}
