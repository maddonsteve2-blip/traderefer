import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Sign up | TradeRefer",
    description: "Create a TradeRefer account.",
    robots: { index: false, follow: true },
};

export default function SignupRedirect() {
    redirect("/register");
}
