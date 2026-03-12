"use client";

import { useState } from "react";
import { Star, ChevronDown, ChevronUp } from "lucide-react";

interface Review {
    profile_name: string;
    rating: number;
    review_text: string;
}

interface ReviewsSectionProps {
    reviews: Review[];
    googleRating: number | null;
    reviewCount: number;
}

const INITIAL_COUNT = 4;

export function ReviewsSection({ reviews, googleRating, reviewCount }: ReviewsSectionProps) {
    const [expanded, setExpanded] = useState(false);

    const visible = expanded ? reviews : reviews.slice(0, INITIAL_COUNT);
    const hasMore = reviews.length > INITIAL_COUNT;

    if (reviews.length === 0) return null;

    return (
        <div className="bg-white rounded-[32px] border-2 border-zinc-200 p-8 shadow-sm mb-0">
            <div className="flex items-center justify-between mb-6">
                <h2 className="font-black text-zinc-900" style={{ fontSize: '24px' }}>What Customers Say</h2>
                {googleRating && (
                    <div className="flex items-center gap-2">
                        <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                        <span className="font-black text-zinc-900" style={{ fontSize: '20px' }}>{googleRating.toFixed(1)}</span>
                        <span className="font-bold text-zinc-400" style={{ fontSize: '18px' }}>({reviewCount})</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {visible.map((r, i) => (
                    <div key={i} className="p-6 bg-zinc-50 rounded-2xl border-2 border-zinc-100/50 shadow-sm">
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="flex items-center gap-0.5">
                                {[...Array(5)].map((_, j) => (
                                    <Star key={j} className={`w-4.5 h-4.5 ${j < r.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-zinc-200 text-zinc-200'}`} />
                                ))}
                            </div>
                            <span className="font-black text-zinc-700" style={{ fontSize: '18px' }}>{r.profile_name}</span>
                        </div>
                        <p className="text-zinc-600 font-bold leading-relaxed" style={{ fontSize: '17px', lineHeight: 1.7 }}>{r.review_text}</p>
                    </div>
                ))}
            </div>

            {hasMore && (
                <button
                    onClick={() => setExpanded(prev => !prev)}
                    className="mt-6 flex items-center gap-2 mx-auto font-black text-orange-600 hover:text-orange-700 transition-all active:scale-95"
                    style={{ fontSize: '18px' }}
                >
                    {expanded ? (
                        <><ChevronUp className="w-5 h-5" /> Show fewer reviews</>
                    ) : (
                        <><ChevronDown className="w-5 h-5" /> Show all {reviews.length} reviews</>
                    )}
                </button>
            )}
        </div>
    );
}
