"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { HubTabBar } from "@/components/business/HubTabBar";
import { SalesLeadsPane } from "@/components/business/SalesLeadsPane";
import { SalesOffersPane } from "@/components/business/SalesOffersPane";
import { SalesPromotionsPane } from "@/components/business/SalesPromotionsPane";

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
        <div className="min-h-[100dvh] flex flex-col bg-zinc-50 md:h-screen md:overflow-hidden">
            <HubTabBar tabs={TABS} active={tab} onChange={setTab} />
            {tab === "leads" && <SalesLeadsPane />}
            {tab === "offers" && <SalesOffersPane />}
            {tab === "promotions" && <SalesPromotionsPane />}
        </div>
    );
}

export default function SalesHubPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-screen">
                <div className="w-10 h-10 border-[3px] border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <SalesHubInner />
        </Suspense>
    );
}
