import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardRolePicker } from "@/components/dashboard/DashboardRolePicker";

export default async function DashboardPage() {
    const { sessionClaims } = await auth();

    const meta = sessionClaims?.metadata as { role?: string; roles?: string[] } | undefined;
    const role = meta?.role;
    const roles = meta?.roles ?? (role ? [role] : []);

    const hasReferrer = roles.includes("referrer");
    const hasBusiness = roles.includes("business");

    if (hasReferrer && hasBusiness) {
        return <DashboardRolePicker />;
    }

    if (hasReferrer) {
        redirect("/dashboard/referrer");
    }

    redirect("/dashboard/business");
}
