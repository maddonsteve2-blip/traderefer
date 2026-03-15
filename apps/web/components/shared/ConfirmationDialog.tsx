"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, HelpCircle, Loader2 } from "lucide-react";

interface ConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "destructive" | "warning" | "info";
    isLoading?: boolean;
}

export function ConfirmationDialog({
    open,
    onOpenChange,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "info",
    isLoading = false
}: ConfirmationDialogProps) {
    const Icon = variant === "destructive" ? Trash2 : variant === "warning" ? AlertTriangle : HelpCircle;
    const iconColor = variant === "destructive" ? "text-red-600" : variant === "warning" ? "text-orange-600" : "text-blue-600";
    const iconBg = variant === "destructive" ? "bg-red-100" : variant === "warning" ? "bg-orange-100" : "bg-blue-100";
    const buttonClass = variant === "destructive" ? "bg-red-600 hover:bg-red-700 shadow-red-500/20" : variant === "warning" ? "bg-orange-600 hover:bg-orange-700 shadow-orange-500/20" : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md rounded-[40px] border-none shadow-2xl p-8 bg-white">
                <DialogHeader className="flex flex-col items-center">
                    <div className={`w-20 h-20 ${iconBg} rounded-[32px] flex items-center justify-center mb-6`}>
                        <Icon className={`w-10 h-10 ${iconColor}`} />
                    </div>
                    <DialogTitle className="text-3xl font-black text-center text-zinc-900 font-display leading-tight">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-center text-zinc-500 font-medium text-lg mt-3 leading-relaxed">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="flex flex-col sm:flex-row gap-4 mt-8 sm:justify-center">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="w-full sm:w-auto rounded-full px-8 py-7 h-auto text-lg font-bold text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition-colors"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        onClick={() => {
                            onConfirm();
                        }}
                        disabled={isLoading}
                        className={`w-full sm:min-w-[160px] rounded-full px-10 py-7 h-auto text-lg font-black text-white shadow-xl active:scale-95 transition-all ${buttonClass}`}
                    >
                        {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
