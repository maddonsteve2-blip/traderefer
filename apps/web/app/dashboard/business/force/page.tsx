"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
// Suspense is used in ForceHubPage wrapper below
import { HubTabBar } from "@/components/business/HubTabBar";
import { ForcePartnersPane } from "@/components/business/ForcePartnersPane";
import { ForceApplicationsPane } from "@/components/business/ForceApplicationsPane";
import { ForceConfigPane } from "@/components/business/ForceConfigPane";
import { MobileBusinessNetwork } from "@/components/business/MobileBusinessNetwork";
import { MobileBusinessApplications } from "@/components/business/MobileBusinessApplications";
import { MobileBusinessConfig } from "@/components/business/MobileBusinessConfig";
import { PageTransition } from "@/components/ui/PageTransition";

const TABS = [
    { key: "partners", label: "Partners" },
    { key: "applications", label: "Applications" },
    { key: "config", label: "Reward Structure" },
];

function ForceHubInner() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const tab = searchParams.get("tab") ?? "partners";
    const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

    useEffect(() => {
        const update = () => setIsDesktop(window.innerWidth >= 1024);
        update();
        const mq = window.matchMedia('(min-width: 1024px)');
        mq.addEventListener('change', e => setIsDesktop(e.matches));
        return () => mq.removeEventListener('change', e => setIsDesktop(e.matches));
    }, []);

    const setTab = (key: string) => {
        router.replace(`/dashboard/business/force?tab=${key}`);
    };

    return (
        <PageTransition className="flex flex-col bg-zinc-50 h-[calc(100dvh-56px)] lg:h-screen overflow-hidden">
            <div className="hidden lg:flex items-center justify-between px-6 pt-5 pb-0">
                <div>
                    <h1 className="text-2xl font-black text-zinc-900">Partners</h1>
                    <p className="text-sm font-medium text-zinc-500 mt-0.5">Manage your referrer network, applications, and reward structure.</p>
                </div>
            </div>
            <div>
                <HubTabBar tabs={TABS} active={tab} onChange={setTab} />
            </div>

            <div className="flex-1 overflow-hidden">
                {isDesktop === null && (
                    <div className="p-6 space-y-4">
                        <div className="flex gap-2">{[1,2,3].map(i => <div key={i} className="h-9 w-24 bg-zinc-100 rounded-xl animate-pulse" />)}</div>
                        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-2xl border border-zinc-200 animate-pulse" />)}</div>
                    </div>
                )}
                {isDesktop === false && (
                    <>
                        {tab === "partners" && <MobileBusinessNetwork />}
                        {tab === "applications" && <MobileBusinessApplications />}
                        {tab === "config" && <MobileBusinessConfig />}
                    </>
                )}
                {isDesktop === true && (
                    <>
                        {tab === "partners" && <ForcePartnersPane />}
                        {tab === "applications" && <ForceApplicationsPane />}
                        {tab === "config" && <ForceConfigPane />}
                    </>
                )}
            </div>
        </PageTransition>
    );
}

export default function ForceHubPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-zinc-50 p-6">
                <div className="space-y-4 max-w-5xl mx-auto pt-6">
                    <div className="h-7 w-32 bg-zinc-200 rounded-xl animate-pulse" />
                    <div className="flex gap-2">{[1,2,3].map(i => <div key={i} className="h-9 w-24 bg-zinc-100 rounded-xl animate-pulse" />)}</div>
                    <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-2xl border border-zinc-200 animate-pulse" />)}</div>
                </div>
            </div>
        }>
            <ForceHubInner />
        </Suspense>
    );
}
