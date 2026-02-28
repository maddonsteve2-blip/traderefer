const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function proxyLogoUrl(logoUrl: string | null | undefined): string | null {
    if (!logoUrl) return null;
    if (logoUrl.includes("googleusercontent.com")) {
        return `${API_BASE}/logo-proxy?url=${encodeURIComponent(logoUrl)}`;
    }
    return logoUrl;
}
