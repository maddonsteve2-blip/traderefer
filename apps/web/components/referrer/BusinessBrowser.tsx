"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Search, MapPin, Star, ShieldCheck, ChevronRight,
    DollarSign, Loader2, SlidersHorizontal, TrendingUp, Zap
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

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

function BizCard({ biz, isFirst }: { biz: Business; isFirst?: boolean }) {
    const feeCents = biz.referral_fee_cents || 0;
    const referrerEarns = feeCents > 0 ? (feeCents / 100) * 0.8 : null;
    const feeDisplay = referrerEarns
        ? (Number.isInteger(referrerEarns) ? `$${referrerEarns}` : `$${referrerEarns.toFixed(2)}`)
        : null;
    const rating = parseFloat(String(biz.avg_rating)) || 0;
    const pills = servicePills(biz);

    return (
        <div className="bg-white rounded-2xl border border-zinc-200 hover:border-orange-300 hover:shadow-lg transition-all group flex flex-col">
            <div className="p-5 flex-1 flex flex-col gap-4">

                {/* Logo + name + trust score */}
                <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-100 flex items-center justify-center shrink-0">
                        {biz.logo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={biz.logo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-2xl font-black text-zinc-400">{biz.business_name.charAt(0)}</span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-black text-zinc-900 leading-tight truncate group-hover:text-orange-600 transition-colors text-[21px]">
                            {biz.business_name}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-zinc-500 font-bold truncate uppercase tracking-wide text-base">{biz.trade_category}</span>
                            {rating > 0 && (
                                <span className="flex items-center gap-1 text-amber-500 font-bold shrink-0 text-base">
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
                <div className="flex items-center gap-1.5 text-zinc-400 font-bold uppercase tracking-wider text-base">
                    <MapPin className="w-4 h-4 shrink-0" />
                    {biz.suburb}, {biz.state}
                </div>

                {/* Service pills */}
                {pills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {pills.map((p, i) => (
                            <span key={i} className="px-3 py-1 bg-zinc-50 border border-zinc-200 text-zinc-600 rounded-lg font-bold text-base">
                                {p}
                            </span>
                        ))}
                    </div>
                )}

                {/* Referral fee */}
                {feeDisplay && (
                    <div className="flex items-baseline gap-2 mt-auto">
                        <span className="font-black text-zinc-900 tracking-tight text-[30px]">{feeDisplay}</span>
                        <span className="font-bold text-zinc-400 uppercase tracking-widest text-sm">per verified lead</span>
                    </div>
                )}
            </div>

            {/* CTA */}
            <div className="px-5 pb-5">
                <Link
                    href={`/dashboard/referrer/refer/${biz.slug}`}
                    id={isFirst ? "tour-network-referral-link" : undefined}
                    className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black transition-all py-4 active:scale-95 shadow-md shadow-orange-500/20 text-[21px]"
                >
                    Apply to Refer <ChevronRight className="w-5 h-5" />
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
            className="flex items-center gap-4 p-4 bg-zinc-50 hover:bg-orange-50 border border-zinc-200 hover:border-orange-200 rounded-2xl transition-all group"
        >
            <div className="w-10 h-10 rounded-xl bg-zinc-200 flex items-center justify-center shrink-0 font-black text-zinc-500 group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors text-[19px]">
                {rank}
            </div>
            <div className="flex-1 min-w-0">
                <div className="font-black text-zinc-900 truncate group-hover:text-orange-600 transition-colors text-[19px]">
                    {biz.business_name}
                </div>
                <div className="text-zinc-400 font-bold uppercase tracking-tight truncate text-sm">
                    {biz.trade_category} · {biz.suburb}
                </div>
                {rating > 0 && (
                    <div className="flex items-center gap-1 mt-1 text-base">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
                        <span className="font-bold text-amber-600">{rating.toFixed(1)}</span>
                    </div>
                )}
            </div>
            {feeDisplay && (
                <div className="text-right shrink-0">
                    <div className="font-black text-orange-600 text-[24px]">{feeDisplay}</div>
                    <div className="text-zinc-400 font-bold uppercase tracking-widest text-xs">/ lead</div>
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
                    <div id="tour-network-search" className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                        <input
                            value={q}
                            onChange={e => setQ(e.target.value)}
                            placeholder="Search businesses, trades, suburbs…"
                            className="w-full pl-12 pr-4 h-14 rounded-2xl border-2 border-zinc-200 focus:outline-none focus:border-orange-400 bg-white font-bold text-zinc-900 transition-all shadow-sm text-[21px]"
                        />
                    </div>
                    {locationLabel && (
                        <div className="flex items-center gap-2 bg-orange-50 border-2 border-orange-200 rounded-2xl px-5 py-3 font-black text-orange-700 shrink-0 uppercase tracking-tight text-[19px]">
                            <MapPin className="w-5 h-5" /> Near {locationLabel}
                            <button onClick={() => { setSuburb(null); setLocationLabel(null); }} className="ml-2 text-orange-400 hover:text-orange-600 font-black text-2xl leading-none">×</button>
                        </div>
                    )}
                </div>

                {/* Trade tabs */}
                <div id="tour-network-categories" className="overflow-x-auto scrollbar-hide mb-6">
                    <div className="flex gap-2.5 flex-nowrap w-max pb-1">
                        {TRADE_TABS.map(t => (
                            <button
                                key={t}
                                onClick={() => setTrade(t)}
                                className={`px-5 py-3 rounded-full font-black whitespace-nowrap transition-all uppercase tracking-tight text-[19px] ${
                                    trade === t
                                        ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                                        : "bg-white border-2 border-zinc-200 text-zinc-500 hover:border-orange-300 hover:text-orange-600"
                                }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results meta */}
                <div className="flex items-center justify-between mb-5 px-1">
                    <p className="font-black text-zinc-500 tracking-wide text-base">
                        {loading && businesses.length === 0
                            ? "Loading…"
                            : `${businesses.length} business${businesses.length !== 1 ? "es" : ""}${locationLabel ? ` near ${locationLabel}` : ""}`}
                    </p>
                    {locationLabel && (
                        <span className="text-zinc-400 font-bold flex items-center gap-2 text-sm">
                            <SlidersHorizontal className="w-4 h-4" /> Sorted by distance
                        </span>
                    )}
                </div>

                {/* Cards grid */}
                {businesses.length === 0 && !loading ? (
                    <div className="text-center py-20 bg-white rounded-[32px] border-2 border-dashed border-zinc-100">
                        <Search className="w-16 h-16 mx-auto mb-4 text-zinc-200" />
                        <p className="font-black text-zinc-900 uppercase tracking-tight text-[24px]">No businesses found</p>
                        <p className="font-bold text-zinc-400 mt-2 text-[19px]">Try a different trade or clear your search</p>
                    </div>
                ) : (
                    <motion.div
                        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5"
                        initial="hidden"
                        animate="visible"
                        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.05 } } }}
                    >
                        {businesses.map((biz, idx) => (
                            <motion.div
                                key={biz.id}
                                variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } }}
                                whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', transition: { duration: 0.2 } }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <BizCard biz={biz} isFirst={idx === 0} />
                            </motion.div>
                        ))}
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
                    </motion.div>
                )}

                {/* Load more */}
                {hasMore && businesses.length > 0 && (
                    <div className="text-center mt-12">
                        <button
                            onClick={loadMore}
                            disabled={loading}
                            className="px-10 py-4 bg-white border-2 border-zinc-200 hover:border-orange-400 text-zinc-700 hover:text-orange-600 rounded-2xl font-black transition-all disabled:opacity-50 shadow-sm active:scale-95 text-[21px]"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin inline mr-3" /> : null}
                            Load more businesses
                        </button>
                    </div>
                )}
            </div>

            {/* ── HIGH-VALUE SIDEBAR ── */}
            <div className="hidden lg:block w-80 xl:w-96 shrink-0 sticky top-24 self-start space-y-5">

                {/* Top Paying header */}
                <div className="bg-zinc-900 rounded-[32px] p-7 text-white shadow-xl">
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="w-6 h-6 text-orange-400" />
                        <h2 className="font-black text-white uppercase tracking-tighter text-[21px]">High-Value Opportunities</h2>
                    </div>
                    <p className="text-zinc-400 font-bold text-[19px]">Highest earning per referral right now</p>
                </div>

                {topPaying.length > 0 ? (
                    <div className="bg-white rounded-[32px] border border-zinc-200 p-5 shadow-sm space-y-3">
                        {topPaying.slice(0, 6).map((biz, i) => (
                            <SidebarCard key={biz.id} biz={biz} rank={i + 1} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-[32px] border border-zinc-200 p-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-orange-500 mx-auto" />
                    </div>
                )}

                {/* Quick-tip */}
                <div className="bg-orange-50 border-2 border-orange-100 rounded-[32px] p-7 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <Zap className="w-6 h-6 text-orange-500 shrink-0" />
                        <span className="font-black text-orange-900 uppercase tracking-widest text-[19px]">Pro Tip</span>
                    </div>
                    <p className="text-orange-800 font-bold text-[19px] leading-relaxed">
                        Businesses with higher fees often have fewer referrers — less competition means more earnings for you.
                    </p>
                </div>

                {/* Earnings reminder */}
                <div className="bg-white rounded-[32px] border border-zinc-200 p-6 shadow-sm text-center">
                    <DollarSign className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                    <p className="font-black text-zinc-900 uppercase tracking-tighter text-[24px]">You keep 80%</p>
                    <p className="text-zinc-400 font-bold text-[19px] uppercase tracking-widest mt-1">of every verified referral fee</p>
                </div>
            </div>

        </div>
    );
}
