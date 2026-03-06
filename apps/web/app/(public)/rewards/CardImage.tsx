"use client";

export default function CardImage({ src, alt }: { src: string; alt: string }) {
    return (
        <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
                (e.currentTarget.closest("a") as HTMLElement | null)?.style.setProperty("display", "none");
            }}
        />
    );
}
