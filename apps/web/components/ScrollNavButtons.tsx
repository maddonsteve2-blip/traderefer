"use client";

interface ScrollNavButtonsProps {
    hasServices: boolean;
    hasGallery: boolean;
    hasReviews: boolean;
}

export function ScrollNavButtons({ hasServices, hasGallery, hasReviews }: ScrollNavButtonsProps) {
    const scrollTo = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    return (
        <div className="flex flex-wrap gap-2 mb-4">
            <button
                onClick={() => scrollTo("about")}
                className="px-4 py-2 bg-white border border-zinc-200 rounded-full text-sm font-bold text-zinc-600 hover:border-orange-300 hover:text-orange-600 transition-all shadow-sm"
            >
                About
            </button>
            {hasServices && (
                <button
                    onClick={() => scrollTo("services")}
                    className="px-4 py-2 bg-white border border-zinc-200 rounded-full text-sm font-bold text-zinc-600 hover:border-orange-300 hover:text-orange-600 transition-all shadow-sm"
                >
                    Services
                </button>
            )}
            {hasGallery && (
                <button
                    onClick={() => scrollTo("gallery")}
                    className="px-4 py-2 bg-white border border-zinc-200 rounded-full text-sm font-bold text-zinc-600 hover:border-orange-300 hover:text-orange-600 transition-all shadow-sm"
                >
                    Gallery
                </button>
            )}
            {hasReviews && (
                <button
                    onClick={() => scrollTo("reviews")}
                    className="px-4 py-2 bg-white border border-zinc-200 rounded-full text-sm font-bold text-zinc-600 hover:border-orange-300 hover:text-orange-600 transition-all shadow-sm"
                >
                    Reviews
                </button>
            )}
            <button
                onClick={() => scrollTo("enquiry-form")}
                className="px-4 py-2 bg-orange-500 border border-orange-500 rounded-full text-sm font-black text-white hover:bg-orange-600 transition-all shadow-sm"
            >
                Get a Quote
            </button>
        </div>
    );
}
