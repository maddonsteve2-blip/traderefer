import { Metadata } from "next";
import type { ReactNode } from "react";
import { buildOgImageUrl } from "@/lib/og-image";

const compareOgImage = buildOgImageUrl({
    template: "home",
    title: "Compare trade lead models",
    subtitle: "See how monthly lead spend compares with TradeRefer's profile and referral flow.",
    eyebrow: "TradeRefer comparison",
    badge: "For trade businesses",
    stat1: "No monthly listing fee",
    stat2: "Referral terms shown",
    stat3: "Direct enquiries",
});

export const metadata: Metadata = {
    title: "Compare Trade Lead Models | TradeRefer",
    description: "Compare traditional lead-site costs with TradeRefer's no-monthly-fee business profiles, direct enquiries, and referral lead terms.",
    alternates: { canonical: "https://traderefer.au/compare" },
    openGraph: {
        title: "Compare Trade Lead Models | TradeRefer",
        description: "Compare monthly lead-site costs with TradeRefer's profile and referral flow.",
        url: "https://traderefer.au/compare",
        siteName: "TradeRefer",
        type: "website",
        images: [{ url: compareOgImage, width: 1200, height: 630, alt: "TradeRefer comparison page" }],
    },
    twitter: {
        card: "summary_large_image",
        title: "Compare Trade Lead Models | TradeRefer",
        description: "Compare monthly lead-site costs with TradeRefer's profile and referral flow.",
        images: [compareOgImage],
    },
};

export default function CompareLayout({ children }: { children: ReactNode }) {
    return children;
}
