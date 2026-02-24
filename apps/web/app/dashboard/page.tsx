import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardRedirect() {
    const { userId, getToken } = await auth();

    if (!userId) {
        redirect("/login");
    }

    const token = await getToken();
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    try {
        const res = await fetch(`${apiBase}/auth/status`, {
            cache: "no-store",
            headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
            const data = await res.json();

            // Has a business account — go to business dashboard
            if (data.has_business) {
                redirect("/dashboard/business");
            }

            // Has a referrer account — go to referrer dashboard
            if (data.has_referrer) {
                redirect("/dashboard/referrer");
            }
        }
    } catch (err) {
        console.error("Auth status check failed:", err);
    }

    // No role found — new user, send to onboarding
    redirect("/onboarding");
}
