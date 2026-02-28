const LOGO_PROXY_BASE = "https://traderefer-api-production.up.railway.app";

export function proxyLogoUrl(logoUrl: string | null | undefined): string | null {
    if (!logoUrl) return null;
    if (logoUrl.includes("googleusercontent.com")) {
        return `${LOGO_PROXY_BASE}/logo-proxy?url=${encodeURIComponent(logoUrl)}`;
    }
    return logoUrl;
}
