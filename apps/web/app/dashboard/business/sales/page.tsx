"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { HubTabBar } from "@/components/business/HubTabBar";
import { SalesLeadsPane } from "@/components/business/SalesLeadsPane";
import { SalesOffersPane } from "@/components/business/SalesOffersPane";
import { SalesPromotionsPane } from "@/components/business/SalesPromotionsPane";
import { MobileBusinessLeads } from "@/components/business/MobileBusinessLeads";
import { MobileBusinessDeals } from "@/components/business/MobileBusinessDeals";
import { MobileBusinessCampaigns } from "@/components/business/MobileBusinessCampaigns";
import { PageTransition } from "@/components/ui/PageTransition";

const TABS = [
    { key: "leads", label: "Leads" },
    { key: "offers", label: "Deals" },
    { key: "promotions", label: "Campaigns" },
];

function SalesHubInner() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const tab = searchParams.get("tab") ?? "leads";

    const setTab = (key: string) => {
        router.replace(`/dashboard/business/sales?tab=${key}`);
    };

    return (
        <PageTransition className="min-h-[100dvh] flex flex-col bg-zinc-50 md:h-screen md:overflow-hidden">
            <div className="hidden lg:flex items-center justify-between px-6 pt-5 pb-0">
                <div>
                    <h1 className="text-2xl font-black text-zinc-900">Leads</h1>
                    <p className="text-sm font-medium text-zinc-500 mt-0.5">Incoming leads, deals in progress, and active referrer campaigns.</p>
                </div>
            </div>
            <div>
                <HubTabBar tabs={TABS} active={tab} onChange={setTab} />
            </div>

            <div className="md:hidden flex-1 overflow-y-auto">
                {tab === "leads" && <MobileBusinessLeads />}
                {tab === "offers" && <MobileBusinessDeals />}
                {tab === "promotions" && <MobileBusinessCampaigns />}
            </div>

            <div className="hidden md:block flex-1 overflow-hidden">
                {tab === "leads" && <SalesLeadsPane />}
                {tab === "offers" && <SalesOffersPane />}
                {tab === "promotions" && <SalesPromotionsPane />}
            </div>
        </PageTransition>
    );
}

export default function SalesHubPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-screen bg-zinc-50">
                <div className="w-12 h-12 border-[4px] border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <SalesHubInner />
        </Suspense>
    );
}
