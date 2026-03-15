import { HelpButton } from '@/components/tour/HelpButton';

export default function BusinessDashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            <HelpButton tourName="business-main" />
        </>
    );
}
