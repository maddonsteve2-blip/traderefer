"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { HubTabBar } from "@/components/business/HubTabBar";
import { ForcePartnersPane } from "@/components/business/ForcePartnersPane";
import { ForceApplicationsPane } from "@/components/business/ForceApplicationsPane";
import { ForceConfigPane } from "@/components/business/ForceConfigPane";

const TABS = [
    { key: "partners", label: "Active Referrers" },
    { key: "applications", label: "Applications" },
    { key: "config", label: "Program Settings" },
];

function ForceHubInner() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const tab = searchParams.get("tab") ?? "partners";

    const setTab = (key: string) => {
        router.replace(`/dashboard/business/force?tab=${key}`);
    };

    return (
        <div className="min-h-[100dvh] flex flex-col bg-zinc-50 md:h-screen md:overflow-hidden">
            <HubTabBar tabs={TABS} active={tab} onChange={setTab} />
            {tab === "partners" && <ForcePartnersPane />}
            {tab === "applications" && <ForceApplicationsPane />}
            {tab === "config" && <ForceConfigPane />}
        </div>
    );
}

export default function ForceHubPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-screen">
                <div className="w-10 h-10 border-[3px] border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <ForceHubInner />
        </Suspense>
    );
}
