"use client";

import { useState } from "react";
import { Copy, Check, QrCode, ExternalLink, Users, Building2, Store, X } from "lucide-react";
import { toast } from "sonner";

const PREZZEE_LOGO = "/images/prezzee/prezzee-logo.svg";

interface SharingStripProps {
    slug: string;
    businessName: string;
}

interface Tile {
    key: string;
    title: string;
    subtitle: string;
    url: string;
    icon: React.ElementType;
    style: "dark" | "orange" | "white";
    badge?: React.ReactNode;
}

function QRModal({ url, label, onClose }: { url: string; label: string; onClose: () => void }) {
    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=000000&margin=4`;

    const handleDownload = async () => {
        try {
            const res = await fetch(qrSrc);
            const blob = await res.blob();
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `${label.replace(/\s+/g, "-").toLowerCase()}-qr.png`;
            a.click();
            toast.success("QR code downloaded");
        } catch {
            window.open(qrSrc, "_blank");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white rounded-3xl p-8 max-w-xs w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                    <h3 className="font-black text-zinc-900" style={{ fontSize: 24 }}>{label}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-xl transition-colors">
                        <X className="w-6 h-6 text-zinc-400" />
                    </button>
                </div>
                <div className="bg-zinc-50 rounded-2xl p-4 mb-5 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrSrc} alt="QR Code" className="w-56 h-56 rounded-xl" />
                </div>
                <p className="text-zinc-500 font-medium text-center mb-5 break-all" style={{ fontSize: 20 }}>{url}</p>
                <button
                    onClick={handleDownload}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-2xl py-4 font-bold transition-all flex items-center justify-center gap-2"
                    style={{ fontSize: 22, height: 64 }}
                >
                    <QrCode className="w-5 h-5" /> Download QR PNG
                </button>
            </div>
        </div>
    );
}

function SharingTile({ tile }: { tile: Tile }) {
    const [copied, setCopied] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const Icon = tile.icon;

    const handleCopy = async () => {
        await navigator.clipboard.writeText(tile.url);
        setCopied(true);
        toast.success("Link copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

    const isDark = tile.style === "dark";
    const isOrange = tile.style === "orange";

    const containerClass = isDark
        ? "bg-[#111827] border-[#1f2937]"
        : isOrange
        ? "bg-white border-2 border-orange-500"
        : "bg-white border-zinc-200";

    const titleColor = isDark ? "text-white" : isOrange ? "text-orange-600" : "text-zinc-900";
    const subtitleColor = isDark ? "text-zinc-400" : isOrange ? "text-orange-500" : "text-zinc-500";
    const iconBg = isDark ? "bg-white/10" : isOrange ? "bg-orange-50" : "bg-orange-50";
    const iconColor = isDark ? "text-white" : "text-orange-500";
    const urlBg = isDark ? "bg-white/10" : isOrange ? "bg-orange-50" : "bg-zinc-50";
    const urlColor = isDark ? "text-zinc-300" : isOrange ? "text-orange-500" : "text-zinc-500";
    const btnClass = isDark
        ? "bg-white/10 hover:bg-white/20 text-white border-white/10"
        : isOrange
        ? "bg-orange-50 hover:bg-orange-100 text-orange-600 border-orange-200"
        : "bg-zinc-50 hover:bg-orange-50 text-zinc-600 hover:text-orange-600 border-zinc-200";

    const displayUrl = tile.url.replace("https://", "").replace("http://", "");

    return (
        <>
            <div className={`rounded-3xl border p-6 flex flex-col gap-4 transition-all shadow-sm hover:shadow-md ${containerClass}`} style={{ minHeight: 170 }}>
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                            <Icon className={`w-6 h-6 ${iconColor}`} />
                        </div>
                        <div>
                            <h3 className={`font-black leading-tight ${titleColor}`} style={{ fontSize: 24 }}>{tile.title}</h3>
                            {tile.badge ? tile.badge : (
                                <p className={`font-medium mt-0.5 ${subtitleColor}`} style={{ fontSize: 20 }}>{tile.subtitle}</p>
                            )}
                        </div>
                    </div>
                    <a href={tile.url} target="_blank" rel="noopener noreferrer" className={`p-2 rounded-xl border transition-all shrink-0 ${btnClass}`} aria-label="Open">
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>

                {/* URL pill */}
                <div className={`rounded-xl px-3 py-2 ${urlBg}`}>
                    <p className={`font-mono font-bold truncate ${urlColor}`} style={{ fontSize: 20 }}>{displayUrl}</p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 mt-auto">
                    <button
                        onClick={handleCopy}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-bold transition-all ${btnClass}`}
                        style={{ fontSize: 20, height: 56 }}
                    >
                        {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                        {copied ? "Copied!" : "Copy Link"}
                    </button>
                    <button
                        onClick={() => setShowQR(true)}
                        className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl border font-bold transition-all ${btnClass}`}
                        style={{ fontSize: 20, height: 56 }}
                    >
                        <QrCode className="w-5 h-5" />
                        QR
                    </button>
                </div>
            </div>

            {showQR && <QRModal url={tile.url} label={tile.title} onClose={() => setShowQR(false)} />}
        </>
    );
}

export function SharingStrip({ slug, businessName }: SharingStripProps) {
    const base = "https://traderefer.au";

    const tiles: Tile[] = [
        {
            key: "storefront",
            title: "Your Public Profile",
            subtitle: "Send to customers for trust & bookings",
            url: `${base}/b/${slug}`,
            icon: Store,
            style: "dark",
        },
        {
            key: "referrer",
            title: "Recruit a Partner",
            subtitle: "Earn Prezzee rewards for each active referrer",
            url: `${base}/onboarding/referrer?invite=${slug}`,
            icon: Users,
            style: "orange",
            badge: (
                <div className="flex items-center gap-1.5 mt-0.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={PREZZEE_LOGO} alt="Prezzee" className="h-4 w-auto opacity-70" />
                    <span className="text-orange-500 font-bold" style={{ fontSize: 20 }}>Earn $25 per 5 active</span>
                </div>
            ),
        },
        {
            key: "b2b",
            title: "Invite a Business",
            subtitle: "Cross-refer jobs with other trades",
            url: `${base}/onboarding/business?invite=${slug}`,
            icon: Building2,
            style: "white",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {tiles.map(tile => (
                <SharingTile key={tile.key} tile={tile} />
            ))}
        </div>
    );
}
