"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, MapPin, Star, ShieldCheck, ChevronRight, Link2, Loader2, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

const TRADE_TABS = [
    "All", "Plumbing", "Electrical", "Carpentry", "Painting",
    "Landscaping", "Cleaning", "Roofing", "Concreting", "Tiling",
    "Air Conditioning & Heating", "Solar & Energy", "Pest Control",
    "Tree Lopping & Removal", "Handyman", "Flooring", "Fencing",
];

interface Business {
    id: string;
    business_name: string;
    slug: string;
    trade_category: string;
    suburb: string;
    state: string;
    referral_fee_cents: number;
    logo_url: string | null;
    trust_score: number;
    is_verified: boolean;
    avg_rating: string | number;
    total_reviews: number;
}

interface Props {
    initialSuburb: string | null;
    initialState: string | null;
}

function BizCard({ biz }: { biz: Business }) {
    const fee = biz.referral_fee_cents ? `$${(biz.referral_fee_cents / 100).toFixed(0)}` : null;
    const rating = parseFloat(String(biz.avg_rating)) || 0;

    return (
        <div className="bg-white rounded-2xl border border-zinc-200 hover:border-orange-300 hover:shadow-lg transition-all group flex flex-col">
            <div className="p-4 flex-1">
                {/* Logo + name */}
                <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-100 flex items-center justify-center shrink-0">
                        {biz.logo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={biz.logo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-lg font-black text-zinc-400">{biz.business_name.charAt(0)}</span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-zinc-900 text-base leading-tight truncate group-hover:text-orange-600 transition-colors">
                            {biz.business_name}
                        </div>
                        <div className="text-sm text-zinc-500 truncate">{biz.trade_category}</div>
                    </div>
                    {biz.is_verified && (
                        <ShieldCheck className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    )}
                </div>

                {/* Location + rating */}
                <div className="flex items-center justify-between text-sm mb-3">
                    <span className="flex items-center gap-1 text-zinc-400">
                        <MapPin className="w-3 h-3" />
                        {biz.suburb}, {biz.state}
                    </span>
                    {rating > 0 && (
                        <span className="flex items-center gap-1 text-amber-500 font-semibold">
                            <Star className="w-3 h-3 fill-amber-400" />
                            {rating.toFixed(1)}
                            {biz.total_reviews > 0 && (
                                <span className="text-zinc-400 font-normal">({biz.total_reviews})</span>
                            )}
                        </span>
                    )}
                </div>

                {/* Referral fee badge */}
                {fee && (
                    <div className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 font-bold text-sm px-2.5 py-1 rounded-full">
                        <Link2 className="w-3 h-3" /> {fee} referral fee
                    </div>
                )}
            </div>

            {/* CTA */}
            <div className="px-4 pb-4">
                <Link
                    href={`/dashboard/referrer/refer/${biz.slug}`}
                    className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-base py-2.5 transition-colors"
                >
                    Get Referral Link <ChevronRight className="w-4 h-4" />
                </Link>
            </div>
        </div>
    );
}

export function BusinessBrowser({ initialSuburb, initialState }: Props) {
    const [suburb, setSuburb] = useState(initialSuburb);
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [loading, setLoading] = useState(true);
    const [trade, setTrade] = useState("All");
    const [q, setQ] = useState("");
    const [debouncedQ, setDebouncedQ] = useState("");
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [locationLabel, setLocationLabel] = useState<string | null>(null);

    useEffect(() => {
        if (initialSuburb) setLocationLabel(initialSuburb);
    }, [initialSuburb]);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(q), 350);
        return () => clearTimeout(t);
    }, [q]);

    const fetchBusinesses = useCallback(async (reset = false) => {
        setLoading(true);
        const currentPage = reset ? 0 : page;
        const params = new URLSearchParams();
        if (suburb) params.set("suburb", suburb);
        if (initialState) params.set("state", initialState);
        if (trade !== "All") params.set("trade", trade);
        if (debouncedQ) params.set("q", debouncedQ);
        params.set("page", String(currentPage));

        try {
            const res = await fetch(`/api/discover/browse?${params}`);
            const data: Business[] = res.ok ? await res.json() : [];
            if (reset) {
                setBusinesses(data);
                setPage(0);
            } else {
                setBusinesses(prev => [...prev, ...data]);
            }
            setHasMore(data.length === 12);
        } catch {
            if (reset) setBusinesses([]);
        } finally {
            setLoading(false);
        }
    }, [suburb, initialState, trade, debouncedQ, page]);

    useEffect(() => {
        setPage(0);
        fetchBusinesses(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [suburb, initialState, trade, debouncedQ]);

    const loadMore = () => {
        const next = page + 1;
        setPage(next);
        // trigger re-fetch with new page
        const params = new URLSearchParams();
        if (suburb) params.set("suburb", suburb);
        if (initialState) params.set("state", initialState);
        if (trade !== "All") params.set("trade", trade);
        if (debouncedQ) params.set("q", debouncedQ);
        params.set("page", String(next));
        setLoading(true);
        fetch(`/api/discover/browse?${params}`)
            .then(r => r.ok ? r.json() : [])
            .then((data: Business[]) => {
                setBusinesses(prev => [...prev, ...data]);
                setHasMore(data.length === 12);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    return (
        <div>
            {/* Search + location bar */}
            <div className="flex gap-3 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                        value={q}
                        onChange={e => setQ(e.target.value)}
                        placeholder="Search businesses, trades…"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-200 text-base focus:outline-none focus:border-orange-400 bg-white"
                    />
                </div>
                {locationLabel && (
                    <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 text-base font-semibold text-orange-700 shrink-0">
                        <MapPin className="w-4 h-4" />
                        Near {locationLabel}
                        <button
                            onClick={() => { setSuburb(null); setLocationLabel(null); }}
                            className="ml-1 text-orange-400 hover:text-orange-600 font-bold"
                        >×</button>
                    </div>
                )}
            </div>

            {/* Trade tabs */}
            <div className="overflow-x-auto scrollbar-hide mb-5">
                <div className="flex gap-2 flex-nowrap w-max pb-1">
                    {TRADE_TABS.map(t => (
                        <button
                            key={t}
                            onClick={() => setTrade(t)}
                            className={`px-4 py-1.5 rounded-full text-base font-bold whitespace-nowrap transition-colors ${
                                trade === t
                                    ? "bg-orange-500 text-white"
                                    : "bg-white border border-zinc-200 text-zinc-600 hover:border-orange-300"
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between mb-3">
                <p className="text-base text-zinc-500 font-medium">
                    {loading && businesses.length === 0
                        ? "Loading…"
                        : `${businesses.length} businesses${locationLabel ? ` near ${locationLabel}` : ""}`
                    }
                </p>
                {locationLabel && (
                    <span className="text-sm text-zinc-400 flex items-center gap-1">
                        <SlidersHorizontal className="w-3 h-3" /> Sorted by distance
                    </span>
                )}
            </div>

            {/* Grid */}
            {businesses.length === 0 && !loading ? (
                <div className="text-center py-16 text-zinc-400">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold">No businesses found</p>
                    <p className="text-sm mt-1">Try a different trade or clear your search</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {businesses.map(biz => (
                        <BizCard key={biz.id} biz={biz} />
                    ))}
                    {loading && businesses.length === 0 && (
                        Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-zinc-100 p-4 animate-pulse">
                                <div className="flex gap-3 mb-3">
                                    <div className="w-12 h-12 bg-zinc-100 rounded-xl shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-zinc-100 rounded w-3/4" />
                                        <div className="h-3 bg-zinc-100 rounded w-1/2" />
                                    </div>
                                </div>
                                <div className="h-8 bg-zinc-100 rounded-xl" />
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Load more */}
            {hasMore && businesses.length > 0 && (
                <div className="text-center mt-8">
                    <button
                        onClick={loadMore}
                        disabled={loading}
                        className="px-8 py-3 bg-white border-2 border-zinc-200 hover:border-orange-400 text-zinc-700 hover:text-orange-600 rounded-xl font-bold text-base transition-colors disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
                        Load more
                    </button>
                </div>
            )}
        </div>
    );
}
