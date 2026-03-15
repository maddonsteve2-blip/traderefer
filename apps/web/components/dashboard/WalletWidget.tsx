"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { TopUpDialog } from "./TopUpDialog";
import { useLiveEvent } from "@/hooks/useLiveEvents";
import { useAuth } from "@clerk/nextjs";

interface WalletWidgetProps {
    currentBalance: number;
}

export function WalletWidget({ currentBalance }: WalletWidgetProps) {
    const [open, setOpen] = useState(false);
    const [balance, setBalance] = useState(currentBalance);
    const { getToken } = useAuth();

    // SSE: live-update balance when wallet changes (topup, lead unlock)
    useLiveEvent("wallet_updated", async (event) => {
        if (event.payload.new_balance_cents != null) {
            setBalance(Number(event.payload.new_balance_cents));
        } else {
            // Re-fetch if no balance in payload
            try {
                const token = await getToken();
                const res = await fetch("/api/backend/business/me", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setBalance(data.wallet_balance_cents ?? balance);
                }
            } catch {}
        }
    });

    return (
        <>
            <Button
                onClick={() => setOpen(true)}
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 text-white rounded-full font-bold shrink-0 text-lg h-11 px-5"
            >
                <Wallet className="w-5 h-5 mr-1.5" /> Top Up
            </Button>
            <TopUpDialog
                open={open}
                onOpenChange={setOpen}
                currentBalance={balance}
                onTopUpSuccess={(newBalance) => setBalance(newBalance)}
            />
        </>
    );
}
