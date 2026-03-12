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
                className="rounded-full px-8 h-14 text-2xl font-bold border-orange-200 text-orange-600 hover:bg-orange-50 flex items-center gap-2 transition-all"
            >
                <Gift className="w-5 h-5" /> Invite &amp; Earn
            </Button>
            <BusinessInviteDialog open={open} onOpenChange={setOpen} />
        </>
    );
}
