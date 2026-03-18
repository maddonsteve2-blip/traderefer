import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminSidebar";

async function checkAdmin() {
    const { userId, getToken } = await auth();
    if (!userId) redirect("/login");
    
    const token = await getToken();
    if (!token) redirect("/login");

    // Log Clerk userId for admin setup (check Vercel logs)
    console.log(`[Admin] Clerk userId: ${userId}`);

    // Check admin via local env var first (fast, no network call)
    const adminIds = (process.env.ADMIN_CLERK_IDS || "").split(",").map(s => s.trim()).filter(Boolean);
    const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(s => s.trim()).filter(Boolean);
    
    if (adminIds.includes(userId)) return true;

    // Fallback: verify via Railway API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    try {
        const res = await fetch(`${apiUrl}/admin/stats`, {
            headers: { 'Authorization': `Bearer ${token}` },
            cache: 'no-store'
        });

        if (!res.ok) {
            const body = await res.text().catch(() => "");
            console.error(`[Admin] Auth check failed: ${res.status} | userId: ${userId} | Body: ${body.slice(0, 200)}`);
            redirect("/dashboard");
        }
    } catch (err: any) {
        console.error(`[Admin] Auth check error: ${err.message} | userId: ${userId}`);
        redirect("/dashboard");
    }

    return true;
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    await checkAdmin();

    return <AdminShell>{children}</AdminShell>;
}
