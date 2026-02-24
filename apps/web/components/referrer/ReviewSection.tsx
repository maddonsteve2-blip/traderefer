"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Star, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Review {
    id: string;
    rating: number;
    comment: string | null;
    referrer_name: string;
    created_at: string;
}

interface ReviewSectionProps {
    slug: string;
    initialReviews: Review[];
}

function Stars({ count, size = "w-4 h-4" }: { count: number; size?: string }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
                <Star
                    key={i}
                    className={`${size} ${i <= count ? "text-yellow-500 fill-yellow-500" : "text-zinc-200"}`}
                />
            ))}
        </div>
    );
}

export function ReviewSection({ slug, initialReviews }: ReviewSectionProps) {
    const { isSignedIn, getToken } = useAuth();
    const [reviews, setReviews] = useState<Review[]>(initialReviews);
    const [showForm, setShowForm] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const avgRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : null;

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error("Please select a rating");
            return;
        }
        setSubmitting(true);
        try {
            const token = await getToken();
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const res = await fetch(`${apiUrl}/referrer/reviews`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    business_slug: slug,
                    rating,
                    comment: comment.trim() || null
                })
            });
            if (res.ok) {
                toast.success("Review submitted!");
                setShowForm(false);
                setRating(0);
                setComment("");
                // Refresh reviews
                const reviewsRes = await fetch(`${apiUrl}/businesses/${slug}/reviews`);
                if (reviewsRes.ok) setReviews(await reviewsRes.json());
            } else {
                const err = await res.json();
                toast.error(err.detail || "Failed to submit review");
            }
        } catch {
            toast.error("Error submitting review");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    Referrer Reviews
                    {avgRating && (
                        <span className="text-base font-medium text-zinc-400 ml-1">
                            {avgRating} avg · {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                        </span>
                    )}
                </h2>
                {isSignedIn && !showForm && (
                    <Button
                        onClick={() => setShowForm(true)}
                        variant="outline"
                        className="rounded-full text-sm font-bold border-zinc-200"
                    >
                        Write a Review
                    </Button>
                )}
            </div>

            {/* Review Form */}
            {showForm && (
                <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-6 mb-6">
                    <p className="text-sm font-bold text-zinc-500 mb-3">How was your experience referring to this business?</p>
                    <div className="flex items-center gap-1 mb-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <button
                                key={i}
                                onMouseEnter={() => setHoverRating(i)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setRating(i)}
                                className="p-1 transition-transform hover:scale-110"
                            >
                                <Star
                                    className={`w-7 h-7 ${
                                        i <= (hoverRating || rating)
                                            ? "text-yellow-500 fill-yellow-500"
                                            : "text-zinc-300"
                                    } transition-colors`}
                                />
                            </button>
                        ))}
                        {rating > 0 && (
                            <span className="text-sm font-bold text-zinc-500 ml-2">
                                {["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}
                            </span>
                        )}
                    </div>
                    <textarea
                        rows={3}
                        className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder-zinc-300 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 resize-none mb-4"
                        placeholder="Optional: Share your experience (e.g. response time, professionalism, lead quality...)"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting || rating === 0}
                            className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-6 font-bold"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                            Submit Review
                        </Button>
                        <button onClick={() => { setShowForm(false); setRating(0); setComment(""); }} className="text-sm font-bold text-zinc-400 hover:text-zinc-600">
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Review List */}
            {reviews.length > 0 ? (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <div key={review.id} className="bg-white rounded-2xl border border-zinc-100 p-5">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center text-sm font-bold text-zinc-500">
                                        {review.referrer_name?.[0]?.toUpperCase() || "R"}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-zinc-900">{review.referrer_name}</div>
                                        <Stars count={review.rating} size="w-3.5 h-3.5" />
                                    </div>
                                </div>
                                <span className="text-sm text-zinc-400">
                                    {new Date(review.created_at).toLocaleDateString("en-AU", { month: "short", year: "numeric" })}
                                </span>
                            </div>
                            {review.comment && (
                                <p className="text-sm text-zinc-600 leading-relaxed mt-2">{review.comment}</p>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-zinc-400 italic">No reviews yet. Be the first to review this business!</p>
            )}
        </section>
    );
}
