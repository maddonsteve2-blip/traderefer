"use client";

import { Loader2 } from "lucide-react";
import { Suspense } from "react";
import { MessagesView } from "@/components/dashboard/MessagesView";

interface MobileReferrerInboxProps {
    loading?: boolean;
}

export function MobileReferrerInbox({ loading }: MobileReferrerInboxProps) {
    if (loading) {
        return (
            <div className="lg:hidden h-40 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="lg:hidden flex flex-col min-h-screen bg-white">
            <div className="flex-1">
                <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>}>
                    <MessagesView role="referrer" />
                </Suspense>
            </div>
        </div>
    );
}
