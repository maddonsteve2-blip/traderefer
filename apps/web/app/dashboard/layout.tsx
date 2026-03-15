import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { LiveEventsProvider } from "@/contexts/LiveEventsProvider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <LiveEventsProvider>
            <DashboardShell>
                {children}
            </DashboardShell>
        </LiveEventsProvider>
    );
}
