'use client';

export const dynamic = "force-dynamic";

import { Suspense } from 'react';
import { MessagesView } from '@/components/dashboard/MessagesView';
import { MobileReferrerInbox } from '@/components/referrer/MobileReferrerInbox';

export default function ReferrerMessagesPage() {
    return (
        <>
            <MobileReferrerInbox />
            <div className="hidden lg:flex flex-col bg-zinc-50 h-[calc(100dvh-56px)] lg:h-screen overflow-hidden">
                <div className="flex items-center justify-between px-6 pt-5 pb-0 shrink-0">
                    <div>
                        <h1 className="text-2xl font-black text-zinc-900">Messages</h1>
                        <p className="text-sm font-medium text-zinc-500 mt-0.5">Chat with businesses you&apos;re partnered with.</p>
                    </div>
                </div>
                <div className="flex flex-1 min-h-0">
                    <Suspense fallback={<div className="flex items-center justify-center h-[600px] w-full"><div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" /></div>}>
                        <MessagesView role="referrer" />
                    </Suspense>
                </div>
            </div>
        </>
    );
}
