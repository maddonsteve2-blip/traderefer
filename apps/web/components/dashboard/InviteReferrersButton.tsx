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
                className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-8 flex items-center gap-3 h-16 font-black shadow-lg shadow-orange-200 transition-all active:scale-95"
                style={{ fontSize: '20px' }}
            >
                <Users className="w-6 h-6" /> Invite Referrers
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
