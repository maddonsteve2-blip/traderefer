"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function BusinessCampaignsPage() {
    const router = useRouter();
    useEffect(() => { router.replace("/dashboard/business/sales?tab=promotions"); }, [router]);
    return null;
}
