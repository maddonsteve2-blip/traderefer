"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Info, Loader2 } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

interface Lead {
    id: string;
    customer_name: string;
    business_name: string;
    trade_category: string;
    status: string;
    amount: number;
}

interface MobileReferrerLeadsProps {
    leads?: Lead[];
    loading?: boolean;
}

export function MobileReferrerLeads({ leads: initialLeads, loading: initialLoading }: MobileReferrerLeadsProps) {
    const { getToken } = useAuth();
    const [leads, setLeads] = useState<Lead[]>(initialLeads || []);
    const [loading, setLoading] = useState(initialLoading ?? !initialLeads);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"all" | "new" | "won">("all");

    useEffect(() => {
        if (initialLeads) {
            setLeads(initialLeads);
            setLoading(initialLoading ?? false);
            return;
        }

        async function fetchLeads() {
            try {
                const token = await getToken();
                const res = await fetch(`/api/backend/referrer/leads`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setLeads(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error("Failed to fetch leads", err);
            } finally {
                setLoading(false);
            }
        }

        fetchLeads();
    }, [getToken, initialLeads, initialLoading]);


    const filteredLeads = useMemo(() => {
        if (!Array.isArray(leads)) return [];
        return leads.filter(l => {
            const matchesSearch = 
                l.customer_name.toLowerCase().includes(search.toLowerCase()) ||
                l.business_name.toLowerCase().includes(search.toLowerCase()) ||
                l.trade_category.toLowerCase().includes(search.toLowerCase());
            
            const matchesFilter = 
                filter === "all" || 
                (filter === "new" && l.status.toLowerCase() === "new") ||
                (filter === "won" && l.status.toLowerCase() === "won");
            
            return matchesSearch && matchesFilter;
        });
    }, [leads, search, filter]);

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
                
                {/* ── Leads Header ── */}
                <div className="flex flex-col gap-4">
                    <h1 className="text-[28px] font-extrabold text-[#18181B] leading-tight">Leads</h1>
                    
                    {/* ── Search Box ── */}
                    <div className="bg-[#F4F4F5] rounded-2xl p-3.5 flex items-center gap-3">
                        <Search className="w-5 h-5 text-zinc-400" />
                        <input 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search leads..."
                            className="bg-transparent border-none outline-none text-[15px] font-medium text-[#18181B] placeholder-zinc-400 w-full"
                        />
                    </div>
                </div>

                {/* ── Filters (Pencil: Tbs6w) ── */}
                <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1">
                    <button 
                        onClick={() => setFilter("all")}
                        className={`px-6 py-3 rounded-xl text-[14px] font-bold transition-all ${filter === "all" ? "bg-orange-600 text-white" : "bg-[#F4F4F5] text-zinc-500"}`}
                    >
                        All
                    </button>
                    <button 
                        onClick={() => setFilter("new")}
                        className={`px-6 py-3 rounded-xl text-[14px] font-bold transition-all ${filter === "new" ? "bg-orange-600 text-white" : "bg-[#F4F4F5] text-zinc-500"}`}
                    >
                        New
                    </button>
                    <button 
                        onClick={() => setFilter("won")}
                        className={`px-6 py-3 rounded-xl text-[14px] font-bold transition-all ${filter === "won" ? "bg-orange-600 text-white" : "bg-[#F4F4F5] text-zinc-500"}`}
                    >
                        Won
                    </button>
                </div>

                {/* ── Leads List ── */}
                <div className="flex flex-col gap-3 pb-6">
                    {filteredLeads.length === 0 ? (
                        <div className="py-12 text-center text-zinc-400 font-medium bg-[#F4F4F5] rounded-3xl border border-dashed border-[#E4E4E7]">
                            No leads found.
                        </div>
                    ) : (
                        filteredLeads.map(l => (
                            <div key={l.id} className="bg-white border border-[#E4E4E7] rounded-[24px] p-5 flex flex-col gap-4 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <p className="text-[17px] font-black text-[#18181B] leading-none mb-1.5">{l.customer_name}</p>
                                        <p className="text-[13px] font-medium text-zinc-500">
                                            {l.trade_category} · {l.business_name}
                                        </p>
                                    </div>
                                    <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                        l.status.toLowerCase() === 'won' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                                    }`}>
                                        {l.status}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 pt-4 border-t border-[#F4F4F5]">
                                    <p className={`text-[15px] font-black ${l.status.toLowerCase() === 'won' ? 'text-emerald-500' : 'text-[#18181B]'}`}>
                                        ${l.amount.toFixed(2)} {l.status.toLowerCase() === 'won' ? 'Earned' : 'Potential'}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
