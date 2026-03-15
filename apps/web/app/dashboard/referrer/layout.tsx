import { HelpButton } from '@/components/tour/HelpButton';

export default function ReferrerDashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            <HelpButton tourName="referrer-main" />
        </>
    );
}
