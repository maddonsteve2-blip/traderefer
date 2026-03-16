import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { LiveEventsProvider } from "@/contexts/LiveEventsProvider";
import { NextStepWrapper } from "@/components/tour/NextStepWrapper";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <LiveEventsProvider>
            <NextStepWrapper>
                <DashboardShell>
                    {children}
                </DashboardShell>
            </NextStepWrapper>
        </LiveEventsProvider>
    );
}
