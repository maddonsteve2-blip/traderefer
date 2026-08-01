import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
    title: "Claim Your Business Profile | TradeRefer",
    description: "Find your business on TradeRefer and claim your free profile — respond to reviews, update details and receive referral leads.",
    alternates: { canonical: "https://traderefer.au/claim" },
};

export default function ClaimLayout({ children }: { children: ReactNode }) {
    return children;
}
