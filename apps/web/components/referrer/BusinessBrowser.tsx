"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Search, MapPin, Star, ShieldCheck, ChevronRight,
    DollarSign, Loader2, SlidersHorizontal, TrendingUp, Zap
} from "lucide-react";
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
    services?: string[];
    specialties?: string[];
    features?: string[];
    business_highlights?: string[];
}

interface Props {
    initialSuburb: string | null;
    initialState: string | null;
}

function servicePills(biz: Business): string[] {
    const raw = biz.services?.length ? biz.services
        : biz.specialties?.length ? biz.specialties
        : biz.features?.length ? biz.features
        : biz.business_highlights?.length ? biz.business_highlights
        : [];
    return raw.slice(0, 3);
}

function BizCard({ biz }: { biz: Business }) {
    const feeCents = biz.referral_fee_cents || 0;
    const referrerEarns = feeCents > 0 ? (feeCents / 100) * 0.8 : null;
    const feeDisplay = referrerEarns
        ? (Number.isInteger(referrerEarns) ? `$${referrerEarns}` : `$${referrerEarns.toFixed(2)}`)
        : null;
    const rating = parseFloat(String(biz.avg_rating)) || 0;
    const pills = servicePills(biz);

    return (
        <div className="bg-white rounded-2xl border border-zinc-200 hover:border-orange-300 hover:shadow-lg transition-all group flex flex-col">
            <div className="p-4 flex-1 flex flex-col gap-3">

                {/* Logo + name + trust score */}
                <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-100 flex items-center justify-center shrink-0">
                        {biz.logo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={biz.logo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-xl font-black text-zinc-400">{biz.business_name.charAt(0)}</span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-zinc-900 leading-tight truncate group-hover:text-orange-600 transition-colors" style={{ fontSize: '20px' }}>
                            {biz.business_name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-zinc-500 font-medium truncate" style={{ fontSize: '16px' }}>{biz.trade_category}</span>
                            {rating > 0 && (
                                <span className="flex items-center gap-1 text-amber-500 font-bold shrink-0" style={{ fontSize: '16px' }}>
                                    <Star className="w-4 h-4 fill-amber-400 shrink-0" />
                                    {rating.toFixed(1)}
                                    {biz.total_reviews > 0 && <span className="text-zinc-400 font-normal">({biz.total_reviews})</span>}
                                </span>
                            )}
                            {biz.is_verified && <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />}
                        </div>
                    </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1.5 text-zinc-400 font-medium" style={{ fontSize: '16px' }}>
                    <MapPin className="w-4 h-4 shrink-0" />
                    {biz.suburb}, {biz.state}
                </div>

                {/* Service pills */}
                {pills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {pills.map((p, i) => (
                            <span key={i} className="px-2.5 py-1 bg-zinc-50 border border-zinc-200 text-zinc-600 rounded-lg font-semibold" style={{ fontSize: '16px' }}>
                                {p}
                            </span>
                        ))}
                    </div>
                )}

                {/* Referral fee */}
                {feeDisplay && (
                    <div className="flex items-baseline gap-2">
                        <span className="font-black text-zinc-900 tracking-tight" style={{ fontSize: '24px' }}>{feeDisplay}</span>
                        <span className="font-bold text-zinc-400" style={{ fontSize: '16px' }}>per verified lead</span>
                    </div>
                )}
            </div>

            {/* CTA */}
            <div className="px-4 pb-4">
                <Link
                    href={`/dashboard/referrer/refer/${biz.slug}`}
                    className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-colors py-3"
                    style={{ fontSize: '18px' }}
                >
                    Get Referral Link <ChevronRight className="w-5 h-5" />
                </Link>
            </div>
        </div>
    );
}

function SidebarCard({ biz, rank }: { biz: Business; rank: number }) {
    const feeCents = biz.referral_fee_cents || 0;
    const referrerEarns = feeCents > 0 ? (feeCents / 100) * 0.8 : null;
    const feeDisplay = referrerEarns
        ? (Number.isInteger(referrerEarns) ? `$${referrerEarns}` : `$${referrerEarns.toFixed(2)}`)
        : null;
    const rating = parseFloat(String(biz.avg_rating)) || 0;

    return (
        <Link
            href={`/dashboard/referrer/refer/${biz.slug}`}
            className="flex items-center gap-3 p-3 bg-zinc-50 hover:bg-orange-50 border border-zinc-200 hover:border-orange-200 rounded-xl transition-all group"
        >
            <div className="w-8 h-8 rounded-lg bg-zinc-200 flex items-center justify-center shrink-0 font-black text-zinc-500 group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors" style={{ fontSize: '16px' }}>
                {rank}
            </div>
            <div className="flex-1 min-w-0">
                <div className="font-bold text-zinc-900 truncate group-hover:text-orange-600 transition-colors" style={{ fontSize: '17px' }}>
                    {biz.business_name}
                </div>
                <div className="text-zinc-400 font-medium truncate" style={{ fontSize: '16px' }}>
                    {biz.trade_category} · {biz.suburb}
                </div>
                {rating > 0 && (
                    <div className="flex items-center gap-1 mt-0.5" style={{ fontSize: '16px' }}>
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                        <span className="font-semibold text-amber-600">{rating.toFixed(1)}</span>
                    </div>
                )}
            </div>
            {feeDisplay && (
                <div className="text-right shrink-0">
                    <div className="font-black text-orange-600" style={{ fontSize: '20px' }}>{feeDisplay}</div>
                    <div className="text-zinc-400 font-medium" style={{ fontSize: '16px' }}>/ lead</div>
                </div>
            )}
        </Link>
    );
}

export function BusinessBrowser({ initialSuburb, initialState }: Props) {
    const [suburb, setSuburb] = useState(initialSuburb);
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [topPaying, setTopPaying] = useState<Business[]>([]);
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

    // Fetch top-paying once on mount
    useEffect(() => {
        fetch("/api/discover/browse?sort=top_paying")
            .then(r => r.ok ? r.json() : [])
            .then(setTopPaying)
            .catch(() => {});
    }, []);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(q), 350);
        return () => clearTimeout(t);
    }, [q]);

    const buildParams = useCallback((pg: number) => {
        const p = new URLSearchParams();
        if (suburb) p.set("suburb", suburb);
        if (initialState) p.set("state", initialState);
        if (trade !== "All") p.set("trade", trade);
        if (debouncedQ) p.set("q", debouncedQ);
        p.set("page", String(pg));
        return p;
    }, [suburb, initialState, trade, debouncedQ]);

    const fetchBusinesses = useCallback(async (reset = false) => {
        setLoading(true);
        const currentPage = reset ? 0 : page;
        try {
            const res = await fetch(`/api/discover/browse?${buildParams(currentPage)}`);
            const data: Business[] = res.ok ? await res.json() : [];
            if (reset) { setBusinesses(data); setPage(0); }
            else setBusinesses(prev => [...prev, ...data]);
            setHasMore(data.length === 12);
        } catch {
            if (reset) setBusinesses([]);
        } finally {
            setLoading(false);
        }
    }, [suburb, initialState, trade, debouncedQ, page, buildParams]);

    useEffect(() => {
        setPage(0);
        fetchBusinesses(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [suburb, initialState, trade, debouncedQ]);

    const loadMore = () => {
        const next = page + 1;
        setPage(next);
        setLoading(true);
        fetch(`/api/discover/browse?${buildParams(next)}`)
            .then(r => r.ok ? r.json() : [])
            .then((data: Business[]) => { setBusinesses(prev => [...prev, ...data]); setHasMore(data.length === 12); })
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    return (
        <div className="flex gap-6 items-start">

            {/* ── MAIN FEED ── */}
            <div className="flex-1 min-w-0">

                {/* Search + location filter */}
                <div className="flex gap-3 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                        <input
                            value={q}
                            onChange={e => setQ(e.target.value)}
                            placeholder="Search businesses, trades, suburbs…"
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:border-orange-400 bg-white font-medium"
                            style={{ fontSize: '16px' }}
                        />
                    </div>
                    {locationLabel && (
                        <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 font-bold text-orange-700 shrink-0" style={{ fontSize: '16px' }}>
                            <MapPin className="w-4 h-4" /> Near {locationLabel}
                            <button onClick={() => { setSuburb(null); setLocationLabel(null); }} className="ml-1 text-orange-400 hover:text-orange-600 font-black">×</button>
                        </div>
                    )}
                </div>

                {/* Trade tabs */}
                <div className="overflow-x-auto scrollbar-hide mb-4">
                    <div className="flex gap-2 flex-nowrap w-max pb-1">
                        {TRADE_TABS.map(t => (
                            <button
                                key={t}
                                onClick={() => setTrade(t)}
                                className={`px-4 py-2 rounded-full font-bold whitespace-nowrap transition-colors ${
                                    trade === t
                                        ? "bg-orange-500 text-white"
                                        : "bg-white border border-zinc-200 text-zinc-600 hover:border-orange-300 hover:text-orange-600"
                                }`}
                                style={{ fontSize: '16px' }}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results meta */}
                <div className="flex items-center justify-between mb-4">
                    <p className="font-semibold text-zinc-500" style={{ fontSize: '16px' }}>
                        {loading && businesses.length === 0
                            ? "Loading…"
                            : `${businesses.length} business${businesses.length !== 1 ? "es" : ""}${locationLabel ? ` near ${locationLabel}` : ""}`}
                    </p>
                    {locationLabel && (
                        <span className="text-zinc-400 font-medium flex items-center gap-1.5" style={{ fontSize: '16px' }}>
                            <SlidersHorizontal className="w-4 h-4" /> Sorted by distance
                        </span>
                    )}
                </div>

                {/* Cards grid */}
                {businesses.length === 0 && !loading ? (
                    <div className="text-center py-16 text-zinc-400">
                        <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="font-bold" style={{ fontSize: '18px' }}>No businesses found</p>
                        <p className="font-medium mt-1" style={{ fontSize: '16px' }}>Try a different trade or clear your search</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                        {businesses.map(biz => <BizCard key={biz.id} biz={biz} />)}
                        {loading && businesses.length === 0 && Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-zinc-100 p-4 animate-pulse">
                                <div className="flex gap-3 mb-3">
                                    <div className="w-12 h-12 bg-zinc-100 rounded-xl shrink-0" />
                                    <div className="flex-1 space-y-2 pt-1">
                                        <div className="h-5 bg-zinc-100 rounded w-3/4" />
                                        <div className="h-4 bg-zinc-100 rounded w-1/2" />
                                    </div>
                                </div>
                                <div className="h-4 bg-zinc-100 rounded w-full mb-2" />
                                <div className="flex gap-2 mb-3">
                                    <div className="h-7 bg-zinc-100 rounded-lg w-20" />
                                    <div className="h-7 bg-zinc-100 rounded-lg w-24" />
                                </div>
                                <div className="h-11 bg-zinc-100 rounded-xl" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Load more */}
                {hasMore && businesses.length > 0 && (
                    <div className="text-center mt-8">
                        <button
                            onClick={loadMore}
                            disabled={loading}
                            className="px-8 py-3 bg-white border-2 border-zinc-200 hover:border-orange-400 text-zinc-700 hover:text-orange-600 rounded-xl font-bold transition-colors disabled:opacity-50"
                            style={{ fontSize: '16px' }}
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> : null}
                            Load more businesses
                        </button>
                    </div>
                )}
            </div>

            {/* ── HIGH-VALUE SIDEBAR ── */}
            <div className="hidden lg:block w-72 xl:w-80 shrink-0 sticky top-24 self-start space-y-4">

                {/* Top Paying header */}
                <div className="bg-zinc-900 rounded-2xl p-5 text-white">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-5 h-5 text-orange-400" />
                        <h2 className="font-black text-white" style={{ fontSize: '18px' }}>High-Value Opportunities</h2>
                    </div>
                    <p className="text-zinc-400 font-medium" style={{ fontSize: '16px' }}>Highest earning per referral right now</p>
                </div>

                {topPaying.length > 0 ? (
                    <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-sm space-y-2">
                        {topPaying.slice(0, 6).map((biz, i) => (
                            <SidebarCard key={biz.id} biz={biz} rank={i + 1} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-zinc-200 p-5 text-center">
                        <Loader2 className="w-5 h-5 animate-spin text-zinc-300 mx-auto" />
                    </div>
                )}

                {/* Quick-tip */}
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-orange-500 shrink-0" />
                        <span className="font-black text-orange-800" style={{ fontSize: '16px' }}>Pro Tip</span>
                    </div>
                    <p className="text-orange-700 font-medium leading-snug" style={{ fontSize: '16px' }}>
                        Businesses with higher fees often have fewer referrers — less competition means more earnings for you.
                    </p>
                </div>

                {/* Earnings reminder */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-sm text-center">
                    <DollarSign className="w-6 h-6 text-orange-500 mx-auto mb-1" />
                    <p className="font-black text-zinc-900" style={{ fontSize: '18px' }}>You keep 80%</p>
                    <p className="text-zinc-400 font-medium" style={{ fontSize: '16px' }}>of every verified referral fee</p>
                </div>
            </div>

        </div>
    );
}
