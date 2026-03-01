import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    const { sessionClaims } = await auth();

    const role = sessionClaims?.metadata?.role;

    if (role === "referrer") {
        redirect("/dashboard/referrer");
    }

    redirect("/dashboard/business");
}
