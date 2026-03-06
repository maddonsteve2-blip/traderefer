"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { InviteFriendsDialog } from "@/components/referrer/InviteFriendsDialog";

export function InviteButtonTrigger() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
            >
                <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                </div>
                Invite Friends
            </button>
            <InviteFriendsDialog open={open} onOpenChange={setOpen} />
        </>
    );
}
