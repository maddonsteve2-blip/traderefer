import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import { BusinessBrowser } from "@/components/referrer/BusinessBrowser";

async function getReferrerLocation(token: string) {
    try {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/referrer/me`,
            { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
        );
        if (!res.ok) return { suburb: null, state: null };
        const d = await res.json();
        return { suburb: d.suburb || null, state: d.state || null };
    } catch {
        return { suburb: null, state: null };
    }
}

export const metadata = {
    title: "Find Businesses | TradeRefer Dashboard",
};

export default async function DashboardBusinessesPage() {
    const { userId, getToken } = await auth();
    if (!userId) redirect("/login");
    const token = await getToken();
    if (!token) redirect("/login");

    const { suburb, state } = await getReferrerLocation(token);

    return (
        <div className="min-h-screen bg-zinc-50 pt-16">
            <div className="container mx-auto px-4 py-6 max-w-6xl">

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <Link
                        href="/dashboard/referrer"
                        className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-700 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Dashboard
                    </Link>
                    <span className="text-zinc-300">/</span>
                    <span className="text-zinc-700 font-semibold">Find Businesses</span>
                </div>

                <div className="mb-6">
                    <h1 className="text-2xl font-black text-zinc-900 flex items-center gap-2">
                        <Search className="w-6 h-6 text-orange-500" /> Find Businesses to Refer
                    </h1>
                    <p className="text-zinc-500 text-base mt-1">
                        {suburb
                            ? `Showing businesses near ${suburb} first — grab a referral link and start earning.`
                            : "Browse verified businesses and grab referral links to start earning."}
                    </p>
                </div>

                <BusinessBrowser initialSuburb={suburb} initialState={state} />

            </div>
        </div>
    );
}
