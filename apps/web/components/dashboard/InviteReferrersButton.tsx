"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { InviteReferrersDialog } from "./InviteReferrersDialog";

interface InviteReferrersButtonProps {
    businessName: string;
    slug: string;
}

export function InviteReferrersButton({ businessName, slug }: InviteReferrersButtonProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button
                onClick={() => setOpen(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-6 flex items-center gap-2 h-10 text-base font-bold shadow-md shadow-orange-200 transition-all active:scale-95"
            >
                <Users className="w-4 h-4" /> Invite Referrers
            </Button>
            <InviteReferrersDialog
                open={open}
                onClose={() => setOpen(false)}
                businessName={businessName}
                slug={slug}
            />
        </>
    );
}
