"use client";

import { useState, useRef, useEffect, useCallback } from "react";

/**
 * Adaptive Logo Display System
 *
 * Automatically makes any logo look polished regardless of whether it's
 * dark, light, transparent, or padded — no manual configuration required.
 *
 * - Proxy layer: all external URLs fetched server-side via /api/logo-proxy
 * - Pixel analysis: canvas samples 64×64 to measure luminance, transparency, edge brightness
 * - Adaptive background: white / off-white / dark charcoal per logo
 * - Auto-crop: strips built-in padding so every logo fills its container uniformly
 */

type LogoSize = "xs" | "sm" | "md" | "lg" | "xl" | "full" | "round-sm" | "round-md" | "round-lg";

interface BusinessLogoProps {
    logoUrl: string | null;
    name: string;
    size?: LogoSize;
    photoUrls?: string[];
    className?: string;
}

const SIZE_CONFIG: Record<LogoSize, { container: string; fallbackText: string }> = {
    "xs":       { container: "w-8 h-8 rounded-lg",      fallbackText: "text-xs" },
    "sm":       { container: "w-10 h-10 rounded-xl",     fallbackText: "text-sm" },
    "md":       { container: "w-14 h-14 rounded-xl",     fallbackText: "text-xl" },
    "lg":       { container: "w-20 h-20 rounded-2xl",    fallbackText: "text-3xl" },
    "xl":       { container: "w-28 h-28 rounded-2xl",    fallbackText: "text-4xl" },
    "full":     { container: "w-full h-full rounded-2xl", fallbackText: "text-5xl" },
    "round-sm": { container: "w-10 h-10 rounded-full",   fallbackText: "text-sm" },
    "round-md": { container: "w-12 h-12 rounded-full",   fallbackText: "text-lg" },
    "round-lg": { container: "w-16 h-16 rounded-full",   fallbackText: "text-2xl" },
};

function getProxyUrl(url: string | null): string | null {
    if (!url) return null;
    const safe = url.replace(/^http:\/\//i, "https://");
    // Already a local/relative URL — no proxy needed
    if (safe.startsWith("/")) return safe;
    // Proxy all external URLs to bypass CORS
    return `/api/logo-proxy?url=${encodeURIComponent(safe)}`;
}

interface AnalysisResult {
    bg: string;          // tailwind-style bg class or inline style
    bgColor: string;     // actual hex colour
    cropBox: { sx: number; sy: number; sw: number; sh: number } | null;
}

function analyzeImage(img: HTMLImageElement): AnalysisResult {
    // ── Step 1: Sample at 64×64 for luminance / transparency ──
    const SAMPLE = 64;
    const sCanvas = document.createElement("canvas");
    sCanvas.width = SAMPLE;
    sCanvas.height = SAMPLE;
    const sCtx = sCanvas.getContext("2d", { willReadFrequently: true })!;
    sCtx.drawImage(img, 0, 0, SAMPLE, SAMPLE);
    const sData = sCtx.getImageData(0, 0, SAMPLE, SAMPLE).data;

    let totalLum = 0;
    let transparentPx = 0;
    let edgeLum = 0;
    let edgeCount = 0;
    const total = SAMPLE * SAMPLE;

    for (let i = 0; i < sData.length; i += 4) {
        const r = sData[i], g = sData[i + 1], b = sData[i + 2], a = sData[i + 3];
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

        if (a < 20) {
            transparentPx++;
        } else {
            totalLum += lum * (a / 255);
        }

        // Edge pixels (outer 4px ring)
        const px = (i / 4) % SAMPLE;
        const py = Math.floor((i / 4) / SAMPLE);
        if (px < 4 || px >= SAMPLE - 4 || py < 4 || py >= SAMPLE - 4) {
            edgeLum += lum * (a / 255);
            edgeCount++;
        }
    }

    const opaquePx = total - transparentPx;
    const avgLum = opaquePx > 0 ? totalLum / opaquePx : 0.5;
    const avgEdgeLum = edgeCount > 0 ? edgeLum / edgeCount : 0.5;
    const transparencyRatio = transparentPx / total;

    // ── Step 2: Pick adaptive background ──
    let bgColor: string;
    if (transparencyRatio > 0.15) {
        // Transparent logo — pick based on content brightness
        if (avgLum > 0.75 || avgEdgeLum > 0.8) {
            bgColor = "#1c1c1e"; // dark charcoal for light/white logos
        } else if (avgLum < 0.3) {
            bgColor = "#ffffff"; // white for dark logos
        } else {
            bgColor = "#f5f5f4"; // off-white (stone-100) for mid-tones
        }
    } else {
        // Solid background logo
        if (avgEdgeLum > 0.85) {
            bgColor = "#ffffff"; // already light bg, keep white
        } else if (avgEdgeLum < 0.2) {
            bgColor = "#1c1c1e"; // dark bg logo
        } else {
            bgColor = "#f5f5f4"; // neutral
        }
    }

    // ── Step 3: Auto-crop at full resolution ──
    let cropBox: AnalysisResult["cropBox"] = null;
    const fw = img.naturalWidth;
    const fh = img.naturalHeight;

    if (fw > 0 && fh > 0 && fw <= 4096 && fh <= 4096) {
        const fCanvas = document.createElement("canvas");
        fCanvas.width = fw;
        fCanvas.height = fh;
        const fCtx = fCanvas.getContext("2d", { willReadFrequently: true })!;
        fCtx.drawImage(img, 0, 0);
        const fData = fCtx.getImageData(0, 0, fw, fh).data;

        let minX = fw, minY = fh, maxX = 0, maxY = 0;
        const threshold = 10; // alpha threshold for content pixels

        for (let y = 0; y < fh; y++) {
            for (let x = 0; x < fw; x++) {
                const idx = (y * fw + x) * 4;
                const a = fData[idx + 3];
                if (a > threshold) {
                    // For solid bg logos, also check if pixel differs from corner
                    if (transparencyRatio < 0.15) {
                        const r = fData[idx], g = fData[idx + 1], b = fData[idx + 2];
                        const cr = fData[0], cg = fData[1], cb = fData[2];
                        const diff = Math.abs(r - cr) + Math.abs(g - cg) + Math.abs(b - cb);
                        if (diff < 30) continue; // same as corner bg — skip
                    }
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }
        }

        if (maxX > minX && maxY > minY) {
            const cw = maxX - minX + 1;
            const ch = maxY - minY + 1;
            // Only crop if we'd remove at least 15% of the image (meaningful padding)
            if (cw * ch < fw * fh * 0.85) {
                // Add 4% padding around the crop
                const padX = Math.round(cw * 0.04);
                const padY = Math.round(ch * 0.04);
                cropBox = {
                    sx: Math.max(0, minX - padX),
                    sy: Math.max(0, minY - padY),
                    sw: Math.min(fw - Math.max(0, minX - padX), cw + padX * 2),
                    sh: Math.min(fh - Math.max(0, minY - padY), ch + padY * 2),
                };
            }
        }
    }

    return { bg: "", bgColor, cropBox };
}

export function BusinessLogo({ logoUrl, name, size = "md", photoUrls, className = "" }: BusinessLogoProps) {
    const [failed, setFailed] = useState(false);
    const [bgColor, setBgColor] = useState<string>("#f0f0f0");
    const [croppedSrc, setCroppedSrc] = useState<string | null>(null);
    const [analyzed, setAnalyzed] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);
    const config = SIZE_CONFIG[size] || SIZE_CONFIG.md;
    const proxyUrl = getProxyUrl(logoUrl);

    const onLoad = useCallback(() => {
        const img = imgRef.current;
        if (!img || analyzed) return;

        try {
            const result = analyzeImage(img);
            setBgColor(result.bgColor);

            // Render cropped version if needed
            if (result.cropBox) {
                const { sx, sy, sw, sh } = result.cropBox;
                const canvas = document.createElement("canvas");
                canvas.width = sw;
                canvas.height = sh;
                const ctx = canvas.getContext("2d")!;
                ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
                setCroppedSrc(canvas.toDataURL("image/png"));
            }

            setAnalyzed(true);
        } catch {
            // Canvas analysis failed (rare) — keep defaults
            setAnalyzed(true);
        }
    }, [analyzed]);

    // Fallback: letter avatar
    if (!proxyUrl || failed) {
        return (
            <div className={`${config.container} bg-gradient-to-br from-zinc-200 to-zinc-100 flex items-center justify-center font-black text-zinc-500 overflow-hidden border border-zinc-200/60 ${className}`}>
                <span className={`${config.fallbackText} select-none uppercase`}>{name?.[0] || "?"}</span>
            </div>
        );
    }

    return (
        <div
            className={`${config.container} overflow-hidden border border-zinc-200/40 shadow-sm flex items-center justify-center transition-colors duration-300 ${className}`}
            style={{ backgroundColor: bgColor }}
        >
            {/* Hidden image for analysis (always loads original) */}
            <img
                ref={imgRef}
                src={proxyUrl}
                alt=""
                crossOrigin="anonymous"
                onLoad={onLoad}
                onError={() => setFailed(true)}
                className="hidden"
            />
            {/* Visible: cropped or original */}
            <img
                src={croppedSrc || proxyUrl}
                alt={name}
                className={`max-w-[85%] max-h-[85%] object-contain transition-opacity duration-300 ${analyzed ? "opacity-100" : "opacity-0"}`}
                onError={() => setFailed(true)}
            />
        </div>
    );
}
