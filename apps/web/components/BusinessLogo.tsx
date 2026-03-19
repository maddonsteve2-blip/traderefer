"use client";

import { useState, useRef, useEffect } from "react";

/**
 * Adaptive Logo Display System
 *
 * Pixel-perfect port of the reference implementation at upload-image/logo-test.
 * Automatically makes any logo look polished — no manual configuration required.
 *
 * - Proxy layer: all external URLs fetched server-side via /api/logo-proxy
 * - Pixel analysis at 64×64: luminance (0-255), transparency (5%), edge dark/light ratio
 * - Adaptive background: 3-tier for transparent logos, dominantEdge for solid logos
 * - Auto-crop: isEmpty() function, 10% padding threshold, 5% crop padding
 */

type LogoSize = "xs" | "sm" | "md" | "lg" | "xl" | "full";

interface BusinessLogoProps {
    logoUrl: string | null;
    name: string;
    size?: LogoSize;
    photoUrls?: string[];
    className?: string;
    bgColor?: string | null;
}

interface SizeSpec {
    w: number; h: number; radius: number; padding: number; fallbackText: string;
}

const SIZE_CONFIG: Record<LogoSize, SizeSpec> = {
    xs:   { w: 56,  h: 36,  radius: 8,  padding: 4,  fallbackText: "text-xs" },
    sm:   { w: 96,  h: 56,  radius: 10, padding: 6,  fallbackText: "text-sm" },
    md:   { w: 152, h: 84,  radius: 12, padding: 8,  fallbackText: "text-lg" },
    lg:   { w: 192, h: 108, radius: 14, padding: 8,  fallbackText: "text-2xl" },
    xl:   { w: 240, h: 136, radius: 16, padding: 10, fallbackText: "text-3xl" },
    full: { w: 0,   h: 0,   radius: 16, padding: 8,  fallbackText: "text-4xl" },
};

function getProxyUrl(url: string | null): string | null {
    if (!url) return null;
    const safe = url.replace(/^http:\/\//i, "https://");
    if (safe.startsWith("/") || safe.startsWith("data:")) return safe;
    return `/api/logo-proxy?url=${encodeURIComponent(safe)}`;
}

// ── Pixel analysis types ──

interface PixelStats {
    bg: string;
    luminance: number;
    hasTransparency: boolean;
    dominantEdge: "dark" | "light" | "mixed";
    croppedSrc: string | null;
}

/** Returns true if a pixel is considered "empty" — transparent or matching solid bg */
function isEmpty(r: number, g: number, b: number, a: number, solidBg: boolean, bgIsLight: boolean): boolean {
    if (a < 20) return true;
    if (!solidBg) return false;
    const lum = (r * 299 + g * 587 + b * 114) / 1000;
    if (bgIsLight && lum > 240) return true;
    if (!bgIsLight && lum < 15) return true;
    return false;
}

function analyzeImage(img: HTMLImageElement): PixelStats {
    // Draw at capped resolution for crop pass (max 400px)
    const scale = Math.min(1, 400 / Math.max(img.naturalWidth || 400, img.naturalHeight || 400));
    const w = Math.round((img.naturalWidth || 300) * scale);
    const h = Math.round((img.naturalHeight || 100) * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);

    // ── Pass 1: background / luminance analysis (sample at 64×64) ──
    const size = 64;
    const sCanvas = document.createElement("canvas");
    sCanvas.width = sCanvas.height = size;
    const sCtx = sCanvas.getContext("2d", { willReadFrequently: true })!;
    sCtx.drawImage(img, 0, 0, size, size);
    const sData = sCtx.getImageData(0, 0, size, size).data;

    let totalLuminance = 0, opaquePixels = 0, transparentPixels = 0;
    let edgeDark = 0, edgeLight = 0;

    // Build edge pixel index set (outer 3px ring)
    const edgeIndices = new Set<number>();
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < 3; y++) edgeIndices.add(y * size + x);
        for (let y = size - 3; y < size; y++) edgeIndices.add(y * size + x);
    }
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < 3; x++) edgeIndices.add(y * size + x);
        for (let x = size - 3; x < size; x++) edgeIndices.add(y * size + x);
    }

    for (let i = 0; i < sData.length; i += 4) {
        const r = sData[i], g = sData[i + 1], b = sData[i + 2], a = sData[i + 3];
        if (a < 30) { transparentPixels++; continue; }
        opaquePixels++;
        const lum = (r * 299 + g * 587 + b * 114) / 1000;
        totalLuminance += lum;
        const pi = i / 4;
        if (edgeIndices.has(pi)) lum < 128 ? edgeDark++ : edgeLight++;
    }

    const hasTransparency = transparentPixels > size * size * 0.05;
    const avgLuminance = opaquePixels > 0 ? totalLuminance / opaquePixels : 128;
    const dominantEdge: "dark" | "light" | "mixed" =
        edgeDark > edgeLight * 2 ? "dark" :
        edgeLight > edgeDark * 2 ? "light" : "mixed";

    // ── Background selection ──
    let bg: string;
    if (hasTransparency) {
        bg = avgLuminance > 200 ? "#1c1c1e" : avgLuminance > 128 ? "#2c2c2e" : "#ffffff";
    } else {
        // Solid logos: edges reveal the logo's own background — match it
        if (dominantEdge === "light") bg = "#f8f8f8";
        else if (dominantEdge === "dark") bg = "#1c1c1e";
        else bg = avgLuminance > 128 ? "#f8f8f8" : "#1c1c1e";
    }

    // ── Pass 2: find tight bounding box of content pixels ──
    const solidBg = !hasTransparency;
    const bgIsLight = bg === "#f8f8f8" || bg === "#ffffff" || bg === "#e8e8e8";

    let minX = w, maxX = 0, minY = h, maxY = 0;

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
            if (!isEmpty(r, g, b, a, solidBg, bgIsLight)) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }

    let croppedSrc: string | null = null;

    if (minX < maxX && minY < maxY) {
        const cropW = maxX - minX + 1;
        const cropH = maxY - minY + 1;
        const totalPixels = w * h;
        const contentPixels = cropW * cropH;
        const paddingRatio = 1 - contentPixels / totalPixels;

        // Only crop if there's meaningful padding (>10% wasted space)
        if (paddingRatio > 0.10) {
            const padding = Math.round(Math.min(cropW, cropH) * 0.05);
            const srcX = Math.max(0, minX - padding);
            const srcY = Math.max(0, minY - padding);
            const srcW = Math.min(w, maxX + padding + 1) - srcX;
            const srcH = Math.min(h, maxY + padding + 1) - srcY;

            const cropCanvas = document.createElement("canvas");
            cropCanvas.width = srcW;
            cropCanvas.height = srcH;
            const cropCtx = cropCanvas.getContext("2d")!;
            cropCtx.drawImage(canvas, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);
            croppedSrc = cropCanvas.toDataURL("image/png");
        }
    }

    return { bg, luminance: avgLuminance, hasTransparency, dominantEdge, croppedSrc };
}

// ── localStorage bg color cache ──
const BG_CACHE_PREFIX = "tr_lbg_";

function cacheKey(url: string): string {
    // Simple hash of URL for compact localStorage keys
    let h = 0;
    for (let i = 0; i < url.length; i++) h = ((h << 5) - h + url.charCodeAt(i)) | 0;
    return BG_CACHE_PREFIX + (h >>> 0).toString(36);
}

function getCachedBg(url: string): string | null {
    try { return localStorage.getItem(cacheKey(url)); } catch { return null; }
}

function setCachedBg(url: string, bg: string) {
    try { localStorage.setItem(cacheKey(url), bg); } catch { /* quota exceeded */ }
}

export function BusinessLogo({ logoUrl, name, size = "md", photoUrls, className = "", bgColor }: BusinessLogoProps) {
    const imgRef = useRef<HTMLImageElement>(null);
    const [stats, setStats] = useState<PixelStats | null>(null);
    const [error, setError] = useState(false);

    const config = SIZE_CONFIG[size] || SIZE_CONFIG.md;
    const proxyUrl = getProxyUrl(logoUrl);

    // Pre-computed bg: from DB prop → localStorage cache → null (needs analysis)
    const precomputedBg = bgColor || (logoUrl ? getCachedBg(logoUrl) : null);

    // Reset state when src changes
    useEffect(() => {
        setStats(null);
        setError(false);
    }, [logoUrl]);

    function handleLoad() {
        // Skip analysis entirely if we already have a bg color
        if (precomputedBg) return;
        const img = imgRef.current;
        if (!img) return;
        try {
            const result = analyzeImage(img);
            setStats(result);
            // Cache in localStorage for next visit
            if (logoUrl) setCachedBg(logoUrl, result.bg);
        } catch {
            setStats({ bg: "#e8e8e8", luminance: 128, hasTransparency: false, dominantEdge: "mixed", croppedSrc: null });
        }
    }

    const isFull = size === "full";
    const containerStyle: React.CSSProperties = isFull
        ? { width: "100%", height: "100%", borderRadius: config.radius }
        : { width: config.w, height: config.h, borderRadius: config.radius };

    // Fallback: TradeRefer logo
    if (!proxyUrl || error) {
        return (
            <div
                className={`bg-white flex items-center justify-center overflow-hidden shrink-0 ${className}`}
                style={{ ...containerStyle, border: "1px solid rgba(0,0,0,0.08)", padding: config.padding * 1.5, boxShadow: "0 1px 4px rgba(0,0,0,0.12)" }}
            >
                <img 
                    src="/logo.png" 
                    alt="TradeRefer" 
                    style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                />
            </div>
        );
    }

    // Use pre-computed bg (instant) or analyzed bg or neutral fallback
    const bg = precomputedBg || stats?.bg || "#e8e8e8";
    const isLight = bg === "#ffffff" || bg === "#f8f8f8" || bg === "#e8e8e8";
    const needsAnalysis = !precomputedBg;
    // When bg is pre-computed, load the original URL directly (faster, no proxy hop)
    // Only use proxy URL when we need CORS access for canvas analysis
    const directUrl = logoUrl?.replace(/^http:\/\//i, "https://") || proxyUrl;
    const displaySrc = stats?.croppedSrc ?? (needsAnalysis ? proxyUrl : directUrl);

    return (
        <div
            className={`flex items-center justify-center overflow-hidden shrink-0 transition-all duration-300 ${className}`}
            style={{
                ...containerStyle,
                backgroundColor: bg,
                boxShadow: isLight ? "0 1px 4px rgba(0,0,0,0.12)" : "0 1px 4px rgba(0,0,0,0.4)",
                border: isLight ? "1px solid rgba(0,0,0,0.08)" : "none",
                padding: config.padding,
                boxSizing: "border-box",
            }}
        >
            {/* Hidden image for pixel analysis — only needed when no pre-computed bg */}
            {needsAnalysis && (
                <img
                    ref={imgRef}
                    src={proxyUrl}
                    alt=""
                    crossOrigin="anonymous"
                    onLoad={handleLoad}
                    onError={() => setError(true)}
                    style={{ display: "none" }}
                />
            )}
            {/* Visible logo */}
            <img
                src={displaySrc}
                alt={name}
                loading="lazy"
                style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                    display: "block",
                    transition: "opacity 0.2s ease",
                }}
                onError={() => setError(true)}
            />
        </div>
    );
}
