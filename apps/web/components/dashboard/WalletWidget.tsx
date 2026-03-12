"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { TopUpDialog } from "./TopUpDialog";

interface WalletWidgetProps {
    currentBalance: number;
}

export function WalletWidget({ currentBalance }: WalletWidgetProps) {
    const [open, setOpen] = useState(false);
    const [balance, setBalance] = useState(currentBalance);

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
