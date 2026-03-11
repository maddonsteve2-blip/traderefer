"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function BusinessDealsPage() {
    const router = useRouter();
    useEffect(() => { router.replace("/dashboard/business/sales?tab=offers"); }, [router]);
    return null;
}
