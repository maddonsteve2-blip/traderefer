"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function BusinessTeamPage() {
    const router = useRouter();
    useEffect(() => { router.replace("/dashboard/business/force?tab=applications"); }, [router]);
    return null;
}
