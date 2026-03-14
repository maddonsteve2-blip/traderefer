"use client";

import { useState } from "react";
import { Star, ChevronLeft, ChevronRight, MessageSquarePlus } from "lucide-react";

interface Review {
    id: string;
    profile_name: string;
    rating: number;
    review_text: string;
    owner_answer?: string;
}

interface ReviewSectionProps {
    reviews: Review[];
    avgRating: number | null;
    totalReviews: number;
    businessName: string;
    businessSlug: string;
}

export function ReviewSection({ reviews, avgRating, totalReviews, businessName, businessSlug }: ReviewSectionProps) {
    const [page, setPage] = useState(0);
    const perPage = 3;
    const totalPages = Math.ceil(reviews.length / perPage);
    const visible = reviews.slice(page * perPage, page * perPage + perPage);

    // Compute rating distribution
    const distribution = [5, 4, 3, 2, 1].map(star => {
        const count = reviews.filter(r => Math.round(r.rating) === star).length;
        return { star, count, pct: reviews.length > 0 ? (count / reviews.length) * 100 : 0 };
    });

    const rating = avgRating || 0;

    return (
        <section id="reviews" className="bg-white rounded-2xl border border-zinc-200 p-7 shadow-sm scroll-mt-24">
            <h2 className="font-black text-zinc-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3" style={{ fontSize: '16px' }}>
                <div className="w-6 h-px bg-zinc-200" /> Reviews
            </h2>

            {/* Google-style review summary */}
            <div className="flex flex-col sm:flex-row gap-6 mb-6 pb-6 border-b border-zinc-100">
                {/* Left: big rating number + stars */}
                <div className="flex flex-col items-center justify-center min-w-[120px]">
                    <p className="text-5xl font-black text-zinc-900 leading-none">{rating.toFixed(1)}</p>
                    <div className="flex items-center gap-0.5 mt-2">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < Math.round(rating) ? 'fill-orange-400 text-orange-400' : 'fill-zinc-200 text-zinc-200'}`} />
                        ))}
                    </div>
                    <p className="text-zinc-500 font-medium mt-1" style={{ fontSize: '14px' }}>{totalReviews} reviews</p>
                </div>

                {/* Right: rating bars */}
                <div className="flex-1 space-y-1.5">
                    {distribution.map(({ star, count, pct }) => (
                        <div key={star} className="flex items-center gap-2">
                            <span className="font-bold text-zinc-500 w-3 text-right" style={{ fontSize: '13px' }}>{star}</span>
                            <div className="flex-1 h-3 bg-zinc-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-orange-400 rounded-full transition-all"
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                            <span className="font-medium text-zinc-400 w-6 text-right" style={{ fontSize: '12px' }}>{count}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Write a review button */}
            <div className="flex items-center justify-center mb-6">
                <a
                    href={`/b/${businessSlug}#write-review`}
                    onClick={(e) => {
                        e.preventDefault();
                        const form = document.getElementById('enquiry-form');
                        if (form) form.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-50 border-2 border-zinc-200 rounded-full font-black text-zinc-700 hover:bg-orange-50 hover:border-orange-300 hover:text-[#FF6600] transition-all"
                    style={{ fontSize: '15px' }}
                >
                    <MessageSquarePlus className="w-4 h-4" />
                    Write a review
                </a>
            </div>

            {/* Reviews list - 3 at a time */}
            <div className="space-y-4">
                {visible.map((review) => (
                    <div key={review.id} className="p-5 bg-zinc-50 rounded-xl border border-zinc-100 hover:border-orange-100 hover:bg-white hover:shadow-sm transition-all">
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-[#FF6600] flex items-center justify-center text-white font-black shrink-0" style={{ fontSize: '18px' }}>
                                    {(review.profile_name || 'A')[0].toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-black text-zinc-900 leading-none" style={{ fontSize: '16px' }}>{review.profile_name || 'Reviewer'}</p>
                                    <div className="flex items-center gap-0.5 mt-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-3 h-3 ${i < (review.rating || 5) ? 'fill-orange-400 text-orange-400' : 'text-zinc-200 fill-zinc-200'}`} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {review.review_text && (
                            <p className="text-zinc-600" style={{ fontSize: '16px', lineHeight: 1.6 }}>&ldquo;{review.review_text}&rdquo;</p>
                        )}
                        {review.owner_answer && (
                            <div className="mt-3 pl-4 border-l-2 border-orange-200">
                                <p className="font-black text-[#FF6600] uppercase tracking-widest mb-1" style={{ fontSize: '12px' }}>Owner Response</p>
                                <p className="text-zinc-600" style={{ fontSize: '15px', lineHeight: 1.6 }}>{review.owner_answer}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-zinc-100">
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        style={{ fontSize: '14px' }}
                    >
                        <ChevronLeft className="w-4 h-4" /> Previous
                    </button>
                    <span className="font-bold text-zinc-400" style={{ fontSize: '14px' }}>
                        {page + 1} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        style={{ fontSize: '14px' }}
                    >
                        Next <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </section>
    );
}
