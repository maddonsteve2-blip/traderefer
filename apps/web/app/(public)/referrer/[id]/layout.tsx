import type { Metadata } from "next";
import type { ReactNode } from "react";

// Public referrer profiles are thin, member-generated pages — keep them out
// of the index but let crawlers follow through to business profiles.
export const metadata: Metadata = {
    title: "Referrer Profile | TradeRefer",
    robots: { index: false, follow: true },
};

export default function ReferrerProfileLayout({ children }: { children: ReactNode }) {
    return children;
}
