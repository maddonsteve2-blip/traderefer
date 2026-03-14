"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Search, MapPin, ShieldCheck, ArrowRight, Loader2, Building2, ChevronLeft } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Business = {
    id: string;
    slug: string;
    business_name: string;
    trade_category?: string;
    suburb?: string;
    state?: string;
    is_claimed?: boolean;
};

export default function ClaimIndexPage() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Business[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const search = useCallback(async (q: string) => {
        if (q.trim().length < 2) {
            setResults([]);
            setSearched(false);
            return;
        }
        setLoading(true);
        setSearched(true);
        try {
            const res = await fetch(`${API}/businesses?q=${encodeURIComponent(q.trim())}&limit=20`);
            if (res.ok) {
                const data = await res.json();
                setResults(Array.isArray(data) ? data : data.businesses || []);
            } else {
                setResults([]);
            }
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim().length >= 2) search(query);
            else { setResults([]); setSearched(false); }
        }, 400);
        return () => clearTimeout(timer);
    }, [query, search]);

    return (
        <main className="min-h-screen bg-zinc-50">
            <div className="max-w-3xl mx-auto px-4 py-10">
                <header className="flex items-center justify-between mb-10">
                    <Link href="/">
                        <Logo size="sm" />
                    </Link>
                    <Link href="/" className="text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors inline-flex items-center gap-2">
                        <ChevronLeft className="w-4 h-4" /> Back to home
                    </Link>
                </header>

                {/* Hero */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-sm font-black uppercase tracking-widest mb-5">
                        <ShieldCheck className="w-4 h-4" /> Free business verification
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tight">Claim Your Business</h1>
                    <p className="mt-4 text-lg text-zinc-500 font-medium max-w-lg mx-auto leading-relaxed">
                        Search for your business below and verify ownership to manage your profile, respond to leads, and start earning referrals.
                    </p>
                </div>

                {/* Search */}
                <div className="relative mb-8">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400">
                        <Search className="w-5 h-5" />
                    </div>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by business name, trade or suburb..."
                        className="w-full h-16 pl-14 pr-6 rounded-2xl border-2 border-zinc-200 bg-white text-lg font-medium placeholder:text-zinc-400 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 transition-all shadow-sm"
                        autoFocus
                    />
                </div>

                {/* Results */}
                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                    </div>
                )}

                {!loading && searched && results.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-2xl border border-zinc-200">
                        <Building2 className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                        <p className="font-bold text-zinc-500" style={{ fontSize: '16px' }}>No businesses found for &ldquo;{query}&rdquo;</p>
                        <p className="text-zinc-400 mt-1" style={{ fontSize: '14px' }}>Try a different name, trade type, or suburb</p>
                        <Link href="/register?type=business" className="inline-flex items-center gap-2 mt-4 text-orange-600 font-black hover:underline" style={{ fontSize: '15px' }}>
                            List your business instead <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                )}

                {!loading && results.length > 0 && (
                    <div className="space-y-3">
                        <p className="font-bold text-zinc-400 uppercase tracking-widest mb-2" style={{ fontSize: '13px' }}>{results.length} result{results.length !== 1 ? 's' : ''}</p>
                        {results.map((biz) => (
                            <Link
                                key={biz.id}
                                href={biz.is_claimed ? `/b/${biz.slug}` : `/claim/${biz.slug}`}
                                className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-zinc-200 hover:border-orange-300 hover:shadow-md transition-all group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-[#FF6600] flex items-center justify-center text-white font-black text-xl shrink-0">
                                    {(biz.business_name || "?")[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-zinc-900 truncate" style={{ fontSize: '16px' }}>{biz.business_name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {biz.trade_category && (
                                            <span className="text-zinc-400 font-medium" style={{ fontSize: '14px' }}>{biz.trade_category}</span>
                                        )}
                                        {biz.suburb && (
                                            <span className="flex items-center gap-1 text-zinc-400 font-medium" style={{ fontSize: '14px' }}>
                                                <MapPin className="w-3 h-3" /> {biz.suburb}{biz.state ? `, ${biz.state}` : ''}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="shrink-0">
                                    {biz.is_claimed ? (
                                        <span className="px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 font-bold" style={{ fontSize: '12px' }}>Claimed</span>
                                    ) : (
                                        <span className="px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 font-black group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-all" style={{ fontSize: '12px' }}>
                                            Claim →
                                        </span>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Bottom info */}
                <div className="mt-12 grid sm:grid-cols-3 gap-6">
                    <div className="text-center p-5">
                        <div className="w-10 h-10 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <Search className="w-5 h-5 text-orange-500" />
                        </div>
                        <p className="font-black text-zinc-900" style={{ fontSize: '15px' }}>Find your business</p>
                        <p className="text-zinc-500 mt-1" style={{ fontSize: '14px' }}>Search by name, trade, or location</p>
                    </div>
                    <div className="text-center p-5">
                        <div className="w-10 h-10 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <ShieldCheck className="w-5 h-5 text-orange-500" />
                        </div>
                        <p className="font-black text-zinc-900" style={{ fontSize: '15px' }}>Verify ownership</p>
                        <p className="text-zinc-500 mt-1" style={{ fontSize: '14px' }}>Via phone, email, or paperwork</p>
                    </div>
                    <div className="text-center p-5">
                        <div className="w-10 h-10 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <Building2 className="w-5 h-5 text-orange-500" />
                        </div>
                        <p className="font-black text-zinc-900" style={{ fontSize: '15px' }}>Manage your profile</p>
                        <p className="text-zinc-500 mt-1" style={{ fontSize: '14px' }}>Update details & receive leads</p>
                    </div>
                </div>
            </div>
        </main>
    );
}
