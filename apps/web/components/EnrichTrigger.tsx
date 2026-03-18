"use client";

import { useEffect } from "react";

interface BusinessToEnrich {
    id: string;
    business_name: string;
    suburb: string;
    state: string;
    slug: string;
}

/**
 * Invisible client component that fires enrichment requests from the browser.
 * Placed on listing/directory pages. Enriches up to 3 businesses per page load
 * that don't have photos yet. Results appear on next page load.
 */
export function EnrichTrigger({ businesses }: { businesses: BusinessToEnrich[] }) {
    useEffect(() => {
        if (!businesses.length) return;

        // Stagger requests to avoid hammering the API
        businesses.forEach((biz, i) => {
            setTimeout(() => {
                fetch("/api/enrich-business", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        businessId: biz.id,
                        businessName: biz.business_name,
                        suburb: biz.suburb,
                        state: biz.state,
                        slug: biz.slug,
                        currentPhotoCount: 0,
                        hasEditorialDescription: false,
                    }),
                }).catch(() => {});
            }, i * 2000); // 2 second gap between each
        });
    }, [businesses]);

    return null; // Renders nothing
}
