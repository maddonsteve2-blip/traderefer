import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminSidebar";

async function checkAdmin() {
    const { userId, getToken } = await auth();
    if (!userId) redirect("/login");
    
    const token = await getToken();
    if (!token) redirect("/login");

    // Verify admin role via API
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
    });

    if (!res.ok) {
        redirect("/dashboard");
    }

    return true;
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    await checkAdmin();

    return <AdminShell>{children}</AdminShell>;
}
