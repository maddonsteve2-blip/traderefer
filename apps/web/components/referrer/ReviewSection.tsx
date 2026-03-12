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
            const apiUrl = "/api/backend";
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
            <div className="flex items-center justify-between mb-8">
                <h2 className="font-black text-zinc-900 flex items-center gap-2.5" style={{ fontSize: '24px' }}>
                    <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                    Referrer Reviews
                    {avgRating && (
                        <span className="font-bold text-zinc-400 ml-2" style={{ fontSize: '18px' }}>
                            {avgRating} avg · {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                        </span>
                    )}
                </h2>
                {isSignedIn && !showForm && (
                    <Button
                        onClick={() => setShowForm(true)}
                        variant="outline"
                        className="rounded-full font-black border-2 border-zinc-200 hover:bg-zinc-50 transition-all h-12 px-6"
                        style={{ fontSize: '16px' }}
                    >
                        Write a Review
                    </Button>
                )}
            </div>

            {/* Review Form */}
            {showForm && (
                <div className="bg-zinc-50 rounded-[32px] border-2 border-zinc-200 p-8 mb-8 shadow-sm">
                    <p className="font-black text-zinc-600 mb-4" style={{ fontSize: '18px' }}>How was your experience referring to this business?</p>
                    <div className="flex items-center gap-1.5 mb-6">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <button
                                key={i}
                                onMouseEnter={() => setHoverRating(i)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setRating(i)}
                                className="p-1 transition-transform hover:scale-125"
                            >
                                <Star
                                    className={`w-9 h-9 ${
                                        i <= (hoverRating || rating)
                                            ? "text-yellow-500 fill-yellow-500"
                                            : "text-zinc-300"
                                    } transition-colors`}
                                />
                            </button>
                        ))}
                        {rating > 0 && (
                            <span className="font-black text-zinc-500 ml-3" style={{ fontSize: '18px' }}>
                                {["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}
                            </span>
                        )}
                    </div>
                    <textarea
                        rows={3}
                        className="w-full bg-white border-2 border-zinc-200 rounded-2xl px-5 py-4 text-zinc-900 placeholder-zinc-300 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 focus:outline-none transition-all resize-none mb-6 font-bold"
                        style={{ fontSize: '18px', lineHeight: 1.6 }}
                        placeholder="Optional: Share your experience (e.g. response time, professionalism, lead quality...)"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />
                    <div className="flex items-center gap-4">
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting || rating === 0}
                            className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-8 h-14 font-black shadow-lg shadow-orange-200 transition-all active:scale-95"
                            style={{ fontSize: '18px' }}
                        >
                            {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2.5" /> : <Send className="w-5 h-5 mr-2.5" />}
                            Submit Review
                        </Button>
                        <button onClick={() => { setShowForm(false); setRating(0); setComment(""); }} className="font-black text-zinc-400 hover:text-zinc-700 transition-colors" style={{ fontSize: '17px' }}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Review List */}
            {reviews.length > 0 ? (
                <div className="space-y-5">
                    {reviews.map((review) => (
                        <div key={review.id} className="bg-white rounded-3xl border-2 border-zinc-100 p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center font-black text-zinc-500" style={{ fontSize: '16px' }}>
                                        {review.referrer_name?.[0]?.toUpperCase() || "R"}
                                    </div>
                                    <div>
                                        <div className="font-black text-zinc-900" style={{ fontSize: '17px' }}>{review.referrer_name}</div>
                                        <Stars count={review.rating} size="w-4 h-4" />
                                    </div>
                                </div>
                                <span className="font-bold text-zinc-400" style={{ fontSize: '15px' }}>
                                    {new Date(review.created_at).toLocaleDateString("en-AU", { month: "short", year: "numeric" })}
                                </span>
                            </div>
                            {review.comment && (
                                <p className="font-bold text-zinc-600 leading-relaxed mt-3" style={{ fontSize: '17px' }}>{review.comment}</p>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="font-bold text-zinc-400 italic" style={{ fontSize: '17px' }}>No reviews yet. Be the first to review this business!</p>
            )}
        </section>
    );
}
