import * as React from "react";
import { cn } from "@/lib/utils";

export function DashboardPage({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("min-h-screen bg-zinc-100 px-4 pb-4 md:px-6 md:pb-6 xl:px-10", className)}
            {...props}
        />
    );
}

export function DashboardPageHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "rounded-[28px] border border-white/70 bg-white/95 px-6 py-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur md:px-8 md:py-7",
                className,
            )}
            {...props}
        />
    );
}

export function DashboardEyebrow({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
    return (
        <p
            className={cn("text-xs font-extrabold uppercase tracking-[0.18em] text-orange-500", className)}
            {...props}
        />
    );
}

export function DashboardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h1
            className={cn("text-3xl font-black tracking-[-0.04em] text-zinc-950 md:text-4xl", className)}
            {...props}
        />
    );
}

export function DashboardSubtitle({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
    return (
        <p
            className={cn("max-w-3xl text-base font-medium leading-7 text-zinc-500 md:text-lg", className)}
            {...props}
        />
    );
}

export function DashboardGrid({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("mt-4 flex flex-col gap-4 xl:mt-5 xl:flex-row xl:gap-0", className)}
            {...props}
        />
    );
}

export function DashboardPanel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.06)]",
                className,
            )}
            {...props}
        />
    );
}

export function DashboardPanelBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("px-4 pb-20 pt-6 md:px-6 md:pt-8 xl:px-8", className)}
            {...props}
        />
    );
}

export function DashboardStickyFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("border-t border-zinc-200 bg-white px-4 pb-8 pt-5 md:px-6 xl:px-8", className)}
            {...props}
        />
    );
}

export function DashboardSection({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
    return <section className={cn("space-y-6", className)} {...props} />;
}

export function DashboardSectionHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("space-y-2", className)} {...props} />;
}

export function DashboardSectionTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return <h2 className={cn("text-lg font-bold text-zinc-900", className)} {...props} />;
}

export function DashboardSectionDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
    return <p className={cn("text-sm font-medium text-zinc-500", className)} {...props} />;
}

export function DashboardCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-200/40", className)}
            {...props}
        />
    );
}

export function DashboardMutedCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("rounded-[28px] border border-zinc-200 bg-zinc-50 p-6", className)} {...props} />;
}

export function DashboardAccentCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("rounded-[28px] border border-orange-200 bg-orange-50/70 p-6", className)}
            {...props}
        />
    );
}

export function DashboardDarkCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("rounded-[28px] bg-zinc-950 p-6 text-white", className)} {...props} />;
}

export function DashboardBadge({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-sm font-bold text-orange-700",
                className,
            )}
            {...props}
        />
    );
}
