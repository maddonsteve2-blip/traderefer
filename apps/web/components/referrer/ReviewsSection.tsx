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
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm mb-0">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-black text-zinc-900" style={{ fontSize: '20px' }}>What Customers Say</h2>
                {googleRating && (
                    <div className="flex items-center gap-1.5">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-black text-zinc-900" style={{ fontSize: '18px' }}>{googleRating.toFixed(1)}</span>
                        <span className="font-bold text-zinc-400" style={{ fontSize: '16px' }}>({reviewCount})</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visible.map((r, i) => (
                    <div key={i} className="p-5 bg-zinc-50 rounded-xl border border-zinc-100">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-0.5">
                                {[...Array(5)].map((_, j) => (
                                    <Star key={j} className={`w-4 h-4 ${j < r.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-zinc-200 text-zinc-200'}`} />
                                ))}
                            </div>
                            <span className="font-black text-zinc-700" style={{ fontSize: '17px' }}>{r.profile_name}</span>
                        </div>
                        <p className="text-zinc-600 font-medium leading-relaxed" style={{ fontSize: '16px', lineHeight: 1.65 }}>{r.review_text}</p>
                    </div>
                ))}
            </div>

            {hasMore && (
                <button
                    onClick={() => setExpanded(prev => !prev)}
                    className="mt-4 flex items-center gap-1.5 mx-auto font-black text-orange-600 hover:text-orange-700 transition-colors"
                    style={{ fontSize: '16px' }}
                >
                    {expanded ? (
                        <><ChevronUp className="w-4 h-4" /> Show fewer reviews</>
                    ) : (
                        <><ChevronDown className="w-4 h-4" /> Show all {reviews.length} reviews</>
                    )}
                </button>
            )}
        </div>
    );
}
