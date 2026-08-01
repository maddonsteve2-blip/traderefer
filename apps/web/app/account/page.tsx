import type { Metadata } from "next";
import { UserProfile } from '@clerk/nextjs';

export const metadata: Metadata = {
    title: "Account | TradeRefer",
    description: "Manage your TradeRefer account.",
    robots: { index: false, follow: true },
};

export default async function AccountPage() {
    return (
        <main className="container mx-auto py-24 flex justify-center min-h-[70vh]">
            <UserProfile routing="hash" />
        </main>
    );
}
