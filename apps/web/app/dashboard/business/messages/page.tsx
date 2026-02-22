'use client';

import { Suspense } from 'react';
import { MessagesView } from '@/components/dashboard/MessagesView';

export default function BusinessMessagesPage() {
    return (
        <div className="fixed inset-0 top-16 flex flex-col overflow-hidden">
            <Suspense fallback={<div className="flex items-center justify-center h-[600px]"><div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" /></div>}>
                <MessagesView />
            </Suspense>
        </div>
    );
}
