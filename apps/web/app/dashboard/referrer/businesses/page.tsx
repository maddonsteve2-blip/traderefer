import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import Link from "next/link";
import { BusinessBrowser } from "@/components/referrer/BusinessBrowser";
import { MobileReferrerNetwork } from "@/components/referrer/MobileReferrerNetwork";

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
        <>
            <MobileReferrerNetwork />
            <div className="hidden lg:block min-h-screen bg-zinc-50">
                <div className="w-full px-6 py-6">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <Link
                            href="/dashboard/referrer"
                            className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-700 transition-colors font-bold text-lg"
                        >
                            <ArrowLeft className="w-4 h-4" /> Dashboard
                        </Link>
                        <span className="text-zinc-300">/</span>
                        <span className="text-zinc-700 font-bold text-lg">Network</span>
                    </div>

                    <div className="mb-6">
                        <h1 className="font-black text-zinc-900 flex items-center gap-3 text-3xl">
                            <Building2 className="w-8 h-8 text-orange-500" /> Network
                        </h1>
                        <p className="text-zinc-500 font-medium mt-1 text-xl">
                            {suburb
                                ? `Showing businesses near ${suburb} first — grab a referral link and start earning.`
                                : "Browse verified businesses and grab referral links to start earning."}
                        </p>
                    </div>

                    <BusinessBrowser initialSuburb={suburb} initialState={state} />
                </div>
            </div>
        </>
    );
}
