"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function BusinessReferrersPage() {
    const router = useRouter();
    useEffect(() => { router.replace("/dashboard/business/force?tab=partners"); }, [router]);
    return null;
}
