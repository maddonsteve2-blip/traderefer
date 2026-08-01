import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
    title: "Support & Help Centre | TradeRefer",
    description: "Get help with TradeRefer — business listings, referrals, quotes and account questions. Contact our Australian support team.",
    alternates: { canonical: "https://traderefer.au/support" },
};

export default function SupportLayout({ children }: { children: ReactNode }) {
    return children;
}
