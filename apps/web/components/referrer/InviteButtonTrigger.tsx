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
                className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-all active:scale-[0.98] group"
                style={{ fontSize: '17px', fontWeight: 900 }}
            >
                <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors">
                    <Users className="w-5 h-5" />
                </div>
                Invite Friends
            </button>
            <InviteFriendsDialog open={open} onOpenChange={setOpen} />
        </>
    );
}
