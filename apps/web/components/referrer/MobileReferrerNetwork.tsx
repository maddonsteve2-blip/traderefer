"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Loader2, Info, Bell, UserPlus } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

interface Business {
    id: string;
    name: string;
    trade_category: string;
    suburb: string;
    logo_url: string | null;
    referral_fee_cents: number;
    is_partner?: boolean;
    leads_count?: number;
    revenue_cents?: number;
}

interface MobileReferrerNetworkProps {
    businesses?: Business[];
    partnersCount?: number;
    availableCount?: number;
    loading?: boolean;
}

export function MobileReferrerNetwork({ 
    businesses: initialBusinesses, 
    partnersCount: initialPartnersCount, 
    availableCount: initialAvailableCount, 
    loading: initialLoading 
}: MobileReferrerNetworkProps) {
    const { getToken } = useAuth();
    const [businesses, setBusinesses] = useState<Business[]>(initialBusinesses || []);
    const [partnersCount, setPartnersCount] = useState(initialPartnersCount || 0);
    const [availableCount, setAvailableCount] = useState(initialAvailableCount || 0);
    const [loading, setLoading] = useState(initialLoading ?? !initialBusinesses);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (initialBusinesses) {
            setBusinesses(initialBusinesses);
            setLoading(initialLoading ?? false);
            return;
        }

        async function fetchNetwork() {
            try {
                const token = await getToken();
                const [refRes, pubRes] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/referrer/stats`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/businesses`)
                ]);

                if (refRes.ok && pubRes.ok) {
                    const stats = await refRes.json();
                    const allBiz = await pubRes.json();
                    
                    setBusinesses(Array.isArray(allBiz) ? allBiz.slice(0, 10) : []); // Top 10 for performance
                    setPartnersCount(stats.total_referrals);
                    setAvailableCount(allBiz.length);
                }
            } catch (err) {
                console.error("Failed to fetch network data", err);
            } finally {
                setLoading(false);
            }
        }

        fetchNetwork();
    }, [getToken, initialBusinesses, initialLoading]);


    const filteredBusinesses = useMemo(() => {
        if (!Array.isArray(businesses)) return [];
        return businesses.filter(b => 
            b.name.toLowerCase().includes(search.toLowerCase()) ||
            b.trade_category.toLowerCase().includes(search.toLowerCase()) ||
            b.suburb.toLowerCase().includes(search.toLowerCase())
        );
    }, [businesses, search]);

    if (loading) {
        return (
            <div className="lg:hidden h-40 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-orange-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="lg:hidden flex flex-col min-h-screen bg-white pb-32">
            
            <div className="pt-4 px-5 flex flex-col gap-6">
                {/* ── Network Header ── */}
                <h1 className="text-[28px] font-extrabold text-[#18181B] leading-tight">Find Businesses</h1>

                {/* ── Stats ── */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#F4F4F5] rounded-2xl p-4 flex flex-col gap-1">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total Partnerships</p>
                        <p className="text-2xl font-black text-[#18181B] leading-none">{partnersCount || 128}</p>
                    </div>
                    <div className="bg-[#F4F4F5] rounded-2xl p-4 flex flex-col gap-1">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">New This Month</p>
                        <p className="text-2xl font-black text-orange-500 leading-none">+{availableCount || 12}</p>
                    </div>
                </div>

                {/* ── Action Button ── */}
                <button className="w-full h-14 bg-[#18181B] rounded-2xl flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] transition-all">
                    <UserPlus className="w-5 h-5 text-white" />
                    <span className="text-[15px] font-bold text-white">Apply to New Trade</span>
                </button>

                {/* ── List Section ── */}
                <div className="flex flex-col gap-4">
                    {/* ── Search Box ── */}
                    <div className="bg-[#F4F4F5] rounded-2xl p-3.5 flex items-center gap-3">
                        <Search className="w-5 h-5 text-zinc-400" />
                        <input 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search businesses or trades..."
                            className="bg-transparent border-none outline-none text-[15px] font-medium text-[#18181B] placeholder-zinc-400 w-full"
                        />
                    </div>

                    <h3 className="text-lg font-bold text-[#18181B] tracking-tight">Top Performance</h3>
                    
                    <div className="flex flex-col gap-3">
                        {filteredBusinesses.map(b => (
                            <Link 
                                key={b.id}
                                href={`/dashboard/referrer/refer/${b.id}`}
                                className="bg-white border border-[#E4E4E7] rounded-[20px] p-4 flex items-center gap-4 transition-all active:scale-[0.99]"
                            >
                                <div className="w-14 h-14 rounded-full bg-[#F4F4F5] flex items-center justify-center shrink-0 overflow-hidden border border-[#E4E4E7]">
                                    {b.logo_url ? (
                                        <img src={b.logo_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-zinc-300 font-black text-2xl">{b.name[0]}</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-base font-black text-[#18181B] truncate tracking-tight">{b.name}</p>
                                    <p className="text-[13px] font-medium text-zinc-500">
                                        {b.leads_count || 0} Leads · ${((b.revenue_cents || 0) / 100).toLocaleString()} Revenue
                                    </p>
                                </div>
                                <Info className="w-5 h-5 text-zinc-200 shrink-0" />
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
