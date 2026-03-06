"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import CardImage from "./CardImage";

const INITIAL_COUNT = 30; // 6 rows × 5 cols (lg breakpoint)

export default function CardGrid({ cards }: { cards: { name: string; url: string }[] }) {
    const [showAll, setShowAll] = useState(false);
    const visible = showAll ? cards : cards.slice(0, INITIAL_COUNT);

    return (
        <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {visible.map((card) => (
                    <Link
                        key={card.name}
                        href="/onboarding/referrer"
                        className="group relative rounded-2xl overflow-hidden aspect-[452/280] cursor-pointer shadow-sm hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 bg-zinc-100"
                    >
                        <CardImage src={card.url} alt={card.name} />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-1.5 p-3">
                            <span className="text-white font-black text-sm text-center leading-tight">Start earning</span>
                            <span className="text-[#FF6600] font-black text-xs flex items-center gap-1">
                                Join free <ArrowRight className="w-3 h-3" />
                            </span>
                        </div>
                    </Link>
                ))}
            </div>

            {!showAll && (
                <div className="flex justify-center mt-6">
                    <button
                        onClick={() => setShowAll(true)}
                        className="inline-flex items-center gap-2 bg-white border-2 border-zinc-200 hover:border-zinc-400 text-zinc-700 hover:text-zinc-900 font-black px-8 py-3 rounded-full text-sm transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                        Show all {cards.length} brands <ChevronDown className="w-4 h-4" />
                    </button>
                </div>
            )}
        </>
    );
}
