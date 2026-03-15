'use client';

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState } from 'react';
import { MessagesView } from '@/components/dashboard/MessagesView';
import { MobileBusinessMessages } from '@/components/business/MobileBusinessMessages';

export default function BusinessMessagesPage() {
    const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

    useEffect(() => {
        const update = () => setIsDesktop(window.innerWidth >= 1024);
        update();
        const mq = window.matchMedia('(min-width: 1024px)');
        mq.addEventListener('change', e => setIsDesktop(e.matches));
        return () => mq.removeEventListener('change', e => setIsDesktop(e.matches));
    }, []);

    if (isDesktop === null) {
        return (
            <div className="flex items-center justify-center h-screen bg-zinc-50">
                <div className="w-10 h-10 border-[3px] border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!isDesktop) {
        return <MobileBusinessMessages />;
    }

    return (
        <div className="flex flex-col bg-zinc-50 h-screen overflow-hidden">
            <div className="flex flex-1 min-h-0">
                <Suspense fallback={<div className="flex items-center justify-center h-[600px] w-full"><div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" /></div>}>
                    <MessagesView role="business" />
                </Suspense>
            </div>
        </div>
    );
}
