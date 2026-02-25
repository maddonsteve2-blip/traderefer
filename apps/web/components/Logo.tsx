import Image from "next/image";

interface LogoProps {
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    variant?: "full" | "icon-only" | "white" | "orange";
    showText?: boolean;
    className?: string;
}

const sizeMap = {
    xs: { icon: 36, text: "text-sm", gap: "gap-1" },
    sm: { icon: 50, text: "text-xl", gap: "gap-1.5" },
    md: { icon: 64, text: "text-2xl", gap: "gap-2" },
    lg: { icon: 82, text: "text-3xl", gap: "gap-2.5" },
    xl: { icon: 108, text: "text-5xl", gap: "gap-3" },
};

function LogoIcon({ size = 28, alt = "TradeRefer" }: { size?: number; alt?: string }) {
    return (
        <Image
            src="/logo.svg"
            alt={alt}
            width={size}
            height={size}
            className="rounded-lg"
            priority
        />
    );
}

export function Logo({ size = "md", variant = "full", showText, className = "" }: LogoProps) {
    const s = sizeMap[size];
    const isIconOnly = variant === "icon-only" || showText === false;

    if (isIconOnly) {
        return <LogoIcon size={s.icon} />;
    }

    const textClassName = variant === "white" ? "text-white" : variant === "orange" ? "text-orange-500" : "text-zinc-900";

    return (
        <span className={`inline-flex items-center ${s.gap} ${className}`}>
            <LogoIcon size={s.icon} />
            <span className={`${s.text} font-extrabold tracking-tight leading-none ${textClassName}`}>
                <span className={variant === "orange" ? "text-zinc-900" : ""}>Trade</span>
                <span className={variant === "orange" ? "text-orange-500" : ""}>Refer</span>
            </span>
        </span>
    );
}
