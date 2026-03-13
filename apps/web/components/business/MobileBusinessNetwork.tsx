"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Loader2, Info, Users } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { BusinessInviteButton } from "@/components/business/BusinessInviteButton";

interface Referrer {
    referrer_id: string;
    full_name: string;
    leads_created: number;
    total_earned_cents: number;
    quality_score: number;
    is_active: boolean;
}

interface MobileBusinessNetworkProps {
    referrers?: Referrer[];
    stats?: {
        total_referrers: number;
        new_this_month: number;
    };
    loading?: boolean;
}

export function MobileBusinessNetwork({ 
    referrers: initialReferrers, 
    stats: initialStats,
    loading: initialLoading 
}: MobileBusinessNetworkProps) {
    const { getToken } = useAuth();
    const [referrers, setReferrers] = useState<Referrer[]>(initialReferrers || []);
    const [stats, setStats] = useState(initialStats || { total_referrers: 0, new_this_month: 0 });
    const [loading, setLoading] = useState(initialLoading ?? !initialReferrers);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (initialReferrers) return;

        async function fetchNetwork() {
            try {
                const token = await getToken();
                const res = await fetch(`/api/backend/business/me/referrers`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setReferrers(Array.isArray(data.referrers) ? data.referrers : []);
                    setStats({
                        total_referrers: data.summary?.total_referrers || 0,
                        new_this_month: data.summary?.new_this_month || 0
                    });
                }
            } catch (err) {
                console.error("Failed to fetch network data", err);
            } finally {
                setLoading(false);
            }
        }

        fetchNetwork();
    }, [getToken, initialReferrers]);

    const filteredReferrers = useMemo(() => {
        return referrers.filter(r => 
            r.full_name.toLowerCase().includes(search.toLowerCase())
        );
    }, [referrers, search]);

    if (loading) {
        return (
            <div className="lg:hidden h-40 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-orange-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="lg:hidden flex flex-col min-h-screen bg-white pb-32">
            
            {/* ── Padding for fixed shell header ── */}
            <div className="pt-4 px-5 flex flex-col gap-6">
                
                {/* ── Network Header ── */}
                <div className="flex flex-col gap-4">
                    <h1 className="text-[28px] font-extrabold text-[#18181B] leading-tight">Network</h1>
                </div>

                {/* ── Network Stats (Pencil: ByD4g) ── */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#F4F4F5] rounded-2xl p-4 flex flex-col gap-1">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total Referrers</p>
                        <p className="text-2xl font-black text-[#18181B] leading-none">{stats.total_referrers}</p>
                    </div>
                    <div className="bg-[#F4F4F5] rounded-2xl p-4 flex flex-col gap-1">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">New This Month</p>
                        <p className="text-2xl font-black text-orange-500 leading-none">+{stats.new_this_month}</p>
                    </div>
                </div>

                {/* ── Invite Button (Pencil: mRPBo) ── */}
                <div className="[&>button]:w-full [&>button]:h-14 [&>button]:rounded-2xl [&>button]:bg-[#18181B] [&>button]:border-0 [&>button]:text-white [&>button]:hover:bg-black [&>button]:justify-center [&>button]:text-[15px] [&>button]:font-bold [&>button]:shadow-lg [&>button]:shadow-black/10">
                    <BusinessInviteButton />
                </div>

                {/* ── Referrer List Area (Pencil: P52hZ) ── */}
                <div className="flex flex-col gap-4">
                    {/* ── Search Box ── */}
                    <div className="bg-[#F4F4F5] rounded-2xl p-3.5 flex items-center gap-3">
                        <Search className="w-5 h-5 text-zinc-400" />
                        <input 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search partners..."
                            className="bg-transparent border-none outline-none text-[15px] font-medium text-[#18181B] placeholder-zinc-400 w-full"
                        />
                    </div>

                    <h3 className="text-lg font-bold text-[#18181B] tracking-tight">Top Performance</h3>
                    
                    <div className="flex flex-col gap-3">
                        {filteredReferrers.length > 0 ? filteredReferrers.map(r => (
                            <Link 
                                key={r.referrer_id}
                                href={`/dashboard/business/referrers/${r.referrer_id}`}
                                className="bg-white border border-[#E4E4E7] rounded-[20px] p-4 flex items-center gap-4 transition-all active:scale-[0.99]"
                            >
                                <div className="w-14 h-14 rounded-full bg-[#F4F4F5] flex items-center justify-center shrink-0 overflow-hidden border border-[#E4E4E7]">
                                    <span className="text-zinc-300 font-black text-2xl">{r.full_name[0]}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-base font-black text-[#18181B] truncate tracking-tight">{r.full_name}</p>
                                    <p className="text-[13px] font-medium text-zinc-500">
                                        {r.leads_created || 0} Leads · ${(r.total_earned_cents / 100).toLocaleString()} Revenue
                                    </p>
                                </div>
                                <Info className="w-5 h-5 text-zinc-200 shrink-0" />
                            </Link>
                        )) : (
                            <div className="py-12 text-center bg-[#F4F4F5] rounded-[20px]">
                                <Users className="w-12 h-12 text-zinc-200 mx-auto mb-3" />
                                <p className="text-zinc-400 font-medium tracking-tight">No partners found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
