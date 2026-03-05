"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Gift } from "lucide-react";
import { BusinessInviteDialog } from "./BusinessInviteDialog";

export function BusinessInviteButton() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button
                onClick={() => setOpen(true)}
                variant="outline"
                className="rounded-full px-6 h-10 text-base font-bold border-orange-200 text-orange-600 hover:bg-orange-50 flex items-center gap-2 transition-all"
            >
                <Gift className="w-4 h-4" /> Invite &amp; Earn
            </Button>
            <BusinessInviteDialog open={open} onOpenChange={setOpen} />
        </>
    );
}
