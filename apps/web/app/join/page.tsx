import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Join TradeRefer",
    description: "You've been invited to join TradeRefer — Australia's leading trade referral network.",
    robots: { index: false, follow: false },
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default async function JoinPage({
    searchParams,
}: {
    searchParams: Promise<{ invite?: string }>;
}) {
    const params = await searchParams;
    const inviteCode = params.invite || "";

    // If there's an invite code, try to resolve the invitation type and redirect
    if (inviteCode) {
        try {
            const res = await fetch(`${API}/invitations/resolve?code=${encodeURIComponent(inviteCode)}`, {
                cache: "no-store",
            });
            if (res.ok) {
                const data = await res.json();
                if (data.found) {
                    const type = data.invitation_type === "business" ? "business" : "referrer";
                    redirect(`/join/${type}?invite=${inviteCode}`);
                }
            }
        } catch {
            // Fall through to default
        }
    }

    // Default: redirect to referrer landing
    redirect(`/join/referrer${inviteCode ? `?invite=${inviteCode}` : ""}`);
}
