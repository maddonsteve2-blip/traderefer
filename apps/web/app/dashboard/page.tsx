import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardRedirect() {
    const { userId, getToken } = await auth();

    if (!userId) {
        redirect("/login");
    }

    const token = await getToken();
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    let destination = "/onboarding";

    try {
        const res = await fetch(`${apiBase}/auth/status`, {
            cache: "no-store",
            headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
            const data = await res.json();

            if (data.has_business) {
                destination = "/dashboard/business";
            } else if (data.has_referrer) {
                destination = "/dashboard/referrer";
            }
        }
    } catch (err) {
        console.error("Auth status check failed:", err);
    }

    redirect(destination);
}
