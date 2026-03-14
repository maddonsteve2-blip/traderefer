/**
 * Generate a unique, natural-sounding fallback description for businesses
 * that don't have a custom description yet. Uses real data to avoid
 * sounding programmatic.
 */
export function generateFallbackDescription(biz: {
    business_name: string;
    trade_category: string;
    suburb?: string;
    city?: string;
    state?: string;
    years_experience?: string | number;
    avg_rating?: string | number;
    total_reviews?: string | number;
    is_verified?: boolean;
    abn?: string;
}): string {
    const name = biz.business_name;
    const trade = (biz.trade_category || "trade").toLowerCase();
    const suburb = biz.suburb || "";
    const city = biz.city || "";
    const years = parseInt(String(biz.years_experience || "0"));
    const rating = parseFloat(String(biz.avg_rating || "0"));
    const reviews = parseInt(String(biz.total_reviews || "0"));
    const verified = biz.is_verified;
    const hasAbn = !!biz.abn;

    const parts: string[] = [];

    // Opening — vary based on what data we have
    if (years > 0 && suburb) {
        parts.push(`${name} has been providing ${trade} services in ${suburb} for over ${years} year${years === 1 ? "" : "s"}.`);
    } else if (suburb) {
        parts.push(`${name} is a local ${trade} business based in ${suburb}${city ? `, ${city}` : ""}.`);
    } else {
        parts.push(`${name} provides professional ${trade} services in the local area.`);
    }

    // Rating line — only if real reviews exist
    if (rating >= 4.0 && reviews >= 3) {
        parts.push(`Rated ${rating.toFixed(1)} stars from ${reviews} Google review${reviews === 1 ? "" : "s"}.`);
    } else if (rating > 0 && reviews > 0) {
        parts.push(`Rated ${rating.toFixed(1)} on Google with ${reviews} review${reviews === 1 ? "" : "s"}.`);
    }

    // Trust signal
    if (verified && hasAbn) {
        parts.push("ABN-verified and community-referred on TradeRefer.");
    } else if (hasAbn) {
        parts.push("ABN-verified on TradeRefer.");
    }

    return parts.join(" ");
}

/**
 * Clean a website URL for display — show domain only, strip protocol/www/UTM
 */
export function cleanWebsiteUrl(url: string): string {
    try {
        const u = new URL(url.startsWith("http") ? url : `https://${url}`);
        return u.hostname.replace(/^www\./, "");
    } catch {
        return url
            .replace(/^https?:\/\//, "")
            .replace(/^www\./, "")
            .split("?")[0]
            .replace(/\/$/, "");
    }
}
