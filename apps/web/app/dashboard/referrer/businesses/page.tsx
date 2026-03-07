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
        <div className="min-h-screen bg-zinc-50">
            <div className="w-full px-6 py-6">

                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                    <Link
                        href="/dashboard/referrer"
                        className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-700 transition-colors font-bold"
                        style={{ fontSize: '16px' }}
                    >
                        <ArrowLeft className="w-4 h-4" /> Dashboard
                    </Link>
                    <span className="text-zinc-300">/</span>
                    <span className="text-zinc-700 font-bold" style={{ fontSize: '16px' }}>Find Businesses</span>
                </div>

                <div className="mb-5">
                    <h1 className="font-black text-zinc-900 flex items-center gap-3" style={{ fontSize: '28px' }}>
                        <Search className="w-7 h-7 text-orange-500" /> Find Businesses to Refer
                    </h1>
                    <p className="text-zinc-500 font-medium mt-1" style={{ fontSize: '17px' }}>
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
