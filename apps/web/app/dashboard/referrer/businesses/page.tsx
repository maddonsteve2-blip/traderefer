import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { BusinessBrowser } from "@/components/referrer/BusinessBrowser";
import { MobileReferrerNetwork } from "@/components/referrer/MobileReferrerNetwork";
import { PageTransition } from "@/components/ui/PageTransition";

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
        <PageTransition>
            <MobileReferrerNetwork />
            <div className="hidden lg:flex flex-col bg-zinc-50 h-screen overflow-hidden">
                <div className="flex items-center justify-between px-6 pt-5 pb-0 shrink-0">
                    <div>
                        <h1 className="text-2xl font-black text-zinc-900">Network</h1>
                        <p className="text-sm font-medium text-zinc-500 mt-0.5">
                            {suburb
                                ? `Showing businesses near ${suburb} first — grab a referral link and start earning.`
                                : "Browse verified businesses and grab referral links to start earning."}
                        </p>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    <BusinessBrowser initialSuburb={suburb} initialState={state} />
                </div>
            </div>
        </PageTransition>
    );
}
